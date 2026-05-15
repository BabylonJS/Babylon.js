# Visualization (Playwright) Tests

Babylon.js visualization tests are Playwright-based screenshot comparison tests against reference images. Use them for rendering work where the pixels matter: new rendering features, visual bug fixes, shader changes, materials, particles, post-processes, loading behavior, and other user-visible output.

This instruction file explains how to create, update, and debug Babylon visual tests.

Every major new rendering feature must have visualization coverage when applicable. Skipping visual coverage for rendering work is risky because many regressions are only obvious in the final image.

## Overview

Standard Babylon.js visualization tests are driven by config entries rather than custom Playwright wrapper files.

- Config file: `packages/tools/tests/test/visualization/config.json`
- Reference images for all Playwright visualization projects: `packages/tools/tests/test/visualization/ReferenceImages/`
- Helper scripts: `.github/scripts/visual-testing/read-snippet.js` and `.github/scripts/visual-testing/save-snippet.js`
- Playground workflow (writing code, managing snippets, local servers): [playground-workflow.md](playground-workflow.md)

Do not create new wrapper Playwright files for normal visualization tests. The existing wrappers such as `visualization.webgl2.test.ts` and `visualization.webgpu.test.ts` already load every entry from the config.

For a standard visualization test, the committed repo changes should normally be the config entry and the reference image files.

## Mandatory snippet workflow for standard visualization tests

For standard Babylon.js visualization tests, the agent **must** use Playground snippets and `playgroundId` entries in `config.json`.

- **Read existing reference snippets first** with `.github/scripts/visual-testing/read-snippet.js` when using an existing test as inspiration.
- **Create or update the test as a Playground snippet** and save it with `.github/scripts/visual-testing/save-snippet.js`.
- **Use the returned snippet ID as the `playgroundId`** in `packages/tools/tests/test/visualization/config.json`.
- **Do not substitute `scriptToRun`, local fixture scripts, or other non-snippet paths** for a standard visualization test unless the user explicitly asks for that approach.
- **Do not modify the visualization harness or infrastructure** for a standard visualization test unless the user explicitly asks for harness work.
- **If snippet read/save fails because of network, authentication, or environment limitations, stop and ask the user for help** instead of inventing a local workaround.

The main exceptions are non-standard test types that already have their own documented flow, such as devhost-based tool tests.

The full automated workflow for adding a playground-based visual test is:

0. Optionally study existing tests or the engine code for context.
1. Write, save, and verify the playground snippet (see [playground-workflow.md](playground-workflow.md)).
2. Add a `config.json` entry that points at the snippet.
3. Generate reference images.
4. Run the test to confirm it passes.
5. Clean up temporary files and any servers you started.

## Adding a New Visual Test (Automated Workflow)

### Step 0: Understand context

If the user points you to existing tests as reference, study those first:

1. Inspect related entries in `packages/tools/tests/test/visualization/config.json`.
2. Read their snippet code with `.github/scripts/visual-testing/read-snippet.js`.
3. Identify the setup patterns: camera, lighting, scene framing, timing, and the property or feature being validated.

If the user does not point to existing tests, read the relevant Babylon.js engine or tool code to understand the API and behavior you need to exercise.

### Step 1: Write code, save snippet, optionally start servers, verify

Follow the Playground workflow in [playground-workflow.md](playground-workflow.md). After completing those steps you will have a snippet ID (e.g. `#ABC123#0`) ready for the config entry.

### Step 2: Add a config entry

Append the new test to `packages/tools/tests/test/visualization/config.json`:

```json
{
    "title": "Your Test Title",
    "playgroundId": "#ABC123#0",
    "referenceImage": "your-test-title.png",
    "renderCount": 1,
    "errorRatio": 1.1
}
```

See the config field reference and `renderCount` heuristics in [visual-tests-reference.md](visual-tests-reference.md) when choosing values.

If the user has not specified a naming convention, align with nearby entries in `config.json`. The `title` is used by Playwright `-g` filters, so it should be descriptive and unique.

### Step 3: Generate reference images

Run these from the repo root while the CDN server is running:

