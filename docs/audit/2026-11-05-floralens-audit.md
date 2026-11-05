# FloraLens — full product audit (2026-11-05)

**Scope:** 11 app surfaces plus the system picker, crop screen and permission dialog. Android 16 (API 36) Pixel 8 emulator, 1080 × 2400, portrait. Language yardstick: English. Capture: live `adb screencap` of the release APK built from `HEAD` (`8fd8375`), debug-signed. 26 screenshots in `screens/`.

**Not covered:** physical arm64 device, camera preview (the emulator camera returned a black frame), system font scaling (the emulator ignored `font_scale`; retest on device), TalkBack, tablet/landscape, iOS, Play/AAB install, long-session storage growth, ANR traces.

> **Verdict:** The visual foundation is genuinely good and the on-device pipeline works end to end — a scan completes in about 6 s on the emulator once the models are warm, with no network. It is not shippable yet: the package still carries template identity, 600 MB of assets, over-broad permissions and a debug key; history and garden cannot reopen a scan; deleting data leaks files; and the accessibility floor (labels, tap targets, contrast, status bar) is not met.

---

## Summary

| Severity | Count (UX) | Engineering priority | Count |
|---|---|---|---|
| 4 catastrophic | 0 | P0 release blocker | 3 |
| 3 major | 16 | P1 correctness / data | 8 |
| 2 minor | 15 | P2 quality | 7 |
| 1 cosmetic | 2 | P3 hygiene | 2 |

No UX finding met the S4 bar: the core scan → result flow completes, and every failure found is recoverable by leaving the screen. The "catastrophic" label is reserved for a blocked core task.

**By dimension (UX):**

| Dimension | Findings |
|---|---|
| Usability | 1 |
| Accessibility | 4 |
| Visual Design | 2 |
| Content & Language | 6 |
| State & Data | 3 |
| Responsive | 1 |
| Information Architecture | 0 (cross-cutting, see U1/U4/U5) |
| Interaction Design | 1 |
| User Journey / Flow | 4 |
| Cognitive Load & Onboarding | 1 |
| Trust & Credibility | 6 |
| Error Prevention & Recovery | 3 |
| Performance Perception | 1 |

---

## ✅ Strengths (don't throw away)

- **A real, working on-device pipeline.** Plant, pest and segmentation models all run through ONNX Runtime; a scan completes with no network calls (verified by source search and a working offline flow).
- **Coherent visual language.** One green palette, rounded cards, consistent 32 dp gutters, and a clear typographic hierarchy (Jakarta for headings, Vietnam for body). The home and result screens look like a product, not a template.
- **Designed empty states.** Both history and garden use the same dashed card, icon and explanatory copy — better than most pre-release apps.
- **Honest uncertainty in one place.** The pest card correctly says "No pests detected with high confidence" rather than surfacing a low-confidence species.
- **The disease result explains what to do.** The overlay plus a concrete treatment string is the strongest screen in the app.
- **Native 16 KB page compatibility** (zipalign passes) and a clean cold start (≈1.5–1.8 s).
- **No dark patterns, no ads, no analytics, no account.** The privacy story is simple and believable — it is just undermined by the manifest and backup settings (see T-03).

---

## UX findings

### 🟡 S3 — major

#### U1 · Icon-only tab bar is unlabelled, low-contrast and 16 dp tall — all tab screens · Accessibility / Interaction / IA
- **Screenshot:** `screens/home-populated.png`, `screens/garden-empty.png`
- **Issue:** Three separate failures on the primary navigation. (a) The inactive tint is `#FFFFFF33` on `#2D5A27` = **1.67:1**, far below the 3:1 non-text minimum, and the active state is colour-only. (b) `tabBarShowLabel: false` plus no accessible names means the four tabs announce nothing; the leaf/book/info icons are ambiguous without labels. (c) The clickable bounds are 42 px high at 420 dpi = **16 dp** (uiautomator: `[74,2159][307,2201]`), while the visible bar is 64 dp — tapping the top two-thirds of the bar does nothing. Verified live: a tap at y=2100 is ignored, y=2180 navigates.
- **Fix:** restore labels (or add `tabBarAccessibilityLabel` + `accessibilityRole="tab"`); raise inactive tint to at least `#FFFFFF` at 60 % (≈4.2:1) and add a pill/underline for the active state; remove the `tabBarItemStyle` padding that shrinks the touch target and give each tab the full 64 dp height (≥48 dp).

