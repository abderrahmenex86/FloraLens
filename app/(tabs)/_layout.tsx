import { Tabs } from 'expo-router';
import { BookOpen, House, Info, Leaf } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HomeLayout = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarActiveTintColor: '#F4F7F2',
                tabBarInactiveTintColor: '#84B026',
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 16 + insets.bottom,
                    height: 80,
                    marginHorizontal: 28,
                    borderRadius: 32,
                    backgroundColor: '#2D5A27',
                    borderTopWidth: 0,
                    elevation: 0,
                },
                tabBarItemStyle: {
                    paddingVertical: 80 / 2 - 40 / 1.6,
                },
                tabBarIconStyle: {
                    width: 40,
                    height: 40,
                    alignItems: 'center',
                },
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
};

export default HomeLayout;
