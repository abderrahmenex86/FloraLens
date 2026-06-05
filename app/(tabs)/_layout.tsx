import { colors } from '@/theme';
import { Tabs } from 'expo-router';
import { BookOpen, House, Info, Leaf } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticLight } from '../../lib/haptics';

export default function HomeLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarActiveTintColor: '#FFFFFF',
                tabBarInactiveTintColor: '#FFFFFF33',
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 16 + insets.bottom,
                    height: 64,
                    marginHorizontal: 28,
                    borderRadius: 24,
                    backgroundColor: colors.primary,
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowColor: 'transparent',
                },
                tabBarItemStyle: {
                    paddingVertical: 12,
                },
                tabBarButton: (props) => (
                    <Pressable
                        {...props}
                        onPress={(e) => {
                            hapticLight();
                            props.onPress?.(e);
                        }}
                    />
                ),
            }}>
            <Tabs.Screen
                name='index'
                options={{
                    title: 'Home',
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
