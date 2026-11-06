# App shell: Material You, theme modes, navigation

The chrome is native Material 3 through `@expo/ui`. Lists, photos and the camera
flow stay in React Native and read the same palette.

## Palette and theme modes

`lib/appTheme.tsx` owns the theme:

- `getMaterialColors({ scheme })` reads the wallpaper on Android 12+, so the app
  follows Material You dynamic color. Below Android 12 it falls back to a
  palette seeded from the FloraLens green (`#2D5A27`), using the same
  `SchemeTonalSpot` algorithm.
- `mode` is `system`, `light` or `dark`, stored in MMKV under `theme_mode`.
- `system` resolves through `useColorScheme()`, so the app follows the device
  toggle.
- The provider also sets the status bar style and the native window background
  (`expo-system-ui`), which avoids a white flash during route transitions.
- `hostTheme` carries `colorScheme` (and the seed when wallpaper colors are not
  available) to every Compose `Host`.

`app.json` has `"userInterfaceStyle": "automatic"`. The native side needs that
value to report dark mode, so changing it requires `expo prebuild`.

Material roles are `#RRGGBBAA`. Use `withAlpha(color, alpha)` to change
opacity; concatenating produces a 9-digit color and Compose throws
`Unknown color`.

## Navigation

Five destinations: Home, My scans, Scan, Garden, Library.

- Home, My scans, Garden and Library are real tabs.
- Scan is not a tab page. The middle item pushes `/camera`, a full-screen stack
  route with its own close button, so the camera never becomes a swipe target.
  That route opens the system camera on mount; cancelling falls back to the
  picker screen, and the review step keeps a gallery button next to Analyze.
- `components/SwipePager.tsx` handles horizontal swipes between the four tab
  pages. Vertical drags fail the gesture, so lists scroll normally.
- Each tab page slides in 26 px from its side and fades up over ~240 ms. The
  tab navigator's own `animation` option did not run reliably with the custom
  Compose tab bar, so `Screen` drives the transition with Reanimated instead.
  The direction comes from the tab order in `PAGE_ORDER`.
- Swipe-to-delete on rows is gone because it competed with paging. Rows delete
  through a trash button and long press.

## Screens

Home opens with the name, a two-line privacy note and a settings button, then
Recent scans (three) and Today's picks (three library plants seeded by the
local date, `lib/dailyPicks.ts`). Section headers carry an arrow to the full
list.

Settings is a modal route and holds appearance, language (coming soon), About
FloraLens and the optional offline photo pack.

## Components

| File | Android | iOS / web |
|---|---|---|
| `components/material/AppBar.*` | `TopAppBar` (`windowInsets={{}}`, the screen owns the safe area) | large React Native title |
| `components/material/TabBar.*` | `NavigationBar` + `NavigationBarItem` + Material Symbols | React Native bar with the same five items |
| `components/EmptyState.*` | `Card` + `Icon` + `Text` + `Button` | rounded `View` + `Pressable` |

Platform files keep `@expo/ui` out of iOS and web bundles. Shared prop types live
in `appBarTypes.ts` and `emptyStateTypes.ts` because TypeScript resolves the
neutral file, not the `.android` one.

## Gotchas

- `Host` with `matchContents` does not report its height inside a `FlatList`
  cell; the empty state collapsed to zero. It now has a fixed 320 dp host.
- The tab bar is not an absolute floating pill, so screens do not add bottom
  padding for it; Compose applies the system bar insets.
- Icons come from `@expo/material-symbols` as XML drawables, imported only in
  Android files. They survive release packaging.

## Verified

Android 16 emulator, debug + Metro: five-item bar, camera action, swipe paging
between all four pages, light/dark/system (device night mode toggled under the
app), settings persistence, themed result and plant detail screens, library
search and empty state. `tsc --noEmit`, `expo lint` and `expo-doctor` pass.
