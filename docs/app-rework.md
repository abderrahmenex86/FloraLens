# App rework — no-GPU pass

The ML overhaul is parked on `feat/ml-pipeline-scaffold`. This pass improves the
app with the existing models and assets.

## What changed

### Scan records that survive

- Scans are stored under their own MMKV key (`scan:<id>`) with the full
  diagnosis; the history array only holds summaries.
- A scan is saved once, when the camera finishes analysing. The result screen
  no longer writes on mount.
- `result/[id]` loads by id and falls back to old summary records.
- History and garden rows open the actual scan; the garden stores `scanId`.
- Old data remains readable; both empty and missing states are explicit.

### Files and deletion

- Deleting a history scan deletes its photo only when no garden entry references
  it.
- Removing a garden entry deletes the photo only when no scan references it.
- Delete is confirmed with an Alert, and long-press is an alternative to swipe.

### Result screen

- The user's photo is the header; reference photos are a separate section.
- Confidence is labelled honestly: low-confidence results show "Not sure"
  with a short explanation.
- Top-5 alternatives use one decimal below 10 % instead of `0%`.
- Selecting an alternative updates the saved record and garden copy.
- Disease severity is shown; the mask uses `contain` instead of cropping.
- Pest and disease sections handle missing legacy data.

### Navigation and accessibility

- Tab bar has visible labels, 72 dp height, full-height touch targets, and
  accessibility labels.
- Status bar is light on the scanner, result, and plant header.
- Icon-only controls have labels and roles.
- `Screen` uses a real bottom inset instead of a runtime NativeWind class.
- Home and garden lists have bottom padding for the floating tab bar.
- Library has a no-results state and a clear action.
- Empty history/garden have a scan CTA.
- Bad plant ids and missing scans render an error screen, not a blank frame.

### Model output

- The plant/pest pipelines now return softmax entropy, top-1/top-2 margin, and
  an `isUnknown` flag.
- Conservative on-device rejection: top-1 < 50 % or margin < 12 %.
- This is not a calibrated OOD model; a future retrain should replace it.

## Verified on the emulator

- Debug x86_64 build + Metro on Android 16.
- Old history records open without diagnosis; new scans reopen with full
  diagnostics.
- New scan → result → save to garden → garden card opens the result.
- Swipe delete → confirmation → list updates.
- `reactnativeflora://plant/99999` and `.../result/nope` show error screens.
- Library no-results and clear button.
- Tab labels and full-height hit targets.
- `expo export --platform android` succeeds.
- `tsc --noEmit` and `expo lint` pass.

## Still to do

- ~~`@expo/ui` Material You shell~~ — done, see `docs/material-you.md`.
- Real package id, release keystore, icon/splash, permission cleanup.
- A calibrated OOD model and retrained plant/disease models when compute is
  available.
