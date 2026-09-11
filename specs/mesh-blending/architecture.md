# Screen-space mesh blending

Mesh blending is a WebGL2 and WebGPU visual SceneColor effect for softening visible contacts between opaque or alpha-tested meshes. It does not merge geometry and does not change collision shapes, depth, normal buffers, indirect lighting, shadow maps, or shadow geometry. Transparent rendering is caller-controlled.

## Mesh tags and radius classes

Assign `AbstractMesh.meshBlendingTag` with `PackMeshBlendingTag(groupId, radiusClass)`.

- Group `0` disables blending.
- Groups `1..63` are application-assigned logical groups.
- Pixels in the same nonzero group do not blend with one another.
- Pixels in different nonzero groups can blend after boundary, depth, span, and contact-angle validation.
- Four radius classes (`Small`, `Medium`, `Large`, and `ExtraLarge`) select configurable world radii and minimum projected radii.
- At a contact, the smaller of the two radius classes wins.
- Instances and thin instances use their source mesh's tag; per-instance mesh-blending tags are not supported.

Minimum projected radii are measured in physical render-target pixels. They keep distant seams visible while the world radius keeps nearby widths stable. Both perspective and orthographic cameras are supported, including reverse-depth rendering.

## Geometry inputs

The effect consumes the following single-sampled geometry textures:

1. SceneColor.
2. Packed mesh-blending tags (`R8UI`, nearest sampling, no mipmaps).
3. View or screen depth.
4. World-space normals.
5. Optional linear base color/albedo for shadow estimation.

SceneColor and all provided geometry inputs must use the same physical dimensions and sample coverage. The independently sized artistic-noise texture is excluded from this constraint. Alpha-tested fragments write tags only when they survive the material's configured alpha cutoff. When base color/albedo is omitted, shadow estimation and all base-color samples are compiled out; no fallback texture or additional geometry attachment is required.

Transparent meshes are allowed, but the application is responsible for ensuring that they do not make SceneColor inconsistent with the single-layer depth, normal, albedo, and tag inputs. Transparent meshes that are screen-space-disjoint from participating blended surfaces can be rendered safely. Overlapping transparent surfaces can overwrite or blend geometry inputs independently from SceneColor and produce holes, false boundaries, or incorrect colors. Compositing transparent content after mesh blending remains the recommended general configuration.

### Classic renderer

Enable the required `GeometryBufferRenderer` outputs, set `samples` to `1`, and enable world-space normals and mesh-blending tags. Provide an aligned base-color texture only when shadow estimation is wanted. Construct `MeshBlendingPostProcess` with those caller-owned textures. The post process never enables, reconfigures, resizes, or disposes the geometry renderer or supplied textures, so caller-created inputs must be resized with the SceneColor input.

The classic wrapper is runtime-only and cannot be serialized, parsed, or cloned because its geometry inputs are caller-owned runtime resources. Use FrameGraph/NRGE when the mesh-blending configuration must be serialized.

### Frame graph

Request screen/view depth, world normal, and mesh-blending tag outputs from `FrameGraphGeometryRendererTask`. Request and connect albedo only when shadow estimation is wanted. The tag can occupy any color-attachment position and must use `TEXTURETYPE_UNSIGNED_BYTE` with `TEXTUREFORMAT_RED_INTEGER`. Mixed float and integer attachments are declared and cleared according to their actual scalar type. Connect those handles and the matching SceneColor to `FrameGraphMeshBlendingTask` or `NodeRenderGraphMeshBlendingPostProcessBlock`. `renderTransparentMeshes` is not overridden; set it according to the scene's overlap and composition requirements.

Both wrappers use `ThinMeshBlendingPostProcess`, so quality, radius, slope, noise, depth, and debug configuration compile and bind through the same implementation.

## Quality and cost

`MeshBlendQuality.Medium` is the default.

- `Low` uses fewer searches, sRGB interpolation, and no artistic-noise sample.
- `Medium` adds OKLab interpolation and artistic noise.
- `High` adds full search rotation, one-pixel fallback, tiny-object protection, and a secondary junction target.
- `Cinematic` increases direction and boundary-search work.

Cost grows with screen coverage and quality because the pass searches the packed tag texture per participating pixel. Profile enabled, disabled, and quality variants on the target hardware rather than relying on a universal millisecond threshold.

The internal search texture is deterministic spatial noise: it rotates and jitters searches without changing between frames. `noiseTexture` is a separate, user-owned artistic texture projected in world space after contact validation. The effect has no temporal accumulation and does not require TAA.

## Examples

These snippets require a Babylon.js build containing the mesh-blending APIs. Before that build is deployed to Playground Preview, run them through the local Playground:

- Classic and FrameGraph parity: [`http://localhost:1338/#O05LI8#2`](http://localhost:1338/#O05LI8#2). Add `?engine=webgpu` before the hash to use WebGPU. The scene uses reverse depth, places the tag at MRT slot zero, and can omit albedo.
- Feature and performance demo: [`http://localhost:1338/#XVZTSI#0`](http://localhost:1338/#XVZTSI#0). It includes rock-to-ground contacts, shared and different groups, distant seams, all four radius classes, tiny props, a three-mesh junction, alpha-tested foliage, quality/debug controls, and relative GPU timing.

After deployment, the same snippet IDs are available through [Playground Preview (`#O05LI8#2`)](https://playground.babylonjs.com/?version=preview#O05LI8#2) and [Playground Preview (`#XVZTSI#0`)](https://playground.babylonjs.com/?version=preview#XVZTSI#0).

The performance demo exposes `window.runMeshBlendBenchmark()`. It uses `EngineInstrumentation.captureGPUFrameTime` and reports same-device ratios for disabled, Low, Medium, High, and Cinematic modes. Results are diagnostic measurements rather than pass/fail thresholds.

## Debug views

`MeshBlendDebugMode` provides deterministic views for the packed tag, candidate direction/distance, seam/fade, rejection reason, approximate stage/work, target continuation, tiny-object protection, multi-target selection, target-color construction, shadow attenuation, color interpolation, reconstructed world position, world normal, artistic noise, and final modulated fade. The shadow-attenuation view is neutral when no albedo input is provided.

## References

The implementation is independently written for Babylon.js. The following public resources informed the technique and color-space choices:

- [MeshBlend](https://meshblend.lervik.com/) — behavioral target and parameter-model inspiration. The Babylon.js implementation does not use or reproduce the plugin's source code.
- Jack Tollenaar, [Screen space mesh seam blending](https://www.jacktollenaar.top/articles/meshblending.html) — screen-space seam detection, mirrored color sampling, and post-process blending.
- Jack Tollenaar, [Fast mesh seam blending](https://www.jacktollenaar.top/articles/meshblending2.html) — performance analysis and optimization considerations. The current implementation does not reproduce its indirect-compute pipeline.
- Björn Ottosson, [A perceptual color space for image processing](https://bottosson.github.io/posts/oklab/) — OKLab conversion and interpolation.
