from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

from floralens_ml.config import ensure_dir, sha256_file
from floralens_ml.models.classifier import build_classifier
from floralens_ml.taxonomy import load_class_list


def export_onnx(
    checkpoint_path: str | Path,
    class_list_path: str | Path,
    output_dir: str | Path,
    *,
    model_id: str,
    input_size: int | None = None,
    opset: int = 17,
) -> dict[str, Any]:
    import torch

    checkpoint = torch.load(checkpoint_path, map_location="cpu")
    config = checkpoint.get("config", {})
    model_name = checkpoint.get("model_name") or config.get("model_name")
    class_list = load_class_list(class_list_path)
    class_to_index = class_list.label_map
    if checkpoint.get("class_ids") and list(checkpoint["class_ids"]) != class_list.index_to_class_id:
        raise ValueError("checkpoint class ids do not match the class list")

    size = int(input_size or config.get("input_size", 224))
    model = build_classifier(model_name, num_classes=len(class_to_index), pretrained=False)
    model.load_state_dict(checkpoint["model"])
    model.eval()
    dummy = torch.randn(1, 3, size, size)
    output_dir = ensure_dir(output_dir)
    onnx_path = output_dir / "model.onnx"
    torch.onnx.export(
        model,
        (dummy,),
        onnx_path,
        input_names=["input"],
        output_names=["logits"],
        opset_version=opset,
        do_constant_folding=True,
        dynamic_axes=None,
        dynamo=False,
    )
    contract = build_contract(
        model_id=model_id,
        task="classification",
        class_list=class_list,
        onnx_path=onnx_path,
        input_size=size,
        model_name=model_name,
        config=config,
    )
    with open(output_dir / "contract.json", "w", encoding="utf-8") as fh:
        json.dump(contract, fh, indent=2)
        fh.write("\n")
    return contract


def build_contract(
    *,
    model_id: str,
    task: str,
    class_list,
    onnx_path: str | Path,
    input_size: int,
    model_name: str,
    config: dict[str, Any] | None = None,
    calibration: dict[str, float] | None = None,
    quantization: str = "fp32",
) -> dict[str, Any]:
    class_ids = class_list.index_to_class_id
    return {
        "model_id": model_id,
        "task": task,
        "version": "0.1.0",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model_name": model_name,
        "input": {
            "name": "input",
            "shape": [1, 3, input_size, input_size],
            "dtype": "float32",
            "layout": "NCHW",
            "preprocess": "imagenet",
        },
        "output": {"name": "logits", "shape": [1, len(class_ids)], "dtype": "float32"},
        "classes_sha256": class_list.sha256(),
        "class_count": len(class_ids),
        "class_ids": class_ids,
        "calibration": calibration or {"temperature": 1.0, "threshold": 0.0},
        "quantization": quantization,
        "files": {
            Path(onnx_path).name: {
                "sha256": sha256_file(onnx_path),
                "bytes": Path(onnx_path).stat().st_size,
            }
        },
        "training": {
            "config": config or {},
        },
    }
