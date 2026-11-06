import { BottomTabBar, type BottomTabBarProps } from 'expo-router/tabs';

/**
 * Non-Android tab bar. Android gets the native Material 3 `NavigationBar` from
 * `TabBar.android.tsx`.
 */
export function MaterialTabBar(props: BottomTabBarProps) {
    return <BottomTabBar {...props} />;
}
