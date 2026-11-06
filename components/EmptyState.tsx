import { Pressable, Text, View } from 'react-native';
import { ScanSearch, SearchX, Sprout, type LucideIcon } from 'lucide-react-native';
import { colors } from '@/lib/materialTheme';
import type { EmptyStateIcon, EmptyStateProps } from './emptyStateTypes';

const FALLBACK_ICONS: Record<EmptyStateIcon, LucideIcon> = {
    scan: ScanSearch,
    sprout: Sprout,
    search: SearchX,
};

/**
 * Non-Android empty state. Android renders a Compose `Card` from
 * `EmptyState.android.tsx`.
 */
export function EmptyState({
    iconName,
    title,
    description,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    const Icon = FALLBACK_ICONS[iconName];
    return (
        <View
            className='items-center justify-center rounded-4xl px-6 py-10'
            style={{
                borderWidth: 1,
                borderColor: colors.outline,
                backgroundColor: colors.surface,
            }}>
            <View
                className='mb-4 rounded-full p-4'
                style={{ backgroundColor: colors.background }}>
                <Icon
                    size={40}
                    color={colors.primary}
                    strokeWidth={1.5}
                />
            </View>
            <Text
                className='mb-2 text-center font-jakarta-bold text-xl'
                style={{ color: colors.ink }}>
                {title}
            </Text>
            <Text
                className='text-center font-vietnam text-base leading-relaxed'
                style={{ color: colors.onSurfaceVariant }}>
                {description}
            </Text>
            {actionLabel && onAction ?
                <Pressable
                    onPress={onAction}
                    accessibilityRole='button'
                    className='mt-5 rounded-2xl px-5 py-3'
                    style={{ backgroundColor: colors.primary }}>
                    <Text
                        className='font-jakarta-bold'
                        style={{ color: colors.onPrimary }}>
                        {actionLabel}
                    </Text>
                </Pressable>
            :   null}
        </View>
    );
}