#### U2 · Every icon-only control is unnamed for screen readers — scan, result, garden, history · Accessibility
- **Screenshot:** `screens/scan-idle.png`, `screens/result-top.png`, `screens/home-swipe-delete.png`
- **Issue:** The close (X), back arrow, bookmark, reset and delete controls all expose `content-desc=""` and no role; the tab buttons are the same. Only "Open Camera" / "Choose from Gallery" get an inferred name from their text child. A screen-reader user cannot close the scanner, save a plant, or delete a scan.
- **Fix:** add `accessibilityLabel` and `accessibilityRole="button"` to every `Pressable` that contains only an icon. For the swipe action, also expose an `accessibilityActions` "delete" alternative — a gesture cannot be discovered by assistive tech.

#### U3 · Status bar is unreadable on dark and photographic screens — scan, result, plant detail · Accessibility / Visual
- **Screenshot:** `screens/scan-idle.png`, `screens/result-top.png`, `screens/result-disease.png`
- **Issue:** `StatusBar style="dark"` is set globally in `app/_layout.tsx:36`. On the near-black scanner the clock and icons are almost invisible; on the result and plant-detail headers the dark icons sit on foliage and on the black scrim, so they disappear. On the scrolled result the clock and the floating bookmark/search controls also overlap.
- **Fix:** set the status bar style per screen (`light` on scanner and image headers, `dark` on light screens), add a proper gradient scrim under the status bar on result/plant detail, and clip scrolling content below the inset.

#### U4 · A scan in Recent Scans cannot be opened — home · Usability / Journey / IA
- **Screenshot:** `screens/home-populated.png`
- **Issue:** The row is a plain `View` (`app/(tabs)/index.tsx:85`), not a `Pressable`. Tapping does nothing (verified). The only interactions are swipe-to-delete. The app never stores a route back to a result: `app/result/[id].tsx` ignores its `id` param and always reads `CURRENT_SESSION`. So every scan is write-only after leaving the result screen.
- **Fix:** make the row navigate to `/result/${scan.id}`, load the record (and its diagnosis) by id, and keep the session fallback for the immediate post-scan route. This is the single highest-value product fix.

#### U5 · Garden shows a stock photo and opens the library, not the scan — garden · Journey / IA / Trust
- **Screenshot:** `screens/garden-populated.png`
- **Issue:** A saved plant is rendered with `PLANT_IMAGES[classIndex][0]` (a dataset photo) rather than the user's scan, and tapping it pushes `/plant/{classIndex}` — the generic library profile. The user's own photo, confidence and diagnosis are never shown again; "your greenhouse" contains none of your plants.
- **Fix:** show the saved `imageUri` as the card cover (fall back to the reference), and open a garden entry that shows the original scan, date, confidence and diagnostics. Reserve the library profile for the "Learn more" link.

#### U6 · Destructive swipe has no confirmation, no undo, and no discoverable alternative — home, garden · Error prevention / Interaction
- **Screenshot:** `screens/home-swipe-delete.png`
- **Issue:** A swipe reveals a red delete block; one tap permanently removes the record. There is no undo, no snackbar, no long-press menu, and the gesture is only discoverable from the heading "Recent Scans (Swipe left)". Accidental loss is easy and irreversible.
- **Fix:** delete with an undo snackbar (5 s), or require a confirm sheet; add a visible overflow/"…" menu per row as the non-gesture path. Log the deleted record so undo can restore it.

#### U7 · Denying camera permission leaves the app silent — scanner · Error recovery
- **Screenshot:** `screens/permission-camera.png`
- **Issue:** The OS dialog asks to "take pictures and record video" (see U16). After "Don't allow" the app returns to the idle scanner with no explanation, no "open settings" path and no alternative suggestion; tapping Open Camera again immediately re-prompts. Verified live.
- **Fix:** catch the denied result, show an inline card ("Camera access is off — allow it in Settings, or choose a photo instead") with an `Linking.openSettings()` button, and suppress the repeated request until the user acts.

#### U8 · Two routes render a blank screen with no way out — `/plant/:badId`, `/result/:missingSession` · Journey / Error recovery
- **Screenshot:** `screens/blank-bad-plant.png`
- **Issue:** `app/plant/[id].tsx:45` and `app/result/[id].tsx:66` return `null`. A malformed deep link (`reactnativeflora://plant/99999`) or a result opened after process death shows a featureless background: no message, no back button, no home action. Verified live; after this state, relaunching the app can return to the same blank screen.
- **Fix:** replace the null returns with a shared "This scan/plant isn't available" screen with a Home button; add an error boundary at the root so any render throw lands there instead of on a blank frame.

#### U9 · Every visit to a result appends a duplicate scan and copies the JPEG again — result · State & Data
- **Screenshot:** `screens/home-duplicate-scan.png`
- **Issue:** The `useEffect` at `app/result/[id].tsx:55-64` calls `saveScanResult` on mount whenever `hasSavedToHistory` is false. That flag is component state, so a deep link or a future "reopen scan" navigation saves the same scan again. Verified: one scan + one deep-link reopen produced two identical "Wild Angelica" rows and a second JPEG in `files/`.
- **Fix:** make saving idempotent at the data layer (keyed by session/scan id or source URI), save when the scan is created rather than when the result renders, and show the saved state from storage.

