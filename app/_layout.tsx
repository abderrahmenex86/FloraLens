import { SplashScreen } from 'expo-router';
import '@/global.css';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

const RootLayout = () => {
    const [fontsLoaded] = useFonts({
        'jakarta-light': require('../assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-Light.ttf'),
        'jakarta-regular': require('../assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-Regular.ttf'),
        'jakarta-medium': require('../assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-Medium.ttf'),
        'jakarta-semibold': require('../assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-SemiBold.ttf'),
        'jakarta-bold': require('../assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-Bold.ttf'),
        'jakarta-extrabold': require('../assets/fonts/Plus_Jakarta_Sans/static/PlusJakartaSans-ExtraBold.ttf'),
        'vietnam-light': require('../assets/fonts/Be_Vietnam_Pro/BeVietnamPro-Light.ttf'),
        'vietnam-regular': require('../assets/fonts/Be_Vietnam_Pro/BeVietnamPro-Regular.ttf'),
        'vietnam-medium': require('../assets/fonts/Be_Vietnam_Pro/BeVietnamPro-Medium.ttf'),
        'vietnam-semibold': require('../assets/fonts/Be_Vietnam_Pro/BeVietnamPro-SemiBold.ttf'),
        'vietnam-bold': require('../assets/fonts/Be_Vietnam_Pro/BeVietnamPro-Bold.ttf'),
        'vietnam-extrabold': require('../assets/fonts/Be_Vietnam_Pro/BeVietnamPro-ExtraBold.ttf'),
        'badscript-regular': require('../assets/fonts/Bad_Script/BadScript-Regular.ttf'),
    });

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);
    if (!fontsLoaded) return null;
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar
                style='dark'
                backgroundColor='#F4F7F2'
            />
            <Stack
                screenOptions={{
                    headerShown: false,
                }}>
                <Stack.Screen name='(tabs)' />
                <Stack.Screen name='camera' />
            </Stack>
        </GestureHandlerRootView>
    );
};

export default RootLayout;
