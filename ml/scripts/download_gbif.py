#!/usr/bin/env python3
"""Download licensed GBIF photos for a class list, using aria2c when available.

Resolves each class name to a GBIF taxon key, searches human observations that
have still images, and downloads them grouped by occurrence id (one occurrence
can carry several photos, which becomes the split group).

    python ml/scripts/download_gbif.py \
        --classes shared/classes/garden.yaml \
        --out data/raw/gbif_garden \
        --per-class 200
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests
import yaml

API = "https://api.gbif.org/v1"
# GBIF accepts these enum names as repeated `license` params. The SA variants
# are not selectable (GBIF reports them as UNSUPPORTED), so they are omitted.
LICENSES = ["CC0_1_0", "CC_BY_4_0", "CC_BY_NC_4_0"]
PAGE = 300


def session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": "FloraLens-ml/0.1 (dataset collection)"})
    return s


def match_taxon(
    s: requests.Session, name: str, rank: str | None = None
) -> dict | None:
    attempts: list[dict[str, str]] = []
    if rank:
        attempts.append({"name": name, "rank": rank})
    attempts.append({"name": name})
    if "\u00d7" in name:
        plain = name.replace("\u00d7", "").strip()
        attempts.append({"name": plain})

    for params in attempts:
        response = s.get(f"{API}/species/match", params=params, timeout=30)
        response.raise_for_status()
        payload = response.json()
        if payload.get("matchType") not in {"NONE", "HIGHERRANK"} and payload.get(
            "usageKey"
        ):
            return payload
    return None


def search_occurrences(s: requests.Session, taxon_key: int, limit: int) -> list[dict]:
    results: list[dict] = []
    offset = 0
    while len(results) < limit:
        params: list[tuple[str, object]] = [
            ("taxonKey", taxon_key),
            ("mediaType", "StillImage"),
            ("basisOfRecord", "HUMAN_OBSERVATION"),
            ("limit", PAGE),
            ("offset", offset),
        ]
        for license_code in LICENSES:
            params.append(("license", license_code))
        response = s.get(f"{API}/occurrence/search", params=params, timeout=60)
        response.raise_for_status()
        payload = response.json()
        page = payload.get("results", [])
        if not page:
            break
        results.extend(page)
        offset += PAGE
        if offset >= payload.get("count", 0):
            break
        time.sleep(0.2)
    return results[:limit]


def aria2_download(jobs: list[tuple[str, Path]], workers: int) -> None:
    if not jobs:
        return
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as fh:
        for url, target in jobs:
            fh.write(f"{url}\n  out={target}\n")
        list_path = fh.name
    try:
        subprocess.run(
            [
                "aria2c",
                f"-j{workers}",
                "-x4",
                "-s4",
                "-c",
                "--auto-file-renaming=false",
                "--allow-overwrite=false",
                "--file-allocation=none",
                "--summary-interval=0",
                "-i",
                list_path,
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    finally:
        Path(list_path).unlink(missing_ok=True)


def request_download(url: str, target: Path, s: requests.Session) -> bool:
    if target.exists() and target.stat().st_size > 1024:
        return True
    try:
        response = s.get(url, timeout=60)
        response.raise_for_status()
        if len(response.content) < 1024:
            return False
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(response.content)
        return True
    except Exception:
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--classes", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--per-class", type=int, default=500)
    parser.add_argument("--workers", type=int, default=16)
    args = parser.parse_args()

    spec = yaml.safe_load(args.classes.read_text())
    classes = spec["classes"]
    images_dir = args.out / "images"
    media_path = args.out / "media.jsonl"
    media_path.parent.mkdir(parents=True, exist_ok=True)

    use_aria2 = shutil.which("aria2c") is not None
    print(f"downloader: {'aria2c' if use_aria2 else 'requests'}")

    s = session()
    records: list[dict] = []
    failures = 0

    for entry in classes:
        class_id = int(entry["class_id"])
        name = entry["scientific_name"]

        match = match_taxon(s, name, entry.get("rank"))
        if not match:
            print(f"[skip] {name}: no GBIF match", flush=True)
            continue
        taxon_key = match["usageKey"]
        rank = match.get("rank")

        occurrences = search_occurrences(s, taxon_key, args.per_class * 2)
        jobs: list[tuple[str, Path, dict]] = []
        for occurrence in occurrences:
            if len(jobs) >= args.per_class:
                break
            gbif_id = occurrence.get("key")
            for index, media in enumerate(occurrence.get("media") or []):
                if len(jobs) >= args.per_class:
                    break
                url = media.get("identifier")
                if not url:
                    continue
                suffix = Path(url.split("?")[0]).suffix.lower()
                if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
                    suffix = ".jpg"
                target = images_dir / f"{class_id:04d}" / f"{gbif_id}_{index}{suffix}"
                jobs.append(
                    (
                        url,
                        target,
                        {
                            "class_id": class_id,
                            "scientific_name": name,
                            "gbif_id": gbif_id,
                            "observation_id": str(gbif_id),
                            "path": str(target),
                            "source_url": url,
                            "license": media.get("license"),
                            "author": media.get("creator") or media.get("rightsHolder"),
                            "taxon_key": taxon_key,
                            "rank": rank,
                        },
                    )
                )

        for target in {t for _, t, _ in jobs}:
            target.parent.mkdir(parents=True, exist_ok=True)

        if use_aria2:
            aria2_download([(u, t) for u, t, _ in jobs], args.workers)
            ok_flags = [
                t.exists() and t.stat().st_size > 1024 for _, t, _ in jobs
            ]
        else:
            with ThreadPoolExecutor(max_workers=args.workers) as pool:
                ok_flags = [
                    f.result()
                    for f in [pool.submit(request_download, u, t, s) for u, t, _ in jobs]
                ]

        for ok, (_, _, record) in zip(ok_flags, jobs):
            if ok:
                records.append(record)
            else:
                failures += 1

        kept = sum(1 for r in records if r["class_id"] == class_id)
        print(f"[{class_id:03d}] {name}: {kept} images", flush=True)

    with open(media_path, "w", encoding="utf-8") as fh:
        for record in records:
            fh.write(json.dumps(record, ensure_ascii=False))
            fh.write("\n")

    print(f"wrote {len(records)} media records to {media_path}")
    print(f"failures: {failures}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
