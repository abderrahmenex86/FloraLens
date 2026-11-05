from __future__ import annotations

import argparse
import json
from collections import Counter
from collections.abc import Sequence
from pathlib import Path

from floralens_ml.config import load_yaml
from floralens_ml.data.clean import dedupe_records, quality_filter
from floralens_ml.data.download.generic import import_folder
from floralens_ml.data.download.inat import download_inat
from floralens_ml.data.schema import (
    load_manifest,
    write_json,
    write_jsonl,
)
from floralens_ml.data.select import SelectionPolicy, select_records
from floralens_ml.data.split import assign_splits
from floralens_ml.taxonomy import load_class_list


def _cmd_validate_classes(args: argparse.Namespace) -> int:
    classes = load_class_list(args.path)
    print(
        json.dumps(
            {
                "path": str(args.path),
                "version": classes.version,
                "target": classes.target,
                "classes": len(classes.classes),
                "sha256": classes.sha256(),
            },
            indent=2,
        )
    )
    return 0


def _cmd_import_folder(args: argparse.Namespace) -> int:
    records = import_folder(
        args.root,
        args.mapping,
        source=args.source,
        group_by=args.group_by,
        observation_regex=args.observation_regex,
        license=args.license,
        author=args.author,
    )
    write_jsonl(records, args.out)
    print(f"wrote {len(records)} records to {args.out}")
    return 0


def _cmd_download_inat(args: argparse.Namespace) -> int:
    classes = load_class_list(args.classes)
    life_stage_term = None
    if args.term_value_id is not None:
        life_stage_term = (args.term_id, args.term_value_id)
    records = download_inat(
        classes,
        args.out,
        place_id=args.place_id,
        max_per_class=args.max_per_class,
        photo_license=args.photo_license,
        life_stage_term=life_stage_term,
        life_stage_label=args.life_stage_label,
    )
    write_jsonl(records, args.manifest)
    print(f"wrote {len(records)} records to {args.manifest}")
    return 0


def _cmd_merge(args: argparse.Namespace) -> int:
    records = []
    for path in args.inputs:
        records.extend(load_manifest(path))
    write_jsonl(records, args.out)
    print(f"wrote {len(records)} records to {args.out}")
    return 0


def _cmd_clean(args: argparse.Namespace) -> int:
    records = load_manifest(args.manifest)
    kept, _, report = dedupe_records(records, hash_threshold=args.hash_threshold)
    if args.quality:
        kept, _, quality_report = quality_filter(
            kept,
            min_short_side=args.min_short_side,
            min_blur=args.min_blur,
        )
        report.too_small += quality_report.too_small
        report.blurry += quality_report.blurry
        report.bad_exposure += quality_report.bad_exposure
        report.missing += quality_report.missing
        report.kept = len(kept)
        report.kept_by_class = quality_report.kept_by_class
    write_jsonl(kept, args.out)
    write_json(report.as_dict(), args.report)
    print(json.dumps(report.as_dict(), indent=2))
    return 0


def _cmd_select(args: argparse.Namespace) -> int:
    classes = load_class_list(args.classes)
    force = set(int(value) for value in args.force_classes.split(",") if value)
    records = load_manifest(args.manifest)
    selected, _, report = select_records(
        records,
        SelectionPolicy(
            min_images=args.min_images,
            max_per_class=args.max_per_class,
            max_classes=args.max_classes,
            force_classes=force,
            seed=args.seed,
        ),
    )
    selected_class_ids = {record.class_id for record in selected if not record.is_negative}
    unknown = selected_class_ids - set(classes.class_ids)
    if unknown:
        raise SystemExit(f"selected records use class ids not in {args.classes}: {sorted(unknown)}")
    write_jsonl(selected, args.out)
    write_json(report.as_dict(), args.report)
    print(json.dumps(report.as_dict(), indent=2))
    return 0


def _cmd_split(args: argparse.Namespace) -> int:
    records = load_manifest(args.manifest)
    output, report = assign_splits(
        records,
        val_fraction=args.val_fraction,
        test_fraction=args.test_fraction,
        seed=args.seed,
        respect_existing=not args.ignore_official,
    )
    write_jsonl(output, args.out)
    for split in ("train", "val", "test"):
        split_path = Path(args.out).with_name(f"{split}.jsonl")
        write_jsonl([record for record in output if record.split == split], split_path)
    write_json(report.as_dict(), args.report)
    print(json.dumps(report.as_dict(), indent=2))
    return 0


def _cmd_stats(args: argparse.Namespace) -> int:
    records = load_manifest(args.manifest)
    by_split = Counter(record.split or "unassigned" for record in records)
    by_class = Counter(record.class_id for record in records if not record.is_negative)
    by_source = Counter(record.source for record in records)
    summary = {
        "records": len(records),
        "by_split": dict(by_split),
        "by_source": dict(by_source),
        "classes": len(by_class),
        "class_counts": dict(sorted(by_class.items())),
        "min_class": min(by_class.values()) if by_class else 0,
        "max_class": max(by_class.values()) if by_class else 0,
    }
    print(json.dumps(summary, indent=2))
    if args.out:
        write_json(summary, args.out)
    return 0


def _cmd_train_classifier(args: argparse.Namespace) -> int:
    from floralens_ml.train.classifier import load_config, train_classifier

    config = load_config(args.config)
    summary = train_classifier(config)
    print(json.dumps(summary, indent=2))
    return 0


def _cmd_export_onnx(args: argparse.Namespace) -> int:
    from floralens_ml.export.onnx import export_onnx

    contract = export_onnx(
        args.checkpoint,
        args.classes,
        args.out,
        model_id=args.model_id,
        input_size=args.input_size,
        opset=args.opset,
    )
    print(json.dumps(contract, indent=2))
    return 0


