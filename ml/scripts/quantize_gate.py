#!/usr/bin/env python3
"""Static QDQ quantization for the plant gate, calibrated on training images.

Dynamic quantization collapses the gate (plant recall drops to ~8%), so this
uses static quantization with a calibration set drawn from the train split.

    python ml/scripts/quantize_gate.py \
        --onnx ml/exports/plant_gate/model.onnx \
        --out ml/exports/plant_gate/plant_gate.int8.onnx \
        --manifest data/processed/gate/manifest.jsonl
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from evaluate_gate import preprocess  # noqa: E402
from floralens_ml.data.schema import load_manifest  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--onnx", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--input-size", type=int, default=128)
    parser.add_argument("--calibration-size", type=int, default=400)
    args = parser.parse_args()

    import onnxruntime as ort
    from onnxruntime.quantization import (
        CalibrationDataReader,
        QuantFormat,
        QuantType,
        quantize_static,
    )

    session = ort.InferenceSession(str(args.onnx), providers=["CPUExecutionProvider"])
    input_name = session.get_inputs()[0].name

    records = [r for r in load_manifest(args.manifest) if r.split == "train"]
    # Balance the calibration set so activation ranges see both classes.
    plants = [r for r in records if r.class_id == 0]
    others = [r for r in records if r.class_id == 1]
    half = args.calibration_size // 2
    calibration = plants[:half] + others[:half]

    class Reader(CalibrationDataReader):
        def __init__(self) -> None:
            self.items = [preprocess(r.path, args.input_size) for r in calibration]
            self.index = 0

        def get_next(self):
            if self.index >= len(self.items):
                return None
            item = self.items[self.index]
            self.index += 1
            return {input_name: item[None, ...]}

    quantize_static(
        str(args.onnx),
        str(args.out),
        Reader(),
        quant_format=QuantFormat.QDQ,
        per_channel=True,
        activation_type=QuantType.QInt8,
        weight_type=QuantType.QInt8,
    )
    print(f"wrote {args.out} ({np.round(args.out.stat().st_size / 1e6, 2)} MB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
