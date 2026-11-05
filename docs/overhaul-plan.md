# FloraLens overhaul plan

Two projects in one repository:

- **App** (repository root) — Expo/React Native deployment.
- **ML** (`ml/`) — data, training, evaluation and export.

They meet at `shared/`; the model contract is the interface.

## Data flow

```text
Pl@ntNet / iNat / PlantVillage / PlantDoc / PlantSeg / own photos
  → JSONL manifest
  → dedupe + quality filter
  → class selection + per-class caps
  → observation-grouped split
  → train on Vast.ai
  → evaluate + calibrate + INT8
  → ONNX + contract.json
  → app bundle or download pack
```

## Models

| Task | Architecture (candidates) | Input | Output |
|---|---|---|---|
| Plant species | MobileNetV4-S/M, MobileNetV3-L, EfficientViT-M2, FastViT-T8, RepViT-M1, MobileViT-XXS | 224² | 600 classes + unknown |
| Garden insects | Same screen; hierarchical taxon + life stage + role | 224² | 60–100 taxa |
| Disease/abiotic | SegFormer-B0 / DeepLabV3+ MBV3 + symptom classifier + rules | 320² | binary lesion mask + host-conditioned labels |

The current app baseline is MobileNetV3-Large; the comparative screen decides the
replacement.

## Data sources and licenses

| Source | Use | License |
|---|---|---|
| Pl@ntNet-300K v2 | Plant species core | CC BY-SA (305,614 images), a few NC |
| iNaturalist | Garden plants, insects, life stages | per-photo CC |
| iNaturalist 2021 comp. | Insect pretraining | non-commercial research |
| IP102 | Pest classes (aphids, thrips, mites) | academic |
| InsectSet459 | General insect features | CC BY 4.0 |
| PlantVillage | Apple/citrus disease | CC BY-SA 3.0 |
| PlantDoc | Real-world disease | CC BY 4.0 |
| PlantSeg | Lesion masks | CC BY-NC 4.0 |
| Own photos | Anchors, abiotic trials, cocoons | yours |

The project is non-commercial. Record the encumbrance if that changes.

## Class selection

- 600 plant classes, curated in tiers: 8 garden anchors, citrus/apple, houseplants,
  regional garden/wild flora, then Pl@ntNet fill.
- Genus-level labels for Bougainvillea, Chrysanthemum and other cultivar/hybrid
  groups.
- 60–100 insect taxa + a separate life-stage head; cocoon = pupa, species ID
  usually impossible.
- 20–40 disease/abiotic labels, host-conditioned.
- Minimum 80 images/class; below that merge to genus or collect. Cap common
  classes at 500; never truncate the whole dataset blindly.

Pl@ntNet coverage: only 341 species have ≥80 images and are not already in the
seed list, so 600 classes require iNat/own data. The eight garden anchors are
absent from Pl@ntNet-300K; see `ml/reports/data-coverage.md`.

## App

- Expo SDK 58 + `@expo/ui` Jetpack Compose + Material You dynamic color.
- Native `NavigationBar`, `TopAppBar`, cards, sheets, chips, search; system font
  and Material Symbols for the Pixel feel.
- SQLite + migrations for scans/garden/assets/settings; file paths, GC, undo.
- In-app camera with leaf framing, multi-photo, history reopen, garden with the
  user's photo.
- Optional reference-image pack: bundled thumbnails (~12 MB) + downloadable
  WebP pack (~90–150 MB), SHA-256 manifest, R2/CDN or Play Asset Delivery.
- Health flow: symptom model + questionnaire + `shared/rules/health.yaml`.
- OOD/unknown state and calibration are first-class.
- Privacy: no upload, minimal permissions, `allowBackup=false`, EXIF stripped.

## Phases

1. **Scaffold** — ML project, shared contracts, class seeds, asset tool. *(done)*
2. **Data** — acquire sources, build manifests, clean/dedupe/split, collect
   garden photos.
3. **Screen** — train lightweight candidates on a 150-class subset; pick three.
4. **Full training** — plants, insects, disease; OOD; quantization; export.
5. **App foundation** — SDK 58, Expo UI, SQLite, asset downloads.
6. **Integration** — scan/result/history/garden/health; contract validation.
7. **Beta** — garden holdout, corrections, retrain.

## Open decisions

- Region/country/climate (class list, insects, citrus/apple diseases).
- Citrus and apple types; pots or ground.
- Insect scope: broad garden ID vs pest-only; cocoons at launch.
- 300 vs 600 plant classes for v1.
- Training hardware/budget on Vast.ai.
- Own-photo collection capacity.
