# Architecture: CPU ↔ GPU Particle System Feature Parity

## Executive Summary

This document describes the architectural changes needed to bring `GPUParticleSystem` to feature parity with `ParticleSystem` (CPU). The work is additive — no existing code is replaced, only extended.

### Before / After

| Aspect | Before | After |
|--------|--------|-------|
| Missing GPU gradients | 6 types silently no-op | All 12 gradient types functional |
| Attractors | CPU-only | Both CPU and GPU |
| Mesh Emitter | CPU-only | Both (WebGPU required, WebGL2 preferred) |
| Billboard Stretched Local | CPU-only | Both CPU and GPU |
| Silent no-ops | 12 methods silently do nothing | Warnings for CPU-only; functional for ported features |
| CPU→GPU conversion | Manual property copying | `GPUParticleSystem.fromParticleSystem()` helper |
| Visual test coverage | 0 CPU-vs-GPU tests | ~38 baseline + per-feature Phase 2 tests |
| Queryable feature support | None | `isFeatureSupported()` API |

---

## Current Architecture Overview

### Class Hierarchy

```
IParticleSystem (interface)
    |
BaseParticleSystem (shared property storage)
    |
    +-- ThinParticleSystem --> ParticleSystem  (CPU, JS update loop)
    |
    +-- GPUParticleSystem  (GPU, shader-based update)
            |
            +-- uses --> IGPUParticleSystemPlatform
                            |
                            +-- ComputeShaderParticleSystem  (WebGPU)
                            +-- WebGL2ParticleSystem          (WebGL2)
```

### GPU Particle Update Pipeline

```
                    +-----------------+
                    |  GPUParticle    |
                    |  System         |
                    |  (TypeScript)   |
                    +--------+--------+
                             |
                    sets uniforms, textures
                             |
               +-------------+-------------+
               |                           |
     +---------v----------+    +-----------v---------+
     | WebGL2Particle     |    | ComputeShader       |
     | System             |    | ParticleSystem      |
     | (Transform         |    | (Compute dispatch)  |
     |  Feedback)         |    |                     |
     +--------+-----------+    +----------+----------+
              |                           |
     +--------v----------+    +-----------v----------+
     | gpuUpdateParticles |    | gpuUpdateParticles  |
     | .vertex.ts (GLSL)  |    | .compute.ts (WGSL)  |
     +--------+-----------+    +----------+----------+
              |                           |
              +----------+    +-----------+
                         |    |
                   +-----v----v------+
                   | Particle Buffer |
                   | (ping-pong)     |
                   |  buffer0 <--+   |
                   |  buffer1 <--+   |
                   +--------+--------+
                            |
                   read by render pass
                            |
               +------------+-------------+
               |                          |
     +---------v-----------+   +----------v-----------+
     | gpuRenderParticles  |   | particles.vertex/    |
     | .vertex/.fragment   |   | .fragment (WGSL)     |
     | (GLSL)              |   | (does NOT exist yet) |
     +---------------------+   +----------------------+
```

### Particle Buffer Layout (Per-Particle, Interleaved)

The particle buffer stride varies based on active features. Base layout:

```
Offset  Size  Field              Condition
------  ----  -----------------  ---------
0       3     position           always
3       1     age                always
4       3     size               always
7       1     life               always
8       4     seed               always
12      3     direction          always
15      1     dummy0             WebGPU alignment
16+     3     initialPosition    CUSTOMEMITTER only
        1     dummy1             WebGPU alignment
        4     color              !COLORGRADIENTS only
        3     initialDirection   !BILLBOARD only
        1     dummy2             WebGPU alignment
        3     noiseCoordinates1  NOISE only
        1     dummy3             WebGPU alignment
        3     noiseCoordinates2  NOISE only
        1     dummy4             WebGPU alignment
        1-2   angle              1 if ANGULARSPEEDGRADIENTS, else 2
        1     cellIndex          ANIMATESHEET only
        1     cellStartOffset    ANIMATESHEETRANDOMSTART only
```

Stride is computed dynamically in `_initialize()` and rounded to 4-float alignment on WebGPU.

### Existing Gradient Texture System

All 6 currently supported gradients are baked into 256×1 `RawTexture` objects:

