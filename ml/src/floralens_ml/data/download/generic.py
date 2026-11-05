from __future__ import annotations

import re
from collections.abc import Iterable
from pathlib import Path

from PIL import Image, ImageOps

from floralens_ml.config import load_yaml, sha256_file
from floralens_ml.data.schema import ImageRecord

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def find_images(root: str | Path) -> Iterable[Path]:
    root = Path(root)
    for path in sorted(root.rglob("*")):
        if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES:
            yield path


def _observation_id(path: Path, group_by: str, regex: str | None) -> str:
    if regex:
        match = re.search(regex, path.stem)
        if match:
            return match.group(0)
    if group_by == "filename":
        return path.stem
    if group_by == "grandparent":
        return path.parent.parent.name
    return path.parent.name


def import_folder(
    root: str | Path,
    mapping_path: str | Path,
    *,
    source: str = "own",
    group_by: str = "parent",
    observation_regex: str | None = None,
    license: str | None = None,
    author: str | None = None,
) -> list[ImageRecord]:
    """Import a folder tree where each class lives in a named folder.

    ``mapping.yaml`` is a flat mapping of folder name to stable class id::

        mapping:
          bougainvillea: 0
          cestrum_nocturnum: 1
    """
    raw = load_yaml(mapping_path)
    mapping = {str(key): int(value) for key, value in raw.get("mapping", {}).items()}
    if not mapping:
        raise ValueError(f"{mapping_path} has no 'mapping' entries")

    records: list[ImageRecord] = []
    for path in find_images(root):
        class_key = path.parent.name
        if class_key not in mapping and path.parent.parent.name in mapping:
            class_key = path.parent.parent.name
        if class_key not in mapping:
            continue
        class_id = mapping[class_key]
        try:
            with Image.open(path) as image:
                width, height = ImageOps.exif_transpose(image).size
        except Exception:
            continue
        observation_id = _observation_id(path, group_by, observation_regex)
        records.append(
            ImageRecord(
                image_id=f"{source}:{class_key}:{path.stem}",
                source=source,
                source_id=path.stem,
                observation_id=f"{source}:{class_key}:{observation_id}",
                class_id=class_id,
                path=str(path),
                sha256=sha256_file(path),
                width=width,
                height=height,
                license=license,
                author=author,
            )
        )
    return records
