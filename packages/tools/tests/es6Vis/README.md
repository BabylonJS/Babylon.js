# ES6 Visualization Tests

Visual regression tests that verify three ES6 import styles produce identical rendering output.

## Import Styles

| Style    | Description                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------- |
| `barrel` | Top-level index: `import { Engine } from "@babylonjs/core"`                                       |
| `deep`   | Sub-path imports: `import { Engine } from "@babylonjs/core/Engines/engine"`                       |
| `pure`   | Side-effect-free barrel: `import { Engine } from "@babylonjs/core/pure"` + explicit registrations |

## Prerequisites

```bash
npm run build:es6
```

## Running

```bash
# Run the tests
npm run test:es6vis

# Update reference snapshots
npm run test:es6vis:update -w @tools/tests

# Launch the dev server for manual inspection
npm run serve:es6vis -w @tools/tests
# Then open http://localhost:1340/?scene=basic&style=barrel
```

## Adding a New Scene

1. Create a directory under `src/scenes/` (e.g. `src/scenes/pbr/`)
2. Add three files, each exporting `run(canvas: HTMLCanvasElement): void`:
    - `barrel.ts` — imports from `@babylonjs/core`
    - `deep.ts` — imports from specific sub-paths
    - `pure.ts` — imports from `@babylonjs/core/pure` with explicit registrations and shader imports
3. Run `npm run test:es6vis:update -w @tools/tests` to generate the reference image

The Playwright test auto-discovers scenes — no config changes needed.

## How It Works

- `index.html` hosts a single 800×600 canvas
- `src/bootstrap.ts` reads `?scene=X&style=Y` query params and dynamically imports `./scenes/{scene}/{style}.ts`
- Each scene file is fully self-contained: imports, engine setup, scene creation, and render loop
- The render loop sets `window.__ready = true` after 10 frames; Playwright waits for this before taking a screenshot
- All three styles for a scene are compared against a single reference image (`es6vis-{scene}.png`)
