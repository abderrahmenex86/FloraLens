import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    Text,
    View as RNView,
} from 'react-native';
import {
    SafeAreaView as RNSafeAreaView,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Flower2, Heart, Images, Trash2 } from 'lucide-react-native';
import { styled } from 'nativewind';
import { colors } from '@/lib/materialTheme';
import { AppBar } from '../../components/material/AppBar';
import {
    deletePlantPack,
    downloadPlantPack,
    formatBytes,
    getPlantPackStatus,
    PLANT_PACK_URL,
    type PlantPackStatus,
} from '../../lib/plantPack';

const SafeAreaView = styled(RNSafeAreaView);
const View = styled(RNView);

export default function About() {
    const insets = useSafeAreaInsets();
    const [packStatus, setPackStatus] = useState<PlantPackStatus>(() =>
        getPlantPackStatus(),
    );
    const [progress, setProgress] = useState<{ done: number; total: number } | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);

    const refreshPack = () => setPackStatus(getPlantPackStatus());

    const handleDownload = async () => {
        setError(null);
        setProgress({ done: 0, total: 0 });
        try {
            await downloadPlantPack((done, total) => setProgress({ done, total }));
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
                            .catch(() => setError('Could not delete the photo pack.'));
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
        <SafeAreaView
            className='flex-1 flex justify-between p-8'
            style={{
                backgroundColor: colors.background,
                paddingBottom: Math.max(insets.bottom, 16) + 16,
            }}>
            <View className='flex gap-4'>
                <AppBar title='About' />
            </View>

            <View className='flex items-center justify-center gap-4'>
                <Flower2
                    size={48}
                    color={colors.primary}
                />
                <Text className='font-jakarta-bold text-2xl mx-4'>
                    FloraLens
                </Text>
                <Text
                    className='font-vietnam text-center'
                    style={{ color: colors.ink }}>
                    Identify plants, spot pests, and understand plant health
                    with on-device AI.
                </Text>
                <Text
                    className='font-vietnam text-center text-sm'
                    style={{ color: colors.onSurfaceVariant }}>
                    Photos and scans stay on your phone. No account, no uploads.
                </Text>

                <View
                    className='w-full rounded-3xl p-5 mt-4'
                    style={{ backgroundColor: colors.surface }}>
                    <View className='flex-row items-center gap-3 mb-2'>
                        <Images
                            size={22}
                            color={colors.primary}
                        />
                        <Text
                            className='font-jakarta-bold text-lg'
                            style={{ color: colors.ink }}>
                            Offline reference photos
                        </Text>
                    </View>
                    <Text
                        className='font-vietnam text-sm'
                        style={{ color: colors.onSurfaceVariant }}>
                        Thumbnails are bundled. Download the full-resolution
                        photos once to keep them offline. About{' '}
                        {formatBytes(74 * 1024 * 1024)}. Use Wi-Fi.
                    </Text>

                    {error && (
                        <Text
                        className='font-vietnam text-sm mt-3'
                        style={{ color: colors.danger }}>
                            {error}
                        </Text>
                    )}

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
                                className='flex-row items-center justify-center gap-2 py-3 rounded-2xl'
                                style={{ backgroundColor: colors.background }}>
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
                            className='mt-4 flex-row items-center justify-center gap-2 py-3 rounded-2xl'
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
                                        color='white'
                                    />
                                    <Text
                                        className='font-jakarta-bold'
                                        style={{ color: colors.onPrimary }}>
                                        {progressLabel}
                                    </Text>
                                </>
                            :   <Text
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
                            }
                        </Pressable>
                    }
                    {downloading && progress?.total ? (
                        <View
                            className='h-1 rounded-full mt-3 overflow-hidden'
                            style={{ backgroundColor: colors.background }}>
                            <View
                                className='h-1'
                                style={{
                                    backgroundColor: colors.accent,
                                    width: `${Math.round(
                                        (progress.done / progress.total) * 100,
                                    )}%`,
                                }}
                            />
                        </View>
                    ) : null}
                </View>
            </View>

            <View className='font-vietnam p-6 pb-8 items-center'>
                <View className='flex flex-row gap-1 items-center justify-center'>
                    <Text
                        className='font-vietnam-bold'
                        style={{ color: colors.ink }}>
                        Made with{' '}
                    </Text>
                    <Heart
                        size={16}
                        color='red'
                        fill='red'
                    />
                    <Text
                        className='font-vietnam-bold'
                        style={{ color: colors.ink }}>
                        by humans.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
