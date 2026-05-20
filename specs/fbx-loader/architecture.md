# FBX Loader Architecture

## Overview

The Babylon.js FBX loader is a TypeScript loader plugin under `packages\dev\loaders\src\FBX`. It parses FBX data, interprets the scene graph, and builds Babylon meshes, materials, textures, skeletons, animation groups, cameras, and lights.

This document records the intended architecture for normal-map handling and related future work. It is the durable spec location for decisions that should survive after root-level migration reports are deleted.

## Loader option flow

The FBX loader should follow the same option flow used by other Babylon.js loaders:

1. Declare FBX-specific options by extending `SceneLoaderPluginOptions`.
2. Accept those options in the `FBXFileLoader` constructor.
3. Store normalized options on the loader instance.
4. Pass dynamic-loader plugin options from `packages\dev\loaders\src\dynamic.ts` into `new FBXFileLoader(...)`.
5. Keep side-effect registration as `new FBXFileLoader()` so default behavior remains available.

The normal-map option is:

```ts
export type FBXNormalMapCoordinateSystem = "y-up" | "y-down";

export interface FBXFileLoaderOptions {
    normalMapCoordinateSystem?: FBXNormalMapCoordinateSystem;
}
```

The normalized default is:

```ts
{
    normalMapCoordinateSystem: "y-up";
}
```

## Normal-map slot handling

FBX does not standardize tangent-space normal-map green/Y convention. The loader therefore treats the convention as source texture metadata, not as a Babylon scene-handedness decision.

The following FBX texture slots are explicit tangent-space normal-map slots:

- `NormalMap`
- `NormalMapTexture`
- `normalCamera`

When one of these slots is connected:

- assign the texture to `material.bumpTexture`;
- create or configure the texture with `gammaSpace = false`;
- set `material.invertNormalMapX = false`;
- set `material.invertNormalMapY = normalMapCoordinateSystem === "y-down"`;
- ensure tangent handedness matches the same coordinate-system decision.

## Tangent handedness

Babylon's shader path differs depending on whether explicit tangents are present.

When tangents and normals are present, the shader builds the TBN basis from tangent data and uses `tangent.w` to construct the bitangent:

```glsl
vec3 tbnBitangent = cross(tbnNormal, tbnTangent) * tangentUpdated.w;
vTBN = mat3(finalWorld) * mat3(tbnTangent, tbnBitangent, tbnNormal);
```

In that path, material inversion flags do not provide the full normal-map Y conversion. The FBX loader also generates tangents when geometry has normals and UVs but lacks authored tangents, so this explicit tangent path is common for normal-mapped FBX assets.

The loader should use a single normal-map handedness scale:

```ts
private _getNormalMapTangentHandednessScale(): 1 | -1 {
    return this._options.normalMapCoordinateSystem === "y-down" ? -1 : 1;
}
```

Apply that scale to:

- authored/source tangent `w` values after tangent vector transform handling;
- generated tangent `w` values after the generated handedness value is computed.

This scale must not be derived from `scene.useRightHandedSystem`.

## `Bump` and `BumpFactor`

`Bump` and `BumpFactor` are ambiguous in FBX content:

- semantically, they can mean traditional grayscale bump/height data;
- in real exporter output, they may also contain tangent-space RGB normal maps.

Babylon `StandardMaterial.bumpTexture` is not a traditional grayscale height-map slot. It is sampled by the shader as normal-vector data. Because of that, the most compatibility-safe behavior for the initial integration is to continue treating `Bump` and `BumpFactor` as normal-map-like inputs when assigning them to `StandardMaterial.bumpTexture`.

Do not add a loader option that claims to treat `Bump`/`BumpFactor` as true height maps unless the implementation also converts grayscale height/bump data to tangent-space normal data before assigning to `StandardMaterial.bumpTexture`, or routes the source texture to another height-aware path.

Future conversion work should preserve the original bump texture in metadata so tools or downstream material conversion can inspect the source data.

## Texture creation

The loader creates textures from external files and embedded FBX texture bytes through Babylon `Texture` creation options. It uses `ITextureCreationOptions` to centralize:

- embedded texture buffers;
- MIME type;
- forced extension;
- image loader options;
- sRGB policy;
- image upload orientation.

Embedded FBX texture bytes should be loaded through a delayed Babylon texture: create the texture with MIME type and forced extension metadata, then call `updateURL(dataUrl, buffer, ...)` with a synthetic non-base64 `data:` URL. This matches Babylon's standard-image buffer path, ensuring formats such as PNG and JPEG consume the embedded buffer instead of attempting an external request. Embedded bytes should not be converted to `Blob` object URLs, because that duplicates lifetime management already handled by Babylon texture loading and creates a revocation hazard.

External sidecar textures are used only when embedded bytes are absent. For safe relative FBX paths such as `textures/diffuse.png`, the loader resolves the path relative to the load `rootUrl`. For absolute authored machine paths or paths containing `..`, the loader falls back to the source basename under `rootUrl`. If the first external URL fails, the loader may retry common image-extension fallbacks while preserving the forced extension for the fallback URL.

This is texture-loading infrastructure. It does not replace:

- `gammaSpace = false` for normal-map data textures;
- `normalMapCoordinateSystem`;
- tangent `w` adjustment for explicit/generated tangent paths.

`Texture` upload `invertY` is image row/UV orientation. It is not the same as tangent-space normal-map green/Y convention.

## Asset container ownership

`loadAssetContainerAsync` returns a container that owns all created FBX assets, including materials, multimaterials, active textures, cameras, lights, skeletons, animation groups, meshes, and transform nodes. Mesh-assigned materials, sub-materials of `MultiMaterial`, and material active textures are included before calling `container.removeAllFromScene()` so container add/remove lifecycle APIs behave consistently.

Container-owned assets should have their `_parentContainer` reference assigned to the returned container before they are removed from the scene. This mirrors the ownership expectations used by Babylon asset containers and keeps later container lifecycle calls consistent.

## Known limitations and future work

### Traditional grayscale bump maps

Traditional grayscale bump/height maps from FBX `Bump` or `BumpFactor` are not physically handled as height maps by the initial loader integration. They are treated as normal-map-like inputs for compatibility with existing Babylon behavior and exporter quirks.

Future work may add true grayscale bump support by converting height/bump textures into tangent-space normal textures before assignment to `StandardMaterial.bumpTexture`.

### Automatic bump classification

Automatic classification of `Bump`/`BumpFactor` textures is deferred. If added later, classification should determine whether the source texture is a normal map or height map. It should not silently choose Y-up or Y-down in conflict with the explicit `normalMapCoordinateSystem` option.

### Visual validation

Normal-map convention changes should be covered by visualization tests because green/Y inversion is primarily a rendered-output bug. Tests should include an embedded normal-map FBX fixture and should verify that left-handed and right-handed scenes do not change the source normal-map convention.
