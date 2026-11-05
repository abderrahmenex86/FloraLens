from __future__ import annotations

from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field


class RuleCondition(BaseModel):
    model_config = ConfigDict(extra="forbid")

    symptoms_all: list[str] = Field(default_factory=list)
    symptoms_any: list[str] = Field(default_factory=list)
    symptoms_none: list[str] = Field(default_factory=list)
    context: dict[str, str | list[str]] = Field(default_factory=dict)


class HealthRule(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    category: Literal["abiotic", "disease", "pest", "nutrient", "unknown"]
    confidence: float = Field(ge=0.0, le=1.0)
    when: RuleCondition
    advice: str
    evidence: list[str] = Field(default_factory=list)


class RuleSet(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: str
    rules: list[HealthRule]


class HealthResult(BaseModel):
    rule_id: str
    title: str
    category: str
    confidence: float
    advice: str
    evidence: list[str]


def load_rules(path: str | Path) -> RuleSet:
    with open(path, encoding="utf-8") as fh:
        raw = yaml.safe_load(fh)
    return RuleSet.model_validate(raw)


def _context_matches(condition: dict[str, Any], context: dict[str, str]) -> bool:
    for key, expected in condition.items():
        actual = context.get(key)
        if actual is None:
            return False
        allowed = expected if isinstance(expected, list) else [expected]
        if actual not in allowed:
            return False
    return True


def _rule_matches(rule: HealthRule, symptoms: set[str], context: dict[str, str]) -> bool:
    condition = rule.when
    if any(symptom not in symptoms for symptom in condition.symptoms_all):
        return False
    if condition.symptoms_any and not any(symptom in symptoms for symptom in condition.symptoms_any):
        return False
    if any(symptom in symptoms for symptom in condition.symptoms_none):
        return False
    return _context_matches(condition.context, context)


def diagnose(
    rules: RuleSet,
    symptoms: list[str] | set[str],
    context: dict[str, str] | None = None,
) -> list[HealthResult]:
    symptom_set = set(symptoms)
    context = context or {}
    matches: list[HealthResult] = []
    for rule in rules.rules:
        if not _rule_matches(rule, symptom_set, context):
            continue
        # Evidence raises confidence slightly but is capped at 0.99.
        score = min(0.99, rule.confidence + 0.02 * len(rule.evidence))
        matches.append(
            HealthResult(
                rule_id=rule.id,
                title=rule.title,
                category=rule.category,
                confidence=round(score, 3),
                advice=rule.advice,
                evidence=rule.evidence,
            )
        )
    matches.sort(key=lambda result: result.confidence, reverse=True)
    return matches
