import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as jpeg from 'jpeg-js';
import * as base64js from 'base64-js';
import { imageToPytorchTensor } from './tensorUtils';
import { assessRgba, type InputCheck } from './imageGate';
import type { ClassificationStats, PlantPrediction } from './types';
import { UNKNOWN_CONFIDENCE, UNKNOWN_MARGIN } from './types';
import { Asset } from 'expo-asset';
import { Buffer } from 'buffer';
const globalScope = globalThis as typeof globalThis & { Buffer?: typeof Buffer };
globalScope.Buffer ??= Buffer;

export type Prediction = PlantPrediction;

export interface ClassificationResult {
    predictions: Prediction[];
    stats: ClassificationStats;
}

class MLPipeline {
    private plantSession: InferenceSession | null = null;
    private pestSession: InferenceSession | null = null;
    private gateSession: InferenceSession | null = null;

    private isInitializingPlant = false;
    private isInitializingHealth = false;

    async init() {
        if ((this.plantSession && this.gateSession) || this.isInitializingPlant)
            return;
        this.isInitializingPlant = true;
        try {
            const plantAsset = Asset.fromModule(
                require('../assets/models/plant_model.onnx')
            );
            const gateAsset = Asset.fromModule(
                require('../assets/models/plant_gate.onnx')
            );
            await Promise.all([
                plantAsset.downloadAsync(),
                gateAsset.downloadAsync(),
            ]);
            [this.plantSession, this.gateSession] = await Promise.all([
                InferenceSession.create(
                    plantAsset.localUri || plantAsset.uri
                ),
                InferenceSession.create(gateAsset.localUri || gateAsset.uri),
            ]);
        } finally {
            this.isInitializingPlant = false;
        }
    }

    /**
     * Two-class presence gate. Rejects a frame only when the not-plant
     * probability is at least 85%, so real leaves still get through when the
     * background is busy. Returns the plant probability for context.
     */
    async checkPlantPresence(
        base64Image: string
    ): Promise<{ isPlant: boolean; probability: number }> {
        if (!this.gateSession)
            throw new Error('Plant gate not initialized.');
        const tensor = this.base64ToTensor(base64Image, 128).tensor;
        const results = await this.gateSession.run({
            [this.gateSession.inputNames[0]]: tensor,
        });
        const logits = results[
            this.gateSession.outputNames[0]
        ].data as Float32Array;
        let maxLogit = -Infinity;
        for (let i = 0; i < logits.length; i++) {
            if (logits[i] > maxLogit) maxLogit = logits[i];
        }
        let sumExp = 0;
        for (let i = 0; i < logits.length; i++) {
            sumExp += Math.exp(logits[i] - maxLogit);
        }
        const probability =
            logits.length === 0 ?
                0
            :   Math.exp(logits[0] - maxLogit) / sumExp;
        return { isPlant: probability >= 0.15, probability };
    }

    async initHealthModels() {
        if (this.pestSession || this.isInitializingHealth) return;
        this.isInitializingHealth = true;
        try {
            const pestAsset = Asset.fromModule(
                require('../assets/models/insect_model.onnx')
            );

            await pestAsset.downloadAsync();

            this.pestSession = await InferenceSession.create(
                pestAsset.localUri || pestAsset.uri
            );
        } finally {
            this.isInitializingHealth = false;
        }
    }

    async analyzePlant(base64Image: string): Promise<ClassificationResult> {
        if (!this.plantSession)
            throw new Error('Plant session not initialized.');
        const tensor = this.base64ToTensor(base64Image, 224).tensor;
        const results = await this.plantSession.run({
            [this.plantSession.inputNames[0]]: tensor,
        });
        return this.processClassification(
            results[this.plantSession.outputNames[0]].data as Float32Array
        );
    }

    async analyzePest(base64Image: string): Promise<ClassificationResult> {
        if (!this.pestSession) throw new Error('Pest session not initialized.');
        const tensor = this.base64ToTensor(base64Image, 224).tensor;
        const results = await this.pestSession.run({
            [this.pestSession.inputNames[0]]: tensor,
        });
        return this.processClassification(
            results[this.pestSession.outputNames[0]].data as Float32Array
        );
    }

    /**
     * Cheap pixel checks that run before inference. A black or blank frame is
     * rejected here instead of being classified and saved.
     */
    checkPhoto(base64Image: string): InputCheck {
        const rawImageData = this.decodeImage(base64Image);
        return assessRgba(
            rawImageData.data,
            rawImageData.width,
            rawImageData.height
        );
    }

    private decodeImage(base64Image: string): jpeg.RawImageData<Uint8Array> {
        return jpeg.decode(base64js.toByteArray(base64Image), {
            useTArray: true,
        });
    }

    private base64ToTensor(
        base64Image: string,
        size: number
    ): { tensor: Tensor; rawImageData: jpeg.RawImageData<Uint8Array> } {
        const rawImageData = this.decodeImage(base64Image);
        const tensorData = imageToPytorchTensor(rawImageData.data, size, size);
        return {
            tensor: new Tensor('float32', tensorData, [1, 3, size, size]),
            rawImageData,
        };
    }

    private processClassification(logits: Float32Array): ClassificationResult {
        let maxLogit = -Infinity;
        for (let i = 0; i < logits.length; i++) {
            if (logits[i] > maxLogit) maxLogit = logits[i];
        }

        let sumExp = 0;
        const expLogits = new Float32Array(logits.length);
        for (let i = 0; i < logits.length; i++) {
            const e = Math.exp(logits[i] - maxLogit);
            expLogits[i] = e;
            sumExp += e;
        }

        const predictions: Prediction[] = [];
        let entropy = 0;
        for (let i = 0; i < logits.length; i++) {
            const probability = expLogits[i] / sumExp;
            predictions.push({
                classIndex: i,
                confidenceScore: probability,
            });
            if (probability > 0) entropy -= probability * Math.log(probability);
        }

        predictions.sort((a, b) => b.confidenceScore - a.confidenceScore);
        const top1 = predictions[0]?.confidenceScore ?? 0;
        const top2 = predictions[1]?.confidenceScore ?? 0;
        const margin = top1 - top2;
        return {
            predictions: predictions.slice(0, 5),
            stats: {
                entropy,
                margin,
                isUnknown: top1 < UNKNOWN_CONFIDENCE || margin < UNKNOWN_MARGIN,
            },
        };
    }
}

export const mlPipeline = new MLPipeline();