#### U10 · "99.3% Match" fails contrast — result · Accessibility
- **Screenshot:** `screens/result-top.png`
- **Issue:** `#84B026` on `#F4F7F2` = **2.36:1**. The match figure is the most important number on the screen and is rendered in the accent colour at body size; it needs 4.5:1 (or 3:1 if treated as large text, which it is not).
- **Fix:** use `#2D5A27` (7.46:1) for the number, or darken the accent to a token that passes on both background and surface (`#4F7A12` is around 4.9:1 — verify with a checker).

#### U11 · The result header shows a stock reference photo, not the photo the user took — result · Trust / Visual
- **Screenshot:** `screens/result-top.png`
- **Issue:** When `PLANT_IMAGES[classIndex]` exists, the 420 px header renders dataset photos and labels them "Swipe for Reference Photos". The user's own scan is not visible anywhere on the result screen. Users cannot confirm that the identification corresponds to their plant; the most common question after a wrong ID is "did it even look at my photo?".
- **Fix:** lead with the user's photo (with the reference carousel as a secondary "Reference photos" section or toggle), and caption the header explicitly ("Your photo" / "Reference").

#### U12 · Plant and disease can contradict each other with no warning — result · Trust
- **Screenshot:** `screens/result-disease.png`
- **Issue:** A tomato leaf was identified as **Tulip Tree** and, on the same screen, diagnosed with **Tomato Septoria Leaf Spot**. The two models are independent and the UI presents both as facts; nothing checks whether the disease is plausible for the identified species.
- **Fix:** gate disease labels by the plant's compatible host set (or at least flag a conflict): "The disease model found a tomato disease, but the plant ID is uncertain — try a closer leaf photo." Show a low-confidence warning when plant confidence < 60 %.

#### U13 · Alternatives show "0%" and a 0.3 % species can be selected as the identification — result · Trust / Interaction
- **Screenshot:** `screens/result-alt-selected.png`
- **Issue:** Alternatives are rendered with `toFixed(0)`, so 0.2–0.4 % probabilities display as **0%** — four rows of "0%" is noise, not information. Selecting one still promotes it to the headline ("Garden Angelica — 0.3% Match"), which looks like an identification rather than a manual override.
- **Fix:** show one decimal below 1 % (or hide alternatives under a "More possibilities" disclosure); when the user overrides, label it "You selected this" and keep the model's top guess visible.

#### U14 · Analyzing state is a tiny spinner with no stage, progress or cancel — scanner · Performance perception
- **Screenshot:** `screens/scan-analyzing.png`
- **Issue:** `ActivityIndicator size={64}` is an iOS-only numeric size; on Android it renders small (the capture shows a thin green sliver), so the screen looks broken for the ~6 s the analysis takes. There is no indication of which model is running, no progress, and the X is disabled but still visible.
- **Fix:** use `size="large"` plus a staged checklist ("Identifying species → Checking pests → Segmenting disease"), keep a working Cancel that aborts the result navigation, and show the elapsed time if it exceeds ~10 s.

#### U15 · The app is still the Expo template in every system surface — launcher, splash, picker, permission dialog · Trust / Content
- **Screenshot:** `screens/splash.png`, `screens/photo-picker.png`, `screens/permission-camera.png`
- **Issue:** The launcher icon is the default Expo blue "A", the splash is the default Expo grid, the app label is `react-native-flora` (visible in the photo picker and permission dialog), and the package is `com.anonymous.reactnativeflora`. The About screen's flower icon and "FloraLens" name are not used anywhere the OS shows the app.
- **Fix:** commission a FloraLens mark (the Flower2 glyph is a usable starting point), set `expo.name`/`expo.android.package` to real values, regenerate the adaptive icon and splash, and verify the label in Settings → Apps.

