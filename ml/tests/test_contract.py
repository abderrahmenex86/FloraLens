from __future__ import annotations

from pathlib import Path

from floralens_ml.config import sha256_file
from floralens_ml.export.onnx import build_contract
from floralens_ml.taxonomy import load_class_list

ROOT = Path(__file__).resolve().parents[2]


def test_contract_matches_class_list(tmp_path: Path) -> None:
    classes = load_class_list(ROOT / "shared/classes/plants.yaml")
    model_path = tmp_path / "model.onnx"
    model_path.write_bytes(b"not-a-real-onnx-model")
    contract = build_contract(
        model_id="plant_test_v1",
        task="classification",
        class_list=classes,
        onnx_path=model_path,
        input_size=224,
        model_name="mobilenetv4_conv_small",
    )
    assert contract["class_count"] == len(classes.classes)
    assert contract["classes_sha256"] == classes.sha256()
    assert contract["input"]["shape"] == [1, 3, 224, 224]
    assert contract["output"]["shape"] == [1, len(classes.classes)]
    assert contract["files"]["model.onnx"]["sha256"] == sha256_file(model_path)
