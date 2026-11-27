## Babylon.js loaders

### Usage

See documentation links:

- https://doc.babylonjs.com/features/featuresDeepDive/importers/oBJ
- https://doc.babylonjs.com/features/featuresDeepDive/importers/stl
- https://doc.babylonjs.com/features/featuresDeepDive/importers/glTF

### Experimental neural material textures

`BABYLON_materials_neural_texture` (`babylon-ntc-v1`, `babylon-ntc-v2` and `babylon-ntc-v4`) is enabled by
default. An unknown `codec` logs a warning and the material keeps its core fallback textures.
When neural decoding is unavailable on the engine (no GPU bake and no allowed CPU fallback, or no shader
support in shader mode), an optional extension logs a warning and keeps the core textures; an extension listed
in `extensionsRequired` fails the load.

`babylon-ntc-v4` stores per-group latent atlases (texture order follows the `latentTextures` array) and a
packed half/float MLP. Load-time decoding bakes mipmapped textures with WebGL 2 or WebGPU render passes;
`bakeMips: "neural"` decodes every mip from the matching latent level, otherwise mips are generated. The
runtime path (`decodeInShader: true`) accepts `runtimeFilter` (`bilinear` default, `nearest`, `trilinear`,
`stochastic`), `lodBias`, `runtimeWeights` (`texture` default or `uniform`) and `runtimePrecision` (`f32`
default, or `f16` where supported). The CPU fallback decodes the base level only.
The text below describes the shared pipeline for the original v1 layout. Its two RGBA8-pair latent grids and float32 24→32→32→9 network are
baked into ordinary mipmapped base-color (sRGB), normal (linear, reconstructed
Z), and occlusion/roughness/metallic (linear RGB) textures at load time. WebGL 2
uses fullscreen GLSL render-to-texture passes; WebGPU uses an 8×8 WGSL compute
dispatch writing RGBA8 storage textures. Both paths generate complete mip chains,
retain decoded images in VRAM, and await compilation/completion asynchronously.
The same decoder and packed weights are shared with the real-time material plugin.
Latents use explicit FP32 bilinear/repeat interpolation: native UNORM8 filtering
can introduce intermediate rounding that is amplified when reconstructing normal Z.
Base-color texels retain their encoded sRGB values and are linearized by PBR;
normal and ORM texels are linear data.

GPU baking is the default and does not read back the latent grids. WebGL uses a
nonblocking GL sync fence (no readback); WebGPU uses a four-byte asynchronous
staging readback to fence transient GPU resource cleanup, not texture decoding.
To explicitly permit the slower, chunked CPU fallback on unsupported engines
(including WebGL 1) or GPU bake failure, set
`extensionOptions: { BABYLON_materials_neural_texture: { allowCPUFallback: true } }`.
The default is `false`, so unsupported baking produces an actionable loader error
rather than unexpectedly running CPU inference. Reload the model after graphics
context loss to regenerate baked textures.

To keep the latent grids on the GPU and evaluate the network per fragment instead:

```typescript
await ImportMeshAsync("model.glb", scene, {
    pluginOptions: {
        gltf: {
            extensionOptions: {
                BABYLON_materials_neural_texture: { decodeInShader: true },
            },
        },
    },
});
```

Both GLSL (WebGL 2) and WGSL (WebGPU) are supported. Only `replacedSlots` are substituted; glTF factors, normal
scale, occlusion strength, alpha mode, and other textures remain intact.
Explicit shader mode never calls the GPU baker or CPU decoder, even when CPU fallback
is allowed. Unsupported engines fail (required extension) or keep the core textures (optional extension) rather than silently baking. Latents and
losslessly padded float32 weights are uploaded; only tiny core-slot placeholders
may be created to retain PBR defines and encoded-sRGB handling.
Untransformed `TEXCOORD_0` and `PBRMaterial` are currently required; other
materials use the valid core fallback textures. The per-fragment path samples
the base latent level with bilinear/repeat filtering, not decoded mipmaps, so
minified images can differ from load-time decoding and shader cost is higher.

The PBR-only material plugin preprocesses sampling calls **after includes** in
`pbr.fragment` and its GLSL/WGSL include blocks. It redirects both `TEXRD` and
direct `texture2D`/`textureSample` reads of the selected core samplers to UV-taking
neural sampling functions. Prefix-only replacement preserves nested UV expressions,
parallax offsets, swizzles, and statement terminators. Covered sites are:

- albedo RGB and its alpha, feeding `pbrBlockAlbedoOpacity` and alpha testing;
- ambient/occlusion, feeding `pbrBlockAmbientOcclusion`;
- reflectivity/metallic-roughness, feeding `pbrBlockReflectivity`;
- bump/normal: tangent and object space, detail-normal blending, derivative TBN,
  `perturbNormal`, parallax-offset and parallax-occlusion height reads, and PBR debug.

Equal UV0 samples reuse one per-fragment decode; differing UVs are decoded at the
requested coordinates. The codec reconstructs normal Z and supplies normal alpha
1 (it has no authored height channel). Unreplaced slots, other extension textures,
and non-PBR shader families (including Standard, Node, OpenPBR, depth/shadow passes)
are not redirected. No shared shader includes or other material families are modified.

#### `babylon-ntc-v2`