#### U16 · A plant scanner asks for microphone and video access — first camera use · Trust / Content
- **Screenshot:** `screens/permission-camera.png`
- **Issue:** The prompt says "Allow react-native-flora to take pictures and **record video**?" because `RECORD_AUDIO` is declared (and `READ_MEDIA_VIDEO/AUDIO` + `SYSTEM_ALERT_WINDOW` ship too). The permission request does not match the product and will cost installs.
- **Fix:** remove `RECORD_AUDIO`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO` and `SYSTEM_ALERT_WINDOW`; keep `CAMERA` and the photo-picker scoped access. Re-run prebuild and confirm the prompt only mentions photos.

### 🟢 S2 — minor

#### U17 · Empty states have no action — home, garden · State & Data
- **Screenshot:** `screens/home-empty.png`, `screens/garden-empty.png`
- **Issue:** "No history / Scans appear here." and "Your garden is empty" explain the state but offer no button. The only CTA is the "Identify Plant" card at the top of home; the garden has none.
- **Fix:** add an "Identify a plant" button inside both empty cards, linking to `/camera`.

#### U18 · Searching with no matches produces a blank page — library · State & Data
- **Screenshot:** `screens/library-no-results.png`
- **Issue:** Typing "purplezz" leaves the header and an empty area — no "No plants found", no clear button, no suggestion. The user cannot tell whether the search ran.
- **Fix:** render an `EmptyState` ("No species match 'purplezz'") with a "Clear search" action; also show a result count while filtering.

#### U19 · Care data is an unstructured blob and the water line is hardcoded — result, plant detail · Content
- **Screenshot:** `screens/plant-detail.png`, `screens/result-top.png`
- **Issue:** "Hardiness: 4–9, Keep soil moist, Prefers partial shade" sits under a sun icon, mixing hardiness, watering and light. The water row repeats the same generic sentence ("Water thoroughly but allow soil to dry…") for every species. The data is shaped like a paragraph because the source field is one comma-separated string.
- **Fix:** split the source into `hardiness`, `water`, `light` fields (or parse into chips) and render one row per care dimension; remove the hardcoded sentence or make it species-specific.

#### U20 · The disease overlay is cropped, over-saturated and has no legend — result · Visual
- **Screenshot:** `screens/result-disease.png`
- **Issue:** The model returns a 520 × 520 mask, but it is displayed in a 200 px-high box with `contentFit="cover"`, so the top and bottom of the mask are cut off. The red tint is opaque enough to hide the leaf texture under it, and nothing says "red = affected area".
- **Fix:** render the mask at its native aspect ratio (or letterbox it), use a 30–40 % opacity overlay or contour outline, and add a caption/legend with the affected-area percentage.

#### U21 · Disease severity is computed but never shown — result · Content / State
- **Screenshot:** `screens/result-disease.png`
- **Issue:** `disease.severity` is calculated (`mlPipeline.ts:141`) and stored but never rendered. Users see a disease name and treatment with no sense of how much of the leaf is affected.
- **Fix:** display "≈18 % of the leaf area affected" next to the class name, with the same threshold explained; use it to colour the severity chip.

#### U22 · About omits version, privacy statement, model provenance and licences — about · Trust / Content
- **Screenshot:** `screens/about.png`
- **Issue:** The tab has one sentence and a footer. For an app whose differentiator is "no server, no uploads", the About screen is exactly where that claim, the model sources (Flora/Pesti/Segmenti), dataset licences, app version and a privacy policy belong. There is also a stray comma in "Made with ❤️ , by Humans.".
- **Fix:** add version/build, a short privacy statement with a link, model/dataset credits and open-source licences; fix the comma.

#### U23 · Home scrolls under the floating tab bar; the safe-area bottom class never compiles — home · Responsive
- **Screenshot:** `screens/home-populated.png`
- **Issue:** The home `ScrollView` has no `contentContainerStyle` bottom padding, unlike garden and library. With enough scans the last row sits behind the 64 dp tab bar. Separately, `components/Screen.tsx:37` uses `pb-[${insets.bottom}]`, a runtime template string that NativeWind's build-time compiler cannot see, so the intended bottom inset is silently dropped.
- **Fix:** pass `contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}` on home; replace the dynamic class with `style={{ paddingBottom: insets.bottom }}`.

#### U24 · History rows carry no date, confidence or diagnosis — home · Content / IA
- **Screenshot:** `screens/home-populated.png`
- **Issue:** Every row is a thumbnail + species name. After three scans of the same plant there is no way to tell them apart; after a wrong ID there is no confidence hint.
- **Fix:** add a relative date ("Today, 09:24") and the match percentage; group by day when the list grows.

#### U25 · The reference carousel has no page indicator or count — result · Interaction
- **Screenshot:** `screens/result-top.png`
- **Issue:** "Swipe for Reference Photos" tells users a gesture exists but not how many photos there are or where they are in the set; the dots/`1 of 5` affordance is missing.
- **Fix:** add a page indicator (dots or "1 / 5") below the image; keep it visible over the photo with a scrim.

#### U26 · Back from a result is inconsistent — result · Journey
- **Screenshot:** `screens/home-duplicate-scan.png`
- **Issue:** The in-screen back arrow calls `router.replace('/')`, hardware back pops the stack, and in one live pass (after a deep-link/open) hardware back exited to the launcher instead of home. Users cannot predict where back lands.
- **Fix:** use `router.back()` when there is history and `router.replace('/')` only as a fallback; make the hardware back and the arrow share one handler.

#### U27 · Camera and crop are full system-app handoffs with a different design language — scanner · Journey / Visual
- **Screenshot:** `screens/crop.png`, `screens/system-camera.png`
- **Issue:** "Open Camera" launches the system camera (`MediaStore.ACTION_IMAGE_CAPTURE`), then the picker's own crop activity (black/white, uppercase CROP) takes over. The app's green identity disappears for the two most important steps, and there is no framing guidance ("fill the frame with one leaf"). On the emulator the camera preview was black, so this path is also unverified end to end.
- **Fix:** either build an in-app `expo-camera` viewfinder with a leaf frame overlay and a shutter, or restyle the handoff with a "what to photograph" primer before launch. Crop is mandatory today; allow "use full photo" as well.

#### U28 · Dark mode is half-implemented — all screens · Visual / Consistency
- **Screenshot:** `screens/dark-mode-home.png`, `screens/splash.png`
- **Issue:** `userInterfaceStyle: "automatic"` plus a black dark-mode splash, but every in-app colour is hard-coded light. A dark-mode user gets a black splash, then a bright white app. The status bar is also hard-coded dark.
- **Fix:** either implement dark tokens (surface/background/ink) and react to `useColorScheme`, or set `userInterfaceStyle: "light"` and remove the dark splash variant so the promise matches the product.

#### U29 · Analysis failure is a generic toast with no recovery — scanner · Error recovery
- **Screenshot:** `screens/scan-analyzing.png`
- **Issue:** Any failure (model not ready, missing asset, OOM) becomes `ToastAndroid.show('Analysis failed. Try again.')` and returns to review. There is no distinction between "model still loading", "out of memory" and "corrupt image", and no retry action.
- **Fix:** map error types to actionable copy; keep the photo and offer "Try again" / "Choose another photo"; log the underlying error for diagnosis.

#### U30 · No first-run explanation of what the app does or what it will access — first launch · Cognitive load
- **Screenshot:** `screens/home-empty.png`
- **Issue:** The app opens on an empty home with one CTA. Nothing explains the on-device claim, what to photograph, or why the camera permission is needed. The strongest differentiator is buried in About.
- **Fix:** a one-screen, dismissible intro (or an inline banner) covering "photograph one leaf in good light", "everything runs on your phone", and "no account, no uploads".

#### U31 · 13 species appear twice in the library — library · Content / Data
- **Screenshot:** `screens/library-search.png`
- **Issue:** Searching "purple" returns two "Purple Heart" rows (`Tradescantia pallida` twice, with slightly different scientific formatting). The label set has 13 duplicated names and the image folders have 14 duplicate slugs. Users see a bug; the model was trained with duplicate classes.
- **Fix:** deduplicate the class list (merge indices or mark one as the canonical class), regenerate labels/images, and add a test that asserts unique (name, scientific) pairs.

### 🟢 S1 — cosmetic

#### U32 · Stray comma in the About footer — about · Content
- **Screenshot:** `screens/about.png`
- **Issue:** "Made with ❤️ , by Humans." has a space before the comma and an awkward comma overall.
- **Fix:** "Made with ❤️ by humans.".

#### U33 · Documentation screenshot is actually the crop screen — docs · Content
- **Screenshot:** `screens/crop.png`
- **Issue:** `docs/camera.png` in the README is the system crop activity, not the app's camera/scanner. It makes the app look like it has a custom camera it does not have.
- **Fix:** capture the real scanner idle/review states for the README, or label the image "Crop step".

---

## Technical & release audit

### 🔴 P0 — release blockers

#### T-01 · 599 MB universal APK; Play cannot accept it as-is
- **Evidence:** `android/app/build/outputs/apk/release/app-release.apk` = 599 MB; installed footprint 645 MB. Zip breakdown: 205.8 MB native libs (four ABIs), 370.1 MB `res/` (293 MB of 1,791 plant JPEGs + 76.4 MB ONNX), 44.9 MB dex, 6.8 MB assets. R8/minify and resource shrinking are off (`android/app/build.gradle:69,116-118`), and all four ABIs are packaged (`android/gradle.properties:31`).
- **Impact:** exceeds the 200 MB base-module download limit for an AAB; the 1,791 reference photos are the dominant cost.
- **Fix:** move reference photos to a Play Asset Delivery pack (or downscale to ~400 px WebP/AVIF); ship `arm64-v8a` only + AAB splits; enable R8 and `shrinkResources`; drop unused deps (T-14). Target <120 MB download.

#### T-02 · Debug signing, placeholder package and template identity
- **Evidence:** `android/app/build.gradle:115` signs release with `signingConfigs.debug`; `applicationId`/namespace = `com.anonymous.reactnativeflora`; label = `react-native-flora`; launcher icon and splash are the stock Expo assets (`assets/images/icon.png`, `splash-icon.png`); `versionCode 1`.
- **Impact:** cannot be published or updated safely; users see a template name; a future properly signed build cannot update this one.
- **Fix:** generate a release keystore (and store it outside the repo), set a real package id and app name, replace icon/splash/adaptive icon, define a versioning scheme, and add a CI release job.

#### T-03 · Over-broad manifest, backups and exported tooling in the release build
- **Evidence:** `aapt2 dump badging` shows `RECORD_AUDIO`, `READ_MEDIA_AUDIO`, `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_VISUAL_USER_SELECTED`, `SYSTEM_ALERT_WINDOW`, `WRITE_EXTERNAL_STORAGE` (≤32) and `allowBackup=true`. The declared microphone also makes `android.hardware.microphone` a required feature in Play filtering. `androidx.compose.ui.tooling.PreviewActivity` is exported; `expo.modules.devmenu` classes ship in `classes.dex`.
- **Impact:** scary permission prompt, Play review friction, install filtering, and Auto Backup can upload the MMKV scan history and copied JPEGs (up to the 25 MB quota) — directly contradicting "no uploaded photos". Exported tooling is unnecessary attack surface.
- **Fix:** remove the unused deps that inject these permissions (`expo-camera`, `expo-media-library`), strip `SYSTEM_ALERT_WINDOW`, set `android:allowBackup="false"` (or a strict `dataExtractionRules`), exclude the Compose tooling/dev-menu artifacts from release, and re-run `expo prebuild` so the manifest matches `app.json`.

### 🟡 P1 — correctness and data

#### T-04 · History is appended on every result mount; the same JPEG is copied again
- **Evidence:** `app/result/[id].tsx:55-64` calls `saveScanResult` from an effect guarded only by component state; `lib/storage.ts:26-42` copies `originalUri` to a new `scan_<Date.now()>.jpg` each time. Verified: one scan + one deep-link reopen produced two rows and a second file.
- **Fix:** save once at scan creation (or key the write by a stable session id), and make `saveScanResult` return the existing record when the source URI was already imported.

#### T-05 · Deleting a scan or a garden plant never deletes its image
- **Evidence:** `removeFromHistory` (`lib/storage.ts:50-53`) and `removeFromGarden` (`:68-71`) only rewrite the JSON arrays. Verified: after deleting a row, both `scan_*.jpg` files were still present in `/data/user/0/.../files`.
- **Fix:** reference-count the files (history + garden can share one URI), delete the file when the last reference goes, and sweep unreferenced `scan_*.jpg` on startup. Add a "Clear all scans" action.

#### T-06 · 529 MB PSS after a scan; 125 MB output tensor and a 31.4 M-iteration JS loop
- **Evidence:** `dumpsys meminfo` after a result: **529 MB PSS / 435 MB native heap** (home baseline: 128 MB / 21 MB). The disease model outputs `[1,116,520,520]` float32 = **125.5 MB**; `lib/mlPipeline.ts:118-130` performs 31.4 M iterations on the JS thread, then tints 270 k pixels and JPEG-encodes. All three sessions stay alive for the process lifetime.
- **Impact:** mid-range 3–4 GB devices will be under memory pressure; a 125 MB contiguous allocation can OOM; the argmax blocks JS for a noticeable period.
- **Fix:** run argmax on the native side or over a downsampled/thresholded output, free the segmentation session after use (or lazy-load it per scan), and consider `InferenceSession` memory patterns/quantized models. Target <250 MB PSS during a scan.

#### T-07 · Blank routes instead of error states
- **Evidence:** `app/result/[id].tsx:66`, `app/plant/[id].tsx:45` return `null`. Verified with `reactnativeflora://plant/99999` and a cleared-session `reactnativeflora://result/session`.
- **Fix:** shared error screen + root error boundary (see U8).

