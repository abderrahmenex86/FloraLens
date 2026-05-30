import { useState, useEffect } from 'react';
import {
    View as RNView,
    Text,
    Pressable,
    ScrollView,
    Dimensions,
    ToastAndroid,
} from 'react-native';
import { Image } from 'expo-image';
import { styled } from 'nativewind';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    BookmarkPlus,
    BookmarkCheck,
    Sun,
    Droplets,
} from 'lucide-react-native';

import { PLANT_CLASSES } from '../../lib/plantClasses';
import { PLANT_IMAGES } from '../../lib/plantImages';
import { getGardenPlants, saveToGarden } from '../../lib/storage';

const View = styled(RNView);
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function PlantProfileScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const classIndex = Number(id);
    const plantInfo = PLANT_CLASSES[classIndex];

    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const garden = getGardenPlants();
        setIsSaved(garden.some((p) => p.classIndex === classIndex));
    }, [classIndex]);

    if (!plantInfo) return null;

    const images = PLANT_IMAGES[classIndex] || [];

    const handleSave = () => {
        if (isSaved) return;
        saveToGarden({
            id: Date.now().toString(),
            classIndex,
            confidence: 1,
            imageUri: '',
            timestamp: Date.now(),
        });
        setIsSaved(true);
        ToastAndroid.show('Added to Garden!', ToastAndroid.SHORT);
    };

    return (
        <View className='flex-1 bg-[#F4F7F2]'>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}>
                <View className='h-[420px] w-full relative bg-[#2D5A27]'>
                    {images.length > 0 ?
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            className='flex-1'>
                            {images.map((imgSrc: any, idx: number) => (
                                <View
                                    key={idx}
                                    style={{
                                        width: SCREEN_WIDTH,
                                        height: '100%',
                                    }}>
                                    <Image
                                        source={imgSrc}
                                        style={{ flex: 1, opacity: 0.9 }}
                                        contentFit='cover'
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    :   <View className='flex-1 items-center justify-center bg-[#2D5A27]'>
                            <Text className='font-jakarta-bold text-white/50 text-xl'>
                                No Image Available
                            </Text>
                        </View>
                    }

                    <View className='absolute top-0 w-full h-32 bg-black/30' />
                    <Pressable
                        onPress={() => router.back()}
                        className='absolute bg-black/40 p-3 rounded-full'
                        style={{ top: Math.max(insets.top, 16), left: 16 }}>
                        <ArrowLeft
                            size={24}
                            color='#F4F7F2'
                        />
                    </Pressable>
                </View>

                <View className='bg-[#F4F7F2] -mt-10 rounded-t-[40px] p-8 px-6 flex-1'>
                    <View className='flex-row justify-between items-start mb-6'>
                        <View className='flex-1 pr-4'>
                            <Text className='text-4xl font-jakarta-extrabold text-[#1A1C19] mb-1'>
                                {plantInfo.name}
                            </Text>
                            <Text className='text-lg font-vietnam-medium text-[#2D5A27] italic'>
                                {plantInfo.scientific}
                            </Text>
                        </View>
                        <Pressable
                            onPress={handleSave}
                            className={`p-4 rounded-full ${isSaved ? 'bg-[#2D5A27]' : 'bg-[#84B026]/10'}`}>
                            {isSaved ?
                                <BookmarkCheck
                                    size={28}
                                    color='#F4F7F2'
                                />
                            :   <BookmarkPlus
                                    size={28}
                                    color='#2D5A27'
                                />
                            }
                        </Pressable>
                    </View>

                    <Text className='text-2xl font-jakarta-bold text-[#1A1C19] mb-4'>
                        Care Guide
                    </Text>

                    <View className='bg-white p-6 rounded-3xl gap-4 shadow-sm shadow-black/5'>
                        <View className='flex-row items-center gap-4'>
                            <View className='bg-[#EAF1E8] p-3 rounded-full'>
                                <Sun
                                    size={24}
                                    color='#2D5A27'
                                />
                            </View>
                            <Text className='flex-1 font-vietnam text-[#1A1C19] leading-relaxed'>
                                {plantInfo.care || 'Provide adequate sunlight.'}
                            </Text>
                        </View>
                        <View className='h-px bg-[#F4F7F2] w-full my-2' />
                        <View className='flex-row items-center gap-4'>
                            <View className='bg-[#EAF1E8] p-3 rounded-full'>
                                <Droplets
                                    size={24}
                                    color='#2D5A27'
                                />
                            </View>
                            <Text className='flex-1 font-vietnam text-[#1A1C19] leading-relaxed'>
                                Water thoroughly but allow soil to dry between
                                waterings.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
