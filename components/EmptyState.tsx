import { View as RNView, Text } from 'react-native';
import { styled } from 'nativewind';
import { LucideIcon } from 'lucide-react-native';
import { colors } from '@/theme';

const View = styled(RNView);

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
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
        </View>
    );
}