#### T-08 · Model initialisation race and unhandled initialisation failures
- **Evidence:** `app/camera.tsx:38` starts `init().then(() => initHealthModels())` without a `catch`; `runFullAnalysis` (`:61-104`) does not await readiness, and `analyzePlant` throws `Plant session not initialized` if the user is fast. On the emulator the pick/crop time masked the race; a fast pick or a slower device exposes it. Nothing gates the button.
- **Fix:** expose an `mlPipeline.ready` promise/state, disable Analyze until ready (with a visible "Loading models…" state), and surface init failures with retry.

#### T-09 · Selecting an alternative changes the screen but not the saved scan
- **Evidence:** `saveScanResult` runs on mount with `mainMatch` (index 0); `selectedPlantIdx` only affects rendering. Verified: history kept "Wild Angelica" after the header was switched to "Garden Angelica". Saving to garden uses the selected class, so garden and history can disagree.
- **Fix:** treat the model's top-1 as the saved diagnosis and record the user's override as a correction (`correctedClassIndex`), or update the history record when the selection changes.

#### T-10 · Duplicate classes and inconsistent labels in the shipped dataset
- **Evidence:** 364 model outputs; 1,791 reference images; 13 duplicated names (14 duplicated folder slugs), e.g. `104_purple_heart` and `304_purple_heart`, `Tradescantia pallida (Rose) D.R. Hunt` vs `D.R.Hunt`.
- **Fix:** merge duplicate classes in the training export and regenerate `plantClasses.ts` / `plantImages.ts` from one canonical CSV; add a uniqueness check to the generator.

