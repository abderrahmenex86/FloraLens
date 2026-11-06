import { radii } from '@/theme';
import { colors } from '@/lib/materialTheme';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Sprout, Trash2 } from 'lucide-react-native';
import { styled } from 'nativewind';
import { useCallback, useState } from 'react';
import {
    Alert,
    Pressable,
    View as RNView,
    ScrollView,
    Text,
} from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { EmptyState } from '../../components/EmptyState';
import { AppBar } from '../../components/material/AppBar';
import { Screen } from '../../components/Screen';
import { PLANT_CLASSES } from '../../lib/plantClasses';
import { getPlantCover } from '../../lib/plantAssets';
import { getGardenPlants, getScan, removeFromGarden } from '../../lib/storage';
import type { GardenPlant } from '../../lib/types';

const View = styled(RNView);

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
    });
}

export default function Garden() {
    const router = useRouter();
    const [gardenPlants, setGardenPlants] = useState<GardenPlant[]>([]);

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

    const renderRightActions = (plant: GardenPlant) => (
        <Pressable
            onPress={() => confirmDelete(plant)}
            accessibilityRole='button'
            accessibilityLabel='Remove plant from garden'
            className='bg-red-500 justify-center items-end w-24 mr-1 rounded-3xl mb-3 pr-6'>
            <Trash2
                size={24}
                color='white'
            />
        </Pressable>
    );

    const openPlant = (plant: GardenPlant) => {
        if (plant.scanId && getScan(plant.scanId)) {
            router.push(`/result/${plant.scanId}`);
        } else {
            router.push(`/plant/${plant.classIndex}`);
        }
    };

    return (
        <Screen className='gap-6'>
            <AppBar
                title='Garden'
                subtitle={`${gardenPlants.length} ${gardenPlants.length === 1 ? 'Plant' : 'Plants'} in your greenhouse`}
            />

            {gardenPlants.length === 0 ?
                <View className='flex-1 justify-center pb-10'>
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
                    contentContainerStyle={{ paddingBottom: 24 }}>
                    {gardenPlants.map((plant) => {
                        const plantInfo = PLANT_CLASSES[plant.classIndex] || {
                            name: 'Unknown Plant',
                            scientific: 'Unknown',
                        };
                        const reference = getPlantCover(plant.classIndex);
                        const coverImage =
                            plant.imageUri ? { uri: plant.imageUri } : reference;

                        return (
                            <ReanimatedSwipeable
                                key={plant.id}
                                renderRightActions={() =>
                                    renderRightActions(plant)
                                }>
                                <Pressable
                                    onPress={() => openPlant(plant)}
                                    accessibilityRole='button'
                                    accessibilityLabel={`Open ${plantInfo.name}`}
                                    accessibilityHint='Swipe left or long press to remove'
                                    onLongPress={() => confirmDelete(plant)}
                                    className='flex-row items-center p-4 rounded-3xl shadow-sm shadow-black/5 mb-3 active:opacity-80'
                                    style={{ backgroundColor: colors.surface }}>
                                    {coverImage ?
                                        <Image
                                            source={coverImage}
                                            style={{
                                                width: 72,
                                                height: 72,
                                                borderRadius: radii.md,
                                            }}
                                            contentFit='cover'
                                        />
                                    :   <View
                                            className='w-[72px] h-[72px] rounded-2xl items-center justify-center'
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
                                    <View className='flex-1 ml-4 justify-center'>
                                        <Text
                                            className='font-jakarta-bold text-xl mb-0.5'
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
                                    </View>
                                    <View
                                        className='p-2 rounded-full'
                                        style={{
                                            backgroundColor: colors.background,
                                        }}>
                                        <ChevronRight
                                            size={20}
                                            color={colors.primary}
                                        />
                                    </View>
                                </Pressable>
                            </ReanimatedSwipeable>
                        );
                    })}
                </ScrollView>
            }
        </Screen>
    );
}