```
Gradient Data (JS array)
    |
    v
GradientHelper.GetCurrentGradient()
    |  interpolates at 256 evenly-spaced positions
    v
RawTexture (256x1)
    |
    |  Color: RGBA 8-bit (CreateRGBATexture)
    |  Others: R 32-bit float (CreateRTexture)
    |
    v
Bound to update shader as sampler
    |
    v
Sampled at ageGradient = currentAge / totalLife
```

### Shader Recompilation

Shader defines change the buffer layout and shader code. `_recreateUpdateEffect()` caches the current defines string and only recompiles when it changes:

```
_recreateUpdateEffect()
    |
    +-- build defines string from current state
    |     (COLORGRADIENTS, SIZEGRADIENTS, NOISE, etc.)
    |
    +-- compare with _cachedUpdateDefines
    |     |
    |     +-- same? --> return (no recompile)
    |     |
    |     +-- different? --> _platform.createUpdateBuffer(defines)
    |                         |
    |                         +-- recompile shader
    |                         +-- rebuild uniform bindings
    |
    +-- update _cachedUpdateDefines
```

This same mechanism will be used for all new features — each new feature adds a new `#define`, and the cache detects the change.

---

## Key Architectural Changes

### Change 1: Attractor Uniforms in Update Shader (REQ-PHYS-1, REQ-PHYS-2)

**Approach: Fixed-size uniform array**

Attractors are passed as a fixed-size uniform array (8 entries) to the update shader. Each attractor is 4 floats (position xyz + strength). An additional uniform `attractorCount` tells the shader how many are active.

```
GPUParticleSystem
    |
    +-- _attractors: Attractor[]  (new field, max 8)
    |
    +-- animate() / _update()
    |     |
    |     +-- set uniform "attractorCount" = _attractors.length
    |     +-- set uniform "attractorPositions[i]" = position
    |     +-- set uniform "attractorStrengths[i]" = strength
    |
    v
Update Shader (#ifdef ATTRACTORS)
    |
    for each attractor (0..attractorCount):
        toAttractor = attractorPos - particlePos
        distSq = dot(toAttractor, toAttractor) + 1.0
        force = (strength / distSq) * normalize(toAttractor)
        direction += force * timeDelta
```

**Why fixed-size array over buffer:** Uniform arrays are simpler, work identically on WebGL2 and WebGPU, and 8 attractors × 4 floats = 32 floats is well within uniform limits. A storage buffer would add complexity for negligible benefit at this scale.

**Alternative considered:** Storage buffer for unlimited attractors. Rejected because it would require different code paths for WebGL2 (which lacks storage buffers in the vertex shader) vs WebGPU. The 8-attractor limit is practical — CPU users rarely use more than a handful.

### Change 2: System-Age Gradient Infrastructure (REQ-GRAD-1, REQ-GRAD-2, REQ-GRAD-3)

**Approach: New uniform + CPU-side gradient sampling**

The three system-age gradients (emit rate, start size, life time) are fundamentally different from the 6 existing gradients:

```
EXISTING gradients:                NEW system-age gradients:
  sampled at particle age            sampled at system age
  in GPU shader                      on CPU each frame
  affect per-frame update            affect emission parameters
  per-particle interpolation         per-system-frame value
```

System-age gradients control **emission parameters** (how many particles to emit, what size, what lifetime), not per-particle update behavior. The CPU already computes emission counts — these gradients modulate those counts.

```
GPUParticleSystem._update()
    |
    +-- compute systemAgeRatio = _actualFrame / targetStopDuration
    |
    +-- Emit Rate:   sample _emitRateGradients at systemAgeRatio
    |                multiply emitRate by gradient factor
    |                (affects _accumulatedCount calculation)
    |
    +-- Start Size:  sample _startSizeGradients at systemAgeRatio
    |                pass as uniform "startSizeGradientFactor"
    |                (shader multiplies initial size at emission)
    |
    +-- Life Time:   sample _lifeTimeGradients at systemAgeRatio
    |                pass as uniform "lifeTimeGradientFactor"
    |                (shader multiplies life at emission)
    |
    v
Update Shader (emission phase only)
    |
    #ifdef STARTSIZEGRADIENTS
    outSize.x *= startSizeGradientFactor;
    #endif
    |
    #ifdef LIFETIMEGRADIENTS
    outLife *= lifeTimeGradientFactor;
    #endif
```

