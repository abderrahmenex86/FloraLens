from __future__ import annotations

import json
from collections import defaultdict
from collections.abc import Iterable, Iterator
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Split = Literal["train", "val", "test"]


class ImageRecord(BaseModel):
    model_config = ConfigDict(extra="allow")

    image_id: str
    source: str
    source_id: str
    observation_id: str
    class_id: int
    path: str
    sha256: str
    width: int = Field(ge=1)
    height: int = Field(ge=1)
    taxon_id: int | None = None
    scientific_name: str | None = None
    organ: str | None = None
    life_stage: str | None = None
    license: str | None = None
    author: str | None = None
    url: str | None = None
    split: Split | None = None
    source_split: str | None = None
    is_negative: bool = False
    quality_score: float | None = None

    @property
    def group_key(self) -> str:
        return self.observation_id or self.image_id


def read_jsonl(path: str | Path) -> Iterator[ImageRecord]:
    with open(path, encoding="utf-8") as fh:
        for line_no, line in enumerate(fh, 1):
            line = line.strip()
            if not line:
                continue
            try:
                yield ImageRecord.model_validate_json(line)
            except Exception as exc:  # pragma: no cover - message enrichment
                raise ValueError(f"{path}:{line_no}: invalid record: {exc}") from exc


def load_manifest(path: str | Path) -> list[ImageRecord]:
    return list(read_jsonl(path))


def write_jsonl(records: Iterable[ImageRecord], path: str | Path) -> int:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with open(path, "w", encoding="utf-8") as fh:
        for record in records:
            fh.write(record.model_dump_json(exclude_none=True))
            fh.write("\n")
            count += 1
    return count


def write_json(data: object, path: str | Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, sort_keys=True)
        fh.write("\n")


def group_split_violations(records: Iterable[ImageRecord]) -> dict[str, set[str]]:
    """Return observation ids that appear in more than one split."""
    groups: dict[str, set[str]] = defaultdict(set)
    for record in records:
        if record.split:
            groups[record.group_key].add(record.split)
    return {key: splits for key, splits in groups.items() if len(splits) > 1}


def assert_no_group_leakage(records: Iterable[ImageRecord]) -> None:
    violations = group_split_violations(records)
    if violations:
        sample = list(violations.items())[:5]
        raise ValueError(f"observation leakage across splits: {sample}")


def filter_split(records: Iterable[ImageRecord], split: Split) -> list[ImageRecord]:
    return [record for record in records if record.split == split]
