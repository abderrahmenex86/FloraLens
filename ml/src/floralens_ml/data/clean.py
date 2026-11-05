from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

from floralens_ml.data.schema import ImageRecord


def ahash(path: str | Path, hash_size: int = 8) -> int:
    """Average hash. Small, dependency-free perceptual hash."""
    with Image.open(path) as opened:
        image = ImageOps.exif_transpose(opened).convert("L").resize(
            (hash_size, hash_size), Image.Resampling.LANCZOS
        )
        pixels = np.asarray(image, dtype=np.float32)
    bits = pixels > pixels.mean()
    value = 0
    for bit in bits.flatten():
        value = (value << 1) | int(bit)
    return value


def hamming(a: int, b: int) -> int:
    return (a ^ b).bit_count()


def blur_score(path: str | Path) -> float:
    """Variance of the Laplacian; low values are blurry."""
    with Image.open(path) as image:
        gray = np.asarray(
            ImageOps.exif_transpose(image).convert("L"), dtype=np.float32
        )
    if gray.shape[0] < 3 or gray.shape[1] < 3:
        return 0.0
    laplacian = (
        -4 * gray[1:-1, 1:-1]
        + gray[:-2, 1:-1]
        + gray[2:, 1:-1]
        + gray[1:-1, :-2]
        + gray[1:-1, 2:]
    )
    return float(laplacian.var())


@dataclass
class CleanReport:
    total: int = 0
    kept: int = 0
    exact_duplicates: int = 0
    perceptual_duplicates: int = 0
    too_small: int = 0
    blurry: int = 0
    bad_exposure: int = 0
    missing: int = 0
    kept_by_class: dict[int, int] = field(default_factory=dict)
    dropped_by_class: dict[int, int] = field(default_factory=dict)

    def as_dict(self) -> dict[str, object]:
        return {
            "total": self.total,
            "kept": self.kept,
            "exact_duplicates": self.exact_duplicates,
            "perceptual_duplicates": self.perceptual_duplicates,
            "too_small": self.too_small,
            "blurry": self.blurry,
            "bad_exposure": self.bad_exposure,
            "missing": self.missing,
            "kept_by_class": dict(sorted(self.kept_by_class.items())),
            "dropped_by_class": dict(sorted(self.dropped_by_class.items())),
        }


def dedupe_records(
    records: Iterable[ImageRecord],
    *,
    hash_threshold: int = 5,
    per_class: bool = True,
    compute_hash: bool = True,
) -> tuple[list[ImageRecord], list[ImageRecord], CleanReport]:
    report = CleanReport()
    kept: list[ImageRecord] = []
    dropped: list[ImageRecord] = []
    seen_sha: set[str] = set()
    seen_phash: dict[int | None, list[int]] = defaultdict(list)

    for record in sorted(records, key=lambda item: item.image_id):
        report.total += 1
        if record.sha256 in seen_sha:
            report.exact_duplicates += 1
            dropped.append(record)
            continue
        seen_sha.add(record.sha256)

        if compute_hash and hash_threshold >= 0 and Path(record.path).exists():
            try:
                phash = ahash(record.path)
            except Exception:
                phash = None
            if phash is not None:
                bucket = record.class_id if per_class else None
                if any(hamming(phash, other) <= hash_threshold for other in seen_phash[bucket]):
                    report.perceptual_duplicates += 1
                    dropped.append(record)
                    continue
                seen_phash[bucket].append(phash)

        kept.append(record)
        report.kept_by_class[record.class_id] = report.kept_by_class.get(record.class_id, 0) + 1

    for record in dropped:
        report.dropped_by_class[record.class_id] = (
            report.dropped_by_class.get(record.class_id, 0) + 1
        )
    report.kept = len(kept)
    return kept, dropped, report


def quality_filter(
    records: Iterable[ImageRecord],
    *,
    min_short_side: int = 256,
    min_blur: float = 20.0,
    min_brightness: float = 8.0,
    max_brightness: float = 247.0,
) -> tuple[list[ImageRecord], list[ImageRecord], CleanReport]:
    report = CleanReport()
    kept: list[ImageRecord] = []
    dropped: list[ImageRecord] = []

    for record in records:
        report.total += 1
        path = Path(record.path)
        if not path.exists():
            report.missing += 1
            dropped.append(record)
            continue
        try:
            with Image.open(path) as opened:
                image = ImageOps.exif_transpose(opened)
                width, height = image.size
                gray = np.asarray(image.convert("L"), dtype=np.float32)
                brightness = float(gray.mean())
        except Exception:
            report.missing += 1
            dropped.append(record)
            continue

        if min(width, height) < min_short_side:
            report.too_small += 1
            dropped.append(record)
            continue
        if blur_score(path) < min_blur:
            report.blurry += 1
            dropped.append(record)
            continue
        if not (min_brightness <= brightness <= max_brightness):
            report.bad_exposure += 1
            dropped.append(record)
            continue

        kept.append(record)
        report.kept_by_class[record.class_id] = report.kept_by_class.get(record.class_id, 0) + 1

    for record in dropped:
        report.dropped_by_class[record.class_id] = (
            report.dropped_by_class.get(record.class_id, 0) + 1
        )
    report.kept = len(kept)
    return kept, dropped, report
