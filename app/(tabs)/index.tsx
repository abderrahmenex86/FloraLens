import { colors, radii, sizes } from '@/theme';
import { Image } from 'expo-image';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { Camera, ScanSearch, Trash2 } from 'lucide-react-native';
import { styled } from 'nativewind';
import { useCallback, useState } from 'react';
import {
    Alert,
    Pressable,
    View as RNView,
    ScrollView,
    Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { EmptyState } from '../../components/EmptyState';
import { Screen } from '../../components/Screen';
import { PLANT_CLASSES } from '../../lib/plantClasses';
import {
    deleteScan,
    getScanHistory,
} from '../../lib/storage';
import type { ScanRecord } from '../../lib/types';

const View = styled(RNView);

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
    });
}

export default function Home() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);

    useFocusEffect(
        useCallback(() => {
            setRecentScans(getScanHistory());
        }, []),
    );

    const confirmDelete = (scan: ScanRecord) => {
        Alert.alert(
            'Delete this scan?',
            'The photo and diagnosis will be removed from your history.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteScan(scan.id);
                        setRecentScans(getScanHistory());
                    },
                },
            ],
        );
    };

    const renderRightActions = (scan: ScanRecord) => (
        <Pressable
            onPress={() => confirmDelete(scan)}
            accessibilityRole='button'
            accessibilityLabel='Delete scan'
            className='bg-red-500 justify-center items-end w-24 mr-1 rounded-3xl mb-3 pr-6'>
            <Trash2
                size={24}
                color='white'
            />
        </Pressable>
    );

    return (
        <Screen className='gap-8'>
            <View className='flex gap-2'>
                <Text className='text-5xl font-jakarta-bold text-[#1A1C19]'>
                    FloraLens
                </Text>
            </View>

            <Link
                href='/camera'
                asChild>
                <Pressable
                    accessibilityRole='button'
                    accessibilityLabel='Identify a plant'
                    className='flex-row items-center justify-between bg-[#2D5A27] rounded-[32px] p-6 shadow-sm'>
                    <View className='flex-1 gap-2'>
                        <Text className='text-2xl font-jakarta-bold text-[#F4F7F2]'>
                            Identify Plant
                        </Text>
                    </View>
                    <View className='bg-[#F4F7F2]/20 p-5 rounded-full'>
                        <Camera
                            size={32}
                            color={colors.background}
                        />
                    </View>
                </Pressable>
            </Link>

            <View className='flex-1 gap-4'>
                <Text className='text-2xl font-jakarta-bold text-[#1A1C19]'>
                    Recent scans
                </Text>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingBottom: 120 + insets.bottom,
                    }}>
                    {recentScans.length === 0 ?
                        <EmptyState
                            icon={ScanSearch}
                            title='No scans yet'
                            description='Scan a leaf to start your history. Everything stays on this device.'
                            actionLabel='Scan a plant'
                            onAction={() => router.push('/camera')}
                        />
                    :   recentScans.map((scan) => (
                            <ReanimatedSwipeable
                                key={scan.id}
                                renderRightActions={() =>
                                    renderRightActions(scan)
                                }>
                                <Pressable
                                    onPress={() =>
                                        router.push(`/result/${scan.id}`)
                                    }
                                    accessibilityRole='button'
                                    accessibilityLabel={`Open scan of ${PLANT_CLASSES[scan.classIndex]?.name ?? 'unknown plant'}`}
                                    accessibilityHint='Swipe left or long press to delete'
                                    onLongPress={() => confirmDelete(scan)}
                                    className='flex-row items-center bg-[#EAF1E8] p-4 rounded-3xl shadow-sm mb-3 active:opacity-80'>
                                    <Image
                                        source={{ uri: scan.imageUri }}
                                        style={{
                                            width: sizes.thumbnail,
                                            height: sizes.thumbnail,
                                            borderRadius: radii.md,
                                        }}
                                        contentFit='cover'
                                    />
                                    <View className='flex-1 ml-4 justify-center'>
                                        <Text className='font-jakarta-bold text-xl text-[#1A1C19]'>
                                            {
                                                PLANT_CLASSES[scan.classIndex]
                                                    ?.name ?? 'Unknown plant'
                                            }
                                        </Text>
                                        <Text className='font-vietnam text-[#1A1C19]/60 text-sm mt-0.5'>
                                            {formatDate(scan.timestamp)}
                                            {scan.confidence > 0 ?
                                                ` · ${Math.round(scan.confidence * 100)}%`
                                            :   ''}
                                        </Text>
                                    </View>
                                </Pressable>
                            </ReanimatedSwipeable>
                        ))
                    }
                </ScrollView>
            </View>
        </Screen>
    );
}
