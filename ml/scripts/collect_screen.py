#!/usr/bin/env python3
"""Collect the model screen results into one comparable table.

Reads each run's history.json (best macro-F1 epoch), counts parameters, and
reports the exported ONNX size when it exists.

    python ml/scripts/collect_screen.py --runs ml/runs --prefix plants1024
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--runs", default="ml/runs", type=Path)
    parser.add_argument("--prefix", default="plants1024")
    args = parser.parse_args()

    rows = []
    for run_dir in sorted(args.runs.glob(f"{args.prefix}*")):
        history_path = run_dir / "history.json"
        if not history_path.exists():
            continue
        history = json.loads(history_path.read_text())
        if not history:
            continue
        best = max(history, key=lambda item: item["macro_f1"])
        config = json.loads((run_dir / "summary.json").read_text()).get("config", {}) if (run_dir / "summary.json").exists() else {}
        onnx = run_dir / "model.onnx"
        rows.append(
            {
                "run": run_dir.name.replace(args.prefix + "_", ""),
                "model": config.get("model_name", ""),
                "epochs": best["epoch"],
                "top1": best["top1"],
                "top5": best["top5"],
                "macro_f1": best["macro_f1"],
                "ece": best.get("ece"),
                "img_s": best.get("images_per_s"),
                "onnx_mb": round(onnx.stat().st_size / 1e6, 1) if onnx.exists() else None,
            }
        )

    if not rows:
        print("no runs found")
        return 1

    rows.sort(key=lambda row: row["macro_f1"], reverse=True)
    header = f"{'model':34s} {'ep':>3s} {'top1':>6s} {'top5':>6s} {'f1':>6s} {'img/s':>6s}"
    print(header)
    print("-" * len(header))
    for row in rows:
        print(
            f"{row['run']:34s} {row['epochs']:3d} {row['top1']:6.3f} "
            f"{row['top5']:6.3f} {row['macro_f1']:6.3f} "
            f"{(row['img_s'] or 0):6.0f}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
