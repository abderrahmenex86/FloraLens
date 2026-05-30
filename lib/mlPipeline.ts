import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as jpeg from 'jpeg-js';
import * as base64js from 'base64-js';
import { imageToPytorchTensor } from './tensorUtils';
import { Asset } from 'expo-asset';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

export interface Prediction {
    classIndex: number;
    confidenceScore: number;
}

export interface SegmentationResult {
    hasDisease: boolean;
    diseaseClassIndex: number;
    severity: number;
    blendedBase64?: string;
}

class MLPipeline {
    private plantSession: InferenceSession | null = null;
    private diseaseSession: InferenceSession | null = null;
    private pestSession: InferenceSession | null = null;

    private isInitializingPlant = false;
    private isInitializingHealth = false;

    async init() {
        if (this.plantSession || this.isInitializingPlant) return;
        this.isInitializingPlant = true;
        try {
            const modelAsset = Asset.fromModule(
                require('../assets/models/plant_model.onnx')
            );
            await modelAsset.downloadAsync();
            this.plantSession = await InferenceSession.create(
                modelAsset.localUri || modelAsset.uri
            );
        } finally {
            this.isInitializingPlant = false;
        }
    }

    async initHealthModels() {
        if (
            (this.diseaseSession && this.pestSession) ||
            this.isInitializingHealth
        )
            return;
        this.isInitializingHealth = true;
        try {
            const diseaseAsset = Asset.fromModule(
                require('../assets/models/disease_model.onnx')
            );
            const pestAsset = Asset.fromModule(
                require('../assets/models/pest_model.onnx')
            );

            await Promise.all([
                diseaseAsset.downloadAsync(),
                pestAsset.downloadAsync(),
            ]);

            this.diseaseSession = await InferenceSession.create(
                diseaseAsset.localUri || diseaseAsset.uri
            );
            this.pestSession = await InferenceSession.create(
                pestAsset.localUri || pestAsset.uri
            );
        } finally {
            this.isInitializingHealth = false;
        }
    }

    async analyzePlant(base64Image: string): Promise<Prediction[]> {
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

    async analyzePest(base64Image: string): Promise<Prediction> {
        if (!this.pestSession) throw new Error('Pest session not initialized.');
        const tensor = this.base64ToTensor(base64Image, 224).tensor;
        const results = await this.pestSession.run({
            [this.pestSession.inputNames[0]]: tensor,
        });
        const predictions = this.processClassification(
            results[this.pestSession.outputNames[0]].data as Float32Array
        );
        return predictions[0];
    }

    async analyzeDisease(base64Image: string): Promise<SegmentationResult> {
        if (!this.diseaseSession)
            throw new Error('Disease session not initialized.');

        const { tensor, rawImageData } = this.base64ToTensor(base64Image, 520);

        const results = await this.diseaseSession.run({
            [this.diseaseSession.inputNames[0]]: tensor,
        });
        const outputTensor = results[this.diseaseSession.outputNames[0]];
        const outputData = outputTensor.data as Float32Array;

        const numClasses = outputTensor.dims[1];
        const spatialSize = 520 * 520;

        const pixelClasses = new Uint8Array(spatialSize);
        const classCounts = new Array(numClasses).fill(0);

        for (let p = 0; p < spatialSize; p++) {
            let maxVal = -Infinity;
            let maxClass = 0;
            for (let c = 0; c < numClasses; c++) {
                const val = outputData[c * spatialSize + p];
                if (val > maxVal) {
                    maxVal = val;
                    maxClass = c;
                }
            }
            pixelClasses[p] = maxClass;
            classCounts[maxClass]++;
        }

        let dominantClass = 0;
        let maxDiseaseCount = 0;
        for (let c = 1; c < numClasses; c++) {
            if (classCounts[c] > maxDiseaseCount) {
                maxDiseaseCount = classCounts[c];
                dominantClass = c;
            }
        }

        const severity = maxDiseaseCount / spatialSize; // Percentage of image

        if (severity > 0.05) {
            for (let p = 0; p < spatialSize; p++) {
                if (pixelClasses[p] === dominantClass) {
                    const rIdx = p * 4;
                    rawImageData.data[rIdx] = Math.min(
                        255,
                        rawImageData.data[rIdx] + 100
                    );
                    rawImageData.data[rIdx + 1] = Math.max(
                        0,
                        rawImageData.data[rIdx + 1] - 50
                    );
                    rawImageData.data[rIdx + 2] = Math.max(
                        0,
                        rawImageData.data[rIdx + 2] - 50
                    );
                }
            }

            const blendedJpeg = jpeg.encode(rawImageData, 80);
            const blendedBase64 = base64js.fromByteArray(blendedJpeg.data);

            return {
                hasDisease: true,
                diseaseClassIndex: dominantClass,
                severity,
                blendedBase64: `data:image/jpeg;base64,${blendedBase64}`,
            };
        } else {
            return {
                hasDisease: false,
                diseaseClassIndex: 0,
                severity: 0,
            };
        }
    }

    private base64ToTensor(
        base64Image: string,
        size: number
    ): { tensor: Tensor; rawImageData: jpeg.RawImageData<Uint8Array> } {
        const imgBuffer = base64js.toByteArray(base64Image);
        const rawImageData = jpeg.decode(imgBuffer, { useTArray: true });
        const tensorData = imageToPytorchTensor(rawImageData.data, size, size);
        return {
            tensor: new Tensor('float32', tensorData, [1, 3, size, size]),
            rawImageData,
        };
    }

    private processClassification(logits: Float32Array): Prediction[] {
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
        for (let i = 0; i < logits.length; i++) {
            predictions.push({
                classIndex: i,
                confidenceScore: expLogits[i] / sumExp,
            });
        }

        predictions.sort((a, b) => b.confidenceScore - a.confidenceScore);
        return predictions.slice(0, 5);
    }
}

export const mlPipeline = new MLPipeline();
