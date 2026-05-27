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
    Search,
    AlertCircle,
    Camera,
} from 'lucide-react-native';
import { PLANT_CLASSES } from '../../lib/plantClasses';
import { saveToGarden, ScanRecord } from '../../lib/storage';
import { Prediction } from '../../lib/mlPipeline';

const View = styled(RNView);

export default function ResultScreen() {
    const { id, imageUri, confidence, alternatives } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [isSaved, setIsSaved] = useState(false);

    const classIndex = Number(id);
    const confidenceScore = Number(confidence) || 0;

    const isConfident = confidenceScore >= 0.5;

    const plantData = PLANT_CLASSES[classIndex] || {
        name: 'Unknown Plant',
        scientific: 'Species incognita',
        care: "We couldn't identify specific care instructions for this plant.",
    };

    const alternativeMatches: Prediction[] =
        alternatives ? JSON.parse(alternatives as string) : [];

    const allMatches: Prediction[] = [
        { classIndex, confidenceScore },
        ...alternativeMatches,
    ];

    const handleSaveToGarden = () => {
        if (isSaved) return;

        const record: ScanRecord = {
            id: Date.now().toString(),
            classIndex,
            confidence: confidenceScore,
            imageUri: imageUri as string,
            timestamp: Date.now(),
        };

        saveToGarden(record);
        setIsSaved(true);
        ToastAndroid.show('Saved to your Garden!', ToastAndroid.SHORT);
    };

    const MatchList = ({ matches }: { matches: Prediction[] }) => (
        <View className='bg-white rounded-3xl p-4 shadow-sm shadow-black/5'>
            {matches.map((match, index) => {
                const matchData = PLANT_CLASSES[match.classIndex];
                if (!matchData) return null;

                return (
                    <View key={match.classIndex}>
                        <View className='flex-row items-center py-3'>
                            <View className='bg-[#F4F7F2] p-3 rounded-full mr-4'>
                                <Search
                                    size={20}
                                    color='#84B026'
                                />
                            </View>
                            <View className='flex-1'>
                                <Text className='font-jakarta-bold text-[#1A1C19] text-base'>
                                    {matchData.name}
                                </Text>
                                <Text className='font-vietnam text-[#1A1C19]/60 text-sm italic'>
                                    {matchData.scientific}
                                </Text>
                            </View>
                            <Text className='font-vietnam-bold text-[#2D5A27]'>
                                {(match.confidenceScore * 100).toFixed(1)}%
                            </Text>
                        </View>
                        {index < matches.length - 1 && (
                            <View className='h-px bg-[#F4F7F2] ml-14 my-1' />
                        )}
                    </View>
                );
            })}
        </View>
    );

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
                    {isConfident ?
                        <>
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

                            <View className='self-start flex-row items-center bg-[#84B026]/10 px-4 py-2 rounded-full mb-8'>
                                <Activity
                                    size={16}
                                    color='#2D5A27'
                                />
                                <Text className='ml-2 font-vietnam-bold text-[#2D5A27]'>
                                    {(confidenceScore * 100).toFixed(1)}% Match
                                </Text>
                            </View>

                            <Text className='text-xl font-jakarta-bold text-[#1A1C19] mb-4'>
                                Care Insights
                            </Text>
                            <View className='bg-white p-6 rounded-3xl gap-4 shadow-sm shadow-black/5 mb-8'>
                                <View className='flex-row items-center gap-4'>
                                    <View className='bg-[#EAF1E8] p-3 rounded-full'>
                                        <Sun
                                            size={24}
                                            color='#2D5A27'
                                        />
                                    </View>
                                    <Text className='flex-1 font-vietnam text-[#1A1C19] leading-relaxed'>
                                        {plantData.care ||
                                            'Keep soil moist and provide adequate sunlight.'}
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

                            {alternativeMatches.length > 0 && (
                                <>
                                    <Text className='text-xl font-jakarta-bold text-[#1A1C19] mb-4'>
                                        Alternative Matches
                                    </Text>
                                    <MatchList matches={alternativeMatches} />
                                </>
                            )}

                            <Pressable className='bg-[#2D5A27] flex-row justify-center items-center p-5 rounded-full mt-10 active:opacity-90 shadow-lg shadow-[#2D5A27]/30'>
                                <Text className='font-jakarta-bold text-lg text-white'>
                                    Run Disease Analysis
                                </Text>
                            </Pressable>
                        </>
                    :   <>
                            <View className='bg-[#84B026]/10 p-5 rounded-[24px] mb-8 flex-row items-center gap-4'>
                                <View className='bg-[#F4F7F2] p-3 rounded-full'>
                                    <AlertCircle
                                        size={28}
                                        color='#2D5A27'
                                    />
                                </View>
                                <Text className='flex-1 font-vietnam text-[#1A1C19] leading-relaxed pr-2'>
                                    We are not so sure about this one. Here are
                                    our 5 best guesses. Try framing the plant
                                    clearly and retaking the photo.
                                </Text>
                            </View>

                            <Text className='text-xl font-jakarta-bold text-[#1A1C19] mb-4'>
                                Top 5 Guesses
                            </Text>

                            <MatchList matches={allMatches} />

                            <Pressable
                                onPress={() => router.replace('/camera')}
                                className='bg-[#2D5A27] flex-row justify-center items-center p-5 rounded-full mt-10 active:opacity-90 shadow-lg shadow-[#2D5A27]/30'>
                                <Camera
                                    size={24}
                                    color='#F4F7F2'
                                    className='mr-3'
                                />
                                <Text className='font-jakarta-bold text-lg text-white'>
                                    Retake Photo
                                </Text>
                            </Pressable>
                        </>
                    }
                </View>
            </ScrollView>
        </View>
    );
}
