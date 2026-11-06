# Material You shell

The app chrome is native Material 3, rendered by Jetpack Compose through
`@expo/ui`. Content that Compose cannot express (lists with swipe actions,
photos, the camera flow) stays in React Native and reads the same palette.

## Palette

`lib/materialTheme.ts` builds one Material 3 palette at startup with
`getMaterialColors({ scheme: 'light', seedColor })` and exposes:

- `colors` — semantic tokens for React Native surfaces (`background`, `primary`,
  `ink`, `surface`, `onSurfaceVariant`, …).
- `hostTheme` — the matching props (`colorScheme`, `seedColor`) for every
  `Host`, so Compose children theme identically.
- `withAlpha(color, alpha)` — Material roles are `#RRGGBBAA`; replace the alpha
  channel instead of concatenating, or Compose throws `Unknown color`.

`USE_WALLPAPER_COLORS` in the same file switches the source:

| Value | Palette |
|---|---|
| `false` (current) | Seeded from `#2D5A27`, the FloraLens green. Works on every API level. |
| `true` | Wallpaper-derived on Android 12+ (`Material 3 Dynamic Colors`). |

Wallpaper colors turn a plant app blue, so the brand seed is the default.

## Components

| File | Android | iOS / web |
|---|---|---|
| `components/material/AppBar.*` | `TopAppBar` (`windowInsets={{}}`, the screen owns the safe area) | large React Native title |
| `components/material/TabBar.*` | `NavigationBar` + `NavigationBarItem` + Material Symbols | React Navigation `BottomTabBar` |
| `components/material/HeroCard.*` | `Card` + `Row` + `FilledTonalIconButton`, `clickable` on the card | `Pressable` card |
| `components/EmptyState.*` | `Card` + `Icon` + `Text` + `Button` | rounded `View` + `Pressable` |

Platform files keep `@expo/ui` out of iOS and web bundles entirely. Shared prop
types live in `appBarTypes.ts`, `heroCardTypes.ts` and `emptyStateTypes.ts`
because TypeScript resolves the neutral file, not the `.android` one.

## Gotchas

- `Host` with `matchContents` does not report its height back inside a
  `FlatList` cell; the empty state collapsed to zero. It now has a fixed
  320 dp host and the card fills it.
- The tab bar is no longer an absolute floating pill, so screens dropped the
  `120 + insets.bottom` list padding and the tab bar supplies its own system
  bar insets.
- Icons come from `@expo/material-symbols` and are imported as XML assets in
  Android-only files.

## Verified

Android 16 emulator, debug + Metro: Home (native app bar, hero card, native
tab bar), Garden, Library (search + native empty state with working action),
About, plant detail, camera → crop → on-device analysis → result, save to
garden, swipe-to-delete. `tsc --noEmit`, `expo lint` and `expo-doctor` pass.

The x86_64 release APK was also installed and launched without Metro: the
native shell, the Material Symbols drawables and the Compose empty state all
render, so the XML assets survive release packaging.
