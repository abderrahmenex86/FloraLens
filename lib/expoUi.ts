import { Platform } from 'react-native';

type ExpoUiModule = typeof import('@expo/ui/jetpack-compose');

declare const require: (id: string) => unknown;

/**
 * `@expo/ui/jetpack-compose` talks to native Compose views, so it must never be
 * evaluated on iOS or web. Metro still bundles it, but the `require` only runs
 * on Android.
 */
export const expoUi: ExpoUiModule | null =
    Platform.OS === 'android' ?
        (require('@expo/ui/jetpack-compose') as ExpoUiModule)
    :   null;

export const hasExpoUi = expoUi != null;
