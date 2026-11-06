import {
    Card,
    FilledTonalIconButton,
    Host,
    Icon,
    Row,
    Text,
} from '@expo/ui/jetpack-compose';
import {
    clickable,
    fillMaxWidth,
    padding,
    weight,
} from '@expo/ui/jetpack-compose/modifiers';
import { useAppTheme, withAlpha } from '@/lib/appTheme';
import type { HeroCardProps } from './heroCardTypes';
import CameraIcon from '@expo/material-symbols/photo_camera.xml';

/** Native Material 3 primary action card. */
export function HeroCard({ title, onPress }: HeroCardProps) {
    const { colors, hostTheme } = useAppTheme();
    return (
        <Host
            {...hostTheme}
            matchContents={{ vertical: true }}
            style={{ width: '100%' }}>
            <Card
                colors={{ containerColor: colors.primary }}
                modifiers={[fillMaxWidth(), clickable(onPress)]}>
                <Row
                    verticalAlignment='center'
                    modifiers={[padding(24, 24, 24, 24)]}>
                    <Text
                        style={{
                            typography: 'headlineSmall',
                            fontWeight: '700',
                        }}
                        color={colors.onPrimary}
                        modifiers={[weight(1)]}>
                        {title}
                    </Text>
                    <FilledTonalIconButton
                        colors={{
                            containerColor: withAlpha(colors.onPrimary, '33'),
                            contentColor: colors.onPrimary,
                        }}
                        onClick={onPress}>
                        <Icon
                            source={CameraIcon}
                            contentDescription={title}
                        />
                    </FilledTonalIconButton>
                </Row>
            </Card>
        </Host>
    );
}
