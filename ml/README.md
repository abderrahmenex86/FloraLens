# FloraLens ML

Training, cleaning, evaluation and export pipeline for the FloraLens on-device
models. The Expo app is a separate project at the repository root; the two meet
at `shared/` contracts.

Run the commands in this README **from the repository root**, using
`uv run --project ml`.

## What lives here

```text
ml/
├── configs/            # training and model-screen configs
├── src/floralens_ml/
│   ├── data/           # download, import, clean, select, split, dataset
│   ├── models/         # timm classifiers, SMP segmentation
│   ├── train/          # classifier loop
│   ├── eval/           # metrics, OOD, calibration, benchmark
│   ├── export/         # ONNX + INT8 + model contract
│   └── rules/          # health questionnaire rule engine
├── tests/
└── reports/            # data cards and model-selection reports
```

Heavy dependencies import lazily, so taxonomy, cleaning, splitting and rules run
without PyTorch.

## Quickstart

Python 3.11–3.12 is required for training (torch). The pipeline modules also run
on newer Python.

```bash
uv sync --project ml --extra train --extra eval --extra dedupe --extra dev
uv run --project ml pytest -q ml/tests
```

If you only need the laptop pipeline:

```bash
uv sync --project ml
uv run --project ml floralens validate-classes shared/classes/plants.yaml
```

## Data flow

```text
raw sources
  → import / download          (JSONL manifest, one record per image)
  → clean                      (exact + perceptual dedupe, quality filters)
  → select                     (drop rare classes, cap common classes)
  → split                      (observation-grouped train/val/test)
  → train                      (Vast.ai / local GPU)
  → eval + calibrate + quantize
  → ONNX + contract.json       (consumed by the app)
```

### 1. Download / import

iNaturalist:

```bash
uv run --project ml floralens download-inat \
  --classes shared/classes/plants.yaml \
  --out data/raw/inat/plants \
  --manifest data/manifests/inat_plants.jsonl \
  --max-per-class 300
```

Life stages use iNaturalist's controlled term 1; pupae are value 4:

```bash
uv run --project ml floralens download-inat \
  --classes shared/classes/insects.yaml \
  --out data/raw/inat/pupae \
  --manifest data/manifests/inat_pupae.jsonl \
  --term-id 1 --term-value-id 4 --life-stage-label pupa
```

Garden photos use a folder mapping:

```bash
uv run --project ml floralens import-folder \
  --root data/raw/own \
  --mapping ml/configs/data/own_mapping.yaml \
  --out data/manifests/own.jsonl \
  --group-by parent
```

The importer expects one folder per class; the mapping is a flat
`folder: class_id` map. PlantNet-300K and disease datasets are large; download
them from their official pages, extract them under `data/raw/`, and import with
a mapping or a source-specific script once the layout is confirmed.

### 2. Merge, clean, select, split

```bash
uv run --project ml floralens merge \
  data/manifests/inat_plants.jsonl data/manifests/own.jsonl \
  --out data/manifests/plants_raw.jsonl

uv run --project ml floralens clean \
  --manifest data/manifests/plants_raw.jsonl \
  --out data/manifests/plants_clean.jsonl \
  --report ml/reports/plants_clean.json \
  --quality

uv run --project ml floralens select \
  --manifest data/manifests/plants_clean.jsonl \
  --classes shared/classes/plants.yaml \
  --out data/manifests/plants_selected.jsonl \
  --report ml/reports/plants_select.json \
  --min-images 80 --max-per-class 500

uv run --project ml floralens split \
  --manifest data/manifests/plants_selected.jsonl \
  --out data/manifests/plants_split.jsonl \
  --report ml/reports/plants_split.json

uv run --project ml floralens stats --manifest data/manifests/plants_split.jsonl
```

The splitter groups by `observation_id` and refuses to let an observation cross
splits. Pl@ntNet's official split is stored in `source_split` and respected by
default.

### 3. Train

```bash
uv run --project ml floralens train-classifier \
  --config ml/configs/train/plants_mobilenetv4.yaml
```

Config paths are resolved from the repository root. Outputs `best.pt`,
`last.pt`, `history.json` and `summary.json` under `output_dir`.

### 4. Export

```bash
uv run --project ml floralens export-onnx \
  --checkpoint ml/runs/plants_mobilenetv4_s/best.pt \
  --classes shared/classes/plants.yaml \
  --out ml/exports/plants_mobilenetv4_s \
  --model-id plant_mobilenetv4_s_v1

uv run --project ml floralens quantize \
  --onnx ml/exports/plants_mobilenetv4_s/model.onnx \
  --out ml/exports/plants_mobilenetv4_s/model.int8.onnx \
  --contract ml/exports/plants_mobilenetv4_s/contract.json

python tools/validate_contracts.py \
  --contract ml/exports/plants_mobilenetv4_s/contract.json \
  --classes shared/classes/plants.yaml
```

`contract.json` carries input shape, preprocessing, class hash, class ids,
calibration and file checksums. The app validates it before loading a model.

### 5. Vast.ai

```bash
docker build -f ml/Dockerfile -t <registry>/floralens-ml:0.1 .
docker push <registry>/floralens-ml:0.1
```

On the instance, with the repo and data mounted at `/workspace`:

```bash
rclone copy r2:floralens-data data/ --progress
uv run --project ml floralens train-classifier \
  --config ml/configs/train/plants_mobilenetv4.yaml
```

Checkpoint every epoch and upload `ml/runs/` to R2. If the spot instance is
interrupted, set `resume_from` in the config to the last checkpoint.

## Important data notes

- Pl@ntNet-300K has 1,000 species, but only **341 species have ≥80 images** and
  are not already in the seed list. A 600-class list needs iNaturalist, garden
  photos, or a lower min-count plus genus-level merging.
- Pl@ntNet's official split is observation-grouped; keep it.
- The garden anchors (Bougainvillea, Cestrum, Duranta, Jasminum grandiflorum,
  Ficus benjamina, Crassula ovata, Chrysanthemum, Ocimum basilicum) are mostly
  absent from Pl@ntNet-300K. Collect them directly.
- Jasminum grandiflorum has only ~169 iNaturalist observations; own photos are
  essential.
- Non-commercial project: PlantSeg (CC BY-NC), IP102 (academic) and the iNat
  competition set are usable under their terms. Document the encumbrance if the
  project ever becomes commercial.

## Model screen

`ml/configs/study/classifiers.yaml` lists the lightweight candidates. Train each
on the same 150-class/80-image subset for 15 epochs and three seeds, then take
the top three to the full class count. The current app baseline is
MobileNetV3-Large; MobileNetV4-Conv-S is the default challenger. Pick the winner
on INT8 size, CPU latency and PSS on the target device, not on published FLOPs.
