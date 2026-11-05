#!/usr/bin/env python3
"""Convert a shared class-list YAML into the JSON the app bundles.

Run with the ML environment so the canonical hash matches the training export:

    uv run --project ml python tools/export_class_list.py \
      --classes shared/classes/plants.yaml \
      --out shared/classes/plants.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from floralens_ml.taxonomy import load_class_list


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--classes", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    class_list = load_class_list(args.classes)
    classes = sorted(class_list.classes, key=lambda entry: entry.class_id)
    payload = {
        "version": class_list.version,
        "target": class_list.target,
        "sha256": class_list.sha256(),
        "class_ids": [entry.class_id for entry in classes],
        "classes": [
            {
                "class_id": entry.class_id,
                "scientific_name": entry.scientific_name,
                "common_name": entry.common_name,
                "rank": entry.rank,
                "taxon_id": entry.taxon_id,
                "family": entry.family,
                "genus": entry.genus,
                "role": entry.role,
                "kind": entry.kind,
                "life_stage": entry.life_stage,
                "symptoms": entry.symptoms,
            }
            for entry in classes
        ],
    }
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {args.out} ({len(classes)} classes, sha256 {payload['sha256']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