```bash
# WebGL2
npx playwright test --config playwright.config.ts --project=webgl2 --update-snapshots -g "Your Test Title"

# WebGPU
npx playwright test --config playwright.config.ts --project=webgpu --update-snapshots -g "Your Test Title"
```

Reference images are written to `packages/tools/tests/test/visualization/ReferenceImages/` using the screenshot name selected by the harness:

- If `referenceImage` is set, the harness uses that value as the screenshot name (for example `ReferenceImages/your-test-title.png`).
- Otherwise, the harness falls back to `title`, and Playwright may normalize some characters in the final snapshot filename. For example, a title such as `Loading glTF model with KTX2 textures` can produce `ReferenceImages/Loading-glTF-model-with-KTX2-textures.png`.
- If you need a deterministic committed filename, set `referenceImage` explicitly.

The current Playwright config uses a shared `snapshotPathTemplate`, so WebGL2 and WebGPU both read and write snapshots from `ReferenceImages/`.

For several related tests, prefer one regex with `-g` so Playwright can run them in parallel:

```bash
npx playwright test --config playwright.config.ts --project=webgl2 --update-snapshots -g "GPU Particles - Basic Properties - Emit Rate|GPU Particles - Basic Properties - Emission"
npx playwright test --config playwright.config.ts --project=webgpu --update-snapshots -g "GPU Particles - Basic Properties - Emit Rate|GPU Particles - Basic Properties - Emission"
```

### Step 4: Run and verify

After the baselines exist, run the targeted tests without updating snapshots:

```bash
npx playwright test --config playwright.config.ts --project=webgl2 -g "Your Test Title"
npx playwright test --config playwright.config.ts --project=webgpu -g "Your Test Title"
```

As with snapshot generation, you can use one regex with `-g` to validate several related tests together.

To run the full visualization suite locally instead of a targeted title:

```bash
npm run test:playwright -w @tools/tests
```

### Step 5: Clean up

Remove temporary files and stop servers per the cleanup section in [playground-workflow.md](playground-workflow.md). Also remove any temporary files generated by `playwright-cli` for local inspection (typically under `.playwright-cli/`).

## Config fields, renderCount, error ratio, multi-engine, devhost tests, and common issues

See [visual-tests-reference.md](visual-tests-reference.md) for the full reference.

## `dependsOn` tags (required for new tests)

Every new visualization test entry **must** include a `dependsOn` array listing the Babylon.js modules/features the test exercises. This enables selective CI — only tests whose tags overlap with changed files are run on PRs.

Choose tags based on which Babylon.js APIs the playground snippet actually uses, not just the test title. A test that creates a PBR material with shadows on a glTF model should have `["PBR", "Shadows", "glTF", "Loaders"]`.

Tests without `dependsOn` (or with an empty array) always run — this is the conservative fallback for tests that haven't been tagged yet.

### Available tags

Pick **only** from this list. The canonical source is `packages/tools/tests/test/visualization/tagMap.json`.

