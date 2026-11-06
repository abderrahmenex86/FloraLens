import { ReactNode } from 'react';
import {
    SafeAreaView as RNSafeAreaView,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { styled } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View as RNView } from 'react-native';
import { colors } from '@/lib/materialTheme';

const SafeAreaView = styled(RNSafeAreaView);
const View = styled(RNView);

interface ScreenProps {
    children: ReactNode;
    className?: string;
}

export function Screen({ children, className = '' }: ScreenProps) {
    const insets = useSafeAreaInsets();
    return (
        <SafeAreaView className='flex-1'>
            <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
                <LinearGradient
                    colors={['#FFFFFF', colors.background]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                <View
                    className='absolute -top-[60px] -right-[90px] w-[280px] h-[280px] rounded-full'
                    style={{
                        backgroundColor: colors.primary,
                        opacity: 0.08,
                    }}
                />

                <View
                    className='absolute top-[280px] -left-[100px] w-[220px] h-[220px] rounded-full'
                    style={{
                        backgroundColor: colors.accent,
                        opacity: 0.08,
                    }}
                />
            </View>

            <View
                className={`flex-1 p-8 ${className}`}
                style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}>
                {children}
            </View>
        </SafeAreaView>
    );
}
