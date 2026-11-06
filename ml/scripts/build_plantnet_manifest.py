#!/usr/bin/env python3
"""Build a Pl@ntNet-300K manifest and class list for a training screen.

Selects species with enough images, remaps their ids to a dense 0..N-1 range,
caps the long tail of common species, and writes the class-list YAML the trainer
expects.

    python ml/scripts/build_plantnet_manifest.py \
        --images data/raw/plantnet/images \
        --metadata data/raw/plantnet/plantnet300K_metadata.csv \
        --species data/raw/plantnet/species_metadata.csv \
        --min-images 80 --max-per-class 400 \
        --out data/processed/plantnet/manifest.jsonl \
        --class-list shared/classes/plantnet_screen.yaml
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import random
from collections import Counter, defaultdict
from pathlib import Path

import yaml
from PIL import Image

SPLITS = ("train", "val", "test")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--images", required=True, type=Path)
    parser.add_argument("--metadata", required=True, type=Path)
    parser.add_argument("--species", required=True, type=Path)
    parser.add_argument("--min-images", type=int, default=80)
    parser.add_argument("--max-classes", type=int, default=None)
    parser.add_argument("--max-per-class", type=int, default=400)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--class-list", required=True, type=Path)
    args = parser.parse_args()

    with open(args.species, newline="", encoding="utf-8") as fh:
        species_meta = {
            int(row["species_id"]): row for row in csv.DictReader(fh)
        }

    rows_by_species: dict[int, list[dict[str, str]]] = defaultdict(list)
    with open(args.metadata, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            rows_by_species[int(row["species_id"])].append(row)

    counts = {sid: len(rows) for sid, rows in rows_by_species.items()}
    selected = [sid for sid, count in counts.items() if count >= args.min_images]
    selected.sort(key=lambda sid: (-counts[sid], sid))
    if args.max_classes:
        selected = selected[: args.max_classes]
    selected.sort()

    class_ids = {sid: index for index, sid in enumerate(selected)}
    rng = random.Random(args.seed)

    records: list[str] = []
    kept: Counter[int] = Counter()
    missing = 0

    for species_id in selected:
        rows = rows_by_species[species_id][:]
        rng.shuffle(rows)
        rows = rows[: args.max_per_class]
        info = species_meta[species_id]
        class_id = class_ids[species_id]

        for row in rows:
            split = row["split"]
            if split not in SPLITS:
                continue
            path = (
                args.images
                / split
                / f"{species_id:04d}"
                / f"{row['PN_hash']}.jpg"
            )
            if not path.exists():
                missing += 1
                continue

            with Image.open(path) as image:
                width, height = image.size

            record = {
                "image_id": f"pn-{row['PN_hash']}",
                "source": "plantnet300k",
                "source_id": row["PN_hash"],
                "observation_id": row["PN_observation_id"],
                "class_id": class_id,
                "path": str(path.resolve()),
                "sha256": sha256_file(path),
                "width": width,
                "height": height,
                "organ": row.get("organ") or None,
                "license": row.get("license") or None,
                "author": row.get("author") or None,
                "scientific_name": info["species"],
                "family": info.get("family") or None,
                "split": split,
                "source_split": split,
            }
            records.append(
                json.dumps(
                    {key: value for key, value in record.items() if value is not None},
                    ensure_ascii=False,
                )
            )
            kept[class_id] += 1

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write("\n".join(records))
        fh.write("\n")

    class_entries = []
    for species_id in selected:
        info = species_meta[species_id]
        class_entries.append(
            {
                "class_id": class_ids[species_id],
                "scientific_name": info["species"],
                "common_name": info["species"],
                "rank": "species",
                "family": info.get("family") or None,
                "genus": info.get("genus") or None,
                "sources": ["plantnet300k"],
                "status": "active",
            }
        )

    args.class_list.parent.mkdir(parents=True, exist_ok=True)
    with open(args.class_list, "w", encoding="utf-8") as fh:
        yaml.safe_dump(
            {
                "version": "2026.11-plantnet-screen",
                "target": "plants",
                "classes": class_entries,
            },
            fh,
            sort_keys=False,
            allow_unicode=True,
        )

    by_split = Counter()
    for line in records:
        payload = json.loads(line)
        by_split[payload["split"]] += 1

    print(f"classes: {len(selected)}  images: {len(records)}  missing: {missing}")
    print("splits:", dict(by_split))
    print("min/max images per class:", min(kept.values()), max(kept.values()))
    print(f"wrote {args.out}")
    print(f"wrote {args.class_list}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
