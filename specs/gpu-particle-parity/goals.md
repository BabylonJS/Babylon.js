# Goals: CPU ↔ GPU Particle System Feature Parity

## Background

Babylon.js provides two particle system implementations:

- **CPU Particle System** (`ParticleSystem` → `ThinParticleSystem` → `BaseParticleSystem`): Updates each particle individually on the CPU every frame. Highly flexible, supports custom update functions, sub-emitters, attractors, and all gradient types. Practical limit ~50,000 particles.

- **GPU Particle System** (`GPUParticleSystem` → `BaseParticleSystem`): Updates particles entirely on the GPU via WebGL2 transform feedback or WebGPU compute shaders. Can handle hundreds of thousands of particles but lacks several CPU features because they were never ported to the shader pipeline.

Both systems implement `IParticleSystem` and share `BaseParticleSystem` for common property storage. The GPU system silently no-ops many interface methods it does not support, which can cause confusion when users switch between the two.

## Goals

### 1. Baseline Visual Test Coverage (CPU vs GPU)

For every feature that is **already supported by both** CPU and GPU particle systems, create a side-by-side visualization test that renders the CPU system on the left and the GPU system on the right, using the same parameters.

**Important:** CPU and GPU particle systems will **not** produce pixel-identical output — they use different random number sources (CPU uses JS `Math.random`; GPU uses a prebuilt random texture). The left and right sides should look "similar-ish" (same general shape, color, density), not identical. The pixel-perfect comparison is between **test runs** (current screenshot vs reference image), not between the left and right halves. The primary purpose of these tests is to **prevent regressions** — ensuring that adding new GPU features does not break existing GPU behavior.

These tests follow the same pattern as the existing CPU vs NPE comparison tests (e.g., `#0K3AQ2` series), but replace the NPE conversion step with an explicit `GPUParticleSystem` configured with matching properties.

### 2. Implement Missing GPU Features (One PR Per Feature)

Bring the GPU particle system to full feature parity with the CPU particle system wherever technically feasible. Each new feature should:
- Be implemented in its own branch and submitted as a small, focused PR
- Include one or more visual tests that exercise the new feature (CPU left, GPU right)
- Pass all existing CPU-vs-GPU visual tests from Phase 1 (no regressions)
- Clearly document any features that remain CPU-only by design

### 3. `GPUParticleSystem.fromParticleSystem()` Conversion Helper

Introduce a utility method that creates a `GPUParticleSystem` from an existing CPU `ParticleSystem`, copying all shared properties automatically. This is analogous to `ConvertToNodeParticleSystemSetAsync` for NPE. It will reduce boilerplate in tests and provide a useful public API for users migrating between systems.

### 4. GPU Feature Flags and Warnings

