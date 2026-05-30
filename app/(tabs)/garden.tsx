import { useState, useCallback } from 'react';
import { Text, View as RNView, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { styled } from 'nativewind';
import { useFocusEffect, useRouter } from 'expo-router';
import { Sprout, Trash2, ChevronRight } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import {
    getGardenPlants,
    removeFromGarden,
    ScanRecord,
} from '../../lib/storage';
import { PLANT_CLASSES } from '../../lib/plantClasses';
import { PLANT_IMAGES } from '../../lib/plantImages';

const View = styled(RNView);

export default function Garden() {
    const router = useRouter();
    const [gardenPlants, setGardenPlants] = useState<ScanRecord[]>([]);

    useFocusEffect(
        useCallback(() => {
            setGardenPlants(getGardenPlants());
        }, [])
    );

    const handleDelete = (id: string) => {
        removeFromGarden(id);
        setGardenPlants((prev) => prev.filter((p) => p.id !== id));
    };

    const renderRightActions = (id: string) => (
        <Pressable
            onPress={() => handleDelete(id)}
            className='bg-red-500 justify-center items-end w-24 rounded-3xl mb-3 pr-6'>
            <Trash2
                size={24}
                color='white'
            />
        </Pressable>
    );

    return (
        <Screen className='gap-6'>
            <View className='flex gap-2 mb-2'>
                <Text className='text-5xl font-jakarta-bold text-[#1A1C19]'>
                    Garden
                </Text>
                <Text className='text-lg font-vietnam text-[#2D5A27]'>
                    {gardenPlants.length}{' '}
                    {gardenPlants.length === 1 ? 'Plant' : 'Plants'} in your
                    greenhouse
                </Text>
            </View>

            {gardenPlants.length === 0 ?
                <View className='flex-1 justify-center pb-10'>
                    <EmptyState
                        icon={Sprout}
                        title='Your garden is empty'
                        description='Save plants from your scans to track their health and get care reminders.'
                    />
                </View>
            :   <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}>
                    {gardenPlants.map((plant) => {
                        const plantInfo = PLANT_CLASSES[plant.classIndex] || {
                            name: 'Unknown Plant',
                            scientific: 'Unknown',
                        };
                        // Prefer high quality reference image for the garden, fallback to scan
                        const coverImage = (PLANT_IMAGES[plant.classIndex] &&
                            PLANT_IMAGES[plant.classIndex][0]) || {
                            uri: plant.imageUri,
                        };

                        return (
                            <Swipeable
                                key={plant.id}
                                renderRightActions={() =>
                                    renderRightActions(plant.id)
                                }>
                                <Pressable
                                    onPress={() =>
                                        router.push(
                                            `/plant/${plant.classIndex}`
                                        )
                                    }
                                    className='flex-row items-center bg-white p-4 rounded-3xl shadow-sm shadow-black/5 mb-3 active:opacity-80'>
                                    <Image
                                        source={coverImage}
                                        style={{
                                            width: 72,
                                            height: 72,
                                            borderRadius: 16,
                                        }}
                                        contentFit='cover'
                                    />
                                    <View className='flex-1 ml-4 justify-center'>
                                        <Text
                                            className='font-jakarta-bold text-[#1A1C19] text-lg mb-0.5'
                                            numberOfLines={1}>
                                            {plantInfo.name}
                                        </Text>
                                        <Text
                                            className='font-vietnam text-[#1A1C19]/60 text-sm'
                                            numberOfLines={1}>
                                            {plantInfo.scientific}
                                        </Text>
                                    </View>
                                    <View className='bg-[#F4F7F2] p-2 rounded-full'>
                                        <ChevronRight
                                            size={20}
                                            color='#2D5A27'
                                        />
                                    </View>
                                </Pressable>
                            </Swipeable>
                        );
                    })}
                </ScrollView>
            }
        </Screen>
    );
}
