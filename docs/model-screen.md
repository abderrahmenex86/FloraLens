# Model screen and trained models

One 12-hour RTX 5070 session, four deliverables: the plant-presence gate, a
garden/houseplant classifier, a broad species classifier and a garden-insect
classifier.

## Datasets

| Dataset | Images | Use |
|---|---|---|
| Pl@ntNet-300K v2 (HF mirror) | 306k extracted, 106k used | 1,000 wild species |
| GBIF garden taxa | 20,268 kept | 114 garden/houseplant/veg classes |
| GBIF garden insects | 6,311 kept | 22 insect taxa |
| Plant photos (from Pl@ntNet) | 3,000 | "No insect" negatives |
| COCO val2017 | 5,000 | gate negatives |
| App reference photos | 1,793 | gate positives |

Zenodo served Pl@ntNet at 0.3 MB/s, so the Hugging Face mirror (31.9 GB) was
used instead. The mirror remaps class folders, so files are resolved by hash.

## Cleaning

- Class selection: ≥80 images for the Pl@ntNet screen; 400 images/class cap.
- Exact duplicates by SHA-256, perceptual duplicates by 8×8 aHash (Hamming ≤5,
  per class), short side ≥256 px, Laplacian blur ≥20, brightness 8–247.
- GBIF splits are grouped by occurrence id; Pl@ntNet uses its official split.
- 256 px cache written so the loader can feed the GPU (42 GB → 3.2 GB).

## Augmentation and loader

RandomResizedCrop(224, 0.6–1.0), horizontal flip, RandAugment(2, 9),
RandomErasing(0.1), label smoothing 0.1, class-balanced sampler.
14 workers, prefetch 2–8, pinned memory, channels-last, bf16, cudnn benchmark.

## Architecture screen (12 epochs, same data and schedule)

| Model | top-1 | macro-F1 | throughput | params |
|---|---|---|---|---|
| RepViT-M1 | **65.4%** | **0.428** | 1,911 img/s | 5.5 M |
| FastViT-T8 | 62.4% | 0.405 | 1,075 img/s | 4.0 M |
| MobileNetV3-L | 63.0% | 0.389 | 2,335 img/s | 5.5 M |
| MobileNetV4-S | 60.3% | 0.366 | 4,236 img/s | 3.8 M |
| EfficientViT-M2 | 54.1% | 0.344 | 3,436 img/s | 4.2 M |

RepViT-M1 won on both accuracy metrics while staying mobile-friendly. The
12-epoch numbers are floors: MNV3-L and MNV4-S were still improving, FastViT
had plateaued. The winner was retrained for 40 epochs.

## Final models (test split)

| Model | Classes | Input | top-1 | top-5 | macro-F1 | ECE | ONNX |
|---|---|---|---|---|---|---|---|
| Plant gate | 2 | 128 | 96.5% | — | 0.956 | 0.02 | 5.9 MB |
| Garden (MNV4-S) | 114 | 224 | 67.9% | 87.7% | 0.670 | 0.08 | 10.6 MB |
| Broad (RepViT) | 1,023 | 224 | 68.0% | 89.4% | 0.431 | 0.11 | 22.0 MB |
| Insects (RepViT) | 23 | 224 | 83.1% | 96.0% | 0.736 | 0.12 | 19.0 MB |

The broad model's macro-F1 is diluted by ~650 Pl@ntNet species with fewer than
80 images. For garden use, the 114-class model is the better fit: same top-1
with 10× fewer classes and half the size.

The insect model includes a **`no_insect` class** built from 3,000 clean leaf
photos, so a healthy leaf is not confidently labelled as a pest.

## Artifacts

```
ml/exports/plant_gate/model.onnx    5.9 MB   (existing download)
ml/exports/garden/model.onnx       10.6 MB
ml/exports/plants1024/model.onnx   22.0 MB
ml/exports/insects/model.onnx      19.0 MB
```

Each export folder also has `contract.json` (input shape, preprocessing, class
list path). ONNX exports use a dynamic batch axis.

## Notes

- INT8 quantization collapsed the MobileNetV3 gate (plant recall 99% → 8%);
  FP32 ships instead. RepViT was not quantized in this pass.
- The app's current pest model is IP102 (rice pests); the new insect model
  replaces it and needs a matching `PEST_CLASSES` update in the app.
- The deployed plant model is 364 classes; switching to the garden or broad
  model means regenerating the app's class list and reference thumbnails.
- Disease and language-model work deferred; see `docs/input-gate.md` for the
  gate and this file for the vision screen.
