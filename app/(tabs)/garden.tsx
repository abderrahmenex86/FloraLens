import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Check, Droplets, Sprout, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { AppBar } from '../../components/material/AppBar';
import { Screen } from '../../components/Screen';
import { SwipePager } from '../../components/SwipePager';
import { useAppTheme } from '@/lib/appTheme';
import { PLANT_CLASSES } from '../../lib/plantClasses';
import { getPlantCover } from '../../lib/plantAssets';
import {
    getGardenPlants,
    getScan,
    removeFromGarden,
    setWateringDays,
    waterPlant,
} from '../../lib/storage';
import { hapticLight } from '../../lib/haptics';
import {
    syncWateringNotifications,
    wateringLabel,
    wateringStatus,
} from '../../lib/watering';
import type { GardenPlant } from '../../lib/types';

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
    });
}

export default function Garden() {
    const router = useRouter();
    const { colors } = useAppTheme();
    const [gardenPlants, setGardenPlants] = useState<GardenPlant[]>([]);
    const [editing, setEditing] = useState<GardenPlant | null>(null);

    useFocusEffect(
        useCallback(() => {
            setGardenPlants(getGardenPlants());
        }, []),
    );

    const confirmDelete = (plant: GardenPlant) => {
        Alert.alert(
            'Remove from garden?',
            'The scan stays in your history unless you delete it there.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        removeFromGarden(plant.id);
                        setGardenPlants(getGardenPlants());
                    },
                },
            ],
        );
    };

    const handleWater = (plant: GardenPlant) => {
        waterPlant(plant.id);
        hapticLight();
        const next = getGardenPlants();
        setGardenPlants(next);
        syncWateringNotifications(next).catch(() => {});
    };

    const chooseInterval = (days: number) => {
        if (!editing) return;
        setWateringDays(editing.id, days);
        hapticLight();
        const next = getGardenPlants();
        setGardenPlants(next);
        syncWateringNotifications(next).catch(() => {});
        setEditing(null);
    };

    const openPlant = (plant: GardenPlant) => {
        if (plant.scanId && getScan(plant.scanId)) {
            router.push(`/result/${plant.scanId}`);
        } else {
            router.push(`/plant/${plant.classIndex}`);
        }
    };

    return (
        <Screen>
            <SwipePager>
                <AppBar
                    title='Garden'
                    subtitle={`${gardenPlants.length} ${gardenPlants.length === 1 ? 'plant' : 'plants'} in your greenhouse`}
                />

                {gardenPlants.length === 0 ?
                    <View className='flex-1 justify-center pb-8 pt-6'>
                        <EmptyState
                            iconName='sprout'
                            title='Your garden is empty'
                            description='Save a plant from a scan, or add one from the library.'
                            actionLabel='Scan a plant'
                            onAction={() => router.push('/camera')}
                        />
                    </View>
                :   <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}>
                        {gardenPlants.map((plant) => {
                            const plantInfo = PLANT_CLASSES[plant.classIndex] || {
                                name: 'Unknown Plant',
                                scientific: 'Unknown',
                            };
                            const reference = getPlantCover(plant.classIndex);
                            const coverImage =
                                plant.imageUri ?
                                    { uri: plant.imageUri }
                                :   reference;

                            return (
                                <Pressable
                                    key={plant.id}
                                    onPress={() => openPlant(plant)}
                                    accessibilityRole='button'
                                    accessibilityLabel={`Open ${plantInfo.name}`}
                                    accessibilityHint='Long press to remove'
                                    onLongPress={() => confirmDelete(plant)}
                                    className='mb-3 flex-row items-center rounded-3xl p-4 active:opacity-80'
                                    style={{ backgroundColor: colors.surface }}>
                                    {coverImage ?
                                        <Image
                                            source={coverImage}
                                            style={{
                                                width: 72,
                                                height: 72,
                                                borderRadius: 16,
                                            }}
                                            contentFit='cover'
                                        />
                                    :   <View
                                            className='h-[72px] w-[72px] items-center justify-center rounded-2xl'
                                            style={{
                                                backgroundColor:
                                                    colors.background,
                                            }}>
                                            <Sprout
                                                size={28}
                                                color={colors.primary}
                                            />
                                        </View>
                                    }
                                    <View className='ml-4 flex-1 justify-center'>
                                        <Text
                                            className='mb-0.5 font-jakarta-bold text-xl'
                                            numberOfLines={1}
                                            style={{ color: colors.ink }}>
                                            {plantInfo.name}
                                        </Text>
                                        <Text
                                            className='font-vietnam text-sm'
                                            style={{
                                                color: colors.onSurfaceVariant,
                                            }}>
                                            Added {formatDate(plant.timestamp)}
                                            {plant.scanId ?
                                                ' · from scan'
                                            :   ' · from library'}
                                        </Text>
                                        <Pressable
                                            onPress={() => setEditing(plant)}
                                            accessibilityRole='button'
                                            accessibilityLabel={`Change the watering interval for ${plantInfo.name}`}
                                            hitSlop={6}>
                                            <Text
                                                className='mt-0.5 font-vietnam-medium text-sm'
                                                style={{
                                                    color:
                                                        wateringStatus(plant)
                                                            .due ?
                                                            colors.danger
                                                        :   colors.primary,
                                                }}>
                                                {wateringLabel(plant)}
                                            </Text>
                                        </Pressable>
                                    </View>
                                    <View className='flex-row items-center gap-2'>
                                        <Pressable
                                            onPress={() => handleWater(plant)}
                                            accessibilityRole='button'
                                            accessibilityLabel={`Mark ${plantInfo.name} as watered`}
                                            hitSlop={8}
                                            className='rounded-full p-3'
                                            style={{
                                                backgroundColor:
                                                    wateringStatus(plant).due ?
                                                        colors.primary
                                                    :   colors.background,
                                            }}>
                                            <Droplets
                                                size={18}
                                                color={
                                                    wateringStatus(plant).due ?
                                                        colors.onPrimary
                                                    :   colors.primary
                                                }
                                            />
                                        </Pressable>
                                        <Pressable
                                            onPress={() => confirmDelete(plant)}
                                            accessibilityRole='button'
                                            accessibilityLabel={`Remove ${plantInfo.name} from garden`}
                                            hitSlop={8}
                                            className='rounded-full p-3'
                                            style={{
                                                backgroundColor:
                                                    colors.background,
                                            }}>
                                            <Trash2
                                                size={18}
                                                color={colors.onSurfaceVariant}
                                            />
                                        </Pressable>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                }
            </SwipePager>

            <Modal
                visible={editing !== null}
                transparent
                animationType='fade'
                onRequestClose={() => setEditing(null)}>
                <Pressable
                    className='flex-1 justify-end'
                    style={{ backgroundColor: '#00000080' }}
                    onPress={() => setEditing(null)}>
                    <Pressable
                        className='rounded-t-[32px] px-6 pb-8 pt-6'
                        style={{ backgroundColor: colors.background }}
                        onPress={(event) => event.stopPropagation()}>
                        <Text
                            className='font-jakarta-extrabold text-2xl'
                            style={{ color: colors.ink }}>
                            Watering interval
                        </Text>
                        <Text
                            className='mt-1 font-vietnam text-sm'
                            style={{ color: colors.onSurfaceVariant }}>
                            {editing ?
                                PLANT_CLASSES[editing.classIndex]?.name
                            :   ''}
                        </Text>

                        <View className='mt-4'>
                            {[3, 7, 14, 30].map((days) => {
                                const selected =
                                    (editing?.wateringDays ?? 7) === days;
                                return (
                                    <Pressable
                                        key={days}
                                        onPress={() => chooseInterval(days)}
                                        accessibilityRole='button'
                                        accessibilityState={{ selected }}
                                        accessibilityLabel={`Water every ${days} days`}
                                        className='flex-row items-center justify-between border-b py-4'
                                        style={{
                                            borderColor: colors.outline,
                                        }}>
                                        <Text
                                            className='font-vietnam text-base'
                                            style={{ color: colors.ink }}>
                                            Every {days} days
                                        </Text>
                                        {selected ?
                                            <Check
                                                size={20}
                                                color={colors.primary}
                                            />
                                        :   null}
                                    </Pressable>
                                );
                            })}
                        </View>

                        <Pressable
                            onPress={() => setEditing(null)}
                            accessibilityRole='button'
                            className='mt-5 items-center rounded-2xl py-4'
                            style={{ backgroundColor: colors.surface }}>
                            <Text
                                className='font-jakarta-bold'
                                style={{ color: colors.ink }}>
                                Cancel
                            </Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </Screen>
    );
}
