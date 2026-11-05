from __future__ import annotations

import hashlib
from collections import Counter, defaultdict
from collections.abc import Iterable
from dataclasses import dataclass, field
from typing import Literal

from floralens_ml.data.schema import ImageRecord, Split, assert_no_group_leakage

SplitName = Literal["train", "val", "test"]

_OFFICIAL_MAP = {
    "train": "train",
    "training": "train",
    "val": "val",
    "valid": "val",
    "validation": "val",
    "test": "test",
    "testing": "test",
}


@dataclass
class SplitReport:
    groups: int = 0
    records: int = 0
    by_split: dict[str, int] = field(default_factory=dict)
    groups_by_split: dict[str, int] = field(default_factory=dict)
    class_counts: dict[str, dict[int, int]] = field(default_factory=dict)
    official_groups: int = 0
    assigned_groups: int = 0

    def as_dict(self) -> dict[str, object]:
        return {
            "groups": self.groups,
            "records": self.records,
            "by_split": self.by_split,
            "groups_by_split": self.groups_by_split,
            "class_counts": {
                split: dict(sorted(counts.items()))
                for split, counts in sorted(self.class_counts.items())
            },
            "official_groups": self.official_groups,
            "assigned_groups": self.assigned_groups,
        }


def _rank(value: str, seed: int) -> str:
    return hashlib.sha256(f"{seed}:{value}".encode()).hexdigest()


def _official_split(record: ImageRecord) -> Split | None:
    for raw in (record.source_split, record.split):
        if not raw:
            continue
        mapped = _OFFICIAL_MAP.get(raw.strip().lower())
        if mapped:
            return mapped  # type: ignore[return-value]
    return None


def assign_splits(
    records: Iterable[ImageRecord],
    *,
    val_fraction: float = 0.1,
    test_fraction: float = 0.1,
    seed: int = 42,
    respect_existing: bool = True,
) -> tuple[list[ImageRecord], SplitReport]:
    if val_fraction < 0 or test_fraction < 0 or val_fraction + test_fraction >= 1:
        raise ValueError("val_fraction + test_fraction must be in [0, 1)")

    records = list(records)
    groups: dict[str, list[ImageRecord]] = defaultdict(list)
    for record in records:
        groups[record.group_key].append(record)

    group_split: dict[str, Split] = {}
    report = SplitReport(groups=len(groups), records=len(records))

    for key, items in groups.items():
        classes = {item.class_id for item in items}
        if len(classes) > 1:
            raise ValueError(f"observation {key} spans multiple classes: {sorted(classes)}")
        existing = {_official_split(item) for item in items if _official_split(item)}
        if len(existing) > 1:
            raise ValueError(f"observation {key} has conflicting official splits: {existing}")
        if existing and respect_existing:
            group_split[key] = existing.pop()  # type: ignore[assignment]
            report.official_groups += 1

    # Fill missing groups class by class, preserving class coverage in val/test.
    missing_by_class: dict[int, list[str]] = defaultdict(list)
    for key, items in groups.items():
        if key not in group_split:
            missing_by_class[items[0].class_id].append(key)

    for _class_id, keys in sorted(missing_by_class.items()):
        ordered = sorted(keys, key=lambda key: _rank(key, seed))
        total = sum(len(groups[key]) for key in ordered)
        n_test = max(1, round(total * test_fraction)) if test_fraction > 0 else 0
        n_val = max(1, round(total * val_fraction)) if val_fraction > 0 else 0
        n_test = min(n_test, max(0, total - 1))
        n_val = min(n_val, max(0, total - n_test - 1))

        test_seen = val_seen = 0
        for key in ordered:
            size = len(groups[key])
            if test_seen < n_test:
                group_split[key] = "test"
                test_seen += size
            elif val_seen < n_val:
                group_split[key] = "val"
                val_seen += size
            else:
                group_split[key] = "train"
            report.assigned_groups += 1

    output: list[ImageRecord] = []
    for key, items in groups.items():
        split = group_split[key]
        for item in items:
            output.append(item.model_copy(update={"split": split}))

    assert_no_group_leakage(output)
    report.by_split = dict(Counter(item.split for item in output if item.split))
    report.groups_by_split = dict(
        Counter(group_split[key] for key in groups)
    )
    for split in ("train", "val", "test"):
        counts = Counter(item.class_id for item in output if item.split == split)
        report.class_counts[split] = dict(counts)
    return output, report
