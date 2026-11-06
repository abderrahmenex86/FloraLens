#!/usr/bin/env python3
"""Evaluate the plant presence gate on a manifest split.

Runs the exported ONNX model (fp32 or INT8) and reports the plant acceptance
rate and non-plant rejection rate at several thresholds, so the app threshold
can be chosen from data instead of guessed.

    python ml/scripts/evaluate_gate.py \
        --onnx ml/exports/plant_gate/plant_gate.int8.onnx \
        --manifest data/processed/gate/manifest.jsonl \
        --split val
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from floralens_ml.data.schema import load_manifest  # noqa: E402

MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)
THRESHOLDS = (0.50, 0.60, 0.70, 0.80, 0.85, 0.90, 0.95)


def preprocess(path: str, size: int) -> np.ndarray:
    with Image.open(path) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")

    shorter = int(size * 1.14)
    scale = shorter / min(image.width, image.height)
    resized = image.resize(
        (max(size, round(image.width * scale)), max(size, round(image.height * scale))),
        Image.BILINEAR,
    )
    left = (resized.width - size) // 2
    top = (resized.height - size) // 2
    cropped = resized.crop((left, top, left + size, top + size))

    array = np.asarray(cropped, dtype=np.float32) / 255.0
    array = (array - MEAN) / STD
    return np.transpose(array, (2, 0, 1))


def softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - logits.max(axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / exp.sum(axis=1, keepdims=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--onnx", required=True, type=Path)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--split", default="val", choices=("train", "val", "test"))
    parser.add_argument("--input-size", type=int, default=128)
    parser.add_argument("--batch-size", type=int, default=64)
    args = parser.parse_args()

    import onnxruntime as ort

    records = [record for record in load_manifest(args.manifest) if record.split == args.split]
    if not records:
        raise SystemExit(f"no records in split {args.split}")

    session = ort.InferenceSession(str(args.onnx), providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name

    scores: list[float] = []
    labels: list[int] = []

    for start in range(0, len(records), args.batch_size):
        batch = records[start : start + args.batch_size]
        tensors = np.stack([preprocess(record.path, args.input_size) for record in batch])
        logits = session.run(None, {input_name: tensors})[0]
        probabilities = softmax(np.asarray(logits, dtype=np.float32))
        scores.extend(probabilities[:, 1].tolist())
        labels.extend(0 if record.class_id == 0 else 1 for record in batch)

    scores_array = np.array(scores)
    labels_array = np.array(labels)
    plants = labels_array == 0
    others = labels_array == 1

    report = {
        "onnx": str(args.onnx),
        "split": args.split,
        "count": len(records),
        "plants": int(plants.sum()),
        "not_plants": int(others.sum()),
        "thresholds": [],
    }

    for threshold in THRESHOLDS:
        accepted = scores_array < threshold
        report["thresholds"].append(
            {
                "threshold": threshold,
                "plant_accept_rate": float(accepted[plants].mean()),
                "not_plant_reject_rate": float((~accepted[others]).mean()),
                "accuracy": float((accepted == plants).mean()),
            }
        )

    print(json.dumps(report, indent=2))
    print()
    print(f"{'thresh':>7s} {'plants kept':>12s} {'garbage rejected':>17s} {'accuracy':>9s}")
    for row in report["thresholds"]:
        print(
            f"{row['threshold']:7.2f} {row['plant_accept_rate']:12.3f} "
            f"{row['not_plant_reject_rate']:17.3f} {row['accuracy']:9.3f}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
