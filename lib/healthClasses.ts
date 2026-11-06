

export const PEST_CLASSES: Record<
    number,
    {
        name: string;
        severity: 'None' | 'Low' | 'Medium' | 'High';
        treatment: string;
    }
> = {
    '0': {
        name: 'Aphids',
        severity: 'Medium',
        treatment:
            'Rinse the shoots with water or spray insecticidal soap. Ladybirds and lacewings usually catch up within a week.',
    },
    '1': {
        name: 'Ladybirds',
        severity: 'None',
        treatment:
            'Beneficial. Ladybirds eat aphids and other soft-bodied pests; leave them on the plant.',
    },
    '2': {
        name: 'Green lacewings',
        severity: 'None',
        treatment:
            'Beneficial. Lacewing larvae are voracious aphid predators; do not spray where they are present.',
    },
    '3': {
        name: 'Hoverflies',
        severity: 'None',
        treatment:
            'Beneficial. Hoverfly larvae eat aphids and the adults pollinate; keep flowers nearby.',
    },
    '4': {
        name: 'Bees',
        severity: 'None',
        treatment:
            'Beneficial pollinators. Never spray an open flower while bees are working it.',
    },
    '5': {
        name: 'Whiteflies',
        severity: 'Medium',
        treatment:
            'Hang yellow sticky traps and spray the underside of leaves with insecticidal soap every few days.',
    },
    '6': {
        name: 'Mealybugs',
        severity: 'Medium',
        treatment:
            'Dab the white clusters with an alcohol-soaked cotton bud, then treat with insecticidal soap.',
    },
    '7': {
        name: 'Scale insects',
        severity: 'Medium',
        treatment:
            'Scrape the shells off by hand and apply horticultural oil in the dormant season.',
    },
    '8': {
        name: 'Thrips',
        severity: 'Medium',
        treatment:
            'Use blue sticky traps, improve airflow and spray with spinosad or insecticidal soap.',
    },
    '9': {
        name: 'Spider mites',
        severity: 'High',
        treatment:
            'Raise humidity, rinse the leaf undersides with water and repeat every three days; use a miticide if it persists.',
    },
    '10': {
        name: 'Ants',
        severity: 'Low',
        treatment:
            'Ants farm aphids for honeydew. Follow the trail to the nest and block it, rather than spraying the plant.',
    },
    '11': {
        name: 'Spiders',
        severity: 'None',
        treatment:
            'Beneficial. Spiders hunt insects; leave webs in the corners and check plants before watering.',
    },
    '12': {
        name: 'Snails and slugs',
        severity: 'High',
        treatment:
            'Handpick after dark, set copper or sand barriers and use iron-phosphate bait around the pot.',
    },
    '13': {
        name: 'Owlet moths',
        severity: 'High',
        treatment:
            'Pick caterpillars off at dusk and apply Bacillus thuringiensis (Bt) while they are still small.',
    },
    '14': {
        name: 'Whites and yellows',
        severity: 'Medium',
        treatment:
            'Cabbage whites lay on brassicas. Net the crop or apply Bt to the caterpillars.',
    },
    '15': {
        name: 'Weevils',
        severity: 'High',
        treatment:
            'Remove and destroy affected plants; beneficial nematodes in the soil control the larvae.',
    },
    '16': {
        name: 'Leafhoppers',
        severity: 'Medium',
        treatment:
            'Yellow sticky traps and insecticidal soap on the leaf undersides; keep weeds down nearby.',
    },
    '17': {
        name: 'Plant bugs',
        severity: 'Low',
        treatment:
            'Usually cosmetic damage. Prune the affected tips and avoid over-fertilising with nitrogen.',
    },
    '18': {
        name: 'Stink bugs',
        severity: 'Medium',
        treatment:
            'Handpick into soapy water, use pheromone traps and keep the garden free of tall weeds.',
    },
    '19': {
        name: 'Grasshoppers',
        severity: 'Medium',
        treatment:
            'Net young plants and keep grass and weeds short around the beds.',
    },
    '20': {
        name: 'Cockroaches and termites',
        severity: 'Low',
        treatment:
            'Not a plant pest. Remove damp hiding places and food scraps; no plant treatment needed.',
    },
    '21': {
        name: 'Earwigs',
        severity: 'Low',
        treatment:
            'Mostly scavengers. Trap with rolled newspaper and keep mulch away from stems.',
    },
    '22': {
        name: 'No insect',
        severity: 'None',
        treatment:
            'No insect detected in this photo.',
    },
};
