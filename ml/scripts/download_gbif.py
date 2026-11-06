#!/usr/bin/env python3
"""Download licensed GBIF photos for the garden/houseplant class list.

Resolves each class name to a GBIF taxon key, searches human observations that
have still images, and downloads them grouped by occurrence id (one occurrence
can carry several photos, which becomes the split group).

    python ml/scripts/download_gbif.py \
        --classes shared/classes/plants.yaml \
        --out data/raw/gbif \
        --per-class 500
"""
from __future__ import annotations

import argparse
import json
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests
import yaml

API = "https://api.gbif.org/v1"
# GBIF normalises occurrence licenses to these URLs; SA variants come back as
# UNSUPPORTED, so they are not selectable through the search filter.
LICENSES = [
    "http://creativecommons.org/publicdomain/zero/1.0/legalcode",
    "http://creativecommons.org/licenses/by/4.0/legalcode",
    "http://creativecommons.org/licenses/by-nc/4.0/legalcode",
]
PAGE = 300


def session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": "FloraLens-ml/0.1 (dataset collection)"})
    return s


def match_taxon(s: requests.Session, name: str) -> dict | None:
    response = s.get(f"{API}/species/match", params={"name": name}, timeout=30)
    response.raise_for_status()
    payload = response.json()
    if payload.get("matchType") in {"NONE", "HIGHERRANK"}:
        return None
    return payload


def search_occurrences(
    s: requests.Session, taxon_key: int, limit: int
) -> list[dict]:
    results: list[dict] = []
    offset = 0
    while len(results) < limit:
        params = {
            "taxonKey": taxon_key,
            "mediaType": "StillImage",
            "basisOfRecord": "HUMAN_OBSERVATION",
            "limit": PAGE,
            "offset": offset,
        }
        for license_code in LICENSES:
            params.setdefault("license", [])
            params["license"].append(license_code)
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


def download(url: str, target: Path, s: requests.Session) -> bool:
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
    parser.add_argument("--workers", type=int, default=12)
    args = parser.parse_args()

    spec = yaml.safe_load(args.classes.read_text())
    classes = spec["classes"]
    images_dir = args.out / "images"
    media_path = args.out / "media.jsonl"
    media_path.parent.mkdir(parents=True, exist_ok=True)

    s = session()
    records: list[dict] = []
    failures = 0

    with open(media_path, "w", encoding="utf-8") as media_file, ThreadPoolExecutor(
        max_workers=args.workers
    ) as pool:
        for entry in classes:
            class_id = int(entry["class_id"])
            name = entry["scientific_name"]

            match = match_taxon(s, name)
            if not match:
                print(f"[skip] {name}: no GBIF match")
                continue
            taxon_key = match["usageKey"]
            rank = match.get("rank")

            occurrences = search_occurrences(s, taxon_key, args.per_class * 2)
            print(f"[{class_id:02d}] {name}: {len(occurrences)} occurrences")

            jobs = []
            seen_media = 0
            for occurrence in occurrences:
                if seen_media >= args.per_class:
                    break
                gbif_id = occurrence.get("key")
                for index, media in enumerate(occurrence.get("media") or []):
                    if seen_media >= args.per_class:
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
                                "scientific_name": entry["scientific_name"],
                                "gbif_id": gbif_id,
                                "observation_id": str(gbif_id),
                                "path": str(target),
                                "source_url": url,
                                "license": media.get("license"),
                                "author": media.get("creator")
                                or media.get("rightsHolder"),
                                "taxon_key": taxon_key,
                                "rank": rank,
                            },
                        )
                    )
                    seen_media += 1

            futures = [
                (pool.submit(download, url, target, s), record)
                for url, target, record in jobs
            ]
            for future, record in futures:
                if future.result():
                    records.append(record)
                else:
                    failures += 1

            print(
                f"    kept {sum(1 for r in records if r['class_id'] == class_id)} "
                f"images, {failures} failures so far",
                flush=True,
            )

    with open(media_path, "w", encoding="utf-8") as fh:
        for record in records:
            fh.write(json.dumps(record, ensure_ascii=False))
            fh.write("\n")

    print(f"wrote {len(records)} media records to {media_path}")
    print(f"failures: {failures}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
