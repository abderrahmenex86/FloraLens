/**
 * Deterministic input gate.
 *
 * The classifier is overconfident on out-of-distribution frames: a black or
 * blank image still produces a high softmax score, so the confidence and
 * margin checks in `processClassification` never fire. These checks look at the
 * pixels instead and run before any inference.
 *
 * Thresholds were calibrated on the 364 library thumbnails (224px):
 *   luma mean  min 21.8, std min 19.4, flat-tile ratio max 0.70
 * Black, white and single-colour frames sit at std 0 / flat ratio 1.0.
 */
export const GATE = {
    /** Below this mean luma the frame is too dark to classify. */
    darkMean: 12,
    /** Global contrast below this means a flat frame. */
    minStd: 6,
    /** Share of 8x8 tiles with almost no contrast. */
    maxFlatRatio: 0.85,
    tileSize: 8,
    tileStd: 4,
} as const;

export type GateReason = 'dark' | 'flat';

export interface InputCheck {
    ok: boolean;
    reason?: GateReason;
    message?: string;
    metrics: {
        mean: number;
        std: number;
        flatRatio: number;
    };
}

const MESSAGES: Record<GateReason, string> = {
    dark: 'That photo is too dark. Try again in better light.',
    flat: 'No plant detected in that photo. Point the camera at a leaf.',
};

function failure(reason: GateReason, metrics: InputCheck['metrics']): InputCheck {
    return { ok: false, reason, message: MESSAGES[reason], metrics };
}

/**
 * @param rgba RGBA bytes as returned by jpeg-js.
 */
export function assessRgba(
    rgba: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number,
): InputCheck {
    const pixels = width * height;
    if (pixels <= 0 || rgba.length < pixels * 4) {
        return failure('flat', { mean: 0, std: 0, flatRatio: 1 });
    }

    const luma = new Float32Array(pixels);
    let sum = 0;

    for (let i = 0; i < pixels; i++) {
        const r = rgba[i * 4];
        const g = rgba[i * 4 + 1];
        const b = rgba[i * 4 + 2];
        const value = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        luma[i] = value;
        sum += value;
    }

    const mean = sum / pixels;

    let variance = 0;
    for (let i = 0; i < pixels; i++) {
        const delta = luma[i] - mean;
        variance += delta * delta;
    }
    const std = Math.sqrt(variance / pixels);

    let tiles = 0;
    let flatTiles = 0;
    const tile = GATE.tileSize;

    for (let ty = 0; ty + tile <= height; ty += tile) {
        for (let tx = 0; tx + tile <= width; tx += tile) {
            let tileSum = 0;
            for (let y = 0; y < tile; y++) {
                const row = (ty + y) * width + tx;
                for (let x = 0; x < tile; x++) {
                    tileSum += luma[row + x];
                }
            }
            const tileMean = tileSum / (tile * tile);

            let tileVariance = 0;
            for (let y = 0; y < tile; y++) {
                const row = (ty + y) * width + tx;
                for (let x = 0; x < tile; x++) {
                    const delta = luma[row + x] - tileMean;
                    tileVariance += delta * delta;
                }
            }

            tiles++;
            if (Math.sqrt(tileVariance / (tile * tile)) < GATE.tileStd) {
                flatTiles++;
            }
        }
    }

    const flatRatio = tiles === 0 ? 1 : flatTiles / tiles;
    const metrics = { mean, std, flatRatio };

    if (mean < GATE.darkMean) return failure('dark', metrics);
    if (std < GATE.minStd || flatRatio > GATE.maxFlatRatio) {
        return failure('flat', metrics);
    }

    return { ok: true, metrics };
}
