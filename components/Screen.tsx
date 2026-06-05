import { ReactNode } from 'react';
import {
    SafeAreaView as RNSafeAreaView,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { styled } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View as RNView } from 'react-native';
import { colors } from '@/theme';

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
            <View
                style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]}>
                <LinearGradient
                    colors={['#FFFFFF', colors.background]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />

                <View className='absolute -top-[60px] -right-[90px] w-[280px] h-[280px] rounded-full bg-[#2D5A27]/10' />

                <View className='absolute top-[280px] -left-[100px] w-[220px] h-[220px] rounded-full bg-[#84B026]/10' />
            </View>

            <View className={`flex-1 p-8 pb-[${insets.bottom}] ${className}`}>
                {children}
            </View>
        </SafeAreaView>
    );
}
