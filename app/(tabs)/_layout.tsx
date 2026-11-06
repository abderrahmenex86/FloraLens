import { Tabs } from 'expo-router';
import { MaterialTabBar } from '../../components/material/TabBar';
import { hapticLight } from '../../lib/haptics';

export default function HomeLayout() {
    return (
        <Tabs
            tabBar={(props) => <MaterialTabBar {...props} />}
            screenListeners={{
                tabPress: () => {
                    hapticLight();
                },
            }}
            screenOptions={{
                headerShown: false,
            }}>
            <Tabs.Screen
                name='index'
                options={{ title: 'Home' }}
            />
            <Tabs.Screen
                name='scans'
                options={{ title: 'My scans' }}
            />
            <Tabs.Screen
                name='garden'
                options={{ title: 'Garden' }}
            />
            <Tabs.Screen
                name='library'
                options={{ title: 'Library' }}
            />
        </Tabs>
    );
}
