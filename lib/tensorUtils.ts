const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

export function imageToPytorchTensor(
    rgbaData: Uint8Array | Uint8ClampedArray,
    width: number = 224,
    height: number = 224
): Float32Array {
    const float32Data = new Float32Array(3 * width * height);
    const channelSize = width * height;

    for (let i = 0; i < channelSize; i++) {
        const r = rgbaData[i * 4] / 255.0;
        const g = rgbaData[i * 4 + 1] / 255.0;
        const b = rgbaData[i * 4 + 2] / 255.0;

        const normR = (r - MEAN[0]) / STD[0];
        const normG = (g - MEAN[1]) / STD[1];
        const normB = (b - MEAN[2]) / STD[2];

        float32Data[i] = normR;
        float32Data[channelSize + i] = normG;
        float32Data[2 * channelSize + i] = normB;
    }

    return float32Data;
}
