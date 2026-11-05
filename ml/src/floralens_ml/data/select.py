from __future__ import annotations

import hashlib
from collections import Counter, defaultdict
from collections.abc import Iterable
from dataclasses import dataclass, field

from floralens_ml.data.schema import ImageRecord


@dataclass
class SelectionPolicy:
    min_images: int = 80
    max_per_class: int = 500
    max_negative_images: int = 5000
    max_classes: int | None = None
    force_classes: set[int] = field(default_factory=set)
    seed: int = 42
    keep_negatives: bool = True

    def as_dict(self) -> dict[str, object]:
        return {
            "min_images": self.min_images,
            "max_per_class": self.max_per_class,
            "max_negative_images": self.max_negative_images,
            "max_classes": self.max_classes,
            "force_classes": sorted(self.force_classes),
            "seed": self.seed,
            "keep_negatives": self.keep_negatives,
        }


@dataclass
class SelectionReport:
    input_records: int = 0
    selected_records: int = 0
    dropped_records: int = 0
    dropped_classes: list[int] = field(default_factory=list)
    counts_before: dict[int, int] = field(default_factory=dict)
    counts_after: dict[int, int] = field(default_factory=dict)

    def as_dict(self) -> dict[str, object]:
        return {
            "input_records": self.input_records,
            "selected_records": self.selected_records,
            "dropped_records": self.dropped_records,
            "dropped_classes": sorted(self.dropped_classes),
            "counts_before": dict(sorted(self.counts_before.items())),
            "counts_after": dict(sorted(self.counts_after.items())),
        }


def _stable_rank(image_id: str, seed: int) -> str:
    return hashlib.sha256(f"{seed}:{image_id}".encode()).hexdigest()


def class_counts(records: Iterable[ImageRecord]) -> dict[int, int]:
    counts: Counter[int] = Counter()
    for record in records:
        if not record.is_negative:
            counts[record.class_id] += 1
    return dict(counts)


def select_records(
    records: Iterable[ImageRecord],
    policy: SelectionPolicy | None = None,
) -> tuple[list[ImageRecord], list[ImageRecord], SelectionReport]:
    """Apply class coverage and per-class caps after cleaning.

    Classes below ``min_images`` are dropped unless forced. Common classes are
    deterministically subsampled to ``max_per_class``. Images are never
    randomly dropped across the board: rare classes are kept in full.
    """
    policy = policy or SelectionPolicy()
    records = list(records)
    report = SelectionReport(input_records=len(records))
    report.counts_before = class_counts(records)

    by_class: dict[int, list[ImageRecord]] = defaultdict(list)
    negatives: list[ImageRecord] = []
    for record in records:
        if record.is_negative:
            negatives.append(record)
        else:
            by_class[record.class_id].append(record)

    eligible = [
        (class_id, items)
        for class_id, items in sorted(by_class.items())
        if len(items) >= policy.min_images or class_id in policy.force_classes
    ]
    report.dropped_classes.extend(
        class_id for class_id in by_class if class_id not in {item[0] for item in eligible}
    )

    if policy.max_classes is not None and len(eligible) > policy.max_classes:
        forced = [item for item in eligible if item[0] in policy.force_classes]
        rest = sorted(
            [item for item in eligible if item[0] not in policy.force_classes],
            key=lambda item: (-len(item[1]), item[0]),
        )
        keep = {class_id for class_id, _ in forced + rest[: max(0, policy.max_classes - len(forced))]}
        report.dropped_classes.extend(
            class_id for class_id, _ in eligible if class_id not in keep
        )
        eligible = [(class_id, items) for class_id, items in eligible if class_id in keep]

    selected: list[ImageRecord] = []
    for _class_id, items in eligible:
        ordered = sorted(items, key=lambda item: _stable_rank(item.image_id, policy.seed))
        selected.extend(ordered[: policy.max_per_class])

    if policy.keep_negatives:
        negatives = sorted(negatives, key=lambda item: _stable_rank(item.image_id, policy.seed))
        selected.extend(negatives[: policy.max_negative_images])

    report.counts_after = class_counts(selected)
    report.selected_records = len(selected)
    report.dropped_records = len(records) - len(selected)
    report.dropped_classes = sorted(set(report.dropped_classes))
    selected_ids = {record.image_id for record in selected}
    dropped = [record for record in records if record.image_id not in selected_ids]
    return selected, dropped, report
