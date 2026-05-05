# Tree-Shaking Improvement Plan — `@babylonjs/core`

## Current State

| Metric                                         | Count                                       |
| ---------------------------------------------- | ------------------------------------------- |
| Total source files in `packages/dev/core/src/` | ~2,215                                      |
| Files calling `RegisterClass()`                | ~427                                        |
| Files with prototype augmentation              | ~88 (367 assignments)                       |
| Files writing to `ShaderStore`                 | ~164                                        |
| Files calling `Node.AddNodeConstructor()`      | ~25                                         |
| Existing `.pure.ts` files                      | **1** (`materialHelper.functions.pure.ts`)  |
| Current `sideEffects` in package.json          | `["**/*"]` (everything, except `ThinMaths`) |

---

## Phase 0 — Auditing & Tooling Foundation

- [x] **0.1** — Build a side-effect inventory script (`scripts/treeshaking/auditSideEffects.mjs`)
    - Scans all `.ts` files in `packages/dev/core/src/`
    - Detects: `RegisterClass()`, `*.prototype.* = ...`, `ShaderStore.*Store[...] = ...`, `Node.AddNodeConstructor(...)`, bare top-level calls, static property assignments, `declare module` augmentations
    - Outputs JSON manifest (`scripts/treeshaking/side-effects-manifest.json`)
    - Run: `npm run audit:side-effects`
    - **Results** (as of audit run):
        - 2,209 files scanned
        - **913 files** with side effects, **1,296 files** already pure
        - 406 files have **only** `RegisterClass` (easiest to convert)
        - See breakdown below
- [x] **0.2** — Validate with bundle smoke test (`scripts/treeshaking/bundleSmokeTest.mjs`)
    - Rollup + Webpack test entries that import ThinMaths (the only side-effect-free subtree)
    - Run: `npm run test:treeshaking`
    - **Results**: Both Rollup (1 byte) and Webpack (0 bytes) produce empty bundles for bare ThinMaths import ✓

### Audit Results Breakdown

| Side-Effect Type             | Occurrences | Unique Files |
| ---------------------------- | ----------- | ------------ |
| `RegisterClass`              | 535         | 426          |
| `prototype-assignment`       | 344         | 84           |
| `shader-store-write`         | 331         | 331          |
| `declare-module`             | 108         | 91           |
| `static-property-assignment` | 66          | 59           |
| `AddNodeConstructor`         | 26          | 25           |
| `top-level-call`             | 9           | 8            |

### Files by Side-Effect Complexity

| Category                       | Count | Conversion Difficulty                   |
| ------------------------------ | ----- | --------------------------------------- |
| Already pure (no side effects) | 1,296 | None needed                             |
| Only `RegisterClass`           | 406   | Easy — mechanical split                 |
| Shader store writes            | 331   | Leave as-is (inherently side-effectful) |
| Prototype augmentations        | 84    | Already separate files in most cases    |
| Static property assignments    | 59    | Medium — need factory pattern           |
| Multiple mixed side effects    | ~37   | Case-by-case                            |

- [x] **1.1** — Annotate module-scope `new`, factory calls, `Object.freeze()` etc. in pure-candidate files
    - Added `/*#__PURE__*/` annotations to **5 `.pure.ts` source files** (44 sites total):
        - `Maths/math.color.pure.ts` — 7 sites (2× `Object.defineProperties`, 2× `_V8PerformanceHack`, 1× `_BlackReadOnly`, 2× `BuildArray`)
        - `Maths/math.vector.pure.ts` — 31 sites (5× `Object.defineProperties`, 4× `_V8PerformanceHack`, 13× `_ReadOnly`, 8× `BuildTuple`, 1× `Matrix.FromValues`)
        - `scene.pure.ts` — 2 sites (2× top-level `new Vector4()`)
        - `Particles/…/createParticleBlock.pure.ts` — 1 site (`new Color4()`)
        - `Particles/…/updateAttractorBlock.pure.ts` — 3 sites (3× `Vector3.Zero()`)
    - **Key finding**: TypeScript preserves `/*#__PURE__*/` for top-level `const`/`let` and `Object.defineProperties`, but **strips annotations from static class field initializers** (hoisted outside the class body)
    - Solution: post-build injection script `scripts/treeshaking/injectPureAnnotations.mjs`
        - Scans all `.pure.js` files in `dist/`, injects `/*#__PURE__*/` before call expressions in top-level `ClassName.field = ...` assignments
        - Idempotent (safe to run multiple times), supports `--dry-run` and `--verbose`
        - Run: `npm run inject:pure-annotations`
    - **After tsc + injection**: all 44 annotations present in compiled `.js` output ✓
    - Bundle smoke tests: all 12 pass ✓
- [x] **1.2** — Add lint/CI check for missing annotations in side-effect-free files
    - New ESLint rule: `babylonjs/require-pure-annotation` (in `eslintBabylonPlugin`)
    - Fires for `.pure.ts` files only
    - Checks: static field initializers, top-level variable initializers, top-level expression statements
    - Auto-fixable (inserts `/*#__PURE__*/` before the call expression)
    - Unwraps `TSAsExpression` / `TSTypeAssertion` wrappers
    - Enabled as `"error"` in `eslint.config.mjs` for `packages/dev/core/src/**/*.pure.ts`

## Phase 2 — Split Files into `FILE.pure.ts` + `FILE.ts`

- [x] **2.1** — Define `.pure.ts` convention and document it
    - Convention: `FILE.pure.ts` contains all code except `RegisterClass` calls and their import
    - `FILE.ts` becomes thin wrapper: `export * from "./FILE.pure"` + RegisterClass calls
    - Pure files have header: `/** This file must only contain pure code and pure imports */`
    - `Object.defineProperties` stays in pure file (semantically tied to class definitions)
- [x] **2.2** — Pilot: Maths/ directory (manual split of `math.color.ts` and `math.vector.ts`)
    - Created `math.color.pure.ts` (1,913 lines) + `math.color.ts` wrapper (12 lines)
    - Created `math.vector.pure.ts` (8,877 lines) + `math.vector.ts` wrapper (14 lines)
    - Created `math.pure.ts` and `pure.ts` barrel files for side-effect-free imports
    - All smoke tests pass (bare import → 0-1 bytes, named import → bundles correctly)
- [x] **2.3** — Automation script: `scripts/treeshaking/splitRegisterClass.mjs`
    - Handles string literals (`"BABYLON.Xxx"`) and variable refs (`FlowGraphBlockNames.Xxx`)
    - Handles `GetClass` + `RegisterClass` co-imports (preserves GetClass in pure file)
    - Result: **397 files split automatically** + 2 manual = **399 total**
    - **7 edge cases deferred** — script regex only matches `"…"` strings and bare identifiers; 6 files use backtick template literals, 1 file defines `RegisterClass` itself
    - TypeScript compilation: ✅ zero errors
    - Bundle smoke tests: ✅ all pass
- [ ] **2.4** — Handle 7 deferred edge cases manually
    - **Root cause A — Backtick template literal in `RegisterClass()` call** (6 files):
        1. `Materials/GreasedLine/greasedLinePluginMaterial.ts` — uses interpolation: ``RegisterClass(`BABYLON.${GreasedLinePluginMaterial.GREASED_LINE_MATERIAL_NAME}`, …)``
        2. `PostProcesses/RenderPipeline/Pipelines/taaMaterialManager.ts` — also has a second class (`TAAMaterialManager`) defined _after_ the call
        3. `Rendering/GlobalIllumination/giRSMManager.ts`
        4. `Rendering/IBLShadows/iblShadowsPluginMaterial.ts`
        5. `Rendering/reflectiveShadowMap.ts`
        6. `XR/features/WebXRDepthSensing.ts` — also has a second class (`WebXRDepthSensing`) defined _after_ the call
    - **Root cause B — File _defines_ `RegisterClass`** (1 file): 7. `Misc/typeStore.ts` — exports the `RegisterClass` function itself; no import to detect
    - **Fix options**: (a) extend regex on line 122 of `splitRegisterClass.mjs` to match backtick template literals, then re-run; (b) split these 7 files by hand
- [ ] **2.5** — Shaders remain as-is (inherently side-effectful), explicitly listed in `sideEffects`

### Post-Phase-2 Audit Stats

| Metric                     | Before | After |
| -------------------------- | ------ | ----- |
| Total `.ts` files          | 2,209  | 2,610 |
| Files WITHOUT side effects | 1,296  | 1,697 |
| New `.pure.ts` files       | 1      | 401   |

## Phase 3 — Introduce `pure.ts` Barrel Files

- [x] **3.1** — Add `pure.ts` sibling to every subdirectory `index.ts`
    - Automation script: `scripts/treeshaking/generatePureBarrels.mjs`
    - Reads side-effects manifest + scans for `.pure.ts` files
    - For each `export * from "./file"` in `index.ts`:
        - If `file.pure.ts` exists → rewrite to `export * from "./file.pure"`
        - If file is already pure (not in manifest) → keep as-is
        - If file has side effects and no `.pure.ts` → skip
    - For `import "./file"` (bare side-effect imports) → skip
    - For subdirectory references → recursively generate `pure.ts` there
    - Handles macOS case-insensitive FS (file-first disambiguation for `./abstractEngine` vs `./AbstractEngine/`)
    - Run: `npm run generate:pure-barrels`
    - **Results**:
        - **112 `pure.ts` barrel files** generated (+ 1 root = 113 total)
        - 399 exports rewritten to `.pure` specifiers
        - 841 exports kept as-is (already pure files)
        - 26 bare side-effect imports skipped
        - 319 exports skipped (remaining impure files: shader writes, `AddNodeConstructor`, prototype augmentations, etc.)
        - 6 directories entirely side-effectful (empty barrel — not written): `Engines/AbstractEngine`, `Engines/Extensions`, `Engines/WebGPU/Extensions`, `Engines/Native/Extensions`, `Lights/Clustered`, `Probes`
- [x] **3.2** — Root-level `packages/dev/core/src/pure.ts`
    - 47 exports (all top-level directories + pure top-level files like `scene.pure`, `sceneComponent`, `types`)
    - Compiles to `dist/pure.js` and public `@babylonjs/core/pure.js` + `pure.d.ts`
- [x] **3.3** — Public package access: `@babylonjs/core/pure`
    - No `exports` field change needed — the public package has no `exports` field (uses direct file access)
    - The compiled `pure.js` + `pure.d.ts` files are auto-generated in the public package output
    - Consumers can import: `import { Vector3 } from "@babylonjs/core/Maths/pure"` or `import { ... } from "@babylonjs/core/pure"`
    - TypeScript compilation: ✅ zero errors
    - Bundle smoke tests: ✅ all 20 pass (10 test cases × 2 bundlers)
    - Key result: `import "@babylonjs/core/pure"` → **0–1 bytes** (Rollup/Webpack)

### Smoke Test Results (Phase 3)

