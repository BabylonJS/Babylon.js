# Registering Side Effects

## What Are Side Effects?

In the context of tree-shaking, a "side effect" is any code that runs automatically when a file is imported, changing global state. Babylon.js has several categories:

| Category               | Purpose                                                           | Example                                   |
| ---------------------- | ----------------------------------------------------------------- | ----------------------------------------- |
| `RegisterClass`        | Let the engine recreate objects by name when loading saved scenes | `RegisterClass("BABYLON.Camera", Camera)` |
| Prototype augmentation | Attach optional methods to existing classes                       | `Scene.prototype.enablePhysics = ...`     |
| Shader registration    | Store shader source code for GPU compilation                      | `ShaderStore["default"] = "..."`          |
| Feature registration   | Make features available by name                                   | `AddWebXRFeature(WebXRAnchorSystem)`      |
| Node constructor       | Enable node-based editor blocks                                   | `AddNodeConstructor("Block", ...)`        |

When using pure imports, these side effects don't run automatically — you turn them on by calling the corresponding `RegisterXxx()` function.

## Finding Registration Functions

All registration functions follow the naming pattern `Register` + PascalCase(filename):

| File                                   | Registration Function                    |
| -------------------------------------- | ---------------------------------------- |
| `standardMaterial.pure.ts`             | `RegisterStandardMaterial()`             |
| `joinedPhysicsEngineComponent.pure.ts` | `RegisterJoinedPhysicsEngineComponent()` |
| `engine.multiRender.pure.ts`           | `RegisterEngineMultiRender()`            |
| `depthRendererSceneComponent.pure.ts`  | `RegisterDepthRendererSceneComponent()`  |
| `boundingBoxRenderer.pure.ts`          | `RegisterBoundingBoxRenderer()`          |

**IDE Discoverability**: Type `Register` in your IDE and autocomplete will list all ~620 available registration functions. The names map 1:1 to filenames, so existing knowledge of Babylon.js module paths transfers directly.

## Categories of Registration

### Material & Serialization Registration

These register classes so the engine can recreate them when loading saved scenes (`.babylon` files, snippets, etc.):

```typescript
import { RegisterStandardMaterial, RegisterPBRMaterial, RegisterImageProcessingConfiguration, RegisterTexture, RegisterFresnelParameters } from "@babylonjs/core/pure";

RegisterStandardMaterial();
RegisterPBRMaterial();
RegisterImageProcessingConfiguration(); // Also registers ColorCurves (it depends on it)
RegisterTexture();
RegisterFresnelParameters();
```

**When needed**: Any time you load saved content (`.babylon` files, snippets, scene files) that contains these types.

### Scene Component Registration (Adding Methods to Existing Classes)

These attach optional methods to `Scene`, `Engine`, `Mesh`, and other classes:

```typescript
// Physics
import { RegisterJoinedPhysicsEngineComponent } from "@babylonjs/core/pure";
import "@babylonjs/core/Physics/joinedPhysicsEngineComponent.types";
RegisterJoinedPhysicsEngineComponent();
// Now scene.enablePhysics(), scene.getPhysicsEngine(), etc. are available

// Picking (Ray)
import { RegisterRay } from "@babylonjs/core/pure";
RegisterRay();
// Now scene.pick(), scene.createPickingRay(), etc. are available

// Depth Renderer
import { RegisterDepthRendererSceneComponent } from "@babylonjs/core/pure";
RegisterDepthRendererSceneComponent();

// Bounding Box Renderer
import { RegisterBoundingBoxRenderer } from "@babylonjs/core/pure";
RegisterBoundingBoxRenderer();
```

**When needed**: When you use methods that were previously added via bare `import "@babylonjs/core/..."` statements.

### Engine Extension Registration

Engine extensions add capabilities like texture loading, alpha blending, multi-render targets, etc. to the engine. Three **tiered helpers** let you register groups of extensions at once:

```typescript
import { RegisterCoreEngineExtensions, RegisterStandardEngineExtensions, RegisterFullEngineExtensions } from "@babylonjs/core/pure";

// Pick ONE tier (each includes the one below it):
RegisterCoreEngineExtensions(); // Minimum: DOM, render passes, GPU states, stencil
RegisterStandardEngineExtensions(); // Most apps: Core + textures, file loading, alpha, render targets, uniform buffers
RegisterFullEngineExtensions(); // Everything: Standard + cube/raw/dynamic textures, multi-render, multiview, queries, compute, video, debugging
```

For most applications, **`RegisterStandardEngineExtensions()`** is the right choice. All tiers are safe to call multiple times or in combination — calling a higher tier after a lower one just adds the missing pieces.

You can also register individual extensions if you need fine-grained control:

```typescript
// Multi-render targets
import { RegisterEnginesExtensionsEngineMultiRender } from "@babylonjs/core/pure";
RegisterEnginesExtensionsEngineMultiRender();

// Transform feedback
import { RegisterEngineTransformFeedback } from "@babylonjs/core/pure";
RegisterEngineTransformFeedback();
```

