import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Text,
    View as RNView,
    Pressable,
    ActivityIndicator,
    ToastAndroid,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync } from 'expo-image-manipulator';
import { styled } from 'nativewind';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    X,
    Sparkles,
    Check,
    RotateCcw,
    Camera as CameraIcon,
    Image as ImageIcon,
} from 'lucide-react-native';
import { mlPipeline } from '../lib/mlPipeline';
import { saveScan } from '../lib/storage';
import { useAppTheme, withAlpha } from '@/lib/appTheme';
import { StatusBar } from 'expo-status-bar';

const View = styled(RNView);

export default function ScanScreen() {
    const { colors } = useAppTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [aiState, setAiState] = useState<'idle' | 'reviewing' | 'analyzing'>(
        'idle'
    );
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [modelsReady, setModelsReady] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        mlPipeline
            .init()
            .then(() => mlPipeline.initHealthModels())
            .then(() => mounted && setModelsReady(true))
            .catch((error) => {
                console.error('Model init failed:', error);
                if (mounted) setInitError('Models could not be loaded.');
            });
        return () => {
            mounted = false;
        };
    }, []);

    const pickImage = useCallback(async (useCamera: boolean) => {
        try {
            const result =
                useCamera ?
                    await ImagePicker.launchCameraAsync({
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 1,
                    })
                :   await ImagePicker.launchImageLibraryAsync({
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 1,
                    });

            if (!result.canceled) {
                setPhotoUri(result.assets[0].uri);
                setAiState('reviewing');
            }
        } catch (error) {
            console.error('Image picker failed:', error);
            ToastAndroid.show(
                'The camera could not be opened.',
                ToastAndroid.SHORT
            );
        }
    }, []);

    // Tapping Scan should land in the system camera, with its own gallery
    // shortcut available from the preview. If the user cancels we fall back to
    // the picker screen.
    const autoOpened = useRef(false);
    useEffect(() => {
        if (autoOpened.current) return;
        autoOpened.current = true;
        const timer = setTimeout(() => {
            pickImage(true);
        }, 250);
        return () => clearTimeout(timer);
    }, [pickImage]);

    const runFullAnalysis = async () => {
        if (!photoUri) return;
        if (!modelsReady) {
            ToastAndroid.show(
                initError ?? 'Models are still loading. Try again in a moment.',
                ToastAndroid.SHORT
            );
            return;
        }
        try {
            setAiState('analyzing');

            const [manip224, manip520] = await Promise.all([
                manipulateAsync(
                    photoUri,
                    [{ resize: { width: 224, height: 224 } }],
                    { compress: 1, base64: true }
                ),
                manipulateAsync(
                    photoUri,
                    [{ resize: { width: 520, height: 520 } }],
                    { compress: 1, base64: true }
                ),
            ]);

            const [plantResult, pestResult, diseaseResult] = await Promise.all([
                mlPipeline.analyzePlant(manip224.base64!),
                mlPipeline.analyzePest(manip224.base64!),
                mlPipeline.analyzeDisease(manip520.base64!),
            ]);

            const record = saveScan({
                imageUri: photoUri,
                diagnosis: {
                    plant: plantResult.predictions,
                    plantStats: plantResult.stats,
                    pest: pestResult.predictions[0],
                    pestStats: pestResult.stats,
                    disease: diseaseResult,
                },
            });

            router.replace(`/result/${record.id}`);
        } catch (error) {
            console.error('Analysis failed:', error);
            setAiState('reviewing');
            ToastAndroid.show(
                'Analysis failed. Try again.',
                ToastAndroid.SHORT
            );
        }
    };

    return (
        <View className='flex-1 bg-[#1A1C19]'>
            <StatusBar style='light' />
            <View
                className='absolute top-0 w-full flex-row justify-between px-6 z-20'
                style={{ paddingTop: Math.max(insets.top, 16) }}>
                <Pressable
                    onPress={() => router.back()}
                    disabled={aiState === 'analyzing'}
                    accessibilityRole='button'
                    accessibilityLabel='Close scanner'
                    className='bg-white/20 p-3 rounded-full'>
                    <X
                        size={24}
                        color='white'
                    />
                </Pressable>
            </View>

            {aiState === 'idle' ?
                <View className='flex-1 items-center justify-center p-8 gap-6'>
                    <View
                        className='p-8 rounded-full mb-4'
                        style={{
                            backgroundColor: withAlpha(colors.primary, '33'),
                        }}>
                        <Sparkles
                            size={64}
                            color={colors.accent}
                        />
                    </View>
                    <Text className='text-4xl font-jakarta-bold text-white text-center'>
                        Analyze a Plant
                    </Text>
                    <Pressable
                        onPress={() => pickImage(true)}
                        className='w-full p-5 rounded-[24px] flex-row items-center justify-center gap-3'
                        style={{ backgroundColor: colors.primary }}>
                        <CameraIcon
                            size={24}
                            color={colors.onPrimary}
                        />
                        <Text
                            className='font-jakarta-bold text-lg'
                            style={{ color: colors.onPrimary }}>
                            Open Camera
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => pickImage(false)}
                        className='w-full bg-white/10 border border-white/20 p-5 rounded-[24px] flex-row items-center justify-center gap-3'>
                        <ImageIcon
                            size={24}
                            color='white'
                        />
                        <Text className='font-jakarta-bold text-white text-lg'>
                            Choose from Gallery
                        </Text>
                    </Pressable>
                </View>
            : aiState === 'analyzing' ?
                <View
                    className='flex-1 items-center justify-center gap-6 p-8'
                    style={{ backgroundColor: colors.background }}>
                    <ActivityIndicator
                        size='large'
                        color={colors.primary}
                    />
                    <Text
                        className='font-jakarta-bold text-3xl'
                        style={{ color: colors.ink }}>
                        Running Diagnostics
                    </Text>
                    <Text
                        className='text-center font-vietnam'
                        style={{ color: colors.onSurfaceVariant }}>
                        Classifying species, pests, and segmenting diseases
                        locally.
                    </Text>
                </View>
            :   <View className='flex-1 justify-center bg-black'>
                    <Image
                        source={{ uri: photoUri ?? '' }}
                        style={{ width: '100%', aspectRatio: 1 }}
                        contentFit='cover'
                    />
                    <View className='absolute bottom-0 w-full pb-16 px-8 flex-row justify-between items-center'>
                        <Pressable
                            onPress={() => {
                                setAiState('idle');
                                setPhotoUri(null);
                                pickImage(true);
                            }}
                            accessibilityRole='button'
                            accessibilityLabel='Retake photo'
                            className='bg-black/60 p-5 rounded-full'>
                            <RotateCcw
                                size={28}
                                color='white'
                            />
                        </Pressable>
                        <View className='flex-row items-center gap-3'>
                            <Pressable
                                onPress={() => pickImage(false)}
                                accessibilityRole='button'
                                accessibilityLabel='Choose another photo from the gallery'
                                className='bg-black/60 p-5 rounded-full'>
                                <ImageIcon
                                    size={26}
                                    color='white'
                                />
                            </Pressable>
                            <Pressable
                                onPress={runFullAnalysis}
                                accessibilityRole='button'
                                accessibilityLabel='Analyze photo'
                                className='px-8 py-5 rounded-full flex-row items-center gap-3 shadow-lg shadow-black/50'
                                style={{ backgroundColor: colors.accent }}>
                            <Check
                                size={28}
                                color={colors.onAccent}
                                strokeWidth={3}
                            />
                            <Text
                                className='font-jakarta-bold text-xl'
                                style={{ color: colors.onAccent }}>
                                Analyze
                            </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            }
        </View>
    );
}
