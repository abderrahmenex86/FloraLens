import { ReactNode, useCallback } from 'react';
import {
    SafeAreaView as RNSafeAreaView,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { styled } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View as RNView } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useFocusEffect, usePathname } from 'expo-router';
import { useAppTheme } from '@/lib/appTheme';

const SafeAreaView = styled(RNSafeAreaView);
const View = styled(RNView);

const PAGE_ORDER = ['/', '/scans', '/garden', '/library'];
let lastPageIndex = 0;

/** Pages slide in from the side they sit on in the tab order. */
function takeDirection(pathname: string): 1 | -1 {
    const index = PAGE_ORDER.indexOf(pathname);
    if (index === -1) return 1;
    const direction = index >= lastPageIndex ? 1 : -1;
    lastPageIndex = index;
    return direction;
}

interface ScreenProps {
    children: ReactNode;
    className?: string;
    /** Turn off for modals that already animate themselves. */
    animate?: boolean;
}

export function Screen({
    children,
    className = '',
    animate = true,
}: ScreenProps) {
    const { colors, scheme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const pathname = usePathname();

    const offset = useSharedValue(0);
    const fade = useSharedValue(1);

    useFocusEffect(
        useCallback(() => {
            if (!animate) return;
            const direction = takeDirection(pathname);
            // Reanimated shared values are mutable by design; the React
            // Compiler rule cannot see through the worklet runtime.
            /* eslint-disable react-hooks/immutability */
            offset.value = direction * 26;
            fade.value = 0.55;
            offset.value = withTiming(0, {
                duration: 240,
                easing: Easing.out(Easing.cubic),
            });
            fade.value = withTiming(1, { duration: 220 });
            /* eslint-enable react-hooks/immutability */
        }, [animate, pathname, offset, fade]),
    );

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: fade.value,
        transform: [{ translateX: offset.value }],
    }));

    const top = scheme === 'dark' ? colors.background : '#FFFFFF';

    return (
        <SafeAreaView className='flex-1'>
            <Animated.View style={[styles.fill, animatedStyle]}>
                <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
                    <LinearGradient
                        colors={[top, colors.background]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />

                    <View
                        className='absolute -top-[60px] -right-[90px] h-[280px] w-[280px] rounded-full'
                        style={{
                            backgroundColor: colors.primary,
                            opacity: 0.07,
                        }}
                    />

                    <View
                        className='absolute top-[280px] -left-[100px] h-[220px] w-[220px] rounded-full'
                        style={{
                            backgroundColor: colors.accent,
                            opacity: 0.07,
                        }}
                    />
                </View>

                <View
                    className={`flex-1 px-5 ${className}`}
                    style={{
                        paddingTop: 4,
                        paddingBottom: Math.max(insets.bottom, 8) + 8,
                    }}>
                    {children}
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
});
