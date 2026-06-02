import { useState, useMemo } from 'react';
import {
    Text,
    View as RNView,
    TextInput,
    FlatList,
    Pressable,
} from 'react-native';
import { styled } from 'nativewind';
import { Search, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Screen } from '../../components/Screen';
import { PLANT_CLASSES } from '../../lib/plantClasses';
import { PLANT_IMAGES } from '../../lib/plantImages';
import { colors, radii, sizes } from '@/theme';

const View = styled(RNView);

const ALL_PLANTS = Object.entries(PLANT_CLASSES).map(([id, data]) => ({
    id: Number(id),
    ...data,
}));

ALL_PLANTS.sort((a, b) => a.name.localeCompare(b.name));

export default function Library() {
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const filteredPlants = useMemo(() => {
        if (!searchQuery) return ALL_PLANTS;
        const lowerQ = searchQuery.toLowerCase();
        return ALL_PLANTS.filter(
            (p) =>
                p.name.toLowerCase().includes(lowerQ) ||
                p.scientific.toLowerCase().includes(lowerQ)
        );
    }, [searchQuery]);

    const renderItem = ({ item }: { item: (typeof ALL_PLANTS)[0] }) => {
        const coverImage =
            (PLANT_IMAGES[item.id] && PLANT_IMAGES[item.id][0]) || null;

        return (
            <Pressable
                onPress={() => router.push(`/plant/${item.id}`)}
                className='flex-row items-center bg-white p-4 rounded-3xl shadow-sm shadow-black/5 mb-3 active:opacity-80'>
                {coverImage ?
                    <Image
                        source={coverImage}
                        style={{
                            width: sizes.thumbnail,
                            height: sizes.thumbnail,
                            borderRadius: radii.md,
                        }}
                        contentFit='cover'
                    />
                :   <View
                        className='width-[64px] height-[64px] bg-[#EAF1E8] rounded-2xl items-center justify-center'
                        style={{
                            width: sizes.thumbnail,
                            height: sizes.thumbnail,
                        }}>
                        <Text className='font-jakarta-bold text-[#2D5A27]'>
                            {item.name.charAt(0)}
                        </Text>
                    </View>
                }
                <View className='flex-1 ml-4 justify-center'>
                    <Text
                        className='font-jakarta-bold text-[#1A1C19] text-lg mb-0.5'
                        numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text
                        className='font-vietnam text-[#1A1C19]/60 text-sm'
                        numberOfLines={1}>
                        {item.scientific}
                    </Text>
                </View>
                <View className='bg-[#F4F7F2] p-2 rounded-full'>
                    <ChevronRight
                        size={20}
                        color={colors.primary}
                    />
                </View>
            </Pressable>
        );
    };

    return (
        <Screen className='gap-6'>
            <View className='flex gap-2 mb-2'>
                <Text className='text-5xl font-jakarta-bold text-[#1A1C19]'>
                    Library
                </Text>
                <Text className='text-lg font-vietnam text-[#2D5A27]'>
                    Explore {ALL_PLANTS.length} species
                </Text>
            </View>

            <View className='flex-row items-center bg-white px-4 py-3 rounded-2xl shadow-sm shadow-black/5 border border-[#F4F7F2]'>
                <Search
                    size={20}
                    color={colors.accent}
                />
                <TextInput
                    placeholder='Search by name or scientific name...'
                    placeholderTextColor='#1A1C1980'
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className='flex-1 ml-3 font-vietnam text-base text-[#1A1C19] h-10'
                />
            </View>

            <FlatList
                data={filteredPlants}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                keyboardShouldPersistTaps='handled'
                initialNumToRender={15}
            />
        </Screen>
    );
}
