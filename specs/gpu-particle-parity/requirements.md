# Requirements: CPU ↔ GPU Particle System Feature Parity

This document defines the requirements for bringing `GPUParticleSystem` to feature parity with `ParticleSystem` (CPU). It is derived from the [goals document](../../.github/goals.md).

---

## 1. Visual Regression Test Coverage

### REQ-TEST-1: Side-by-Side Test Layout

Each visual regression test MUST render a CPU `ParticleSystem` on the left and a `GPUParticleSystem` on the right within the same scene, using identical configuration parameters. The CPU emitter MUST be positioned at `(0, 0.5, 0)` and the GPU emitter at `(5, 0.5, 0)`.

### REQ-TEST-2: Regression Comparison Target

Visual tests MUST compare the current screenshot against a stored reference image from a prior run. Tests MUST NOT attempt pixel-perfect comparison between the left (CPU) and right (GPU) halves — those will differ due to different random number sources and that is expected.

### REQ-TEST-3: Engine Coverage

All CPU-vs-GPU visual tests MUST run on both the WebGL2 and WebGPU Playwright projects. Tests MUST exclude the WebGL1 project, since `GPUParticleSystem` requires WebGL 2+.

### REQ-TEST-4: Render Stabilization

Each visual test MUST use a `renderCount` of at least 120 frames to allow the particle system to reach a visually stable state before the screenshot is captured.

### REQ-TEST-5: Baseline Tests for Shared Features

A visual regression test MUST exist for each of the following features that are already supported by both CPU and GPU particle systems:

**Basic Properties:**

| ID | Feature | Properties Exercised |
|----|---------|---------------------|
| REQ-TEST-5a | Size | `minSize`, `maxSize` |
| REQ-TEST-5b | Scale | `minScaleX`, `maxScaleX`, `minScaleY`, `maxScaleY` |
| REQ-TEST-5c | Color | `color1`, `color2`, `colorDead` |
| REQ-TEST-5d | Speed | `minEmitPower`, `maxEmitPower` |
| REQ-TEST-5e | Angular Speed | `minAngularSpeed`, `maxAngularSpeed` |
| REQ-TEST-5f | Rotation | `minInitialRotation`, `maxInitialRotation` |
| REQ-TEST-5g | Translation Pivot | `translationPivot` |
| REQ-TEST-5h | Direction | `direction1`, `direction2` |
| REQ-TEST-5i | Gravity | `gravity` |
| REQ-TEST-5j | Emit Rate | `emitRate` |
| REQ-TEST-5k | Lifetime | `minLifeTime`, `maxLifeTime` |
| REQ-TEST-5l | Pre-warm | `preWarmCycles`, `preWarmStepOffset` |
| REQ-TEST-5m | Target Stop Duration | `targetStopDuration` (without gradients) |

**Gradients (Over Lifetime):**

| ID | Feature | API Exercised |
|----|---------|--------------|
| REQ-TEST-5n | Size Gradient | `addSizeGradient()` |
| REQ-TEST-5o | Color Gradient | `addColorGradient()` |
| REQ-TEST-5p | Velocity Gradient | `addVelocityGradient()` |
| REQ-TEST-5q | Limit Velocity Gradient | `addLimitVelocityGradient()` |
| REQ-TEST-5r | Angular Speed Gradient | `addAngularSpeedGradient()` |
| REQ-TEST-5s | Drag Gradient | `addDragGradient()` |
| REQ-TEST-5t | Size Gradient Range | `addSizeGradient()` with `factor1 ≠ factor2` |
| REQ-TEST-5u | Color Gradient Range | `addColorGradient()` with `color1 ≠ color2` |

**Emitter Types:**

| ID | Feature | API Exercised |
|----|---------|--------------|
| REQ-TEST-5v | Point Emitter | `createPointEmitter()` |
| REQ-TEST-5w | Box Emitter | `createBoxEmitter()` |
| REQ-TEST-5x | Sphere Emitter | `createSphereEmitter()` |
| REQ-TEST-5y | Directed Sphere | `createDirectedSphereEmitter()` |
| REQ-TEST-5z | Hemisphere Emitter | `createHemisphericEmitter()` |
| REQ-TEST-5aa | Cylinder Emitter | `createCylinderEmitter()` |
| REQ-TEST-5ab | Directed Cylinder | `createDirectedCylinderEmitter()` |
| REQ-TEST-5ac | Cone Emitter | `createConeEmitter()` |
| REQ-TEST-5ad | Directed Cone | `createDirectedConeEmitter()` |
| REQ-TEST-5ae | Custom Emitter | `CustomParticleEmitter` |

**Rendering & Effects:**

