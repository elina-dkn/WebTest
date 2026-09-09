# Workout Froggy

A vanilla JavaScript + Firebase workout tracker refactored into a layered architecture.

## Architecture

```text
HTML page
  -> Page controller
      -> UI components
      -> Service layer
          -> Repository/data layer
              -> Firebase Auth / Firestore
```

### Layers

- `js/pages/` — page-specific orchestration and event handling.
- `js/components/` — reusable DOM/UI components. Components do not talk directly to Firestore.
- `js/services/` — application operations and validation.
- `js/data/` — Firebase/Firestore access only.
- `js/core/` — Firebase initialization and authentication helpers.

## Data model

Split membership is now owned by the split side of the relationship:

```text
users/{uid}/exercises/{exerciseId}
users/{uid}/exercises/{exerciseId}/logs/{logId}
users/{uid}/splits/{splitId}
users/{uid}/splits/{splitId}/items/{exerciseId}
```

Using `exerciseId` as the membership document ID prevents duplicate membership documents for new writes.

## Migration

The first authenticated page load checks `users/{uid}/_meta/schema`.

If the schema is older than version 2, `migrationService.js`:

1. Backfills `latestWeight` from existing logs when necessary.
2. Normalizes legacy split membership into deterministic `items/{exerciseId}` documents.
3. Removes legacy random-ID membership documents.
4. Stops relying on the duplicated `exercise.splits` field.
5. Records schema version 2 so the migration does not run on every page load.

The migration is intentionally versioned rather than being executed as a normal application startup task.


## Firestore security rules

`firestore.rules` contains a baseline rule that restricts every user subtree to its authenticated owner. 

