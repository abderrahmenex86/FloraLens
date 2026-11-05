from __future__ import annotations

import time
from pathlib import Path
from typing import Any

from PIL import Image
from tqdm import tqdm

from floralens_ml.config import ensure_dir, sha256_file
from floralens_ml.data.schema import ImageRecord
from floralens_ml.taxonomy import ClassList

INAT_API = "https://api.inaturalist.org/v1/observations"
PHOTO_SIZES = ("large", "medium", "original")


def _photo_url(photo: dict[str, Any]) -> str | None:
    url = photo.get("url")
    if not url:
        return None
    for size in PHOTO_SIZES:
        candidate = url.replace("/square.", f"/{size}.")
        if candidate != url:
            return candidate
    return url


def fetch_observations(
    *,
    taxon_id: int,
    place_id: int | None = None,
    page: int = 1,
    per_page: int = 200,
    photo_license: str = "cc0,cc-by,cc-by-sa",
    term_id: int | None = None,
    term_value_id: int | None = None,
) -> dict[str, Any]:
    import requests

    params: dict[str, Any] = {
        "taxon_id": taxon_id,
        "quality_grade": "research",
        "photo_license": photo_license,
        "per_page": per_page,
        "page": page,
        "order_by": "id",
        "order": "asc",
    }
    if place_id is not None:
        params["place_id"] = place_id
    if term_id is not None:
        params["term_id"] = term_id
    if term_value_id is not None:
        params["term_value_id"] = term_value_id
    response = requests.get(INAT_API, params=params, timeout=60)
    response.raise_for_status()
    return response.json()


def download_inat(
    classes: ClassList,
    out_dir: str | Path,
    *,
    place_id: int | None = None,
    max_per_class: int = 300,
    photo_license: str = "cc0,cc-by,cc-by-sa",
    life_stage_term: tuple[int, int] | None = None,
    life_stage_label: str | None = None,
    sleep_seconds: float = 0.2,
) -> list[ImageRecord]:
    """Download iNaturalist photos for taxa that have a ``taxon_id``.

    Non-commercial use can include NC licenses by passing
    ``--photo-license cc0,cc-by,cc-by-sa,cc-by-nc,cc-by-nc-sa``; keep the
    default permissive set if the data might ever be reused commercially.
    """
    out_root = ensure_dir(out_dir)
    records: list[ImageRecord] = []
    targets = [entry for entry in classes.classes if entry.taxon_id is not None]
    for entry in tqdm(targets, desc="iNat taxa"):
        class_dir = ensure_dir(out_root / str(entry.class_id))
        downloaded = 0
        page = 1
        while downloaded < max_per_class:
            payload = fetch_observations(
                taxon_id=entry.taxon_id or 0,
                place_id=place_id,
                page=page,
                term_id=life_stage_term[0] if life_stage_term else None,
                term_value_id=life_stage_term[1] if life_stage_term else None,
                photo_license=photo_license,
            )
            results = payload.get("results", [])
            if not results:
                break
            for observation in results:
                for photo in observation.get("photos", [])[:1]:
                    url = _photo_url(photo)
                    if not url:
                        continue
                    photo_id = photo.get("id", "photo")
                    destination = class_dir / f"{observation['id']}_{photo_id}.jpg"
                    if destination.exists():
                        downloaded += 1
                        continue
                    try:
                        import requests

                        response = requests.get(url, timeout=60)
                        response.raise_for_status()
                        destination.write_bytes(response.content)
                        with Image.open(destination) as image:
                            width, height = image.size
                    except Exception:
                        destination.unlink(missing_ok=True)
                        continue
                    records.append(
                        ImageRecord(
                            image_id=f"inat:{observation['id']}:{photo_id}",
                            source="inaturalist",
                            source_id=str(observation["id"]),
                            observation_id=str(observation["id"]),
                            class_id=entry.class_id,
                            taxon_id=entry.taxon_id,
                            scientific_name=entry.scientific_name,
                            life_stage=life_stage_label,
                            license=photo.get("license_code"),
                            author=photo.get("attribution"),
                            url=url,
                            path=str(destination),
                            sha256=sha256_file(destination),
                            width=width,
                            height=height,
                        )
                    )
                    downloaded += 1
                    if downloaded >= max_per_class:
                        break
                if downloaded >= max_per_class:
                    break
            page += 1
            time.sleep(sleep_seconds)
    return records
