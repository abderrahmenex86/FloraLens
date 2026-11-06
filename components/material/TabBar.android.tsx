import {
    Host,
    Icon,
    NavigationBar,
    NavigationBarItem,
    Text,
} from '@expo/ui/jetpack-compose';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/lib/appTheme';
import HomeIcon from '@expo/material-symbols/home.xml';
import ScansIcon from '@expo/material-symbols/photo_library.xml';
import CameraIcon from '@expo/material-symbols/photo_camera.xml';
import GardenIcon from '@expo/material-symbols/yard.xml';
import LibraryIcon from '@expo/material-symbols/menu_book.xml';

type TabName = 'index' | 'scans' | 'garden' | 'library';

const ITEMS: {
    name: TabName | 'camera';
    label: string;
    icon: number | { uri: string };
}[] = [
    { name: 'index', label: 'Home', icon: HomeIcon },
    { name: 'scans', label: 'My scans', icon: ScansIcon },
    { name: 'camera', label: 'Scan', icon: CameraIcon },
    { name: 'garden', label: 'Garden', icon: GardenIcon },
    { name: 'library', label: 'Library', icon: LibraryIcon },
];

/**
 * Native Material 3 navigation bar. Compose applies the system bar insets
 * itself, so the React Native side adds no bottom padding.
 *
 * The middle item opens the camera as a full-screen stack route instead of
 * being a tab page.
 */
export function MaterialTabBar({
    state,
    emitter,
    navigateToTab,
}: BottomTabBarProps) {
    const { hostTheme } = useAppTheme();
    const router = useRouter();

    const activeName = state.routes[state.index]?.name;

    return (
        <Host
            {...hostTheme}
            matchContents={{ vertical: true }}
            style={{ width: '100%' }}>
            <NavigationBar>
                {ITEMS.map((item) => {
                    const isCamera = item.name === 'camera';
                    const route = state.routes.find(
                        (candidate) => candidate.name === item.name,
                    );
                    const selected = !isCamera && activeName === item.name;

                    return (
                        <NavigationBarItem
                            key={item.name}
                            selected={selected}
                            alwaysShowLabel
                            onClick={() => {
                                if (isCamera) {
                                    router.push('/camera');
                                    return;
                                }
                                if (!route || !route.key) return;
                                const event = emitter.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });
                                if (!selected && !event.defaultPrevented) {
                                    navigateToTab(route.key);
                                }
                            }}>
                            <NavigationBarItem.Icon>
                                <Icon
                                    source={item.icon}
                                    contentDescription={item.label}
                                />
                            </NavigationBarItem.Icon>
                            <NavigationBarItem.Label>
                                <Text>{item.label}</Text>
                            </NavigationBarItem.Label>
                        </NavigationBarItem>
                    );
                })}
            </NavigationBar>
        </Host>
    );
}
