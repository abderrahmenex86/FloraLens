import {
    Host,
    Icon,
    NavigationBar,
    NavigationBarItem,
    Text,
} from '@expo/ui/jetpack-compose';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { hostTheme } from '@/lib/materialTheme';
import HomeIcon from '@expo/material-symbols/home.xml';
import GardenIcon from '@expo/material-symbols/yard.xml';
import LibraryIcon from '@expo/material-symbols/menu_book.xml';
import AboutIcon from '@expo/material-symbols/info.xml';

const TABS: Record<string, { label: string; icon: number | { uri: string } }> =
    {
        index: { label: 'Home', icon: HomeIcon },
        garden: { label: 'Garden', icon: GardenIcon },
        library: { label: 'Library', icon: LibraryIcon },
        about: { label: 'About', icon: AboutIcon },
    };

/**
 * Native Material 3 navigation bar. Compose applies the system bar insets
 * itself, so the React Native side adds no bottom padding.
 */
export function MaterialTabBar({
    state,
    emitter,
    navigateToTab,
}: BottomTabBarProps) {
    return (
        <Host
            {...hostTheme}
            matchContents={{ vertical: true }}
            style={{ width: '100%' }}>
            <NavigationBar>
                {state.routes.map((route, index) => {
                    const tab = TABS[route.name] ?? TABS.index;
                    const focused = state.index === index;
                    return (
                        <NavigationBarItem
                            key={route.key}
                            selected={focused}
                            alwaysShowLabel
                            onClick={() => {
                                const event = emitter.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });
                                if (!focused && !event.defaultPrevented) {
                                    navigateToTab(route.key);
                                }
                            }}>
                            <NavigationBarItem.Icon>
                                <Icon
                                    source={tab.icon}
                                    contentDescription={tab.label}
                                />
                            </NavigationBarItem.Icon>
                            <NavigationBarItem.Label>
                                <Text>{tab.label}</Text>
                            </NavigationBarItem.Label>
                        </NavigationBarItem>
                    );
                })}
            </NavigationBar>
        </Host>
    );
}
