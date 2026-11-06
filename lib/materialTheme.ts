import type { MaterialColors } from '@expo/ui/jetpack-compose';
import { expoUi } from './expoUi';
import { colors as brand } from '../theme';

/**
 * Material You palette for the whole app.
 *
 * Wallpaper-derived dynamic color is available on Android 12+, but FloraLens
 * has a green identity and a lot of brand-colored content. Set this to `true`
 * to let the user's wallpaper recolor the whole app instead.
 */
const USE_WALLPAPER_COLORS = false;

/**
 * The app is light-only (`userInterfaceStyle: "light"`), so the palette is
 * forced to the light scheme. Without wallpaper colors the palette is seeded
 * from the FloraLens green (`SchemeTonalSpot`, the same algorithm Material You
 * uses), which works on every Android API level.
 */
export const isDynamicColor =
    USE_WALLPAPER_COLORS && expoUi != null && expoUi.isDynamicColorAvailable;

const palette: MaterialColors | null =
    expoUi ?
        expoUi.getMaterialColors(
            isDynamicColor ?
                { scheme: 'light' }
            :   { scheme: 'light', seedColor: brand.primary },
        )
    :   null;

/** Props every `Host` needs so Compose content shares the same palette. */
export const hostTheme =
    isDynamicColor || expoUi == null ?
        { colorScheme: 'light' as const }
    :   { colorScheme: 'light' as const, seedColor: brand.primary };

export const materialColors = palette;

/**
 * Semantic tokens used by React Native surfaces. Values are Material 3 roles,
 * so they follow the same wallpaper-derived palette as the Compose components.
 */
export const colors = {
    background: palette?.background ?? brand.background,
    primary: palette?.primary ?? brand.primary,
    accent: palette?.tertiary ?? brand.accent,
    ink: palette?.onBackground ?? brand.ink,
    surface: palette?.surfaceContainer ?? brand.surface,
    surfaceHigh: palette?.surfaceContainerHigh ?? brand.surface,
    onPrimary: palette?.onPrimary ?? '#FFFFFF',
    onSurfaceVariant: palette?.onSurfaceVariant ?? '#4A4F46',
    outline: palette?.outline ?? '#B7BDB2',
    danger: palette?.error ?? brand.danger,
} as const;

export type AppColors = typeof colors;

/**
 * Material roles are `#RRGGBBAA`. Replace the alpha channel instead of
 * concatenating, which would produce an invalid 9-digit color.
 */
export function withAlpha(color: string, alpha: string): string {
    return color.length === 9 ? `${color.slice(0, 7)}${alpha}` : color;
}

