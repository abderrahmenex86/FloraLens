import { ReactNode } from 'react';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { styled } from 'nativewind';

const SafeAreaView = styled(RNSafeAreaView);

interface ScreenProps {
    children: ReactNode;
    className?: string;
}

export function Screen({ children, className = '' }: ScreenProps) {
    return (
        <SafeAreaView className={`flex-1 bg-[#F4F7F2] p-8 pb-18 ${className}`}>
            {children}
        </SafeAreaView>
    );
}
