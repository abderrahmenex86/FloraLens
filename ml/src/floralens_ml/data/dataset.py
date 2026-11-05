from __future__ import annotations

from collections import Counter
from collections.abc import Iterable
from pathlib import Path

from floralens_ml.data.schema import ImageRecord


class ManifestDataset:
    """Torch dataset backed by an image manifest.

    Imported lazily from torch so the rest of the package remains usable
    without the training stack installed.
    """

    def __init__(
        self,
        records: Iterable[ImageRecord],
        class_to_index: dict[int, int],
        transform,
        *,
        skip_missing: bool = True,
    ) -> None:
        from torch.utils.data import Dataset  # noqa: F401  (type check only)

        self.records = [
            record
            for record in records
            if record.class_id in class_to_index
            and (not skip_missing or Path(record.path).exists())
        ]
        self.class_to_index = class_to_index
        self.transform = transform

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, index: int):
        from PIL import Image, ImageOps

        record = self.records[index]
        with Image.open(record.path) as opened:
            image = ImageOps.exif_transpose(opened).convert("RGB")
        tensor = self.transform(image)
        return tensor, self.class_to_index[record.class_id], record.image_id

    def class_counts(self) -> dict[int, int]:
        return dict(Counter(self.class_to_index[record.class_id] for record in self.records))


def class_weights(records: Iterable[ImageRecord], class_to_index: dict[int, int]) -> list[float]:
    counts = Counter(class_to_index[record.class_id] for record in records)
    total = sum(counts.values())
    return [total / (len(counts) * counts[class_to_index[record.class_id]]) for record in records]
