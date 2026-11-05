import { getInstalledPlantImages, getPlantThumbnail } from './plantPack';

/**
 * One bundled thumbnail per species; full-resolution reference photos only
 * when the optional offline pack is installed.
 */
export function getPlantImages(classId: number): (number | string)[] {
    const full = getInstalledPlantImages(classId);
    if (full.length) return full;
    const thumb = getPlantThumbnail(classId);
    return thumb ? [thumb] : [];
}

export function getPlantCover(classId: number): number | string | null {
    return getPlantThumbnail(classId);
}
