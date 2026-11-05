import { colors } from '@/theme';
import { Tabs } from 'expo-router';
import { BookOpen, House, Info, Leaf } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticLight } from '../../lib/haptics';

export default function HomeLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenListeners={{
                tabPress: () => {
                    hapticLight();
                },
            }}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: '#FFFFFF',
                tabBarInactiveTintColor: '#FFFFFFD9',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontFamily: 'vietnam-medium',
                    marginTop: -2,
                },
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 16 + insets.bottom,
                    height: 72,
                    marginHorizontal: 20,
                    borderRadius: 24,
                    paddingTop: 4,
                    paddingBottom: 4,
                    backgroundColor: colors.primary,
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowColor: 'transparent',
                },
                tabBarItemStyle: {
                    paddingVertical: 0,
                    height: 64,
                },
            }}>
            <Tabs.Screen
                name='index'
                options={{
                    title: 'Home',
                    tabBarAccessibilityLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <House
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name='garden'
                options={{
                    title: 'Garden',
                    tabBarAccessibilityLabel: 'Garden',
                    tabBarIcon: ({ color, size }) => (
                        <Leaf
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name='library'
                options={{
                    title: 'Library',
                    tabBarAccessibilityLabel: 'Library',
                    tabBarIcon: ({ color, size }) => (
                        <BookOpen
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name='about'
                options={{
                    title: 'About',
                    tabBarAccessibilityLabel: 'About',
                    tabBarIcon: ({ color, size }) => (
                        <Info
                            color={color}
                            size={size}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
