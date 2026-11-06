import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import type { MaterialColors } from '@expo/ui/jetpack-compose';
import { expoUi } from './expoUi';
import { colors as brand } from '../theme';
import { storage } from './storage';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

const THEME_KEY = 'theme_mode';

/** Material You reads the wallpaper; the brand green is the fallback. */
const USE_WALLPAPER_COLORS = true;

/**
 * Material roles are `#RRGGBBAA`. Replace the alpha channel instead of
 * concatenating, which would produce an invalid 9-digit color.
 */
export function withAlpha(color: string, alpha: string): string {
    return color.length === 9 ? `${color.slice(0, 7)}${alpha}` : color;
}

function readStoredMode(): ThemeMode {
    const stored = storage.getString(THEME_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ?
            stored
        :   'system';
}

function paletteFor(scheme: ColorScheme): MaterialColors | null {
    if (!expoUi) return null;
    return expoUi.getMaterialColors(
        USE_WALLPAPER_COLORS && expoUi.isDynamicColorAvailable ?
            { scheme }
        :   { scheme, seedColor: brand.primary },
    );
}

export type AppColors = {
    background: string;
    surface: string;
    surfaceHigh: string;
    primary: string;
    onPrimary: string;
    accent: string;
    onAccent: string;
    ink: string;
    onSurfaceVariant: string;
    outline: string;
    danger: string;
};

function mapColors(palette: MaterialColors | null): AppColors {
    return {
        background: palette?.background ?? brand.background,
        surface: palette?.surfaceContainer ?? brand.surface,
        surfaceHigh: palette?.surfaceContainerHigh ?? brand.surface,
        primary: palette?.primary ?? brand.primary,
        onPrimary: palette?.onPrimary ?? '#FFFFFF',
        accent: palette?.tertiary ?? brand.accent,
        onAccent: palette?.onTertiary ?? '#FFFFFF',
        ink: palette?.onBackground ?? brand.ink,
        onSurfaceVariant: palette?.onSurfaceVariant ?? '#4A4F46',
        outline: palette?.outline ?? '#B7BDB2',
        danger: palette?.error ?? brand.danger,
    };
}

type ThemeContextValue = {
    mode: ThemeMode;
    scheme: ColorScheme;
    colors: AppColors;
    /** Props for every `@expo/ui` Host so Compose content matches the RN side. */
    hostTheme: { colorScheme: ColorScheme; seedColor?: string };
    setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
    const systemScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>(readStoredMode);

    const scheme: ColorScheme =
        mode === 'system' ?
            systemScheme === 'dark' ?
                'dark'
            :   'light'
        :   mode;

    const palette = useMemo(() => paletteFor(scheme), [scheme]);
    const colors = useMemo(() => mapColors(palette), [palette]);

    const usesWallpaper =
        USE_WALLPAPER_COLORS && expoUi != null && expoUi.isDynamicColorAvailable;

    const hostTheme = useMemo(
        () =>
            usesWallpaper ?
                { colorScheme: scheme }
            :   { colorScheme: scheme, seedColor: brand.primary },
        [scheme, usesWallpaper],
    );

    const setMode = useCallback((next: ThemeMode) => {
        storage.set(THEME_KEY, next);
        setModeState(next);
    }, []);

    // Keep the native window background in sync so route transitions do not
    // flash white in dark mode.
    useEffect(() => {
        SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
    }, [colors.background]);

    const value = useMemo(
        () => ({ mode, scheme, colors, hostTheme, setMode }),
        [mode, scheme, colors, hostTheme, setMode],
    );

    return (
        <ThemeContext.Provider value={value}>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            {children}
        </ThemeContext.Provider>
    );
}

export function useAppTheme(): ThemeContextValue {
    const value = useContext(ThemeContext);
    if (!value) {
        throw new Error('useAppTheme must be used inside AppThemeProvider');
    }
    return value;
}