v2 keeps the v1 latents and 24→32→32 network but the last layer has a variable
number of outputs `N = network.outputs` (1 to 32); `weights.count` must equal
`1856 + 33 * N`. `outputs` maps every group to a `[startChannel, componentCount]` pair of
consecutive network outputs; this is the only accepted form (unlike v1's explicit channel
index lists), and the range must lie within the N outputs. Supported groups
and component counts: `baseColor` (3 or 4), `normal` (2), `occlusion`, `roughness`,
`metallic` (1 each), `emissive` (3), `diffuse` (3 or 4), `specular` (3), `glossiness` (1).
`replacedSlots` may additionally contain `emissiveTexture`,
`KHR_materials_pbrSpecularGlossiness.diffuseTexture` and
`KHR_materials_pbrSpecularGlossiness.specularGlossinessTexture`. Every replaced slot
needs its output groups. v1 payloads keep their strict validation and are unchanged.

Workflow rule: the metallic/roughness workflow is used unless the material has a
`KHR_materials_pbrSpecularGlossiness` extension **and** a specular/glossiness slot is
replaced. In that case `diffuseTexture` replaces the albedo, the specular RGB and
glossiness (alpha) replace the reflectivity texture (with
`useMicroSurfaceFromReflectivityMapAlpha`), the ORM output only feeds occlusion, and the
metallic/roughness slots are ignored. If only metallic/roughness slots are replaced the
legacy specular/glossiness alternative is dropped, as before. Specular/glossiness slots
on a material without that extension are ignored with a warning. Base color, emissive,
diffuse and specular stay sRGB-encoded (linearized by PBR); glossiness is linear data.

Load-time baking writes up to six textures (base color, normal, ORM, emissive,
diffuse, specular/glossiness). WebGPU compute passes bind at most four storage
textures each, so more outputs are produced by additional passes. Shader decoding
declares the decoder variables of a group only when the payload provides it, sizes
the weight uniform from N, and keys the compiled effect on the layout. Emissive reads
(`pbrBlockFinalUnlitComponents`) are redirected like the other samplers.

Sandbox accepts `?neuralShaderDecode=true` (default: `false`), together with
`assetUrl=...` and optionally `engine=webgpu`.
Add `neuralTiming=true` to record opt-in `performance.measure` entries named
`neural:*` (loader extension option `timing: true`). No timing clocks, queries,
or observers are installed when disabled. Sandbox also instruments GLB fetch,
binary unpack and JSON parse before the material extension starts. Material
phases cover latent-image decoding + GPU upload (one asynchronous loader boundary),
weight parsing/upload and target creation, bake compilation/dispatch, mip submission,
completion fences, PBR effect compilation, and the first ready rendered frame.
WebGL additionally records valid disjoint-timer-query GPU draw + mip durations;
WebGPU reports completion-fence wall time, not hardware timestamps. These phases
overlap across concurrently loaded materials and must not be added as independent
critical-path durations. Inspect them with:

```javascript
performance.getEntriesByType("measure").filter((entry) => entry.name.startsWith("neural:"));
```

Inference uses vector output groups and uniform-bounded input loops to avoid
ANGLE/D3D expanding nested constant loops into expensive shader compilation.
Runtime latent dimensions avoid recompiling identical networks for each grid
resolution. Weights remain losslessly packed float32 uniform arrays; the fixed
network-size uniform is 32. GPU completion polling yields promptly rather than
adding a fixed 10ms per retry. Parallel shader compilation remains enabled by the
engine where supported.
WebGPU compute baking retains straight-line inference: its compile cost is already
small, and unrolling avoids dynamic-array indexing costs when shading every texel.
The WebGL bake and both PBR fragment paths use the compact looped form.

For local encoder assets, run
`node scripts/validateNeuralTextures.mjs --serve-assets <encoder-folder> 8081`,
then `node scripts/validateNeuralTextures.mjs` while Sandbox is serving on port 1339. The validation script writes screenshots and a detailed results JSON to
`test-results/neural-textures`. The `NEURAL_ASSETS`, `NEURAL_ENGINES`, and
`NEURAL_MODES` environment variables select comma-separated subsets; modes are
`load`, `shader`, and `original`.
The asset server also exposes the screenshot gallery and exact test URLs at
`http://127.0.0.1:8081/__validation__/report.html`.
Validation uses Playwright with the existing Puppeteer-managed Chrome executable,
requires native GPU rendering (rejecting SwiftShader), guards shader-mode loads
against all bake/CPU calls, reads every baked mip level, and compares both baked
textures and test-only full-resolution PBR fragment sampling probes against CLI PNGs
with a maximum one-byte error. The probes run only **after** loading and screenshots;
they are not production baking. Additional normal-map variants cover derivative/
tangent TBN, object space, detail blending, parallax, and PBR debug on both APIs.
Alpha is compared for non-opaque materials; the CLI omits
alpha from opaque reference PNGs. Preserve a previous
CPU run as `results.cpu-baseline.json` in the output directory to include
before/after timings in the report. `readySeconds` excludes PNG comparisons and
screenshot overhead; `seconds` is the comparable complete validation duration.
Use `NEURAL_MODES=load,shader,original` to add original-scene screenshots and
byte-unit render comparisons. Timing-only investigations can set
`NEURAL_TIMING_ONLY=true` and `NEURAL_RESULTS_TAG=timing-before` to preserve a
separate `results.timing-before.json` without reference readback/screenshot overhead.
Run `node scripts/validateNeuralTextures.mjs --benchmark-cpu` separately after GPU
validation to measure the unchanged CPU fallback's scene-ready times on both
engines. This test-only request interception simulates unavailable baking and
permits CPU fallback in the browser module in memory; it never changes source
files or adds a CPU override to the shipped loader. Its results are saved
separately as `results.cpu-benchmark.json` and merged into the timing report.
Benchmark URLs alone still use normal GPU baking without that interception.

### Build

To compile, from the tools/gulp folder:

```
gulp loaders
```
