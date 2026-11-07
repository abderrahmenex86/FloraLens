# Photo access

The scan gallery is an in-app grid backed by `expo-media-library`, not the
system photo picker. That is what makes Android's **Selected photos** control
available.

## Permission model

| Android | Permission | What the user sees |
|---|---|---|
| 14+ | `READ_MEDIA_IMAGES` + `READ_MEDIA_VISUAL_USER_SELECTED` | Allow all, or **Select photos** |
| 13 | `READ_MEDIA_IMAGES` | Allow all or deny |
| 12 and below | `READ_EXTERNAL_STORAGE` (maxSdk 32) | Allow all or deny |

`READ_MEDIA_VIDEO` and `READ_MEDIA_AUDIO` are explicitly blocked in
`app.json`; the app only asks for photos. `WRITE_EXTERNAL_STORAGE` is blocked
too, since scans are copied into app-private storage.

On Android 14+, choosing **Select photos** grants limited access. The grid
queries MediaStore through `expo-media-library`, so only the allowed assets are
returned. The rest of the gallery is never listed, read, or thumbnailed.

## Changing the selection

When access is limited, the picker shows "Showing only the photos you allowed"
with a **Select photos** action. It calls
`presentPermissionsPicker(['photo'])`, which reopens the system selection
sheet. Returning to the app reloads the grid.

If access is denied and the system will not prompt again, the empty state links
to the app's system settings.

## Flow

1. Camera screen → gallery button opens `/photo-picker`.
2. The picker requests photo access once, then loads a paginated MediaStore
   query (newest first).
3. Tapping a tile resolves `asset.getUri()` and hands the file URI back to the
   camera review screen.
4. `saveScan` copies the chosen photo into `files/scan_<id>.jpg`, so the scan
   keeps working even if the user later revokes photo access.

Photos are decoded on-device and never uploaded.