**Emit rate** does not need shader changes — it is applied purely on the CPU side (modulating `_accumulatedCount` before dispatch). Start size and life time require a single new uniform each.

**Why CPU-side sampling instead of GPU texture:** System-age gradients produce one value per frame for the entire system, not per-particle. Uploading a gradient texture and sampling it in the shader would work but is wasteful — a single uniform per feature is simpler and faster.

**Alternative considered:** Passing system age to the shader and sampling a gradient texture there. Rejected because emit rate is a CPU-side concept (controls how many particles to emit), and start size / life time are only read at particle birth (emission phase), making a per-frame uniform the natural fit.

### Change 3: Ramp Gradients in Render Shader (REQ-GRAD-5, REQ-GRAD-6, REQ-GRAD-7)

**Approach: Port CPU fragment shader logic to GPU render shaders**

Ramp gradients, color remap, and alpha remap operate entirely in the **render shader**, not the update shader. The CPU particle fragment shader (`particles.fragment.ts`) already implements this:

```
CPU render pipeline (particles.fragment.ts):
    particle alpha
        |
        v
    colorRemapIndex = clamp((alpha - remapMin) / remapRange, 0, 1)
        |
        v
    rampColor = texture(rampSampler, vec2(1.0 - colorRemapIndex, 0))
        |
        v
    baseColor.rgb *= rampColor.rgb
    baseColor.a = clamp((alpha * rampColor.a - alphaRemapMin) / alphaRemapRange, 0, 1)
```

For GPU particles, the same logic is added to `gpuRenderParticles.fragment.ts`:

```
GPUParticleSystem
    |
    +-- _rampGradientsTexture: RawTexture  (new, 256x1 RGBA)
    |     created from _rampGradients array, same as CPU
    |
    +-- color/alpha remap: computed per-particle on CPU? NO.
    |     GPU particles don't have per-particle CPU access.
    |     Remap values are passed as gradient textures.
    |
    +-- _colorRemapGradientsTexture: RawTexture (new, 256x1, R32F)
    |     stores min/range pairs sampled at ageGradient
    |
    +-- _alphaRemapGradientsTexture: RawTexture (new, 256x1, R32F)
    |
    v
gpuRenderParticles.fragment.ts (#ifdef RAMPGRADIENT)
    |
    +-- sample colorRemapTexture at ageGradient --> remapMin, remapRange
    +-- sample alphaRemapTexture at ageGradient --> alphaRemapMin, alphaRemapRange
    +-- sample rampTexture at remapped index --> rampColor
    +-- apply to baseColor
```

**Key difference from CPU:** CPU computes remap values per-particle on the JS side and passes them as vertex attributes (`remapData`). GPU particles cannot do this — instead, the remap gradients are baked into textures (same as other gradient textures) and sampled in the fragment shader using the particle's age ratio (passed from the vertex shader as a varying).

**New textures needed:**
- `_rampGradientsTexture` — RGBA 8-bit, 256×1 (same creation pattern as color gradient)
- `_colorRemapGradientsTexture` — RG 32-bit float, 256×1 (min in R, range in G)
- `_alphaRemapGradientsTexture` — RG 32-bit float, 256×1 (min in R, range in G)

**New shader defines:** `RAMPGRADIENT`, `COLORREMAP`, `ALPHAREMAP`

**New samplers in render shader:** `rampSampler`, `colorRemapSampler`, `alphaRemapSampler`

**New varying from vertex to fragment:** `vAgeGradient` (already computable from existing `age` and `life` attributes)

### Change 4: Billboard Stretched Local (REQ-RENDER-1, REQ-RENDER-2)

**Approach: Store initial direction in particle buffer, use in render shader**

```
Particle Buffer Layout Change:
    existing:  ... direction(3) ...
    new:       ... direction(3) ... initialDirection(3) ...
               (initialDirection present when !BILLBOARD, already exists)

BILLBOARDMODE_STRETCHED_LOCAL uses the same !BILLBOARD slot
as the existing non-billboard path — particles oriented along
their initial direction rather than current velocity.
```

