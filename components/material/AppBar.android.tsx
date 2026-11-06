import {
    Column,
    Host,
    Text,
    TopAppBar,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';
import { useAppTheme } from '@/lib/appTheme';
import type { AppBarProps } from './appBarTypes';

/**
 * Native Material 3 top app bar. `windowInsets` is empty because `Screen`
 * already applies the status bar inset.
 */
export function AppBar({ title, subtitle }: AppBarProps) {
    const { colors, hostTheme } = useAppTheme();
    return (
        <Host
            {...hostTheme}
            matchContents={{ vertical: true }}
            style={{ width: '100%' }}>
            <TopAppBar
                windowInsets={{}}
                colors={{ containerColor: 'transparent' }}
                modifiers={[fillMaxWidth()]}>
                <TopAppBar.Title>
                    {subtitle ?
                        <Column verticalArrangement={{ spacedBy: 2 }}>
                            <Text
                                style={{
                                    typography: 'titleLarge',
                                    fontWeight: '700',
                                }}>
                                {title}
                            </Text>
                            <Text
                                style={{ typography: 'bodyMedium' }}
                                color={colors.onSurfaceVariant}>
                                {subtitle}
                            </Text>
                        </Column>
                    :   <Text
                            style={{
                                typography: 'titleLarge',
                                fontWeight: '700',
                            }}>
                            {title}
                        </Text>
                    }
                </TopAppBar.Title>
            </TopAppBar>
        </Host>
    );
}
