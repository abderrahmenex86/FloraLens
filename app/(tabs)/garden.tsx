import { useState, useCallback } from 'react';
import { Text, View as RNView, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { styled } from 'nativewind';
import { useFocusEffect, useRouter } from 'expo-router';
import { Sprout } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import { getGardenPlants, ScanRecord } from '../../lib/storage';
import { PLANT_CLASSES } from '../../lib/plantClasses';

const View = styled(RNView);

export default function Garden() {
    const router = useRouter();
    const [gardenPlants, setGardenPlants] = useState<ScanRecord[]>([]);

    useFocusEffect(
        useCallback(() => {
            const plants = getGardenPlants();
            setGardenPlants(plants);
        }, [])
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
                        description='Save plants from your scans to track their health, get care reminders, and monitor disease recovery.'
                    />
                </View>
            :   <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}>
                    <View className='flex-row flex-wrap justify-between gap-y-4'>
                        {gardenPlants.map((plant) => {
                            const plantInfo = PLANT_CLASSES[
                                plant.classIndex
                            ] || {
                                name: 'Unknown Plant',
                                scientific: 'Unknown',
                            };

                            return (
                                <Pressable
                                    key={plant.id}
                                    onPress={() => {
                                        router.push({
                                            pathname: '/result/[id]',
                                            params: {
                                                id: plant.classIndex.toString(),
                                                imageUri: plant.imageUri,
                                                confidence:
                                                    plant.confidence.toString(),
                                            },
                                        });
                                    }}
                                    className='w-[48%] bg-white rounded-[24px] p-3 shadow-sm shadow-black/5 active:opacity-90'>
                                    <Image
                                        source={{ uri: plant.imageUri }}
                                        style={{
                                            width: '100%',
                                            aspectRatio: 1,
                                            borderRadius: 16,
                                            marginBottom: 12,
                                        }}
                                        contentFit='cover'
                                    />
                                    <Text
                                        className='font-jakarta-bold text-[#1A1C19] text-base mb-1'
                                        numberOfLines={1}>
                                        {plantInfo.name}
                                    </Text>
                                    <Text
                                        className='font-vietnam text-[#1A1C19]/60 text-xs'
                                        numberOfLines={1}>
                                        {plantInfo.scientific}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>
            }
        </Screen>
    );
}
