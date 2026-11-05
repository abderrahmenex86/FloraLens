import { File, Paths } from 'expo-file-system';
import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
    id: 'floralens-storage',
});

export const StorageKeys = {
    SCAN_HISTORY: 'scan_history',
    GARDEN: 'garden_plants',
    CURRENT_SESSION: 'current_session',
    SCAN_PREFIX: 'scan:',
} as const;

import type {
    GardenPlant,
    PestPrediction,
    PlantPrediction,
    ScanDiagnosis,
    ScanRecord,
    SegmentationResult,
} from './types';

export type {
    ClassificationStats,
    GardenPlant,
    PestPrediction,
    PlantPrediction,
    ScanDiagnosis,
    ScanRecord,
    SegmentationResult,
} from './types';

function generateId(): string {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function safeParse<T>(value: string | undefined, fallback: T): T {
    if (!value) return fallback;
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

function scanKey(id: string): string {
    return `${StorageKeys.SCAN_PREFIX}${id}`;
}

export function getScanHistory(): ScanRecord[] {
    return safeParse<ScanRecord[]>(
        storage.getString(StorageKeys.SCAN_HISTORY),
        [],
    ).sort((a, b) => b.timestamp - a.timestamp);
}

export function getScan(id: string): ScanRecord | null {
    const record = safeParse<ScanRecord | null>(
        storage.getString(scanKey(id)),
        null,
    );
    if (record) return record;
    // Older versions stored only a summary in the history array.
    const legacy = getScanHistory().find((item) => item.id === id);
    return legacy ?? null;
}

function writeScan(record: ScanRecord): void {
    storage.set(scanKey(record.id), JSON.stringify(record));
}

function updateHistorySummary(record: ScanRecord): void {
    const history = getScanHistory().filter((item) => item.id !== record.id);
    history.unshift({
        id: record.id,
        classIndex: record.classIndex,
        confidence: record.confidence,
        imageUri: record.imageUri,
        timestamp: record.timestamp,
    });
    storage.set(StorageKeys.SCAN_HISTORY, JSON.stringify(history));
}

export function saveScan(params: {
    imageUri: string;
    diagnosis: ScanDiagnosis;
    timestamp?: number;
}): ScanRecord {
    const id = generateId();
    const destination = new File(Paths.document, `scan_${id}.jpg`);
    new File(params.imageUri).copy(destination);

    const top = params.diagnosis.plant[0];
    const record: ScanRecord = {
        id,
        classIndex: top?.classIndex ?? -1,
        confidence: top?.confidenceScore ?? 0,
        imageUri: destination.uri,
        timestamp: params.timestamp ?? Date.now(),
        diagnosis: params.diagnosis,
    };
    writeScan(record);
    updateHistorySummary(record);
    return record;
}

export function updateScanSelection(
    id: string,
    classIndex: number,
    confidence: number,
): ScanRecord | null {
    const record = getScan(id);
    if (!record) return null;
    const updated: ScanRecord = {
        ...record,
        classIndex,
        confidence,
        selectedClassIndex: classIndex,
    };
    writeScan(updated);
    updateHistorySummary(updated);
    const garden = getGardenPlants().map((plant) =>
        plant.scanId === id ?
            { ...plant, classIndex, confidence }
        :   plant
    );
    storage.set(StorageKeys.GARDEN, JSON.stringify(garden));
    return updated;
}

function isFileReferenced(uri: string): boolean {
    const inHistory = getScanHistory().some((item) => item.imageUri === uri);
    const inGarden = getGardenPlants().some((item) => item.imageUri === uri);
    return inHistory || inGarden;
}

function deleteFileIfUnreferenced(uri: string): void {
    if (!uri || isFileReferenced(uri)) return;
    try {
        const file = new File(uri);
        if (file.exists) file.delete();
    } catch {
        // The file may already be gone; deletion is best-effort.
    }
}

export function deleteScan(id: string): void {
    const record = getScan(id);
    const history = getScanHistory().filter((item) => item.id !== id);
    storage.set(StorageKeys.SCAN_HISTORY, JSON.stringify(history));
    storage.remove(scanKey(id));
    if (record) deleteFileIfUnreferenced(record.imageUri);
}

export function getGardenPlants(): GardenPlant[] {
    return safeParse<GardenPlant[]>(
        storage.getString(StorageKeys.GARDEN),
        [],
    ).sort((a, b) => b.timestamp - a.timestamp);
}

export function isInGarden(scanId: string | undefined): boolean {
    if (!scanId) return false;
    return getGardenPlants().some((plant) => plant.scanId === scanId);
}

export function saveScanToGarden(record: ScanRecord): boolean {
    return saveToGarden({
        scanId: record.id,
        classIndex: record.classIndex,
        confidence: record.confidence,
        imageUri: record.imageUri,
    });
}

export function savePlantToGarden(
    classIndex: number,
    imageUri = '',
): boolean {
    return saveToGarden({
        classIndex,
        confidence: 1,
        imageUri,
    });
}

export function saveToGarden(params: {
    scanId?: string;
    classIndex: number;
    confidence: number;
    imageUri: string;
}): boolean {
    const garden = getGardenPlants();
    if (params.scanId) {
        if (garden.some((plant) => plant.scanId === params.scanId)) return false;
    } else if (
        garden.some(
            (plant) => !plant.scanId && plant.classIndex === params.classIndex,
        )
    ) {
        return false;
    }
    garden.unshift({
        id: generateId(),
        scanId: params.scanId,
        classIndex: params.classIndex,
        confidence: params.confidence,
        imageUri: params.imageUri,
        timestamp: Date.now(),
    });
    storage.set(StorageKeys.GARDEN, JSON.stringify(garden));
    return true;
}

export function removeFromGarden(id: string): void {
    const garden = getGardenPlants();
    const removed = garden.find((plant) => plant.id === id);
    storage.set(
        StorageKeys.GARDEN,
        JSON.stringify(garden.filter((plant) => plant.id !== id)),
    );
    if (removed) deleteFileIfUnreferenced(removed.imageUri);
}

/** Legacy session written by older app versions. */
export function getLegacySession(): {
    originalUri?: string;
    plant?: PlantPrediction[];
    pest?: PestPrediction;
    disease?: SegmentationResult;
} | null {
    return safeParse(
        storage.getString(StorageKeys.CURRENT_SESSION),
        null,
    );
}
