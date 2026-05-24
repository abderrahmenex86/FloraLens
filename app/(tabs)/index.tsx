import { useState, useCallback } from 'react';
import { Text, View as RNView, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { styled } from 'nativewind';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { Camera, ScanSearch, ChevronRight } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { EmptyState } from '../../components/EmptyState';
import { getScanHistory, ScanRecord } from '../../lib/storage';
import { PLANT_CLASSES } from '../../lib/plantClasses';

const View = styled(RNView);

export default function Home() {
    const router = useRouter();
    const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);

    useFocusEffect(
        useCallback(() => {
            const history = getScanHistory();
            setRecentScans(history);
        }, [])
    );

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Screen className='gap-8'>
            <View className='flex gap-2'>
                <Text className='text-5xl font-jakarta-bold text-[#1A1C19]'>
                    FloraLens
                </Text>
                <Text className='text-lg font-vietnam text-[#2D5A27]'>
                    Welcome Back!
                </Text>
            </View>

            <Link
                href='/camera'
                asChild>
                <Pressable className='flex-row items-center justify-between bg-[#2D5A27] rounded-4xl p-6 shadow-sm active:opacity-90'>
                    <View className='flex-1 gap-2'>
                        <Text className='text-2xl font-jakarta-bold text-[#F4F7F2]'>
                            Identify Plant
                        </Text>
                        <Text className='font-vietnam text-[#F4F7F2]/80 text-sm pr-4 leading-relaxed'>
                            Take a photo to detect plants, pests, and diseases
                            offline.
                        </Text>
                    </View>
                    <View className='bg-[#F4F7F2]/20 p-5 rounded-full'>
                        <Camera
                            size={32}
                            color='#F4F7F2'
                            strokeWidth={1.5}
                        />
                    </View>
                </Pressable>
            </Link>

            {/* Recent Scans Section */}
            <View className='flex-1 gap-4'>
                <Text className='text-2xl font-jakarta-bold text-[#1A1C19]'>
                    Recent Scans
                </Text>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20, gap: 12 }}>
                    {recentScans.length === 0 ?
                        <EmptyState
                            icon={ScanSearch}
                            title='No recent history'
                            description='Your on-device scan history will appear here securely.'
                        />
                    :   recentScans.map((scan) => {
                            const plantInfo = PLANT_CLASSES[
                                scan.classIndex
                            ] || {
                                name: 'Unknown Plant',
                                scientific: 'Unknown',
                            };

                            return (
                                <Pressable
                                    key={scan.id}
                                    onPress={() => {
                                        router.push({
                                            pathname: '/result/[id]',
                                            params: {
                                                id: scan.classIndex.toString(),
                                                imageUri: scan.imageUri,
                                                confidence:
                                                    scan.confidence.toString(),
                                            },
                                        });
                                    }}
                                    className='flex-row items-center bg-white p-4 rounded-3xl shadow-sm shadow-black/5 active:opacity-80'>
                                    <Image
                                        source={{ uri: scan.imageUri }}
                                        style={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: 16,
                                        }}
                                        contentFit='cover'
                                    />
                                    <View className='flex-1 ml-4 justify-center'>
                                        <Text
                                            className='font-jakarta-bold text-[#1A1C19] text-lg mb-0.5'
                                            numberOfLines={1}>
                                            {plantInfo.name}
                                        </Text>
                                        <Text className='font-vietnam text-[#1A1C19]/60 text-sm'>
                                            {formatDate(scan.timestamp)} •{' '}
                                            {(scan.confidence * 100).toFixed(0)}
                                            % Match
                                        </Text>
                                    </View>
                                    <View className='bg-[#F4F7F2] p-2 rounded-full'>
                                        <ChevronRight
                                            size={20}
                                            color='#2D5A27'
                                        />
                                    </View>
                                </Pressable>
                            );
                        })
                    }
                </ScrollView>
            </View>
        </Screen>
    );
}
