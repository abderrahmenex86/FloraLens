#!/usr/bin/env python3
"""Combine the Pl@ntNet species manifest with GBIF garden taxa.

Garden taxa that already exist in Pl@ntNet are merged into that class instead of
getting a duplicate label. The rest are appended after the Pl@ntNet ids.

    python ml/scripts/combine_plantnet_garden.py \
        --plantnet-manifest data/processed/plantnet/manifest_1000.jsonl \
        --plantnet-classes shared/classes/plantnet_1000.yaml \
        --garden-manifest data/processed/garden/manifest.jsonl \
        --garden-classes shared/classes/plants.yaml \
        --out-manifest data/processed/combined/manifest.jsonl \
        --out-classes shared/classes/plants_1024.yaml
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import yaml


def normalise(name: str) -> str:
    return " ".join(name.replace("\u00d7", "").lower().split())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plantnet-manifest", required=True, type=Path)
    parser.add_argument("--plantnet-classes", required=True, type=Path)
    parser.add_argument("--garden-manifest", required=True, type=Path)
    parser.add_argument("--garden-classes", required=True, type=Path)
    parser.add_argument("--out-manifest", required=True, type=Path)
    parser.add_argument("--out-classes", required=True, type=Path)
    args = parser.parse_args()

    plantnet_spec = yaml.safe_load(args.plantnet_classes.read_text())
    garden_spec = yaml.safe_load(args.garden_classes.read_text())

    plantnet_classes = plantnet_spec["classes"]
    garden_classes = garden_spec["classes"]
    by_name = {
        normalise(entry["scientific_name"]): entry["class_id"]
        for entry in plantnet_classes
    }

    # Map each garden class either onto an existing Pl@ntNet class or a new id.
    next_id = max(entry["class_id"] for entry in plantnet_classes) + 1
    remap: dict[int, int] = {}
    appended: list[dict] = []
    for entry in garden_classes:
        key = normalise(entry["scientific_name"])
        if key in by_name:
            remap[entry["class_id"]] = by_name[key]
            continue
        remap[entry["class_id"]] = next_id
        appended.append(
            {
                "class_id": next_id,
                "scientific_name": entry["scientific_name"],
                "common_name": entry.get("common_name"),
                "rank": entry.get("rank", "species"),
                "family": entry.get("family"),
                "genus": entry.get("genus"),
                "sources": entry.get("sources") or ["gbif"],
                "status": "active",
            }
        )
        next_id += 1

    records: list[dict] = []
    with open(args.plantnet_manifest, encoding="utf-8") as fh:
        for line in fh:
            if line.strip():
                records.append(json.loads(line))

    merged_garden = 0
    with open(args.garden_manifest, encoding="utf-8") as fh:
        for line in fh:
            if not line.strip():
                continue
            payload = json.loads(line)
            payload["class_id"] = remap[int(payload["class_id"])]
            payload["source"] = "gbif"
            records.append(payload)
            merged_garden += 1

    args.out_manifest.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        for payload in records:
            fh.write(json.dumps(payload, ensure_ascii=False))
            fh.write("\n")

    args.out_classes.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out_classes, "w", encoding="utf-8") as fh:
        yaml.safe_dump(
            {
                "version": "2026.11-plants-1024",
                "target": "plants",
                "classes": plantnet_classes + appended,
            },
            fh,
            sort_keys=False,
            allow_unicode=True,
        )

    total_classes = len(plantnet_classes) + len(appended)
    from collections import Counter

    splits = Counter(record["split"] for record in records)
    print(f"classes: {total_classes} ({len(appended)} added from GBIF)")
    print(f"images: {len(records)}  garden merged: {merged_garden}")
    print("splits:", dict(splits))
    print(f"wrote {args.out_manifest}")
    print(f"wrote {args.out_classes}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
