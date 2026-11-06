# Input gate

The classifier is overconfident on out-of-distribution frames. A black or blank
image still gets a high softmax score, so `UNKNOWN_CONFIDENCE` and
`UNKNOWN_MARGIN` never fire. The gate looks at the pixels before inference runs.

## What it checks

`lib/imageGate.ts` computes, on the already-decoded 224px frame:

| Signal | Reject when | Message |
|---|---|---|
| mean luma | `< 12` | That photo is too dark. Try again in better light. |
| luma std dev | `< 6` | No plant detected in that photo. Point the camera at a leaf. |
| share of flat 8x8 tiles (std `< 4`) | `> 0.85` | same |

The camera calls `mlPipeline.checkPhoto(base64)` before the classifiers run.
A rejected photo stays on the review screen, shows a toast, and is never saved
as a scan, so history stays clean.

## Semantic gate

The pixel gate cannot tell a wall from a leaf. A second model,
`assets/models/plant_gate.onnx` (MobileNetV3-Small, 128x128, two classes),
runs after it and before the species classifier:

- class 0 `plant`, class 1 `not_plant`
- reject when `P(not_plant) >= 0.85` (equivalently `P(plant) < 0.15`)
- the threshold is deliberately biased toward accepting leaves

`mlPipeline.checkPlantPresence(base64)` returns the plant probability. A
rejected frame stays on the review screen with "No plant detected in that
photo. Point the camera at a leaf." and is never saved.

Measured on 128px squash-resized frames:

| Image | P(plant) | Result |
|---|---|---|
| Laptop screen with terminal text | 0.000 | rejected |
| Phone UI screenshot | 0.002 | rejected |
| Monstera cover | 0.972 | accepted |
| Aloe cover | 0.984 | accepted |
| Lettuce cover | 0.996 | accepted |
| Mandarin cover | 0.939 | accepted |
| Golden pothos cover | 1.000 | accepted |

## Calibration

Measured on the 364 library thumbnails of the previous library at 224px:

| Metric | Plants (min) | Plants (median) | Rejects |
|---|---|---|---|
| mean luma | 21.8 | 118.4 | 0 (black) |
| luma std | 19.4 | 48.6 | 0 (black, white, grey) |
| flat-tile ratio | 0.00 | 0.00 | 1.00 (max plant 0.70) |

A global colourfulness check was tried and dropped: one valid library photo has
a chroma of 4.5, so a `chroma < 8` rule would reject a real plant.

## What it does not catch

The gate is trained on COCO negatives and plant positives, so unusual OOD
scenes (a dense collage, a drawing) can still slip through. The species
classifier's confidence banner remains the second line of defence. INT8 was
tried for the gate and collapsed plant recall, so the app ships the FP32
5.9 MB export.
