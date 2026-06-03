# 🌿 FloraLens

<div align="center">
  <p><strong>Advanced on-device AI plant identification, disease segmentation, and garden management.</strong></p>
  <p>
    <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
    <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
    <img src="https://img.shields.io/badge/ONNX_Runtime-005CED?style=for-the-badge&logo=onnx&logoColor=white" alt="ONNX" />
    <img src="https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android" />
  </p>
</div>

FloraLens, Built entirely from scratch, it leverages **100% offline, on-device Machine Learning** to identify closer to 400 plant species, classify pests, and generate spatial pixel-level disease masks—all.

<div align="center">
  <img src="docs/home_preview.png" width="20%" />
  <img src="docs/scan_preview.png" width="20%" />
  <img src="docs/result_preview.png" width="20%" />
  <img src="docs/disease_preview.png" width="20%" />
  <img src="docs/demo.gif" width="20%" />
</div>

## ✨ Features

- 🧠 **Entirely Offline AI**: Powered by `onnxruntime-react-native`, models execute directly on the Android hardware via C++ bindings. No servers, no API costs, and total data privacy.
- 🎯 **Multi-Model Pipeline**:
  - **Plant ID**: (From my other project flora) 224x224 Classification with Softmax top-5 graceful degradation.
  - **Pest ID**: (from my other project pesti) Confidence-thresholded insect detection.
  - **Disease Segmentation**: (from my other project segmenti) 520x520 spatial mask generation with in-memory RGBA tinting for visual overlays.
- 💾 **Synchronous Storage**: using `react-native-mmkv` to manage the user's digital greenhouse and scan history.

## 🛠️ Tech Stack

**Frontend Framework:** React Native / Expo (SDK 54) / Expo Router
**Styling:** NativeWind (Tailwind CSS)
**Machine Learning:** ONNX Runtime, `jpeg-js`, PyTorch-identical preprocessing (Resize, CenterCrop, Normalize)
**Storage & FileSystem:** React Native MMKV, Expo File System
**Animations & Gestures:** React Native Reanimated, Gorhom Bottom Sheet, React Native Gesture Handler

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Expo CLI
- Android Emulator or a physical Android device (USB Debugging enabled)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abderrahmenex86/floralens.git
   cd floralens
   ```
2. **Install dependencies:**
```bash
npm install
```
3. **Add your AI Models & Assets:**
Ensure your `.onnx` models are placed in `assets/models/`.
Ensure your reference images are placed in `assets/images/plants/`.

4. **Build and Run (Android):**
*Because this project utilizes custom native code (ONNX, MMKV), it cannot run in Expo Go. You must build the development client.*
```bash
npx expo prebuild --clean --platform android
npx expo run:android
```

