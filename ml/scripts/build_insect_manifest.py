#!/usr/bin/env python3
"""Build the garden-insect manifest: GBIF insects plus "no insect" negatives.

Insects are split by GBIF occurrence so photos of the same specimen stay
together. Negatives are plant photos without insects, sampled from an existing
plant manifest and labelled with the `no_insect` class.

    python ml/scripts/build_insect_manifest.py \
        --media data/raw/gbif_insects/media.jsonl \
        --plant-manifest data/processed/combined/manifest.jsonl \
        --negative-class 22 \
        --out data/processed/insects/manifest.jsonl
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
from collections import Counter, defaultdict
from pathlib import Path

from PIL import Image

NO_INSECT_CLASS = 22


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--media", required=True, type=Path)
    parser.add_argument("--plant-manifest", required=True, type=Path)
    parser.add_argument("--negative-class", type=int, default=NO_INSECT_CLASS)
    parser.add_argument("--negatives", type=int, default=3000)
    parser.add_argument("--min-short-side", type=int, default=256)
    parser.add_argument("--val", type=float, default=0.15)
    parser.add_argument("--test", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()

    media = [json.loads(line) for line in args.media.read_text().splitlines() if line]

    groups: dict[str, list[dict]] = defaultdict(list)
    for record in media:
        groups[record["observation_id"]].append(record)

    group_ids = sorted(groups)
    random.Random(args.seed).shuffle(group_ids)
    val_count = round(len(group_ids) * args.val)
    test_count = round(len(group_ids) * args.test)
    split_of: dict[str, str] = {}
    for index, group in enumerate(group_ids):
        if index < val_count:
            split_of[group] = "val"
        elif index < val_count + test_count:
            split_of[group] = "test"
        else:
            split_of[group] = "train"

    seen_sha: set[str] = set()
    kept: list[dict] = []
    dropped = Counter()

    def add(record: dict) -> None:
        path = Path(record["path"])
        if not path.exists():
            dropped["missing"] += 1
            return
        try:
            with Image.open(path) as image:
                width, height = image.size
        except Exception:
            dropped["unreadable"] += 1
            return
        if min(width, height) < args.min_short_side:
            dropped["too_small"] += 1
            return
        digest = sha256_file(path)
        if digest in seen_sha:
            dropped["duplicate"] += 1
            return
        seen_sha.add(digest)
        record.update({"sha256": digest, "width": width, "height": height})
        kept.append(record)

    for group in group_ids:
        for record in groups[group]:
            add(
                {
                    "image_id": f"gbif-{record['gbif_id']}-{Path(record['path']).stem}",
                    "source": "gbif",
                    "source_id": str(record["gbif_id"]),
                    "observation_id": record["observation_id"],
                    "class_id": int(record["class_id"]),
                    "path": str(Path(record["path"]).resolve()),
                    "scientific_name": record.get("scientific_name"),
                    "license": record.get("license"),
                    "author": record.get("author"),
                    "url": record.get("source_url"),
                    "split": split_of[group],
                }
            )

    plants = [
        json.loads(line)
        for line in args.plant_manifest.read_text().splitlines()
        if line
    ]
    rng = random.Random(args.seed + 1)
    rng.shuffle(plants)
    per_split = args.negatives // 3
    taken: Counter[str] = Counter()
    for plant in plants:
        split = plant["split"]
        if taken[split] >= per_split:
            continue
        taken[split] += 1
        add(
            {
                "image_id": "neg-" + plant["sha256"][:20],
                "source": "plant_negative",
                "source_id": plant["image_id"],
                "observation_id": plant.get("observation_id") or plant["image_id"],
                "class_id": args.negative_class,
                "path": plant["path"],
                "scientific_name": plant.get("scientific_name"),
                "split": split,
            }
        )
        if sum(taken.values()) >= args.negatives:
            break

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        for record in kept:
            fh.write(json.dumps(record, ensure_ascii=False))
            fh.write("\n")

    by_split = Counter(record["split"] for record in kept)
    by_class = Counter(record["class_id"] for record in kept)
    print(f"kept {len(kept)} images across {len(by_class)} classes")
    print("splits:", dict(by_split))
    print("dropped:", dict(dropped))
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