def _cmd_quantize(args: argparse.Namespace) -> int:
    from floralens_ml.export.quantize import quantize_dynamic, update_contract_for_file

    output = quantize_dynamic(args.onnx, args.out)
    if args.contract:
        update_contract_for_file(args.contract, output)
    print(f"wrote {output}")
    return 0


def _cmd_diagnose(args: argparse.Namespace) -> int:
    from floralens_ml.rules import diagnose, load_rules

    rules = load_rules(args.rules)
    context = load_yaml(args.context) if args.context else {}
    results = diagnose(rules, args.symptoms.split(","), context)
    print(json.dumps([result.model_dump() for result in results], indent=2))
    return 0


def _cmd_show_config(args: argparse.Namespace) -> int:
    print(json.dumps(load_yaml(args.path), indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="floralens", description="FloraLens ML pipeline")
    sub = parser.add_subparsers(dest="command", required=True)

    validate = sub.add_parser("validate-classes", help="validate a class list YAML")
    validate.add_argument("path")
    validate.set_defaults(func=_cmd_validate_classes)

    import_folder_cmd = sub.add_parser("import-folder", help="import a class-folder image tree")
    import_folder_cmd.add_argument("root")
    import_folder_cmd.add_argument("mapping")
    import_folder_cmd.add_argument("--out", required=True)
    import_folder_cmd.add_argument("--source", default="own")
    import_folder_cmd.add_argument("--group-by", choices=["filename", "parent", "grandparent"], default="parent")
    import_folder_cmd.add_argument("--observation-regex")
    import_folder_cmd.add_argument("--license")
    import_folder_cmd.add_argument("--author")
    import_folder_cmd.set_defaults(func=_cmd_import_folder)

    inat = sub.add_parser("download-inat", help="download iNaturalist photos for a class list")
    inat.add_argument("--classes", required=True)
    inat.add_argument("--out", required=True)
    inat.add_argument("--manifest", required=True)
    inat.add_argument("--place-id", type=int)
    inat.add_argument("--max-per-class", type=int, default=300)
    inat.add_argument("--photo-license", default="cc0,cc-by,cc-by-sa")
    inat.add_argument("--term-id", type=int, default=1)
    inat.add_argument("--term-value-id", type=int)
    inat.add_argument("--life-stage-label")
    inat.set_defaults(func=_cmd_download_inat)

    merge = sub.add_parser("merge", help="merge JSONL manifests")
    merge.add_argument("inputs", nargs="+")
    merge.add_argument("--out", required=True)
    merge.set_defaults(func=_cmd_merge)

    clean = sub.add_parser("clean", help="dedupe and quality-filter a manifest")
    clean.add_argument("--manifest", required=True)
    clean.add_argument("--out", required=True)
    clean.add_argument("--report", required=True)
    clean.add_argument("--hash-threshold", type=int, default=5)
    clean.add_argument("--quality", action="store_true")
    clean.add_argument("--min-short-side", type=int, default=256)
    clean.add_argument("--min-blur", type=float, default=20.0)
    clean.set_defaults(func=_cmd_clean)

    select = sub.add_parser("select", help="drop rare classes and cap common classes")
    select.add_argument("--manifest", required=True)
    select.add_argument("--classes", required=True)
    select.add_argument("--out", required=True)
    select.add_argument("--report", required=True)
    select.add_argument("--min-images", type=int, default=80)
    select.add_argument("--max-per-class", type=int, default=500)
    select.add_argument("--max-classes", type=int)
    select.add_argument("--force-classes", default="")
    select.add_argument("--seed", type=int, default=42)
    select.set_defaults(func=_cmd_select)

    split = sub.add_parser("split", help="assign observation-grouped splits")
    split.add_argument("--manifest", required=True)
    split.add_argument("--out", required=True)
    split.add_argument("--report", required=True)
    split.add_argument("--val-fraction", type=float, default=0.1)
    split.add_argument("--test-fraction", type=float, default=0.1)
    split.add_argument("--seed", type=int, default=42)
    split.add_argument("--ignore-official", action="store_true")
    split.set_defaults(func=_cmd_split)

    stats = sub.add_parser("stats", help="summarize a manifest")
    stats.add_argument("--manifest", required=True)
    stats.add_argument("--out")
    stats.set_defaults(func=_cmd_stats)

    train = sub.add_parser("train-classifier", help="train a classifier from a YAML config")
    train.add_argument("--config", required=True)
    train.set_defaults(func=_cmd_train_classifier)

    export = sub.add_parser("export-onnx", help="export a checkpoint to ONNX + contract")
    export.add_argument("--checkpoint", required=True)
    export.add_argument("--classes", required=True)
    export.add_argument("--out", required=True)
    export.add_argument("--model-id", required=True)
    export.add_argument("--input-size", type=int)
    export.add_argument("--opset", type=int, default=17)
    export.set_defaults(func=_cmd_export_onnx)

    quantize = sub.add_parser("quantize", help="dynamic INT8 quantization")
    quantize.add_argument("--onnx", required=True)
    quantize.add_argument("--out", required=True)
    quantize.add_argument("--contract")
    quantize.set_defaults(func=_cmd_quantize)

    diagnose = sub.add_parser("diagnose", help="run the health rules")
    diagnose.add_argument("--rules", default="shared/rules/health.yaml")
    diagnose.add_argument("--symptoms", required=True)
    diagnose.add_argument("--context")
    diagnose.set_defaults(func=_cmd_diagnose)

    show = sub.add_parser("show-config", help="print a YAML config")
    show.add_argument("path")
    show.set_defaults(func=_cmd_show_config)

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
