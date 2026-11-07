#!/usr/bin/env python3
"""Regenerate the README figures from the numbers in docs/model-screen.md.

    python3 tools/make_readme_plots.py

Writes docs/plots/architecture-screen.png, final-models.png, datasets.png and
preprocessing.png. Requires matplotlib, numpy and Pillow.
"""
from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import ListedColormap
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "plots"
GREEN = "#2D5A27"
LIGHT = "#84B026"
ORANGE = "#D97706"
GREY = "#6B7280"

plt.rcParams.update(
    {
        "font.family": "DejaVu Sans",
        "font.size": 10,
        "axes.titleweight": "bold",
        "axes.spines.top": False,
        "axes.spines.right": False,
        "figure.dpi": 200,
    }
)


def save(fig: plt.Figure, name: str) -> None:
    path = OUT / name
    fig.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(path.relative_to(ROOT))


def source(fig: plt.Figure, text: str) -> None:
    fig.text(0.01, 0.01, text, fontsize=7, color=GREY)


def architecture_screen() -> None:
    models = [
        "RepViT-M1",
        "FastViT-T8",
        "MobileNetV3-L",
        "MobileNetV4-S",
        "EfficientViT-M2",
    ]
    top1 = [65.4, 62.4, 63.0, 60.3, 54.1]
    f1 = [0.428, 0.405, 0.389, 0.366, 0.344]

    y = np.arange(len(models))
    fig, (left, right) = plt.subplots(
        1, 2, figsize=(11, 4.2), constrained_layout=True
    )
    left.barh(y, top1, height=0.5, color=GREEN)
    for index, value in enumerate(top1):
        left.text(value + 1, index, f"{value:.1f}%", va="center", fontsize=8)
    left.set_yticks(y, models)
    left.invert_yaxis()
    left.set_xlim(0, 75)
    left.set_xlabel("Percent")
    left.set_title("Top-1")

    right.barh(y, f1, height=0.5, color=LIGHT)
    for index, value in enumerate(f1):
        right.text(value + 0.01, index, f"{value:.3f}", va="center", fontsize=8)
    right.set_yticks(y, models)
    right.invert_yaxis()
    right.set_xlim(0, 0.5)
    right.set_xlabel("Macro-F1")
    right.set_title("Macro-F1")

    fig.suptitle("Architecture screen, 12 epochs", fontsize=13, fontweight="bold")
    save(fig, "architecture-screen.png")


def final_models() -> None:
    models = ["Plant gate", "Garden", "Insects"]
    top1 = [96.5, 67.9, 83.1]
    top5 = [None, 87.7, 96.0]
    f1 = [0.956, 0.670, 0.736]
    sizes = [5.9, 10.6, 19.0]
    labels = [
        f"{name}\n{size:.1f} MB" for name, size in zip(models, sizes)
    ]

    fig, (left, right) = plt.subplots(
        1, 2, figsize=(11, 4.4), constrained_layout=True
    )
    y = np.arange(len(models))
    left.barh(y - 0.19, top1, height=0.36, color=GREEN, label="Top-1")
    left.barh(
        y + 0.19,
        [value if value is not None else 0 for value in top5],
        height=0.36,
        color=LIGHT,
        label="Top-5",
    )
    for index, value in enumerate(top1):
        left.text(value + 1, index - 0.19, f"{value:.1f}%", va="center", fontsize=8)
    for index, value in enumerate(top5):
        if value is None:
            left.text(2, index + 0.19, "n/a", va="center", fontsize=8, color=GREY)
        else:
            left.text(value + 1, index + 0.19, f"{value:.1f}%", va="center", fontsize=8)
    left.set_yticks(y, labels)
    left.invert_yaxis()
    left.set_xlim(0, 110)
    left.set_xlabel("Percent")
    left.set_title("Accuracy, held-out test split")

    right.barh(y, [value for value in f1], height=0.5, color=LIGHT)
    for index, value in enumerate(f1):
        right.text(value + 0.015, index, f"{value:.3f}", va="center", fontsize=8)
    right.set_yticks(y, models)
    right.invert_yaxis()
    right.set_xlim(0, 1.05)
    right.set_xlabel("Macro-F1")
    right.set_title("Macro-F1")
    save(fig, "final-models.png")


