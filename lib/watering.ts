import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { PLANT_CLASSES } from './plantClasses';
import { storage } from './storage';
import type { GardenPlant } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDERS_KEY = 'watering_reminders';
const REMINDER_HOUR = 9;
const MAX_REMINDERS = 40;

export const DEFAULT_WATERING_DAYS = 7;

export function plantName(plant: GardenPlant): string {
    return PLANT_CLASSES[plant.classIndex]?.name ?? 'Your plant';
}

export function dueAt(plant: GardenPlant): number {
    const last = plant.lastWateredAt ?? plant.timestamp;
    const days = plant.wateringDays ?? DEFAULT_WATERING_DAYS;
    return last + days * DAY_MS;
}

export type WateringStatus = {
    due: boolean;
    /** Whole days until the next watering; 0 when due today. */
    inDays: number;
    /** Whole days past the due date; 0 when not overdue. */
    overdueDays: number;
};

export function wateringStatus(
    plant: GardenPlant,
    now = Date.now(),
): WateringStatus {
    const at = dueAt(plant);
    if (now >= at) {
        return {
            due: true,
            inDays: 0,
            overdueDays: Math.floor((now - at) / DAY_MS),
        };
    }
    return {
        due: false,
        inDays: Math.ceil((at - now) / DAY_MS),
        overdueDays: 0,
    };
}

export function wateringLabel(plant: GardenPlant, now = Date.now()): string {
    const status = wateringStatus(plant, now);
    if (status.due) {
        return status.overdueDays > 0 ?
                `Water now · ${status.overdueDays}d overdue`
            :   'Water today';
    }
    return status.inDays <= 1 ? 'Water tomorrow' : (
            `Water in ${status.inDays} days`
        );
}

export function duePlants(
    plants: GardenPlant[],
    now = Date.now(),
): GardenPlant[] {
    return plants
        .filter((plant) => wateringStatus(plant, now).due)
        .sort((a, b) => dueAt(a) - dueAt(b));
}

export function remindersEnabled(): boolean {
    return storage.getBoolean(REMINDERS_KEY) ?? false;
}

export function setRemindersEnabled(enabled: boolean): void {
    storage.set(REMINDERS_KEY, enabled);
}

export async function ensureNotificationPermission(): Promise<boolean> {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
}

/**
 * Rebuilds the scheduled watering reminders. One notification per plant, at
 * 09:00 on its due date; overdue plants get one for the next morning.
 */
export async function syncWateringNotifications(
    plants: GardenPlant[],
): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!remindersEnabled() || plants.length === 0) return;
    if (!(await ensureNotificationPermission())) return;

    await Notifications.setNotificationChannelAsync('watering', {
        name: 'Watering reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
    });

    const now = new Date();
    const upcoming = plants
        .map((plant) => ({ plant, at: dueAt(plant) }))
        .sort((a, b) => a.at - b.at)
        .slice(0, MAX_REMINDERS);

    for (const { plant, at } of upcoming) {
        const when = new Date(at);
        when.setHours(REMINDER_HOUR, 0, 0, 0);
        if (when.getTime() <= now.getTime()) {
            when.setDate(when.getDate() + 1);
            when.setHours(REMINDER_HOUR, 0, 0, 0);
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Watering time',
                body: `${plantName(plant)} is ready for water.`,
                data: { plantId: plant.id },
            },
            trigger: {
                type: SchedulableTriggerInputTypes.DATE,
                date: when,
                channelId: 'watering',
            },
        });
    }
}
