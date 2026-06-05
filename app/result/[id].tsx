import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    BookmarkCheck,
    BookmarkPlus,
    Bug,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sun,
} from 'lucide-react-native';
import { styled } from 'nativewind';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    Pressable,
    View as RNView,
    ScrollView,
    Text,
    ToastAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PLANT_IMAGES } from '../../lib/plantImages';

import { colors, radii, spacing } from '@/theme';
import { DISEASE_CLASSES, PEST_CLASSES } from '../../lib/healthClasses';
import { PLANT_CLASSES } from '../../lib/plantClasses';
import {
    saveScanResult,
    saveToGarden,
    storage,
    StorageKeys,
} from '../../lib/storage';

const View = styled(RNView);

export default function ResultScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const sessionData = JSON.parse(
        storage.getString(StorageKeys.CURRENT_SESSION) || '{}',
    );
    const { originalUri, plant, pest, disease } = sessionData;
    const SCREEN_WIDTH = Dimensions.get('window').width;

    const [selectedPlantIdx, setSelectedPlantIdx] = useState(0);
    const [isSavedToGarden, setIsSavedToGarden] = useState(false);
    const [hasSavedToHistory, setHasSavedToHistory] = useState(false);

    const top5Matches = plant || [];
    const mainMatch = top5Matches[selectedPlantIdx];

    useEffect(() => {
        if (mainMatch && !hasSavedToHistory) {
            saveScanResult(
                mainMatch.classIndex,
                mainMatch.confidenceScore,
                originalUri,
            );
            setHasSavedToHistory(true);
        }
    }, [mainMatch]);

    if (!mainMatch) return null; // Fallback

    const plantInfo = PLANT_CLASSES[mainMatch.classIndex] || {
        name: 'Unknown',
        scientific: 'Unknown',
        care: '',
    };

    const handleSaveToGarden = () => {
        if (isSavedToGarden) return;
        saveToGarden({
            id: Date.now().toString(),
            classIndex: mainMatch.classIndex,
            confidence: mainMatch.confidenceScore,
            imageUri: originalUri,
            timestamp: Date.now(),
        });
        setIsSavedToGarden(true);
        ToastAndroid.show('Saved to Garden!', ToastAndroid.SHORT);
    };

    return (
        <View className='flex-1 bg-[#F4F7F2]'>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: spacing.scrollBottom }}>
                <View className='h-[420px] w-full relative bg-[#2D5A27]'>
                    {(
                        PLANT_IMAGES[mainMatch.classIndex] &&
                        PLANT_IMAGES[mainMatch.classIndex].length > 0
                    ) ?
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            className='flex-1'>
                            {PLANT_IMAGES[mainMatch.classIndex].map(
                                (imgSrc, idx) => (
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
                                ),
                            )}
                        </ScrollView>
                    :   <Image
                            source={{ uri: originalUri }}
                            style={{ flex: 1, opacity: 0.85 }}
                            contentFit='cover'
                        />
                    }

                    <View className='absolute top-0 w-full h-32 bg-black/30' />

                    <View className='absolute bottom-14 right-6 bg-black/60 px-3 py-1.5 rounded-full'>
                        <Text className='font-vietnam text-white/90 text-xs'>
                            {PLANT_IMAGES[mainMatch.classIndex] ?
                                'Swipe for Reference Photos'
                            :   'Your Photo'}
                        </Text>
                    </View>

                    <Pressable
                        onPress={() => router.replace('/')}
                        className='absolute bg-black/40 p-3 rounded-full'
                        style={{ top: Math.max(insets.top, 16), left: 16 }}>
                        <ArrowLeft
                            size={24}
                            color={colors.background}
                        />
                    </Pressable>
                </View>

                <View className='bg-[#F4F7F2] -mt-10 rounded-t-[40px] p-8 px-6 flex-1'>
                    {/* Plant Identity Section */}
                    <View className='flex-row justify-between items-start mb-4'>
                        <View className='flex-1 pr-4'>
                            <Text className='text-4xl font-jakarta-extrabold text-[#1A1C19] mb-1'>
                                {plantInfo.name}
                            </Text>
                            <Text className='text-lg font-vietnam-medium text-[#2D5A27] italic'>
                                {plantInfo.scientific}
                            </Text>
                            <Text className='font-vietnam-bold text-[#84B026] mt-2'>
                                {(mainMatch.confidenceScore * 100).toFixed(1)}%
                                Match
                            </Text>
                        </View>
                        <Pressable
                            onPress={handleSaveToGarden}
                            className={`p-4 rounded-full ${isSavedToGarden ? 'bg-[#2D5A27]' : 'bg-[#84B026]/10'}`}>
                            {isSavedToGarden ?
                                <BookmarkCheck
                                    size={28}
                                    color={colors.background}
                                />
                            :   <BookmarkPlus
                                    size={28}
                                    color={colors.primary}
                                />
                            }
                        </Pressable>
                    </View>

                    {/* Care Insights */}
                    <View className='bg-[#EAF1E8] p-5 rounded-3xl gap-4 shadow-sm shadow-black/5 mb-8'>
                        <View className='flex-row items-center gap-4'>
                            <View className='bg-[#EAF1E8] p-3 rounded-full'>
                                <Sun
                                    size={20}
                                    color={colors.primary}
                                />
                            </View>
                            <Text className='flex-1 font-vietnam text-[#1A1C19]'>
                                {plantInfo.care || 'Provide adequate care.'}
                            </Text>
                        </View>
                    </View>

                    {top5Matches.length > 1 && (
                        <>
                            <Text className='text-lg font-jakarta-bold text-[#1A1C19] mb-4'>
                                Not correct? Select from Top 5
                            </Text>
                            <View className='bg-[#EAF1E8] rounded-3xl p-2 shadow-sm shadow-black/5 mb-8'>
                                {top5Matches.map((alt: any, index: number) => {
                                    if (index === selectedPlantIdx) return null; // Don't show currently selected
                                    const altData =
                                        PLANT_CLASSES[alt.classIndex];
                                    return (
                                        <Pressable
                                            key={alt.classIndex}
                                            onPress={() =>
                                                setSelectedPlantIdx(index)
                                            } // Swap!
                                            className='flex-row items-center p-3 active:opacity-50'>
                                            <View className='bg-[#F4F7F2] p-2 rounded-full mr-3'>
                                                <Search
                                                    size={18}
                                                    color={colors.accent}
                                                />
                                            </View>
                                            <View className='flex-1'>
                                                <Text className='font-jakarta-bold text-[#1A1C19]'>
                                                    {altData?.name}
                                                </Text>
                                            </View>
                                            <Text className='font-vietnam-bold text-[#2D5A27]'>
                                                {(
                                                    alt.confidenceScore * 100
                                                ).toFixed(0)}
                                                %
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    <Text className='text-2xl font-jakarta-bold text-[#1A1C19] mb-4 mt-4'>
                        Diagnostics
                    </Text>

                    <View className='bg-[#EAF1E8] p-5 rounded-3xl shadow-sm shadow-black/5 mb-4 border border-[#F4F7F2]'>
                        <View className='flex-row items-center gap-3 mb-4'>
                            {disease.hasDisease ?
                                <ShieldAlert
                                    size={24}
                                    color={colors.danger}
                                />
                            :   <ShieldCheck
                                    size={24}
                                    color={colors.accent}
                                />
                            }
                            <Text className='font-jakarta-bold text-xl text-[#1A1C19]'>
                                Disease Check
                            </Text>
                        </View>
                        {disease.hasDisease ?
                            <>
                                <Image
                                    source={{ uri: disease.blendedBase64 }}
                                    style={{
                                        width: '100%',
                                        height: 200,
                                        borderRadius: radii.md,
                                        marginBottom: 16,
                                    }}
                                    contentFit='cover'
                                />
                                <Text className='font-jakarta-bold text-[#E25A38] text-lg mb-1 mt-4'>
                                    {
                                        DISEASE_CLASSES[
                                            disease.diseaseClassIndex
                                        ]?.name
                                    }
                                </Text>
                                <Text className='font-vietnam text-[#1A1C19]/70 leading-relaxed'>
                                    {
                                        DISEASE_CLASSES[
                                            disease.diseaseClassIndex
                                        ]?.treatment
                                    }
                                </Text>
                            </>
                        :   <Text className='font-vietnam text-[#1A1C19]/70'>
                                No significant disease markers detected.
                            </Text>
                        }
                    </View>

                    <View className='bg-[#EAF1E8] p-5 rounded-3xl shadow-sm shadow-black/5 mb-10 border border-[#F4F7F2]'>
                        <View className='flex-row items-center gap-3 mb-4'>
                            {pest.confidenceScore >= 0.7 ?
                                <Bug
                                    size={24}
                                    color={colors.danger}
                                />
                            :   <ShieldCheck
                                    size={24}
                                    color={colors.accent}
                                />
                            }
                            <Text className='font-jakarta-bold text-xl text-[#1A1C19]'>
                                Pest Check
                            </Text>
                        </View>
                        {pest.confidenceScore >= 0.7 ?
                            <>
                                <Text className='font-jakarta-bold text-[#E25A38] text-lg mb-1'>
                                    {PEST_CLASSES[pest.classIndex]?.name}
                                </Text>
                                <Text className='font-vietnam text-[#1A1C19]/70 leading-relaxed'>
                                    {PEST_CLASSES[pest.classIndex]?.treatment}
                                </Text>
                            </>
                        :   <Text className='font-vietnam text-[#1A1C19]/70'>
                                No pests detected with high confidence.
                            </Text>
                        }
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
