import { radii, sizes } from '@/theme';
import { useAppTheme } from '@/lib/appTheme';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronRight, Search } from 'lucide-react-native';
import { styled } from 'nativewind';
import { useMemo, useState } from 'react';
import {
    FlatList,
    Pressable,
    View as RNView,
    Text,
    TextInput,
} from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { AppBar } from '../../components/material/AppBar';
import { Screen } from '../../components/Screen';
import { SwipePager } from '../../components/SwipePager';
import { PLANT_CLASSES } from '../../lib/plantClasses';
import { getPlantCover } from '../../lib/plantAssets';

const View = styled(RNView);

const ALL_PLANTS = Object.entries(PLANT_CLASSES).map(([id, data]) => ({
    id: Number(id),
    ...data,
}));

ALL_PLANTS.sort((a, b) => a.name.localeCompare(b.name));

export default function Library() {
    const { colors } = useAppTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const filteredPlants = useMemo(() => {
        if (!searchQuery) return ALL_PLANTS;
        const lowerQ = searchQuery.toLowerCase();
        return ALL_PLANTS.filter(
            (p) =>
                p.name.toLowerCase().includes(lowerQ) ||
                p.scientific.toLowerCase().includes(lowerQ),
        );
    }, [searchQuery]);

    const renderItem = ({ item }: { item: (typeof ALL_PLANTS)[0] }) => {
        const coverImage = getPlantCover(item.id);

        return (
            <Pressable
                onPress={() => router.push(`/plant/${item.id}`)}
                accessibilityRole='button'
                accessibilityLabel={`Open ${item.name}`}
                className='flex-row items-center p-4 rounded-3xl shadow-sm shadow-black/5 mb-3 active:opacity-80'
                style={{ backgroundColor: colors.surface }}>
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
                        className='rounded-2xl items-center justify-center'
                        style={{
                            width: sizes.thumbnail,
                            height: sizes.thumbnail,
                            backgroundColor: colors.background,
                        }}>
                        <Text
                            className='font-jakarta-bold'
                            style={{ color: colors.primary }}>
                            {item.name.charAt(0)}
                        </Text>
                    </View>
                }
                <View className='flex-1 ml-4 justify-center'>
                    <Text
                        className='font-jakarta-bold text-xl mb-0.5'
                        numberOfLines={1}
                        style={{ color: colors.ink }}>
                        {item.name}
                    </Text>
                    <Text
                        className='font-vietnam text-base'
                        numberOfLines={1}
                        style={{ color: colors.onSurfaceVariant }}>
                        {item.scientific}
                    </Text>
                </View>
                <View
                    className='p-2 rounded-full'
                    style={{ backgroundColor: colors.background }}>
                    <ChevronRight
                        size={20}
                        color={colors.primary}
                    />
                </View>
            </Pressable>
        );
    };

    return (
        <Screen className='gap-4'>
            <SwipePager>
            <AppBar
                title='Library'
                subtitle={`Explore ${ALL_PLANTS.length} species`}
            />

            <View
                className='flex-row items-center px-4 py-3 rounded-2xl shadow-sm shadow-black/5'
                style={{ backgroundColor: colors.surfaceHigh }}>
                <Search
                    size={20}
                    color={colors.accent}
                />
                <TextInput
                    placeholder='Search by name or scientific name...'
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    accessibilityLabel='Search plants'
                    className='flex-1 ml-3 font-vietnam text-base h-10'
                    style={{ color: colors.ink }}
                    returnKeyType='search'
                    autoCorrect={false}
                />
            </View>

            <FlatList
                data={filteredPlants}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
                keyboardShouldPersistTaps='handled'
                initialNumToRender={15}
                ListEmptyComponent={
                    <EmptyState
                        iconName='search'
                        title='No plants found'
                        description={`Nothing matches "${searchQuery}". Try a common or scientific name.`}
                        actionLabel='Clear search'
                        onAction={() => setSearchQuery('')}
                    />
                }
            />
            </SwipePager>
        </Screen>
    );
}
