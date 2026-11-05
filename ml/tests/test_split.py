from __future__ import annotations

from floralens_ml.data.schema import ImageRecord, assert_no_group_leakage
from floralens_ml.data.split import assign_splits


def record(image_id: str, observation_id: str, class_id: int) -> ImageRecord:
    return ImageRecord(
        image_id=image_id,
        source="test",
        source_id=image_id,
        observation_id=observation_id,
        class_id=class_id,
        path=f"/tmp/{image_id}.jpg",
        sha256=f"{image_id:0>64}"[:64],
        width=100,
        height=100,
    )


def test_observation_groups_do_not_cross_splits() -> None:
    records = []
    for class_id in range(3):
        for observation in range(20):
            for image in range(3):
                records.append(
                    record(
                        f"c{class_id}-o{observation}-i{image}",
                        f"c{class_id}-o{observation}",
                        class_id,
                    )
                )
    output, report = assign_splits(records, val_fraction=0.2, test_fraction=0.2)
    assert report.records == len(records)
    assert_no_group_leakage(output)
    assert all(item.split for item in output)
    assert report.by_split["train"] > 0
    assert report.by_split["val"] > 0
    assert report.by_split["test"] > 0
    # Every class is represented in train.
    train_classes = {item.class_id for item in output if item.split == "train"}
    assert train_classes == {0, 1, 2}


def test_official_split_is_respected() -> None:
    records = [
        record("a", "obs-a", 0).model_copy(update={"source_split": "train"}),
        record("b", "obs-b", 0).model_copy(update={"source_split": "test"}),
    ]
    output, report = assign_splits(records, val_fraction=0.0, test_fraction=0.0)
    assert report.official_groups == 2
    assert {item.split for item in output} == {"train", "test"}
