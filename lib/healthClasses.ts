export const DISEASE_CLASSES: Record<
    number,
    {
        name: string;
        severity: 'None' | 'Low' | 'Medium' | 'High';
        treatment: string;
    }
> = {
    '0': {
        name: 'Healthy',
        severity: 'None',
        treatment: 'Continue your current care routine. Plant is thriving!',
    },
    '1': {
        name: 'Apple Black Rot',
        severity: 'High',
        treatment:
            'Prune infected cankers and branches. Clear fallen mummified fruit and leaves. Apply a copper-based fungicide in early spring.',
    },
    '2': {
        name: 'Apple Mosaic Virus',
        severity: 'Medium',
        treatment:
            'No chemical cure exists. Prune out symptomatic branches to slow spread, control insect vectors, and use virus-free rootstock next time.',
    },
    '3': {
        name: 'Apple Rust',
        severity: 'Medium',
        treatment:
            'Remove nearby alternate hosts (such as junipers). Apply preventative fungicides containing myclobutanil during bud break.',
    },
    '4': {
        name: 'Apple Scab',
        severity: 'High',
        treatment:
            'Rake and destroy fallen leaves in autumn. Prune the canopy to improve airflow. Apply sulfur- or copper-based fungicides in wet seasons.',
    },
    '5': {
        name: 'Banana Anthracnose',
        severity: 'Medium',
        treatment:
            'Remove infected leaves and blossoms. Avoid overhead irrigation. Apply protectant fungicides like chlorothalonil if needed.',
    },
    '6': {
        name: 'Banana Black Leaf Streak',
        severity: 'High',
        treatment:
            'Ensure wide plant spacing for airflow. Prune heavily spotted leaves. Apply systemic fungicides in rotation to prevent resistance.',
    },
    '7': {
        name: 'Banana Bunchy Top',
        severity: 'High',
        treatment:
            'No cure. Promptly eradicate infected plants by injecting with herbicide or digging them up. Control the banana aphid vector.',
    },
    '8': {
        name: 'Banana Cigar End Rot',
        severity: 'Medium',
        treatment:
            'Remove pistils and decaying perianths by hand after flowering. Improve field sanitation and apply protective fungicides to young bunches.',
    },
    '9': {
        name: 'Banana Cordana Leaf Spot',
        severity: 'Medium',
        treatment:
            'Deleaf severely affected leaves to reduce inoculum. Improve drainage and soil nutrition, and spray fungicides if infection is severe.',
    },
    '10': {
        name: 'Banana Panama Disease',
        severity: 'High',
        treatment:
            'No effective chemical treatment. Quarantine the affected area immediately. Grow resistant banana cultivars and sanitize tools.',
    },
    '11': {
        name: 'Basil Downy Mildew',
        severity: 'High',
        treatment:
            'Water from below to keep leaves dry. Improve ventilation. If infection occurs, apply copper fungicides or plant-essential oil sprays.',
    },
    '12': {
        name: 'Bean Halo Blight',
        severity: 'Medium',
        treatment:
            'Avoid working in the field when plants are wet. Apply copper-based bactericides early in the season and destroy crop debris.',
    },
    '13': {
        name: 'Bean Mosaic Virus',
        severity: 'Medium',
        treatment:
            'No chemical cure. Eradicate infected plants immediately. Control aphid populations and sow certified disease-free seeds.',
    },
    '14': {
        name: 'Bean Rust',
        severity: 'Medium',
        treatment:
            'Remove infected plant debris after harvest. Rotate crops. Apply sulfur or appropriate fungicides at the first sign of rust pustules.',
    },
    '15': {
        name: 'Bell Pepper Bacterial Spot',
        severity: 'High',
        treatment:
            'Remove infected leaves. Spray copper fungicides mixed with mancozeb to prevent spread. Avoid overhead watering.',
    },
    '16': {
        name: 'Bell Pepper Blossom End Rot',
        severity: 'Low',
        treatment:
            'Ensure consistent watering to maintain soil moisture. Apply a calcium-rich soil amendment or foliar calcium spray.',
    },
    '17': {
        name: 'Bell Pepper Frogeye Leaf Spot',
        severity: 'Medium',
        treatment:
            'Rotate crops annually. Remove fallen plant debris. Treat with chlorothalonil or copper fungicides during warm, humid weather.',
    },
    '18': {
        name: 'Bell Pepper Powdery Mildew',
        severity: 'Medium',
        treatment:
            'Apply sulfur, potassium bicarbonate, or neem oil to the foliage. Ensure good spacing for proper air circulation.',
    },
    '19': {
        name: 'Blueberry Anthracnose',
        severity: 'High',
        treatment:
            'Prune out dead wood in the winter. Apply protectant fungicides from bud break through harvest, keeping ripe fruit harvested.',
    },
    '20': {
        name: 'Blueberry Botrytis Blight',
        severity: 'Medium',
        treatment:
            'Prune bushes to maximize sunlight penetration. Apply fungicides during bloom when conditions are wet and cool.',
    },
    '21': {
        name: 'Blueberry Mummy Berry',
        severity: 'High',
        treatment:
            'Rake and bury or destroy fallen mummified berries. Apply fresh mulch to cover fungal spores. Treat with fungicides in early spring.',
    },
    '22': {
        name: 'Blueberry Rust',
        severity: 'Medium',
        treatment:
            'Prune lower branches to increase airflow. Spray sulfur-based fungicides post-harvest. Clean up fallen leaves.',
    },
    '23': {
        name: 'Blueberry Scorch',
        severity: 'High',
        treatment:
            'No cure. Remove and burn infected bushes immediately. Control the aphid vectors to prevent transmission to healthy plants.',
    },
    '24': {
        name: 'Broccoli Alternaria Leaf Spot',
        severity: 'Medium',
        treatment:
            'Practice a 3-year crop rotation. Water at the base. Apply copper fungicides or biological controls at first sign of spots.',
    },
    '25': {
        name: 'Broccoli Downy Mildew',
        severity: 'Medium',
        treatment:
            'Ensure excellent air circulation. Avoid late-day overhead watering. Spray copper fungicides or systemic downy mildew treatments.',
    },
    '26': {
        name: 'Broccoli Ring Spot',
        severity: 'Medium',
        treatment:
            'Remove and destroy brassica crop residue post-harvest. Apply protective fungicides if wet weather persists.',
    },
    '27': {
        name: 'Cabbage Alternaria Leaf Spot',
        severity: 'Medium',
        treatment:
            'Practice crop rotation and use hot-water treated seeds. Apply copper fungicides to manage outbreaks during wet spells.',
    },
    '28': {
        name: 'Cabbage Black Rot',
        severity: 'High',
        treatment:
            'Remove infected plants immediately. Avoid sprinkler irrigation. Clean all tools. Apply a preventative copper-based bactericide.',
    },
    '29': {
        name: 'Cabbage Downy Mildew',
        severity: 'Medium',
        treatment:
            'Avoid planting closely. Water in the morning. Treat plants with sulfur, copper, or systemic downy mildew fungicides.',
    },
    '30': {
        name: 'Carrot Alternaria Leaf Blight',
        severity: 'Medium',
        treatment:
            'Rotate crops with non-umbelliferous plants. Apply fungicides when canopy closes or when symptoms first appear.',
    },
    '31': {
        name: 'Carrot Cavity Spot',
        severity: 'High',
        treatment:
            'Improve soil drainage and avoid overwatering. Use metalaxyl-M fungicides during planting or early growth stages.',
    },
    '32': {
        name: 'Carrot Cercospora Leaf Blight',
        severity: 'Medium',
        treatment:
            'Avoid overhead watering. Maintain crop rotations. Apply copper fungicides or chlorothalonil at the first sign of lesions.',
    },
    '33': {
        name: 'Cauliflower Alternaria Leaf Spot',
        severity: 'Medium',
        treatment:
            'Remove all brassica crop debris. Apply copper fungicides or sulfur-based protectants as a preventative measure.',
    },
    '34': {
        name: 'Cauliflower Bacterial Soft Rot',
        severity: 'High',
        treatment:
            'Minimize mechanical wounding during cultivation. Apply copper bactericides to minimize risk in high moisture conditions.',
    },
    '35': {
        name: 'Celery Anthracnose',
        severity: 'Medium',
        treatment:
            'Clean up plant debris and rotate fields. Apply preventative fungicides such as chlorothalonil during warm, wet periods.',
    },
    '36': {
        name: 'Celery Early Blight',
        severity: 'Medium',
        treatment:
            'Avoid working in fields when foliage is wet. Rotate crops. Spray copper fungicides or biological agents to manage infection.',
    },
    '37': {
        name: 'Cherry Leaf Spot',
        severity: 'High',
        treatment:
            'Rake and destroy fallen leaves in autumn. Prune the tree canopy. Apply chlorothalonil or copper fungicides starting at petal fall.',
    },
    '38': {
        name: 'Cherry Powdery Mildew',
        severity: 'Medium',
        treatment:
            'Prune for optimal light penetration. Apply sulfur, potassium bicarbonate, or horticultural oil at the first sign of white dust.',
    },
    '39': {
        name: 'Citrus Canker',
        severity: 'High',
        treatment:
            'Apply copper-based sprays preventatively to protect young foliage. Prune infected twigs and immediately sanitize all pruning tools.',
    },
    '40': {
        name: 'Citrus Greening Disease',
        severity: 'High',
        treatment:
            'No cure. Promptly remove and destroy infected trees. Control the Asian citrus psyllid vector with insecticide or biological controls.',
    },
    '41': {
        name: 'Coffee Berry Blotch',
        severity: 'Medium',
        treatment:
            'Improve light penetration by pruning coffee shade trees. Apply copper fungicides during flowering and early berry development.',
    },
    '42': {
        name: 'Coffee Black Rot',
        severity: 'High',
        treatment:
            'Prune out and burn infected twigs and leaves. Improve aeration in the plantation and apply systemic copper fungicides.',
    },
    '43': {
        name: 'Coffee Brown Eye Spot',
        severity: 'Medium',
        treatment:
            'Correct soil nitrogen levels. Maintain moderate shade over coffee bushes. Apply preventative copper fungicides if symptoms worsen.',
    },
    '44': {
        name: 'Coffee Leaf Rust',
        severity: 'High',
        treatment:
            'Prune to manage shade and airflow. Apply protective copper fungicides before the rainy season. Plant rust-resistant cultivars.',
    },
    '45': {
        name: 'Corn Gray Leaf Spot',
        severity: 'Medium',
        treatment:
            'Rotate crops with non-grasses. Till crop residues under the soil. Apply foliar fungicides prior to or during tasseling.',
    },
    '46': {
        name: 'Corn Northern Leaf Blight',
        severity: 'Medium',
        treatment:
            'Plant resistant hybrids. Manage crop debris via tillage. Apply triazole or strobilurin fungicides if symptoms appear early.',
    },
    '47': {
        name: 'Corn Rust',
        severity: 'Low',
        treatment:
            'Apply foliar fungicides only if rust is severe and occurs prior to silking. Plant resistant corn hybrids.',
    },
    '48': {
        name: 'Corn Smut',
        severity: 'Low',
        treatment:
            'Hand-remove and destroy the black fungal galls before they rupture and release spores. Avoid damaging stalks during weeding.',
    },
    '49': {
        name: 'Cucumber Angular Leaf Spot',
        severity: 'Medium',
        treatment:
            'Avoid overhead watering. Apply copper-based bactericides early in the disease cycle and practice crop rotation.',
    },
    '50': {
        name: 'Cucumber Bacterial Wilt',
        severity: 'High',
        treatment:
            'No cure. Immediately destroy wilted plants. Control the cucumber beetle vectors using organic or chemical insecticides.',
    },
    '51': {
        name: 'Cucumber Powdery Mildew',
        severity: 'Medium',
        treatment:
            'Ensure good spacing. Apply neem oil, sulfur-based fungicides, or potassium bicarbonate sprays to both sides of the leaves.',
    },
    '52': {
        name: 'Eggplant Cercospora Leaf Spot',
        severity: 'Medium',
        treatment:
            'Collect and destroy crop residues. Mulch the soil to prevent spore splash-back. Apply copper fungicides if severe.',
    },
    '53': {
        name: 'Eggplant Phomopsis Fruit Rot',
        severity: 'High',
        treatment:
            'Use disease-free seeds. Prune lower leaves to reduce splash infection. Spray with chlorothalonil or copper fungicides.',
    },
    '54': {
        name: 'Eggplant Phytophthora Blight',
        severity: 'High',
        treatment:
            'Plant in raised beds to ensure good drainage. Avoid overhead watering. Apply systemic fungicides in wet seasons.',
    },
    '55': {
        name: 'Garlic Leaf Blight',
        severity: 'Medium',
        treatment:
            'Rotate garlic crops with non-alliums. Avoid excessive watering. Apply preventative fungicides like chlorothalonil or copper.',
    },
    '56': {
        name: 'Garlic Rust',
        severity: 'Medium',
        treatment:
            'Space plants out to allow foliage to dry. Apply copper or sulfur fungicides immediately at the first sign of orange pustules.',
    },
    '57': {
        name: 'Ginger Leaf Spot',
        severity: 'Medium',
        treatment:
            'Ensure well-draining soil. Remove infected leaves. Apply copper-based fungicides when symptoms are first noted.',
    },
    '58': {
        name: 'Ginger Sheath Blight',
        severity: 'High',
        treatment:
            'Avoid waterlogging. Apply bio-fungicides like Trichoderma or chemical fungicides to the soil and stems if necessary.',
    },
    '59': {
        name: 'Grape Black Rot',
        severity: 'High',
        treatment:
            'Prune diseased canes and remove mummified grapes in winter. Spray protective fungicides from bud break until fruit set.',
    },
    '60': {
        name: 'Grape Downy Mildew',
        severity: 'High',
        treatment:
            'Prune for air circulation. Keep grapevines trained off the ground. Apply copper or phosphorus acid-based fungicides.',
    },
    '61': {
        name: 'Grape Leaf Spot',
        severity: 'Medium',
        treatment:
            'Clean up fallen leaf debris. Apply copper-based fungicides as a preventative measure during the wet spring.',
    },
    '62': {
        name: 'Grapevine Leafroll Disease',
        severity: 'High',
        treatment:
            'No cure. Remove infected grapevines. Control scale insects and mealybugs, which are the primary vectors of the virus.',
    },
    '63': {
        name: 'Lettuce Downy Mildew',
        severity: 'Medium',
        treatment:
            'Keep leaf surfaces dry by watering early in the day. Apply copper fungicides or systemic downy mildew treatments.',
    },
    '64': {
        name: 'Lettuce Mosaic Virus',
        severity: 'High',
        treatment:
            'Remove and discard infected lettuce plants. Control aphid vectors using insecticidal soaps and sow certified virus-free seeds.',
    },
    '65': {
        name: 'Maple Tar Spot',
        severity: 'Low',
        treatment:
            'Rake up and destroy fallen leaves in autumn to prevent overwintering spores. Chemical treatments are rarely needed.',
    },
    '66': {
        name: 'Peach Anthracnose',
        severity: 'High',
        treatment:
            'Prune dead wood and remove mummified peaches. Apply copper fungicides at leaf fall and during early pink bud stage.',
    },
    '67': {
        name: 'Peach Brown Rot',
        severity: 'High',
        treatment:
            'Prune infected twigs. Remove all mummified fruit on the tree and ground. Apply fungicides during bloom and before harvest.',
    },
    '68': {
        name: 'Peach Leaf Curl',
        severity: 'High',
        treatment:
            'Apply a single, thorough spray of copper fungicide or chlorothalonil in late autumn or early spring before bud swell.',
    },
    '69': {
        name: 'Peach Rust',
        severity: 'Medium',
        treatment:
            'Ensure good ventilation in the orchard. Spray sulfur- or copper-based fungicides from late spring through harvest if rust appears.',
    },
    '70': {
        name: 'Peach Scab',
        severity: 'Medium',
        treatment:
            'Prune tree to open up the canopy. Apply protectant fungicides starting at shuck split and repeat every 10–14 days as needed.',
    },
    '71': {
        name: 'Plum Bacterial Spot',
        severity: 'High',
        treatment:
            'Avoid excess nitrogen fertilizer. Spray copper bactericides in late autumn and during early spring before blossom.',
    },
    '72': {
        name: 'Plum Brown Rot',
        severity: 'High',
        treatment:
            'Remove and destroy diseased plums and cankers. Treat trees with preventative fungicides from bloom to harvest.',
    },
    '73': {
        name: 'Plum Pocket Disease',
        severity: 'Medium',
        treatment:
            'Prune out infected twigs and remove swollen plums. Apply a copper fungicide spray in early spring before buds open.',
    },
    '74': {
        name: 'Plum Pox Virus',
        severity: 'High',
        treatment:
            'No cure. Promptly remove and burn infected trees. Quarantine affected areas and manage aphid vectors.',
    },
    '75': {
        name: 'Plum Rust',
        severity: 'Medium',
        treatment:
            'Rake and burn fallen leaves. Apply protective fungicides containing sulfur or copper at the first sign of leaf pustules.',
    },
    '76': {
        name: 'Potato Early Blight',
        severity: 'Medium',
        treatment:
            'Maintain plant vigor with balanced fertilizing. Apply copper- or chlorothalonil-based fungicides once symptoms appear on lower leaves.',
    },
    '77': {
        name: 'Potato Late Blight',
        severity: 'High',
        treatment:
            'Destroy infected plants immediately. Apply protective copper fungicides weekly during wet, cool weather. Destroy crop debris after harvest.',
    },
    '78': {
        name: 'Raspberry Fire Blight',
        severity: 'High',
        treatment:
            'Prune infected canes 8 inches below visible damage using sanitized tools. Apply copper sprays during early bloom.',
    },
    '79': {
        name: 'Raspberry Gray Mold',
        severity: 'Medium',
        treatment:
            'Ensure wide plant spacing for sunlight and airflow. Harvest ripe fruit promptly. Apply bio-fungicides during the bloom period.',
    },
    '80': {
        name: 'Raspberry Leaf Spot',
        severity: 'Medium',
        treatment:
            'Prune floricanes immediately after harvest. Rake up leaf debris. Spray copper-based fungicides if infections are severe.',
    },
    '81': {
        name: 'Raspberry Yellow Rust',
        severity: 'Medium',
        treatment:
            'Remove lower leaves to minimize spore splash. Prune canes to increase airflow. Treat with sulfur-based fungicides in early spring.',
    },
    '82': {
        name: 'Rice Blast',
        severity: 'High',
        treatment:
            'Avoid excess nitrogen fertilizer. Maintain proper water levels in paddies. Apply systemic fungicides like tricyclazole if blast occurs.',
    },
    '83': {
        name: 'Rice Sheath Blight',
        severity: 'High',
        treatment:
            'Remove weeds that act as alternate hosts. Avoid high density planting. Apply fungicides like hexaconazole when symptoms appear.',
    },
    '84': {
        name: 'Soybean Bacterial Blight',
        severity: 'Medium',
        treatment:
            'Avoid cultivating fields when plants are wet. Crop rotation with corn or wheat. Copper bactericides can be applied if severe.',
    },
    '85': {
        name: 'Soybean Brown Spot',
        severity: 'Low',
        treatment:
            'Rotate crops with non-legumes. Deep till crop residues. Fungicides are rarely economical unless severe early-season infection occurs.',
    },
    '86': {
        name: 'Soybean Downy Mildew',
        severity: 'Low',
        treatment:
            'Utilize resistant cultivars. Plant certified clean seed. Apply foliar fungicides only in cases of high economic risk.',
    },
    '87': {
        name: 'Soybean Frog Eye Leaf Spot',
        severity: 'Medium',
        treatment:
            'Rotate crops and till residues under. Treat with strobilurin or triazole fungicides at R3 growth stage if symptoms expand.',
    },
    '88': {
        name: 'Soybean Mosaic',
        severity: 'Medium',
        treatment:
            'No cure. Remove infected plants. Control aphid vectors and use certified virus-free seed varieties.',
    },
    '89': {
        name: 'Soybean Rust',
        severity: 'High',
        treatment:
            'Monitor fields closely. Apply triazole or strobilurin fungicides at the very first detection of rust pustules in the canopy.',
    },
    '90': {
        name: 'Squash Powdery Mildew',
        severity: 'Medium',
        treatment:
            'Avoid overhead watering. Spray foliage with sulfur, neem oil, or potassium bicarbonate solutions weekly to suppress spores.',
    },
    '91': {
        name: 'Strawberry Anthracnose',
        severity: 'High',
        treatment:
            'Avoid overhead watering; use drip lines. Mulch with straw to prevent soil splash. Apply protective fungicides during flowering.',
    },
    '92': {
        name: 'Strawberry Leaf Scorch',
        severity: 'Medium',
        treatment:
            'Prune excess runners to improve airflow. Clean up dry leaves. Spray copper fungicides or chlorothalonil early in the season.',
    },
    '93': {
        name: 'Tobacco Blue Mold',
        severity: 'High',
        treatment:
            'Provide excellent ventilation in seedbeds. Apply fungicides containing metalaxyl or mancozeb at the first warning of blue mold.',
    },
    '94': {
        name: 'Tobacco Brown Spot',
        severity: 'Medium',
        treatment:
            'Practice crop rotation and avoid excess nitrogen. Destroy stalks immediately after harvest. Apply systemic fungicides if severe.',
    },
    '95': {
        name: 'Tobacco Frogeye Leaf Spot',
        severity: 'Medium',
        treatment:
            'Improve field drainage. Destroy residue post-harvest. Apply copper or chlorothalonil fungicides if spot count is high.',
    },
    '96': {
        name: 'Tobacco Mosaic Virus',
        severity: 'High',
        treatment:
            'No chemical treatment. Wash hands with milk or soap before handling plants. Immediately remove and destroy infected tobacco plants.',
    },
    '97': {
        name: 'Tomato Bacterial Leaf Spot',
        severity: 'High',
        treatment:
            'Avoid overhead watering. Spray copper fungicides mixed with mancozeb to prevent further bacterial spread.',
    },
    '98': {
        name: 'Tomato Early Blight',
        severity: 'Medium',
        treatment:
            'Prune lower branches to prevent soil contact. Apply mulch around base. Apply copper fungicides or chlorothalonil.',
    },
    '99': {
        name: 'Tomato Late Blight',
        severity: 'High',
        treatment:
            'Remove and destroy affected plants. Avoid overhead watering. Apply preventative copper fungicides during cool, wet weather.',
    },
    '100': {
        name: 'Tomato Leaf Mold',
        severity: 'Medium',
        treatment:
            'Improve air circulation in greenhouses. Water early to let leaves dry. Spray copper-based fungicides if necessary.',
    },
    '101': {
        name: 'Tomato Mosaic Virus',
        severity: 'High',
        treatment:
            'No cure. Remove and burn infected plants. Sanitize hands and tools frequently. Control weeds and insect vectors.',
    },
    '102': {
        name: 'Tomato Septoria Leaf Spot',
        severity: 'Medium',
        treatment:
            'Prune lower leaves to minimize soil splash. Apply straw mulch. Spray with copper fungicides or chlorothalonil.',
    },
    '103': {
        name: 'Tomato Yellow Leaf Curl Virus',
        severity: 'High',
        treatment:
            'No cure. Isolate and destroy infected plants. Cover plants with fine mesh and control whiteflies using insecticidal soap.',
    },
    '104': {
        name: 'Wheat Bacterial Leaf Streak (Black Chaff)',
        severity: 'Medium',
        treatment:
            'Use certified pathogen-free seeds. Avoid sprinkler irrigation. Rotate crops with non-cereal plants.',
    },
    '105': {
        name: 'Wheat Head Scab',
        severity: 'High',
        treatment:
            'Practice crop rotation with broadleaf plants. Apply triazole fungicides at the early flowering stage if weather is wet.',
    },
    '106': {
        name: 'Wheat Leaf Rust',
        severity: 'Medium',
        treatment:
            'Plant rust-resistant wheat varieties. Apply foliar fungicides (triazoles or strobilurins) if rust is found on flag leaves.',
    },
    '107': {
        name: 'Wheat Loose Smut',
        severity: 'High',
        treatment:
            'Fungal infection is inside the seed. Use carboxin- or triazole-based systemic seed treatments prior to sowing.',
    },
    '108': {
        name: 'Wheat Powdery Mildew',
        severity: 'Medium',
        treatment:
            'Avoid high seeding densities and excessive nitrogen. Apply systemic fungicides if mildew reaches upper leaves.',
    },
    '109': {
        name: 'Wheat Septoria Blotch',
        severity: 'Medium',
        treatment:
            'Incorporate wheat residues into the soil. Apply foliar fungicides early in the season if wet weather persists.',
    },
    '110': {
        name: 'Wheat Stem Rust',
        severity: 'High',
        treatment:
            'Plant resistant wheat cultivars. Apply systemic fungicides immediately upon detection to protect the crop.',
    },
    '111': {
        name: 'Wheat Stripe Rust',
        severity: 'High',
        treatment:
            'Sow resistant cultivars. Apply foliar fungicides early in the spring if stripe rust is reported in the area.',
    },
    '112': {
        name: 'Zucchini Bacterial Wilt',
        severity: 'High',
        treatment:
            'No treatment once infected. Promptly discard infected plants. Control cucumber beetles using insecticidal soap or neem oil.',
    },
    '113': {
        name: 'Zucchini Downy Mildew',
        severity: 'Medium',
        treatment:
            'Water plants at soil level. Space crops for good ventilation. Treat leaves with copper-based or systemic fungicides.',
    },
    '114': {
        name: 'Zucchini Powdery Mildew',
        severity: 'Medium',
        treatment:
            'Ensure plants have full sun. Apply sulfur, potassium bicarbonate, or neem oil to the leaves weekly.',
    },
    '115': {
        name: 'Zucchini Yellow Mosaic Virus',
        severity: 'High',
        treatment:
            'No chemical cure. Remove infected plants. Apply reflective mulches and spray insecticidal soap to control aphid vectors.',
    },
};

