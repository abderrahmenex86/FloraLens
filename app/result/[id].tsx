import { useState, useRef } from 'react';
import {
    View as RNView,
    Text,
    Pressable,
    ScrollView,
    ToastAndroid,
    ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { styled } from 'nativewind';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import * as FileSystem from 'expo-file-system/legacy';
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
    ShieldAlert,
    ShieldCheck,
    Bug,
} from 'lucide-react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { PLANT_CLASSES } from '../../lib/plantClasses';
import { DISEASE_CLASSES, PEST_CLASSES } from '../../lib/healthClasses';
import { saveToGarden, ScanRecord } from '../../lib/storage';
import { mlPipeline, Prediction } from '../../lib/mlPipeline';

const View = styled(RNView);

type HealthState = 'idle' | 'analyzing' | 'complete';

export default function ResultScreen() {
    const { id, imageUri, confidence, alternatives } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const bottomSheetRef = useRef<BottomSheet>(null);

    const [isSaved, setIsSaved] = useState(false);

    const [healthState, setHealthState] = useState<HealthState>('idle');
    const [healthResult, setHealthResult] = useState<{
        disease: Prediction;
        pest: Prediction;
    } | null>(null);

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

    const runHealthAnalysis = async () => {
        try {
            setHealthState('analyzing');
            bottomSheetRef.current?.expand();

            await mlPipeline.initHealthModels();

            const pestManip = await manipulateAsync(
                imageUri as string,
                [
                    { resize: { width: 256 } },
                    {
                        crop: {
                            originX: 16,
                            originY: 16,
                            width: 224,
                            height: 224,
                        },
                    },
                ],
                { compress: 1, format: SaveFormat.JPEG, base64: true }
            );

            const diseaseManip = await manipulateAsync(
                imageUri as string,
                [
                    { resize: { width: 520, height: 520 } }, // Or center crop to 520 depending on your eval logic
                ],
                { compress: 1, format: SaveFormat.JPEG, base64: true }
            );

            if (!pestManip.base64 || !diseaseManip.base64) {
                throw new Error('Failed to manipulate images');
            }

            const [pestResult, diseaseResult] = await Promise.all([
                mlPipeline.analyzePest(pestManip.base64),
                mlPipeline.analyzeDisease(diseaseManip.base64),
            ]);

            setHealthResult({
                pest: pestResult,
                disease: {
                    classIndex: diseaseResult.diseaseClassIndex,
                    confidenceScore: diseaseResult.severity,
                },
            });
            setHealthState('complete');
        } catch (error) {
            console.error('Health Analysis Failed:', error);
            setHealthState('idle');
            bottomSheetRef.current?.close();
            ToastAndroid.show(
                'Analysis failed. Please try again.',
                ToastAndroid.SHORT
            );
        }
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
                            <View className='flex-1 pr-2'>
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
                                            'Provide adequate sunlight.'}
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

                            <Pressable
                                onPress={runHealthAnalysis}
                                className='bg-[#2D5A27] flex-row justify-center items-center p-5 rounded-full mt-10 active:opacity-90 shadow-lg shadow-[#2D5A27]/30'>
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

            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={healthState === 'analyzing' ? ['35%'] : ['70%']}
                enablePanDownToClose={healthState === 'complete'}
                backgroundStyle={{
                    backgroundColor: '#F4F7F2',
                    borderRadius: 32,
                }}>
                <BottomSheetView className='flex-1 p-8 pt-4'>
                    {healthState === 'analyzing' ?
                        <View className='flex-1 items-center justify-center gap-4'>
                            <View className='bg-[#2D5A27]/10 p-4 rounded-full mb-2'>
                                <ActivityIndicator
                                    size='large'
                                    color='#2D5A27'
                                />
                            </View>
                            <Text className='text-2xl font-jakarta-bold text-[#1A1C19]'>
                                Running Diagnostics...
                            </Text>
                            <Text className='font-vietnam text-[#1A1C19]/70 text-center px-4'>
                                Checking leaves and stems against our local
                                disease and pest databases.
                            </Text>
                        </View>
                    : healthState === 'complete' && healthResult ?
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{
                                gap: 24,
                                paddingBottom: 32,
                            }}>
                            <View className='items-center mb-2'>
                                <View className='bg-[#84B026]/20 p-4 rounded-full mb-4'>
                                    <ShieldCheck
                                        size={32}
                                        color='#2D5A27'
                                    />
                                </View>
                                <Text className='text-3xl font-jakarta-bold text-[#1A1C19] text-center'>
                                    Health Report
                                </Text>
                            </View>

                            <View className='bg-white p-6 rounded-[24px] border border-[#F4F7F2]'>
                                <View className='flex-row items-center gap-3 mb-2'>
                                    <ShieldAlert
                                        size={20}
                                        color={
                                            (
                                                healthResult.disease
                                                    .classIndex === 0
                                            ) ?
                                                '#84B026'
                                            :   '#E25A38'
                                        }
                                    />
                                    <Text className='font-jakarta-bold text-xl text-[#1A1C19]'>
                                        Disease Check
                                    </Text>
                                </View>
                                <Text className='font-jakarta-bold text-[#1A1C19] text-lg mb-1'>
                                    {DISEASE_CLASSES[
                                        healthResult.disease.classIndex
                                    ]?.name || 'Unknown'}
                                </Text>
                                <Text className='font-vietnam text-[#1A1C19]/70 leading-relaxed'>
                                    {DISEASE_CLASSES[
                                        healthResult.disease.classIndex
                                    ]?.treatment || 'Consult a specialist.'}
                                </Text>
                                <Text className='font-vietnam-bold text-[#2D5A27] mt-3'>
                                    Confidence:{' '}
                                    {(
                                        healthResult.disease.confidenceScore *
                                        100
                                    ).toFixed(1)}
                                    %
                                </Text>
                            </View>

                            <View className='bg-white p-6 rounded-[24px] border border-[#F4F7F2]'>
                                <View className='flex-row items-center gap-3 mb-2'>
                                    <Bug
                                        size={20}
                                        color={
                                            healthResult.pest.classIndex === 0 ?
                                                '#84B026'
                                            :   '#E25A38'
                                        }
                                    />
                                    <Text className='font-jakarta-bold text-xl text-[#1A1C19]'>
                                        Pest Check
                                    </Text>
                                </View>
                                <Text className='font-jakarta-bold text-[#1A1C19] text-lg mb-1'>
                                    {PEST_CLASSES[healthResult.pest.classIndex]
                                        ?.name || 'Unknown'}
                                </Text>
                                <Text className='font-vietnam text-[#1A1C19]/70 leading-relaxed'>
                                    {PEST_CLASSES[healthResult.pest.classIndex]
                                        ?.treatment || 'Consult a specialist.'}
                                </Text>
                                <Text className='font-vietnam-bold text-[#2D5A27] mt-3'>
                                    Confidence:{' '}
                                    {(
                                        healthResult.pest.confidenceScore * 100
                                    ).toFixed(1)}
                                    %
                                </Text>
                            </View>

                            <Pressable
                                onPress={() => bottomSheetRef.current?.close()}
                                className='bg-[#F4F7F2] p-4 rounded-full mt-2'>
                                <Text className='font-jakarta-bold text-center text-[#2D5A27]'>
                                    Dismiss
                                </Text>
                            </Pressable>
                        </ScrollView>
                    :   null}
                </BottomSheetView>
            </BottomSheet>
        </View>
    );
}
