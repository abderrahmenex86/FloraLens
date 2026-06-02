import { useState, useCallback } from 'react';
import {
    Text,
    View as RNView,
    Pressable,
    ScrollView,
    Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { styled } from 'nativewind';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { Camera, ScanSearch, ChevronRight, Trash2 } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import {
    getScanHistory,
    removeFromHistory,
    ScanRecord,
} from '../../lib/storage';
import { PLANT_CLASSES } from '../../lib/plantClasses';
import { colors, radii, sizes } from '@/theme';

const View = styled(RNView);

export default function Home() {
    const router = useRouter();
    const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);

    useFocusEffect(useCallback(() => setRecentScans(getScanHistory()), []));

    const handleDelete = (id: string) => {
        removeFromHistory(id);
        setRecentScans((prev) => prev.filter((s) => s.id !== id));
    };

    const renderRightActions = (id: string) => (
        <Pressable
            onPress={() => handleDelete(id)}
            className='bg-red-500 justify-center items-end w-24 rounded-3xl mb-3 pr-6'>
            <Trash2
                size={24}
                color='white'
            />
        </Pressable>
    );

    return (
        <Screen className='gap-8'>
            <View className='flex gap-2'>
                <Text className='text-5xl font-jakarta-bold text-[#1A1C19]'>
                    FloraLens
                </Text>
            </View>

            <Link
                href='/camera'
                asChild>
                <Pressable className='flex-row items-center justify-between bg-[#2D5A27] rounded-[32px] p-6 shadow-sm'>
                    <View className='flex-1 gap-2'>
                        <Text className='text-2xl font-jakarta-bold text-[#F4F7F2]'>
                            Identify Plant
                        </Text>
                    </View>
                    <View className='bg-[#F4F7F2]/20 p-5 rounded-full'>
                        <Camera
                            size={32}
                            color={colors.background}
                        />
                    </View>
                </Pressable>
            </Link>

            <View className='flex-1 gap-4'>
                <Text className='text-2xl font-jakarta-bold text-[#1A1C19]'>
                    Recent Scans (Swipe left)
                </Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {recentScans.length === 0 ?
                        <EmptyState
                            icon={ScanSearch}
                            title='No history'
                            description='Scans appear here.'
                        />
                    :   recentScans.map((scan) => (
                            <Swipeable
                                key={scan.id}
                                renderRightActions={() =>
                                    renderRightActions(scan.id)
                                }>
                                <View className='flex-row items-center bg-white p-4 rounded-3xl shadow-sm mb-3'>
                                    <Image
                                        source={{ uri: scan.imageUri }}
                                        style={{
                                            width: sizes.thumbnail,
                                            height: sizes.thumbnail,
                                            borderRadius: radii.md,
                                        }}
                                    />
                                    <View className='flex-1 ml-4 justify-center'>
                                        <Text className='font-jakarta-bold text-[#1A1C19]'>
                                            {
                                                PLANT_CLASSES[scan.classIndex]
                                                    ?.name
                                            }
                                        </Text>
                                    </View>
                                </View>
                            </Swipeable>
                        ))
                    }
                </ScrollView>
            </View>
        </Screen>
    );
}