export const PEST_CLASSES: Record<
    number,
    {
        name: string;
        severity: 'None' | 'Low' | 'Medium' | 'High';
        treatment: string;
    }
> = {
    '0': {
        name: 'Rice leaf roller',
        severity: 'Medium',
        treatment:
            'Release trichogramma wasps, install light traps, or apply Bacillus thuringiensis (Bt) or neem oil.',
    },
    '1': {
        name: 'Rice leaf caterpillar',
        severity: 'Medium',
        treatment:
            'Handpick caterpillars, encourage insectivorous birds, or apply Bacillus thuringiensis (Bt) sprays.',
    },
    '2': {
        name: 'Paddy stem maggot',
        severity: 'Medium',
        treatment:
            'Maintain proper water depth in fields, remove weed hosts, and apply contact insecticides if thresholds are exceeded.',
    },
    '3': {
        name: 'Asiatic rice borer',
        severity: 'High',
        treatment:
            'Destroy crop stubble after harvest. Apply systemic insecticides or use sex pheromone traps to disrupt mating.',
    },
    '4': {
        name: 'Yellow rice borer',
        severity: 'High',
        treatment:
            'Install light traps to capture moths, plant resistant cultivars, and apply systemic insecticides in early infestation stages.',
    },
    '5': {
        name: 'Rice gall midge',
        severity: 'Medium',
        treatment:
            'Apply granular insecticides to the soil during seedling stage. Encourage natural predators like platygasterid wasps.',
    },
    '6': {
        name: 'Rice stem fly',
        severity: 'Medium',
        treatment:
            'Use reflective mulches in nursery beds, remove alternative weed hosts, and apply targeted chemical sprays if needed.',
    },
    '7': {
        name: 'Brown planthopper',
        severity: 'High',
        treatment:
            'Drain the paddy field for a few days to disrupt their cycle. Apply narrow-spectrum insecticides to preserve natural predators.',
    },
    '8': {
        name: 'White-backed planthopper',
        severity: 'High',
        treatment:
            'Avoid excessive nitrogen fertilizers. Drain field water intermittently. Spray with approved planthopper-specific insecticides.',
    },
    '9': {
        name: 'Small brown planthopper',
        severity: 'Medium',
        treatment:
            'Manage weed populations. Apply systemic insecticides early in the season to prevent stripe disease transmission.',
    },
    '10': {
        name: 'Rice water weevil',
        severity: 'High',
        treatment:
            'Delay flooding of fields, drain infected paddies temporarily to dry the soil, or apply pyrethroid insecticides.',
    },
    '11': {
        name: 'Rice leafhopper',
        severity: 'Medium',
        treatment:
            'Use yellow sticky traps, maintain healthy predator populations (spiders), or apply contact insecticides if numbers are high.',
    },
    '12': {
        name: 'Grain spreader thrips',
        severity: 'Medium',
        treatment:
            'Irrigate crops to wash off thrips. Introduce predatory thrips or mites, or apply insecticidal soaps or spinosad.',
    },
    '13': {
        name: 'Rice shell pest',
        severity: 'Medium',
        treatment:
            'Collect and destroy infested leaves manually. Apply contact insecticides or insect growth regulators.',
    },
    '14': {
        name: 'Grub',
        severity: 'High',
        treatment:
            'Till the soil to expose grubs to birds. Apply beneficial nematodes (Heterorhabditis spp.) or soil insecticides.',
    },
    '15': {
        name: 'Mole cricket',
        severity: 'Medium',
        treatment:
            'Flood tunnels to force crubs to the surface. Apply beneficial parasitic nematodes or soil-applied insecticides.',
    },
    '16': {
        name: 'Wireworm',
        severity: 'High',
        treatment:
            'Rotate crops with non-host varieties. Cultivate soil thoroughly in autumn. Use insecticidal seed treatments.',
    },
    '17': {
        name: 'White-margined moth',
        severity: 'Medium',
        treatment:
            'Pick and destroy egg masses and caterpillars. Apply Bacillus thuringiensis (Bt) or spinosad sprays.',
    },
    '18': {
        name: 'Black cutworm',
        severity: 'High',
        treatment:
            'Remove weeds around crop borders. Apply insecticidal baits or spray the base of plants with spinosad in the evening.',
    },
    '19': {
        name: 'Large cutworm',
        severity: 'High',
        treatment:
            'Utilize protective collars around individual seedlings. Apply diatomaceous earth or target base of stems with pyrethroids.',
    },
    '20': {
        name: 'Yellow cutworm',
        severity: 'Medium',
        treatment:
            'Eliminate weeds in and around the field. Apply Bacillus thuringiensis (Bt) or appropriate insecticides in late afternoon.',
    },
    '21': {
        name: 'Red spider',
        severity: 'Medium',
        treatment:
            'Increase humidity by misting foliage. Release predatory mites (Phytoseiidae) or apply sulfur or miticides.',
    },
    '22': {
        name: 'Corn borer',
        severity: 'High',
        treatment:
            'Plant Bt corn varieties. Release Trichogramma wasps. Apply systemic insecticides into the whorl of the plant.',
    },
    '23': {
        name: 'Armyworm',
        severity: 'High',
        treatment:
            'Spray Bacillus thuringiensis (Bt) or spinosad on young caterpillars. Maintain grassy margins to trap pests.',
    },
    '24': {
        name: 'Aphids',
        severity: 'Medium',
        treatment:
            'Wash aphids off with a strong jet of water. Spray with insecticidal soap, neem oil, or introduce ladybugs.',
    },
    '25': {
        name: 'Potosia brevitarsis',
        severity: 'Medium',
        treatment:
            'Handpick adult beetles. Treat larvae in the compost or soil with entomopathogenic fungi or targeted insecticides.',
    },
    '26': {
        name: 'Peach borer',
        severity: 'High',
        treatment:
            'Apply a protective insecticide spray to the trunk in mid-summer, or use pheromone mating disruption tags.',
    },
    '27': {
        name: 'English grain aphid',
        severity: 'Medium',
        treatment:
            'Preserve lady beetles and lacewings. Apply systemic or contact aphicides if threshold populations are reached.',
    },
    '28': {
        name: 'Greenbug',
        severity: 'High',
        treatment:
            'Plant resistant crop varieties. Spray with systemic insecticides to prevent severe chlorosis and yield loss.',
    },
    '29': {
        name: 'Bird cherry-oat aphid',
        severity: 'Medium',
        treatment:
            'Monitor crops in autumn. Treat with seed treatments or foliar sprays if aphid populations swell under warm weather.',
    },
    '30': {
        name: 'Wheat blossom midge',
        severity: 'High',
        treatment:
            'Plant midge-resistant wheat varieties. Apply targeted insecticides during the heading stage when midges are active.',
    },
    '31': {
        name: 'Penthaleus major',
        severity: 'Medium',
        treatment:
            'Practice crop rotation with broadleaf plants. Apply contact insecticides/acaricides in late autumn.',
    },
    '32': {
        name: 'Long-legged spider mite',
        severity: 'Medium',
        treatment:
            'Apply sulfur dust or horticultural oils. Introduce predatory mites or utilize specific miticides in severe cases.',
    },
    '33': {
        name: 'Wheat phloeothrips',
        severity: 'Medium',
        treatment:
            'Utilize crop rotation. Apply foliar insecticides when grain heads are emerging if thrips populations are high.',
    },
    '34': {
        name: 'Wheat sawfly',
        severity: 'Medium',
        treatment:
            'Deep-till stubble to bury overwintering pupae. Apply contact insecticides during adult flight periods.',
    },
    '35': {
        name: 'Cerodontha denticornis',
        severity: 'Medium',
        treatment:
            'Remove infested leaf tips containing mines. Apply systemic foliar insecticides to kill tunneling larvae.',
    },
    '36': {
        name: 'Beet fly',
        severity: 'Medium',
        treatment:
            'Cover young crops with row covers. Apply systemic insecticides when leaf-mining tunnels first appear on foliage.',
    },
    '37': {
        name: 'Flea beetle',
        severity: 'Medium',
        treatment:
            'Dust plants with diatomaceous earth. Use yellow sticky cards or apply pyrethrin-based sprays early in spring.',
    },
    '38': {
        name: 'Cabbage armyworm',
        severity: 'High',
        treatment:
            'Handpick larvae. Apply Bacillus thuringiensis (Bt) or spinosad weekly, ensuring thorough coverage of leaf undersides.',
    },
    '39': {
        name: 'Beet armyworm',
        severity: 'High',
        treatment:
            'Utilize pheromone traps to monitor moths. Spray young larvae with Bt, spinosad, or insect growth regulators.',
    },
    '40': {
        name: 'Beet spot flies',
        severity: 'Medium',
        treatment:
            'Destroy weed hosts in the vicinity. Apply systemic insecticides if leaf mining damage is widespread.',
    },
    '41': {
        name: 'Meadow moth',
        severity: 'High',
        treatment:
            'Perform deep autumn plowing to destroy pupae. Apply contact pyrethroids when caterpillars begin feeding.',
    },
    '42': {
        name: 'Beet weevil',
        severity: 'High',
        treatment:
            'Implement crop rotation. Use barrier ditches around fields and apply contact insecticides to treat adults.',
    },
    '43': {
        name: 'Serica orientalis',
        severity: 'Medium',
        treatment:
            'Install light traps to capture adult beetles at night. Treat soil grubs with entomopathogenic nematodes.',
    },
    '44': {
        name: 'Alfalfa weevil',
        severity: 'High',
        treatment:
            'Harvest crops early to remove food sources. Apply insecticides if weevil larvae exceed the economic threshold.',
    },
    '45': {
        name: 'Flax budworm',
        severity: 'Medium',
        treatment:
            'Monitor crop buds. Spray with contact pyrethroids or organophosphates if caterpillars are actively feeding on buds.',
    },
    '46': {
        name: 'Alfalfa plant bug',
        severity: 'Medium',
        treatment:
            'Harvest alfalfa promptly. Apply insecticides before bloom if nymph populations are high to protect seed yield.',
    },
    '47': {
        name: 'Tarnished plant bug',
        severity: 'Medium',
        treatment:
            'Keep weeds mowed around crops. Apply insecticides (like pyrethroids) during early flower bud formation.',
    },
    '48': {
        name: 'Locustoidea',
        severity: 'High',
        treatment:
            'Utilize bait containing Nosema locustae (biological control). Apply contact insecticides for large grasshopper swarms.',
    },
    '49': {
        name: 'Lytta polita',
        severity: 'Medium',
        treatment:
            'Handpick using gloves (can release irritating fluids). Apply dusts or contact sprays of carbaryl or pyrethroids.',
    },
    '50': {
        name: 'Legume blister beetle',
        severity: 'Medium',
        treatment:
            'Wear gloves if removing by hand. Spray crop foliage with spinosad or pyrethrins when beetles aggregate.',
    },
    '51': {
        name: 'Blister beetle',
        severity: 'Medium',
        treatment:
            'Avoid touching with bare skin. Shake beetles into soapy water. Spray contact insecticides if feeding damage is high.',
    },
    '52': {
        name: 'Therioaphis maculata',
        severity: 'High',
        treatment:
            'Introduce ladybugs or lacewings. Apply systemic aphicides to prevent toxin damage and leaf drop.',
    },
    '53': {
        name: 'Odontothrips loti',
        severity: 'Medium',
        treatment:
            'Spray plants with spinosad or insecticidal soaps. Ensure proper crop irrigation to reduce thrips stress.',
    },
    '54': {
        name: 'Thrips',
        severity: 'Medium',
        treatment:
            'Hang blue sticky cards. Spray with neem oil or spinosad. Ensure weeds are kept clear from garden beds.',
    },
    '55': {
        name: 'Alfalfa seed chalcid',
        severity: 'High',
        treatment:
            'Destroy volunteer alfalfa plants. Clean seeds thoroughly. Chemical sprays are rarely effective due to larvae feeding inside seeds.',
    },
    '56': {
        name: 'Pieris canidia',
        severity: 'Medium',
        treatment:
            'Handpick green caterpillars. Apply Bacillus thuringiensis (Bt) or neem oil sprays to brassica crops.',
    },
    '57': {
        name: 'Apolygus lucorum',
        severity: 'High',
        treatment:
            'Set up green light traps. Apply pyrethroid or neonicotinoid insecticides during peak nymph activity in early morning.',
    },
    '58': {
        name: 'Limacodidae',
        severity: 'Medium',
        treatment:
            'Use caution (stinging caterpillars). Handpick using thick gloves. Apply Bacillus thuringiensis (Bt) or spinosad sprays.',
    },
    '59': {
        name: 'Viteus vitifoliae',
        severity: 'High',
        treatment:
            'Plant grapevines grafted onto phylloxera-resistant rootstocks. Apply systemic insecticides to manage leaf galls.',
    },
    '60': {
        name: 'Colomerus vitis',
        severity: 'Low',
        treatment:
            'Apply sulfur sprays during early spring bud break to control mites before they cause leaf galls.',
    },
    '61': {
        name: 'Brevipalpus lewisi',
        severity: 'Medium',
        treatment:
            'Apply sulfur or specific miticides (such as abamectin) post-harvest or during early vine growth.',
    },
    '62': {
        name: 'Oides decempunctata',
        severity: 'Medium',
        treatment:
            'Handpick beetles and larvae. Apply contact pyrethroid sprays to host plants if feeding damage is severe.',
    },
    '63': {
        name: 'Polyphagotarsonemus latus',
        severity: 'High',
        treatment:
            'Apply sulfur, insecticidal soap, or specific miticides (abamectin). Remove and destroy heavily infested plant tips.',
    },
    '64': {
        name: 'Pseudococcus comstocki',
        severity: 'High',
        treatment:
            'Prune out dense foliage. Spray with horticultural oils during dormancy, or use insecticidal soap mixed with systemic insecticides.',
    },
    '65': {
        name: 'Paranthrene regalis',
        severity: 'High',
        treatment:
            'Inject beneficial nematodes into borer exit holes, or spray pyrethroids onto trunks during adult moth flight.',
    },
    '66': {
        name: 'Ampelophaga',
        severity: 'Medium',
        treatment:
            'Handpick the large hornworms from vines. Apply Bacillus thuringiensis (Bt) or spinosad to foliage.',
    },
    '67': {
        name: 'Lycorma delicatula',
        severity: 'High',
        treatment:
            'Scrape and destroy egg masses. Band trees with sticky traps. Apply systemic dinotefuran or contact pyrethroids.',
    },
    '68': {
        name: 'Xylotrechus',
        severity: 'High',
        treatment:
            'Prune and burn infested wood. Keep trees vigorous. Apply protective pyrethroids to tree bark in early summer.',
    },
    '69': {
        name: 'Cicadella viridis',
        severity: 'Medium',
        treatment:
            'Clear weeds surrounding host plants. Spray with contact insecticides if leafhopper feeding causes stippling.',
    },
    '70': {
        name: 'Miridae',
        severity: 'Medium',
        treatment:
            'Use yellow sticky traps. Spray plants with insecticidal soaps, neem oil, or pyrethrins when nymphs are active.',
    },
    '71': {
        name: 'Trialeurodes vaporariorum',
        severity: 'High',
        treatment:
            'Hang yellow sticky cards. Introduce Encarsia formosa parasitic wasps. Spray undersides of leaves with neem oil or imidacloprid.',
    },
    '72': {
        name: 'Erythroneura apicalis',
        severity: 'Medium',
        treatment:
            'Remove fallen leaf debris in winter. Spray contact insecticides like pyrethrins when leafhoppers are active.',
    },
    '73': {
        name: 'Papilio xuthus',
        severity: 'Low',
        treatment:
            'Handpick the large caterpillars from citrus trees. Spray Bacillus thuringiensis (Bt) if feeding damage is high.',
    },
    '74': {
        name: 'Panonychus citri',
        severity: 'High',
        treatment:
            'Release predatory mites. Apply horticultural oils or specialized miticides (such as spirodiclofen) in dry seasons.',
    },
    '75': {
        name: 'Phyllocoptruta oleivora',
        severity: 'High',
        treatment:
            'Apply sulfur sprays or specialized miticides when rust mite counts rise to protect fruit rind quality.',
    },
    '76': {
        name: 'Icerya purchasi',
        severity: 'Medium',
        treatment:
            'Introduce Vedalia ladybeetles (biological control). Spray crawlers with horticultural oil or insecticidal soap.',
    },
    '77': {
        name: 'Unaspis yanonensis',
        severity: 'High',
        treatment:
            'Apply horticultural oils during crawler emergence periods. Use systemic insecticides (such as thiamethoxam) for heavy infestations.',
    },
    '78': {
        name: 'Ceroplastes rubens',
        severity: 'Medium',
        treatment:
            'Apply narrow-range horticultural oil during the crawler stage. Manually scrape adult scale off twigs.',
    },
    '79': {
        name: 'Chrysomphalus aonidum',
        severity: 'High',
        treatment:
            'Introduce parasitic wasps (Aphytis holoxanthus). Spray trees with light horticultural oils during crawler phases.',
    },
    '80': {
        name: 'Parlatoria ziziphi',
        severity: 'High',
        treatment:
            'Prune infested twigs to open up the canopy. Apply mineral oil sprays during late spring or early autumn.',
    },
    '81': {
        name: 'Nipaecoccus vastator',
        severity: 'High',
        treatment:
            'Prune out heavily infested shoots. Control ants that protect the mealybugs, and spray with neem oil or systemic insecticides.',
    },
    '82': {
        name: 'Aleurocanthus spiniferus',
        severity: 'High',
        treatment:
            'Introduce parasitic wasps. Spray undersides of leaves with neem oil, horticultural oil, or systemic insect treatments.',
    },
    '83': {
        name: 'Bactrocera minax',
        severity: 'High',
        treatment:
            'Bag individual young fruit on trees. Install protein bait traps to capture adults, and destroy fallen fruit.',
    },
    '84': {
        name: 'Bactrocera dorsalis',
        severity: 'High',
        treatment:
            'Collect and bury fallen infested fruits. Set up methyl eugenol pheromone traps. Apply protein bait sprays.',
    },
    '85': {
        name: 'Bactrocera tsuneonis',
        severity: 'High',
        treatment:
            'Remove and deeply bury all fallen citrus fruit. Spray bait containing attractant and insecticide during adult emergence.',
    },
    '86': {
        name: 'Spodoptera litura',
        severity: 'High',
        treatment:
            'Collect and destroy leaf egg masses. Spray crops with Bacillus thuringiensis (Bt), spinosad, or insect growth regulators.',
    },
    '87': {
        name: 'Adris tyrannus',
        severity: 'Medium',
        treatment:
            'Net orchards to exclude fruit-piercing moths. Harvest ripe fruit promptly. Use light traps to distract moths.',
    },
    '88': {
        name: 'Phyllocnistis citrella',
        severity: 'Medium',
        treatment:
            'Apply neem oil or systemic insecticides like imidacloprid to protect new flush leaves from tunneling larvae.',
    },
    '89': {
        name: 'Toxoptera citricida',
        severity: 'High',
        treatment:
            'Introduce predatory ladybugs. Spray with imidacloprid or insecticidal soap to control aphids and prevent CTV transmission.',
    },
    '90': {
        name: 'Toxoptera aurantii',
        severity: 'Medium',
        treatment:
            'Preserve natural predators (hoverfly larvae). Spray with insecticidal soap or neem oil if new shoots are curled.',
    },
    '91': {
        name: 'Aphis citricola',
        severity: 'Medium',
        treatment:
            'Spray with pressurized water to dislodge. Apply insecticidal soap, neem oil, or systemic aphicide to new vegetative growth.',
    },
    '92': {
        name: 'Scirtothrips dorsalis',
        severity: 'High',
        treatment:
            'Apply spinosad, neem oil, or systemic insecticides. Rotate chemical classes to prevent resistance development.',
    },
    '93': {
        name: 'Dasineura sp.',
        severity: 'Medium',
        treatment:
            'Remove and burn infested flower buds or leaves. Apply contact insecticides during adult midge flight.',
    },
    '94': {
        name: 'Lawana imitata',
        severity: 'Low',
        treatment:
            'Prune away highly infested stems where egg deposits are laid. Sprays of insecticidal soap can manage planthopper nymphs.',
    },
    '95': {
        name: 'Salurnis marginella',
        severity: 'Low',
        treatment:
            'Remove surrounding weeds. Hand-clean foliage or apply contact pyrethroid sprays if numbers are highly disruptive.',
    },
    '96': {
        name: 'Deporaus marginatus',
        severity: 'Medium',
        treatment:
            'Collect and burn fallen leaf tips cut by the weevil. Spray foliage with contact insecticides during new leaf flush.',
    },
    '97': {
        name: 'Chlumetia transversa',
        severity: 'High',
        treatment:
            'Prune off and burn infested mango shoots containing larvae. Spray systemic insecticides during early shoot growth.',
    },
    '98': {
        name: 'Mango flat beak leafhopper',
        severity: 'High',
        treatment:
            'Prune mango orchards to keep them open. Apply systemic insecticides (like imidacloprid) during early flowering stages.',
    },
    '99': {
        name: 'Rhytidodera bowringii',
        severity: 'High',
        treatment:
            'Prune and destroy infested branches. Inject systemic insecticides or insert wire into entry holes to kill larvae.',
    },
    '100': {
        name: 'Sternochetus frigidus',
        severity: 'High',
        treatment:
            'Harvest fruits early. Collect and destroy all fallen and infested mangoes. Quarantine affected orchards to limit spread.',
    },
    '101': {
        name: 'Cicadellidae',
        severity: 'Medium',
        treatment:
            'Hang yellow sticky cards. Spray with insecticidal soap, neem oil, or contact pyrethrins on the undersides of leaves.',
    },
};
