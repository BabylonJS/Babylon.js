# Troubleshooting

## Common Errors

### "X needs to be imported before as it contains a side-effect required by your code"

**Cause**: You're using a feature that needs a registration call, but you haven't called it yet.

**Example**:

```
Uncaught StandardMaterial needs to be imported before as it contains a side-effect required by your code.
```

**Fix**: Import and call the corresponding registration function:

```typescript
import { RegisterStandardMaterial } from "@babylonjs/core/pure";
RegisterStandardMaterial();
```

**Common triggers and their registrations**:

| Error Message                                          | Registration Needed                      |
| ------------------------------------------------------ | ---------------------------------------- |
| `StandardMaterial needs to be imported...`             | `RegisterStandardMaterial()`             |
| `ImageProcessingConfiguration needs to be imported...` | `RegisterImageProcessingConfiguration()` |
| `ColorCurves needs to be imported...`                  | `RegisterColorCurves()`                  |
| `Texture needs to be imported...`                      | `RegisterTexture()`                      |
| `FresnelParameters needs to be imported...`            | `RegisterFresnelParameters()`            |
| `Ray needs to be imported...`                          | `RegisterRay()`                          |
| `CubeTexture needs to be imported...`                  | `RegisterCubeTexture()`                  |
| `InstancedMesh needs to be imported...`                | `RegisterInstancedMesh()`                |

### TypeError: scene.enablePhysics is not a function

**Cause**: The physics component hasn't been registered. The `enablePhysics` method only becomes available after registration.

**Fix**:

```typescript
import { RegisterJoinedPhysicsEngineComponent } from "@babylonjs/core/pure";
import "@babylonjs/core/Physics/joinedPhysicsEngineComponent.types";
RegisterJoinedPhysicsEngineComponent();
```

### Engine methods missing or textures not loading

**Cause**: Engine extensions haven't been registered. When using pure imports, the engine starts with minimal functionality — texture loading, alpha blending, render targets, etc. are all optional extensions.

**Fix**: Register engine extensions using one of the tiered helpers:

```typescript
import { RegisterStandardEngineExtensions } from "@babylonjs/core/pure";
RegisterStandardEngineExtensions(); // Covers most use cases
```

