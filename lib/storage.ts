import { File, Paths } from 'expo-file-system';
import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
    id: 'floralens-storage',
});

export const StorageKeys = {
    SCAN_HISTORY: 'scan_history',
    GARDEN: 'garden_plants',
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
    const source = new File(tempUri);

    source.copy(destination);

    const newRecord: ScanRecord = {
        id: Date.now().toString(),
        classIndex,
        confidence,
        imageUri: destination.uri,
        timestamp: Date.now(),
    };

    const existing = storage.getString(StorageKeys.SCAN_HISTORY);
    const history: ScanRecord[] = existing ? JSON.parse(existing) : [];

    history.unshift(newRecord);
    storage.set(StorageKeys.SCAN_HISTORY, JSON.stringify(history));

    return newRecord;
}

export function getScanHistory(): ScanRecord[] {
    const existing = storage.getString(StorageKeys.SCAN_HISTORY);
    return existing ? JSON.parse(existing) : [];
}

export function saveToGarden(record: ScanRecord) {
    const existing = storage.getString(StorageKeys.GARDEN);
    const garden: ScanRecord[] = existing ? JSON.parse(existing) : [];

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
    const existing = storage.getString(StorageKeys.GARDEN);
    if (!existing) return;
    const garden: ScanRecord[] = JSON.parse(existing);
    const filtered = garden.filter((plant) => plant.id !== id);
    storage.set(StorageKeys.GARDEN, JSON.stringify(filtered));
}