#### T-11 · Species/disease contradiction is not detected
- **Evidence:** the tomato leaf result rendered "Tulip Tree" and "Tomato Septoria Leaf Spot" together. The pipeline runs the classifiers independently and the UI concatenates them.
- **Fix:** add a host-compatibility table and a conflict warning (or suppress disease labels incompatible with the plant), plus a general low-confidence banner.

### 🟠 P2 — quality

#### T-12 · Deprecated APIs and two concurrent full-resolution decodes
- **Evidence:** `Swipeable` is deprecated in RNGH 2.28 (`@deprecated use Reanimated version`); `manipulateAsync` is deprecated in the installed expo-image-manipulator; `app/camera.tsx:66-77` runs two `manipulateAsync` calls in `Promise.all`, each decoding the full-resolution photo before resizing to 224/520.
- **Fix:** migrate to `ReanimatedSwipeable` and the contextual `ImageManipulator.manipulate(...)` API with `maxWidth/maxHeight` so the source is downsampled while decoding; resize once and derive both tensors.

#### T-13 · The safe-area class is a no-op
- **Evidence:** `components/Screen.tsx:37` — `pb-[${insets.bottom}]` is a runtime template string; NativeWind compiles classes statically.
- **Fix:** apply the inset with `style={{ paddingBottom: insets.bottom }}` (see U23).

