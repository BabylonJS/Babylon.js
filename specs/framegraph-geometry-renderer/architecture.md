# Frame graph geometry renderer: additional renderers

`FrameGraphGeometryRendererTask` uses the objects' own rendering paths to produce beauty and requested geometry textures in one MRT pass. Gaussian splats, sprites, and CPU/GPU particles do not use the classic geometry buffer renderer's replacement mesh shader.

## Selecting objects

`FrameGraphObjectList` accepts an optional `spriteManagers` collection alongside `meshes` and `particleSystems`.

```typescript
geometryTask.objectList = {
    meshes: [mesh, gaussianMesh],
    particleSystems: [particleSystem],
    spriteManagers: [spriteManager],
};
geometryTask.renderSprites = true;
geometryTask.renderParticles = true;
```

An omitted or `null` sprite-manager list selects the scene's managers. An empty array selects none. A populated array selects only those managers. The existing sprite rendering flag, camera layer masks, and rendering groups still apply. Selection is at manager granularity, not per individual sprite.

Object-list culling preserves this collection, including frozen and disabled paths. NRGE scene-object inputs include sprite managers; external object-list values retain their existing application-owned serialization behavior.

The geometry task retains its previous defaults: sprites, particles, bounding boxes, and outlines are disabled until explicitly enabled.

## Attachment ownership

When a beauty target is supplied, it occupies attachment zero. Additional caller-supplied targets follow it, then the geometry textures in `textureDescriptions` order. Public output handles continue to resolve to the same requested resources; shaders use the recorded indices rather than assuming a geometry attachment's position.

The per-render-pass `MaterialHelperGeometryRendering` configuration owns the full MRT layout, beauty-only layout, and defines used by both mesh materials and standalone render effects.

An MRT-capable draw selects the full layout immediately around its draw. Afterwards, the beauty-only layout is restored before mesh-after-render and rendering-group hooks run. Existing single-output custom effects can therefore draw to beauty without writing into the geometry attachments. Without a beauty target, those effects are not drawn.

Integer geometry attachments retain their scalar types at any geometry slot. Frame graph code does not implement backend-specific clears or blending. Engine code owns those operations, including omitting blend state on disabled WebGPU attachments.

## Geometry outputs

Only requested channels are emitted. The built-in sprite, particle, and Gaussian shaders share output encoding code while computing primitive-specific values.

| Renderer          | Position and depth                                                                                       | Normals                                                               | Color and identity                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Gaussian splats   | Points on the rendered splat center-depth plane; local positions use the source/compound-part transform  | Camera-facing plane approximation, not a recovered volumetric surface | Base/DC color without view-dependent SH; logical source mesh ID/tag |
| Sprites           | Actual expanded billboard points; local position is the angle-rotated offset from the sprite center      | Billboard plane normal                                                | Linear texture-times-tint albedo; object ID/tag zero                |
| CPU/GPU particles | Actual expanded primitive points, including billboard, stretched, non-billboard, and emitter-local paths | Generated particle plane normal                                       | Pre-fog/image-processing linear base color; object ID/tag zero      |

Unlit renderers write neutral reflectivity and irradiance. Gaussian base/DC color is a useful color proxy, not recovered PBR albedo. Depth outputs retain the existing view, normalized-view, and screen-space conventions.

Normals of two-sided particle primitives face the visible side for both perspective and orthographic cameras.

Object-ID and mesh-tag providers remain mesh APIs. Sprites and particle systems do not pass synthetic meshes to those callbacks. Gaussian camera meshes use the logical source mesh's identity. Compound splats use the compound source identity, not distinct per-part IDs.

## Transparency

This implementation retains the geometry renderer's existing single-pass, approximate transparency convention. It does not add opacity-qualified geometry subpasses or change beauty blending. Shared geometry output coverage uses the existing `alpha > 0.4` convention. Zero-alpha fragments are discarded only when the active blend equation makes their beauty contribution zero, or when no beauty output exists. Alpha-independent additive and premultiplied color contributions are preserved.

Overlapping transparent primitives can blend or replace geometry values differently from beauty. A single G-buffer cannot represent all translucent layers. In particular, integer tags cannot be alpha blended, and geometry alpha is not a general-purpose normalized validity mask. Applications that require a coherent opaque surface should render overlapping transparency after geometry-dependent effects.