For advanced features (compute shaders, cube textures, multiview), use `RegisterFullEngineExtensions()` instead. See [Engine Registration Tiers](./01-overview.md#engine-registration-tiers) for details.

### TypeError: scene.pick is not a function (or createPickingRay)

**Cause**: Ray/picking functionality hasn't been registered.

**Fix**:

```typescript
import { RegisterRay } from "@babylonjs/core/pure";
RegisterRay();
```

### TypeScript error: Property 'enablePhysics' does not exist on type 'Scene'

**Cause**: The type augmentation file hasn't been imported. The `enablePhysics` method is added at runtime by the registration function, but TypeScript needs a separate `.types` import to know it exists.

**Fix**: Import the `.types` file:

```typescript
import "@babylonjs/core/Physics/joinedPhysicsEngineComponent.types";
```

### Cascading Errors (Fix One, Hit the Next)

**Cause**: Features have dependencies. For example, `ImageProcessingConfiguration` depends on `ColorCurves`, which depends on `Texture`. Each missing dependency throws a separate error.

**Solutions**:

1. **Use `CheckMissingImports`** to discover all missing registrations at once:

    ```typescript
    import { CheckMissingImports } from "@babylonjs/core/Misc/checkMissingImports";
    CheckMissingImports(); // Logs ALL missing modules
    ```

2. **Common dependency chains are handled automatically**. For example, `RegisterImageProcessingConfiguration()` automatically calls `RegisterColorCurves()`.

3. **For scene loading**, register all likely-needed parsers upfront:

    ```typescript
    import { RegisterStandardMaterial, RegisterPBRMaterial, RegisterImageProcessingConfiguration, RegisterTexture, RegisterFresnelParameters } from "@babylonjs/core/pure";

    RegisterStandardMaterial();
    RegisterPBRMaterial();
    RegisterImageProcessingConfiguration();
    RegisterTexture();
    RegisterFresnelParameters();
    ```

### Materials appear black or use the default look (not loaded correctly)

**Cause**: The material's class wasn't registered, so the scene loader can't recreate it from saved data.

**Fix**: Register the specific material type:

```typescript
import { RegisterPBRMaterial } from "@babylonjs/core/pure";
RegisterPBRMaterial();
```

### Shader compilation error: include "X" not found

**Cause**: A shader include hasn't been registered into the shader store. This happens when you use a material or effect that needs specific shader includes.

**Fix**: Import the material module (which registers its shaders):

```typescript
import { RegisterStandardMaterial } from "@babylonjs/core/pure";
RegisterStandardMaterial();
```

Or for custom shaders, import the includes directly:

```typescript
import "@babylonjs/core/Shaders/ShadersInclude/helperFunctions";
```

## Diagnostic Tools

### CheckMissingImports

The primary diagnostic tool for pure imports. Call it at startup to see all stubs that haven't been registered:

```typescript
import { CheckMissingImports } from "@babylonjs/core/Misc/checkMissingImports";

// After all your imports, before creating the scene:
const missing = CheckMissingImports();
if (missing.length > 0) {
    console.log("You may need to register:", missing);
}
```

**What it checks**:

- SerializationHelper parser stubs (ImageProcessingConfiguration, FresnelParameters, ColorCurves, Texture)
- Scene factory stubs (DefaultMaterialFactory, CollisionCoordinatorFactory)
- Scene picking stubs (Ray - createPickingRay)
- Texture factory stubs (CubeTexture, MirrorTexture, RenderTargetTexture, VideoTexture)
- Mesh parser stubs (InstancedMesh, GroundMesh, GoldbergMesh, LinesMesh, GreasedLineMesh, TrailMesh, GaussianSplattingMesh, etc.)
- Node factory stubs (AnimationRange)

**Important**: Not all reported modules are required. The report lists what's _available but unregistered_. Only import what your app actually uses.

### Side-Effect Warning Stubs

When using pure imports, methods that would normally be added by side effects are replaced with lightweight placeholders (stubs). These stubs:

- Return `undefined` (a falsy value in JavaScript) — so feature-detection code like `if (scene.getPhysicsEngine())` works correctly
- Don't log warnings by default — because internal engine code may probe optional features frequently
- Produce a clear `TypeError` if you try to use the return value as an object

This means code like `if (scene.getPhysicsEngine()) { ... }` works correctly without the physics registration — it simply evaluates to `false`.

To debug a pure-import scene and see which missing side-effect registrations are actually being called, enable runtime stub warnings during development:

```typescript
import { SetMissingSideEffectWarningsEnabled } from "@babylonjs/core/Misc/devTools";

SetMissingSideEffectWarningsEnabled(true);
```

With this enabled, each missing side-effect stub logs at most once:

```
[Babylon.js] Scene.getPhysicsEngine() requires a side-effect import. See: https://doc.babylonjs.com/setup/treeshaking
```

If your code intentionally probes optional augmented APIs, suppress warnings around that synchronous probe:

```typescript
import { SuppressMissingSideEffectWarnings } from "@babylonjs/core/Misc/devTools";

SuppressMissingSideEffectWarnings(() => {
    scene.getPhysicsEngine?.();
});
```

Use runtime warnings as a development diagnostic. For a broad startup report of all known unregistered stubs, use `CheckMissingImports()` instead.

## Performance Considerations

### Registration Timing

Register side effects **before** you use them. The best pattern is to group all registrations at the top of your application entry point:

```typescript
// app.ts — entry point
import { RegisterStandardMaterial, RegisterRay, RegisterJoinedPhysicsEngineComponent } from "@babylonjs/core/pure";

// Register everything at startup
RegisterStandardMaterial();
RegisterRay();
RegisterJoinedPhysicsEngineComponent();

// Then create your scene...
```

### Bundle Size Impact

Registration functions add very little overhead — they're typically 5–20 lines that set up methods on classes. The real bundle savings come from **not importing** the modules you don't need:

| Approach                                | Approximate Bundle Size |
| --------------------------------------- | ----------------------- |
| `@babylonjs/core` (everything)          | ~6+ MB minified         |
| `@babylonjs/core/pure` (typical app)    | ~1.5–3 MB minified      |
| Minimal scene (pure, few registrations) | ~1–1.5 MB minified      |

## Migration Checklist

When converting an existing project from legacy to pure imports:

1. **Switch value imports** to `.pure` paths or the pure barrel
2. **Find bare imports** — lines like `import "@babylonjs/core/..."` that don't import any names
3. **Replace each with** `import { RegisterXxx } from "@babylonjs/core/pure"` + `RegisterXxx()`
4. **Add `.types` imports** for any features that add methods to existing classes
5. **Run `CheckMissingImports()`** to catch anything you missed
6. **Test at runtime** — load scenes, exercise all features
7. **Remove `CheckMissingImports`** from production builds
