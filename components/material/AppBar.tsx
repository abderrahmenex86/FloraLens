import { Text, View } from 'react-native';
import type { AppBarProps } from './appBarTypes';

/**
 * Non-Android header. Android renders a native Material 3 `TopAppBar` from
 * `AppBar.android.tsx` instead.
 */
export function AppBar({ title, subtitle }: AppBarProps) {
    return (
        <View className='flex gap-1'>
            <Text className='text-5xl font-jakarta-bold text-[#1A1C19]'>
                {title}
            </Text>
            {subtitle ?
                <Text className='text-lg font-vietnam text-[#2D5A27]'>
                    {subtitle}
                </Text>
            :   null}
        </View>
    );
}
