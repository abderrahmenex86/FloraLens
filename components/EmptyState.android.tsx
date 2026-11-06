import {
    Button,
    Card,
    Column,
    Host,
    Icon,
    Text,
} from '@expo/ui/jetpack-compose';
import {
    fillMaxSize,
    fillMaxWidth,
    padding,
} from '@expo/ui/jetpack-compose/modifiers';
import { useAppTheme } from '@/lib/appTheme';
import type { EmptyStateIcon, EmptyStateProps } from './emptyStateTypes';
import ScanIcon from '@expo/material-symbols/center_focus_strong.xml';
import SproutIcon from '@expo/material-symbols/potted_plant.xml';
import SearchOffIcon from '@expo/material-symbols/search_off.xml';

const ICONS: Record<EmptyStateIcon, number | { uri: string }> = {
    scan: ScanIcon,
    sprout: SproutIcon,
    search: SearchOffIcon,
};

/**
 * Native Material 3 empty state: an outlined card with a filled action.
 *
 * The host needs an explicit height: `matchContents` does not propagate the
 * measured height back to the React Native view when the host lives inside a
 * `FlatList` cell, and the card collapses to zero.
 */
export function EmptyState({
    iconName,
    title,
    description,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    const { colors, hostTheme } = useAppTheme();
    return (
        <Host
            {...hostTheme}
            style={{ width: '100%', height: 320 }}>
            <Card
                colors={{ containerColor: colors.surface }}
                border={{ width: 1, color: colors.outline }}
                modifiers={[fillMaxSize()]}>
                <Column
                    horizontalAlignment='center'
                    verticalArrangement='center'
                    modifiers={[fillMaxSize(), fillMaxWidth()]}>
                    <Icon
                        source={ICONS[iconName]}
                        size={40}
                        tint={colors.primary}
                        contentDescription={title}
                        modifiers={[padding(0, 0, 0, 12)]}
                    />
                    <Text
                        style={{ typography: 'titleMedium', fontWeight: '700' }}
                        color={colors.ink}
                        modifiers={[padding(0, 0, 0, 6)]}>
                        {title}
                    </Text>
                    <Text
                        style={{ typography: 'bodyMedium', textAlign: 'center' }}
                        color={colors.onSurfaceVariant}
                        modifiers={[padding(0, 0, 0, 20)]}>
                        {description}
                    </Text>
                    {actionLabel && onAction ?
                        <Button
                            onClick={onAction}
                            contentPadding={{
                                start: 24,
                                end: 24,
                                top: 12,
                                bottom: 12,
                            }}>
                            <Text>{actionLabel}</Text>
                        </Button>
                    :   null}
                </Column>
            </Card>
        </Host>
    );
}
