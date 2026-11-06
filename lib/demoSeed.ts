import { Asset } from 'expo-asset';
import { manipulateAsync } from 'expo-image-manipulator';
import { mlPipeline } from './mlPipeline';
import { getPlantCover } from './plantAssets';
import {
    deleteScan,
    getGardenPlants,
    getScanHistory,
    removeFromGarden,
    saveScan,
    saveScanToGarden,
    setWateringDays,
    waterPlant,
} from './storage';
import { syncWateringNotifications } from './watering';

const DAY_MS = 24 * 60 * 60 * 1000;

type DemoScan = {
    classId: number;
    /** Scan happened this many days ago. */
    daysAgo: number;
    /** Put it in the garden with this interval. */
    garden?: {
        wateringDays: number;
        /** Days from today until it is due; negative means overdue. */
        dueInDays: number;
    };
};

/**
 * A believable week of garden use: ten scans, five of them saved to the
 * garden. Due dates are relative to today so the calendar always has dots and
 * the Home screen has something to water.
 */
const DEMO_SCANS: DemoScan[] = [
    { classId: 0, daysAgo: 0, garden: { wateringDays: 3, dueInDays: -1 } },
    { classId: 5, daysAgo: 1, garden: { wateringDays: 14, dueInDays: 3 } },
    { classId: 56, daysAgo: 2, garden: { wateringDays: 7, dueInDays: 0 } },
    { classId: 1, daysAgo: 3, garden: { wateringDays: 7, dueInDays: 5 } },
    { classId: 10, daysAgo: 4 },
    { classId: 2, daysAgo: 5, garden: { wateringDays: 30, dueInDays: 20 } },
    { classId: 3, daysAgo: 6 },
    { classId: 33, daysAgo: 7 },
    { classId: 49, daysAgo: 8 },
    { classId: 7, daysAgo: 9 },
];

/**
 * Replaces the local scans and garden with demo data. Inference runs for real
 * on the bundled cover images, so confidence scores and alternatives match
 * what a live scan produces.
 */
export async function seedDemoData(): Promise<number> {
    for (const scan of getScanHistory()) deleteScan(scan.id);
    for (const plant of getGardenPlants()) removeFromGarden(plant.id);

    await mlPipeline.init();
    await mlPipeline.initHealthModels();

    let added = 0;

    for (const demo of DEMO_SCANS) {
        const cover = getPlantCover(demo.classId);
        if (!cover) continue;

        const asset = Asset.fromModule(cover);
        await asset.downloadAsync();
        const source = asset.localUri ?? asset.uri;

        const resized = await manipulateAsync(
            source,
            [{ resize: { width: 224, height: 224 } }],
            { compress: 1, base64: true },
        );
        if (!resized.base64) continue;

        const [plant, pest] = await Promise.all([
            mlPipeline.analyzePlant(resized.base64),
            mlPipeline.analyzePest(resized.base64),
        ]);

        const record = saveScan({
            imageUri: source,
            timestamp: Date.now() - demo.daysAgo * DAY_MS,
            diagnosis: {
                plant: plant.predictions,
                plantStats: plant.stats,
                pest: pest.predictions[0],
                pestStats: pest.stats,
            },
        });
        added += 1;

        if (!demo.garden) continue;
        saveScanToGarden(record);
        const entry = getGardenPlants().find(
            (plantEntry) => plantEntry.scanId === record.id,
        );
        if (!entry) continue;

        setWateringDays(entry.id, demo.garden.wateringDays);
        const wateredDaysAgo =
            demo.garden.wateringDays - demo.garden.dueInDays;
        waterPlant(entry.id, Date.now() - wateredDaysAgo * DAY_MS);
    }

    await syncWateringNotifications(getGardenPlants()).catch(() => {});
    return added;
}