The GPU particle buffer already stores `initialDirection` when `!BILLBOARD` is set. For `BILLBOARDMODE_STRETCHED_LOCAL`, the render shader needs to:
1. Read `initialDirection` instead of `direction` for the stretch axis
2. Apply the stretched billboard math using the initial emission direction

This requires a new define `BILLBOARDSTRETCHED_LOCAL` in the render shader that redirects the stretch vector source from `direction` (current velocity) to `initialDirection` (emission direction).

**Risk:** Changing buffer layout affects stride calculation. However, `initialDirection` is already conditionally present — the new mode reuses this existing slot, so no stride change is needed. The only change is the render shader reading it differently.

### Change 5: Mesh Emitter on GPU (REQ-EMIT-1, REQ-EMIT-2, REQ-EMIT-3)

**Approach: Upload vertex data to texture, sample in update shader**

The CPU mesh emitter selects a random triangle, generates barycentric coordinates, and interpolates position/normal. On GPU, this must happen in the shader.

```
CPU (one-time setup at init/rebuild):
    |
    +-- Read mesh positions[], normals[], indices[]
    |
    +-- Compute per-triangle areas
    |
    +-- Build cumulative area CDF as float texture
    |     (for weighted random triangle selection)
    |
    +-- Pack positions into float texture (3 vertices × 3 floats per triangle)
    |     Layout: texel[triIdx * 9 + vertIdx * 3 + component]
    |
    +-- Pack normals into float texture (same layout)
    |
    +-- Upload textures to GPU
    |
    v
GPUParticleSystem
    |
    +-- _meshPositionTexture: RawTexture (float, width = triCount * 9)
    +-- _meshNormalTexture: RawTexture   (float, width = triCount * 9)
    +-- _meshCDFTexture: RawTexture      (float, width = triCount)
    |
    v
Update Shader (#ifdef MESHEMITTER, emission phase):
    |
    +-- random float r in [0, 1]
    +-- binary search _meshCDFTexture to find triangle index
    +-- generate barycentric coords: u = rand, v = rand * (1-u), w = 1-u-v
    +-- sample 3 vertex positions from _meshPositionTexture
    +-- interpolate: pos = u*v0 + v*v1 + w*v2
    +-- if useMeshNormalsForDirection:
    |       sample 3 vertex normals, interpolate same way
    |       direction = interpolatedNormal * emitPower
    +-- else:
    |       direction = lerp(direction1, direction2, rand)
    |
    +-- transform by emitterWM if !LOCAL
```

**WebGPU:** Uses storage buffers (natural fit).
**WebGL2:** Uses float textures (`OES_texture_float`) with `texelFetch`. This is available on all WebGL2 contexts.

**Alternative considered:** Vertex buffer with instanced rendering for emission. Rejected — the transform feedback path doesn't support instanced input, and it would require a fundamentally different emission model.

**Alternative considered:** WebGPU-only. Kept as fallback if WebGL2 texture approach has precision issues, per REQ-EMIT-3.

### Change 6: Conversion Helper (REQ-CONV-1 through REQ-CONV-4)

**Approach: Static method on GPUParticleSystem**

```
GPUParticleSystem.fromParticleSystem(source, scene, options?)
    |
    +-- Create new GPUParticleSystem with source.getCapacity()
    |
    +-- Copy BaseParticleSystem properties
    |     (emitter, textures, colors, sizes, speeds, lifetimes,
    |      gravity, blend mode, billboard mode, animation sheet,
    |      noise, flow map, world offset, pivot, local space,
    |      lifecycle: emitRate, startDelay, targetStopDuration,
    |      disposeOnStop, preWarmCycles, preWarmStepOffset)
    |
    +-- Copy emitter type (clone)
    |
    +-- Copy all supported gradients
    |     (color, size, angular speed, velocity, limit velocity,
    |      drag, + newly added: emit rate, start size, life time,
    |      ramp, color remap, alpha remap)
    |
    +-- Copy attractors (if GPU supports them)
    |
    +-- Warn and skip:
    |     - subEmitters
    |     - updateFunction (if custom)
    |     - recycleParticle (if custom)
    |     - startDirectionFunction (if custom)
    |     - startPositionFunction (if custom)
    |
    +-- Return independent GPUParticleSystem
```