| ID | Feature | Properties Exercised |
|----|---------|---------------------|
| REQ-TEST-5af | Billboard Y | `billboardMode = BILLBOARDMODE_Y` |
| REQ-TEST-5ag | Billboard Stretched | `billboardMode = BILLBOARDMODE_STRETCHED` |
| REQ-TEST-5ah | Multiply Blend | `blendMode = BLENDMODE_MULTIPLY` |
| REQ-TEST-5ai | Animation Sheet | `isAnimationSheetEnabled`, `spriteCellWidth/Height`, `startSpriteCellID`, `endSpriteCellID` |
| REQ-TEST-5aj | Noise | `noiseTexture`, `noiseStrength` |
| REQ-TEST-5ak | Flow Maps | `flowMap`, `flowMapStrength` |
| REQ-TEST-5al | Local Space | `isLocal = true` |

### REQ-TEST-6: Phase 2 Feature Tests

Each newly implemented GPU feature (Phase 2) MUST include one or more visual regression tests that exercise the new feature. Features that interact with other features (e.g., ramp gradients with blend modes) SHOULD include additional interaction tests.

### REQ-TEST-7: No Regressions on Merge

Every Phase 2 PR MUST pass all existing Phase 1 and Phase 2 visual tests before merge. No previously passing test MAY regress.

---

## 2. Gradient Features

### REQ-GRAD-1: Emit Rate Gradients

`GPUParticleSystem` MUST support `addEmitRateGradient()`, `removeEmitRateGradient()`, and `getEmitRateGradients()`. The emit rate gradient MUST vary the system's emission rate over the system's lifetime based on the ratio `systemAge / targetStopDuration`.

### REQ-GRAD-2: Start Size Gradients

`GPUParticleSystem` MUST support `addStartSizeGradient()`, `removeStartSizeGradient()`, and `getStartSizeGradients()`. The start size gradient MUST vary the initial size of newly spawned particles based on the ratio `systemAge / targetStopDuration`.

### REQ-GRAD-3: Life Time Gradients

`GPUParticleSystem` MUST support `addLifeTimeGradient()`, `removeLifeTimeGradient()`, and `getLifeTimeGradients()`. The life time gradient MUST vary the lifetime assigned to newly spawned particles based on the ratio `systemAge / targetStopDuration`.

### REQ-GRAD-4: targetStopDuration Validation

If a system-age-dependent gradient (emit rate, start size, or life time) is added and `targetStopDuration` is not set, `GPUParticleSystem` MUST throw the same error that `ParticleSystem` (CPU) throws today. The behavior MUST be identical.

### REQ-GRAD-5: Ramp Gradients

`GPUParticleSystem` MUST support `addRampGradient()`, `removeRampGradient()`, `getRampGradients()`, and the `useRampGradients` property. When enabled, ramp gradients MUST remap particle colors via a secondary gradient texture lookup in the render shader.

### REQ-GRAD-6: Color Remap Gradients

`GPUParticleSystem` MUST support `addColorRemapGradient()`, `removeColorRemapGradient()`, and `getColorRemapGradients()`. Color remap gradients MUST remap color channel values over the particle's lifetime.

### REQ-GRAD-7: Alpha Remap Gradients

`GPUParticleSystem` MUST support `addAlphaRemapGradient()`, `removeAlphaRemapGradient()`, and `getAlphaRemapGradients()`. Alpha remap gradients MUST remap the alpha channel over the particle's lifetime.

### REQ-GRAD-8: Dynamic Gradient Removal

Removing all gradients of a given type at runtime (e.g., removing all color gradients) MUST cause the GPU system to revert to the non-gradient behavior (e.g., `color1`/`color2` interpolation). This MAY require shader recompilation.

### REQ-GRAD-9: Gradient Behavioral Equivalence

For each gradient type, the visual behavior on `GPUParticleSystem` MUST be visually similar to the same gradient configuration on `ParticleSystem` (CPU). "Visually similar" means the same general progression, ranges, and shape — not pixel-identical output.

---

## 3. Emitter Types

### REQ-EMIT-1: Mesh Emitter

`GPUParticleSystem` MUST support `MeshParticleEmitter`. Particles MUST be spawned from positions sampled from the mesh's vertex data with uniform distribution across triangle surface area. The `useMeshNormalsForDirection` property MUST be respected.

### REQ-EMIT-2: Mesh Emitter Data Capture

Mesh vertex data MUST be captured once at system initialization (or when `rebuild()` is called). Changes to mesh geometry after initialization MUST NOT automatically propagate to the GPU particle system. Users MUST call `rebuild()` to refresh the data.

### REQ-EMIT-3: Mesh Emitter Platform Support

Mesh emitter MUST be supported on WebGPU. It SHOULD also be supported on WebGL2. If the WebGL2 implementation proves infeasible, mesh emitter MAY be WebGPU-only, and attempting to use it on WebGL2 MUST log a warning.

