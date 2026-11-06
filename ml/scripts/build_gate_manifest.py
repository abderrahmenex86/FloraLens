#!/usr/bin/env python3
"""Build a plant / not-plant manifest for the presence gate.

Positives are plant photos, grouped by class folder so a folder never straddles
two splits. Negatives are non-plant images, split per file.

Example (run from the repository root):

    python ml/scripts/build_gate_manifest.py \
        --positives assets/images/plants \
        --negatives data/raw/coco/val2017 \
        --out data/processed/gate/manifest.jsonl
"""
from __future__ import annotations

import argparse
import hashlib
import random
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from floralens_ml.data.schema import ImageRecord, write_jsonl  # noqa: E402

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
PLANT_CLASS = 0
NOT_PLANT_CLASS = 1


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_size(path: Path) -> tuple[int, int]:
    with Image.open(path) as image:
        return image.width, image.height


def collect_images(root: Path) -> list[Path]:
    if not root.exists():
        raise SystemExit(f"missing directory: {root}")
    return sorted(
        path
        for path in root.rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def split_groups(groups: list[str], seed: int, val: float, test: float) -> dict[str, str]:
    shuffled = groups[:]
    random.Random(seed).shuffle(shuffled)
    val_count = round(len(shuffled) * val)
    test_count = round(len(shuffled) * test)
    assignment: dict[str, str] = {}
    for index, group in enumerate(shuffled):
        if index < val_count:
            assignment[group] = "val"
        elif index < val_count + test_count:
            assignment[group] = "test"
        else:
            assignment[group] = "train"
    return assignment


def positive_records(roots: list[Path], seed: int, val: float, test: float) -> list[ImageRecord]:
    by_group: dict[str, list[Path]] = {}
    for root in roots:
        for path in collect_images(root):
            group = f"{root.name}/{path.parent.name}" if path.parent != root else f"{root.name}/{path.stem}"
            by_group.setdefault(group, []).append(path)

    assignment = split_groups(sorted(by_group), seed, val, test)
    records: list[ImageRecord] = []

    for group, paths in sorted(by_group.items()):
        for path in paths:
            width, height = image_size(path)
            records.append(
                ImageRecord(
                    image_id=f"gate-pos-{sha256_file(path)[:16]}",
                    source="plant_reference",
                    source_id=str(path),
                    observation_id=group,
                    class_id=PLANT_CLASS,
                    path=str(path.resolve()),
                    sha256=sha256_file(path),
                    width=width,
                    height=height,
                    split=assignment[group],
                )
            )
    return records


def negative_records(
    roots: list[Path],
    limit: int | None,
    seed: int,
    val: float,
    test: float,
) -> list[ImageRecord]:
    paths: list[Path] = []
    for root in roots:
        paths.extend(collect_images(root))

    paths.sort()
    if limit is not None:
        random.Random(seed).shuffle(paths)
        paths = paths[:limit]

    assignment = split_groups([str(path) for path in paths], seed, val, test)
    records: list[ImageRecord] = []

    for path in paths:
        width, height = image_size(path)
        records.append(
            ImageRecord(
                image_id=f"gate-neg-{sha256_file(path)[:16]}",
                source="coco" if "coco" in str(path).lower() else "negative",
                source_id=str(path),
                observation_id=path.stem,
                class_id=NOT_PLANT_CLASS,
                path=str(path.resolve()),
                sha256=sha256_file(path),
                width=width,
                height=height,
                split=assignment[str(path)],
                is_negative=True,
            )
        )
    return records


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--positives",
        action="append",
        required=True,
        type=Path,
        help="plant image tree; repeatable, class folders are split as groups",
    )
    parser.add_argument(
        "--negatives",
        action="append",
        required=True,
        type=Path,
        help="non-plant image tree; repeatable",
    )
    parser.add_argument("--max-negatives", type=int, default=8000)
    parser.add_argument("--val", type=float, default=0.1)
    parser.add_argument("--test", type=float, default=0.1)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()

    positives = positive_records(args.positives, args.seed, args.val, args.test)
    negatives = negative_records(
        args.negatives, args.max_negatives, args.seed, args.val, args.test
    )
    records = positives + negatives

    for record in records:
        if not Path(record.path).exists():
            raise SystemExit(f"missing file referenced by manifest: {record.path}")

    count = write_jsonl(records, args.out)

    print(f"wrote {count} records to {args.out}")
    for split in ("train", "val", "test"):
        plants = sum(1 for r in records if r.split == split and r.class_id == PLANT_CLASS)
        others = sum(
            1 for r in records if r.split == split and r.class_id == NOT_PLANT_CLASS
        )
        print(f"  {split:5s} plant={plants:6d}  not_plant={others:6d}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
