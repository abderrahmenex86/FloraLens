export interface PlantPrediction {
    classIndex: number;
    confidenceScore: number;
}

export interface PestPrediction {
    classIndex: number;
    confidenceScore: number;
}

export interface SegmentationResult {
    hasDisease: boolean;
    diseaseClassIndex: number;
    severity: number;
    blendedBase64?: string;
}

export interface ClassificationStats {
    /** Entropy of the softmax distribution; high means diffuse. */
    entropy: number;
    /** Gap between the top-1 and top-2 probabilities. */
    margin: number;
    /** Conservative on-device rejection flag. */
    isUnknown: boolean;
}

export interface ScanDiagnosis {
    plant: PlantPrediction[];
    plantStats?: ClassificationStats;
    pest: PestPrediction;
    pestStats?: ClassificationStats;
    /** Older scans carry a disease segmentation; new scans do not. */
    disease?: SegmentationResult;
}

export interface ScanRecord {
    id: string;
    classIndex: number;
    confidence: number;
    imageUri: string;
    timestamp: number;
    diagnosis?: ScanDiagnosis;
    selectedClassIndex?: number;
}

export interface GardenPlant {
    id: string;
    scanId?: string;
    classIndex: number;
    confidence: number;
    imageUri: string;
    timestamp: number;
    /** Last time the user marked this plant as watered. */
    lastWateredAt?: number;
    /** Watering interval in days. */
    wateringDays?: number;
}

export const UNKNOWN_CONFIDENCE = 0.5;
export const UNKNOWN_MARGIN = 0.12;
export const PEST_CONFIDENCE = 0.7;

export function isUncertain(stats: ClassificationStats | undefined): boolean {
    return !stats || stats.isUnknown;
}
