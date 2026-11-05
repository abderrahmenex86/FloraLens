from __future__ import annotations

from typing import Any

import numpy as np


def top_k_accuracy(logits: np.ndarray, targets: np.ndarray, k: int = 1) -> float:
    if len(targets) == 0:
        return 0.0
    k = min(k, logits.shape[1])
    top = np.argsort(-logits, axis=1)[:, :k]
    return float((top == targets[:, None]).any(axis=1).mean())


def macro_f1(predictions: np.ndarray, targets: np.ndarray, num_classes: int) -> float:
    scores: list[float] = []
    for class_id in range(num_classes):
        tp = int(((predictions == class_id) & (targets == class_id)).sum())
        fp = int(((predictions == class_id) & (targets != class_id)).sum())
        fn = int(((predictions != class_id) & (targets == class_id)).sum())
        if tp + fp + fn == 0:
            continue
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        scores.append(2 * precision * recall / (precision + recall) if precision + recall else 0.0)
    return float(np.mean(scores)) if scores else 0.0


def per_class_recall(predictions: np.ndarray, targets: np.ndarray, num_classes: int) -> dict[int, float]:
    result: dict[int, float] = {}
    for class_id in range(num_classes):
        mask = targets == class_id
        if mask.any():
            result[class_id] = float((predictions[mask] == class_id).mean())
    return result


def expected_calibration_error(
    probabilities: np.ndarray,
    targets: np.ndarray,
    n_bins: int = 15,
) -> float:
    confidences = probabilities.max(axis=1)
    predictions = probabilities.argmax(axis=1)
    accuracies = (predictions == targets).astype(np.float32)
    bins = np.linspace(0.0, 1.0, n_bins + 1)
    error = 0.0
    for lower, upper in zip(bins[:-1], bins[1:], strict=False):
        mask = (confidences > lower) & (confidences <= upper)
        if not mask.any():
            continue
        error += float(mask.mean()) * abs(float(accuracies[mask].mean()) - float(confidences[mask].mean()))
    return error


def softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - logits.max(axis=1, keepdims=True)
    exp = np.exp(shifted)
    return exp / exp.sum(axis=1, keepdims=True)


def classification_metrics(
    logits: np.ndarray,
    targets: np.ndarray,
    num_classes: int,
    class_ids: list[int] | None = None,
) -> dict[str, Any]:
    probabilities = softmax(logits)
    predictions = probabilities.argmax(axis=1)
    result: dict[str, Any] = {
        "n": int(len(targets)),
        "top1": top_k_accuracy(logits, targets, 1),
        "top5": top_k_accuracy(logits, targets, 5),
        "macro_f1": macro_f1(predictions, targets, num_classes),
        "ece": expected_calibration_error(probabilities, targets),
    }
    recall = per_class_recall(predictions, targets, num_classes)
    if class_ids is not None:
        result["per_class_recall"] = {
            str(class_ids[index]): value for index, value in sorted(recall.items())
        }
    else:
        result["per_class_recall"] = {str(index): value for index, value in sorted(recall.items())}
    return result
