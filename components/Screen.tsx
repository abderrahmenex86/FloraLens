import { ReactNode } from 'react';
import {
    SafeAreaView as RNSafeAreaView,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { styled } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View as RNView } from 'react-native';
import { useAppTheme } from '@/lib/appTheme';

const SafeAreaView = styled(RNSafeAreaView);
const View = styled(RNView);

interface ScreenProps {
    children: ReactNode;
    className?: string;
}

export function Screen({ children, className = '' }: ScreenProps) {
    const { colors, scheme } = useAppTheme();
    const insets = useSafeAreaInsets();
    const top = scheme === 'dark' ? colors.background : '#FFFFFF';

    return (
        <SafeAreaView className='flex-1'>
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
        </SafeAreaView>
    );
}
