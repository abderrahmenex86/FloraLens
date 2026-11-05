# Model selection — FloraLens

Fill this after the screen. The decision is the Pareto point, not the single
highest top-1.

## Protocol

- Screen: 150 classes × 80 images/class, 15 epochs, 3 seeds.
- Full run: final class count, 30 epochs, 3 seeds for the top 3.
- Same manifest, splits, augmentation and class-balanced sampler for every
  candidate.
- Metrics on the same test set, plus a garden holdout that was never trained on.

## Results

| Model | Params (M) | Top-1 | Top-5 | Macro F1 | OOD AUROC | ECE | INT8 MB | Latency (ms) | PSS (MB) | GPU-h |
|---|---|---|---|---|---|---|---|---|---|---|
| MobileNetV3-Large (baseline) | | | | | | | | | | |
| MobileNetV4-Conv-S | | | | | | | | | | |
| MobileNetV4-Conv-M | | | | | | | | | | |
| EfficientViT-M2 | | | | | | | | | | |
| FastViT-T8 | | | | | | | | | | |
| RepViT-M1 | | | | | | | | | | |
| MobileViT-XXS | | | | | | | | | | |
| EfficientNet-B0 | | | | | | | | | | |

## Decision

- Winner:
- Why:
- Rejected alternatives and why:
- Quantization drop:
- Device/build tested:

## Reproduce

```bash
# 1. screen subset
uv run --project ml floralens select \
  --manifest data/manifests/plants_clean.jsonl \
  --classes shared/classes/plants.yaml \
  --out data/manifests/screen_selected.jsonl \
  --report ml/reports/screen_select.json \
  --max-classes 150 --max-per-class 80

uv run --project ml floralens split \
  --manifest data/manifests/screen_selected.jsonl \
  --out data/manifests/screen_split.jsonl \
  --report ml/reports/screen_split.json

# 2. run the screen
uv run --project ml python ml/scripts/run_screen.py \
  --manifest data/manifests/screen_split.jsonl

# 3. full runs for the top three
uv run --project ml floralens train-classifier \
  --config ml/configs/train/plants_mobilenetv4.yaml
```
