import { ReactNode } from 'react';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { styled } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { colors } from '@/theme';

const SafeAreaView = styled(RNSafeAreaView);

interface ScreenProps {
    children: ReactNode;
    className?: string;
}

export function Screen({ children, className = '' }: ScreenProps) {
    return (
        <SafeAreaView className={`flex-1 p-8 pb-18 ${className}`}>
            <LinearGradient
                colors={[colors.surface, colors.background]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
            {children}
        </SafeAreaView>
    );
}
