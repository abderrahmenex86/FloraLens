import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    ToastAndroid,
    View as RNView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { manipulateAsync } from 'expo-image-manipulator';
import { styled } from 'nativewind';
import { useRouter } from 'expo-router';
import {
    Camera as CameraIcon,
    Check,
    Image as ImageIcon,
    RotateCcw,
    SwitchCamera,
    X,
} from 'lucide-react-native';
import { mlPipeline } from '../lib/mlPipeline';
import { setPendingPhoto } from '../lib/photoSelection';
import { saveScan } from '../lib/storage';
import { useAppTheme, withAlpha } from '@/lib/appTheme';

const View = styled(RNView);

type ScanState = 'camera' | 'reviewing' | 'analyzing';

export default function ScanScreen() {
    const { colors } = useAppTheme();
    const router = useRouter();

    const cameraRef = useRef<CameraView>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<'back' | 'front'>('back');
    const [capturing, setCapturing] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);

    const [state, setState] = useState<ScanState>('camera');
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

    const pickFromGallery = useCallback(() => {
        setPendingPhoto((uri) => {
            setPhotoUri(uri);
            setState('reviewing');
        });
        router.push('/photo-picker');
    }, [router]);

    const takePhoto = useCallback(async () => {
        if (!cameraRef.current || capturing || !cameraReady) return;
        setCapturing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 1,
            });
            if (photo?.uri) {
                setPhotoUri(photo.uri);
                setState('reviewing');
            }
        } catch (error) {
            console.error('Capture failed:', error);
            ToastAndroid.show(
                'The photo could not be taken.',
                ToastAndroid.SHORT,
            );
        } finally {
            setCapturing(false);
        }
    }, [capturing, cameraReady]);

    const runFullAnalysis = async () => {
        if (!photoUri) return;
        if (!modelsReady) {
            ToastAndroid.show(
                initError ?? 'Models are still loading. Try again in a moment.',
                ToastAndroid.SHORT,
            );
            return;
        }
        try {
            setState('analyzing');

            const [manip224, manip128] = await Promise.all([
                manipulateAsync(
                    photoUri,
                    [{ resize: { width: 224, height: 224 } }],
                    { compress: 1, base64: true },
                ),
                manipulateAsync(
                    photoUri,
                    [{ resize: { width: 128, height: 128 } }],
                    { compress: 1, base64: true },
                ),
            ]);

            // Reject dark and blank frames before the classifier can be
            // confidently wrong about them.
            const gate = mlPipeline.checkPhoto(manip224.base64!);
            if (!gate.ok) {
                setState('reviewing');
                ToastAndroid.show(
                    gate.message ?? 'No plant detected in that photo.',
                    ToastAndroid.LONG,
                );
                return;
            }

            const presence = await mlPipeline.checkPlantPresence(
                manip128.base64!,
            );
            if (!presence.isPlant) {
                setState('reviewing');
                ToastAndroid.show(
                    'No plant detected in that photo. Point the camera at a leaf.',
                    ToastAndroid.LONG,
                );
                return;
            }

            const [plantResult, pestResult] = await Promise.all([
                mlPipeline.analyzePlant(manip224.base64!),
                mlPipeline.analyzePest(manip224.base64!),
            ]);

            const record = saveScan({
                imageUri: photoUri,
                diagnosis: {
                    plant: plantResult.predictions,
                    plantStats: plantResult.stats,
                    pest: pestResult.predictions[0],
                    pestStats: pestResult.stats,
                },
            });

            router.replace(`/result/${record.id}`);
        } catch (error) {
            console.error('Analysis failed:', error);
            setState('reviewing');
            ToastAndroid.show(
                'Analysis failed. Try again.',
                ToastAndroid.SHORT,
            );
        }
    };

    const close = () => router.back();

    if (permission == null) {
        return (
            <View className='flex-1 items-center justify-center bg-[#1A1C19]'>
                <ActivityIndicator
                    size='large'
                    color={colors.primary}
                />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View className='flex-1 items-center justify-center gap-5 bg-[#1A1C19] px-8'>
                <View
                    className='rounded-full p-6'
                    style={{
                        backgroundColor: withAlpha(colors.primary, '33'),
                    }}>
                    <CameraIcon
                        size={40}
                        color={colors.accent}
                    />
                </View>
                <Text className='text-center font-jakarta-bold text-2xl text-white'>
                    Camera access is needed
                </Text>
                <Text className='text-center font-vietnam text-white/70'>
                    FloraLens uses the camera to photograph the leaf. Photos
                    stay on this device.
                </Text>
                <Pressable
                    onPress={() => requestPermission()}
                    accessibilityRole='button'
                    className='w-full items-center rounded-2xl py-4'
                    style={{ backgroundColor: colors.primary }}>
                    <Text
                        className='font-jakarta-bold'
                        style={{ color: colors.onPrimary }}>
                        Allow camera
                    </Text>
                </Pressable>
                <Pressable
                    onPress={pickFromGallery}
                    accessibilityRole='button'
                    className='w-full items-center rounded-2xl border border-white/20 py-4'>
                    <Text className='font-jakarta-bold text-white'>
                        Choose from gallery
                    </Text>
                </Pressable>
                <Pressable
                    onPress={close}
                    accessibilityRole='button'>
                    <Text className='font-vietnam text-white/60'>
                        Not now
                    </Text>
                </Pressable>
            </View>
        );
    }

    if (state === 'analyzing') {
        return (
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
                    Classifying species, pests, and segmenting diseases locally.
                </Text>
            </View>
        );
    }

    if (state === 'reviewing') {
        return (
            <View className='flex-1 justify-center bg-black'>
                <Image
                    source={{ uri: photoUri ?? '' }}
                    style={{ width: '100%', aspectRatio: 1 }}
                    contentFit='cover'
                />
                <View className='absolute bottom-0 w-full flex-row items-center justify-between px-8 pb-16'>
                    <Pressable
                        onPress={() => {
                            setPhotoUri(null);
                            setCameraReady(false);
                            setState('camera');
                        }}
                        accessibilityRole='button'
                        accessibilityLabel='Retake photo'
                        className='rounded-full bg-black/60 p-5'>
                        <RotateCcw
                            size={28}
                            color='white'
                        />
                    </Pressable>
                    <View className='flex-row items-center gap-3'>
                        <Pressable
                            onPress={pickFromGallery}
                            accessibilityRole='button'
                            accessibilityLabel='Choose another photo from the gallery'
                            className='rounded-full bg-black/60 p-5'>
                            <ImageIcon
                                size={26}
                                color='white'
                            />
                        </Pressable>
                        <Pressable
                            onPress={runFullAnalysis}
                            accessibilityRole='button'
                            accessibilityLabel='Analyze photo'
                            className='flex-row items-center gap-3 rounded-full px-8 py-5 shadow-lg shadow-black/50'
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
        );
    }

    return (
        <View className='flex-1 bg-black'>
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing={facing}
                onCameraReady={() => setCameraReady(true)}
            />

            {!cameraReady ?
                <View className='absolute inset-0 items-center justify-center'>
                    <ActivityIndicator
                        size='large'
                        color='white'
                    />
                </View>
            :   null}

            <View className='absolute left-0 right-0 top-0 flex-row items-center justify-between px-6 pt-14'>
                <Pressable
                    onPress={close}
                    accessibilityRole='button'
                    accessibilityLabel='Close camera'
                    className='rounded-full bg-black/50 p-3'>
                    <X
                        size={24}
                        color='white'
                    />
                </Pressable>
                <Text className='font-vietnam-medium text-sm text-white/80'>
                    Frame one leaf
                </Text>
                <Pressable
                    onPress={() =>
                        setFacing((current) =>
                            current === 'back' ? 'front' : 'back',
                        )
                    }
                    accessibilityRole='button'
                    accessibilityLabel='Switch camera'
                    className='rounded-full bg-black/50 p-3'>
                    <SwitchCamera
                        size={24}
                        color='white'
                    />
                </Pressable>
            </View>

            <View className='absolute bottom-0 left-0 right-0 flex-row items-center justify-between px-10 pb-16'>
                <Pressable
                    onPress={pickFromGallery}
                    accessibilityRole='button'
                    accessibilityLabel='Choose photo from gallery'
                    className='rounded-2xl bg-black/50 p-3'>
                    <ImageIcon
                        size={26}
                        color='white'
                    />
                </Pressable>

                <Pressable
                    onPress={takePhoto}
                    disabled={capturing}
                    accessibilityRole='button'
                    accessibilityLabel='Take photo'
                    className='items-center justify-center rounded-full border-4 border-white/80'
                    style={{
                        width: 84,
                        height: 84,
                        opacity: capturing || !cameraReady ? 0.5 : 1,
                    }}>
                    <View
                        className='rounded-full'
                        style={{
                            width: 64,
                            height: 64,
                            backgroundColor: 'white',
                        }}
                    />
                </Pressable>

                <View style={{ width: 50 }} />
            </View>
        </View>
    );
}
