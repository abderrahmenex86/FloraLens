# Data coverage — Pl@ntNet-300K vs FloraLens targets

Snapshot checked against the Pl@ntNet-300K v2 metadata (Zenodo 10419064).

## Totals

| Metric | Value |
|---|---|
| Species | 1,000 |
| Images | 306,087 |
| Train / val / test | 243,866 / 31,115 / 31,106 |
| Observation groups | 306,087 (split is observation-grouped; zero cross-split leakage) |
| License mix | 305,614 CC BY-SA, 376 CC BY-NC, 97 CC BY-NC-SA |

## Long tail

| Images per class | Species |
|---|---|
| ≥ 20 | 571 |
| ≥ 50 | 413 |
| ≥ 80 | 345 |
| ≥ 100 | 310 |
| ≥ 150 | 248 |
| ≥ 300 | 168 |
| ≥ 1,000 | 76 |
| Max | 9,010 |

Median: **28 images**. 95th percentile: **1,699**.

## Consequence for a 600-class list

Only **341 Pl@ntNet species have ≥80 images and are not already in the seed
list**. A 600-class list cannot be built from Pl@ntNet alone at that threshold.
Options, in order of preference:

1. Add the garden/houseplant anchors from iNaturalist and own photos (most of
   them are absent from Pl@ntNet), then fill with Pl@ntNet.
2. Lower the floor to 50 images for regional species and merge visually
   indistinguishable taxa to genus.
3. Use genus-level labels for rare ornamentals such as Bougainvillea and
   Chrysanthemum.

## Garden anchors vs Pl@ntNet

The seed anchors were searched by scientific name. Only an unrelated
*Dischidia ovata* matched; none of the eight garden plants are in the 1,000
Pl@ntNet species:

- Bougainvillea
- Cestrum nocturnum
- Duranta erecta
- Jasminum grandiflorum
- Ficus benjamina
- Crassula ovata
- Chrysanthemum × morifolium
- Ocimum basilicum

Their iNaturalist observation counts (all observations, not only CC-licensed):

| Species | Observations |
|---|---|
| Bougainvillea (genus) | 170,638 |
| Cestrum nocturnum | 6,563 |
| Duranta erecta | 42,878 |
| Jasminum grandiflorum | 169 |
| Ficus benjamina | 24,643 |
| Crassula ovata | 29,148 |
| Chrysanthemum (genus) | 34,878 |
| Ocimum basilicum | 18,992 |

Jasminum grandiflorum is the only anchor with a data shortage; own photos are
required. Bougainvillea and Chrysanthemum should be genus-level labels because
garden plants are mostly hybrids/cultivars.

## Building the list

```bash
python tools/build_class_list.py \
  --species-metadata data/raw/plantnet/species_metadata.csv \
  --image-metadata data/raw/plantnet/plantnet300K_metadata.csv \
  --seed shared/classes/plants.yaml \
  --out shared/classes/plants.plantnet-candidates.yaml \
  --target 600 --min-images 80
```

Review the output before training. The tool appends candidates; it does not
decide which species belong in the product.
