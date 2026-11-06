#!/usr/bin/env python3
"""Turn GBIF media records into a training manifest with grouped splits.

Groups by GBIF occurrence id, so photos of the same plant never straddle
train/val/test. Drops unreadable and small images and removes exact duplicates.

    python ml/scripts/build_gbif_manifest.py \
        --media data/raw/gbif/media.jsonl \
        --out data/processed/garden/manifest.jsonl
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
from collections import Counter, defaultdict
from pathlib import Path

from PIL import Image


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--media", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--min-short-side", type=int, default=256)
    parser.add_argument("--val", type=float, default=0.15)
    parser.add_argument("--test", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    media = [json.loads(line) for line in args.media.read_text().splitlines() if line]

    groups: dict[str, list[dict]] = defaultdict(list)
    for record in media:
        groups[record["observation_id"]].append(record)

    group_ids = sorted(groups)
    random.Random(args.seed).shuffle(group_ids)
    val_count = round(len(group_ids) * args.val)
    test_count = round(len(group_ids) * args.test)
    split_of = {}
    for index, group in enumerate(group_ids):
        if index < val_count:
            split_of[group] = "val"
        elif index < val_count + test_count:
            split_of[group] = "test"
        else:
            split_of[group] = "train"

    seen_sha: set[str] = set()
    kept: list[dict] = []
    counts = Counter()
    dropped = Counter()

    for group in group_ids:
        for record in groups[group]:
            path = Path(record["path"])
            if not path.exists():
                dropped["missing"] += 1
                continue
            try:
                with Image.open(path) as image:
                    width, height = image.size
            except Exception:
                dropped["unreadable"] += 1
                continue
            if min(width, height) < args.min_short_side:
                dropped["too_small"] += 1
                continue

            digest = sha256_file(path)
            if digest in seen_sha:
                dropped["duplicate"] += 1
                continue
            seen_sha.add(digest)

            payload = {
                "image_id": f"gbif-{record['gbif_id']}-{path.stem}",
                "source": "gbif",
                "source_id": str(record["gbif_id"]),
                "observation_id": record["observation_id"],
                "class_id": int(record["class_id"]),
                "path": str(path.resolve()),
                "sha256": digest,
                "width": width,
                "height": height,
                "scientific_name": record.get("scientific_name"),
                "license": record.get("license"),
                "author": record.get("author"),
                "url": record.get("source_url"),
                "split": split_of[group],
            }
            kept.append(payload)
            counts[payload["class_id"]] += 1

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        for payload in kept:
            fh.write(json.dumps(payload, ensure_ascii=False))
            fh.write("\n")

    by_split = Counter(payload["split"] for payload in kept)
    print(f"kept {len(kept)} images across {len(counts)} classes")
    print("splits:", dict(by_split))
    print("per class min/median/max:", min(counts.values()), sorted(counts.values())[len(counts)//2], max(counts.values()))
    print("dropped:", dict(dropped))
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
