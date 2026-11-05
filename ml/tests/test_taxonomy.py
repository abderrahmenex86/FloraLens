from __future__ import annotations

from pathlib import Path

from floralens_ml.taxonomy import load_class_list

ROOT = Path(__file__).resolve().parents[2]


def test_plant_seed_list_is_valid() -> None:
    classes = load_class_list(ROOT / "shared/classes/plants.yaml")
    assert classes.target == "plants"
    assert len(classes.classes) >= 8
    assert len(classes.label_map) == len(classes.classes)
    assert len(set(classes.class_ids)) == len(classes.classes)
    assert classes.by_id(0).scientific_name == "Bougainvillea"
    assert classes.by_taxon(61398).common_name == "Sweet basil"
    assert len(classes.sha256()) == 64


def test_insect_and_disease_lists_are_valid() -> None:
    insects = load_class_list(ROOT / "shared/classes/insects.yaml")
    disease = load_class_list(ROOT / "shared/classes/disease.yaml")
    assert insects.target == "insects"
    assert disease.target == "disease"
    assert insects.by_id(0).role == "pest"
    assert disease.by_id(0).kind == "healthy"
    assert disease.by_id(20).kind == "abiotic"


def test_hierarchy_is_aligned_with_class_order() -> None:
    classes = load_class_list(ROOT / "shared/classes/plants.yaml")
    families, genera = classes.hierarchy()
    assert len(families) == len(classes.classes)
    assert len(genera) == len(classes.classes)
    index = classes.label_map[1]
    assert families[index] == "Solanaceae"
    assert genera[index] == "Cestrum"