#### T-14 · Seven unused dependencies and duplicated fonts inflate the package
- **Evidence:** no imports for `expo-camera`, `expo-media-library`, `expo-dev-client`, `expo-blur`, `expo-symbols`, `expo-web-browser`, `@gorhom/bottom-sheet`. `expo-camera` alone pulls ML Kit barcode scanning (`com.google.mlkit:barcode-scanning:17.3.0`) into the APK. Fonts are bundled twice: 13 under `assets/fonts/` and again under `res/*.ttf` (33 `.ttf` entries for 13 loaded fonts, several MB of duplication).
- **Fix:** remove unused deps, load fonts only through `useFonts` (drop the config-plugin copy or vice versa), and re-measure the APK. Removing `expo-camera` also removes the mic/barcode artifacts if `RECORD_AUDIO` is not declared elsewhere.

#### T-15 · Native project drifted from `app.json`
- **Evidence:** `app.json` sets `recordAudioAndroid: false` and `barcodeScannerEnabled: false`, yet the release manifest still declares `RECORD_AUDIO` and the APK contains the ML Kit barcode activity. `android/` was not regenerated after those config changes.
- **Fix:** run `npx expo prebuild --clean` with the final config, then diff the manifest and APK; add `expo-doctor`/config validation to CI.

#### T-16 · No tests, no CI, no crash diagnostics
- **Evidence:** no `.github/`, no test runner, `package.json` scripts are start/android/ios/web/lint only. Errors are `console.error` + Toast.
- **Fix:** add Jest + React Native Testing Library for storage/pipeline utilities, a GitHub Actions job for typecheck/lint/test, and a privacy-respecting crash reporter (Sentry with PII off) or at least structured local logs.

#### T-17 · Storage is unversioned, unvalidated JSON
- **Evidence:** `lib/storage.ts` parses `JSON.parse(storage.getString(...))` with no try/catch and no schema version. A partial write, a manual clear, or a shape change crashes the home/garden/result render.
- **Fix:** wrap reads in a safe parser with a fallback to `[]`, add a `schemaVersion` key and a migration path, and store records in MMKV per id rather than one ever-growing JSON string.

#### T-18 · No error boundary
- **Evidence:** no `ErrorBoundary` in `app/_layout.tsx`; a render throw (missing class, undefined pest, corrupt JSON) leaves a blank frame with no recovery.
- **Fix:** wrap the stack in a root error boundary with a "Reload" action; log the error locally.

### 🔵 P3 — hygiene

