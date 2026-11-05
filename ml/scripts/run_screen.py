#!/usr/bin/env python3
"""Run the lightweight classifier screen.

Prepare a screen manifest first (150 classes, ~80 images/class, observation
grouped), then run:

    uv run --project ml python ml/scripts/run_screen.py \
      --manifest data/manifests/screen_split.jsonl

Each candidate gets its own run directory and log. The script writes a
machine-readable summary to ``ml/reports/screen_results.json``.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import yaml


def slugify(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_.-]+", "_", value).strip("_")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--study", default="ml/configs/study/classifiers.yaml")
    parser.add_argument("--base-config", default="ml/configs/train/plants_mobilenetv4.yaml")
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--out", default="ml/reports/screen_results.json")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    study = yaml.safe_load(Path(args.study).read_text(encoding="utf-8"))
    base = yaml.safe_load(Path(args.base_config).read_text(encoding="utf-8"))
    manifest = str(Path(args.manifest).resolve())
    seeds = study["screen"].get("seeds", [42])
    epochs = int(study["screen"].get("epochs", 15))
    candidates = study["candidates"]

    run_root = Path("ml/runs/screen")
    config_root = run_root / "configs"
    config_root.mkdir(parents=True, exist_ok=True)
    results = []

    for model_name in candidates:
        for seed in seeds:
            run_name = f"{slugify(model_name)}_seed{seed}"
            config = dict(base)
            config.update(
                {
                    "model_name": model_name,
                    "data_manifest": manifest,
                    "output_dir": str(run_root / run_name),
                    "epochs": epochs,
                    "seed": int(seed),
                }
            )
            config_path = config_root / f"{run_name}.yaml"
            config_path.write_text(yaml.safe_dump(config, sort_keys=False), encoding="utf-8")
            log_path = run_root / f"{run_name}.log"
            command = [
                sys.executable,
                "-m",
                "floralens_ml.cli",
                "train-classifier",
                "--config",
                str(config_path),
            ]
            print(" ".join(command))
            if args.dry_run:
                continue
            with open(log_path, "w", encoding="utf-8") as log:
                subprocess.run(command, check=True, stdout=log, stderr=subprocess.STDOUT)
            summary_path = Path(config["output_dir"]) / "summary.json"
            if summary_path.exists():
                summary = json.loads(summary_path.read_text(encoding="utf-8"))
                results.append(
                    {
                        "model": model_name,
                        "seed": seed,
                        "run_dir": config["output_dir"],
                        "best_macro_f1": summary.get("best_macro_f1"),
                    }
                )

    if results:
        Path(args.out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.out).write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
        print(f"wrote {args.out} with {len(results)} runs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
