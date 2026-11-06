#!/usr/bin/env python3
"""Rebuild the launcher assets from the leaf mark in icon.png.

The leaf silhouette is the light area of the current icon. Everything is
regenerated from that mask so the logo stays consistent across sizes.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "assets" / "images"
GREEN = (45, 90, 39)
WHITE = (255, 255, 255)


def leaf_mask() -> Image.Image:
    src = Image.open(IMAGES / "icon.png").convert("RGB")
    array = np.asarray(src).astype(np.float32)
    luminance = array.mean(axis=2)
    alpha = np.clip((luminance - 150) / 80, 0, 1)
    mask = Image.fromarray((alpha * 255).astype(np.uint8), "L")
    return mask.crop(mask.getbbox())


def leaf_layer(mask: Image.Image, height: int, color: tuple[int, int, int]):
    width = round(mask.width * height / mask.height)
    scaled = mask.resize((width, height), Image.LANCZOS)
    layer = Image.new("RGBA", (width, height), color + (255,))
    layer.putalpha(scaled)
    return layer


def canvas(size: int, background: tuple[int, int, int] | None) -> Image.Image:
    if background is None:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))
    return Image.new("RGBA", (size, size), background + (255,))


def place(base: Image.Image, layer: Image.Image) -> Image.Image:
    left = (base.width - layer.width) // 2
    top = (base.height - layer.height) // 2
    base.alpha_composite(layer, (left, top))
    return base


def main() -> None:
    mask = leaf_mask()

    icon = place(canvas(1024, WHITE), leaf_layer(mask, 520, GREEN))
    icon.convert("RGB").save(IMAGES / "icon.png", optimize=True)

    foreground = place(canvas(1024, None), leaf_layer(mask, 560, GREEN))
    foreground.save(IMAGES / "android-icon-foreground.png", optimize=True)

    monochrome = place(canvas(1024, None), leaf_layer(mask, 560, WHITE))
    monochrome.save(IMAGES / "android-icon-monochrome.png", optimize=True)

    background = Image.new("RGB", (1024, 1024), WHITE)
    background.save(IMAGES / "android-icon-background.png", optimize=True)

    splash = place(canvas(1024, None), leaf_layer(mask, 640, GREEN))
    splash.save(IMAGES / "splash-icon.png", optimize=True)

    favicon = place(canvas(48, WHITE), leaf_layer(mask, 30, GREEN))
    favicon.convert("RGB").save(IMAGES / "favicon.png", optimize=True)

    print("rebuilt icon, adaptive foreground/background/monochrome, splash, favicon")


if __name__ == "__main__":
    main()
