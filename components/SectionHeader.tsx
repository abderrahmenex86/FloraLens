import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '@/lib/appTheme';

export function SectionHeader({
    title,
    onPress,
    actionLabel,
}: {
    title: string;
    onPress: () => void;
    actionLabel: string;
}) {
    const { colors } = useAppTheme();
    return (
        <View className='flex-row items-center justify-between'>
            <Text
                className='font-jakarta-bold text-xl'
                style={{ color: colors.ink }}>
                {title}
            </Text>
            <Pressable
                onPress={onPress}
                accessibilityRole='button'
                accessibilityLabel={actionLabel}
                hitSlop={10}
                className='rounded-full p-2 active:opacity-70'
                style={{ backgroundColor: colors.surface }}>
                <ChevronRight
                    size={20}
                    color={colors.primary}
                />
            </Pressable>
        </View>
    );
}
