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

The camera calls `mlPipeline.checkPhoto(base64)` before the three models run.
A rejected photo stays on the review screen, shows a toast, and is never saved
as a scan, so history stays clean.

## Calibration

Measured on the 364 library thumbnails at 224px:

| Metric | Plants (min) | Plants (median) | Rejects |
|---|---|---|---|
| mean luma | 21.8 | 118.4 | 0 (black) |
| luma std | 19.4 | 48.6 | 0 (black, white, grey) |
| flat-tile ratio | 0.00 | 0.00 | 1.00 (max plant 0.70) |

A global colourfulness check was tried and dropped: one valid library photo has
a chroma of 4.5, so a `chroma < 8` rule would reject a real plant.

## What it does not catch

Semantic negatives: a wall, ceiling, cat or laptop passes because the frame has
contrast. That is the job of the plant/no-plant classifier described in
`docs/overhaul-plan.md`:

- MobileNetV3-Small or MobileNetV4-Conv-S at 128x128, two classes
- positives include diseased and dried leaves; negatives include indoor scenes,
  objects, people and synthetic black/blank frames
- reject only at `P(not_plant) >= 0.85`, so the gate stays biased toward
  accepting real leaves
- INT8 ONNX around 1.5-2.5 MB; keep this pixel gate as the pre-filter so flat
  frames never reach the model
