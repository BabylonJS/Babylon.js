---
applyTo: "packages/dev/**/*.ts"
---

# Unit Tests (Vitest)

Unit tests use **Vitest** and live under a `test/unit/` folder at each package's source root. In `packages/dev/core`, for example, unit tests are further organized into subfolders by area (such as `test/unit/Scene/`, `test/unit/Animations/`, etc.), and test files typically mirror the relevant source file or feature name with a `.test.ts` or `.test.tsx` extension (for example, tests for `packages/dev/core/src/scene.ts` live under `packages/dev/core/test/unit/Scene/` rather than as a single flat `scene.test.ts` at the root of `test/unit/`). Aim to keep a clear, discoverable mapping between source files and their corresponding tests, but it does not need to be a strict 1:1 filename match.

Vitest is configured with `globals: true`, so `describe`, `it`, `test`, and `expect` are available as globals; however, new or updated test files should prefer explicit imports from `vitest` (`describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`, etc.). Use `vi.fn()` and `vi.spyOn()` for mocking, and `vi.useFakeTimers()` / `vi.useRealTimers()` for timer control.

Run unit tests with `npm test` or `npx vitest run --project=unit` from the repo root.

When reviewing code, check if new APIs are being introduced without unit tests. If they are missing and the APIs are well suited for unit tests, try to add new tests yourself, otherwise at least flag missing tests in the review comments.

# Integration, Performance, and Interaction Tests (Playwright)

Browser-dependent tests — integration, performance, and interaction — use **Playwright**. These live under `test/integration/`, `test/performance/`, or `test/interaction/` folders respectively, following the same per-package layout as unit tests.

Run them with:

```
npm run test:integration
npm run test:performance
npm run test:interactions
```

# Visualization (Playwright) Tests

Tests that validate a visual result in the browser use Playwright. To add a new visualization test, append an entry to the JSON config file at `packages/tools/tests/test/visualization/config.json`. Each entry requires a `title` and typically a `playgroundId` (e.g. `"#ABC123#5"`) pointing to a saved Babylon.js Playground snippet.

Optional fields include:

- `referenceImage` — PNG filename in `ReferenceImages/`; defaults to `title` if omitted.
- `renderCount` — number of frames to render before capturing (default 1).
- `errorRatio` — allowed pixel-diff percentage (default ~1.1%).
- `excludedEngines` — array of engines to skip, e.g. `["webgl1"]`.
- `excludeFromAutomaticTesting` — boolean to skip the test entirely.
- `replace` / `replaceUrl` — comma-separated string pairs for patching playground code or URLs.
- `useLargeWorldRendering`, `useReverseDepthBuffer`, `useNonCompatibilityMode` — per-test engine flags.

Reference images live in `packages/tools/tests/test/visualization/ReferenceImages/` (with a `webgpu/` subdirectory for WebGPU-specific baselines). To generate or update a reference image, run the tests with `--update-snapshots`:

```
npx playwright test --config playwright.config.ts --project=webgl2 --update-snapshots -g "Your Test Title"
```

The test files themselves (e.g. `visualization.webgl2.test.ts`, `visualization.webgpu.test.ts`) are thin wrappers that call `evaluatePlaywrightVisTests(engineType, configFileName)` from `visualizationPlaywright.utils.ts` — you should not need to modify them when adding a standard test.

For devhost-based tests (e.g. Lottie), add entries to a separate config like `config.lottie.json` using a `devHostQsps` field instead of `playgroundId`, and optionally set `readySelector` and `screenshotDelayMs`.

# Babylon Serializer

The `SceneSerializer` (`packages/dev/core/src/Misc/sceneSerializer.ts`) iterates over every scene collection (lights, cameras, meshes, materials, particle systems, etc.) and calls each entity's `serialize()` method to produce a `.babylon` JSON file.

When adding a new serializable entity or property:

- **Decorate serializable properties** with `@serialize()`, `@serializeAsVector3()`, `@serializeAsColor3()`, etc. from `decorators.ts`. These decorators drive automatic round-trip serialization via `SerializationHelper`.
- **Implement a `serialize()` method** on the entity class. Call `SerializationHelper.Serialize(this)` to handle all decorated properties, then manually add any non-decorated data (parent references, exclusion lists, etc.). Call `SerializationHelper.AppendSerializedAnimations(this, serializationObject)` if the entity is animatable.
- **Update `SceneSerializer`** if the entity represents a new top-level collection. Add a loop that pushes each entity's `serialize()` result into the output object (e.g. `serializationObject.myNewSystems`). Respect the `doNotSerialize` flag.

See `Light.serialize()` in `packages/dev/core/src/Lights/light.ts` or `ParticleSystem.serialize()` in `packages/dev/core/src/Particles/particleSystem.ts` for representative examples.

# Babylon Loader

The `.babylon` file loader (`packages/dev/core/src/Loading/Plugins/babylonFileLoader.ts`) parses JSON and reconstructs entities using static `Parse()` methods and a parser registry in `packages/dev/core/src/Loading/Plugins/babylonFileParser.function.ts`.

When adding a new parseable entity or property:

- **Implement a static `Parse()` method** on the entity class. Use `SerializationHelper.Parse(() => new MyEntity(...), parsedData, scene, rootUrl)` to deserialize all `@serialize`-decorated properties automatically, then restore any custom state.
- **Register parsers** by calling `AddParser` and `AddIndividualParser` (from `babylonFileParser.function.ts`) in a dedicated scene-component file (e.g. `myEntityComponent.ts`). The general parser iterates the collection array from the JSON (e.g. `parsedData.myNewSystems`) and delegates each entry to the individual parser.
- **Add a constant** to `SceneComponentConstants` (in `packages/dev/core/src/sceneComponent.ts`) for the parser name.
- **Update `AssetContainer`** (`packages/dev/core/src/assetContainer.ts`) so the new entity type is included in `addAllToScene()` and `removeAllFromScene()`.

See `Light.Parse()` in `packages/dev/core/src/Lights/light.ts` and the particle-system parser registration in `packages/dev/core/src/Particles/particleSystemComponent.ts` for representative examples.