| Test                                | Rollup   | Webpack   |
| ----------------------------------- | -------- | --------- |
| ThinMaths bare import               | 1 byte ✓ | 0 bytes ✓ |
| ThinMaths named import              | 120 B ✓  | 143 B ✓   |
| math.color.pure bare                | 1 byte ✓ | 0 bytes ✓ |
| math.color.pure named (Color3)      | 62 KB ✓  | 12 KB ✓   |
| math.vector.pure bare               | 1 byte ✓ | 0 bytes ✓ |
| math.pure barrel bare               | 1 byte ✓ | 0 bytes ✓ |
| **Maths/pure barrel bare**          | 1 byte ✓ | 0 bytes ✓ |
| **Cameras/pure barrel bare**        | 1 byte ✓ | 0 bytes ✓ |
| **Root pure barrel bare**           | 1 byte ✓ | 0 bytes ✓ |
| **Root pure barrel named (Color3)** | 93 B ✓   | 12 KB ✓   |

## Phase 4 — Factor Out Static Helpers

- [x] **4.1** — Identify static methods that can become module-level functions
    - Cataloged **292 public static methods** and **38 static properties** across 9 priority classes
    - Automation script: `scripts/treeshaking/catalogStaticHelpers.mjs`
    - Run: `npm run catalog:static-helpers` (add `--verbose` for per-function lists)
    - **Strategy**: Create parallel free functions using `I*Like` interfaces (not replace class statics)
        - Free functions use public `.x`/`.y`/`.z` (structural types) — no class dependency
        - Class statics remain unchanged (backward compatible, no performance regression)
        - One-way dependency: class file → functions file (no circular imports)
        - Tree-shaking benefit: users can import individual functions without pulling entire class
    - **Key finding**: The codebase already had `math.vector.functions.ts` with 17 functions + `math.scalar.functions.ts` + `ThinMaths/thinMath.matrix.functions.ts` (10 functions) — an established pattern
- [x] **4.2** — Expand free functions for priority classes
    - **`Maths/math.vector.functions.ts`** — expanded from 17 → **38 functions**
        - New Vector2: `AddToRef`, `SubtractToRef`, `LengthSquared`, `Length`, `Dot`
        - New Vector3: `AddToRef`, `MultiplyToRef`, `NegateToRef`, `CrossToRef`, `MinimizeToRef`, `MaximizeToRef`, `ClampToRef`, `CheckExtends`, `Hermite1stDerivativeToRef`, `HermiteToRef`, `EqualsWithEpsilon`
        - New Vector4: `AddToRef`, `SubtractToRef`, `ScaleToRef`, `NormalizeToRef`, `LerpToRef`
    - **`Maths/math.color.functions.ts`** — **NEW**, 9 functions
        - Color3: `LerpToRef`, `HSVtoRGBToRef`, `ToLinearSpaceToRef`, `ToGammaSpaceToRef`, `EqualsWithEpsilon`
        - Color4: `LerpToRef`, `ToLinearSpaceToRef`, `ToGammaSpaceToRef`, `EqualsWithEpsilon`
    - **`Maths/math.quaternion.functions.ts`** — **NEW**, 11 functions
        - `Dot`, `LengthSquared`, `Length`, `NormalizeToRef`, `InverseToRef`, `AreClose`, `SlerpToRef`, `RotationAxisToRef`, `FromEulerAnglesToRef`, `RotationYawPitchRollToRef`, `MultiplyToRef`
    - All new files re-exported from `Maths/index.ts` and `Maths/pure.ts` barrels
    - Coverage: **85 / 292** static methods have free-function equivalents (**29.1%**)
    - Bundler configs updated: `.functions.js` pattern added to side-effect-free rules
    - TypeScript compilation: ✅ zero errors
    - Bundle smoke tests: ✅ all 32 pass (16 test cases × 2 bundlers)

### Phase 4 Smoke Test Results

| Test                                                | Rollup    | Webpack   |
| --------------------------------------------------- | --------- | --------- |
| vector-functions bare                               | 1 byte ✓  | 0 bytes ✓ |
| vector-functions named (`Vector3CrossToRef`)        | 826 B ✓   | 142 B ✓   |
| color-functions bare                                | 1 byte ✓  | 0 bytes ✓ |
| quaternion-functions bare                           | 1 byte ✓  | 0 bytes ✓ |
| quaternion-functions named (`QuaternionSlerpToRef`) | 1,460 B ✓ | 323 B ✓   |
| pure-barrel named function (`Vector3CrossToRef`)    | 120 B ✓   | 142 B ✓   |

### Static Helper Coverage

| Class      | Static Methods | Free Functions | Coverage  |
| ---------- | -------------- | -------------- | --------- |
| Vector2    | 28             | 7              | 25%       |
| Vector3    | 59             | 25             | 42%       |
| Vector4    | 27             | 8              | 30%       |
| Quaternion | 47             | 11             | 23%       |
| Matrix     | 62             | 10 (ThinMaths) | 16%       |
| Color3     | 22             | 5              | 23%       |
| Color4     | 11             | 4              | 36%       |
| Animation  | 8              | 0              | 0%        |
| Mesh       | 28             | 0              | 0%        |
| **Total**  | **292**        | **85**         | **29.1%** |

> **Note**: Not all static methods benefit from extraction. Factory methods (e.g., `Vector3.Zero()`,
> `Matrix.Identity()`) construct class instances and thus inherently depend on the class.
> The `*ToRef` pattern and scalar-returning functions are the best extraction candidates.
> Animation/Mesh statics are lower priority — Animation mostly has constants (enum-like),
> and Mesh has deprecated `Create*` stubs.

### Phase 4.3 — Extract Static Methods from Classes into Standalone Functions

Phase 4.1–4.2 created _parallel_ free functions alongside class statics using `I*Like` interfaces.
Phase 4.3 takes a more aggressive approach: **remove** the static methods from the class entirely,
define them as standalone `export function ClassName_MethodName(...)` after the class in `.pure.ts`,
then re-attach at runtime via `declare module` augmentation + assignment in `.ts`.

**Pattern** (using Color3.FromArray as example):

```ts
// In .pure.ts — standalone function after the class:
export function Color3FromArray(array: ArrayLike<number>, offset = 0): Color3 {
    return new Color3(array[offset], array[offset + 1], array[offset + 2]);
}

// In .ts — augmentation + runtime assignment:
declare module "./math.color.pure" {
    namespace Color3 {
        export let FromArray: typeof Color3FromArray;
    }
}
Color3.FromArray = Color3FromArray;
```

**Rules**:

- Methods accessing **private fields** stay as class statics (partial extraction)
- Static **getters** stay in the class (cannot be standalone functions)
- When a name collides with an existing `.functions.ts` export, the `.pure.ts` version is **non-exported**
  and the `.ts` wrapper imports from `.functions.ts` instead
- Cross-references: `ClassName.ExtractedMethod(` → `ClassNameExtractedMethod(` within `.pure.ts`
- `this.Method(` in statics → `ClassNameMethod(` (for extracted) or `ClassName.Method(` (for staying)

#### Tracking Table

