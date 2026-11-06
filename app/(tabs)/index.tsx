import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Droplets, Settings } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { SectionHeader } from '../../components/SectionHeader';
import { SwipePager } from '../../components/SwipePager';
import { useAppTheme } from '@/lib/appTheme';
import { getDailyPicks } from '../../lib/dailyPicks';
import { PLANT_CLASSES } from '../../lib/plantClasses';
import { getPlantCover } from '../../lib/plantAssets';
import { getGardenPlants, getScanHistory, waterPlant } from '../../lib/storage';
import { hapticLight } from '../../lib/haptics';
import {
    duePlants,
    syncWateringNotifications,
    wateringLabel,
} from '../../lib/watering';
import type { GardenPlant, ScanRecord } from '../../lib/types';

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
    });
}

export default function Home() {
    const router = useRouter();
    const { colors } = useAppTheme();
    const [recent, setRecent] = useState<ScanRecord[]>([]);
    const [garden, setGarden] = useState<GardenPlant[]>([]);

    const picks = useMemo(() => getDailyPicks(3), []);

    useFocusEffect(
        useCallback(() => {
            setRecent(getScanHistory().slice(0, 3));
            setGarden(getGardenPlants());
        }, []),
    );

    const thirsty = duePlants(garden);

    const handleWater = (plant: GardenPlant) => {
        waterPlant(plant.id);
        hapticLight();
        const next = getGardenPlants();
        setGarden(next);
        syncWateringNotifications(next).catch(() => {});
    };

    return (
        <Screen>
            <SwipePager>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 24 }}>
                    <View className='flex-row items-start justify-between'>
                        <Text
                            className='font-jakarta-extrabold text-4xl'
                            style={{ color: colors.ink }}>
                            FloraLens
                        </Text>
                        <Pressable
                            onPress={() => router.push('/settings')}
                            accessibilityRole='button'
                            accessibilityLabel='Open settings'
                            hitSlop={10}
                            className='rounded-full p-2.5 active:opacity-70'
                            style={{ backgroundColor: colors.surface }}>
                            <Settings
                                size={22}
                                color={colors.ink}
                            />
                        </Pressable>
                    </View>

                    <Text
                        className='mt-2 font-vietnam text-base leading-6'
                        style={{ color: colors.onSurfaceVariant }}>
                        FloraLens identifies plants on your phone. Photos,
                        scans and your garden never leave the device, and there
                        is no account to create.
                    </Text>

                    {thirsty.length > 0 ?
                        <View className='mt-6 gap-3'>
                            <SectionHeader
                                title='Needs water'
                                onPress={() => router.push('/garden')}
                                actionLabel='Open the garden'
                            />
                            {thirsty.slice(0, 3).map((plant) => (
                                <View
                                    key={plant.id}
                                    className='flex-row items-center rounded-3xl p-3'
                                    style={{
                                        backgroundColor: colors.surface,
                                    }}>
                                    {plant.imageUri ?
                                        <Image
                                            source={{ uri: plant.imageUri }}
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 12,
                                            }}
                                            contentFit='cover'
                                        />
                                    :   <View
                                            className='items-center justify-center rounded-xl'
                                            style={{
                                                width: 44,
                                                height: 44,
                                                backgroundColor:
                                                    colors.background,
                                            }}>
                                            <Droplets
                                                size={20}
                                                color={colors.primary}
                                            />
                                        </View>
                                    }
                                    <View className='ml-3 flex-1 justify-center'>
                                        <Text
                                            className='font-jakarta-bold text-base'
                                            numberOfLines={1}
                                            style={{ color: colors.ink }}>
                                            {PLANT_CLASSES[plant.classIndex]
                                                ?.name ?? 'Your plant'}
                                        </Text>
                                        <Text
                                            className='mt-0.5 font-vietnam text-xs'
                                            style={{ color: colors.danger }}>
                                            {wateringLabel(plant)}
                                        </Text>
                                    </View>
                                    <Pressable
                                        onPress={() => handleWater(plant)}
                                        accessibilityRole='button'
                                        accessibilityLabel={`Mark ${PLANT_CLASSES[plant.classIndex]?.name ?? 'plant'} as watered`}
                                        className='rounded-full p-3'
                                        style={{
                                            backgroundColor: colors.primary,
                                        }}>
                                        <Droplets
                                            size={18}
                                            color={colors.onPrimary}
                                        />
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    :   null}

                    <View className='mt-8 gap-3'>
                        <SectionHeader
                            title='Recent scans'
                            onPress={() => router.push('/scans')}
                            actionLabel='See all scans'
                        />

                        {recent.length === 0 ?
                            <View
                                className='rounded-3xl p-5'
                                style={{ backgroundColor: colors.surface }}>
                                <Text
                                    className='font-jakarta-bold text-base'
                                    style={{ color: colors.ink }}>
                                    No scans yet
                                </Text>
                                <Text
                                    className='mt-1 font-vietnam text-sm'
                                    style={{
                                        color: colors.onSurfaceVariant,
                                    }}>
                                    Your first scan will show up here.
                                </Text>
                            </View>
                        :   recent.map((scan) => (
                                <Pressable
                                    key={scan.id}
                                    onPress={() =>
                                        router.push(`/result/${scan.id}`)
                                    }
                                    accessibilityRole='button'
                                    accessibilityLabel={`Open scan of ${PLANT_CLASSES[scan.classIndex]?.name ?? 'unknown plant'}`}
                                    className='flex-row items-center rounded-3xl p-3 active:opacity-80'
                                    style={{
                                        backgroundColor: colors.surface,
                                    }}>
                                    <Image
                                        source={{ uri: scan.imageUri }}
                                        style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 14,
                                        }}
                                        contentFit='cover'
                                    />
                                    <View className='ml-3 flex-1 justify-center'>
                                        <Text
                                            className='font-jakarta-bold text-base'
                                            numberOfLines={1}
                                            style={{ color: colors.ink }}>
                                            {PLANT_CLASSES[scan.classIndex]
                                                ?.name ?? 'Unknown plant'}
                                        </Text>
                                        <Text
                                            className='mt-0.5 font-vietnam text-xs'
                                            style={{
                                                color: colors.onSurfaceVariant,
                                            }}>
                                            {formatDate(scan.timestamp)}
                                            {scan.confidence > 0 ?
                                                ` · ${Math.round(scan.confidence * 100)}%`
                                            :   ''}
                                        </Text>
                                    </View>
                                </Pressable>
                            ))
                        }
                    </View>

                    <View className='mt-8 gap-3'>
                        <SectionHeader
                            title="Today's picks"
                            onPress={() => router.push('/library')}
                            actionLabel='Browse the library'
                        />

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={{ marginHorizontal: -20 }}
                            contentContainerStyle={{
                                gap: 12,
                                paddingHorizontal: 20,
                            }}>
                            {picks.map((plant) => {
                                const cover = getPlantCover(plant.id);
                                return (
                                    <Pressable
                                        key={plant.id}
                                        onPress={() =>
                                            router.push(`/plant/${plant.id}`)
                                        }
                                        accessibilityRole='button'
                                        accessibilityLabel={`Open ${plant.name}`}
                                        className='active:opacity-80'
                                        style={{ width: 132 }}>
                                        {cover ?
                                            <Image
                                                source={cover}
                                                style={{
                                                    width: 132,
                                                    height: 132,
                                                    borderRadius: 20,
                                                }}
                                                contentFit='cover'
                                            />
                                        :   <View
                                                className='items-center justify-center rounded-[20px]'
                                                style={{
                                                    width: 132,
                                                    height: 132,
                                                    backgroundColor:
                                                        colors.surface,
                                                }}>
                                                <Text
                                                    className='font-jakarta-bold text-2xl'
                                                    style={{
                                                        color: colors.primary,
                                                    }}>
                                                    {plant.name.charAt(0)}
                                                </Text>
                                            </View>
                                        }
                                        <Text
                                            className='mt-2 font-jakarta-bold text-sm'
                                            numberOfLines={1}
                                            style={{ color: colors.ink }}>
                                            {plant.name}
                                        </Text>
                                        <Text
                                            className='mt-0.5 font-vietnam text-xs'
                                            numberOfLines={1}
                                            style={{
                                                color: colors.onSurfaceVariant,
                                            }}>
                                            {plant.scientific}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>
                </ScrollView>
            </SwipePager>
        </Screen>
    );
}
