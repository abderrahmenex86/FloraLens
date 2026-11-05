from __future__ import annotations

import warnings
from collections import defaultdict
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field, model_validator

from floralens_ml.config import canonical_json, sha256_text

Rank = Literal[
    "species",
    "genus",
    "family",
    "superfamily",
    "order",
    "class",
    "hybrid",
    "complex",
    "subspecies",
    "variety",
]
Status = Literal["anchor", "candidate", "active", "dropped"]


class ClassEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    class_id: int = Field(ge=0)
    scientific_name: str
    common_name: str | None = None
    rank: Rank = "species"
    taxon_id: int | None = None
    family: str | None = None
    genus: str | None = None
    region: list[str] = Field(default_factory=list)
    sources: list[str] = Field(default_factory=list)
    status: Status = "active"
    role: Literal["pest", "beneficial", "neutral", "unknown"] | None = None
    life_stage: str | None = None
    host: str | None = None
    kind: Literal["biotic", "abiotic", "nutrient", "healthy", "unknown"] | None = None
    symptoms: list[str] = Field(default_factory=list)
    notes: str | None = None


class ClassList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: str
    target: Literal["plants", "insects", "disease"]
    classes: list[ClassEntry]

    @model_validator(mode="after")
    def _validate_unique(self) -> ClassList:
        seen_ids: set[int] = set()
        by_name: dict[tuple[str, str], list[int]] = defaultdict(list)
        for entry in self.classes:
            if entry.class_id in seen_ids:
                raise ValueError(f"duplicate class_id {entry.class_id}")
            seen_ids.add(entry.class_id)
            by_name[(entry.scientific_name.strip().lower(), entry.rank)].append(entry.class_id)
        for (name, rank), ids in by_name.items():
            if len(ids) > 1:
                warnings.warn(
                    f"duplicate {rank} name {name!r} in classes {ids}; "
                    "resolve the taxonomy before training",
                    stacklevel=2,
                )
        return self

    @property
    def class_ids(self) -> list[int]:
        return [entry.class_id for entry in self.classes]

    @property
    def label_map(self) -> dict[int, int]:
        """Map stable class ids to contiguous model indices."""
        return {class_id: index for index, class_id in enumerate(sorted(self.class_ids))}

    @property
    def index_to_class_id(self) -> list[int]:
        return sorted(self.class_ids)

    def by_id(self, class_id: int) -> ClassEntry:
        for entry in self.classes:
            if entry.class_id == class_id:
                return entry
        raise KeyError(f"unknown class_id {class_id}")

    def by_taxon(self, taxon_id: int) -> ClassEntry:
        for entry in self.classes:
            if entry.taxon_id == taxon_id:
                return entry
        raise KeyError(f"unknown taxon_id {taxon_id}")

    def hierarchy(self) -> tuple[list[str], list[str]]:
        """Return family and genus labels aligned with ``index_to_class_id``."""
        ordered = sorted(self.classes, key=lambda entry: entry.class_id)
        families = [entry.family or "unknown" for entry in ordered]
        genera = [entry.genus or entry.scientific_name.split()[0] for entry in ordered]
        return families, genera

    def sha256(self) -> str:
        return sha256_text(canonical_json(self.model_dump(mode="json")))

    def to_yaml(self, path: str | Path) -> None:
        with open(path, "w", encoding="utf-8") as fh:
            yaml.safe_dump(
                self.model_dump(mode="json", exclude_none=True),
                fh,
                sort_keys=False,
                allow_unicode=True,
            )


def load_class_list(path: str | Path) -> ClassList:
    with open(path, encoding="utf-8") as fh:
        raw = yaml.safe_load(fh)
    if not isinstance(raw, dict):
        raise ValueError(f"{path} must contain a YAML mapping")
    return ClassList.model_validate(raw)
