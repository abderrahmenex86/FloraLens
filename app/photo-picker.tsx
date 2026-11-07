import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Linking,
    Pressable,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Image as ImageIcon, X } from 'lucide-react-native';
import {
    Asset,
    AssetField,
    MediaType,
    Query,
    getPermissionsAsync,
    presentPermissionsPicker,
    requestPermissionsAsync,
    type PermissionResponse,
} from 'expo-media-library';
import { Screen } from '../components/Screen';
import { useAppTheme } from '@/lib/appTheme';
import { deliverPhoto } from '@/lib/photoSelection';

const PAGE_SIZE = 60;
const GAP = 4;

/**
 * In-app gallery backed by the media permission. On Android 14+ the user can
 * grant "Selected photos", and `Query` only returns those assets, so the rest
 * of the library never appears here.
 */
export default function PhotoPicker() {
    const router = useRouter();
    const { colors } = useAppTheme();
    const { width } = useWindowDimensions();

    const [permission, setPermission] = useState<PermissionResponse | null>(
        null,
    );
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [reachedEnd, setReachedEnd] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const assetsRef = useRef<Asset[]>([]);
    const loadingRef = useRef(false);

    const tile = (width - 40 - GAP * 2) / 3;

    const loadAssets = useCallback(async (reset: boolean) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        if (reset) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        try {
            const offset = reset ? 0 : assetsRef.current.length;
            const page = await new Query()
                .eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
                .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
                .offset(offset)
                .limit(PAGE_SIZE)
                .exe();
            assetsRef.current = reset ? page : [...assetsRef.current, ...page];
            setAssets(assetsRef.current);
            setReachedEnd(page.length < PAGE_SIZE);
        } catch (loadError) {
            console.error('Gallery query failed:', loadError);
            setError('Could not read your photos. Check the app permissions.');
        } finally {
            loadingRef.current = false;
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                let response = await getPermissionsAsync(false, ['photo']);
                if (!response.granted) {
                    response = await requestPermissionsAsync(false, [
                        'photo',
                    ]);
                }
                if (!active) return;
                setPermission(response);
                setLoading(false);
                if (response.granted) await loadAssets(true);
            } catch (permissionError) {
                console.error('Photo permission failed:', permissionError);
                if (!active) return;
                setError('Photo access could not be requested.');
                setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [loadAssets]);

    const askAgain = async () => {
        const response = await requestPermissionsAsync(false, ['photo']);
        setPermission(response);
        if (response.granted) await loadAssets(true);
        else if (!response.canAskAgain) await Linking.openSettings();
    };

    const selectMore = async () => {
        try {
            await presentPermissionsPicker(['photo']);
            const response = await getPermissionsAsync(false, ['photo']);
            setPermission(response);
            await loadAssets(true);
        } catch (pickerError) {
            console.error('Permission picker failed:', pickerError);
        }
    };

    const choose = async (asset: Asset) => {
        try {
            const uri = await asset.getUri();
            deliverPhoto(uri);
            router.back();
        } catch (chooseError) {
            console.error('Could not resolve photo:', chooseError);
            setError('That photo could not be opened.');
        }
    };

    const granted = permission?.granted ?? false;
    const limited = permission?.accessPrivileges === 'limited';

    return (
        <Screen animate={false}>
            <View className='flex-row items-center justify-between py-2'>
                <Pressable
                    onPress={() => router.back()}
                    accessibilityRole='button'
                    accessibilityLabel='Close the photo picker'
                    hitSlop={8}
                    className='rounded-full p-2'
                    style={{ backgroundColor: colors.surface }}>
                    <X
                        size={20}
                        color={colors.ink}
                    />
                </Pressable>
                <Text
                    className='font-jakarta-bold text-lg'
                    style={{ color: colors.ink }}>
                    Choose a photo
                </Text>
                <View style={{ width: 36 }} />
            </View>

            {limited ?
                <View
                    className='mb-3 flex-row items-center justify-between gap-3 rounded-2xl px-4 py-3'
                    style={{ backgroundColor: colors.surface }}>
                    <Text
                        className='flex-1 font-vietnam text-sm'
                        style={{ color: colors.ink }}>
                        Showing only the photos you allowed.
                    </Text>
                    <Pressable
                        onPress={selectMore}
                        accessibilityRole='button'
                        accessibilityLabel='Change the selected photos'>
                        <Text
                            className='font-jakarta-bold text-sm'
                            style={{ color: colors.primary }}>
                            Select photos
                        </Text>
                    </Pressable>
                </View>
            :   null}

            {loading ?
                <View className='flex-1 items-center justify-center'>
                    <ActivityIndicator
                        size='large'
                        color={colors.primary}
                    />
                </View>
            : !granted ?
                <View className='flex-1 items-center justify-center gap-4 px-6 pb-16'>
                    <View
                        className='rounded-full p-5'
                        style={{ backgroundColor: colors.surface }}>
                        <ImageIcon
                            size={36}
                            color={colors.primary}
                        />
                    </View>
                    <Text
                        className='text-center font-jakarta-bold text-2xl'
                        style={{ color: colors.ink }}>
                        Choose photos to scan
                    </Text>
                    <Text
                        className='text-center font-vietnam leading-relaxed'
                        style={{ color: colors.onSurfaceVariant }}>
                        FloraLens only sees the photos you allow. On Android
                        you can pick a few photos instead of the whole library.
                    </Text>
                    <Pressable
                        onPress={askAgain}
                        accessibilityRole='button'
                        className='mt-2 rounded-2xl px-6 py-3.5'
                        style={{ backgroundColor: colors.primary }}>
                        <Text
                            className='font-jakarta-bold'
                            style={{ color: colors.onPrimary }}>
                            Allow photo access
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => Linking.openSettings()}
                        accessibilityRole='button'
                        hitSlop={8}>
                        <Text
                            className='font-vietnam-medium text-sm'
                            style={{ color: colors.onSurfaceVariant }}>
                            Open system settings
                        </Text>
                    </Pressable>
                </View>
            :   <FlatList
                    data={assets}
                    keyExtractor={(asset) => asset.id}
                    numColumns={3}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
                    columnWrapperStyle={{ gap: GAP }}
                    ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
                    onEndReached={() => {
                        if (!reachedEnd) loadAssets(false);
                    }}
                    onEndReachedThreshold={0.6}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => choose(item)}
                            accessibilityRole='button'
                            accessibilityLabel='Scan this photo'
                            className='active:opacity-80'>
                            <Image
                                source={{ uri: item.id }}
                                style={{
                                    width: tile,
                                    height: tile,
                                    borderRadius: 10,
                                    backgroundColor: colors.surface,
                                }}
                                contentFit='cover'
                            />
                        </Pressable>
                    )}
                    ListEmptyComponent={
                        <View className='items-center gap-3 px-6 pt-16'>
                            <Text
                                className='text-center font-jakarta-bold text-lg'
                                style={{ color: colors.ink }}>
                                No photos here yet
                            </Text>
                            <Text
                                className='text-center font-vietnam text-sm'
                                style={{ color: colors.onSurfaceVariant }}>
                                Add a few plant photos to the selection and
                                they will appear here.
                            </Text>
                            {limited ?
                                <Pressable
                                    onPress={selectMore}
                                    accessibilityRole='button'
                                    className='mt-1 rounded-2xl px-5 py-3'
                                    style={{ backgroundColor: colors.primary }}>
                                    <Text
                                        className='font-jakarta-bold'
                                        style={{ color: colors.onPrimary }}>
                                        Select photos
                                    </Text>
                                </Pressable>
                            :   null}
                        </View>
                    }
                    ListFooterComponent={
                        loadingMore ?
                            <View className='py-4'>
                                <ActivityIndicator color={colors.primary} />
                            </View>
                        :   error ?
                            <Text
                                className='py-4 text-center font-vietnam text-sm'
                                style={{ color: colors.danger }}>
                                {error}
                            </Text>
                        :   undefined
                    }
                />}
        </Screen>
    );
}
