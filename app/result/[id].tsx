import { useState } from 'react';
import {
    View as RNView,
    Text,
    Pressable,
    ScrollView,
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
    Droplets,
    Sun,
    Activity,
} from 'lucide-react-native';
import { PLANT_CLASSES } from '../../lib/plantClasses';
import { saveToGarden, ScanRecord } from '../../lib/storage'; // Added imports

const View = styled(RNView);

export default function ResultScreen() {
    const { id, imageUri, confidence } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [isSaved, setIsSaved] = useState(false);

    const classIndex = Number(id);
    const plantData = PLANT_CLASSES[classIndex] || {
        name: 'Unknown Plant',
        scientific: 'Species incognita',
        care: "We couldn't identify specific care instructions for this plant.",
    };

    const handleSaveToGarden = () => {
        if (isSaved) return;

        const record: ScanRecord = {
            id: Date.now().toString(),
            classIndex,
            confidence: Number(confidence) || 0,
            imageUri: imageUri as string,
            timestamp: Date.now(),
        };

        saveToGarden(record);
        setIsSaved(true);
        ToastAndroid.show('Saved to your Garden!', ToastAndroid.SHORT);
    };

    return (
        <View className='flex-1 bg-[#F4F7F2]'>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}>
                <View className='h-96 w-full relative bg-[#2D5A27]'>
                    {imageUri && (
                        <Image
                            source={{ uri: imageUri as string }}
                            style={{ flex: 1, opacity: 0.8 }}
                            contentFit='cover'
                        />
                    )}
                    <Pressable
                        onPress={() => router.replace('/')}
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
                                {plantData.name}
                            </Text>
                            <Text className='text-lg font-vietnam-medium text-[#2D5A27] italic'>
                                {plantData.scientific}
                            </Text>
                        </View>
                        <Pressable
                            onPress={handleSaveToGarden}
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

                    {confidence && (
                        <View className='self-start flex-row items-center bg-[#84B026]/10 px-4 py-2 rounded-full mb-8'>
                            <Activity
                                size={16}
                                color='#2D5A27'
                            />
                            <Text className='ml-2 font-vietnam-bold text-[#2D5A27]'>
                                {(Number(confidence) * 100).toFixed(1)}% Match
                            </Text>
                        </View>
                    )}

                    <Text className='text-xl font-jakarta-bold text-[#1A1C19] mb-4'>
                        Care Insights
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
                                {plantData.care}
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
                                Avoid overwatering to prevent root rot.
                            </Text>
                        </View>
                    </View>

                    <Pressable className='bg-[#2D5A27] flex-row justify-center items-center p-5 rounded-full mt-10 active:opacity-90 shadow-lg shadow-[#2D5A27]/30'>
                        <Text className='font-jakarta-bold text-lg text-white'>
                            Run Disease Analysis
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}
