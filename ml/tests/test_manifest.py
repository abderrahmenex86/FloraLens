from __future__ import annotations

from pathlib import Path

from floralens_ml.data.schema import ImageRecord, load_manifest, write_jsonl


def record(image_id: str, class_id: int = 0, observation_id: str | None = None) -> ImageRecord:
    return ImageRecord(
        image_id=image_id,
        source="test",
        source_id=image_id,
        observation_id=observation_id or image_id,
        class_id=class_id,
        path=f"/tmp/{image_id}.jpg",
        sha256="0" * 64,
        width=100,
        height=100,
    )


def test_jsonl_round_trip(tmp_path: Path) -> None:
    path = tmp_path / "manifest.jsonl"
    records = [record("a"), record("b", class_id=1)]
    assert write_jsonl(records, path) == 2
    loaded = load_manifest(path)
    assert [item.image_id for item in loaded] == ["a", "b"]
    assert loaded[1].class_id == 1
