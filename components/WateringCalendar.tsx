import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight, Droplets } from 'lucide-react-native';
import { useAppTheme } from '@/lib/appTheme';
import { PLANT_CLASSES } from '@/lib/plantClasses';
import { getPlantCover } from '@/lib/plantAssets';
import {
    dueAt,
    startOfDay,
    wateringLabel,
    wateringStatus,
} from '@/lib/watering';
import type { GardenPlant } from '@/lib/types';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function dayKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function monthTitle(date: Date): string {
    return date.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
    });
}

function selectedTitle(date: Date): string {
    const today = new Date();
    const label = date.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
    return isSameDay(date, today) ? `Today · ${label}` : label;
}

/**
 * Month grid of watering days. Days with at least one plant are highlighted;
 * tapping one lists exactly the plants to water that day. Overdue plants are
 * grouped under today so they stay visible where the user acts.
 */
export function WateringCalendar({
    plants,
    onWater,
    onOpen,
}: {
    plants: GardenPlant[];
    onWater: (plant: GardenPlant) => void;
    onOpen: (plant: GardenPlant) => void;
}) {
    const { colors } = useAppTheme();
    const [today, setToday] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    });
    const [month, setMonth] = useState(() => startOfMonth(today));
    const [selected, setSelected] = useState(today);
    const todayRef = useRef(today);

    // If the app stays open past midnight, move the calendar to the new day
    // when the tab regains focus.
    useFocusEffect(
        useCallback(() => {
            const next = new Date(startOfDay(Date.now()));
            if (next.getTime() === todayRef.current.getTime()) return;
            todayRef.current = next;
            setToday(next);
            setSelected(next);
        }, []),
    );

    const dueByDay = useMemo(() => {
        const map = new Map<string, GardenPlant[]>();
        const todayStart = today.getTime();

        for (const plant of plants) {
            const at = Math.max(dueAt(plant), todayStart);
            const key = dayKey(new Date(at));
            const bucket = map.get(key);
            if (bucket) bucket.push(plant);
            else map.set(key, [plant]);
        }

        for (const bucket of map.values()) {
            bucket.sort((a, b) => {
                const nameA = PLANT_CLASSES[a.classIndex]?.name ?? '';
                const nameB = PLANT_CLASSES[b.classIndex]?.name ?? '';
                return nameA.localeCompare(nameB);
            });
        }
        return map;
    }, [plants, today]);

    const cells = useMemo(() => {
        const firstWeekday = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
        const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        const result: (Date | null)[] = [];
        for (let i = 0; i < firstWeekday; i++) result.push(null);
        for (let day = 1; day <= daysInMonth; day++) {
            result.push(new Date(month.getFullYear(), month.getMonth(), day));
        }
        while (result.length % 7 !== 0) result.push(null);
        return result;
    }, [month]);

    const monthDueDays = useMemo(
        () =>
            cells.filter(
                (date) =>
                    date !== null && dueByDay.has(dayKey(date)),
            ).length,
        [cells, dueByDay],
    );

    const selectedPlants = dueByDay.get(dayKey(selected)) ?? [];
    const canWater = isSameDay(selected, today);

    const shiftMonth = (delta: number) => {
        const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
        setMonth(next);
        setSelected(
            isSameDay(next, startOfMonth(today)) ?
                today
            :   new Date(next.getFullYear(), next.getMonth(), 1),
        );
    };

    return (
        <View>
            <View
                className='mb-5 rounded-3xl p-4'
                style={{ backgroundColor: colors.surface }}>
                <View className='mb-3 flex-row items-center justify-between'>
                    <Pressable
                        onPress={() => shiftMonth(-1)}
                        accessibilityRole='button'
                        accessibilityLabel='Previous month'
                        hitSlop={10}
                        className='rounded-full p-2'>
                        <ChevronLeft
                            size={20}
                            color={colors.primary}
                        />
                    </Pressable>
                    <Text
                        className='font-jakarta-bold text-lg'
                        style={{ color: colors.ink }}>
                        {monthTitle(month)}
                    </Text>
                    <Pressable
                        onPress={() => shiftMonth(1)}
                        accessibilityRole='button'
                        accessibilityLabel='Next month'
                        hitSlop={10}
                        className='rounded-full p-2'>
                        <ChevronRight
                            size={20}
                            color={colors.primary}
                        />
                    </Pressable>
                </View>

                <View className='flex-row'>
                    {WEEKDAYS.map((day, index) => (
                        <View
                            key={`${day}-${index}`}
                            className='items-center'
                            style={{ width: '14.2857%' }}>
                            <Text
                                className='font-vietnam-medium text-xs'
                                style={{ color: colors.onSurfaceVariant }}>
                                {day}
                            </Text>
                        </View>
                    ))}
                </View>

                <View className='mt-1 flex-row flex-wrap'>
                    {cells.map((date, index) => {
                        if (!date) {
                            return (
                                <View
                                    key={`blank-${index}`}
                                    style={{ width: '14.2857%', height: 48 }}
                                />
                            );
                        }
                        const hasDue = dueByDay.has(dayKey(date));
                        const isSelected = isSameDay(date, selected);
                        const isToday = isSameDay(date, today);
                        return (
                            <Pressable
                                key={dayKey(date)}
                                onPress={() => setSelected(date)}
                                accessibilityRole='button'
                                accessibilityState={{ selected: isSelected }}
                                accessibilityLabel={`${date.toLocaleDateString(
                                    undefined,
                                    { day: 'numeric', month: 'long' },
                                )}${
                                    hasDue ?
                                        `, ${dueByDay.get(dayKey(date))!.length} plants need water`
                                    :   ', no plants need water'
                                }`}
                                style={{
                                    width: '14.2857%',
                                    height: 48,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                <View
                                    className='h-9 w-9 items-center justify-center rounded-full'
                                    style={{
                                        backgroundColor:
                                            isSelected ? colors.primary
                                            : hasDue ? colors.background
                                            : 'transparent',
                                        borderWidth: isToday && !isSelected ? 1 : 0,
                                        borderColor: colors.primary,
                                    }}>
                                    <Text
                                        className='font-vietnam-medium text-sm'
                                        style={{
                                            color:
                                                isSelected ? colors.onPrimary
                                                : isToday ? colors.primary
                                                : colors.ink,
                                        }}>
                                        {date.getDate()}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        marginTop: 2,
                                        height: 4,
                                        width: 4,
                                        borderRadius: 2,
                                        backgroundColor:
                                            hasDue && !isSelected ?
                                                colors.primary
                                            :   'transparent',
                                    }}
                                />
                            </Pressable>
                        );
                    })}
                </View>

                <Text
                    className='mt-2 font-vietnam text-xs'
                    style={{ color: colors.onSurfaceVariant }}>
                    {monthDueDays === 0 ?
                        'No watering days this month.'
                    :   `${monthDueDays} watering ${
                            monthDueDays === 1 ? 'day' : 'days'
                        } this month.`}
                </Text>
            </View>

            <View className='mb-3 flex-row items-baseline justify-between'>
                <Text
                    className='mr-2 flex-1 font-jakarta-bold text-lg'
                    numberOfLines={1}
                    style={{ color: colors.ink }}>
                    {selectedTitle(selected)}
                </Text>
                {selectedPlants.length > 0 ?
                    <Text
                        className='font-vietnam text-sm'
                        style={{ color: colors.primary }}>
                        {selectedPlants.length}{' '}
                        {selectedPlants.length === 1 ? 'plant' : 'plants'}
                    </Text>
                :   null}
            </View>

            {selectedPlants.length === 0 ?
                <View
                    className='mb-6 rounded-2xl px-4 py-5'
                    style={{ backgroundColor: colors.surface }}>
                    <Text
                        className='font-vietnam text-sm'
                        style={{ color: colors.onSurfaceVariant }}>
                        Nothing to water on this day.
                    </Text>
                </View>
            :   <View className='mb-6'>
                    {selectedPlants.map((plant) => {
                        const info = PLANT_CLASSES[plant.classIndex] || {
                            name: 'Unknown Plant',
                            scientific: 'Unknown',
                        };
                        const cover =
                            plant.imageUri ?
                                { uri: plant.imageUri }
                            :   getPlantCover(plant.classIndex);
                        const due = wateringStatus(plant).due;
                        return (
                            <Pressable
                                key={plant.id}
                                onPress={() => onOpen(plant)}
                                accessibilityRole='button'
                                accessibilityLabel={`Open ${info.name}`}
                                className='mb-2 flex-row items-center rounded-2xl p-3 active:opacity-80'
                                style={{ backgroundColor: colors.surface }}>
                                {cover ?
                                    <Image
                                        source={cover}
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 12,
                                        }}
                                        contentFit='cover'
                                    />
                                :   <View
                                        className='h-11 w-11 items-center justify-center rounded-xl'
                                        style={{
                                            backgroundColor: colors.background,
                                        }}>
                                        <Text
                                            className='font-jakarta-bold text-sm'
                                            style={{ color: colors.primary }}>
                                            {info.name.charAt(0)}
                                        </Text>
                                    </View>
                                }
                                <View className='ml-3 flex-1'>
                                    <Text
                                        className='font-jakarta-bold text-base'
                                        numberOfLines={1}
                                        style={{ color: colors.ink }}>
                                        {info.name}
                                    </Text>
                                    <Text
                                        className='font-vietnam-medium text-xs'
                                        style={{
                                            color:
                                                due ? colors.danger : (
                                                    colors.onSurfaceVariant
                                                ),
                                        }}>
                                        {wateringLabel(plant)}
                                    </Text>
                                </View>
                                {canWater ?
                                    <Pressable
                                        onPress={() => onWater(plant)}
                                        accessibilityRole='button'
                                        accessibilityLabel={`Mark ${info.name} as watered`}
                                        hitSlop={8}
                                        className='rounded-full p-2.5'
                                        style={{
                                            backgroundColor:
                                                due ? colors.primary : (
                                                    colors.background
                                                ),
                                        }}>
                                        <Droplets
                                            size={16}
                                            color={
                                                due ?
                                                    colors.onPrimary
                                                :   colors.primary
                                            }
                                        />
                                    </Pressable>
                                :   <ChevronRight
                                        size={18}
                                        color={colors.onSurfaceVariant}
                                    />
                                }
                            </Pressable>
                        );
                    })}
                </View>
            }
        </View>
    );
}
