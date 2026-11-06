#!/usr/bin/env python3
"""Extract Pl@ntNet parquet shards (Hugging Face mirror) into the image layout.

The mirror stores `image: struct<bytes, path>` and `label: int64`, sharded by
split in the filename. This writes `<split>/<species_id:04d>/<hash>.jpg`, which
is the layout `build_plantnet_manifest.py` expects.

    python ml/scripts/extract_plantnet_parquet.py \
        --parquet data/raw/plantnet/parquet \
        --out data/raw/plantnet/images
"""
from __future__ import annotations

import argparse
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pyarrow.parquet as pq


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--parquet", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    shards = sorted(args.parquet.glob("*.parquet"))
    if not shards:
        raise SystemExit(f"no parquet shards in {args.parquet}")

    written = 0
    failed = 0

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for shard in shards:
            split = shard.name.split("-")[0]
            if split == "validation":
                split = "val"
            if split not in {"train", "val", "test"}:
                raise SystemExit(f"unexpected shard name: {shard.name}")

            parquet = pq.ParquetFile(shard)
            futures = []

            for batch in parquet.iter_batches(batch_size=512, columns=["image", "label"]):
                for row in batch.to_pylist():
                    image = row["image"]
                    label = int(row["label"])
                    target = args.out / split / f"{label:04d}" / image["path"]

                    if target.exists():
                        continue
                    target.parent.mkdir(parents=True, exist_ok=True)
                    futures.append(
                        pool.submit(target.write_bytes, image["bytes"])
                    )

                if len(futures) >= 4096:
                    for future in futures:
                        try:
                            future.result()
                            written += 1
                        except OSError:
                            failed += 1
                    futures.clear()
                    print(f"{shard.name}: wrote {written} so far", flush=True)

            for future in futures:
                try:
                    future.result()
                    written += 1
                except OSError:
                    failed += 1
            print(f"{shard.name}: done, total {written}", flush=True)

    print(f"wrote {written} images, {failed} failures", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
