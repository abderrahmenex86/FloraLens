import { useEffect, useState } from 'react';
import {
    Text,
    View as RNView,
    Pressable,
    ActivityIndicator,
    ToastAndroid,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
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
import { storage, StorageKeys } from '../lib/storage';

const View = styled(RNView);

export default function ScanScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [aiState, setAiState] = useState<'idle' | 'reviewing' | 'analyzing'>(
        'idle'
    );
    const [photoUri, setPhotoUri] = useState<string | null>(null);

    useEffect(() => {
        mlPipeline.init().then(() => mlPipeline.initHealthModels());
    }, []);

    const pickImage = async (useCamera: boolean) => {
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
    };

    const runFullAnalysis = async () => {
        if (!photoUri) return;
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

            storage.set(
                StorageKeys.CURRENT_SESSION,
                JSON.stringify({
                    originalUri: photoUri,
                    plant: plantResult,
                    pest: pestResult,
                    disease: diseaseResult,
                })
            );

            router.replace('/result/session');
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
            <View
                className='absolute top-0 w-full flex-row justify-between px-6 z-20'
                style={{ paddingTop: Math.max(insets.top, 16) }}>
                <Pressable
                    onPress={() => router.back()}
                    disabled={aiState === 'analyzing'}
                    className='bg-white/20 p-3 rounded-full'>
                    <X
                        size={24}
                        color='white'
                    />
                </Pressable>
            </View>

            {aiState === 'idle' ?
                <View className='flex-1 items-center justify-center p-8 gap-6'>
                    <View className='bg-[#84B026]/20 p-8 rounded-full mb-4'>
                        <Sparkles
                            size={64}
                            color='#84B026'
                        />
                    </View>
                    <Text className='text-4xl font-jakarta-bold text-white text-center'>
                        Analyze a Plant
                    </Text>
                    <Pressable
                        onPress={() => pickImage(true)}
                        className='w-full bg-[#2D5A27] p-5 rounded-[24px] flex-row items-center justify-center gap-3'>
                        <CameraIcon
                            size={24}
                            color='white'
                        />
                        <Text className='font-jakarta-bold text-white text-lg'>
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
                <View className='flex-1 items-center justify-center p-8 gap-6 bg-[#F4F7F2]'>
                    <ActivityIndicator
                        size={64}
                        color='#2D5A27'
                    />
                    <Text className='text-3xl font-jakarta-bold text-[#1A1C19]'>
                        Running Diagnostics
                    </Text>
                    <Text className='font-vietnam text-[#1A1C19]/70 text-center'>
                        Classifying species, pests, and segmenting diseases
                        locally.
                    </Text>
                </View>
            :   <View className='flex-1 justify-center bg-black'>
                    <Image
                        source={{ uri: photoUri }}
                        style={{ width: '100%', aspectRatio: 1 }}
                        contentFit='cover'
                    />
                    <View className='absolute bottom-0 w-full pb-16 px-8 flex-row justify-between items-center'>
                        <Pressable
                            onPress={() => setAiState('idle')}
                            className='bg-black/60 p-5 rounded-full'>
                            <RotateCcw
                                size={28}
                                color='white'
                            />
                        </Pressable>
                        <Pressable
                            onPress={runFullAnalysis}
                            className='bg-[#84B026] px-8 py-5 rounded-full flex-row items-center gap-3 shadow-lg shadow-black/50'>
                            <Check
                                size={28}
                                color='white'
                                strokeWidth={3}
                            />
                            <Text className='font-jakarta-bold text-white text-xl'>
                                Analyze
                            </Text>
                        </Pressable>
                    </View>
                </View>
            }
        </View>
    );
}