**Implementation location:** `packages/dev/core/src/Particles/gpuParticleSystem.ts` as a static method. Not a separate file — it's a factory method on the class itself.

### Change 7: Feature Flags and Warnings (REQ-FLAG-1, REQ-FLAG-2, REQ-FLAG-3)

**Approach: Replace no-ops with Logger.Warn calls + static feature query**

```
BEFORE (current no-op):
    addEmitRateGradient(): IParticleSystem {
        // Do nothing as emit rate is not supported by GPUParticleSystem
        return this;
    }

AFTER (for features that remain unsupported):
    addEmitRateGradient(): IParticleSystem {
        Logger.Warn("GPUParticleSystem: addEmitRateGradient is not supported.");
        return this;
    }

AFTER (for implemented features):
    addEmitRateGradient(gradient, factor, factor2?): IParticleSystem {
        // actual implementation
    }
```

**Queryable support:**

```
GPUParticleSystem.isFeatureSupported(feature: string): boolean

Usage:
    GPUParticleSystem.isFeatureSupported("emitRateGradients")  // true after PR 2
    GPUParticleSystem.isFeatureSupported("subEmitters")         // false (CPU-only)
```

Implemented as a static `Set<string>` of supported feature names, updated as features are added. Simple, no runtime cost, easy to maintain.

---

## Component Deep Dives

### Shader File Modification Map

Each feature touches specific shader files. Both GLSL and WGSL versions must be updated in parallel.

```
Feature              Update Shaders                    Render Shaders
                     GLSL          WGSL                GLSL            WGSL
-----------          ----          ----                ----            ----
Attractors           YES           YES                 -               -
Emit Rate Grad.      -             -                   -               -  (CPU-side)
Start Size Grad.     YES           YES                 -               -
Life Time Grad.      YES           YES                 -               -
Ramp Gradients       -             -                   YES             (1)
Color Remap          -             -                   YES             (1)
Alpha Remap          -             -                   YES             (1)
Billboard StrLocal   -             -                   YES             (1)
Mesh Emitter         YES           YES                 -               -

(1) WGSL render shaders for GPU particles do not currently exist.
    The WebGPU path reuses the GLSL render shaders via SPIR-V or
    translation. Verify whether new render defines require WGSL
    render shader creation.
```

### Gradient Texture Creation Pattern

All new gradient textures follow the existing pattern in `gpuParticleSystem.ts`:

```
1. User calls addXGradient()
   --> stores in BaseParticleSystem._xGradients array
   --> sets _xGradientsTexture = null (forces recreation)

2. _recreateUpdateEffect() is called (next frame)
   --> calls _createXGradientTexture()
   --> if _xGradients exists and _xGradientsTexture is null:
       --> allocate Float32Array(256) or Uint8Array(256*4)
       --> iterate gradient stops, interpolate at 256 positions
       --> create RawTexture (256x1)
   --> add #define XGRADIENTS to shader defines
   --> shader recompiles (defines changed)

3. _update() binds the texture to the shader sampler

4. User calls removeXGradient()
   --> removes from array
   --> if array empty: dispose texture, set null
   --> next _recreateUpdateEffect(): #define removed
   --> shader recompiles back to non-gradient path
```

For **ramp gradients** (render-side), the same pattern applies but the texture is bound during `_render()` instead of `_update()`, and the define goes into the render effect rather than the update effect.

### Serialization Extension Pattern

Each new feature follows the existing serialization pattern:

```
serialize():
    // After existing ParticleSystem._Serialize() call:
    if (this._attractors && this._attractors.length) {
        serializationObject.attractors = [];
        for (const attractor of this._attractors) {
            serializationObject.attractors.push(attractor.serialize());
        }
    }

Parse():
    // After existing ParticleSystem._Parse() call:
    if (parsedData.attractors) {
        for (const attractor of parsedData.attractors) {
            const a = new Attractor();
            a.position = Vector3.FromArray(attractor.position);
            a.strength = attractor.strength;
            particleSystem.addAttractor(a);
        }
    }
```

