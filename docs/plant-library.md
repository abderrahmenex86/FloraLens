# Plant library and offline photo pack

The app now bundles **one 400 px WebP thumbnail per species** and makes the
full-resolution reference photos an optional download.

## Generated files

```text
assets/images/plants_thumbs/<class_id>.webp   # bundled, 364 files, ~12 MB
lib/plantThumbs.ts                            # static require map
plant-pack/full/<class_id>/<n>.webp            # optional, 1,793 files, ~74 MB
plant-pack/manifest.json                       # paths, sizes, checksums
```

The original `assets/images/plants/<class_id>_<slug>/*.jpg` stay as the source
material. They are gitignored and are no longer required by the app bundle.

## Rebuild

```bash
python tools/build_plant_library.py \
  --images-root assets/images/plants \
  --thumbs-out assets/images/plants_thumbs \
  --pack-out plant-pack \
  --thumb-width 400 --full-width 720 \
  --max-per-class 5
```

This rewrites `lib/plantThumbs.ts`. Commit the thumbnails and the module; do not
commit `plant-pack/`.

## Host the full pack

Upload the contents of `plant-pack/` to a static host (Cloudflare R2 is a good
fit) with `manifest.json` at a stable URL, for example:

```text
https://cdn.example.com/floralens/plant-pack/manifest.json
https://cdn.example.com/floralens/plant-pack/full/0/0.webp
```

Then build the app with:

```bash
EXPO_PUBLIC_PLANT_PACK_URL=https://cdn.example.com/floralens/plant-pack/manifest.json \
  npx expo start --dev-client
```

The manifest contains `version`, `image_count`, `full_bytes` and per-file
`path`, `bytes`, `sha256`. The app downloads up to four files at a time, checks
the byte size, stores them under `documents/plant-pack/`, and writes an index to
MMKV. The About tab shows download progress, installed size and a delete action.

For local testing, serve the pack from the host and use the emulator alias:

```bash
(cd plant-pack && python3 -m http.server 8000)
EXPO_PUBLIC_PLANT_PACK_URL=http://10.0.2.2:8000/manifest.json \
  npx expo start --dev-client
```

## App API

- `lib/plantAssets.ts` — `getPlantImages(classId)` returns full files when the
  pack is installed, otherwise the bundled thumbnail.
- `lib/plantPack.ts` — status, download, delete and byte formatting.
- The result screen, plant detail, library and garden use the same helpers.

## Attribution

The reference images come from Pl@ntNet-300K and are marked CC BY-SA in the pack
manifest. Add the author/licence credits screen before publishing. The bundled
thumbnails are derived from the same source and carry the same obligation.
