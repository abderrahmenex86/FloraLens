import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Switch,
    Text,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Bell,
    Download,
    Images,
    Languages,
    Moon,
    Smartphone,
    Sun,
    Trash2,
    X,
} from 'lucide-react-native';
import { Screen } from '../components/Screen';
import { useAppTheme, type ThemeMode } from '@/lib/appTheme';
import { getGardenPlants } from '@/lib/storage';
import {
    ensureNotificationPermission,
    remindersEnabled,
    setRemindersEnabled,
    syncWateringNotifications,
} from '@/lib/watering';
import {
    deletePlantPack,
    downloadPlantPack,
    formatBytes,
    getPlantPackStatus,
    PLANT_PACK_URL,
    type PlantPackStatus,
} from '../lib/plantPack';

const MODES: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { value: 'system', label: 'System', Icon: Smartphone },
    { value: 'light', label: 'Light', Icon: Sun },
    { value: 'dark', label: 'Dark', Icon: Moon },
];

export default function Settings() {
    const router = useRouter();
    const { colors, mode, setMode, scheme } = useAppTheme();

    const [reminders, setReminders] = useState(() => remindersEnabled());
    const [packStatus, setPackStatus] = useState<PlantPackStatus>(() =>
        getPlantPackStatus(),
    );
    const [progress, setProgress] = useState<{
        done: number;
        total: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const refreshPack = () => setPackStatus(getPlantPackStatus());

    const handleReminders = async (next: boolean) => {
        if (next) {
            const granted = await ensureNotificationPermission();
            if (!granted) {
                Alert.alert(
                    'Notifications are off',
                    'Allow notifications for FloraLens in system settings to get watering reminders.',
                );
                return;
            }
        }
        setRemindersEnabled(next);
        setReminders(next);
        await syncWateringNotifications(getGardenPlants());
    };

    const handleDownload = async () => {
        setError(null);
        setProgress({ done: 0, total: 0 });
        try {
            await downloadPlantPack((done, total) =>
                setProgress({ done, total }),
            );
            refreshPack();
        } catch (downloadError) {
            setError(
                downloadError instanceof Error ?
                    downloadError.message
                :   'The photo pack could not be downloaded.',
            );
        } finally {
            setProgress(null);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete offline photos?',
            'The bundled thumbnails stay available. Only the full photo pack is removed.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deletePlantPack()
                            .then(refreshPack)
                            .catch(() =>
                                setError('Could not delete the photo pack.'),
                            );
                    },
                },
            ],
        );
    };

    const downloading = progress !== null;
    const progressLabel =
        progress && progress.total > 0 ?
            `${progress.done} / ${progress.total} photos`
        :   'Preparing…';

    return (
        <Screen animate={false}>
            <View className='flex-row items-center justify-between py-2'>
                <Text
                    className='font-jakarta-extrabold text-3xl'
                    style={{ color: colors.ink }}>
                    Settings
                </Text>
                <Pressable
                    onPress={() => router.back()}
                    accessibilityRole='button'
                    accessibilityLabel='Close settings'
                    hitSlop={10}
                    className='rounded-full p-2.5 active:opacity-70'
                    style={{ backgroundColor: colors.surface }}>
                    <X
                        size={20}
                        color={colors.ink}
                    />
                </Pressable>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 32 }}>
                <Text
                    className='mb-2 font-jakarta-bold text-base'
                    style={{ color: colors.ink }}>
                    Appearance
                </Text>
                <View
                    className='flex-row gap-1 rounded-2xl p-1'
                    style={{ backgroundColor: colors.surface }}>
                    {MODES.map(({ value, label, Icon }) => {
                        const selected = mode === value;
                        return (
                            <Pressable
                                key={value}
                                onPress={() => setMode(value)}
                                accessibilityRole='button'
                                accessibilityState={{ selected }}
                                accessibilityLabel={`${label} appearance`}
                                className='flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3'
                                style={{
                                    backgroundColor:
                                        selected ?
                                            colors.primary
                                        :   'transparent',
                                }}>
                                <Icon
                                    size={16}
                                    color={
                                        selected ?
                                            colors.onPrimary
                                        :   colors.onSurfaceVariant
                                    }
                                />
                                <Text
                                    className='font-jakarta-bold text-sm'
                                    style={{
                                        color:
                                            selected ?
                                                colors.onPrimary
                                            :   colors.onSurfaceVariant,
                                    }}>
                                    {label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
                <Text
                    className='mt-2 font-vietnam text-xs'
                    style={{ color: colors.onSurfaceVariant }}>
                    {mode === 'system' ?
                        `Following the system, currently ${scheme}.`
                    :   'Fixed appearance for this device.'}
                </Text>

                <View className='mt-8'>
                    <Text
                        className='mb-2 font-jakarta-bold text-base'
                        style={{ color: colors.ink }}>
                        Reminders
                    </Text>
                    <View
                        className='flex-row items-center justify-between rounded-2xl px-4 py-4'
                        style={{ backgroundColor: colors.surface }}>
                        <View className='flex-1 flex-row items-center gap-3 pr-3'>
                            <Bell
                                size={20}
                                color={colors.onSurfaceVariant}
                            />
                            <View className='flex-1'>
                                <Text
                                    className='font-vietnam text-base'
                                    style={{ color: colors.ink }}>
                                    Watering reminders
                                </Text>
                                <Text
                                    className='mt-0.5 font-vietnam text-xs'
                                    style={{
                                        color: colors.onSurfaceVariant,
                                    }}>
                                    One nudge on the morning each plant is due.
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={reminders}
                            onValueChange={handleReminders}
                            trackColor={{
                                false: colors.outline,
                                true: colors.primary,
                            }}
                            thumbColor={
                                reminders ? colors.onPrimary : colors.surface
                            }
                        />
                    </View>
                </View>

                <View className='mt-8'>
                    <Text
                        className='mb-2 font-jakarta-bold text-base'
                        style={{ color: colors.ink }}>
                        Language
                    </Text>
                    <View
                        className='flex-row items-center justify-between rounded-2xl px-4 py-4'
                        style={{ backgroundColor: colors.surface }}>
                        <View className='flex-row items-center gap-3'>
                            <Languages
                                size={20}
                                color={colors.onSurfaceVariant}
                            />
                            <Text
                                className='font-vietnam text-base'
                                style={{ color: colors.ink }}>
                                English
                            </Text>
                        </View>
                        <Text
                            className='font-jakarta-bold text-xs'
                            style={{ color: colors.onSurfaceVariant }}>
                            Coming soon
                        </Text>
                    </View>
                </View>

                <View className='mt-8'>
                    <Text
                        className='mb-2 font-jakarta-bold text-base'
                        style={{ color: colors.ink }}>
                        About FloraLens
                    </Text>
                    <View
                        className='rounded-2xl p-5'
                        style={{ backgroundColor: colors.surface }}>
                        <Text
                            className='font-vietnam text-base leading-6'
                            style={{ color: colors.ink }}>
                            FloraLens identifies plants without a signal. The
                            models run on your phone, so you can scan in a
                            garden with no reception, and your photos stay
                            where they were taken.
                        </Text>
                        <Text
                            className='mt-3 font-vietnam text-xs'
                            style={{ color: colors.onSurfaceVariant }}>
                            Version 1.0.0
                        </Text>
                    </View>
                </View>

                <View className='mt-8'>
                    <View className='mb-2 flex-row items-center gap-2'>
                        <Images
                            size={18}
                            color={colors.primary}
                        />
                        <Text
                            className='font-jakarta-bold text-base'
                            style={{ color: colors.ink }}>
                            Offline reference photos
                        </Text>
                    </View>
                    <View
                        className='rounded-2xl p-4'
                        style={{ backgroundColor: colors.surface }}>
                        <Text
                            className='font-vietnam text-sm'
                            style={{ color: colors.onSurfaceVariant }}>
                            Thumbnails are bundled. Download the full-resolution
                            photos once to keep them offline. About{' '}
                            {formatBytes(74 * 1024 * 1024)}. Use Wi-Fi.
                        </Text>

                        {error ?
                            <Text
                                className='mt-3 font-vietnam text-sm'
                                style={{ color: colors.danger }}>
                                {error}
                            </Text>
                        :   null}

                        {packStatus.installed ?
                            <View className='mt-4 gap-3'>
                                <Text
                                    className='font-vietnam text-sm'
                                    style={{ color: colors.primary }}>
                                    Downloaded {packStatus.imageCount} photos ·{' '}
                                    {formatBytes(packStatus.bytes)}
                                </Text>
                                <Pressable
                                    onPress={handleDelete}
                                    accessibilityRole='button'
                                    className='flex-row items-center justify-center gap-2 rounded-xl py-3'
                                    style={{
                                        backgroundColor: colors.background,
                                    }}>
                                    <Trash2
                                        size={18}
                                        color={colors.danger}
                                    />
                                    <Text
                                        className='font-jakarta-bold'
                                        style={{ color: colors.danger }}>
                                        Delete offline photos
                                    </Text>
                                </Pressable>
                            </View>
                        :   <Pressable
                                onPress={handleDownload}
                                disabled={downloading || !PLANT_PACK_URL}
                                accessibilityRole='button'
                                accessibilityLabel='Download full reference photos'
                                className='mt-4 flex-row items-center justify-center gap-2 rounded-xl py-3'
                                style={{
                                    backgroundColor:
                                        PLANT_PACK_URL ?
                                            colors.primary
                                        :   colors.surfaceHigh,
                                }}>
                                {downloading ?
                                    <>
                                        <ActivityIndicator
                                            size='small'
                                            color={colors.onPrimary}
                                        />
                                        <Text
                                            className='font-jakarta-bold'
                                            style={{
                                                color: colors.onPrimary,
                                            }}>
                                            {progressLabel}
                                        </Text>
                                    </>
                                :   <View className='flex-row items-center gap-2'>
                                        <Download
                                            size={16}
                                            color={
                                                PLANT_PACK_URL ?
                                                    colors.onPrimary
                                                :   colors.onSurfaceVariant
                                            }
                                        />
                                        <Text
                                            className='font-jakarta-bold'
                                            style={{
                                                color:
                                                    PLANT_PACK_URL ?
                                                        colors.onPrimary
                                                    :   colors.onSurfaceVariant,
                                            }}>
                                            {PLANT_PACK_URL ?
                                                'Download full photos'
                                            :   'Pack not configured in this build'}
                                        </Text>
                                    </View>
                                }
                            </Pressable>
                        }
                    </View>
                </View>
            </ScrollView>
        </Screen>
    );
}
