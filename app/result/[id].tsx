import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { StatusBar } from 'expo-status-bar';
import { styled } from 'nativewind';
import { useMemo, useState } from 'react';
import {
    Pressable,
    View as RNView,
    ScrollView,
    Text,
    ToastAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPlantImages } from '../../lib/plantAssets';

import { colors, radii, spacing } from '@/theme';
import { DISEASE_CLASSES, PEST_CLASSES } from '../../lib/healthClasses';
import { PLANT_CLASSES } from '../../lib/plantClasses';
import {
    getLegacySession,
    getScan,
    isInGarden,
    savePlantToGarden,
    saveScanToGarden,
    updateScanSelection,
} from '../../lib/storage';
import {
    isUncertain,
    PEST_CONFIDENCE,
    type ScanRecord,
} from '../../lib/types';

const View = styled(RNView);

function formatConfidence(value: number): string {
    const pct = value * 100;
    if (pct < 0.1) return '<0.1%';
    if (pct < 10) return `${pct.toFixed(1)}%`;
    return `${pct.toFixed(0)}%`;
}

function legacyScan(): ScanRecord | null {
    const session = getLegacySession();
    const top = session?.plant?.[0];
    if (!session || !top || !session.originalUri) return null;
    return {
        id: 'legacy',
        classIndex: top.classIndex,
        confidence: top.confidenceScore,
        imageUri: session.originalUri,
        timestamp: Date.now(),
        diagnosis:
            session.pest && session.disease ?
                {
                    plant: session.plant ?? [],
                    pest: session.pest,
                    disease: session.disease,
                }
            :   undefined,
    };
}

function MissingScan() {
    const router = useRouter();
    return (
        <View className='flex-1 bg-[#F4F7F2] items-center justify-center p-8 gap-4'>
            <StatusBar style='dark' />
            <ShieldAlert
                size={48}
                color={colors.danger}
            />
            <Text className='text-2xl font-jakarta-bold text-[#1A1C19] text-center'>
                This scan is no longer available
            </Text>
            <Text className='font-vietnam text-[#1A1C19]/70 text-center'>
                It may have been deleted, or the app was cleared. Start a new
                scan, or go back to your history.
            </Text>
            <Pressable
                onPress={() => router.replace('/')}
                accessibilityRole='button'
                className='bg-[#2D5A27] px-6 py-4 rounded-2xl'>
                <Text className='font-jakarta-bold text-white'>Go home</Text>
            </Pressable>
        </View>
    );
}

