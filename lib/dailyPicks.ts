import { PLANT_CLASSES } from './plantClasses';

/** Deterministic PRNG so the picks stay stable for the whole day. */
function mulberry32(seed: number) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export type DailyPick = { id: number; name: string; scientific: string };

/**
 * Three plants picked from the library, seeded by the local date so the set
 * changes at midnight and stays put while the screen is open.
 */
export function getDailyPicks(count = 3, date = new Date()): DailyPick[] {
    const seed =
        date.getFullYear() * 10000 +
        (date.getMonth() + 1) * 100 +
        date.getDate();
    const random = mulberry32(seed);
    const ids = Object.keys(PLANT_CLASSES).map(Number);
    const chosen = new Set<number>();

    while (chosen.size < Math.min(count, ids.length)) {
        chosen.add(ids[Math.floor(random() * ids.length)]);
    }

    return [...chosen].map((id) => ({ id, ...PLANT_CLASSES[id] }));
}
