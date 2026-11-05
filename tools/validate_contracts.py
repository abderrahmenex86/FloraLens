#!/usr/bin/env python3
"""Validate a model contract against the shared class list and files.

Run with the ML environment so the class-list hash matches training:

    uv run --project ml python tools/validate_contracts.py \
      --contract ml/exports/plants/contract.json \
      --classes shared/classes/plants.yaml
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "ml" / "src"))

from floralens_ml.taxonomy import load_class_list


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        while chunk := fh.read(1 << 20):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--contract", required=True)
    parser.add_argument("--classes", required=True)
    parser.add_argument("--model-dir", default=None)
    args = parser.parse_args()

    contract = json.loads(Path(args.contract).read_text(encoding="utf-8"))
    class_list = load_class_list(args.classes)
    expected_hash = class_list.sha256()
    class_ids = class_list.index_to_class_id
    errors: list[str] = []

    if contract.get("classes_sha256") != expected_hash:
        errors.append("classes_sha256 does not match the class list")
    if contract.get("class_ids") != class_ids:
        errors.append("class_ids do not match the class list")
    if contract.get("class_count") != len(class_ids):
        errors.append("class_count does not match the class list")
    if contract["input"]["shape"][1] != 3:
        errors.append("input must have 3 channels")
    if contract["output"]["shape"][1] != len(class_ids):
        errors.append("output classes do not match the class list")

    model_dir = Path(args.model_dir) if args.model_dir else Path(args.contract).parent
    for name, info in contract.get("files", {}).items():
        path = model_dir / name
        if not path.exists():
            errors.append(f"missing model file: {path}")
            continue
        if sha256_file(path) != info.get("sha256"):
            errors.append(f"checksum mismatch: {path}")
        if path.stat().st_size != info.get("bytes"):
            errors.append(f"size mismatch: {path}")

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    print("contract OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