This matches the existing CPU serialization format (REQ-SER-3), ensuring `ParticleSystemSet.Parse()` can load the same JSON as either CPU or GPU.

---

## Data Model Changes

### New Fields on GPUParticleSystem

| Field | Type | Default | Purpose | Requirement |
|-------|------|---------|---------|-------------|
| `_attractors` | `Attractor[]` | `[]` | Attractor force fields | REQ-PHYS-1 |
| `_rampGradientsTexture` | `Nullable<RawTexture>` | `null` | Ramp color lookup | REQ-GRAD-5 |
| `_colorRemapGradientsTexture` | `Nullable<RawTexture>` | `null` | Color remap min/range | REQ-GRAD-6 |
| `_alphaRemapGradientsTexture` | `Nullable<RawTexture>` | `null` | Alpha remap min/range | REQ-GRAD-7 |
| `_meshPositionTexture` | `Nullable<RawTexture>` | `null` | Mesh vertex positions | REQ-EMIT-1 |
| `_meshNormalTexture` | `Nullable<RawTexture>` | `null` | Mesh vertex normals | REQ-EMIT-1 |
| `_meshCDFTexture` | `Nullable<RawTexture>` | `null` | Triangle area CDF | REQ-EMIT-1 |
| `_startSizeGradientFactor` | `number` | `1.0` | CPU-sampled start size factor | REQ-GRAD-2 |
| `_lifeTimeGradientFactor` | `number` | `1.0` | CPU-sampled lifetime factor | REQ-GRAD-3 |

### New Shader Defines

| Define | Shader | Purpose | Requirement |
|--------|--------|---------|-------------|
| `ATTRACTORS` | Update | Enable attractor force loop | REQ-PHYS-1 |
| `STARTSIZEGRADIENTS` | Update | Multiply initial size by factor | REQ-GRAD-2 |
| `LIFETIMEGRADIENTS` | Update | Multiply lifetime by factor | REQ-GRAD-3 |
| `RAMPGRADIENT` | Render | Enable ramp color lookup | REQ-GRAD-5 |
| `COLORREMAP` | Render | Enable color remap | REQ-GRAD-6 |
| `ALPHAREMAP` | Render | Enable alpha remap | REQ-GRAD-7 |
| `BILLBOARDSTRETCHED_LOCAL` | Render | Stretch along initial direction | REQ-RENDER-1 |
| `MESHEMITTER` | Update | Sample mesh vertex data | REQ-EMIT-1 |

### New Shader Uniforms

| Uniform | Type | Shader | Purpose |
|---------|------|--------|---------|
| `attractorCount` | `int` | Update | Number of active attractors |
| `attractorPositions[8]` | `vec3[8]` | Update | Attractor world positions |
| `attractorStrengths[8]` | `float[8]` | Update | Attractor force strengths |
| `startSizeGradientFactor` | `float` | Update | CPU-sampled start size factor |
| `lifeTimeGradientFactor` | `float` | Update | CPU-sampled lifetime factor |

### New Shader Samplers

| Sampler | Shader | Format | Purpose |
|---------|--------|--------|---------|
| `rampSampler` | Render | RGBA 8-bit 256×1 | Ramp color lookup |
| `colorRemapSampler` | Render | RG 32F 256×1 | Color remap min/range |
| `alphaRemapSampler` | Render | RG 32F 256×1 | Alpha remap min/range |
| `meshPositionSampler` | Update | R 32F variable | Mesh vertex positions |
| `meshNormalSampler` | Update | R 32F variable | Mesh vertex normals |
| `meshCDFSampler` | Update | R 32F variable | Triangle area CDF |

---

## Migration Strategy

No migration is needed. All changes are additive:

- Existing `GPUParticleSystem` users are unaffected — no API changes, no behavior changes (REQ-COMPAT-1, REQ-COMPAT-2)
- New features are opt-in via API calls (e.g., `addAttractor()`, `addRampGradient()`)
- Serialized data from older versions parses without error — missing new fields default to their inactive state (REQ-SER-2)
- Feature flags (PR 11) change no-ops to warnings, but this is the final PR and is explicitly a behavior change for diagnostic purposes

---

## Files to Modify / Create

### Modified Files