---

## 4. Physics & Forces

### REQ-PHYS-1: Attractors

`GPUParticleSystem` MUST support `addAttractor()` and `removeAttractor()`. Attractors MUST apply an inverse-square force to particles based on the attractor's position and strength, matching the behavior of the CPU `Attractor` class.

### REQ-PHYS-2: Attractor Limit

`GPUParticleSystem` MUST support at least 8 simultaneous attractors. If the user adds more attractors than the supported limit, the system MUST log a warning and ignore the excess attractors.

### REQ-PHYS-3: Attractor Serialization

Attractors on `GPUParticleSystem` MUST be included in `serialize()` output and restored by `Parse()`, using the same JSON format as `ParticleSystem` (CPU) attractor serialization.

---

## 5. Rendering

### REQ-RENDER-1: Billboard Stretched Local

`GPUParticleSystem` MUST support `BILLBOARDMODE_STRETCHED_LOCAL`. In this mode, particles MUST orient along their initial emission direction rather than their current velocity direction.

### REQ-RENDER-2: Initial Direction Storage

Supporting `BILLBOARDMODE_STRETCHED_LOCAL` requires storing the initial emission direction per particle in the GPU buffer. This MUST be implemented in both the WebGL2 (transform feedback) and WebGPU (compute shader) platform backends.

---

## 6. Conversion Helper

### REQ-CONV-1: fromParticleSystem Method

`GPUParticleSystem` MUST expose a static or factory method `fromParticleSystem(source: ParticleSystem, scene: Scene, options?)` that creates a new `GPUParticleSystem` with all shared properties copied from the source CPU system.

### REQ-CONV-2: Unsupported Feature Handling

If the source `ParticleSystem` uses features not supported by `GPUParticleSystem` (e.g., sub-emitters, custom update functions), `fromParticleSystem()` MUST log a warning for each unsupported feature and skip it. It MUST NOT throw.

### REQ-CONV-3: Property Completeness

`fromParticleSystem()` MUST copy all properties that are shared between `ParticleSystem` and `GPUParticleSystem`, including but not limited to: emitter, particle texture, all color/size/speed/lifetime ranges, all supported gradients, emitter type, blend mode, billboard mode, animation sheet settings, noise texture, flow map, gravity, local space flag, world offset, translation pivot, and all lifecycle properties (emit rate, start delay, target stop duration, dispose on stop, pre-warm settings).

### REQ-CONV-4: Independent Instances

The resulting `GPUParticleSystem` MUST be fully independent of the source `ParticleSystem`. Modifying one MUST NOT affect the other after conversion.

---

## 7. Feature Flags & Warnings

### REQ-FLAG-1: Warning on Unsupported Methods

`GPUParticleSystem` MUST log a console warning when a user calls a method for a feature that is not supported (e.g., `addEmitRateGradient()` before it is implemented). The warning MUST identify the method name and state that it is not supported by the GPU particle system.

### REQ-FLAG-2: No Silent No-Ops

After the Feature Flags PR, no `IParticleSystem` method on `GPUParticleSystem` MAY silently do nothing without either functioning correctly or logging a warning. The current silent no-op pattern MUST be replaced.

### REQ-FLAG-3: Queryable Support

`GPUParticleSystem` SHOULD expose a mechanism for users to programmatically query which features are supported (e.g., a static `supportedFeatures` property or a `isFeatureSupported(feature)` method).

---

## 8. Serialization

### REQ-SER-1: New Feature Serialization

Every newly implemented GPU feature MUST be included in `GPUParticleSystem.serialize()` output and correctly restored by `GPUParticleSystem.Parse()`.

### REQ-SER-2: Backward-Compatible Parsing

`GPUParticleSystem.Parse()` MUST continue to correctly load serialized data that predates new features. Missing fields in older serialized data MUST result in default values, not errors.

### REQ-SER-3: Cross-System Serialization Compatibility

Gradient and attractor data serialized from `GPUParticleSystem` MUST use the same JSON format as `ParticleSystem` (CPU), so that `ParticleSystemSet.Parse()` can load the same JSON as either CPU or GPU.

---

## 9. Dual-Platform Implementation

### REQ-PLAT-1: WebGL2 and WebGPU Support

Every new GPU particle feature MUST function correctly on both the WebGL2 (transform feedback) and WebGPU (compute shader) backends, unless explicitly documented as WebGPU-only (see REQ-EMIT-3).

### REQ-PLAT-2: Shader Parity

For features that modify particle update logic, the implementation MUST be applied to both the GLSL vertex shader (`gpuUpdateParticles.vertex.ts`) and the WGSL compute shader (`gpuUpdateParticles.compute.ts`). For features that modify rendering, the implementation MUST be applied to both GLSL and WGSL render shaders.

