import { useEffect, useState } from 'react';
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
import { colors } from '@/theme';
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

    useEffect(() => {
        setPackStatus(getPlantPackStatus());
    }, []);

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
            className='flex-1 bg-[#F4F7F2] flex justify-between p-8'
            style={{ paddingBottom: Math.max(insets.bottom, 16) + 88 }}>
            <View className='flex gap-4'>
                <Text className='text-5xl font-jakarta-bold'>About</Text>
            </View>

            <View className='flex items-center justify-center gap-4'>
                <Flower2
                    size={48}
                    color={colors.primary}
                />
                <Text className='font-jakarta-bold text-2xl mx-4 text-[#2D5A27]'>
                    FloraLens
                </Text>
                <Text className='font-vietnam text-center text-[#1A1C19]'>
                    Identify plants, spot pests, and understand plant health
                    with on-device AI.
                </Text>
                <Text className='font-vietnam text-center text-[#1A1C19]/60 text-sm'>
                    Photos and scans stay on your phone. No account, no uploads.
                </Text>

                <View className='w-full bg-[#EAF1E8] rounded-3xl p-5 mt-4'>
                    <View className='flex-row items-center gap-3 mb-2'>
                        <Images
                            size={22}
                            color={colors.primary}
                        />
                        <Text className='font-jakarta-bold text-lg text-[#1A1C19]'>
                            Offline reference photos
                        </Text>
                    </View>
                    <Text className='font-vietnam text-[#1A1C19]/70 text-sm'>
                        Thumbnails are bundled. Download the full-resolution
                        photos once to keep them offline. About{' '}
                        {formatBytes(74 * 1024 * 1024)}. Use Wi-Fi.
                    </Text>

                    {error && (
                        <Text className='font-vietnam text-[#E25A38] text-sm mt-3'>
                            {error}
                        </Text>
                    )}

                    {packStatus.installed ?
                        <View className='mt-4 gap-3'>
                            <Text className='font-vietnam text-[#2D5A27] text-sm'>
                                Downloaded {packStatus.imageCount} photos ·{' '}
                                {formatBytes(packStatus.bytes)}
                            </Text>
                            <Pressable
                                onPress={handleDelete}
                                accessibilityRole='button'
                                className='flex-row items-center justify-center gap-2 bg-[#F4F7F2] py-3 rounded-2xl'>
                                <Trash2
                                    size={18}
                                    color={colors.danger}
                                />
                                <Text className='font-jakarta-bold text-[#E25A38]'>
                                    Delete offline photos
                                </Text>
                            </Pressable>
                        </View>
                    :   <Pressable
                            onPress={handleDownload}
                            disabled={downloading || !PLANT_PACK_URL}
                            accessibilityRole='button'
                            accessibilityLabel='Download full reference photos'
                            className={`mt-4 flex-row items-center justify-center gap-2 py-3 rounded-2xl ${
                                PLANT_PACK_URL ? 'bg-[#2D5A27]' : 'bg-[#1A1C19]/20'
                            }`}>
                            {downloading ?
                                <>
                                    <ActivityIndicator
                                        size='small'
                                        color='white'
                                    />
                                    <Text className='font-jakarta-bold text-white'>
                                        {progressLabel}
                                    </Text>
                                </>
                            :   <Text className='font-jakarta-bold text-white'>
                                    {PLANT_PACK_URL ?
                                        'Download full photos'
                                    :   'Pack not configured in this build'}
                                </Text>
                            }
                        </Pressable>
                    }
                    {downloading && progress?.total ? (
                        <View className='h-1 bg-[#F4F7F2] rounded-full mt-3 overflow-hidden'>
                            <View
                                className='h-1 bg-[#84B026]'
                                style={{
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
                    <Text className='font-vietnam-bold  text-[#1A1C19]'>
                        Made with{' '}
                    </Text>
                    <Heart
                        size={16}
                        color='red'
                        fill='red'
                    />
                    <Text className='font-vietnam-bold text-[#1A1C19]'>
                        by humans.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