### Block Registration (Node Editors)

For loading saved Node Material, Node Geometry, or other node-based graphs:

```typescript
// Register ALL blocks for a system
import { RegisterAllNodeMaterialBlocks } from "@babylonjs/core/pure";
RegisterAllNodeMaterialBlocks();

// Or register by category
import { RegisterNodeMaterialPBRBlocks, RegisterNodeMaterialMathBlocks, RegisterNodeMaterialVertexBlocks } from "@babylonjs/core/pure";

RegisterNodeMaterialPBRBlocks();
RegisterNodeMaterialMathBlocks();
RegisterNodeMaterialVertexBlocks();
```

Available bulk registrations:

| Function                             | System                   | Blocks |
| ------------------------------------ | ------------------------ | ------ |
| `RegisterAllNodeMaterialBlocks()`    | Node Material Editor     | ~108   |
| `RegisterAllNodeGeometryBlocks()`    | Node Geometry Editor     | ~80    |
| `RegisterAllNodeParticleBlocks()`    | Node Particle Editor     | ~49    |
| `RegisterAllFlowGraphBlocks()`       | Flow Graph               | ~47    |
| `RegisterAllNodeRenderGraphBlocks()` | Node Render Graph Editor | ~44    |

### XR Feature Registration

```typescript
import { RegisterWebXRDefaultExperience, RegisterWebXRHandTracking, RegisterWebXRAnchorSystem, RegisterWebXRHitTest } from "@babylonjs/core/pure";

RegisterWebXRDefaultExperience();
RegisterWebXRHandTracking();
RegisterWebXRAnchorSystem();
RegisterWebXRHitTest();
```

## Automatic Dependencies

Some registration functions automatically register the features they depend on. For example:

- `RegisterImageProcessingConfiguration()` → automatically calls `RegisterColorCurves()`
- `RegisterStandardMaterial()` → registers the class and its parser

You don't need to manually register dependencies that are already handled this way. If you're unsure, calling a registration function multiple times is harmless — only the first call does anything.

## The `CheckMissingImports` Diagnostic

If you're unsure which registrations your app needs, use the diagnostic utility:

```typescript
import { CheckMissingImports } from "@babylonjs/core/Misc/checkMissingImports";

// Call after all your imports but before scene logic
const missing = CheckMissingImports();
```

This scans all known placeholders (stubs) and reports which features haven't been registered:

```
[Babylon.js] The following side-effect modules have not been imported:
  - Ray
  - ImageProcessingConfiguration
  - Texture
Note: These are only required if your application uses the corresponding features.
If you do use them, import the modules or their parent packages to avoid runtime errors.
See: https://doc.babylonjs.com/setup/treeshaking
```

**Important**: `CheckMissingImports` reports ALL unregistered stubs, even ones your app may never hit. Not every reported module needs to be imported — only the ones your code actually uses.

This utility is intended for **development only**. It imports several core modules to test their stubs, so don't include it in production builds.

## Runtime Stub Warning Diagnostics

`CheckMissingImports()` reports all known unregistered stubs, including features your app may never use. If you want to debug only the missing side-effect registrations that are actually called at runtime, enable one-time stub warnings:

```typescript
import { SetMissingSideEffectWarningsEnabled } from "@babylonjs/core/Misc/devTools";

SetMissingSideEffectWarningsEnabled(true);
```

Missing side-effect stubs are quiet by default because Babylon internals may probe optional augmented APIs. When warnings are enabled, each missing `Class.method` logs at most once. For code that intentionally probes optional APIs, suppress warnings around the synchronous probe:

```typescript
import { SuppressMissingSideEffectWarnings } from "@babylonjs/core/Misc/devTools";

SuppressMissingSideEffectWarnings(() => {
    scene.getPhysicsEngine?.();
});
```

Keep runtime stub warnings as a development diagnostic unless your application intentionally wants this logging in production.

## Safe to Call Multiple Times

All registration functions are safe to call more than once — only the first call actually does anything:

```typescript
RegisterStandardMaterial(); // ← Registers
RegisterStandardMaterial(); // ← No-op (already registered)
RegisterStandardMaterial(); // ← No-op
```

This means:

- You can safely call registration functions from multiple modules
- Libraries can register what they need without worrying about duplicate calls
- The order of registration doesn't matter (except for dependencies that must exist before use)

## Migration from Legacy Imports

To migrate existing code from legacy side-effect imports:

```typescript
// Before (legacy):
import "@babylonjs/core/Physics/joinedPhysicsEngineComponent";

// After (pure):
import { RegisterJoinedPhysicsEngineComponent } from "@babylonjs/core/pure";
RegisterJoinedPhysicsEngineComponent();
```

The mapping is straightforward:

1. Take the side-effect import path
2. Add `.pure` before the extension
3. Import `RegisterXxx` (where `Xxx` is the PascalCase filename)
4. Call it

For imports that only ran side effects (lines like `import "@babylonjs/core/..."` with no imported names), the same pattern applies — every such file now has a corresponding `RegisterXxx()` function.
