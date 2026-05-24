import { useEffect, useRef, useState, useCallback } from 'react';
import {
    Text,
    View as RNView,
    Pressable,
    ActivityIndicator,
    Dimensions,
    StyleSheet,
} from 'react-native';
import {
    CameraView,
    useCameraPermissions,
    CameraType,
    FlashMode,
} from 'expo-camera';
import { Image } from 'expo-image';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { styled } from 'nativewind';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    X,
    Zap,
    ZapOff,
    SwitchCamera,
    Sparkles,
    AlertCircle,
    Check,
    RotateCcw,
    ScanLine,
} from 'lucide-react-native';
import { mlPipeline } from '../lib/mlPipeline';
import { saveScanResult } from '../lib/storage';

const View = styled(RNView);
const SCREEN_WIDTH = Dimensions.get('window').width;
const CROP_SIZE = SCREEN_WIDTH * 0.75;

type AIState = 'idle' | 'capturing' | 'reviewing' | 'analyzing' | 'complete';

interface PhotoData {
    uri: string;
    width: number;
    height: number;
}

export default function CameraScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<CameraType>('back');
    const [flash, setFlash] = useState<FlashMode>('off');

    const [aiState, setAiState] = useState<AIState>('idle');
    const [photoData, setPhotoData] = useState<PhotoData | null>(null);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [inferenceResult, setInferenceResult] = useState<{
        classIndex: number;
        confidenceScore: number;
    } | null>(null);

    const cameraRef = useRef<CameraView>(null);
    const bottomSheetRef = useRef<BottomSheet>(null);

    useEffect(() => {
        mlPipeline.init().catch((err) => {
            console.error(
                'Critical error: Failed to initialize AI pipeline',
                err
            );
        });
    }, []);

    const toggleFacing = () =>
        setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
    const toggleFlash = () =>
        setFlash((prev) => (prev === 'off' ? 'on' : 'off'));

    const handleCapture = useCallback(async () => {
        if (!cameraRef.current || aiState !== 'idle') return;

        try {
            setAiState('capturing');
            const photo = await cameraRef.current.takePictureAsync();

            if (photo) {
                setPhotoData({
                    uri: photo.uri,
                    width: photo.width,
                    height: photo.height,
                });
                setAiState('reviewing');
            } else {
                setAiState('idle');
            }
        } catch (error) {
            setAiState('idle');
        }
    }, [aiState]);

    const handleRetake = () => {
        setPhotoData(null);
        setProcessedImage(null);
        setAiState('idle');
    };

    const handleConfirmAndAnalyze = async () => {
        if (!photoData) return;

        try {
            setAiState('analyzing');
            bottomSheetRef.current?.expand();

            const minEdge = Math.min(photoData.width, photoData.height);
            const cropRatio = 224 / 256;
            const cropEdge = minEdge * cropRatio;

            const originX = (photoData.width - cropEdge) / 2;
            const originY = (photoData.height - cropEdge) / 2;

            const manipResult = await manipulateAsync(
                photoData.uri,
                [
                    {
                        crop: {
                            originX,
                            originY,
                            width: cropEdge,
                            height: cropEdge,
                        },
                    },
                    { resize: { width: 224, height: 224 } },
                ],
                { compress: 1, format: SaveFormat.JPEG, base64: true }
            );

            setProcessedImage(manipResult.uri);

            if (!manipResult.base64)
                throw new Error('Missing Base64 image data');

            const result = await mlPipeline.analyzePlant(manipResult.base64);
            await saveScanResult(
                result.classIndex,
                result.confidenceScore,
                photoData.uri
            );

            setInferenceResult(result);
            setAiState('complete');
        } catch (error) {
            console.error('AI Processing failed:', error);
            handleRetake();
        }
    };

    if (!permission) return <View className='flex-1 bg-[#1A1C19]' />;
    if (!permission.granted) {
        return (
            <View className='flex-1 bg-[#F4F7F2] items-center justify-center p-8 gap-6'>
                <View className='bg-[#84B026]/10 p-6 rounded-full'>
                    <AlertCircle
                        size={48}
                        color='#2D5A27'
                    />
                </View>
                <Text className='text-2xl font-jakarta-bold text-center text-[#1A1C19]'>
                    Camera Access Needed
                </Text>
                <Text className='font-vietnam text-center text-[#1A1C19]/70 leading-relaxed'>
                    FloraLens needs your camera to identify plants and detect
                    diseases securely on-device.
                </Text>
                <Pressable
                    onPress={requestPermission}
                    className='bg-[#2D5A27] px-8 py-4 rounded-full active:opacity-90 w-full'>
                    <Text className='font-jakarta-bold text-[#F4F7F2] text-center text-lg'>
                        Grant Permission
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => router.back()}
                    className='p-4'>
                    <Text className='font-vietnam text-[#2D5A27]'>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const ViewfinderOverlay = () => (
        <View
            style={StyleSheet.absoluteFill}
            className='pointer-events-none z-10'>
            <View className='flex-1 bg-black/40' />
            <View
                className='flex-row'
                style={{ height: CROP_SIZE }}>
                <View className='flex-1 bg-black/40' />
                <View
                    style={{ width: CROP_SIZE }}
                    className='border-2 border-white/70 justify-center items-center'>
                    <ScanLine
                        size={48}
                        color='rgba(255,255,255,0.3)'
                        strokeWidth={1}
                    />
                </View>
                <View className='flex-1 bg-black/40' />
            </View>
            <View className='flex-1 bg-black/40 items-center pt-8'>
                {aiState === 'idle' && (
                    <Text className='text-white font-vietnam bg-black/50 px-4 py-2 rounded-full'>
                        Frame the plant in the center
                    </Text>
                )}
            </View>
        </View>
    );

    return (
        <View className='flex-1 bg-black '>
            {aiState === 'idle' || aiState === 'capturing' ?
                <CameraView
                    ref={cameraRef}
                    style={{ flex: 1 }}
                    facing={facing}
                    flash={flash}
                    animateShutter={false}
                />
            :   <Image
                    source={{ uri: photoData?.uri }}
                    style={{ flex: 1 }}
                    contentFit='cover'
                />
            }

            <ViewfinderOverlay />

            <View
                className='absolute top-0 w-full flex-row justify-between items-center px-6 z-20'
                style={{ paddingTop: Math.max(insets.top, 16) }}>
                <Pressable
                    onPress={() => router.back()}
                    disabled={aiState === 'analyzing'}
                    className='bg-black/40 p-3 rounded-full active:opacity-80'>
                    <X
                        size={24}
                        color='white'
                    />
                </Pressable>

                {aiState === 'idle' && (
                    <View className='flex-row gap-4'>
                        <Pressable
                            onPress={toggleFlash}
                            className='bg-black/40 p-3 rounded-full active:opacity-80'>
                            {flash === 'on' ?
                                <Zap
                                    size={24}
                                    color='#84B026'
                                    fill='#84B026'
                                />
                            :   <ZapOff
                                    size={24}
                                    color='white'
                                />
                            }
                        </Pressable>
                        <Pressable
                            onPress={toggleFacing}
                            className='bg-black/40 p-3 rounded-full active:opacity-80'>
                            <SwitchCamera
                                size={24}
                                color='white'
                            />
                        </Pressable>
                    </View>
                )}
            </View>

            <View className='absolute bottom-0 w-full pb-16 px-8 items-center flex-row justify-center z-20'>
                {aiState === 'idle' || aiState === 'capturing' ?
                    <Pressable
                        onPress={handleCapture}
                        disabled={aiState !== 'idle'}
                        className={`h-20 w-20 rounded-full border-4 border-white items-center justify-center ${aiState !== 'idle' ? 'opacity-50' : 'active:opacity-80'}`}>
                        <View className='h-16 w-16 bg-[#84B026] rounded-full' />
                    </Pressable>
                : aiState === 'reviewing' ?
                    <View className='w-full flex-row justify-between items-center px-4'>
                        <Pressable
                            onPress={handleRetake}
                            className='bg-black/60 p-4 rounded-full active:opacity-80 flex-row items-center gap-2'>
                            <RotateCcw
                                size={24}
                                color='white'
                            />
                        </Pressable>
                        <Pressable
                            onPress={handleConfirmAndAnalyze}
                            className='bg-[#84B026] px-8 py-4 rounded-full active:opacity-90 flex-row items-center gap-2 shadow-lg shadow-black/50'>
                            <Check
                                size={24}
                                color='white'
                                strokeWidth={3}
                            />
                            <Text className='font-jakarta-bold text-white text-lg'>
                                Analyze
                            </Text>
                        </Pressable>
                    </View>
                :   null}
            </View>

            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={['35%']}
                enablePanDownToClose={aiState === 'complete'}
                backgroundStyle={{
                    backgroundColor: '#F4F7F2',
                    borderRadius: 32,
                }}>
                <BottomSheetView className='flex-1 items-center justify-center p-8 gap-4'>
                    {aiState === 'analyzing' ?
                        <>
                            <View className='bg-[#2D5A27]/10 p-4 rounded-full mb-2'>
                                <ActivityIndicator
                                    size='large'
                                    color='#2D5A27'
                                />
                            </View>
                            <Text className='text-2xl font-jakarta-bold text-[#1A1C19]'>
                                Analyzing Image...
                            </Text>
                            <Text className='font-vietnam text-[#1A1C19]/70 text-center'>
                                Preparing tensor array and running local models.
                            </Text>
                        </>
                    : aiState === 'complete' ?
                        <>
                            <View className='flex-row gap-4 mb-2'>
                                {processedImage && (
                                    <Image
                                        source={{ uri: processedImage }}
                                        style={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: 16,
                                        }}
                                    />
                                )}
                                <View className='bg-[#84B026]/20 h-16 w-16 items-center justify-center rounded-2xl'>
                                    <Sparkles
                                        size={32}
                                        color='#2D5A27'
                                    />
                                </View>
                            </View>
                            <Text className='text-2xl font-jakarta-bold text-[#1A1C19]'>
                                Analysis Complete!
                            </Text>
                            <Pressable
                                className='bg-[#2D5A27] px-8 py-4 rounded-full mt-2 w-full active:opacity-90'
                                onPress={() => {
                                    bottomSheetRef.current?.close();
                                    if (inferenceResult) {
                                        router.push({
                                            pathname: '/result/[id]',
                                            params: {
                                                id: inferenceResult.classIndex.toString(),
                                                imageUri: photoData?.uri || '',
                                                confidence:
                                                    inferenceResult.confidenceScore.toString(),
                                            },
                                        });
                                    }
                                }}>
                                <Text className='font-jakarta-bold text-center text-[#F4F7F2] text-lg'>
                                    View Results
                                </Text>
                            </Pressable>
                        </>
                    :   null}
                </BottomSheetView>
            </BottomSheet>
        </View>
    );
}
