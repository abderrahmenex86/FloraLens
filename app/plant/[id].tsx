import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    BookmarkCheck,
    BookmarkPlus,
    Droplets,
    Sun,
} from 'lucide-react-native';
import { styled } from 'nativewind';
import { useState } from 'react';
import {
    Dimensions,
    Pressable,
    View as RNView,
    ScrollView,
    Text,
    ToastAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useAppTheme, withAlpha } from '@/lib/appTheme';
import { spacing } from '@/theme';
import { PLANT_CLASSES } from '../../lib/plantClasses';
import { getPlantImages } from '../../lib/plantAssets';
import { getGardenPlants, savePlantToGarden } from '../../lib/storage';

const View = styled(RNView);
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function PlantProfileScreen() {
    const { colors } = useAppTheme();
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const classIndex = Number(id);
    const plantInfo = PLANT_CLASSES[classIndex];

    const [isSaved, setIsSaved] = useState(() =>
        getGardenPlants().some((p) => p.classIndex === classIndex),
    );

    if (!plantInfo) {
        return (
            <View
                className='flex-1 items-center justify-center gap-4 p-8'
                style={{ backgroundColor: colors.background }}>
                <Text
                    className='text-center font-jakarta-bold text-2xl'
                    style={{ color: colors.ink }}>
                    This plant is not in the library
                </Text>
                <Pressable
                    onPress={() => router.replace('/library')}
                    accessibilityRole='button'
                    className='rounded-2xl px-6 py-4'
                    style={{ backgroundColor: colors.primary }}>
                    <Text
                        className='font-jakarta-bold'
                        style={{ color: colors.onPrimary }}>
                        Browse the library
                    </Text>
                </Pressable>
            </View>
        );
    }

    const images = getPlantImages(classIndex);

    const handleSave = () => {
        if (isSaved) return;
        const added = savePlantToGarden(classIndex);
        if (added) {
            setIsSaved(true);
            ToastAndroid.show('Added to Garden!', ToastAndroid.SHORT);
        }
    };

    return (
        <View
            className='flex-1'
            style={{ backgroundColor: colors.background }}>
            <StatusBar style='light' />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: spacing.scrollBottom }}>
                <View
                    className='relative h-[420px] w-full'
                    style={{ backgroundColor: colors.primary }}>
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
                    :   <View
                            className='flex-1 items-center justify-center'
                            style={{ backgroundColor: colors.primary }}>
                            <Text className='font-jakarta-bold text-white/50 text-xl'>
                                No Image Available
                            </Text>
                        </View>
                    }

                    <View className='absolute top-0 w-full h-32 bg-black/30' />
                    <Pressable
                        onPress={() => router.back()}
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

                <View
                    className='-mt-10 flex-1 rounded-t-[40px] px-6 p-8'
                    style={{ backgroundColor: colors.background }}>
                    <View className='flex-row justify-between items-start mb-6'>
                        <View className='flex-1 pr-4'>
                            <Text
                                className='mb-1 font-jakarta-extrabold text-4xl'
                                style={{ color: colors.ink }}>
                                {plantInfo.name}
                            </Text>
                            <Text
                                className='font-vietnam-medium text-lg italic'
                                style={{ color: colors.primary }}>
                                {plantInfo.scientific}
                            </Text>
                        </View>
                        <Pressable
                            onPress={handleSave}
                            accessibilityRole='button'
                            accessibilityLabel={isSaved ? 'Saved to garden' : 'Save to garden'}
                            className='rounded-full p-4'
                            style={{
                                backgroundColor:
                                    isSaved ?
                                        colors.primary
                                    :   withAlpha(colors.accent, '1A'),
                            }}>
                            {isSaved ?
                                <BookmarkCheck
                                    size={28}
                                    color={colors.onPrimary}
                                />
                            :   <BookmarkPlus
                                    size={28}
                                    color={colors.primary}
                                />
                            }
                        </Pressable>
                    </View>

                    <Text
                        className='mb-4 font-jakarta-bold text-2xl'
                        style={{ color: colors.ink }}>
                        Care Guide
                    </Text>

                    <View
                        className='gap-4 rounded-3xl p-6'
                        style={{ backgroundColor: colors.surface }}>
                        <View className='flex-row items-center gap-4'>
                            <View
                                className='rounded-full p-3'
                                style={{ backgroundColor: colors.surfaceHigh }}>
                                <Sun
                                    size={24}
                                    color={colors.primary}
                                />
                            </View>
                            <Text
                                className='flex-1 font-vietnam leading-relaxed'
                                style={{ color: colors.ink }}>
                                {plantInfo.care || 'Provide adequate sunlight.'}
                            </Text>
                        </View>
                        <View
                            className='my-2 h-px w-full'
                            style={{ backgroundColor: colors.outline }}
                        />
                        <View className='flex-row items-center gap-4'>
                            <View
                                className='rounded-full p-3'
                                style={{ backgroundColor: colors.surfaceHigh }}>
                                <Droplets
                                    size={24}
                                    color={colors.primary}
                                />
                            </View>
                            <Text
                                className='flex-1 font-vietnam leading-relaxed'
                                style={{ color: colors.ink }}>
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
