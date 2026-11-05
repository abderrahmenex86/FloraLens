from __future__ import annotations

from pathlib import Path

from PIL import Image

from floralens_ml.config import sha256_file
from floralens_ml.data.clean import ahash, dedupe_records, hamming, quality_filter
from floralens_ml.data.schema import ImageRecord


def make_image(path: Path, color: tuple[int, int, int], size: int = 16) -> str:
    Image.new("RGB", (size, size), color).save(path)
    return sha256_file(path)


def make_record(path: Path, sha: str, image_id: str, class_id: int = 0) -> ImageRecord:
    return ImageRecord(
        image_id=image_id,
        source="test",
        source_id=image_id,
        observation_id=image_id,
        class_id=class_id,
        path=str(path),
        sha256=sha,
        width=16,
        height=16,
    )


def test_exact_duplicates_are_removed(tmp_path: Path) -> None:
    first = tmp_path / "a.jpg"
    second = tmp_path / "b.jpg"
    sha = make_image(first, (10, 120, 10))
    second.write_bytes(first.read_bytes())
    records = [make_record(first, sha, "a"), make_record(second, sha, "b")]
    kept, dropped, report = dedupe_records(records, compute_hash=False)
    assert len(kept) == 1
    assert report.exact_duplicates == 1
    assert len(dropped) == 1


def test_perceptual_hash_matches_identical_image(tmp_path: Path) -> None:
    first = tmp_path / "a.jpg"
    second = tmp_path / "b.jpg"
    make_image(first, (200, 100, 30))
    Image.open(first).save(second, quality=95)
    assert hamming(ahash(first), ahash(second)) <= 5


def test_quality_filter_keeps_valid_image(tmp_path: Path) -> None:
    path = tmp_path / "a.jpg"
    sha = make_image(path, (90, 140, 60), size=32)
    kept, dropped, report = quality_filter(
        [make_record(path, sha, "a")],
        min_short_side=8,
        min_blur=0.0,
    )
    assert len(kept) == 1
    assert not dropped
    assert report.missing == 0


def test_quality_filter_drops_missing_file() -> None:
    record = ImageRecord(
        image_id="missing",
        source="test",
        source_id="missing",
        observation_id="missing",
        class_id=0,
        path="/tmp/definitely-not-here.jpg",
        sha256="0" * 64,
        width=16,
        height=16,
    )
    kept, dropped, report = quality_filter([record], min_short_side=8, min_blur=0.0)
    assert not kept
    assert report.missing == 1
    assert len(dropped) == 1
