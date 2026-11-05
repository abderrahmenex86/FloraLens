from __future__ import annotations

from pathlib import Path

from floralens_ml.rules import diagnose, load_rules

ROOT = Path(__file__).resolve().parents[2]


def test_overwatering_rule_matches() -> None:
    rules = load_rules(ROOT / "shared/rules/health.yaml")
    results = diagnose(
        rules,
        ["yellow_lower_leaves", "wilt", "mold_on_soil"],
        {"soil": "wet"},
    )
    assert results
    assert results[0].rule_id == "overwatering"
    assert results[0].category == "abiotic"
    assert 0.5 <= results[0].confidence <= 0.99


def test_root_rot_rule_requires_foul_smell() -> None:
    rules = load_rules(ROOT / "shared/rules/health.yaml")
    results = diagnose(rules, ["mushy_roots"], {"smell": "foul"})
    assert any(result.rule_id == "root_rot" for result in results)
    no_match = diagnose(rules, ["mushy_roots"], {"smell": "earthy"})
    assert not any(result.rule_id == "root_rot" for result in no_match)


def test_unknown_symptoms_abstain() -> None:
    rules = load_rules(ROOT / "shared/rules/health.yaml")
    assert diagnose(rules, ["unrecognised_symptom"], {}) == []