| Tag | What it covers |
|-----|---------------|
| `Animations` | `Animation`, `AnimationGroup`, `beginAnimation`, keyframe animations |
| `Atmosphere` | Atmospheric scattering (addons) |
| `Audio` | `Sound`, `AudioEngine`, AudioV2 |
| `BakedVertexAnimation` | `BakedVertexAnimationManager`, `VertexAnimationBaker` |
| `Behaviors` | `PointerDragBehavior`, `BouncingBehavior`, `FramingBehavior`, etc. |
| `Bones` | `Skeleton`, `Bone`, `BoneIKController` |
| `Buffers` | GPU buffer management (VBO, IBO, SSBO) — **run-all tag** |
| `Cameras` | Camera rigs, viewports, `FollowCamera`, `FlyCamera`, `upVector`, multi-camera |
| `Collisions` | `checkCollisions`, `moveWithCollisions` |
| `Compute` | `ComputeShader`, `StorageBuffer` |
| `CSG` | Constructive Solid Geometry |
| `Engine` | Engine implementations (WebGL, WebGPU, Native) — **run-all tag** |
| `FlowGraph` | Node-based execution graphs |
| `FrameGraph` | Render frame graphs |
| `GaussianSplatting` | `GaussianSplattingMesh`, splat rendering |
| `Gizmos` | `GizmoManager`, position/rotation/scale gizmos, `UtilityLayerRenderer` |
| `glTF` | glTF/glb loading, glTF extensions |
| `GreasedLine` | Greased line rendering |
| `GUI` | `AdvancedDynamicTexture`, 2D/3D GUI controls, `HolographicSlate`, `NearMenu` |
| `Helpers` | Utility helper classes — **run-all tag** |
| `Layers` | `HighlightLayer`, `GlowLayer`, `EffectLayer` |
| `LensFlares` | `LensFlareSystem` |
| `LibMaterials` | Library materials: `GridMaterial`, `SkyMaterial`, `WaterMaterial`, `CellMaterial`, etc. |
| `Lights` | `PointLight`, `SpotLight`, `DirectionalLight`, light-specific features |
| `Loaders` | `SceneLoader`, `loadAssetContainerAsync`, generic loading |
| `Materials` | `StandardMaterial`, `ShaderMaterial`, `MultiMaterial`, `BackgroundMaterial` |
| `Maths` | Vector, Matrix, Quaternion math — **run-all tag** |
| `Meshes` | Instancing, `thinInstance`, vertex manipulation, `EdgesRenderer`, `MergeMeshes`, `billboardMode`, `GPUPicker`, outlines |
| `Misc` | Miscellaneous utilities — **run-all tag** |
| `Morph` | `MorphTarget`, `MorphTargetManager` |
| `MSDFText` | MSDF text rendering (addons) |
| `Navigation` | `RecastJSPlugin`, `Crowd`, pathfinding |
| `NodeMaterial` | Node Material Editor blocks, `NodeMaterial` |
| `OBJ` | OBJ file loading |
| `Particles` | `ParticleSystem`, `GPUParticleSystem`, `SolidParticleSystem` |
| `PBR` | `PBRMaterial`, `PBRMetallicRoughnessMaterial`, OpenPBR, iridescence, clear coat, sheen, subsurface |
| `Physics` | `PhysicsAggregate`, `HavokPlugin`, physics bodies/shapes |
| `PostProcesses` | Post-processing effects, rendering pipelines, SSAO, SSR, DOF, bloom, motion blur |
| `Probes` | `ReflectionProbe`, `MirrorTexture` |
| `ProceduralTextures` | `ProceduralTexture` and built-in procedural textures |
| `Rendering` | Core rendering pipeline, depth/geometry buffers — **run-all tag** |
| `Scene` | Scene class, `AssetContainer`, node hierarchy — **run-all tag** |
| `Serializers` | `GLTF2Export`, `STLExport`, `OBJExport`, `SceneSerializer` |
| `Shaders` | GLSL/WGSL shader definitions, `Effect.ShadersStore` — **run-all tag** |
| `SPLATLoader` | SPLAT/PLY/SPZ file loading |
| `Sprites` | `SpriteManager`, `Sprite`, `SpriteMap` |
| `Textures` | `CubeTexture`, `HDRCubeTexture`, `VideoTexture`, `DynamicTexture`, `RenderTargetTexture`, KTX2 |
| `XR` | WebXR, `WebXRDefaultExperience` |

Tags marked **run-all tag** trigger all visualization tests when their source files change, because they are foundational and can affect any test.

Example:
```json
{
    "title": "Your Test Title",
    "playgroundId": "#ABC123#0",
    "referenceImage": "your-test-title.png",
    "dependsOn": ["PBR", "Shadows", "Lights"]
}
```

## Checklist

- Context gathered from existing snippets or source code
- Playground snippet created and verified per [playground-workflow.md](playground-workflow.md)
- `config.json` entry uses `playgroundId` for standard visualization tests
- Config entry added or updated in `packages/tools/tests/test/visualization/config.json`
- `dependsOn` array specified with relevant module tags
- WebGL2 baseline generated when applicable
- WebGPU baseline generated when applicable
- Targeted tests pass locally for the relevant engines
- Temporary files and long-running processes cleaned up