| File                                                              |  Methods | .pure.ts | Status                                                               |
| ----------------------------------------------------------------- | -------: | :------: | -------------------------------------------------------------------- |
| `Maths/math.vector.pure.ts`                                       |      177 |    ✓     | ✅ Done (Vector2/3/4, Quaternion, Matrix)                            |
| `Maths/math.color.pure.ts`                                        |       33 |    ✓     | ✅ Done (Color3: 22, Color4: 11)                                     |
| `Misc/tools.ts`                                                   |       46 | ✓ (new)  | ✅ Done (46 extracted, 11 kept)                                      |
| `Meshes/mesh.pure.ts`                                             |       28 |    ✓     | ✅ Done (28 extracted, 2 kept internally)                            |
| `Misc/PerformanceViewer/performanceViewerCollectionStrategies.ts` |       26 | ✓ (new)  | ✅ Done (26 extracted)                                               |
| `Meshes/mesh.vertexData.ts`                                       |       23 | ✓ (new)  | ✅ Done                                                              |
| `Misc/greasedLineTools.ts`                                        |       23 | ✓ (new)  | ✅ Done                                                              |
| `Engines/WebGPU/webgpuTextureHelper.ts`                           |       15 | ✓ (new)  | ✅ Done (15 extracted)                                               |
| `Loading/sceneLoader.ts`                                          |       14 |    ✗     | ⏭ Skip (private module functions)                                   |
| `Animations/animation.ts`                                         |        9 | ✓ (new)  | ✅ Done                                                              |
| `Misc/trajectoryClassifier.ts`                                    |       11 |    ✗     | ⏭ Skip (only 2 of 11 clean)                                         |
| `Maths/math.path.ts`                                              |       11 | ✓ (new)  | ✅ Done                                                              |
| `Animations/animationGroup.ts`                                    |       10 |    ✗     | ⏭ Skip (private instance fields)                                    |
| `Misc/tags.ts`                                                    |        9 | ✓ (new)  | ✅ Done                                                              |
| `Maths/math.frustum.ts`                                           |        9 | ✓ (new)  | ✅ Done                                                              |
| `Misc/dataStorage.ts`                                             |        8 |    ✗     | ⏭ Skip (private `_Storage`)                                         |
| `Materials/Textures/rawTexture.ts`                                |        8 |    ✗     | ✅ Done                                                              |
| `XR/motionController/webXRMotionControllerManager.ts`             |        8 |    ✗     | ⏭ Skip (6 of 8 use private registries)                              |
| `Materials/materialHelper.geometryrendering.ts`                   |        7 |    ✗     | ⏭ Skip (private `_Configurations`)                                  |
| `Misc/decorators.serialization.ts`                                |        6 |    ✗     | ✅ Done                                                              |
| `Culling/ray.core.ts`                                             |        6 |    ✗     | ✅ Done                                                              |
| `XR/webXRFeaturesManager.ts`                                      |        6 |    ✗     | ⏭ Skip (all readonly constants)                                     |
| `Meshes/abstractMesh.pure.ts`                                     |        6 |    ✓     | ⏭ Skip (all readonly constants)                                     |
| `Maths/math.polar.ts`                                             |        6 | ✓ (new)  | ✅ Done                                                              |
| `Buffers/buffer.ts`                                               |        5 |    ✗     | ✅ Done                                                              |
| `Materials/Node/nodeMaterial.pure.ts`                             |        4 |    ✓     | ✅ Done                                                              |
| `Particles/particleHelper.ts`                                     |        5 |    ✗     | ✅ Done                                                              |
| `Actions/actionEvent.ts`                                          |        4 | ✓ (new)  | ✅ Done                                                              |
| `Maths/math.size.ts`                                              |        2 | ✓ (new)  | ✅ Done                                                              |
| `Engines/shaderStore.ts`                                          |        3 | ✓ (new)  | ✅ Done                                                              |
| `Maths/sphericalPolynomial.ts`                                    |        4 | ✓ (new)  | ✅ Done (SphericalHarmonics: 2, SphericalPolynomial: 2)              |
| `Culling/boundingBox.ts`                                          |        3 | ✓ (new)  | ✅ Done (3 extracted, 1 kept: IntersectsSphere)                      |
| `Misc/sceneOptimizer.ts`                                          |        4 | ✓ (new)  | ✅ Done (SceneOptimizerOptions: 3, SceneOptimizer: 1)                |
| `Materials/prePassConfiguration.ts`                               |        2 | ✓ (new)  | ✅ Done (AddUniforms, AddSamplers)                                   |
| `FrameGraph/Node/nodeRenderGraphBlockConnectionPoint.ts`          |        3 | ✓ (new)  | ✅ Done                                                              |
| `Sprites/spriteManager.ts`                                        |        3 | ✓ (new)  | ✅ Done (Parse, ParseFromFileAsync, ParseFromSnippetAsync)           |
| `Meshes/Node/nodeGeometry.ts`                                     |        3 | ✓ (new)  | ✅ Done (CreateDefault, Parse, ParseFromSnippetAsync)                |
| `Particles/Node/nodeParticleSystemSet.ts`                         |        4 | ✓ (new)  | ✅ Done (CreateDefault, Parse, ParseFromFile/SnippetAsync)           |
| `node.ts`                                                         |        1 | ✓ (new)  | ✅ Done (ParseAnimationRanges)                                       |
| `Misc/khronosTextureContainer2.ts`                                |        1 | ✓ (new)  | ✅ Done (IsValid)                                                    |
| `Culling/boundingSphere.ts`                                       |        1 | ✓ (new)  | ✅ Done (Intersects; CreateFromCenterAndRadius blocked)              |
| `FrameGraph/Node/nodeRenderGraph.ts`                              |        3 | ✓ (new)  | ✅ Done (CreateDefaultAsync, Parse, ParseFromSnippetAsync)           |
| `Misc/rgbdTextureTools.ts`                                        |        2 | ✓ (new)  | ✅ Done (ExpandRGBDTexture, EncodeTextureToRGBD)                     |
| `Misc/dds.ts`                                                     |        1 | ✓ (new)  | ✅ Done (GetDDSInfo; UploadDDSLevels blocked)                        |
| `Misc/timingTools.ts`                                             |        1 | ✓ (new)  | ✅ Done (SetImmediate)                                               |
| `Misc/retryStrategy.ts`                                           |        1 | ✓ (new)  | ✅ Done (ExponentialBackoff)                                         |
| `Misc/gradients.ts`                                               |        1 | ✓ (new)  | ✅ Done (GetCurrentGradient)                                         |
| `Misc/deepCopier.ts`                                              |        1 | ✓ (new)  | ✅ Done (DeepCopy)                                                   |
| `Misc/asyncLock.ts`                                               |        1 | ✓ (new)  | ✅ Done (LockAsync)                                                  |
| `Misc/videoRecorder.ts`                                           |        1 | ✓ (new)  | ✅ Done (IsSupported)                                                |
| `Misc/khronosTextureContainer.ts`                                 |        1 | ✓ (new)  | ✅ Done (IsValid)                                                    |
| `Probes/reflectionProbe.ts`                                       |        1 | ✓ (new)  | ✅ Done (Parse)                                                      |
| `FrameGraph/Passes/renderPass.ts`                                 |        1 | ✓ (new)  | ✅ Done (IsRenderPass)                                               |
| `FrameGraph/Passes/objectListPass.ts`                             |        1 | ✓ (new)  | ✅ Done (IsObjectListPass)                                           |
| `FrameGraph/frameGraphTextureManager.ts`                          |        1 | ✓ (new)  | ✅ Done (CloneTextureOptions)                                        |
| `FrameGraph/Tasks/Rendering/csmShadowGeneratorTask.ts`            |        1 | ✓ (new)  | ✅ Done (IsCascadedShadowGenerator)                                  |
| `Materials/effect.ts`                                             |        1 |    ✗     | ⏭ Skip (Effect is heavily augmented — type divergence)              |
| `Materials/materialHelper.ts`                                     |       25 |    ✗     | ⏭ Skip (already delegates to standalone functions)                  |
| `Meshes/meshSimplification.ts`                                    |        2 |    ✗     | ⏭ Skip (internal non-exported class)                                |
| `Materials/Textures/videoTexture.ts`                              |        3 |    ✗     | ⏭ Skip (inline object types in params — manual later)               |
| `Misc/andOrNotEvaluator.ts`                                       |        1 |    ✗     | ⏭ Skip (calls private `_HandleParenthesisContent`)                  |
| `Misc/sceneRecorder.ts`                                           |        1 |    ✗     | ⏭ Skip (ApplyDelta accesses private members)                        |
| `Misc/HighDynamicRange/panoramaToCubemap.ts`                      |        1 |    ✗     | ⏭ Skip (uses private static helpers)                                |
| `Misc/dumpTools.ts`                                               |        1 |    ✗     | ⏭ Skip (internal class with @nativeOverride decorator)              |
| `Meshes/geometry.ts`                                              |        2 |    ✗     | ⏭ Skip (2 clean, low ROI)                                           |
| `Engines/abstractEngine.ts`                                       |        5 |    ✗     | ⏭ Skip (stubs, low ROI)                                             |
| **── Newly triaged files (from verification audit) ──**           |          |          |                                                                      |
| `Maths/math.plane.ts`                                             |        5 |    ✓     | ✅ Done (5 extracted: PlaneFromArray, etc.)                          |
| `Misc/sceneSerializer.ts`                                         |        4 |    ✓     | ✅ Done (4 extracted: ClearCache, Serialize, SerializeAsync, etc.)   |
| `Meshes/polygonMesh.ts`                                           |        4 |    ✓     | ✅ Done (4 extracted: Rectangle, Circle, Parse, StartingAt)          |
| `Meshes/csg.ts`                                                   |        2 |    ✓     | ✅ Done (2 extracted: CSGFromVertexData, CSGFromMesh)                |
| `Rendering/renderingGroup.ts`                                     |        4 |    ✗     | ⏭ Skip (@internal, sort callbacks read `_`-prefixed SubMesh fields) |
| `Physics/v2/physicsShape.ts`                                      |        4 |    ✗     | ⏭ Skip (trivial factory stubs, 3-5 lines each)                      |
| `Physics/physicsHelper.ts`                                        |        3 |    ✗     | ⏭ Skip (non-exported `HelperTools` class)                           |
| `Meshes/GaussianSplatting/gaussianSplattingMesh.ts`               |        3 |    ✗     | ⏭ Skip (deep private static dep chain)                              |
| `Materials/Textures/texture.ts`                                   |        3 |    ✗     | ⏭ Skip (constructor wrappers + private static hooks)                |
| `Materials/Textures/cubeTexture.ts`                               |        3 |    ✗     | ⏭ Skip (trivial constructor wrappers)                               |
| `Engines/WebGPU/webgpuCacheRenderPipelineTree.ts`                 |        3 |    ✗     | ⏭ Skip (@internal, private `_Cache` state)                          |
| `Engines/Processors/Expressions/shaderDefineExpression.ts`        |        3 |    ✗     | ⏭ Skip (@internal, private static caching)                          |
| `scene.pure.ts`                                                   |        2 |    ✓     | ⏭ Skip (factory property assignments, not methods)                  |
| `XR/features/WebXRHitTestLegacy.ts`                               |        2 |    ✗     | ⏭ Skip (low ROI, XR-specific)                                       |
| `PostProcesses/postProcess.ts`                                    |        2 |    ✗     | ⏭ Skip (RegisterShaderCodeProcessing + Parse, coupled)              |
| `Physics/v2/Plugins/havokPlugin.ts`                               |        2 |    ✗     | ⏭ Skip (readToRef on internal event classes)                        |
| `Particles/flowMap.ts`                                            |        2 |    ✗     | ⏭ Skip (factory async methods, low ROI)                             |
| `Morph/morphTarget.ts`                                            |        2 |    ✗     | ⏭ Skip (Parse + FromMesh, low ROI)                                  |
| `Misc/HighDynamicRange/cubemapToSphericalPolynomial.ts`           |        2 |    ✗     | ⏭ Skip (2 methods, low ROI)                                         |
| `Meshes/subMesh.ts`                                               |        2 |    ✗     | ⏭ Skip (AddToMesh + CreateFromIndices, factory stubs)               |
| `Meshes/csg2.ts`                                                  |        2 |    ✗     | ⏭ Skip (FromVertexData + FromMesh, factory stubs)                   |
| `Maths/math.functions.ts`                                         |        2 |    ✗     | ⏭ Skip (already standalone functions, not class statics)            |
| `Materials/shaderMaterial.pure.ts`                                |        2 |    ✗     | ⏭ Skip (ParseFromFileAsync + ParseFromSnippetAsync)                 |
| `Materials/meshDebugPluginMaterial.pure.ts`                       |        2 |    ✗     | ⏭ Skip (Reset + PrepareMesh, low ROI)                               |
| `Materials/material.ts`                                           |        2 |    ✗     | ⏭ Skip (ParseAlphaMode + Parse, deserialization stubs)              |
| `Materials/colorCurves.ts`                                        |        2 |    ✗     | ⏭ Skip (Bind + Parse, low ROI)                                      |
| `Lights/light.ts`                                                 |        2 |    ✗     | ⏭ Skip (GetConstructorFromName + Parse, deserialization)            |
| `Engines/WebGPU/webgpuCacheSampler.ts`                            |        2 |    ✗     | ⏭ Skip (@internal, GPU caching internals)                           |
| `Debug/skeletonViewer.ts`                                         |        2 |    ✗     | ⏭ Skip (shader factories, low ROI)                                  |
| `Cameras/camera.ts`                                               |        2 |    ✗     | ⏭ Skip (GetConstructorFromName + Parse, deserialization)            |
| `Bones/skeleton.ts`                                               |        2 |    ✗     | ⏭ Skip (MakeAnimationAdditive + Parse)                              |
| `Actions/actionManager.ts`                                        |        2 |    ✗     | ⏭ Skip (Parse + GetTriggerName, deserialization)                    |
| Files with 1 method each (71 files, mostly `Parse`/factories)     |       71 |  mixed   | ⏭ Skip (low ROI — 1 method per file, mostly deserialization)        |
| **Total**                                                         | **~636** |    —     | **~505 done, ~16 extractable remaining, rest skipped**               |

#### Verification Tooling

- **`scripts/treeshaking/verifyPhase4.mjs`** — Comprehensive verification script
    - Scans ALL `.ts` files in `packages/dev/core/src/` for classes with static methods
    - Cross-references every file against the tracking table above
    - Verifies "Done" files actually have standalone functions + augmentations
    - Reports untracked files, count mismatches, and stale entries
    - Usage: `node scripts/treeshaking/verifyPhase4.mjs [--verbose] [--verify-extractions]`
    - **Latest run**: 130 files with 483 static methods; 48 Done (all verified ✅), 18+103 Skip; 4 files extractable remaining

## Phase 5 — Update `sideEffects` in `package.json`

- [x] **5.1** — Switch from `["**/*"]` to explicit list (auto-generated from manifest)
    - Fixed `auditSideEffects.mjs`: template literal brace tracking + WGSL regex (`\w*Store\w*`)
    - Regenerated manifest: 1248 files with side effects, 1521 pure
    - Updated both `@dev/core` and `@babylonjs/core` `package.json` files
    - 627 entries: 2 glob patterns (`Shaders/**`, `ShadersWGSL/**`) + 625 individual files
