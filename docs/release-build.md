# Release build

The app now has a real identity and a clean manifest.

## Identity

| Field | Value |
|---|---|
| App name | `FloraLens` |
| Android package | `com.abderrahmene.floralens` |
| iOS bundle id | `com.abderrahmene.floralens` |
| Version | `1.0.0` (`versionCode 1`) |
| Icon / adaptive icon / monochrome | FloraLens leaf mark |
| Splash | leaf mark on `#F4F7F2` / `#1A1C19` |
| Backup | `allowBackup=false` |

## Permissions

The release manifest declares only:

- `CAMERA` (system camera intent from the image picker)
- `INTERNET` (optional photo-pack download)
- `VIBRATE` (haptics)
- `ACCESS_NETWORK_STATE`
- the internal dynamic-receiver permission

Blocked from library manifests:

- `RECORD_AUDIO`
- `SYSTEM_ALERT_WINDOW`
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`
- `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` / `READ_MEDIA_AUDIO`

`expo-camera`, `expo-media-library`, `expo-blur`, `expo-symbols`,
`expo-web-browser` and `@gorhom/bottom-sheet` were removed because nothing
imported them. `expo-dev-client` is still present for the development workflow
and should be removed for a store build.

## Build

```bash
npx expo prebuild --platform android --clean

# emulator
cd android
./gradlew assembleRelease -PreactNativeArchitectures=x86_64 \
  --no-parallel --max-workers=2 \
  -Dorg.gradle.jvmargs="-Xmx3g -XX:MaxMetaspaceSize=1g"

# Pixel / arm64
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a \
  --no-parallel --max-workers=2 \
  -Dorg.gradle.jvmargs="-Xmx3g -XX:MaxMetaspaceSize=1g"
```

Sizes from this pass:

| Build | APK |
|---|---|
| x86_64 release | 173 MB |
| arm64 release | 166 MB |

The release is signed with the debug keystore; replace it before publishing.
R8/minify is still disabled, so the dex is 42 MB and the APK is larger than it
needs to be.

## Verified

- Clean install and cold start on Android 16 emulator.
- Package/label/permissions inspected with `aapt2`.
- `allowBackup=false`.
- Home and empty state render in a standalone release build with no Metro.
- Pixel 8a (arm64, Android 17): installed the 166 MB release, cold start
  **0.5–1.0 s**, PSS **96 MB** at home.
- Camera permission prompt, system camera, crop, on-device analysis and result
  all work from the release build.
- The camera permission dialog still says "take pictures and record video"
  because Android groups camera and video under CAMERA; RECORD_AUDIO is not in
  the manifest.
- Only `CAMERA` is granted; no media, microphone or overlay permission.

## Pending

- Build an arm64 APK with `EXPO_PUBLIC_PLANT_PACK_URL` set to test the hosted
  pack on the phone (the code path is already validated on the emulator with
  the 5-photo mini pack).
- SDK 58 + `@expo/ui` + Material You.
- Release keystore, R8, store listing, privacy policy.