export default function ResultScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const routeId = Array.isArray(params.id) ? params.id[0] : params.id;

    const [scan, setScan] = useState<ScanRecord | null>(() =>
        routeId === 'session' ? legacyScan() : routeId ? getScan(routeId) : null,
    );
    const [selectedPlantIdx, setSelectedPlantIdx] = useState(() => {
        if (!scan?.selectedClassIndex) return 0;
        const index = scan.diagnosis?.plant.findIndex(
            (item) => item.classIndex === scan.selectedClassIndex,
        );
        return index && index > 0 ? index : 0;
    });
    const [isSavedToGarden, setIsSavedToGarden] = useState(() =>
        scan ? isInGarden(scan.id) : false,
    );

    const plantMatches = useMemo(() => {
        if (!scan) return [];
        if (scan.diagnosis?.plant?.length) return scan.diagnosis.plant;
        return [{ classIndex: scan.classIndex, confidenceScore: scan.confidence }];
    }, [scan]);

    if (!scan || plantMatches.length === 0) return <MissingScan />;

    const mainMatch = plantMatches[selectedPlantIdx] ?? plantMatches[0];
    const plantInfo = PLANT_CLASSES[mainMatch.classIndex] || {
        name: 'Unknown plant',
        scientific: 'Not in the library',
        care: '',
    };
    const stats = scan.diagnosis?.plantStats;
    const uncertain = stats ?
        isUncertain(stats)
    :   mainMatch.confidenceScore < 0.5;
    const isManualSelection = scan.selectedClassIndex != null;
    const disease = scan.diagnosis?.disease;
    const pest = scan.diagnosis?.pest;
    const references = getPlantImages(mainMatch.classIndex);

    const handleBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/');
    };

    const handleSaveToGarden = () => {
        if (isSavedToGarden) return;
        const added =
            scan.id === 'legacy' ?
                savePlantToGarden(mainMatch.classIndex, scan.imageUri)
            :   saveScanToGarden(scan);
        if (added) {
            setIsSavedToGarden(true);
            ToastAndroid.show('Saved to Garden!', ToastAndroid.SHORT);
        }
    };

    const handleSelectAlternative = (index: number) => {
        const alternative = plantMatches[index];
        if (!alternative) return;
        const updated = updateScanSelection(
            scan.id,
            alternative.classIndex,
            alternative.confidenceScore,
        );
        if (updated) setScan(updated);
        setSelectedPlantIdx(index);
    };

    return (
        <View className='flex-1 bg-[#F4F7F2]'>
            <StatusBar style='light' />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: spacing.scrollBottom }}>
                <View className='h-[420px] w-full relative bg-[#2D5A27]'>
                    <Image
                        source={{ uri: scan.imageUri }}
                        style={{ flex: 1 }}
                        contentFit='cover'
                    />
                    <View className='absolute top-0 w-full h-32 bg-black/30' />

                    <View className='absolute bottom-14 right-6 bg-black/60 px-3 py-1.5 rounded-full'>
                        <Text className='font-vietnam text-white/90 text-xs'>
                            Your photo
                        </Text>
                    </View>

                    <Pressable
                        onPress={handleBack}
                        accessibilityRole='button'
                        accessibilityLabel='Go back'
                        className='absolute bg-black/40 p-3 rounded-full'
                        style={{ top: Math.max(insets.top, 16), left: 16 }}>
                        <ArrowLeft
                            size={24}
                            color={colors.background}
                        />
                    </Pressable>
                </View>

                <View className='bg-[#F4F7F2] -mt-10 rounded-t-[40px] p-8 px-6 flex-1'>
                    <View className='flex-row justify-between items-start mb-4'>
                        <View className='flex-1 pr-4'>
                            <Text className='text-4xl font-jakarta-extrabold text-[#1A1C19] mb-1'>
                                {plantInfo.name}
                            </Text>
                            <Text className='text-lg font-vietnam-medium text-[#2D5A27] italic'>
                                {plantInfo.scientific}
                            </Text>
                            <Text
                                className={`font-vietnam-bold mt-2 ${uncertain ? 'text-[#1A1C19]/70' : 'text-[#2D5A27]'}`}>
                                {isManualSelection ?
                                    'You selected this'
                                : uncertain ?
                                    `Not sure — best guess: ${formatConfidence(mainMatch.confidenceScore)}`
                                :   `${formatConfidence(mainMatch.confidenceScore)} match`}
                            </Text>
                            {uncertain && (
                                <Text className='font-vietnam text-[#1A1C19]/60 mt-1 text-sm'>
                                    This plant may not be in the library. Try a
                                    close-up of one leaf in good light.
                                </Text>
                            )}
                        </View>
                        <Pressable
                            onPress={handleSaveToGarden}
                            accessibilityRole='button'
                            accessibilityLabel={
                                isSavedToGarden ?
                                    'Already saved to garden'
                                :   'Save to garden'
                            }
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

                    {plantMatches.length > 1 && (
                        <>
                            <Text className='text-lg font-jakarta-bold text-[#1A1C19] mb-4'>
                                Not the right plant?
                            </Text>
                            <View className='bg-[#EAF1E8] rounded-3xl p-2 shadow-sm shadow-black/5 mb-8'>
                                {plantMatches.map((alt, index) => {
                                    if (index === selectedPlantIdx) return null;
                                    const altData = PLANT_CLASSES[alt.classIndex];
                                    return (
                                        <Pressable
                                            key={`${alt.classIndex}-${index}`}
                                            onPress={() =>
                                                handleSelectAlternative(index)
                                            }
                                            accessibilityRole='button'
                                            accessibilityLabel={`Select ${altData?.name ?? 'unknown plant'}`}
                                            className='flex-row items-center p-3 active:opacity-50'>
                                            <View className='bg-[#F4F7F2] p-2 rounded-full mr-3'>
                                                <Search
                                                    size={18}
                                                    color={colors.accent}
                                                />
                                            </View>
                                            <View className='flex-1'>
                                                <Text className='font-jakarta-bold text-[#1A1C19]'>
                                                    {altData?.name ??
                                                        'Unknown plant'}
                                                </Text>
                                            </View>
                                            <Text className='font-vietnam-bold text-[#2D5A27]'>
                                                {formatConfidence(
                                                    alt.confidenceScore,
                                                )}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    {references.length > 0 && (
                        <>
                            <Text className='text-lg font-jakarta-bold text-[#1A1C19] mb-3'>
                                Reference photos
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className='mb-8'>
                                {references.map((imgSrc, index) => (
                                    <Image
                                        key={index}
                                        source={imgSrc}
                                        style={{
                                            width: 120,
                                            height: 120,
                                            borderRadius: radii.md,
                                            marginRight: 12,
                                        }}
                                        contentFit='cover'
                                    />
                                ))}
                            </ScrollView>
                        </>
                    )}

                    <Text className='text-2xl font-jakarta-bold text-[#1A1C19] mb-4 mt-4'>
                        Diagnostics
                    </Text>

                    <View className='bg-[#EAF1E8] p-5 rounded-3xl shadow-sm shadow-black/5 mb-4 border border-[#F4F7F2]'>
                        <View className='flex-row items-center gap-3 mb-4'>
                            {disease?.hasDisease ?
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
                                Disease check
                            </Text>
                        </View>
                        {!disease ?
                            <Text className='font-vietnam text-[#1A1C19]/70'>
                                Not available for this saved scan.
                            </Text>
                        : disease.hasDisease ?
                            <>
                                {disease.blendedBase64 && (
                                    <Image
                                        source={{ uri: disease.blendedBase64 }}
                                        style={{
                                            width: '100%',
                                            aspectRatio: 1,
                                            borderRadius: radii.md,
                                            marginBottom: 16,
                                        }}
                                        contentFit='contain'
                                    />
                                )}
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
                                <Text className='font-vietnam text-[#1A1C19]/60 mt-2 text-sm'>
                                    About{' '}
                                    {Math.round(disease.severity * 100)}% of the
                                    image shows this pattern.
                                </Text>
                            </>
                        :   <Text className='font-vietnam text-[#1A1C19]/70'>
                                No significant disease markers detected.
                            </Text>
                        }
                    </View>

                    <View className='bg-[#EAF1E8] p-5 rounded-3xl shadow-sm shadow-black/5 mb-10 border border-[#F4F7F2]'>
                        <View className='flex-row items-center gap-3 mb-4'>
                            {pest && pest.confidenceScore >= PEST_CONFIDENCE ?
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
                                Pest check
                            </Text>
                        </View>
                        {!pest ?
                            <Text className='font-vietnam text-[#1A1C19]/70'>
                                Not available for this saved scan.
                            </Text>
                        : pest.confidenceScore >= PEST_CONFIDENCE ?
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