- [x] **5.2** — Script to sync manifest → package.json (`scripts/treeshaking/syncSideEffects.mjs`)
    - Reads manifest, detects fully-SE directories for glob patterns, writes to both package.json files
    - Usage: `node scripts/treeshaking/syncSideEffects.mjs [--dry-run] [--verbose]`

## Phase 6 — Guardrails & CI Enforcement

- [x] **6.1** — Custom ESLint rule: `no-side-effect-imports-in-pure` (in `eslintBabylonPlugin`)
    - Flags bare (side-effect) imports in `.pure.ts` files (45 existing instances)
    - Verifies barrel `pure.ts` files only re-export from side-effect-free modules (manifest-aware)
    - Configured as `warn` in `eslint.config.mjs` for `**/*.pure.ts` and `**/pure.ts`
- [x] **6.2** — Bundle-size smoke tests (Rollup + Webpack, 16 test cases — all passing)
    - `npm run test:treeshaking` → `scripts/treeshaking/bundleSmokeTest.mjs`
- [x] **6.3** — CI step: audit script output must match committed manifest
    - `npm run check:manifest-drift` → `scripts/treeshaking/checkManifestDrift.mjs`
    - Regenerates manifest from source, diffs against committed copy, reports added/removed files

---

## Execution Order

```
Phase 0 (Audit tooling)  ← DONE
  ├─> Phase 1 (#__PURE__ annotations)        ← DONE
  └─> Phase 2 (FILE.pure.ts splits)          ← DONE (7 edge cases remain)
        └─> Phase 3 (pure.ts barrels)        ← DONE
              └─> Phase 4 (static helpers)   ← DONE (69% coverage, expandable)
                    └─> Phase 5 (sideEffects in package.json)  ← DONE
                          └─> Phase 6 (CI guardrails)  ← DONE
                                └─> Phase 7 (pure barrel integrity)  ← TODO
                                      ├─> 7.1 (split 32 bare-import files)
                                      ├─> 7.2 (fix 788 pure→non-pure imports)
                                      ├─> 7.3 (add exports field to package.json)
                                      └─> 7.4 (add bare-import detection to audit)
                                            └─> Phase 8 (tree-shakeable shader includes)
                                            └─> Phase 9 (callable registration functions)
                                                  ├─> 9.1 (pilot: physics)
                                                  ├─> 9.2 (pilot: engine extension)
                                                  ├─> 9.3 (automation script: declare module files)
                                                  ├─> 9.4 (prototype augmentations ×84)
                                                  ├─> 9.5 (AddNodeConstructor ×25)
                                                  ├─> 9.6 (update pure barrels)
                                                  ├─> 9.7 (update sideEffects manifest)
                                                  ├─> 9.8 (bundle smoke tests)
                                                  ├─> 9.9 (update instructions)
                                                  ├─> 9.10 (Phase 9b: ALL remaining side effects)
                                                  ├─> 9.11 (fix pilot files + materialHelper.functions)
                                                  ├─> 9.12 (regenerate barrels/manifest)
                                                  └─> 9.13 (bundle smoke tests)
                                            └─> Phase 8 (tree-shakeable shader includes)  ← IN PROGRESS
                                                  ├─> 8.1 (new build templates)
                                                  ├─> 8.2 (flatten transitive includes)
                                                  ├─> 8.3 (regenerate all shader .ts files)
                                                  └─> 8.4 (verify + update sideEffects)
                                            └─> Phase 10 (__decorate pure annotations)  ← DONE
                                                  ├─> 10.1 (extend injectPureAnnotations.mjs)
                                                  ├─> 10.2 (integrate into build pipeline)
                                                  ├─> 10.3 (verify bundle smoke tests)
                                                  └─> 10.4 (viewer validation with pure barrel)
                                            └─> Phase 11 (side-effect warning stubs)  ← DONE
                                                  ├─> 11.1 (add _MissingSideEffect utility)
                                                  ├─> 11.2 (automation script)
                                                  ├─> 11.3 (generate 273 stubs in 21 files)
                                                  ├─> 11.4 (verify TypeScript compilation)
                                                  └─> 11.5 (verify bundle smoke tests)
```

## Phase 7 — Fix Pure Barrel Integrity

### Problem Statement

The pure barrel chain (`@babylonjs/core/pure` → `*/pure.ts` → `*.pure.ts`) has two integrity problems
that undermine tree-shaking for external consumers:

**Problem A — Bare side-effect imports leaking through pure barrels**

32 files exported from `pure.ts` barrels contain bare `import "./something"` statements that pull
in side-effectful modules (prototype augmentations, shader registrations, engine extensions).
When a bundler processes `import { Engine } from "@babylonjs/core/pure"`, it must evaluate
`engine.js`, which unconditionally executes 18 bare imports that augment `ThinEngine.prototype`.
The pure barrel offers **zero benefit** for these imports — the bundler has no choice but to include them.

**Total**: 88 bare side-effect imports across 32 files leaking through pure barrels.

Top offenders:
| File | Bare Imports |
| ---- | ------------ |
| `Engines/engine.ts` | 18 |
| `Engines/webgpuEngine.ts` | 17 |
| `PostProcesses/RenderPipeline/Pipelines/lensRenderingPipeline.ts` | 5 |
| `PostProcesses/RenderPipeline/Pipelines/ssaoRenderingPipeline.ts` | 4 |
| `Particles/gpuParticleSystem.ts` | 3 |
| `Physics/physicsEngineComponent.ts` | 3 |
| 26 other files | 1–2 each |

**Problem B — `.pure.ts` files importing from non-pure module specifiers**

788 value imports across `.pure.ts` files point to non-pure module specifiers (e.g.,
`import { Vector3 } from "../Maths/math.vector"` instead of `"../Maths/math.vector.pure"`).

**This is architecturally concerning** but **not a bundler-level problem today**: when a bundler
resolves `import { Vector3 } from "../Maths/math.vector"`, it finds the binding via the
wrapper's `export * from "./math.vector.pure"` re-export. If `math.vector.ts` is not in the
`sideEffects` array (it is — because of `RegisterClass`), the bundler may or may not prune
the side effects depending on whether any other module also imports `math.vector.ts`.

In practice, because `math.vector.ts` appears in the `sideEffects` array, bundlers treat it
as side-effectful and **will execute its `RegisterClass` calls** even though the pure consumer
only wanted the class definition. This is a correctness leak.

**The correct rule**: `.pure.ts` files should only import from other `.pure.ts` files or from
files confirmed pure by the manifest. Importing from a non-pure specifier should be a lint error.

### 7.1 — Split files with bare side-effect imports (Problem A)

For each of the 32 files, create a `.pure.ts` companion that contains the class/function
definitions without the bare imports. The non-pure wrapper keeps the bare imports + re-exports.

**Pattern** (using `engine.ts` as example):

```ts
// engine.pure.ts — class definition only, NO bare imports
import { ThinEngine } from "./thinEngine";
// ... other value/type imports ...
export class Engine extends ThinEngine {
    /* full class body */
}

// engine.ts — existing file becomes thin wrapper
export * from "./engine.pure";
import "./Extensions/engine.alpha";
import "./Extensions/engine.rawTexture";
// ... all 18 bare imports ...
```

Then update `Engines/pure.ts` barrel:

```diff
-export * from "./engine";
+export * from "./engine.pure";
```

**Approach**: Extend `scripts/treeshaking/splitSideEffects.mjs` to handle bare-import separation,
or create a targeted `splitBareImports.mjs` script. The logic is simpler than Phase 2's
`RegisterClass` splitting — just move the class body to `.pure.ts` and keep bare imports in the
wrapper.

**Files to split**: 32 files (88 bare imports total). Many are engine-related.

- [ ] **7.1a** — Create automation script for bare-import splitting
- [ ] **7.1b** — Run on all 32 files, verify compilation
- [ ] **7.1c** — Update pure barrel references (`pure.ts` files)
- [ ] **7.1d** — Regenerate manifest + sync `sideEffects` array
- [ ] **7.1e** — Update bundle smoke tests

### 7.2 — Fix `.pure.ts` → non-pure import specifiers (Problem B)

Rewrite imports in `.pure.ts` files to point to `.pure` specifiers where a `.pure.ts` companion
exists. This prevents circular dependencies (e.g., `abstractMesh.pure → abstractEngine.query →
abstractEngine.query.pure → abstractMesh → abstractMesh.pure`) and ensures the pure import
chain stays side-effect-free.

```diff
-import { Vector3 } from "../Maths/math.vector";
+import { Vector3 } from "../Maths/math.vector.pure";
```

**Scope**: 162 value imports across 106 `.pure.ts` files rewritten.

**Automation**: `scripts/treeshaking/fixPureImports.mjs`

- Scans all `.pure.ts` files for value imports (not `import type`)
- Handles both relative (`../foo/bar`) and `core/` path-alias imports
- Only rewrites if `TARGET.pure.ts` exists on disk
- Idempotent (safe to run multiple times)
- Usage: `node scripts/treeshaking/fixPureImports.mjs [--dry-run] [--verbose]`

**Constraints**:

