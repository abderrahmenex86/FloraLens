import { View as RNView, Text, Pressable } from 'react-native';
import { styled } from 'nativewind';
import { LucideIcon } from 'lucide-react-native';
import { colors } from '@/theme';

const View = styled(RNView);

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    return (
        <View className='flex items-center justify-center py-10 px-6 border-2 border-dashed border-[#84B026]/30 rounded-4xl bg-[#84B026]/5'>
            <View className='bg-[#84B026]/10 p-4 rounded-full mb-4'>
                <Icon
                    size={40}
                    color={colors.primary}
                    strokeWidth={1.5}
                />
            </View>
            <Text className='text-xl font-jakarta-bold text-[#1A1C19] mb-2 text-center'>
                {title}
            </Text>
            <Text className='text-base font-vietnam text-[#1A1C19]/70 text-center leading-relaxed'>
                {description}
            </Text>
            {actionLabel && onAction && (
                <Pressable
                    onPress={onAction}
                    accessibilityRole='button'
                    className='mt-5 bg-[#2D5A27] px-5 py-3 rounded-2xl'>
                    <Text className='font-jakarta-bold text-white'>
                        {actionLabel}
                    </Text>
                </Pressable>
            )}
        </View>
    );
}
