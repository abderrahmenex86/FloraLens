#!/usr/bin/env python3
"""Resize a manifest's images into a small cache for faster training.

Decoding multi-megabyte originals was starving the GPU. The cache keeps the
shorter side at 256px, which is enough for RandomResizedCrop(224) and cuts
decode cost by an order of magnitude.

    python ml/scripts/build_image_cache.py \
        --manifest data/processed/combined/manifest.jsonl \
        --out-dir data/cache/combined_256 \
        --out-manifest data/processed/combined/manifest_256.jsonl
"""
from __future__ import annotations

import argparse
import json
import multiprocessing as mp
from pathlib import Path

from PIL import Image, ImageOps


def _resize(job: tuple[str, str, int]) -> tuple[str, str, int, int, bool]:
    source, target, short_side = job
    try:
        with Image.open(source) as opened:
            image = ImageOps.exif_transpose(opened).convert("RGB")
        scale = short_side / min(image.width, image.height)
        if scale < 1:
            image = image.resize(
                (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
                Image.BILINEAR,
            )
        Path(target).parent.mkdir(parents=True, exist_ok=True)
        image.save(target, "JPEG", quality=90, optimize=False)
        return source, target, image.width, image.height, True
    except Exception:
        return source, target, 0, 0, False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    parser.add_argument("--out-manifest", required=True, type=Path)
    parser.add_argument("--short-side", type=int, default=256)
    parser.add_argument("--workers", type=int, default=16)
    args = parser.parse_args()

    records = [
        json.loads(line) for line in args.manifest.read_text().splitlines() if line
    ]
    jobs: list[tuple[str, str, int]] = []
    for record in records:
        target = args.out_dir / record["sha256"][:2] / f"{record['sha256']}.jpg"
        record["cache_path"] = str(target)
        jobs.append((record["path"], str(target), args.short_side))

    done = 0
    failed = 0
    sizes: dict[str, tuple[int, int]] = {}
    with mp.Pool(args.workers) as pool:
        for source, target, width, height, ok in pool.imap_unordered(
            _resize, jobs, chunksize=64
        ):
            done += 1
            if ok:
                sizes[target] = (width, height)
            else:
                failed += 1
            if done % 10000 == 0:
                print(f"{done}/{len(jobs)} ({failed} failed)", flush=True)

    args.out_manifest.parent.mkdir(parents=True, exist_ok=True)
    written = 0
    with open(args.out_manifest, "w", encoding="utf-8") as fh:
        for record in records:
            cache_path = record.pop("cache_path")
            if cache_path not in sizes:
                continue
            width, height = sizes[cache_path]
            record["path"] = cache_path
            record["width"] = width
            record["height"] = height
            fh.write(json.dumps(record, ensure_ascii=False))
            fh.write("\n")
            written += 1

    print(f"cached {written} images, {failed} failed")
    print(f"wrote {args.out_manifest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
