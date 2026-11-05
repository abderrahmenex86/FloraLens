#!/usr/bin/env python3
"""Validate a model contract against the shared class list and files."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import yaml


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        while chunk := fh.read(1 << 20):
            digest.update(chunk)
    return digest.hexdigest()


def class_list_hash(path: Path) -> tuple[str, list[int]]:
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    classes = raw["classes"]
    class_ids = sorted(entry["class_id"] for entry in classes)
    canonical = json.dumps(raw, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical.encode()).hexdigest(), class_ids


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--contract", required=True)
    parser.add_argument("--classes", required=True)
    parser.add_argument("--model-dir", default=None)
    args = parser.parse_args()

    contract = json.loads(Path(args.contract).read_text(encoding="utf-8"))
    expected_hash, class_ids = class_list_hash(Path(args.classes))
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
