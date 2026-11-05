#!/usr/bin/env python3
"""Build the optional reference-image pack.

Input layout (one folder per class):

    images/
      0_bougainvillea/
        *.jpg
      1_cestrum_nocturnum/
        *.jpg

Output:

    pack/
      thumbs/<class_id>/<name>.webp   # 400 px
      full/<class_id>/<name>.webp     # 1000 px
      manifest.json
"""

from __future__ import annotations

import argparse
import csv
import json
import time
from pathlib import Path

from PIL import Image, ImageOps

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--version", default="2026.11")
    parser.add_argument("--thumb-width", type=int, default=400)
    parser.add_argument("--full-width", type=int, default=1000)
    parser.add_argument("--quality", type=int, default=80)
    parser.add_argument(
        "--metadata",
        help="optional CSV with columns class_id,license,author,source_url",
    )
    return parser.parse_args()


def load_metadata(path: str | None) -> dict[int, dict[str, str]]:
    if not path:
        return {}
    result: dict[int, dict[str, str]] = {}
    with open(path, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            try:
                result[int(row["class_id"])] = row
            except (KeyError, ValueError):
                continue
    return result


def write_webp(source: Path, destination: Path, width: int, quality: int) -> tuple[int, int]:
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        if image.width > width:
            height = round(image.height * width / image.width)
            image = image.resize((width, height), Image.Resampling.LANCZOS)
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, "WEBP", quality=quality, method=6)
        return image.size


def main() -> int:
    args = parse_args()
    root = Path(args.root)
    out = Path(args.out)
    metadata = load_metadata(args.metadata)
    images: list[dict[str, object]] = []
    for folder in sorted(root.iterdir()):
        if not folder.is_dir():
            continue
        try:
            class_id = int(folder.name.split("_", 1)[0])
        except ValueError:
            continue
        for source in sorted(folder.rglob("*")):
            if not source.is_file() or source.suffix.lower() not in IMAGE_SUFFIXES:
                continue
            stem = source.stem
            thumb = out / "thumbs" / str(class_id) / f"{stem}.webp"
            full = out / "full" / str(class_id) / f"{stem}.webp"
            thumb_size = write_webp(source, thumb, args.thumb_width, args.quality)
            full_size = write_webp(source, full, args.full_width, args.quality)
            meta = metadata.get(class_id, {})
            images.append(
                {
                    "class_id": class_id,
                    "source": str(source.relative_to(root)),
                    "thumb": str(thumb.relative_to(out)),
                    "full": str(full.relative_to(out)),
                    "thumb_width": thumb_size[0],
                    "thumb_height": thumb_size[1],
                    "full_width": full_size[0],
                    "full_height": full_size[1],
                    "bytes": thumb.stat().st_size + full.stat().st_size,
                    "license": meta.get("license"),
                    "author": meta.get("author"),
                    "source_url": meta.get("source_url"),
                }
            )
    manifest = {
        "version": args.version,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "thumb_width": args.thumb_width,
        "full_width": args.full_width,
        "quality": args.quality,
        "image_count": len(images),
        "bytes": sum(int(item["bytes"]) for item in images),
        "images": images,
    }
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: manifest[key] for key in ("image_count", "bytes", "version")}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
