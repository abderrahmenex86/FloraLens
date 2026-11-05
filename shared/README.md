# Shared contracts

The ML project and the Expo app meet here.

- `classes/*.yaml` — stable class ids, taxon ids, ranks, common names and roles.
- `contracts/model.schema.json` — the JSON contract produced by every export.
- `rules/health.yaml` — the abiotic/disease rule engine.

Rules:

1. Class ids are append-only. Never renumber a class after a model has shipped.
2. The contract's `classes_sha256` and `class_ids` must match the class list.
3. The app must refuse a model whose class hash does not match its bundled list.
4. Keep non-taxonomic labels (abiotic, "unknown", "other insect") in the same
   list so the model always has a valid class for every input.

Validate with:

```bash
uv run --project ml python tools/validate_contracts.py \
  --contract ml/exports/plants/model.json \
  --classes shared/classes/plants.yaml
```
