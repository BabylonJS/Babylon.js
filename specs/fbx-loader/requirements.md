# FBX Loader Requirements

## Loader registration and options

- The FBX loader must be available through the Babylon.js loader package exports and side-effect registration.
- Dynamic loader registration must pass FBX-specific `SceneLoader` plugin options to the `FBXFileLoader` constructor.
- The loader must expose:

```ts
export type FBXNormalMapCoordinateSystem = "y-up" | "y-down";

export interface FBXFileLoaderOptions {
    /**
     * Source convention for tangent-space normal maps connected through FBX normal-map slots.
     * FBX does not standardize this convention. The default is "y-up".
     */
    normalMapCoordinateSystem?: FBXNormalMapCoordinateSystem;
}
```

- The default `normalMapCoordinateSystem` must be `"y-up"`.
- `"y-down"` must be opt-in through direct loader construction or `SceneLoader` plugin options.

## Tangent-space normal maps

- Texture slots that explicitly represent tangent-space normal maps must be treated as normal maps:
    - `NormalMap`
    - `NormalMapTexture`
    - `normalCamera`
- Normal-map textures must be treated as data textures by setting `texture.gammaSpace = false`.
- `material.invertNormalMapX` must not be driven by `scene.useRightHandedSystem`.
- `material.invertNormalMapY` must not be driven by `scene.useRightHandedSystem`.
- For Y-up normal maps, `material.invertNormalMapY` must be `false`.
- For Y-down normal maps, `material.invertNormalMapY` must be `true`.
- The normal-map coordinate-system option must also affect tangent handedness because Babylon's explicit/generated tangent shader path uses `tangent.w` to build the bitangent.
- Authored tangents and generated tangents must preserve their existing handedness for `"y-up"` and multiply `tangent.w` by `-1` for `"y-down"`.

## `Bump` and `BumpFactor` compatibility

- FBX `Bump` and `BumpFactor` slots are ambiguous in real assets.
- Some exporters use them for traditional grayscale bump/height maps.
- Some exporters use them for tangent-space normal maps.
- For compatibility, the initial Babylon.js integration must treat `Bump` and `BumpFactor` textures as normal-map-like inputs when assigning them to `StandardMaterial.bumpTexture`.
- The loader must not introduce a semantic height/bump option until it also implements a correct conversion path from grayscale height/bump data to tangent-space normal data, or another Babylon material path that correctly consumes grayscale height data.
- A future height/bump mode must not simply assign a grayscale height texture to `StandardMaterial.bumpTexture` and call it correct, because `StandardMaterial.bumpTexture` is sampled as normal-vector data in the shader.

## Scene handedness

- Scene handedness may still affect mesh transforms, side orientation, and other geometric conversion behavior.
- Scene handedness must not select the source normal-map green/Y convention.
- The same FBX normal-map convention should apply consistently in left-handed and right-handed Babylon scenes.

## Texture creation

- External and embedded FBX textures must be created through Babylon `Texture` creation options rather than loader-local image-loading paths.
- Embedded texture bytes must be loaded through Babylon's delayed texture `updateURL(dataUrl, buffer, ...)` path so standard image formats such as PNG and JPEG consume the buffer rather than issuing an external request.
- Embedded textures must include MIME type metadata when a MIME type can be inferred from the source filename.
- Texture creation must provide `forcedExtension` when a source filename or MIME type identifies the image type, so Babylon selects the expected texture loader even when the URL is synthetic or ambiguous.
- Embedded textures must not be converted to `Blob` object URLs.
- External sidecar textures must only be used when embedded bytes are absent.
- For sidecars, safe relative paths such as `textures/diffuse.png` should resolve relative to the loader `rootUrl`; absolute authored machine paths or paths containing `..` should fall back to the source basename under `rootUrl`.
- Normal-map-compatible slots must create or configure textures as data textures with `gammaSpace = false`.
- Texture upload `invertY` must not be used as a substitute for tangent-space normal-map green/Y convention handling.

## Asset container ownership

- `loadAssetContainerAsync` must populate the returned container with FBX-created scene nodes, materials, multimaterials, textures, skeletons, animation groups, cameras, and lights as applicable.
- Materials assigned to meshes, sub-materials of `MultiMaterial`, and active textures referenced by FBX-created materials must be included in the container before `container.removeAllFromScene()` is called.
- Container-owned assets must have their parent-container relationship set so later container add/remove/dispose lifecycle operations remain consistent.

## Future work

- Add a semantic grayscale height/bump mode only when the loader can convert height/bump textures to tangent-space normal textures before assigning to `StandardMaterial.bumpTexture`, or when a suitable height-aware material path is available.
- Preserve the original source bump texture in metadata if future conversion needs access to the unconverted texture.
- Consider auto-detection only after real fixtures are available. Any auto mode should classify whether a texture is a normal map or height map; it must not silently override the explicit `normalMapCoordinateSystem` option.

## Validation requirements

- Unit coverage should verify:
    - default Y-up normal texture setup;
    - opt-in Y-down material setup;
    - generated tangent `w` scaling for Y-down;
    - authored tangent `w` scaling for Y-down;
    - scene handedness does not determine normal-map convention;
    - `Bump` and `BumpFactor` preserve compatibility as normal-map-like `bumpTexture` inputs;
    - embedded textures load through buffer-backed `Texture` creation rather than blob URLs;
    - asset containers include FBX-created materials and textures.
- Rendering coverage should include an embedded FBX normal-map fixture that catches concave/convex inversion caused by the wrong green/Y convention.
- Visualization tests must include `dependsOn` tags when added to the Babylon.js visualization config.
