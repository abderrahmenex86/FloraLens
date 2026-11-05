from __future__ import annotations

import json
import random
import time
from pathlib import Path
from typing import Any

import numpy as np

from floralens_ml.config import ensure_dir, project_root
from floralens_ml.data.dataset import ManifestDataset, class_weights
from floralens_ml.data.schema import load_manifest
from floralens_ml.data.transforms import build_transforms
from floralens_ml.eval.metrics import classification_metrics
from floralens_ml.models.classifier import build_classifier
from floralens_ml.taxonomy import load_class_list


def _seed_everything(seed: int) -> None:
    import torch

    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def _param_groups(model, lr_head: float, lr_backbone: float, weight_decay: float):
    head_names = set()
    try:
        head = model.get_classifier()
        head_names = {name for name, _ in head.named_parameters()}
    except Exception:
        pass
    head_params, backbone_params = [], []
    for name, parameter in model.named_parameters():
        if not parameter.requires_grad:
            continue
        if name in head_names or name.startswith("classifier") or name.startswith("head"):
            head_params.append(parameter)
        else:
            backbone_params.append(parameter)
    return [
        {"params": backbone_params, "lr": lr_backbone, "weight_decay": weight_decay},
        {"params": head_params, "lr": lr_head, "weight_decay": weight_decay},
    ]


def train_classifier(config: dict[str, Any]) -> dict[str, Any]:
    import torch
    from torch.utils.data import DataLoader, WeightedRandomSampler
    from tqdm import tqdm

    _seed_everything(int(config.get("seed", 42)))
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    output_dir = ensure_dir(config["output_dir"])
    class_list = load_class_list(config["class_list"])
    class_to_index = class_list.label_map
    class_ids = class_list.index_to_class_id

    records = load_manifest(config["data_manifest"])
    train_records = [record for record in records if record.split == "train"]
    val_records = [record for record in records if record.split == "val"]
    if not train_records or not val_records:
        raise ValueError("manifest must contain train and val splits")

    train_dataset = ManifestDataset(
        train_records,
        class_to_index,
        build_transforms(int(config.get("input_size", 224)), train=True),
    )
    val_dataset = ManifestDataset(
        val_records,
        class_to_index,
        build_transforms(int(config.get("input_size", 224)), train=False),
    )
    sampler = None
    shuffle = True
    if config.get("class_balance", True):
        weights = class_weights(train_dataset.records, class_to_index)
        sampler = WeightedRandomSampler(weights, num_samples=len(weights), replacement=True)
        shuffle = False
    train_loader = DataLoader(
        train_dataset,
        batch_size=int(config.get("batch_size", 128)),
        sampler=sampler,
        shuffle=shuffle,
        num_workers=int(config.get("num_workers", 8)),
        pin_memory=True,
        drop_last=True,
        persistent_workers=int(config.get("num_workers", 8)) > 0,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=int(config.get("batch_size", 128)),
        shuffle=False,
        num_workers=int(config.get("num_workers", 8)),
        pin_memory=True,
    )

    model = build_classifier(
        config["model_name"],
        num_classes=len(class_list.classes),
        pretrained=bool(config.get("pretrained", True)),
        drop_rate=float(config.get("drop_rate", 0.0)),
        drop_path_rate=float(config.get("drop_path_rate", 0.0)),
    ).to(device)
    optimizer = torch.optim.AdamW(
        _param_groups(
            model,
            float(config.get("lr_head", 1e-3)),
            float(config.get("lr_backbone", 1e-4)),
            float(config.get("weight_decay", 0.05)),
        )
    )
    epochs = int(config.get("epochs", 30))
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    criterion = torch.nn.CrossEntropyLoss(label_smoothing=float(config.get("label_smoothing", 0.1)))
    amp = str(config.get("amp", "bf16"))
    use_amp = device.type == "cuda" and amp in {"bf16", "fp16"}
    scaler = torch.amp.GradScaler("cuda", enabled=use_amp and amp == "fp16")

    history: list[dict[str, Any]] = []
    best_macro_f1 = -1.0
    start_epoch = 0
    resume_from = config.get("resume_from")
    if resume_from:
        checkpoint = torch.load(resume_from, map_location=device)
        model.load_state_dict(checkpoint["model"])
        optimizer.load_state_dict(checkpoint["optimizer"])
        scheduler.load_state_dict(checkpoint["scheduler"])
        start_epoch = checkpoint["epoch"] + 1
        best_macro_f1 = checkpoint.get("best_macro_f1", best_macro_f1)

    for epoch in range(start_epoch, epochs):
        model.train()
        running_loss = 0.0
        for images, targets, _ in tqdm(train_loader, desc=f"train {epoch + 1}/{epochs}"):
            images = images.to(device, non_blocking=True)
            targets = targets.to(device, non_blocking=True)
            optimizer.zero_grad(set_to_none=True)
            with torch.autocast(
                device_type=device.type,
                dtype=torch.bfloat16 if amp == "bf16" else torch.float16,
                enabled=use_amp,
            ):
                logits = model(images)
                loss = criterion(logits, targets)
            if scaler.is_enabled():
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()
            else:
                loss.backward()
                optimizer.step()
            running_loss += float(loss.detach()) * images.size(0)
        scheduler.step()

        model.eval()
        all_logits, all_targets = [], []
        with torch.no_grad():
            for images, targets, _ in val_loader:
                images = images.to(device, non_blocking=True)
                logits = model(images)
                all_logits.append(logits.float().cpu().numpy())
                all_targets.append(targets.numpy())
        logits_array = np.concatenate(all_logits)
        targets_array = np.concatenate(all_targets)
        metrics = classification_metrics(
            logits_array, targets_array, len(class_list.classes), class_ids
        )
        metrics["epoch"] = epoch + 1
        metrics["train_loss"] = running_loss / max(1, len(train_dataset))
        metrics["lr_head"] = optimizer.param_groups[-1]["lr"]
        history.append(metrics)
        print(json.dumps(metrics))

        state = {
            "model": model.state_dict(),
            "optimizer": optimizer.state_dict(),
            "scheduler": scheduler.state_dict(),
            "epoch": epoch,
            "best_macro_f1": best_macro_f1,
            "model_name": config["model_name"],
            "class_ids": class_ids,
            "config": config,
        }
        torch.save(state, output_dir / "last.pt")
        if metrics["macro_f1"] > best_macro_f1:
            best_macro_f1 = float(metrics["macro_f1"])
            state["best_macro_f1"] = best_macro_f1
            torch.save(state, output_dir / "best.pt")

        with open(output_dir / "history.json", "w", encoding="utf-8") as fh:
            json.dump(history, fh, indent=2)
            fh.write("\n")

    summary = {
        "model_name": config["model_name"],
        "class_count": len(class_list.classes),
        "best_macro_f1": best_macro_f1,
        "epochs": epochs,
        "device": str(device),
        "config": config,
        "finished_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    with open(output_dir / "summary.json", "w", encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2)
        fh.write("\n")
    return summary


def load_config(path: str | Path) -> dict[str, Any]:
    from floralens_ml.config import load_yaml

    config = load_yaml(path)
    config.setdefault("output_dir", str(Path("ml/runs") / Path(path).stem))
    root = project_root()
    for key in ("class_list", "data_manifest", "output_dir", "resume_from"):
        value = config.get(key)
        if value and not Path(value).is_absolute():
            config[key] = str(root / value)
    return config
