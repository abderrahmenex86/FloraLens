from __future__ import annotations

from floralens_ml.data.schema import ImageRecord
from floralens_ml.data.select import SelectionPolicy, select_records


def record(image_id: str, class_id: int) -> ImageRecord:
    return ImageRecord(
        image_id=image_id,
        source="test",
        source_id=image_id,
        observation_id=image_id,
        class_id=class_id,
        path=f"/tmp/{image_id}.jpg",
        sha256=f"{image_id:0>64}"[:64],
        width=100,
        height=100,
    )


def test_drops_rare_classes_and_caps_common_ones() -> None:
    records = [record(f"common-{i}", 0) for i in range(100)]
    records += [record(f"rare-{i}", 1) for i in range(5)]
    selected, dropped, report = select_records(
        records,
        SelectionPolicy(min_images=10, max_per_class=50),
    )
    assert sum(1 for item in selected if item.class_id == 0) == 50
    assert all(item.class_id != 1 for item in selected)
    assert report.dropped_classes == [1]
    assert len(dropped) == 55


def test_forced_class_survives_minimum() -> None:
    records = [record(f"rare-{i}", 7) for i in range(5)]
    selected, _, report = select_records(
        records,
        SelectionPolicy(min_images=10, max_per_class=50, force_classes={7}),
    )
    assert len(selected) == 5
    assert report.dropped_classes == []