| File | Changes | PRs |
|------|---------|-----|
| `packages/dev/core/src/Particles/gpuParticleSystem.ts` | Add attractor storage, new gradient methods, mesh emitter textures, fromParticleSystem(), feature flags, serialize/parse extensions | 1-11 |
| `packages/dev/core/src/Shaders/gpuUpdateParticles.vertex.ts` | Attractor force loop, start size/lifetime uniforms, mesh emitter sampling | 1,3,4,9 |
| `packages/dev/core/src/ShadersWGSL/gpuUpdateParticles.compute.ts` | Same changes as GLSL update shader | 1,3,4,9 |
| `packages/dev/core/src/Shaders/gpuRenderParticles.vertex.ts` | Pass age ratio varying, billboard stretched local | 5,8 |
| `packages/dev/core/src/Shaders/gpuRenderParticles.fragment.ts` | Ramp gradient, color/alpha remap | 5,6,7 |
| `packages/dev/core/src/Particles/computeShaderParticleSystem.ts` | New uniform bindings, new texture bindings | 1,3,4,5,9 |
| `packages/dev/core/src/Particles/webgl2ParticleSystem.ts` | New transform feedback varyings (if buffer layout changes), new uniform bindings | 1,3,4,5,8,9 |
| `packages/dev/core/src/Particles/IParticleSystem.ts` | Add `isFeatureSupported()` to interface (optional method) | 11 |
| `packages/tools/tests/test/visualization/config.json` | ~38 Phase 1 entries + Phase 2 entries | All |

### New Files

| File | Purpose | PR |
|------|---------|-----|
| `packages/tools/tests/test/visualization/ReferenceImages/gpu-particles-*.png` | Reference images for all new visual tests | All |

### Playground Snippets (Not Committed Files)

Each visual test is a Playground snippet saved via the snippet server. The snippet IDs are recorded in `config.json`. No local script files are created.

---

## Testing Strategy Overview

### Phase 1: Baseline Regression Tests (REQ-TEST-1 through REQ-TEST-5)

~38 Playground snippets, each rendering CPU (left) + GPU (right) with identical parameters. Saved as snippet IDs in `config.json` with `renderCount: 120` and `excludedEngines: ["webgl1"]`. Reference images generated on both WebGL2 and WebGPU Playwright projects.

These tests protect against regressions during Phase 2 development.

### Phase 2: Feature Tests (REQ-TEST-6)

Each PR adds 1-3 visual tests for the new feature. These follow the same side-by-side pattern. Interaction tests are added where features combine (e.g., ramp gradient + multiply blend).

### Unit Tests

New public API methods (`addAttractor`, `removeAttractor`, `fromParticleSystem`, `isFeatureSupported`) should have vitest unit tests covering:
- Add/remove round-trip
- Serialization/deserialization round-trip
- `fromParticleSystem` property completeness
- `fromParticleSystem` warning on unsupported features
- Attractor limit enforcement (>8 triggers warning)
- `targetStopDuration` validation for system-age gradients

### Regression Verification (REQ-TEST-7)

Every PR runs the full visualization test suite. All Phase 1 and previously merged Phase 2 tests must pass before merge.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Shader recompilation cost when adding/removing gradients dynamically (REQ-GRAD-8) | Frame stutter when defines change | Shader compilation is already async; same risk exists for all current gradient operations |
| WebGL2 float texture precision for mesh emitter CDF | Incorrect triangle sampling distribution | Use `OES_texture_float` with `texelFetch` for exact values; fall back to WebGPU-only if precision issues arise (REQ-EMIT-3) |
| WGSL render shaders may not exist for GPU particles | Ramp/remap/billboard changes may not reach WebGPU render path | Verify early in PR 5 whether WebGPU uses GLSL→SPIR-V translation or needs native WGSL render shaders |
| Buffer stride changes for billboard stretched local | Could affect existing non-billboard GPU particle systems | `initialDirection` slot already exists in `!BILLBOARD` mode; stretched local reuses this slot rather than adding new data |
| Attractor uniform array size on mobile GPUs | Some mobile GPUs have tight uniform limits | 8 attractors × 4 floats = 32 floats is well within GL_MAX_VERTEX_UNIFORM_VECTORS (≥256 on WebGL2) |