### REQ-PLAT-3: WebGL1 Error Handling

Attempting to create a `GPUParticleSystem` on a WebGL 1 context MUST fail with a clear, descriptive log message. It MUST NOT silently fail or produce undefined behavior.

---

## 10. Backward Compatibility

### REQ-COMPAT-1: Existing API Preservation

All existing `GPUParticleSystem` public APIs MUST maintain compile-time and runtime backward compatibility. No existing method signatures, property types, or constructor parameters MAY change in a breaking way.

### REQ-COMPAT-2: Existing Behavior Preservation

The behavior of all currently supported GPU particle features MUST NOT change. Existing scenes using `GPUParticleSystem` MUST render identically before and after parity work, verified by Phase 1 visual regression tests.

### REQ-COMPAT-3: IParticleSystem Compliance

`GPUParticleSystem` MUST continue to implement the `IParticleSystem` interface. New method implementations MUST match the interface signatures exactly.

---

## 11. Documentation

### REQ-DOC-1: Public API Documentation

All new public methods and properties on `GPUParticleSystem` MUST have complete multi-line JSDoc comments describing behavior, parameters, return values, and any limitations.

### REQ-DOC-2: CPU-Only Feature Documentation

Features that remain CPU-only by design MUST be documented in the JSDoc of the relevant no-op or warning method on `GPUParticleSystem`, explaining why the feature is not available on GPU.

---

## Out of Scope

| Item | Reason |
|------|--------|
| WebGL 1 GPU particle support | GPU particles require WebGL 2+; WebGL 1 is not a target. |
| NPE ↔ GPU conversion | Future work; requires CPU-GPU parity first. |
| Custom JS callbacks on GPU (`updateFunction`, `recycleParticle`, `startDirectionFunction`, `startPositionFunction`) | Inherently CPU-side; cannot execute arbitrary JS on GPU. |
| Per-particle object access on GPU | GPU particle data resides in GPU buffers; individual particle access from JS is not feasible. |
| Sub-emitters on GPU | Stretch goal for investigation only; not a requirement for this project. |
| Auto-updating mesh emitter data | Mesh vertex data is captured once; users call `rebuild()` to refresh. |
| Existing CPU-vs-NPE visual tests | This project only concerns CPU-vs-GPU tests. Existing NPE tests are unaffected. |

---

## Acceptance Criteria Summary

| Requirement | Acceptance Criteria |
|-------------|-------------------|
| REQ-TEST-1 through REQ-TEST-5 | All ~38 Phase 1 visual tests pass on both WebGL2 and WebGPU projects. |
| REQ-TEST-6, REQ-TEST-7 | Each Phase 2 PR includes visual tests; all prior tests pass before merge. |
| REQ-GRAD-1 through REQ-GRAD-3 | System-age-dependent gradients vary particle properties over system lifetime; visually match CPU behavior. |
| REQ-GRAD-4 | Calling `addEmitRateGradient()` (or start size / life time) without `targetStopDuration` throws the same error as CPU. |
| REQ-GRAD-5 through REQ-GRAD-7 | Ramp, color remap, and alpha remap gradients function in the GPU render shader; visually match CPU behavior. |
| REQ-GRAD-8 | Removing all gradients of a type reverts to non-gradient behavior. |
| REQ-EMIT-1 | Mesh emitter spawns particles from mesh surface with correct distribution. |
| REQ-EMIT-2 | Mesh data is captured once; `rebuild()` refreshes it. |
| REQ-PHYS-1, REQ-PHYS-2 | Attractors apply force matching CPU; limit of ≥8 with warning on excess. |
| REQ-RENDER-1 | `BILLBOARDMODE_STRETCHED_LOCAL` works on GPU with initial direction orientation. |
| REQ-CONV-1 through REQ-CONV-4 | `fromParticleSystem()` produces an independent GPU system with all shared properties copied; warns on unsupported features. |
| REQ-FLAG-1, REQ-FLAG-2 | No silent no-ops remain; all unsupported methods log warnings. |
| REQ-FLAG-3 | Users can programmatically query GPU feature support. |
| REQ-SER-1 through REQ-SER-3 | New features serialize/deserialize; old data parses without errors; format compatible with CPU. |
| REQ-PLAT-1, REQ-PLAT-2 | All features work on both WebGL2 and WebGPU (unless explicitly WebGPU-only). |
| REQ-PLAT-3 | WebGL1 context fails with clear log message. |
| REQ-COMPAT-1 through REQ-COMPAT-3 | No breaking API changes; existing scenes render identically; `IParticleSystem` compliance maintained. |
| REQ-DOC-1, REQ-DOC-2 | All new public APIs documented; CPU-only methods document why. |
