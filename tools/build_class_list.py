#!/usr/bin/env python3
"""Build a PlantNet-300K candidate class list.

This is deliberately a helper, not an automatic decision. It appends the most
frequent Pl@ntNet species (above ``--min-images``) to a hand-curated seed list.
Review the output before training: Pl@ntNet is mostly European wild flora and
will not contain most tropical garden/houseplant anchors.
"""

from __future__ import annotations

import argparse
import csv
import re
from collections import Counter
from pathlib import Path

import yaml


def normalize(name: str) -> str:
    name = name.lower().replace("×", "x")
    name = re.sub(r"[^a-z0-9 ]", " ", name)
    return re.sub(r"\s+", " ", name).strip()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--species-metadata", required=True)
    parser.add_argument("--image-metadata", required=True)
    parser.add_argument("--seed", default="shared/classes/plants.yaml")
    parser.add_argument("--out", required=True)
    parser.add_argument("--target", type=int, default=600)
    parser.add_argument("--min-images", type=int, default=80)
    args = parser.parse_args()

    seed = yaml.safe_load(Path(args.seed).read_text(encoding="utf-8"))
    seed_classes = seed.get("classes", [])
    seed_names = {normalize(entry["scientific_name"]) for entry in seed_classes}
    next_id = max((int(entry["class_id"]) for entry in seed_classes), default=-1) + 1

    counts: Counter[int] = Counter()
    with open(args.image_metadata, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            try:
                counts[int(row["species_id"])] += 1
            except (KeyError, ValueError):
                continue

    species: dict[int, dict[str, str]] = {}
    with open(args.species_metadata, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            try:
                species[int(row["species_id"])] = row
            except (KeyError, ValueError):
                continue

    candidates = []
    for species_id, count in counts.items():
        if count < args.min_images:
            continue
        row = species.get(species_id)
        if not row:
            continue
        name = row.get("species") or row.get("full_species") or ""
        if not name or normalize(name) in seed_names:
            continue
        candidates.append((count, species_id, row))
    candidates.sort(key=lambda item: (-item[0], item[1]))

    remaining = max(0, args.target - len(seed_classes))
    selected = candidates[:remaining]
    classes = list(seed_classes)
    for count, species_id, row in selected:
        classes.append(
            {
                "class_id": next_id,
                "scientific_name": row.get("species") or row.get("full_species"),
                "rank": "species",
                "family": row.get("family"),
                "genus": row.get("genus"),
                "status": "candidate",
                "sources": ["plantnet"],
                "notes": f"plantnet_species_id={species_id}; images={count}",
            }
        )
        next_id += 1

    output = {
        "version": f"{seed.get('version', '2026.11')}-plantnet-candidates",
        "target": "plants",
        "classes": classes,
    }
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(
        yaml.safe_dump(output, sort_keys=False, allow_unicode=True), encoding="utf-8"
    )
    print(
        f"seed={len(seed_classes)} candidates_available={len(candidates)} "
        f"selected={len(selected)} total={len(classes)} out={args.out}"
    )
    if selected:
        print(f"min selected count={selected[-1][0]} max={selected[0][0]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