Replace the current silent no-op behavior for unsupported GPU methods with a system that logs warnings and exposes queryable feature support. When a user calls `gpu.addEmitRateGradient()` (before it's implemented), they should get a console warning rather than silent failure. This will be done at the end of Phase 2 after all feasible features have been implemented, so the warning list reflects the final state.

### Non-Goals

- **WebGL 1 support for GPU particles**: Out of scope. GPU particles require WebGL 2+. Attempting to create a `GPUParticleSystem` on a WebGL 1 context should fail with a clear log message.
- **NPE ↔ GPU conversion**: Supporting GPU particle systems in the Node Particle Editor (NPE) is future work. CPU-to-GPU parity must be achieved first before NPE-to-GPU conversion can be considered.
- **Custom JS callbacks on GPU**: `updateFunction`, `recycleParticle`, `startDirectionFunction`, and `startPositionFunction` are inherently CPU-side and will remain CPU-only.

---

## Feature Comparison Table

### Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully supported |
| ⚠️ | Partially supported or has limitations |
| ❌ | Not supported (no-op or missing) |

---

### Emission & Emitter Types

| Feature | CPU | GPU | Notes |
|---------|-----|-----|-------|
| Point Emitter | ✅ | ✅ | |
| Box Emitter | ✅ | ✅ | |
| Sphere Emitter | ✅ | ✅ | |
| Directed Sphere Emitter | ✅ | ✅ | |
| Hemisphere Emitter | ✅ | ✅ | |
| Cone Emitter | ✅ | ✅ | |
| Directed Cone Emitter | ✅ | ✅ | |
| Cylinder Emitter | ✅ | ✅ | |
| Directed Cylinder Emitter | ✅ | ✅ | |
| Custom Emitter | ✅ | ✅ | GPU supports position-only custom emitter via shader uniforms |
| **Mesh Emitter** | ✅ | ❌ | Requires sampling mesh vertices; hard to do on GPU |
| Custom `startDirectionFunction` | ✅ | ❌ | CPU allows arbitrary JS callback per particle |
| Custom `startPositionFunction` | ✅ | ❌ | CPU allows arbitrary JS callback per particle |

### Gradients (Property Over Lifetime)

| Feature | CPU | GPU | Notes |
|---------|-----|-----|-------|
| Color Gradients | ✅ | ✅ | GPU uses texture-sampled gradients |
| Size Gradients | ✅ | ✅ | |
| Angular Speed Gradients | ✅ | ✅ | |
| Velocity Gradients | ✅ | ✅ | |
| Limit Velocity Gradients | ✅ | ✅ | |
| Drag Gradients | ✅ | ✅ | |
| **Emit Rate Gradients** | ✅ | ❌ | GPU silently no-ops `addEmitRateGradient()` |
| **Start Size Gradients** | ✅ | ❌ | GPU silently no-ops `addStartSizeGradient()` |
| **Life Time Gradients** | ✅ | ❌ | GPU silently no-ops `addLifeTimeGradient()` |
| **Ramp Gradients** | ✅ | ❌ | GPU silently no-ops; `useRampGradients` always returns `false` |
| **Color Remap Gradients** | ✅ | ❌ | GPU silently no-ops `addColorRemapGradient()` |
| **Alpha Remap Gradients** | ✅ | ❌ | GPU silently no-ops `addAlphaRemapGradient()` |
| Gradient factor range (factor1–factor2 randomization) | ✅ | ⚠️ | GPU bakes gradients into 1D textures; verify per-particle randomization between factor1 and factor2 actually works |

### Rendering & Visual

| Feature | CPU | GPU | Notes |
|---------|-----|-----|-------|
| Billboard Mode: ALL | ✅ | ✅ | |
| Billboard Mode: Y | ✅ | ✅ | |
| Billboard Mode: Stretched | ✅ | ✅ | |
| **Billboard Mode: Stretched Local** | ✅ | ❌ | GPU shaders do not implement this mode |
| Sprite Sheet / Animation Sheet | ✅ | ✅ | |
| Sprite Random Start Cell | ✅ | ✅ | |
| Blend Mode: OneOne (Additive) | ✅ | ✅ | |
| Blend Mode: Standard (Alpha) | ✅ | ✅ | |
| Blend Mode: Add | ✅ | ✅ | |
| Blend Mode: Multiply | ✅ | ✅ | |
| Blend Mode: MultiplyAdd | ✅ | ✅ | |
| Blend Mode: Subtract | ✅ | ✅ | |
| Custom Render Effect | ✅ | ✅ | Both support `setCustomEffect()` |
| Image Processing | ✅ | ✅ | |
| Clipping Planes | ✅ | ✅ | |
| Logarithmic Depth | ✅ | ✅ | |
| Force Depth Write | ✅ | ✅ | |
| Local Space Mode | ✅ | ✅ | `isLocal` property |
| World Offset | ✅ | ✅ | Both support `worldOffset` |
| Translation Pivot | ✅ | ✅ | |

### Physics & Forces

| Feature | CPU | GPU | Notes |
|---------|-----|-----|-------|
| Gravity | ✅ | ✅ | |
| Noise Texture | ✅ | ✅ | |
| Flow Map | ✅ | ✅ | Both CPU and GPU support flow maps with strength |
| **Attractors** | ✅ | ❌ | CPU-only; point-based force fields with inverse-square falloff |
| Limit Velocity Damping | ✅ | ✅ | |

### Sub-Emitters

| Feature | CPU | GPU | Notes |
|---------|-----|-----|-------|
| **Sub-emitters (Attached)** | ✅ | ❌ | Particles that follow parent particle lifetime |
| **Sub-emitters (End)** | ✅ | ❌ | Particles spawned when parent dies |
| **Sub-emitter velocity inheritance** | ✅ | ❌ | Inherit direction/speed from parent particle |
| **Sub-emitter direction inheritance** | ✅ | ❌ | Inherit direction from parent particle |

### Lifecycle & Control

| Feature | CPU | GPU | Notes |
|---------|-----|-----|-------|
| Start / Stop / Reset | ✅ | ✅ | |
| Start Delay | ✅ | ✅ | |
| Dispose On Stop | ✅ | ✅ | |
| Target Stop Duration | ✅ | ✅ | |
| Pre-warm Cycles | ✅ | ✅ | |
| Manual Emit Count | ✅ | ✅ | |
| Prevent Auto Start | ✅ | ✅ | GPU-specific property, but CPU supports via `start(delay)` |
| **Emit Rate Control** | ⚠️ | ✅ | GPU has `emitRateControl` for circular buffer recycling; CPU naturally limits via capacity |
| Update In Animate | ✅ | ✅ | CPU defaults to `true`, GPU defaults to `false` |
| `onStartedObservable` | ✅ | ✅ | |
| `onStoppedObservable` | ✅ | ✅ | |
| `onDisposeObservable` | ✅ | ✅ | |

### Customization & Extensibility

| Feature | CPU | GPU | Notes |
|---------|-----|-----|-------|
| **Custom Update Function** | ✅ | ❌ | CPU allows replacing `updateFunction` with arbitrary JS |
| **Custom Recycle Function** | ✅ | ❌ | CPU allows replacing `recycleParticle` callback |
| Custom Shader (render) | ✅ | ✅ | Both support `customShader` / `setCustomEffect` |
| Per-particle access | ✅ | ❌ | CPU exposes `Particle` objects; GPU data stays on GPU |

### Serialization

| Feature | CPU | GPU | Notes |
|---------|-----|-----|-------|
| Serialize / Parse | ✅ | ✅ | Both share `ParticleSystem._Serialize` / `_Parse` for common fields |
| Clone | ✅ | ✅ | |
| Snippet Server Support | ✅ | ✅ | Via `ParticleHelper.ParseFromSnippetAsync` |
| ParticleSystemSet (multi-system) | ✅ | ✅ | Can switch CPU ↔ GPU at load time via `gpu` flag |
| Sub-emitter serialization | ✅ | ❌ | Only CPU has sub-emitters |
| Attractor serialization | ✅ | ❌ | Only CPU has attractors |

### Performance & Architecture

| Feature | CPU | GPU | Notes |
|---------|-----|-----|-------|
| Practical particle count | ~50K | 500K+ | GPU vastly outperforms CPU at high counts |
| WebGL 2 support | ✅ | ✅ | GPU uses transform feedback |
| WebGPU support | ✅ | ✅ | GPU uses compute shaders |
| WebGL 1 support | ✅ | ❌ | GPU requires WebGL 2+; should fail with a clear log message on WebGL 1 |
| Active particle count control | Via capacity | ✅ | GPU has `activeParticleCount` to limit without reallocation |
| Random texture size control | N/A | ✅ | GPU-specific `randomTextureSize` option |

---

## Summary of Parity Gaps

### Features missing from GPU (CPU-only)

These are features fully implemented in the CPU particle system that the GPU system does not support. They are the primary targets for parity work.

#### High Priority — Gradient Types

1. **Emit Rate Gradients** — Vary emission rate over system lifetime (`targetStopDuration`-dependent)
2. **Start Size Gradients** — Vary initial particle size over system lifetime (`targetStopDuration`-dependent)
3. **Life Time Gradients** — Vary per-particle lifetime over system lifetime (`targetStopDuration`-dependent)
4. **Ramp Gradients** — Color remapping via a secondary gradient texture
5. **Color Remap Gradients** — Remap color channels over particle lifetime
6. **Alpha Remap Gradients** — Remap alpha channel over particle lifetime

#### High Priority — Emitter Types

7. **Mesh Emitter** — Emit from mesh surface vertices with optional normal-based direction

#### Medium Priority — Physics & Forces

8. **Attractors** — Point-based force fields with configurable strength and falloff

#### Medium Priority — Sub-Emitter System

9. **Sub-emitters (Attached type)** — Child particle systems that follow parent particles
10. **Sub-emitters (End type)** — Child particle systems spawned on parent particle death
11. **Sub-emitter velocity/direction inheritance** — Transfer momentum from parent to child

#### Lower Priority — Rendering

12. **Billboard Mode: Stretched Local** — Orient particles along their initial emission direction

#### By Design CPU-Only

These features are inherently CPU-side and are **not candidates** for GPU parity:

- **Custom `updateFunction`** — Arbitrary JavaScript per-particle update logic (cannot run on GPU)
- **Custom `recycleParticle`** — Arbitrary JavaScript per-particle recycle logic
- **Custom `startDirectionFunction` / `startPositionFunction`** — Arbitrary JS callbacks for emission
- **Per-particle object access** — GPU particle data lives in GPU buffers and is not individually accessible from JS

---

## Phase 1: Baseline Visual Tests (CPU vs GPU)

For each feature already shared between CPU and GPU, create a Playground snippet and config entry. Each test renders:
- **Left**: CPU `ParticleSystem` at position `(0, 0.5, 0)`
- **Right**: `GPUParticleSystem` with identical parameters at position `(5, 0.5, 0)`
- **Camera**: `ArcRotateCamera` targeting midpoint, showing both side-by-side
- **Ground**: `GridMaterial` for spatial reference
- **renderCount**: 120 (sufficient for particle stabilization)

The pixel-perfect comparison is always between **the current test run's screenshot and the stored reference image**. The CPU (left) and GPU (right) halves will differ due to randomness — that is expected. If a code change causes the GPU half to change appearance, the test will catch it as a regression against the reference.

All Phase 1 tests must run on both WebGL2 and WebGPU Playwright projects to ensure both GPU backend paths (transform feedback and compute shader) are covered.

### Test Pattern

```javascript
const createScene = async function () {
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera("cam", -Math.PI / 2, Math.PI / 2.2, 10,
        new BABYLON.Vector3(2.5, 0, 0), scene);
    camera.attachControl(canvas, true);
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 25, height: 25 });
    ground.material = new BABYLON.GridMaterial("groundMat");
    ground.material.backFaceCulling = false;

    // CPU Particle System (LEFT)
    const cpu = new BABYLON.ParticleSystem("cpu", 2000, scene);
    cpu.particleTexture = new BABYLON.Texture("textures/flare.png");
    cpu.emitter = new BABYLON.Vector3(0, 0.5, 0);
    // ... feature-specific properties ...
    cpu.start();

    // GPU Particle System (RIGHT)
    const gpu = new BABYLON.GPUParticleSystem("gpu", { capacity: 2000 }, scene);
    gpu.particleTexture = new BABYLON.Texture("textures/flare.png");
    gpu.emitter = new BABYLON.Vector3(5, 0.5, 0);
    // ... same feature-specific properties ...
    gpu.start();

    return scene;
};
```

### Phase 1 Test List

#### Basic Properties
| Test Title | Feature Tested |
|------------|----------------|
| GPU Particles - Basic Properties - Size | `minSize`, `maxSize` |
| GPU Particles - Basic Properties - Scale | `minScaleX/Y`, `maxScaleX/Y` |
| GPU Particles - Basic Properties - Color | `color1`, `color2`, `colorDead` |
| GPU Particles - Basic Properties - Speed | `minEmitPower`, `maxEmitPower` |
| GPU Particles - Basic Properties - Angular Speed | `minAngularSpeed`, `maxAngularSpeed` |
| GPU Particles - Basic Properties - Rotation | `minInitialRotation`, `maxInitialRotation` |
| GPU Particles - Basic Properties - Translation Pivot | `translationPivot` |
| GPU Particles - Basic Properties - Direction | Direction vectors |
| GPU Particles - Basic Properties - Gravity | `gravity` |
| GPU Particles - Basic Properties - Emit Rate | `emitRate` (slow and fast) |
| GPU Particles - Basic Properties - Lifetime | `minLifeTime`, `maxLifeTime` |
| GPU Particles - Basic Properties - Pre-warm | `preWarmCycles`, `preWarmStepOffset` |
| GPU Particles - Basic Properties - Target Stop Duration | `targetStopDuration` without gradients |

#### Gradients (Over Lifetime)
| Test Title | Feature Tested |
|------------|----------------|
| GPU Particles - Change - Size | `addSizeGradient()` |
| GPU Particles - Change - Color | `addColorGradient()` |
| GPU Particles - Change - Speed | `addVelocityGradient()` |
| GPU Particles - Change - Speed Limit | `addLimitVelocityGradient()` |
| GPU Particles - Change - Angular Speed | `addAngularSpeedGradient()` |
| GPU Particles - Change - Drag | `addDragGradient()` |
| GPU Particles - Change - Size Range | `addSizeGradient()` with factor1 ≠ factor2 to verify per-particle randomization |
| GPU Particles - Change - Color Range | `addColorGradient()` with color1 ≠ color2 to verify per-particle randomization |

#### Emitter Types
| Test Title | Feature Tested |
|------------|----------------|
| GPU Particles - Emitters - Point | `createPointEmitter()` |
| GPU Particles - Emitters - Box | `createBoxEmitter()` |
| GPU Particles - Emitters - Sphere | `createSphereEmitter()` |
| GPU Particles - Emitters - Directed Sphere | `createDirectedSphereEmitter()` |
| GPU Particles - Emitters - Hemisphere | `createHemisphericEmitter()` |
| GPU Particles - Emitters - Cylinder | `createCylinderEmitter()` |
| GPU Particles - Emitters - Directed Cylinder | `createDirectedCylinderEmitter()` |
| GPU Particles - Emitters - Cone | `createConeEmitter()` |
| GPU Particles - Emitters - Directed Cone | `createDirectedConeEmitter()` |
| GPU Particles - Emitters - Custom | `CustomParticleEmitter` |

#### Rendering & Effects
| Test Title | Feature Tested |
|------------|----------------|
| GPU Particles - Billboard Y | `billboardMode = BILLBOARDMODE_Y` |
| GPU Particles - Billboard Stretched | `billboardMode = BILLBOARDMODE_STRETCHED` |
| GPU Particles - Multiply Blend | `blendMode = BLENDMODE_MULTIPLY` |
| GPU Particles - Animations | `isAnimationSheetEnabled`, sprite sheet |
| GPU Particles - Noise | `noiseTexture`, `noiseStrength` |
| GPU Particles - Flowmaps | `flowMap`, `flowMapStrength` |
| GPU Particles - Local Space | `isLocal = true` |

---

## Phase 2: Feature Implementation (One PR Each)

Each PR implements one missing feature in `GPUParticleSystem`, adds corresponding visual test(s), and ensures all Phase 1 tests still pass. Features may require more than one visual test if they interact with other features.

**Dual-shader requirement:** Every Phase 2 feature that changes the particle update logic must be implemented in **both** `gpuUpdateParticles.vertex.ts` (WebGL2 transform feedback) **and** `gpuUpdateParticles.compute.ts` (WebGPU compute shader). Visual tests must run on both WebGL2 and WebGPU projects.

### PR 1: Attractors
- Implement `addAttractor()` / `removeAttractor()` in GPU system
- Pass attractor data as uniforms (or small buffer) to update shader
- Apply inverse-square force calculation in both compute and transform feedback shaders
- Visual tests: `GPU Particles - Attractors`, `GPU Particles - Attractors Multiple`
- **Dependencies:** None (simplest shader change, builds confidence)

### PR 2: Emit Rate Gradients
- Implement `addEmitRateGradient()` / `removeEmitRateGradient()` in GPU system
- **Introduces shared system-age-ratio infrastructure** — pass system age as a uniform to the update shader, sample `targetStopDuration`-dependent gradient textures at emission time
- Visual tests: `GPU Particles - Change - Emit Rate`, `GPU Particles - Change - Emit Rate 2`
- **Dependencies:** None

### PR 3: Start Size Gradients
- Implement `addStartSizeGradient()` / `removeStartSizeGradient()` in GPU system
- Reuses system-age-ratio infrastructure from PR 2
- Visual test: `GPU Particles - Change - Start Size`
- **Dependencies:** PR 2 (system age ratio infrastructure)

### PR 4: Life Time Gradients
- Implement `addLifeTimeGradient()` / `removeLifeTimeGradient()` in GPU system
- Reuses system-age-ratio infrastructure from PR 2
- Visual test: `GPU Particles - Change - Lifetime`, `GPU Particles - Change - Lifetime 2`
- **Dependencies:** PR 2 (system age ratio infrastructure)

### PR 5: Ramp Gradients
- Implement `addRampGradient()`, `useRampGradients` in GPU system
- Requires secondary gradient texture lookup in render shader
- Visual tests: `GPU Particles - Ramp Gradient`, `GPU Particles - Ramp Blend`
- **Dependencies:** None

### PR 6: Color Remap Gradients
- Implement `addColorRemapGradient()` in GPU system
- Requires color channel remapping in render shader
- Visual test: `GPU Particles - Ramp Gradient Remap`
- **Dependencies:** PR 5 (ramp gradient infrastructure)

### PR 7: Alpha Remap Gradients
- Implement `addAlphaRemapGradient()` in GPU system
- Requires alpha channel remapping in render shader
- Visual test: `GPU Particles - Ramp Gradient Remap Alpha`
- **Dependencies:** PR 5 (ramp gradient infrastructure)

### PR 8: Billboard Stretched Local
- Add `BILLBOARDMODE_STRETCHED_LOCAL` support to GPU render shaders
- Store initial direction per particle in GPU buffer (affects vertex buffer layout)
- Visual test: `GPU Particles - Billboard Stretched Local`
- **Dependencies:** None

### PR 9: Mesh Emitter
- Implement `MeshParticleEmitter` support for GPU system
- Upload mesh vertex positions/normals to storage buffer or texture
- Precompute cumulative area weights for uniform triangle sampling
- WebGPU can use storage buffers; WebGL2 will need a texture-based approach (prefer both, but WebGPU-only is acceptable as fallback)
- Visual test: `GPU Particles - Emitters - Mesh`
- **Dependencies:** None

### PR 10: `GPUParticleSystem.fromParticleSystem()` Helper
- Create a static/factory method that copies all shared properties from a CPU `ParticleSystem` to a new `GPUParticleSystem`
- Useful for users and for simplifying test boilerplate
- **Dependencies:** Best done after most features are implemented so the helper covers all properties

### PR 11: GPU Feature Flags and Warnings
- Replace silent no-ops with console warnings for genuinely unsupported methods
- Expose a `supportedFeatures` query or similar mechanism
- **Dependencies:** All other PRs (do this last so the warning list is accurate)

### Stretch Goal: Sub-Emitters (Investigation)

Sub-emitters are the most architecturally challenging feature to port. They may not be feasible on GPU without unacceptable performance tradeoffs. This section is a **stretch goal** — it will be pursued only if the core parity PRs above are complete and a viable approach is identified.

- **Sub-emitters END type** — spawn particles when parent dies
- **Sub-emitters ATTACHED type** — child particles follow parent
- **Sub-emitter velocity/direction inheritance** — transfer momentum from parent to child
- Could potentially be WebGPU-only if indirect dispatch is needed
- Possible approaches:
  - GPU readback of particle state (expensive, defeats GPU purpose)
  - GPU-side spawning via indirect dispatch (complex but performant, WebGPU only)
  - Hybrid approach: track particle deaths on GPU, batch-spawn sub-emitters

### PR Dependency Graph

```
PR 1 (Attractors)          — standalone
PR 2 (Emit Rate Gradients) — standalone, introduces system-age infrastructure
  ├── PR 3 (Start Size Gradients) — depends on PR 2
  └── PR 4 (Life Time Gradients)  — depends on PR 2
PR 5 (Ramp Gradients)      — standalone
  ├── PR 6 (Color Remap)   — depends on PR 5
  └── PR 7 (Alpha Remap)   — depends on PR 5
PR 8 (Billboard Stretched Local) — standalone
PR 9 (Mesh Emitter)        — standalone
PR 10 (fromParticleSystem helper) — after most features done
PR 11 (Feature Flags)      — last
```

---

## Approach Considerations

### Dual-shader implementation

Every GPU particle update feature must be implemented in two shader files:
- `packages/dev/core/src/Shaders/gpuUpdateParticles.vertex.ts` — WebGL2 transform feedback path
- `packages/dev/core/src/ShadersWGSL/gpuUpdateParticles.compute.ts` — WebGPU compute shader path

Render-side features (ramp gradients, color/alpha remap, billboard modes) must similarly be updated in both the GLSL and WGSL render shaders. Visual tests must run on both WebGL2 and WebGPU Playwright projects to verify both paths.

### System-age gradients (PRs 2–4)

The GPU system already implements 6 gradient types via texture sampling in the update shader, but those gradients sample at **particle age ratio** (`currentAge / totalLife`). The three missing gradients — Emit Rate, Start Size, and Life Time — are fundamentally different: they sample at **system age ratio** (`systemAge / targetStopDuration`) and affect the **emission phase** (particle birth) rather than the per-frame update phase.

PR 2 (Emit Rate Gradients) must introduce the shared system-age-ratio infrastructure (passing system age as a uniform, computing the ratio, sampling gradient textures at birth time). PRs 3 and 4 then reuse this infrastructure.

### Ramp gradients and remapping (PRs 5–7)

Ramp gradients, color remap, and alpha remap operate in the **render shader**, not the update shader. They require additional texture lookups during the fragment/vertex rendering stage. PR 5 introduces the ramp gradient texture infrastructure; PRs 6 and 7 extend it with channel remapping.

### Mesh Emitter (PR 9)

Mesh emission requires access to vertex position/normal data. WebGPU can use storage buffers naturally. WebGL2 would need a texture-based approach (pack vertex data into a float texture). Both paths need precomputed cumulative area weights for uniform triangle sampling. Prefer implementing both paths, but WebGPU-only is acceptable if the WebGL2 approach proves too complex.

### Attractors (PR 1)

Attractors apply force based on distance from a point. This is the simplest shader addition — pass attractor positions and strengths as uniforms to the update shader and apply the inverse-square force calculation. Doing this first builds confidence in the dual-shader workflow before tackling more complex features.

### Sub-emitters (stretch goal)

Sub-emitters are the most architecturally challenging feature to port. They require reading back individual particle death events from the GPU to spawn new systems or attach child systems to live particles. Possible approaches:
- GPU readback of particle state (expensive, defeats GPU purpose)
- GPU-side spawning via indirect dispatch (complex but performant, WebGPU only)
- Hybrid approach: track particle deaths on GPU, batch-spawn sub-emitters

These will be investigated only after all core parity features are complete. They may be scoped as WebGPU-only if indirect dispatch is required.

### Stretched Local Billboard (PR 8)

Requires storing the initial emission direction per particle in the GPU buffer and using it in the render vertex shader instead of the current velocity direction. This changes the vertex buffer layout, which must be handled in both platform implementations (`computeShaderParticleSystem.ts` and `webgl2ParticleSystem.ts`).