#### T-19 · Documentation drift
- **Evidence:** `docs/camera.png` is the crop screen; the README says the app "degrades to a top-5 list when confidence is low" but top-5 is always rendered; `https://docs.expo.dev/versions/v54.0.0/...` now 301-redirects to `latest` (v58), so the AGENTS instruction to read the v54 docs cannot be followed verbatim. `app/.mypy_cache/` exists locally (untracked) inside the routes directory.
- **Fix:** re-capture README shots, correct the top-5 sentence, pin the Expo docs version you actually rely on (or vendor the relevant pages), and add `.mypy_cache/` to `.gitignore`.

#### T-20 · Dependency advisories
- **Evidence:** `npm audit --omit=dev` reports 2 critical / 17 high, concentrated in the toolchain (`@babel/core`, `@xmldom/xmldom`, `brace-expansion`, `plist`). No runtime fetch path was found in the app bundle, so this is not a proven in-app exploit, but the build chain is exposed.
- **Fix:** update the lockfile with `npm audit fix` in a branch, re-run a release build, and re-audit; pin Expo-compatible versions.

---

## Measurements

| Metric | Value | How |
|---|---|---|
| Cold start (home) | 1.5–1.8 s | `am start -W` |
| Analysis tap → result (models warm) | ~6 s | tap → result text, emulator |
| Steady-state PSS | 128 MB (home) → **529 MB** (result) | `dumpsys meminfo` |
| Native heap at result | 435 MB | `dumpsys meminfo` |
| APK | 599 MB (645 MB installed) | `ls`, `du` |
| Native libs | 205.8 MB (4 ABIs) | zip breakdown |
| `res/` | 370.1 MB (293 MB photos + 76.4 MB models) | zip breakdown |
| Dex | 44.9 MB (R8 off) | zip breakdown |
| Reference images | 1,791 files, avg 165 KB | `find`/`du` |
| Model classes | 364 plant / 102 pest / 116 disease | ONNX metadata |
| Disease output | 116 × 520 × 520 float32 = 125.5 MB | ONNX shape |
| Inactive tab contrast | **1.67:1** | computed composite |
| Match text contrast | **2.36:1** | computed |
| Danger text contrast | **3.17:1** | computed |
| Tab hit target | **42 px = 16 dp** | uiautomator bounds |
| Back/close targets | 118 px = 45 dp | uiautomator bounds |

---

## Priority fix plan

**1 · Ship blockers (≈2–3 days)**
1. Real identity: package id, app name, icon, splash, release keystore, versioning (T-02, U15).
2. Strip permissions/backup/exported tooling; remove unused native deps (T-03, T-14, U16).
3. AAB + arm64-only + R8 + Asset Delivery/compressed photos; target <120 MB download (T-01).

**2 · Make the product loop reliable (≈2–3 days)**
4. Reopen a scan from history/garden; render the user's photo (U4, U5, U11).
5. Idempotent save + file GC + clear-all (T-04, T-05, U9).
6. Error states instead of blank routes + boundary (T-07, T-08, U8).
7. Keep history/garden consistent with the shown diagnosis (T-09, U12).

**3 · Accessibility floor (≈2 days)**
8. Tab bar: labels, 48 dp targets, 3:1+ contrast (U1).
9. Icon labels/roles everywhere; status bar per screen (U2, U3).
10. Contrast tokens for accent/danger; dynamic type on a device (U10).

**4 · Performance (≈3–5 days)**
11. Native/downsampled argmax, release sessions, lazy model load (T-06).
12. Single decode, native resize, Reanimated Swipeable (T-12).
13. Re-measure PSS and analysis time on a physical arm64 device.

**5 · Polish (≈1 week)**
14. Empty-state CTAs, no-results, About/privacy/version, onboarding (U17–U22, U30).
15. Severity + legend + uncropped mask (U20, U21).
16. Tab/history metadata, carousel indicator, dark-mode decision (U24, U25, U28).
17. Documentation and dataset de-duplication (T-10, T-19).

---

## Needs a live / automated check

- Full TalkBack pass (labels were inspected, but focus order and announcements were not).
- System font scale on a physical device (the emulator ignored it); check fixed-height rows and the 5xl headings at 1.3×/2×.
- Camera capture on hardware (emulator preview was black); verify the system camera → crop → analyze path and EXIF orientation.
- Long-session storage growth: 100 scans, then measure `files/` and MMKV size.
- AAB install via Play internal testing, including asset-pack download.
- Exact contrast on device for image-overlaid text and the disease overlay.
- Jank/ANR traces during the disease argmax on a low-end device.
- iOS build (Podfile references ONNX, README says Android-only).

## Suggested next step

Fix the three P0 items and U1/U4/U8 first — they decide whether the app can ship and whether users can use their own scans. Then re-capture the same 26 states and compare against `screens/`; the report is designed to be re-run as a regression baseline.
