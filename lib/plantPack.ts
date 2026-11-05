import { Directory, File, Paths } from 'expo-file-system';
import { storage } from './storage';
import { PLANT_THUMBS } from './plantThumbs';

export const PLANT_PACK_URL =
    process.env.EXPO_PUBLIC_PLANT_PACK_URL?.trim() ?? '';

const PACK_ROOT_NAME = 'plant-pack';
const PACK_INDEX_KEY = 'plant_pack_index';

export interface PlantPackImage {
    class_id: number;
    path: string;
    bytes: number;
    sha256: string;
    width: number;
    height: number;
    license?: string;
    thumb?: string;
}

export interface PlantPackManifest {
    version: string;
    base_url: string;
    thumb_bytes: number;
    full_bytes: number;
    image_count: number;
    class_count: number;
    images: PlantPackImage[];
}

interface PackIndex {
    version: string;
    bytes: number;
    files: Record<string, string[]>;
}

export interface PlantPackStatus {
    installed: boolean;
    version: string | null;
    imageCount: number;
    bytes: number;
    configured: boolean;
}

function packRoot(): Directory {
    return new Directory(Paths.document, PACK_ROOT_NAME);
}

function readIndex(): PackIndex | null {
    const raw = storage.getString(PACK_INDEX_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as PackIndex;
    } catch {
        return null;
    }
}

export function getPlantPackStatus(): PlantPackStatus {
    const index = readIndex();
    return {
        installed: Boolean(index),
        version: index?.version ?? null,
        imageCount: index ?
            Object.values(index.files).reduce((sum, files) => sum + files.length, 0)
        :   0,
        bytes: index?.bytes ?? 0,
        configured: Boolean(PLANT_PACK_URL),
    };
}

export function getInstalledPlantImages(classId: number): string[] {
    const index = readIndex();
    const files = index?.files?.[String(classId)];
    if (!files?.length) return [];
    return files
        .map((relative) => new File(packRoot(), relative))
        .filter((file) => file.exists)
        .map((file) => file.uri);
}

export function getPlantThumbnail(classId: number): number | null {
    return PLANT_THUMBS[classId] ?? null;
}

export function getPlantImages(classId: number): (number | string)[] {
    const full = getInstalledPlantImages(classId);
    if (full.length) return full;
    const thumb = getPlantThumbnail(classId);
    return thumb ? [thumb] : [];
}

export async function deletePlantPack(): Promise<void> {
    const root = packRoot();
    if (root.exists) root.delete();
    storage.remove(PACK_INDEX_KEY);
}

export async function downloadPlantPack(
    onProgress?: (done: number, total: number) => void,
): Promise<PlantPackStatus> {
    if (!PLANT_PACK_URL) {
        throw new Error(
            'The offline photo pack is not configured. Set EXPO_PUBLIC_PLANT_PACK_URL.',
        );
    }
    const response = await fetch(PLANT_PACK_URL);
    if (!response.ok) {
        throw new Error(`Could not fetch the pack manifest (${response.status}).`);
    }
    const manifest = (await response.json()) as PlantPackManifest;
    if (!manifest.images?.length) {
        throw new Error('The pack manifest has no images.');
    }

    await deletePlantPack();
    const root = packRoot();
    root.create({ intermediates: true, idempotent: true });

    const base = manifest.base_url ||
        PLANT_PACK_URL.slice(0, PLANT_PACK_URL.lastIndexOf('/') + 1);
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;

    const classes = new Set(manifest.images.map((image) => image.class_id));
    for (const classId of classes) {
        new Directory(root, 'full', String(classId)).create({
            intermediates: true,
            idempotent: true,
        });
    }

    let cursor = 0;
    let done = 0;
    let bytes = 0;
    const total = manifest.images.length;

    const worker = async () => {
        while (cursor < manifest.images.length) {
            const image = manifest.images[cursor++];
            const destination = new File(root, image.path);
            const url = `${normalizedBase}${image.path}`;
            const file = await File.downloadFileAsync(url, destination, {
                idempotent: true,
            });
            const size = file.info().size ?? 0;
            if (size !== image.bytes) {
                throw new Error(
                    `Photo check failed for ${image.path}: expected ${image.bytes} bytes, got ${size}.`,
                );
            }
            bytes += size;
            done += 1;
            onProgress?.(done, total);
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(4, total) }, () => worker()),
    );

    const files: Record<string, string[]> = {};
    for (const image of manifest.images) {
        const key = String(image.class_id);
        (files[key] ??= []).push(image.path);
    }
    const index: PackIndex = {
        version: manifest.version,
        bytes,
        files,
    };
    storage.set(PACK_INDEX_KEY, JSON.stringify(index));
    return getPlantPackStatus();
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}