Texture formats must support the chosen blending operation. On WebGPU, blending into 32-bit floating-point targets requires the `float32-blendable` device feature; use supported half-float formats when that feature is unavailable. Large MRT layouts also need to fit the device's color-attachment byte limit, not just its attachment count. Existing WebGPU engine options can request supported features and limits before device creation.

## Motion and caching

Velocity outputs use the existing nonlinear and linear encodings. Nonlinear zero motion is `(0.5, 0.5)`; linear zero motion is `(0, 0)`.

CPU/GPU particles write these neutral velocity values rather than tracking particle motion. Requesting a velocity texture does not allocate particle history buffers, add previous-state vertex attributes, or reconstruct previous camera/emitter/particle transforms. GPU particle rendering retains its ordinary simulation-buffer selection.

Neutral output means that particle motion is not represented, not that particles are stationary. Velocity-based TAA can ghost on moving particles, and object-based motion blur does not capture their movement. The existing single-pass transparency coverage and blending rules still apply.

Sprite histories continue to track position, angle, size, and camera matrices per render pass/camera.

Sprite animation is advanced once per scene frame across frame graph passes. Explicit sprite rendering outside a frame graph retains its existing per-call animation behavior.

Gaussian motion includes camera/source transforms and compound-part transform history. It remains an approximation for changes to the camera-facing splat footprint, covariance, or splat data itself. It is not a reconstructed physical surface velocity.

Compound motion requires an additional previous-world matrix per part. Its maximum part count can therefore be lower on engines with small vertex-uniform limits; unsupported counts are rejected explicitly rather than dropping parts.

Effect variants and VAOs are cached by their render pass/layout and released with the render pass. Graph rebuilds invalidate temporal state even when shader layouts are unchanged. Temporal data is initialized on first use and reset when the corresponding renderer/history is recreated or no longer has a continuous prior frame. Compound previous transforms remain stable across repeated binds within one frame.

## Beauty-only diagnostics

Bounding boxes, edges, outlines, and overlays only contribute to beauty. They retain their existing draw order and depth/stencil behavior, but do not write geometry color attachments. With no beauty output they are skipped.

Glow/highlight layers, utility scenes, lens flares, and other camera-level composition features remain owned by their existing tasks/components.

## Custom materials

Full automatic Gaussian geometry output is implemented by `GaussianSplattingMaterial`. Custom Gaussian NodeMaterial graphs retain their explicitly connected prepass outputs; the default Gaussian node graph does not automatically recover all primitive geometry channels.

Custom particle and line effects retain their existing APIs and beauty-only fallback. A custom shader must implement the MRT output contract to supply geometry data; arbitrary user shader source is not rewritten.

## Examples and regression scenes

- [Beauty and sprite-manager selection](https://playground.babylonjs.com/#PVK3RV#2)
- [Regular object-renderer beauty reference](https://playground.babylonjs.com/#1OC90Y#1)
- [World-normal outputs](https://playground.babylonjs.com/#Z6QI9V#2)
- [Geometry-only output with an integer attachment at slot zero](https://playground.babylonjs.com/#RT0TA2#2)
- [NRGE geometry renderer](https://playground.babylonjs.com/#NIXFAQ#2)
- [Dedicated Gaussian mesh](https://playground.babylonjs.com/#RQLLM5#0)
- [Gaussian mesh object-renderer reference](https://playground.babylonjs.com/#5F1T3C#0)

The regular object-renderer scene uses no geometry renderer task and shares the same beauty reference image with the geometry-renderer scene.
The dedicated Gaussian model and its object-renderer counterpart also share one reference image.

These asynchronous Playgrounds complete readiness checks and populate the explicitly requested particles before returning. They do not render scene frames during preparation, and their visualization entries do not specify `renderCount`.

Render-pass readiness checks prepare the appropriate sprite and particle shader variants. Geometry-renderer pre-warming performs complete mesh/material checks, including Gaussian sorting. The Playgrounds also await the diagnostic shaders they use. `SpriteRenderer.isReady()` and `SpriteManager.isReady()` can prepare a sprite variant without advancing animations or issuing a draw.
