import { Pressable, Text, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useRouter } from 'expo-router';
import { BookOpen, Camera, House, Images, Leaf } from 'lucide-react-native';
import { useAppTheme } from '@/lib/appTheme';

const ITEMS = [
    { name: 'index', label: 'Home', Icon: House },
    { name: 'scans', label: 'My scans', Icon: Images },
    { name: 'camera', label: 'Scan', Icon: Camera },
    { name: 'garden', label: 'Garden', Icon: Leaf },
    { name: 'library', label: 'Library', Icon: BookOpen },
] as const;

/**
 * Non-Android tab bar. Android gets the native Material 3 `NavigationBar` from
 * `TabBar.android.tsx`.
 */
export function MaterialTabBar({
    state,
    emitter,
    navigateToTab,
    insets,
}: BottomTabBarProps) {
    const { colors } = useAppTheme();
    const router = useRouter();
    const activeName = state.routes[state.index]?.name;

    return (
        <View
            style={{
                flexDirection: 'row',
                backgroundColor: colors.surface,
                paddingBottom: insets.bottom + 6,
                paddingTop: 6,
            }}>
            {ITEMS.map(({ name, label, Icon }) => {
                const selected = name !== 'camera' && activeName === name;
                const route = state.routes.find((r) => r.name === name);
                return (
                    <Pressable
                        key={name}
                        accessibilityRole='tab'
                        accessibilityState={{ selected }}
                        accessibilityLabel={label}
                        style={{ flex: 1, alignItems: 'center', gap: 2 }}
                        onPress={() => {
                            if (name === 'camera') {
                                router.push('/camera');
                                return;
                            }
                            if (!route) return;
                            const event = emitter.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });
                            if (!selected && !event.defaultPrevented) {
                                navigateToTab(route.key);
                            }
                        }}>
                        <View
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: 4,
                                borderRadius: 999,
                                backgroundColor:
                                    selected ?
                                        colors.primary + '22'
                                    :   'transparent',
                            }}>
                            <Icon
                                size={22}
                                color={selected ? colors.primary : colors.onSurfaceVariant}
                                strokeWidth={selected ? 2.2 : 1.8}
                            />
                        </View>
                        <Text
                            style={{
                                fontSize: 11,
                                color:
                                    selected ?
                                        colors.primary
                                    :   colors.onSurfaceVariant,
                                fontWeight: selected ? '700' : '500',
                            }}>
                            {label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
