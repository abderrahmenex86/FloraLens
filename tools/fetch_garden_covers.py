#!/usr/bin/env python3
"""Fetch one cover photo per garden class from Wikipedia/Wikimedia.

GBIF image downloads are too slow from this network, and Wikipedia's CDN is
fast. Writes `assets/images/garden/<class_id>_<slug>/1.jpg`, the folder layout
`tools/build_plant_library.py` expects.

    python tools/fetch_garden_covers.py --classes shared/classes/garden.yaml
"""
from __future__ import annotations

import argparse
import io
import re
import time
from pathlib import Path

import requests
import yaml
from PIL import Image

SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/"
HEADERS = {"User-Agent": "FloraLens/1.0 (garden reference covers)"}
MAX_WIDTH = 900


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def fetch_cover(session: requests.Session, titles: list[str]) -> bytes | None:
    for title in titles:
        if not title:
            continue
        try:
            for attempt in range(4):
                response = session.get(
                    SUMMARY + requests.utils.quote(title.replace(" ", "_"), safe=""),
                    timeout=20,
                )
                if response.status_code == 429:
                    time.sleep(3 * (attempt + 1))
                    continue
                break
            if response.status_code != 200:
                continue
            payload = response.json()
            image = payload.get("thumbnail") or payload.get("originalimage")
            url = (image or {}).get("source")
            if not url:
                continue
            # upload.wikimedia.org rate-limits hard; the thumbnail CDN does not.
            for attempt in range(5):
                picture = session.get(url, timeout=60)
                if picture.status_code == 429:
                    time.sleep(10 * (attempt + 1))
                    continue
                picture.raise_for_status()
                return picture.content
        except Exception:
            continue
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--classes", required=True, type=Path)
    parser.add_argument("--out", default="assets/images/garden", type=Path)
    args = parser.parse_args()

    spec = yaml.safe_load(args.classes.read_text())
    classes = spec["classes"]
    session = requests.Session()
    session.headers.update(HEADERS)

    saved = 0
    missing: list[str] = []

    for entry in classes:
        class_id = int(entry["class_id"])
        scientific = entry["scientific_name"]
        common = entry.get("common_name") or ""
        folder = args.out / f"{class_id}_{slug(scientific)}"
        target = folder / "1.jpg"
        if target.exists() and target.stat().st_size > 2048:
            saved += 1
            continue

        data = fetch_cover(session, [scientific, scientific.replace("×", "").strip(), common])
        if not data:
            missing.append(f"{class_id}:{scientific}")
            print(f"[{class_id:03d}] {scientific}: no image")
            continue

        try:
            with Image.open(io.BytesIO(data)) as image:
                image = image.convert("RGB")
                if image.width > MAX_WIDTH:
                    height = round(image.height * MAX_WIDTH / image.width)
                    image = image.resize((MAX_WIDTH, height), Image.LANCZOS)
                folder.mkdir(parents=True, exist_ok=True)
                image.save(target, "JPEG", quality=88)
            saved += 1
            print(f"[{class_id:03d}] {scientific}: ok", flush=True)
            time.sleep(1.0)
        except Exception:
            missing.append(f"{class_id}:{scientific}")
            print(f"[{class_id:03d}] {scientific}: bad image", flush=True)

    print(f"saved {saved} covers, {len(missing)} missing")
    if missing:
        print("missing:", ", ".join(missing))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
