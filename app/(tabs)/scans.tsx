import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { EmptyState } from '../../components/EmptyState';
import { AppBar } from '../../components/material/AppBar';
import { Screen } from '../../components/Screen';
import { SwipePager } from '../../components/SwipePager';
import { useAppTheme } from '@/lib/appTheme';
import { deleteScan, getScanHistory } from '../../lib/storage';
import { PLANT_CLASSES } from '../../lib/plantClasses';
import type { ScanRecord } from '../../lib/types';

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
    });
}

export default function Scans() {
    const router = useRouter();
    const { colors } = useAppTheme();
    const [scans, setScans] = useState<ScanRecord[]>([]);

    useFocusEffect(
        useCallback(() => {
            setScans(getScanHistory());
        }, []),
    );

    const confirmDelete = (scan: ScanRecord) => {
        Alert.alert(
            'Delete this scan?',
            'The photo and diagnosis will be removed from your history.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteScan(scan.id);
                        setScans(getScanHistory());
                    },
                },
            ],
        );
    };

    return (
        <Screen className='gap-4'>
            <SwipePager>
            <AppBar
                title='My scans'
                subtitle={
                    scans.length === 0 ? 'No scans yet' : (
                        `${scans.length} ${scans.length === 1 ? 'plant' : 'plants'} identified`
                    )
                }
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}>
                {scans.length === 0 ?
                    <EmptyState
                        iconName='scan'
                        title='No scans yet'
                        description='Scan a leaf to start your history. Everything stays on this device.'
                        actionLabel='Scan a plant'
                        onAction={() => router.push('/camera')}
                    />
                :   scans.map((scan) => (
                        <Pressable
                            key={scan.id}
                            onPress={() => router.push(`/result/${scan.id}`)}
                            accessibilityRole='button'
                            accessibilityLabel={`Open scan of ${PLANT_CLASSES[scan.classIndex]?.name ?? 'unknown plant'}`}
                            accessibilityHint='Long press to delete'
                            onLongPress={() => confirmDelete(scan)}
                            className='mb-3 flex-row items-center rounded-3xl p-4 active:opacity-80'
                            style={{ backgroundColor: colors.surface }}>
                            <Image
                                source={{ uri: scan.imageUri }}
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 16,
                                }}
                                contentFit='cover'
                            />
                            <View className='ml-4 flex-1 justify-center'>
                                <Text
                                    className='font-jakarta-bold text-xl'
                                    style={{ color: colors.ink }}>
                                    {PLANT_CLASSES[scan.classIndex]?.name ??
                                        'Unknown plant'}
                                </Text>
                                <Text
                                    className='mt-0.5 font-vietnam text-sm'
                                    style={{ color: colors.onSurfaceVariant }}>
                                    {formatDate(scan.timestamp)}
                                    {scan.confidence > 0 ?
                                        ` · ${Math.round(scan.confidence * 100)}%`
                                    :   ''}
                                </Text>
                            </View>
                            <Pressable
                                onPress={() => confirmDelete(scan)}
                                accessibilityRole='button'
                                accessibilityLabel={`Delete scan of ${PLANT_CLASSES[scan.classIndex]?.name ?? 'unknown plant'}`}
                                hitSlop={8}
                                className='rounded-full p-3'
                                style={{ backgroundColor: colors.background }}>
                                <Trash2
                                    size={18}
                                    color={colors.onSurfaceVariant}
                                />
                            </Pressable>
                        </Pressable>
                    ))
                }
            </ScrollView>
            </SwipePager>
        </Screen>
    );
}
