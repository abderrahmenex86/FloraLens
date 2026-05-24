import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as jpeg from 'jpeg-js';
import * as base64js from 'base64-js';
import { imageToPytorchTensor } from './tensorUtils';
import { Asset } from 'expo-asset';

export interface Prediction {
    classIndex: number;
    confidenceScore: number;
}

class MLPipeline {
    private plantSession: InferenceSession | null = null;
    private isInitializing = false;

    async init() {
        if (this.plantSession || this.isInitializing) return;
        this.isInitializing = true;

        try {
            console.log('Loading ONNX plant model...');
            const modelAsset = Asset.fromModule(
                require('../assets/models/plant_model.onnx')
            );
            await modelAsset.downloadAsync();
            const modelPath = modelAsset.localUri || modelAsset.uri;
            this.plantSession = await InferenceSession.create(modelPath);
            console.log('ONNX plant model loaded successfully.');
        } catch (error) {
            console.error('Failed to load ONNX model:', error);
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    async analyzePlant(base64Image: string) {
        if (!this.plantSession) {
            throw new Error(
                'Model session not initialized. Call init() first.'
            );
        }

        const imgBuffer = base64js.toByteArray(base64Image);

        const rawImageData = jpeg.decode(imgBuffer, { useTArray: true });

        const tensorData = imageToPytorchTensor(rawImageData.data, 224, 224);

        const tensor = new Tensor('float32', tensorData, [1, 3, 224, 224]);

        const inputName = this.plantSession.inputNames[0];
        const feeds: Record<string, Tensor> = {};
        feeds[inputName] = tensor;

        const results = await this.plantSession.run(feeds);

        const outputName = this.plantSession.outputNames[0];
        const outputTensor = results[outputName];

        return this.processLogits(outputTensor.data as Float32Array);
    }

    private processLogits(logits: Float32Array) {
        let maxIndex = 0;
        let maxValue = logits[0];

        for (let i = 1; i < logits.length; i++) {
            if (logits[i] > maxValue) {
                maxValue = logits[i];
                maxIndex = i;
            }
        }

        return {
            classIndex: maxIndex,
            confidenceScore: maxValue,
        };
    }
}

export const mlPipeline = new MLPipeline();
