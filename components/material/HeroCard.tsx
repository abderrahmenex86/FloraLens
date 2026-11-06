import { Pressable, Text, View } from 'react-native';
import { Camera } from 'lucide-react-native';
import { useAppTheme, withAlpha } from '@/lib/appTheme';
import type { HeroCardProps } from './heroCardTypes';

/** Non-Android primary action card. Android uses Compose (`HeroCard.android.tsx`). */
export function HeroCard({ title, onPress }: HeroCardProps) {
    const { colors } = useAppTheme();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole='button'
            accessibilityLabel={title}
            className='flex-row items-center justify-between rounded-[32px] p-6'
            style={{ backgroundColor: colors.primary }}>
            <View className='flex-1 gap-2'>
                <Text
                    className='text-2xl font-jakarta-bold'
                    style={{ color: colors.onPrimary }}>
                    {title}
                </Text>
            </View>
            <View
                className='rounded-full p-5'
                style={{ backgroundColor: withAlpha(colors.onPrimary, '33') }}>
                <Camera
                    size={32}
                    color={colors.onPrimary}
                />
            </View>
        </Pressable>
    );
}