def datasets() -> None:
    labels = [
        "Pl@ntNet-300K, used\n(306k extracted)",
        "GBIF garden",
        "GBIF insects",
        "COCO val2017\n(gate negatives)",
        "Pl@ntNet leaves\n(no-insect)",
        "App photos\n(gate positives)",
    ]
    values = [106_000, 20_268, 6_311, 5_000, 3_000, 1_793]
    colors = [GREEN, GREEN, GREEN, LIGHT, LIGHT, LIGHT]

    fig, ax = plt.subplots(figsize=(9, 4.8), constrained_layout=True)
    y = np.arange(len(labels))
    ax.barh(y, values, color=colors, height=0.55)
    for index, value in enumerate(values):
        ax.text(value * 1.12, index, f"{value:,}", va="center", fontsize=8)
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xscale("log")
    ax.set_xlim(1_000, 300_000)
    ax.set_xlabel("Images (log scale)")
    ax.set_title("Data behind the models and the gate")
    source(fig, "Source: docs/model-screen.md")
    save(fig, "datasets.png")


def preprocessing() -> None:
    image = Image.open(
        ROOT / "assets/images/garden_thumbs/82.webp"
    ).convert("RGB")
    width, height = image.size
    classifier = image.resize((224, 224), Image.BILINEAR)
    gate = image.resize((128, 128), Image.BILINEAR)
    pixels = np.asarray(classifier, dtype=np.float32)

    luma = 0.2126 * pixels[:, :, 0] + 0.7152 * pixels[:, :, 1] + 0.0722 * pixels[:, :, 2]
    mean = float(luma.mean())
    std = float(luma.std())

    tile = 8
    rows = 224 // tile
    cols = 224 // tile
    tile_std = np.empty((rows, cols), dtype=np.float32)
    for row in range(rows):
        for col in range(cols):
            patch = luma[
                row * tile : (row + 1) * tile,
                col * tile : (col + 1) * tile,
            ]
            tile_std[row, col] = patch.std()
    flat = tile_std < 4
    flat_ratio = float(flat.mean())

    fig, axes = plt.subplots(2, 3, figsize=(12, 7.6), constrained_layout=True)
    axes = axes.ravel()

    axes[0].imshow(image)
    axes[0].set_title(f"Original, {width} x {height}")
    axes[0].axis("off")

    axes[1].imshow(classifier)
    axes[1].set_title("Classifier input, 224 x 224 (squashed)")
    axes[1].axis("off")

    axes[2].imshow(gate)
    axes[2].set_title("Presence gate, 128 x 128")
    axes[2].axis("off")

    axes[3].imshow(luma, cmap="gray")
    axes[3].set_title(f"Luma, mean {mean:.1f}, std {std:.1f}")
    axes[3].axis("off")

    axes[4].imshow(
        flat.astype(np.uint8),
        cmap=ListedColormap(["#E8F0E2", ORANGE]),
        vmin=0,
        vmax=1,
        interpolation="nearest",
    )
    axes[4].set_title(
        f"Flat 8 x 8 tiles: {flat.sum()}/{flat.size} ({flat_ratio:.0%})"
    )
    axes[4].axis("off")

    axes[5].hist(tile_std.ravel(), bins=30, color=GREEN, alpha=0.85)
    axes[5].axvline(4, color=ORANGE, linestyle="--", linewidth=1.5)
    axes[5].text(4.2, axes[5].get_ylim()[1] * 0.9, "flat < 4", color=ORANGE, fontsize=8)
    axes[5].set_title("Tile contrast")
    axes[5].set_xlabel("8 x 8 tile std dev")
    axes[5].set_ylabel("Tiles")
    axes[5].set_yscale("log")

    fig.suptitle(
        "Preprocessing: what the models receive and what the pixel gate checks",
        fontsize=13,
        fontweight="bold",
    )
    source(
        fig,
        "Source: lib/imageGate.ts and lib/tensorUtils.ts. ImageNet normalisation "
        "follows the resize. Strawberry cover from the library.",
    )
    save(fig, "preprocessing.png")

    print(
        f"luma mean={mean:.2f} std={std:.2f} flat_ratio={flat_ratio:.3f} "
        f"gate_pass={mean >= 12 and std >= 6 and flat_ratio <= 0.85}"
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    architecture_screen()
    final_models()
    datasets()
    preprocessing()


if __name__ == "__main__":
    main()