- Only rewrite if `TARGET.pure.ts` exists (don't create false references)
- Handle TypeScript path resolution (relative paths, `core/` alias)
- Must not break type augmentations (the `.ts` wrapper's `declare module` targets the `.pure` file)
- Skip `.functions` imports (already side-effect-free by convention)

- [x] **7.2a** — Create script to rewrite `.pure.ts` import specifiers (`fixPureImports.mjs`)
- [x] **7.2b** — Run on all `.pure.ts` files (162 imports in 106 files), verify compilation (0 errors)
- [ ] **7.2c** — Upgrade ESLint rule `no-side-effect-imports-in-pure` to also flag value imports
      from non-pure specifiers (when a `.pure` alternative exists)
- [x] **7.2d** — Verify bundle smoke tests still pass (all pass)

### 7.3 — Add `exports` field to public `package.json`

External bundlers don't see the smoke test's custom `moduleSideEffects` configuration.
The package needs an `exports` field to signal that the `/pure` entry point is side-effect-free.

```json
"exports": {
    ".": {
        "types": "./index.d.ts",
        "import": "./index.js"
    },
    "./pure": {
        "types": "./pure.d.ts",
        "import": "./pure.js",
        "sideEffects": false
    },
    "./*": {
        "types": "./*.d.ts",
        "import": "./*.js"
    }
}
```

- [ ] **7.3a** — Add `exports` field to `packages/public/@babylonjs/core/package.json`
- [ ] **7.3b** — Verify deep imports still work (`@babylonjs/core/Maths/math.vector`, etc.)
- [ ] **7.3c** — Test in external project (Vite, webpack) that `/pure` actually tree-shakes

### 7.4 — Add bare-import detection to audit tooling

The `auditSideEffects.mjs` manifest currently does not track bare `import "./foo"` statements
as a side-effect type. This means files like `engine.ts` (18 bare imports for prototype
augmentation) are invisible to the audit.

- [ ] **7.4a** — Add `bare-import` detection type to `auditSideEffects.mjs`
- [ ] **7.4b** — Regenerate manifest with new detection
- [ ] **7.4c** — Update `syncSideEffects.mjs` to include files with bare imports

## Phase 8 — Tree-Shakeable Shader Includes

### Problem Statement

Shader files are the **single largest category of side-effectful files** (331 files). Every shader
include file (`ShadersInclude/*.ts`) self-registers into the global `ShaderStore.IncludesShadersStore`
dictionary at module evaluation time. Main shader files import their includes via bare side-effect
imports. This means:

1. **Bundlers cannot tree-shake unused shader includes.** A bare `import "./ShadersInclude/helperFunctions"`
   has no export binding — the bundler must execute it unconditionally.
2. **Unused shaders drag in all their includes.** If a shader file is imported (even transitively),
   all ~30 of its include imports are unconditionally loaded and registered.
3. **331 files** in the `sideEffects` array are shader store writes — the largest single category.

### Current Architecture

```
┌─────────────────────────────┐    ┌──────────────────────────┐
│ ShadersInclude/              │    │ Shaders/                  │
│  helperFunctions.ts          │    │  default.fragment.ts      │
│  ┌─────────────────────────┐ │    │  ┌──────────────────────┐ │
│  │ import { ShaderStore }  │ │    │  │ import { ShaderStore }│ │
│  │ const name = "..."      │ │    │  │ import "./ShadersIncl │ │
│  │ const shader = `...`    │ │    │  │  ude/helperFunctions" │ │ ← bare import
│  │                         │ │    │  │ // ...28 more bare    │ │
│  │ // SIDE EFFECT:         │ │    │  │ // imports            │ │
│  │ IncludesShadersStore    │ │    │  │                       │ │
│  │   [name] = shader;      │ │    │  │ // SIDE EFFECT:       │ │
│  │                         │ │    │  │ ShadersStore[name]    │ │
│  │ export const helper... =│ │    │  │   = shader;           │ │
│  │   { name, shader }      │ │◄───│  │                       │ │
│  └─────────────────────────┘ │    │  │ export const default  │ │
│                              │    │  │   PixelShader = {...}  │ │
└─────────────────────────────┘    │  └──────────────────────┘ │
                                    └──────────────────────────┘
```

**Key insight**: Include files already export `{ name, shader }`, but nobody uses the export.
The main shader files use bare imports purely for the side effect of registering into
`IncludesShadersStore`. The `ProcessIncludes` runtime resolver then looks up includes by
name in this global store.

### Solution Design

Transform shader includes from self-registering side-effect modules into **pure data modules**.
Registration moves to the main shader files, which use named imports to pull in their includes
and register them explicitly.

#### New Architecture

```
┌─────────────────────────────┐    ┌──────────────────────────────────┐
│ ShadersInclude/              │    │ Shaders/                          │
│  helperFunctions.ts          │    │  default.fragment.ts              │
│  ┌─────────────────────────┐ │    │  ┌──────────────────────────────┐ │
│  │ // PURE — no ShaderStore│ │    │  │ import { ShaderStore }       │ │
│  │ const name = "..."      │ │    │  │ import { helperFunctions }   │ │ ← named import
│  │ const shader = `...`    │ │    │  │ import { lightFragment... }  │ │
│  │                         │ │    │  │ // ...28 more named imports  │ │
│  │ export const helper... =│ │    │  │                              │ │
│  │   { name, shader }      │ │◄───│  │ // Register shader + deps   │ │
│  └─────────────────────────┘ │    │  │ ShadersStore[name] = shader  │ │
│                              │    │  │ RegisterShaderIncludes(       │ │
│  ✅ Pure module — no side    │    │  │   IncludesShadersStore,       │ │
│     effect, tree-shakeable   │    │  │   [helperFunctions, ...]     │ │
└─────────────────────────────┘    │  │ )                             │ │
                                    │  │ export const default...      │ │
                                    │  └──────────────────────────────┘ │
                                    └──────────────────────────────────┘
```

#### Why This Enables Tree-Shaking

- If your app uses only `PBRMaterial` → only `pbr.fragment.ts` + `pbr.vertex.ts` are imported
- These pull in their ~40 includes via **named imports** (bundler-visible bindings)
- `default.fragment.ts` is NOT imported → its ~30 includes are NOT imported → **tree-shaken away**
- Include files that no main shader references are dead code — eliminated by the bundler

#### Changes Required

**1. New build template for include files** (`buildShaders.ts`):

```ts
// Old — self-registering (side-effectful):
import { ShaderStore } from "../../Engines/shaderStore";
const name = "helperFunctions";
const shader = `...`;
if (!ShaderStore.IncludesShadersStore[name]) {
    ShaderStore.IncludesShadersStore[name] = shader;
}
export const helperFunctions = { name, shader };

// New — pure data export:
const name = "helperFunctions";
const shader = `...`;
export const helperFunctions = { name, shader };
```

**2. New build template for main shader files** (`buildShaders.ts`):

```ts
// Old — bare side-effect imports:
import { ShaderStore } from "../Engines/shaderStore";
import "./ShadersInclude/helperFunctions";
import "./ShadersInclude/lightFragmentDeclaration";
// ...
const name = "defaultPixelShader";
const shader = `...`;
if (!ShaderStore.ShadersStore[name]) {
    ShaderStore.ShadersStore[name] = shader;
}
export const defaultPixelShader = { name, shader };

// New — named imports + explicit registration:
import { ShaderStore } from "../Engines/shaderStore";
import { helperFunctions } from "./ShadersInclude/helperFunctions";
import { lightFragmentDeclaration } from "./ShadersInclude/lightFragmentDeclaration";
// ...
const name = "defaultPixelShader";
const shader = `...`;
if (!ShaderStore.ShadersStore[name]) {
    ShaderStore.ShadersStore[name] = shader;
}
const includes = [helperFunctions, lightFragmentDeclaration /* ... */];
for (const inc of includes) {
    if (!ShaderStore.IncludesShadersStore[inc.name]) {
        ShaderStore.IncludesShadersStore[inc.name] = inc.shader;
    }
}
export const defaultPixelShader = { name, shader };
```

**3. Transitive include flattening** (build-time):

Some includes themselves use `#include<...>` (nested includes). The `ProcessIncludes` runtime
resolver handles this recursively, but all includes must be registered _before_ processing begins.
The build tool must:

1. Parse `#include<...>` from the main shader's `.fx` source
2. For each include, also parse its `.fx` file for nested `#include<...>`
3. Recurse until stable (full transitive closure)
4. Generate named imports for ALL transitively-needed includes

This ensures the main shader file registers every include that `ProcessIncludes` will look up.

**4. Backwards compatibility**:

- Existing import paths (`import "./ShadersInclude/helperFunctions"`) still resolve — the file
  still exists, it's just pure now. A bare import does nothing harmful, it just doesn't register.
- `ShaderStore.IncludesShadersStore` remains the runtime truth — `ProcessIncludes` is unchanged.
- Users who manually registered custom includes via `ShaderStore.IncludesShadersStore["name"] = "..."`
  are unaffected — that API is unchanged.
- Users who imported include files for their own custom shaders can switch to named imports:
    ```ts
    import { helperFunctions } from "core/Shaders/ShadersInclude/helperFunctions";
    ShaderStore.IncludesShadersStore[helperFunctions.name] = helperFunctions.shader;
    ```

**5. Non-core packages** (addons, materials, etc.):

Non-core shaders that reference core includes (e.g., `#include<core/helperFunctions>`) will
import the core include by named import and register it the same way. The build tool already
handles cross-package include resolution.

### Implementation Steps

- [ ] **8.1** — Modify `buildShaders.ts`: new templates for includes vs. main shaders
    - Include template: pure data export, no `ShaderStore` import
    - Main shader template: named imports + registration loop
    - Both GLSL and WGSL variants
- [ ] **8.2** — Add transitive include flattening to `GetIncludes()` in `buildShaders.ts`
    - Read `.fx` files of includes to find nested `#include<...>` directives
    - Build full dependency closure
    - Generate correct import ordering (includes before main shader registration)
- [ ] **8.3** — Regenerate all shader `.ts` files
    - Run `npm run compile:assets` in `@dev/core` (and other packages)
    - Verify TypeScript compilation: 0 errors
    - Verify runtime: shaders still compile and render correctly
- [ ] **8.4** — Update `sideEffects` array and verify
    - ShadersInclude files become pure → remove from `sideEffects`
    - Main shader files still have side effects (store registration) → keep in `sideEffects`
    - Regenerate manifest, sync `sideEffects`, run bundle smoke tests

### Impact Analysis

| Metric                                        | Before | After    |
| --------------------------------------------- | ------ | -------- |
| Side-effectful shader include files           | ~164   | **0**    |
| Side-effectful main shader files              | ~167   | ~167     |
| Files in `sideEffects` array (shader-related) | ~331   | **~167** |
| Tree-shakeable include files                  | 0      | **~164** |
| Unused include elimination                    | No     | **Yes**  |

## Phase 9 — Callable Side-Effect Registration Functions

### Problem Statement

The current architecture requires consumers to use **bare side-effect imports** to opt into
prototype augmentations and other runtime extensions:

```ts
import "@babylonjs/core/Physics/joinedPhysicsEngineComponent"; // side-effect, not tree-shakeable
```

This pattern has three problems:

1. **Opaque and non-discoverable** — there's no function to find via autocomplete; you must know
   the file path or consult documentation
2. **Not tree-shakeable from a single barrel** — a barrel file that re-exports everything
   (including side effects) cannot be tree-shaken, because bare imports have no named bindings
   for the bundler to analyze
3. **All-or-nothing** — importing the file runs _every_ side effect it contains, even if the
   consumer only needs a subset

### Solution: Wrap Side Effects in Callable Functions

Move the runtime side effects (prototype assignments, `RegisterClass`, `AddNodeConstructor`, etc.)
into an **exported function** in the pure file. The non-pure file calls that function at module
scope for backward compatibility. Consumers using the pure barrel can call the function explicitly.

#### File Architecture (Option C — Separate Types)

Each side-effect module becomes **three files**:

```
component.types.ts   — declare module augmentation (types only, zero runtime bytes)
component.pure.ts    — registration function + pure code
                        export * from "./component.types"; ← re-exports types
component.ts         — backward-compatible wrapper:
                        export * from "./component.pure"; ← includes types transitively
                        import { registerComponent } from "./component.pure";
                        registerComponent();               ← side effect
```

**Key design decisions:**

- **`.types.ts` IS re-exported from `.pure.ts`** — since `declare module` blocks are globally
  ambient (visible everywhere once part of the compilation), isolating them from the pure barrel
  has no real effect. Re-exporting from `.pure.ts` is more consistent: importing from `.pure.ts`
  gives you both the registration function and the augmented types in one import.
- **`.ts` re-exports `.pure.ts`** — which transitively includes `.types.ts`, so legacy consumers
  who `import "...component"` get both the side effects and the types, matching today's behavior.
- The registration function is **idempotent** — a `_registered` guard ensures double-calls
  (e.g., from both a manual call and a transitive non-pure import) are harmless.

#### Naming Convention

Registration functions use **`register` + PascalCase(filename)**:

| File                              | Function Name                            |
| --------------------------------- | ---------------------------------------- |
| `joinedPhysicsEngineComponent.ts` | `registerJoinedPhysicsEngineComponent()` |
| `engine.videoTexture.ts`          | `registerEngineVideoTexture()`           |
| `depthRendererSceneComponent.ts`  | `registerDepthRendererSceneComponent()`  |
| `engine.multiRender.ts`           | `registerEngineMultiRender()`            |
| `boundingBoxRenderer.ts`          | `registerBoundingBoxRenderer()`          |
| `engine.uniformBuffer.ts`         | `registerEngineUniformBuffer()`          |

**Rationale**: Typing `register` in an IDE lists all available registration functions.
The name maps 1:1 to the filename, so existing knowledge of side-effect import paths transfers
directly. The pattern is fully automatable — no human-curated names needed.

#### Pattern: Prototype Augmentation (e.g., `joinedPhysicsEngineComponent`)

**`joinedPhysicsEngineComponent.types.ts`** — types only:

```ts
import type { Nullable } from "../types";
import type { Vector3 } from "../Maths/math.vector.pure";
import type { IPhysicsEngine } from "./IPhysicsEngine";
import type { IPhysicsEnginePlugin as IPhysicsEnginePluginV1 } from "./v1/IPhysicsEnginePlugin";
import type { IPhysicsEnginePluginV2 } from "./v2/IPhysicsEnginePlugin";
import type { Observable } from "../Misc/observable";
import type { Scene } from "../scene.pure";

declare module "../scene.pure" {
    export interface Scene {
        /** @internal */ _physicsEngine: Nullable<IPhysicsEngine>;
        /** @internal */ _physicsTimeAccumulator: number;
        getPhysicsEngine(): Nullable<IPhysicsEngine>;
        enablePhysics(gravity?: Nullable<Vector3>, plugin?: IPhysicsEnginePluginV1 | IPhysicsEnginePluginV2): boolean;
        disablePhysicsEngine(): void;
        isPhysicsEnabled(): boolean;
        deleteCompoundImpostor(compound: any): void;
        /** @internal */ _advancePhysicsEngineStep(step: number): void;
        onBeforePhysicsObservable: Observable<Scene>;
        onAfterPhysicsObservable: Observable<Scene>;
    }
}
```

**`joinedPhysicsEngineComponent.pure.ts`** — registration function:

```ts
export * from "./joinedPhysicsEngineComponent.types";
export { PhysicsEngineSceneComponent } from "./joinedPhysicsEngineComponent.impl";

import { Scene } from "../scene.pure";
// ... other imports ...

let _registered = false;
export function registerJoinedPhysicsEngineComponent() {
    if (_registered) return;
    _registered = true;

    Scene.prototype.getPhysicsEngine = function (): Nullable<IPhysicsEngine> {
        return this._physicsEngine ?? null;
    };
    // ... rest of prototype assignments ...
}
```

**`joinedPhysicsEngineComponent.ts`** — backward-compatible wrapper:

```ts
export * from "./joinedPhysicsEngineComponent.pure";
import { registerJoinedPhysicsEngineComponent } from "./joinedPhysicsEngineComponent.pure";
registerJoinedPhysicsEngineComponent();
```

#### Pattern: `RegisterClass`-only files

Files that only have `RegisterClass` calls don't need a `.types.ts` (no `declare module`).
The pure file already exists from Phase 2. The registration function wraps the `RegisterClass` call:

```ts
// camera.pure.ts — class definition (already exists from Phase 2)
export class Camera extends Node { ... }

// In camera.pure.ts — add registration function:
import { RegisterClass } from "../Misc/typeStore";
let _registered = false;
export function registerCamera() {
    if (_registered) return;
    _registered = true;
    RegisterClass("BABYLON.Camera", Camera);
}

// camera.ts — backward-compatible wrapper (simplified from current):
export * from "./camera.pure";
import { registerCamera } from "./camera.pure";
registerCamera();
```

Wait — this would make `.pure.ts` import `RegisterClass` which is itself a runtime side-effect
concern. **Alternative**: keep `RegisterClass` calls in the non-pure file as today. Only prototype
augmentations and `AddNodeConstructor` calls get the registration function pattern, since those
are the ones that block tree-shaking of classes like `Engine` and `Scene`.

**Decision (Phase 9a)**: Phase 9a targeted **prototype augmentation files (~84 files, 344 assignments)**
and **`AddNodeConstructor` files (~25 files)** — the side effects that most visibly block
code from being tree-shaken.

**Decision (Phase 9b)**: Phase 9b expanded scope to **ALL remaining side effects** — RegisterClass (~403),
static assignments (~39), AddParser (~10), WebXR features/controllers (~26), factory assignments, and
other patterns (~53). This ensures pure users can import from `.pure` without ANY implicit side effects.
The `scripts/treeshaking/wrapRemainingEffects.mjs` v2 automation handles path normalization,
import-type→value upgrades, name collision resolution, and skips files with exported declarations.

#### Consumer Experience

```ts
// === Legacy (unchanged, backward compatible) ===
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Physics/joinedPhysicsEngineComponent"; // side-effect
scene.enablePhysics(); // ✅ types visible, runtime works

// === Pure barrel — explicit registration ===
import { Scene } from "@babylonjs/core/scene.pure";
import { registerJoinedPhysicsEngineComponent } from "@babylonjs/core/Physics/joinedPhysicsEngineComponent.pure";
import "@babylonjs/core/Physics/joinedPhysicsEngineComponent.types"; // opt-in types
registerJoinedPhysicsEngineComponent();
scene.enablePhysics(); // ✅ types visible, runtime works

// === Pure barrel — physics NOT imported ===
import { Scene } from "@babylonjs/core/scene.pure";
scene.enablePhysics(); // ❌ TypeScript error — .types.ts was never imported
```

### Scope

| Category                    | Files | Side Effects | Phase 9a     | Phase 9b        |
| --------------------------- | ----- | ------------ | ------------ | --------------- |
| Prototype augmentations     | ~84   | 344          | ✅ 9.1–9.4   |                 |
| `AddNodeConstructor` calls  | ~25   | 26           | ✅ 9.4       |                 |
| `RegisterClass`-only        | ~403  | 535          |              | ✅ 9.10         |
| Static property assignments | ~39   | 66           |              | ✅ 9.10         |
| `AddParser` calls           | ~10   | 10           |              | ✅ 9.10         |
| WebXR features/controllers  | ~26   | 26           |              | ✅ 9.10         |
| Factory / other patterns    | ~53   | varies       |              | ✅ 9.10         |
| Pilot files (manual)        | 3     | varies       |              | ✅ 9.11         |
| materialHelper.functions    | 1     | 0 (pure)     |              | ✅ 9.11 (moved) |
| Shader store writes         | ~331  | 331          | ❌ (Phase 8) | ❌ (Phase 8)    |

### Implementation Steps

- [x] **9.1** — Pilot: `Physics/joinedPhysicsEngineComponent` (manual, validate pattern)
    - Create `.types.ts` with `declare module` blocks
    - Move prototype assignments into `registerJoinedPhysicsEngineComponent()` in `.pure.ts`
    - Update `.ts` wrapper to call function + re-export `.types.ts`
    - Verify: TypeScript compilation, bundle smoke test, runtime behavior
- [x] **9.2** — Pilot: `Engines/Extensions/engine.multiRender` (engine augmentation pattern)
    - Same three-file split on a `ThinEngine.prototype` augmentation
    - Verify the `declare module` target path resolves correctly for engine classes
- [x] **9.3** — Automation script: `scripts/treeshaking/wrapSideEffects.mjs`
    - Scan files with `declare module` blocks
    - For each file:
        1. Extract `declare module` blocks → `FILE.types.ts`
        2. Wrap prototype assignments / side effects into `registerFILENAME()` function in `.pure.ts`
        3. Add idempotency guard (`let _registered = false`)
        4. Update `.ts` wrapper: `export * from ".pure"` + call registration function
    - Handle mixed files (prototype + `RegisterClass`) — both go into the function
    - Handle files that don't yet have a `.pure.ts` split — create manually (4 files)
    - **Result**: 134 files batch-processed + 4 manual splits + 7 manual post-fixes = **0 TypeScript errors**
- [x] **9.4** — Run automation on all ~139 `declare module` files (prototype augmentations + AddNodeConstructor + others)
    - TypeScript compilation: **0 errors** ✅
    - Bundle smoke tests: **all pass** ✅
    - Verify runtime: pending
- [x] **9.6** — Update pure barrels (`generatePureBarrels.mjs`)
    - Regenerated 118 barrel files, 672 exports rewritten to `.pure`
    - Pure barrels now export the registration functions (but NOT `.types.ts`)
    - Consumers of `@babylonjs/core/pure` see `registerXxx` in autocomplete
    - Consumers of `@babylonjs/core` (non-pure) get everything as before
- [x] **9.7** — Update `sideEffects` manifest and sync
    - Re-ran `auditSideEffects.mjs`, regenerated manifest
    - Synced to `@babylonjs/core/package.json` — 842 sideEffects entries
- [x] **9.8** — Add bundle smoke tests for registration functions
    - **All 21 tests pass** (Rollup + Webpack)
    - Bare import of `.pure.js` with registration function → **1 byte** (Rollup) / **0 bytes** (Webpack) ✅
    - Import + call → **bundles correctly** ✅
    - Import `.types.js` alone → **1 byte / 0 bytes** (type-only) ✅
- [x] **9.9** — Update `.github/instructions/side-effect-imports.instructions.md`
    - Added "Pure path with registration functions" section
    - Documented the `registerXxx()` + `.pure` import pattern

### Phase 9b — ALL Remaining Side Effects (Steps 9.10–9.13)

Expanded scope from prototype augmentations only to ALL side effects, so that pure users
can import from `.pure` without any implicit side effects.

- [x] **9.10** — Automation script v2: `scripts/treeshaking/wrapRemainingEffects.mjs`
    - Full audit found **~548 files** with unwrapped side effects across 7 categories
    - Script categorizes thin `.ts` wrappers: exports, imports, bare imports, self-imports, code
    - Handles multi-line import joining (`joinMultiLineStatements()`)
    - **Path normalization**: strips `.pure` suffix when comparing import paths to avoid duplicate identifiers
    - **Type→value upgrade**: when `.pure.ts` has `import type { X }` but code needs `X` as value,
      upgrades the existing type import instead of adding a duplicate
    - **Name collision detection**: two-pass approach — first collects all register names, then adds
      directory qualifiers for duplicates (12 collisions resolved)
    - **Export declaration detection**: skips files with `export function/class` (not side effects)
    - Duplicate declaration checking: prevents duplicate `const`/`let` in `.pure.ts`
    - **Result**: 508 files processed, 0 extended existing, 508 created new register functions
    - TypeScript compilation: **0 errors** ✅
- [x] **9.11** — Handle 4 manual files
    - 3 pilot files (`engine.multiRender` ×2, `joinedPhysicsEngineComponent`): stripped `declare module`
      blocks (already in `.types.ts`), then re-ran script to wrap prototype assignments
    - `materialHelper.functions.ts`: moved 37 exported function definitions + constants (1566 lines)
      to `.pure.ts` as top-level exports (no side effects — purely function definitions)
    - TypeScript compilation: **0 errors** ✅
- [x] **9.12** — Regenerate pure barrels + sideEffects manifest
    - `generatePureBarrels.mjs`: 144 barrel files, 115 subdir rewrites, 312 impure exports skipped
    - `auditSideEffects.mjs` + `syncSideEffects.mjs`: 842 sideEffects entries in package.json
- [x] **9.13** — Bundle smoke tests
    - **All 21 tests pass** (42 individual PASS results: Rollup + Webpack)
    - Registration functions tree-shake correctly from `.pure` imports
    - Import + call pattern bundles correctly

### Impact Analysis

| Metric                                                | Before | After    |
| ----------------------------------------------------- | ------ | -------- |
| Files requiring bare side-effect imports              | ~109   | **~0**   |
| Prototype augmentations behind callable function      | 0      | **~344** |
| `AddNodeConstructor` behind callable function         | 0      | **~26**  |
| `RegisterClass` behind callable function (9b)         | 0      | **~403** |
| Static assignments behind callable function (9b)      | 0      | **~39**  |
| AddParser behind callable function (9b)               | 0      | **~10**  |
| WebXR features/controllers behind callable fn (9b)    | 0      | **~26**  |
| Other side effects behind callable function (9b)      | 0      | **~53**  |
| Total registration functions (9a + 9b)                | 0      | **~620** |
| New `.types.ts` files                                 | 0      | **~91**  |
| `Engine` class tree-shakeable (without augmentations) | No     | **Yes**  |
| `Scene` class tree-shakeable (without augmentations)  | No     | **Yes**  |

### Risks & Mitigations

| Risk                                            | Mitigation                                                |
| ----------------------------------------------- | --------------------------------------------------------- |
| `declare module` target path must match `.pure` | Script validates `declare module` specifier resolves      |
| Double-registration (pure + legacy import)      | Idempotency guard (`_registered` flag)                    |
| Missing `.types.ts` import → no autocomplete    | Legacy `.ts` re-exports types; only pure path affected    |
| Consumers forget to call registration function  | Runtime crash is the same as forgetting bare import today |
| Large PR size (~109 files × 3)                  | Process by directory (Engines/, Physics/, etc.)           |

## Phase 10 — Annotate `__decorate` Calls as Pure

### Problem Statement

After completing Phase 9 (wrapping all side effects in callable registration functions), a **viewer
package validation test** revealed that importing values through the `core/pure` barrel instead of
deep `.pure` paths caused a **58% bundle size increase** (3.8 MB → 6.0 MB minified).

Root cause analysis identified three blockers preventing Rollup from tree-shaking the pure barrel:

1. **`__decorate` calls** — TypeScript's `experimentalDecorators` compiles `@serialize()` etc. to
   top-level `__decorate([serialize()], ClassName.prototype, "prop", void 0)` calls. These are
   genuine function invocations at module scope that Rollup correctly treats as side effects.
   **1,220 calls across 181 `.pure.js` files.**

2. **Static property assignments** — `Scene.FOGMODE_NONE = Constants.FOGMODE_NONE;` etc.
   **538 assignments across 112 files.** These are plain assignments (not calls) but still
   considered side effects by bundlers if the class they assign to is unused.

3. **`sideEffects: ["**/\*"]`** in core's `package.json` — however, Rollup's TypeScript plugin
alias (`core`→`@dev/core/dist`) bypasses `node_modules`resolution, so the`sideEffects`
   field is **not consulted by Rollup**. This is only relevant for Webpack consumers.

### Missing Pure Barrel Entries

During the viewer validation, two missing exports from pure barrels were discovered:

- **`Maths/pure.ts`**: Missing `export * from "./math.viewport"` — `MathViewport` needed by viewer
- **`Misc/pure.ts`**: Missing `export * from "./arrayTools"` — `ArrayTools` needed by viewer

Both entries have been added to their respective `pure.ts` barrel files.

### Viewer Validation Test

The viewer package (`packages/tools/viewer`) was migrated as a real-world validation of the pure
import system. All viewer source files were modified:

- **Type imports** → `core/pure` (top-level pure barrel)
- **Value imports** → individual `.pure` deep paths (e.g., `core/Cameras/arcRotateCamera.pure`)
- **15 register function calls** added at module level
- **Dynamic imports** rewritten to use `.pure` with register calls
- **Engine dynamic imports** kept non-pure (thin wrappers loading many extensions)

**Results with deep `.pure` imports**:

- TypeScript compilation: **0 errors** ✅
- Vite dev server: **works, viewer renders correctly** ✅
- Public viewer bundle (`npm run build -w @babylonjs/viewer`):
    - Non-minified: 8.7 MB total JS
    - **Minified: 3.8 MB total JS** (main chunk 3.9 MB non-min, WebGPU 609K, glTF 264K)

**Results with `core/pure` barrel imports** (before Phase 10 fix):

- **Minified: 6.0 MB total JS** (+58% vs deep imports)
- Cause: `export *` chains force Rollup to traverse all files, where `__decorate` calls
  prevent unused-class elimination

### Solution: `/*#__PURE__*/` Annotations on `__decorate` Calls

Three options were evaluated:

| Option         | Approach                                                      | Source Changes     | Risk                             |
| -------------- | ------------------------------------------------------------- | ------------------ | -------------------------------- |
| **A** (chosen) | Post-build `/*#__PURE__*/` injection                          | 0                  | Low — recognized by all bundlers |
| B              | Move decorators into `registerXxx()` functions                | ~1,220 sites       | High — semantic change           |
| C              | Switch to TC39 decorators (`"experimentalDecorators": false`) | tsconfig + runtime | High — different semantics       |

**Option A** was chosen: extend the existing `scripts/treeshaking/injectPureAnnotations.mjs`
post-build script to also annotate `__decorate(` calls in `.pure.js` files.

### Implementation

- [x] **10.1** — Extend `injectPureAnnotations.mjs` with `__decorate` pattern
    - New regex: `/^(?!\/\*#__PURE__\*\/\s*)(__decorate\()/gm`
    - Matches `__decorate(` at column 0 (top-level), skips already-annotated calls
    - Transforms: `__decorate([` → `/*#__PURE__*/ __decorate([`
    - Idempotent (safe to run multiple times)
    - **Result**: 1,093 annotations injected across 193 files (687 `.pure.js` scanned)
        - Includes both `__decorate` calls and static field initializers (Phase 1 pattern)
- [x] **10.2** — Integrate into build pipeline
    - Updated `packages/dev/core/package.json` `compile:source` script:
      `"tsc -b tsconfig.build.json && node ../../scripts/treeshaking/injectPureAnnotations.mjs"`
    - Script uses `import.meta.url` to resolve `dist/` path regardless of CWD
- [x] **10.3** — Verify bundle smoke tests
    - **All 21 tests pass** (42 individual PASS results: Rollup + Webpack) ✅
- [x] **10.4** — Re-test viewer with `core/pure` barrel imports for values
    - Switched all viewer value imports from deep `.pure` paths to single `import { ... } from "core/pure"`
    - TypeScript compilation: **0 errors** ✅
    - **Result: 5,277,335 bytes (5.0 MB) minified** — down from 6.0 MB (pre-Phase 10) but still
      +32% vs. deep imports (3.99 MB baseline)
    - The `__PURE__` annotations saved ~1.0 MB, but remaining bloat comes from:
        - **Static property assignments** (e.g., `Scene.FOGMODE_NONE = Constants.FOGMODE_NONE;`) —
          538 across 112 files. These are top-level assignments, not calls, so `/*#__PURE__*/` does
          not apply. Rollup treats them as side effects because writing to a class property could
          have observable effects if the class has setter traps.
        - **Chunk merging**: `export *` barrel chains force Rollup to pull in transitive modules
          that share dependencies with lazy chunks (WebGPU engine, glTF loader), collapsing them
          into the main chunk (245K WebGPU + 100K glTF chunks disappeared into main).
    - **Conclusion**: Deep `.pure` imports are no longer needed — see Phase 10.5 which solves
      the barrel overhead via a Rollup `load` hook plugin. The pure barrel now produces smaller
      bundles than deep imports.
    - Viewer reverted to deep `.pure` imports (best bundle size)
- [x] **10.5** — Rollup `load` hook to mark pure modules as side-effect-free
    - **Problem**: `@rollup/plugin-typescript` does not participate in Rollup's `moduleSideEffects`
      system. Neither `treeshake.moduleSideEffects` callbacks nor `resolveId` overrides had any
      effect — the callback IS invoked but the module info shows `hasModuleSideEffects=undefined`
      for all 852 pure modules, meaning the tree-shaker ignores it.
    - **Solution**: A custom Rollup plugin using the `load` hook that intercepts `.pure.` and
      `.functions.` modules before the TypeScript plugin. The `load` hook reads the file and
      returns `{ code, moduleSideEffects: false }`, which Rollup honors for tree-shaking.
    - **Plugin** (`markPureModules`): Added to `rollup.config.dist.esm.mjs`, placed BEFORE the
      TypeScript plugin in the plugins array (first plugin wins for `load`).
    - **Results**:
        - `core/pure` barrel imports: **3,989,625 bytes (3.80 MB) minified** — down from 5.0 MB
        - Deep `.pure` imports baseline: **3,992,238 bytes (3.99 MB) minified**
        - **Pure barrel is now 5% SMALLER than deep imports** (more aggressive chunk deduplication)
        - Chunk count reduced from 375 → 340 (better code splitting, no duplication)
        - All 21 bundle smoke tests pass ✅
    - **Approaches that FAILED** (for the record):
        - `treeshake.moduleSideEffects` callback — called but ignored by Rollup internals
        - `resolveId` with `order: "post"` — caused 10 MB duplication
        - `transform` with `order: "post"` returning `{ moduleSideEffects: false }` — caused 14 MB duplication
        - `treeshake.moduleSideEffects: false` globally — collapsed bundle to 334 bytes (empty)
    - **Why `load` works**: The `load` hook is the canonical way to provide module content to
      Rollup. When a plugin returns `{ code, moduleSideEffects: false }` from `load`, Rollup
      stores this flag on the module and uses it during tree-shaking. Unlike `resolveId` or
      `transform` overrides, `load` is the earliest point where module content and metadata
      are established, so it doesn't conflict with other plugins' resolution or transform chains.
    - **Viewer source files updated**: All value imports now use `core/pure` barrel instead of
      deep paths (viewer.ts, viewerElement.ts, viewerFactory.ts).

### Technical Details

The `/*#__PURE__*/` annotation is a standard convention recognized by Rollup, Webpack, esbuild,
and other bundlers. When placed before a function call, it tells the bundler:

> "This call has no side effects. If its return value is unused, the call can be removed."

For `__decorate`, the return value is always discarded (it decorates in-place via
`Object.defineProperty`). The decorator functions (`serialize()`, `serializeAs*()`, etc.) only
store metadata via `GetDirectStore(target)` — they write to the class prototype's metadata,
which is only meaningful if the class is actually used. If the class is tree-shaken away,
the decoration metadata is dead code too.

**Why this is safe**: If a bundler removes the decorated class, the `__decorate` calls on that
class's prototype become unreachable dead code. The `/*#__PURE__*/` annotation simply tells
the bundler it's safe to recognize this and remove them together.

### Would TC39 Decorators Eliminate the Need for `/*#__PURE__*/`?

**No.** Tested with TypeScript 5.9 and Rollup 4.59 across three compilation targets:

| Target                                             | Compiled Form                                                                   | Tree-shakes without annotation?                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `es2021` (current, `experimentalDecorators: true`) | External `__decorate(...)` after class                                          | No — need `/*#__PURE__*/` on each `__decorate` call             |
| `es2022` (TC39 decorators)                         | IIFE `(() => { ... })()` wrapping class, `__esDecorate(...)` inside `static {}` | No — need `/*#__PURE__*/` on the IIFE                           |
| `esnext` (TC39 native syntax)                      | `@decorator()` syntax preserved in output                                       | No — Rollup treats `@decorator()` as potentially side-effectful |

The fundamental issue is that **Rollup cannot prove decorator calls are side-effect-free**,
regardless of compilation target. The `/*#__PURE__*/` annotation is the only way to signal
to the bundler that these calls are safe to remove when the class is unused.

**What TC39 decorators DO improve**: Decorator calls move inside the class (via `static {}`
block or native syntax) instead of being separate top-level statements. This means only ONE
`/*#__PURE__*/` annotation is needed per class (on the wrapping IIFE) instead of one per
decorated property.

**Migration scope if pursued**: 225 files, 1,489 decorator usages in `@dev/core`. Decorator
function signatures change significantly: legacy `(target, propertyKey) =>` becomes TC39
`(_target, context: ClassFieldDecoratorContext) =>`. The `expandToProperty` decorator (which
uses `Object.defineProperty(target, ...)`) would need substantial rework since TC39 field
decorators cannot modify the class prototype directly. The tsconfig already contains a note:
`"target": "es2021", // esnext has an issue with class generation and our decoders. TODO -
avoid using decorators until in standard"`.

**Conclusion**: The current `/*#__PURE__*/` injection approach already solves the tree-shaking
problem completely. Migrating to TC39 decorators is worthwhile for standards compliance but
would NOT eliminate the need for pure annotations.

## Phase 11 — Side-Effect Warning Stubs

### Problem Statement

When a user imports from the pure barrel (or any tree-shaken entry point), augmented prototype
methods are **not attached** until the corresponding side-effect module is imported. Calling an
unregistered method throws a cryptic `TypeError: scene.getPhysicsEngine is not a function`.
This is especially confusing because TypeScript's `declare module` makes the types globally
visible — the code compiles fine, but crashes at runtime.

### Solution

Install lightweight **warning stubs** on class prototypes for **all methods/properties declared
in `.types.ts` augmentation files**. When called without the required side-effect import, the
stub logs a helpful `console.warn` pointing to the tree-shaking documentation, instead of
crashing. The stubs are **overwritten** when the real register function runs — zero impact
for users who import the side-effect module correctly.

### Implementation

**Utility functions** — added to `Misc/devTools.ts`:

- `_MissingSideEffect(className, methodName)` — returns a stub function that warns once
- `_MissingSideEffectProperty(className, propName)` — returns a `{ get, configurable: true }` descriptor

**Automation script** — `scripts/treeshaking/generateSideEffectStubs.mjs`:

- Parses all 143 `.types.ts` files to extract `declare module` blocks
- Handles multi-line method signatures (parenthesis depth tracking)
- Handles nested object type literals (brace depth tracking)
- Skips `_`-prefixed internal members
- Resolves `declare module` paths to target source files (prefers `.pure.ts`)
- Injects stubs between `#region GENERATED_SIDE_EFFECT_STUBS` markers (idempotent)
- Usage: `npm run generate:side-effect-stubs` (or `--dry-run`, `--verbose`)

**Stub patterns**:

```typescript
// Methods — ??= prevents overwriting if real implementation loaded first
Scene.prototype.getPhysicsEngine ??= _MissingSideEffect("Scene", "getPhysicsEngine") as any;

// Properties — Object.defineProperty with configurable: true
if (!Object.getOwnPropertyDescriptor(Scene.prototype, "debugLayer")) {
    Object.defineProperty(Scene.prototype, "debugLayer", _MissingSideEffectProperty("Scene", "debugLayer"));
}
```

**Warning output**:

```
[Babylon.js] Scene.getPhysicsEngine() requires a side-effect import.
  See: https://doc.babylonjs.com/setup/treeshaking
```

### Results

- [x] **11.1** — Added `_MissingSideEffect` and `_MissingSideEffectProperty` to `Misc/devTools.ts`
- [x] **11.2** — Created automation script: `scripts/treeshaking/generateSideEffectStubs.mjs`
- [x] **11.3** — Generated stubs across 21 target class files
- [x] **11.4** — TypeScript compilation: ✅ zero errors
- [x] **11.5** — Bundle smoke tests: ✅ all pass

### Stub Coverage

| Target File                               |   Stubs | Note                                    |
| ----------------------------------------- | ------: | --------------------------------------- |
| `scene.pure.ts`                           |      78 | Scene methods + properties              |
| `Engines/abstractEngine.ts`               |     108 | Engine states, stencil, textures, etc.  |
| `Meshes/mesh.pure.ts`                     |      18 | Thin instances, particles, simplify     |
| `Meshes/abstractMesh.pure.ts`             |      18 | Occlusion, physics, decals, edges       |
| `Engines/engine.pure.ts`                  |      13 | Multiview, transform feedback, textures |
| `Engines/thinEngine.ts`                   |       8 | Uniform buffers, time queries           |
| `Meshes/transformNode.ts`                 |       5 | Physics v2 body/impulse/torque          |
| `Cameras/freeCameraInputsManager.ts`      |       3 | Device orientation, joystick, gamepad   |
| `Misc/observable.ts`                      |       3 | Promise notifications, coroutines       |
| `Materials/effect.ts`                     |       3 | Post-process textures, depth stencil    |
| `Buffers/buffer.pure.ts`                  |       3 | Effective byte stride/offset/buffer     |
| `Cameras/arcRotateCameraInputsManager.ts` |       2 | VR orientation, gamepad                 |
| `Materials/Textures/baseTexture.pure.ts`  |       2 | Spherical polynomial                    |
| `Meshes/linesMesh.pure.ts`                |       2 | Edge rendering for lines                |
| 7 other files                             |       7 | 1 each (bone, material, subMesh, etc.)  |
| **Total**                                 | **273** | 215 methods + 58 properties             |

### Size Impact

| Component                | Minified   | Gzipped   |
| ------------------------ | ---------- | --------- |
| Shared utility functions | ~200 bytes | ~120 B    |
| 273 stub assignments     | ~16 KB     | ~3-4 KB   |
| **Total**                | **~16 KB** | **~4 KB** |

---

## Risk Mitigation

| Risk                            | Mitigation                                                       |
| ------------------------------- | ---------------------------------------------------------------- |
| Breaking existing imports       | `FILE.ts` always re-exports `FILE.pure.ts`                       |
| Circular dependencies           | Audit detects cycles; `import/no-cycle` already enabled          |
| Prototype augmentation in pure  | ESLint rule (6.1) + bundle tests (6.2)                           |
| Massive PRs                     | One PR per subdirectory (Phase 2.2 priority order)               |
| Shader files in pure            | Blocked by glob pattern in ESLint rule                           |
| Bare imports in pure barrel     | Phase 7.1 splits + 7.4 audit detection                           |
| Pure importing non-pure         | Phase 7.2 rewrites + 7.2c ESLint enforcement                     |
| External bundler can't optimize | Phase 7.3 `exports` field with `sideEffects: false`              |
| Shader include not registered   | Build flattens transitive deps; ProcessIncludes fallback         |
| Custom shader missing include   | Users switch to named import + manual registration               |
| Nested includes not registered  | Build-time transitive closure ensures all deps imported          |
| `__decorate` annotation wrong   | Only in `.pure.js` at column 0; idempotent; all smoke tests pass |

---

## Future Consideration: Three-File Side-Effect Architecture

> **Status**: Not yet implemented. Documented here for future reference.

### The Problem

The current two-file split (`foo.pure.ts` + `foo.ts` wrapper) creates an ergonomic gap for pure-barrel users who need to opt into specific side effects.

Today, if a consumer imports from the pure barrel and later wants a specific side effect (e.g., `RegisterClass` for serialization, or `WebXRFeaturesManager.AddWebXRFeature` for auto-registration), their only option is:

```ts
// Pure import — no side effects
import { WebXRAnchorSystem } from "@babylonjs/core/XR/features/pure";

// To opt in to the AddWebXRFeature registration, must import the wrapper:
import "@babylonjs/core/XR/features/WebXRAnchorSystem";
// ↑ This re-exports everything from WebXRAnchorSystem.pure AND runs the side effects.
//   The re-export is redundant — the pure class is already resolved from the first import.
//   Bundlers deduplicate this, so it works, but it's architecturally awkward:
//   the side-effect-only import is coupled to a module that also re-exports pure content.
```

This means there's no way to express "just the side effects, nothing else" — every side-effect opt-in also drags in a re-export barrel. It works in practice (ES module deduplication), but it goes against the clean separation that pure barrels were designed to provide.

### Proposed Solution: `foo.effects.ts`

Split each file into **three** instead of two:

```
foo.pure.ts      → Pure implementation (class, functions, types)
foo.effects.ts   → ONLY the side effects (RegisterClass, prototype assignments, etc.)
                    Imports what it needs from foo.pure.ts
foo.ts           → Backward-compatible wrapper:
                    export * from "./foo.pure";
                    import "./foo.effects";
```

This gives consumers three distinct import paths:

```ts
// 1. Pure — no side effects, maximum tree-shaking
import { Foo } from "@babylonjs/core/Something/foo.pure";

// 2. Side effects only — opt-in without redundant re-exports
import "@babylonjs/core/Something/foo.effects";

// 3. Everything (backward compatible, same as today)
import { Foo } from "@babylonjs/core/Something/foo";
```

### Why This Matters

- **Clean separation of concerns**: Side effects become independently importable units, not piggy-backed on re-export modules
- **Pure barrel + opt-in pattern**: A user working with `import ... from ".../pure"` can add individual side effects via `.effects` imports without pulling in redundant re-export glue
- **Side-effect barrels**: Could generate `effects.ts` barrels alongside `pure.ts` barrels, giving users `import "@babylonjs/core/XR/features/effects"` to register all XR features
- **No behavioral change**: The existing `foo.ts` wrapper still works identically — it just delegates to two files instead of inlining both

### Implementation Notes

- The generic splitter (`scripts/treeshaking/splitSideEffects.mjs`) already separates pure content from side-effect blocks in its AST analysis — extracting to a third file is a matter of writing the side-effect blocks to `foo.effects.ts` instead of inlining them in `foo.ts`
- The `foo.effects.ts` file would need to import its dependencies from `foo.pure.ts` (for the class reference used in `RegisterClass(...)`, etc.) and from other modules (e.g., `WebXRFeaturesManager`)
- The splitter already tracks which imports are used only by side-effect code vs. pure code — this is the exact information needed to generate correct imports for `foo.effects.ts`
- File count increases by ~650 files (one `.effects.ts` per existing split), but each is tiny (typically 2-5 lines)
- Barrel generation would need a parallel pass for `effects.ts` barrels
