import { File, Paths } from 'expo-file-system';
import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
    id: 'floralens-storage',
});

export const StorageKeys = {
    SCAN_HISTORY: 'scan_history',
    GARDEN: 'garden_plants',
    CURRENT_SESSION: 'current_session',
} as const;

export interface ScanRecord {
    id: string;
    classIndex: number;
    confidence: number;
    imageUri: string;
    timestamp: number;
}

export async function saveScanResult(
    classIndex: number,
    confidence: number,
    tempUri: string
): Promise<ScanRecord> {
    const fileName = `scan_${Date.now()}.jpg`;
    const destination = new File(Paths.document, fileName);
    new File(tempUri).copy(destination);

    const newRecord: ScanRecord = {
        id: Date.now().toString(),
        classIndex,
        confidence,
        imageUri: destination.uri,
        timestamp: Date.now(),
    };

    const history = getScanHistory();
    history.unshift(newRecord);
    storage.set(StorageKeys.SCAN_HISTORY, JSON.stringify(history));
    return newRecord;
}

export function getScanHistory(): ScanRecord[] {
    const existing = storage.getString(StorageKeys.SCAN_HISTORY);
    return existing ? JSON.parse(existing) : [];
}

export function removeFromHistory(id: string) {
    const history = getScanHistory().filter((item) => item.id !== id);
    storage.set(StorageKeys.SCAN_HISTORY, JSON.stringify(history));
}

export function saveToGarden(record: ScanRecord) {
    const garden = getGardenPlants();
    if (!garden.some((plant) => plant.id === record.id)) {
        garden.unshift(record);
        storage.set(StorageKeys.GARDEN, JSON.stringify(garden));
    }
}

export function getGardenPlants(): ScanRecord[] {
    const existing = storage.getString(StorageKeys.GARDEN);
    return existing ? JSON.parse(existing) : [];
}

export function removeFromGarden(id: string) {
    const garden = getGardenPlants().filter((plant) => plant.id !== id);
    storage.set(StorageKeys.GARDEN, JSON.stringify(garden));
}
