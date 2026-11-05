from __future__ import annotations

import json
from pathlib import Path

from floralens_ml.config import ensure_dir, sha256_file


def quantize_dynamic(
    onnx_path: str | Path,
    output_path: str | Path,
    *,
    per_channel: bool = True,
) -> Path:
    from onnxruntime.quantization import QuantType, quantize_dynamic

    output_path = Path(output_path)
    ensure_dir(output_path.parent)
    quantize_dynamic(
        model_input=str(onnx_path),
        model_output=str(output_path),
        weight_type=QuantType.QInt8,
        per_channel=per_channel,
    )
    return output_path


def update_contract_for_file(contract_path: str | Path, file_path: str | Path) -> dict:
    contract_path = Path(contract_path)
    contract = json.loads(contract_path.read_text(encoding="utf-8"))
    contract["files"] = {
        Path(file_path).name: {
            "sha256": sha256_file(file_path),
            "bytes": Path(file_path).stat().st_size,
        }
    }
    contract["quantization"] = "int8-dynamic"
    contract_path.write_text(json.dumps(contract, indent=2) + "\n", encoding="utf-8")
    return contract
