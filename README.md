# FloraLens

An Android app that identifies plants, classifies pests, and segments leaf
disease with the models running on the device. No server, no API calls, no
uploaded photos.

<img src="docs/home.png" width="18%" /> <img src="docs/camera.png" width="18%" /> <img src="docs/results.png" width="18%" /> <img src="docs/garden.png" width="18%" />

## What it does

- Runs three ONNX models through `onnxruntime-react-native`, so inference happens
  on the phone with no network round trip.
- Identifies the plant species from a 224x224 photo and degrades to a top-5 list
  when confidence is low.
- Classifies insect pests, with a confidence threshold below which it reports
  nothing rather than guessing.
- Segments disease regions at 520x520 and tints the mask in memory to show the
  affected area over the original image.
- Keeps a personal garden and scan history in MMKV, so a scan is available
  offline after the app closes.

## Run it

```bash
git clone https://github.com/abderrahmeneex86/FloraLens
cd FloraLens
npm install
```

Put the `.onnx` models in `assets/models/` and the reference plant images in
`assets/images/plants/`. The three expected files are `plant_model.onnx`,
`pest_model.onnx`, and `disease_model.onnx`.

Build a development client, not Expo Go, because the ONNX and MMKV modules
include native code:

```bash
npx expo prebuild --clean --platform android
npx expo run:android
```

Node 18+ and either an Android emulator or a device with USB debugging on.

## How it works

Each scan loads the image, applies the same resize, centre-crop, and normalise
steps the models were trained with, and runs inference on the native thread. The
plant and pest classifiers return probabilities; the segmentation model returns a
mask that is converted to RGBA and drawn over the photo.

The models are trained in separate repositories, not inside this app.

## Limits

- Android only. The native modules are not configured for iOS.
- The models are shipped as assets, so the APK carries their full size.
- Species coverage is limited to what the plant classifier was trained on; an
  unknown plant still returns a top-5 guess.

## Stack

React Native · Expo SDK 54 · Expo Router · NativeWind · MMKV · ONNX Runtime

## Related

- [Flora](https://github.com/abderrahmenex86/flora) for the plant classifier
- [Pesti](https://github.com/abderrahmenex86/pesti) for the pest classifier
- [Segmenti](https://github.com/abderrahmenex86/segmenti) for disease segmentation
