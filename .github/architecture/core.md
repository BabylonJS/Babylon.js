# Core (`@babylonjs/core`)

The core package is the foundation of Babylon.js. It provides the complete 3D engine runtime including the scene graph, rendering backends, materials, cameras, lights, and all major subsystems.

**Implementation:** `packages/dev/core`

## Architecture Overview

The core is organized around a central **Scene** object that acts as the container for all 3D world state. A **Node**-based scene graph hierarchy provides spatial transforms, and the **Engine** abstraction layer handles rendering across WebGL2, WebGPU, and native backends.

## Major Subsystems

### Scene Graph
- **`scene.ts`** — Central runtime object; owns all entities, manages the render loop, and orchestrates per-frame updates.
- **`node.ts`** — Base class for all scene graph objects with parent/child hierarchy and transform support.
- **`Meshes/`** — Geometry and renderable objects. `TransformNode` extends `Node`; `Mesh` and `AbstractMesh` provide rendering capabilities. Includes mesh builders, vertex data, geometry, CSG, and instancing.
- **`Bones/`** — Skeletal animation system with `Skeleton` and `Bone` classes.
- **`Morph/`** — Morph target (blend shape) support.
- **`assetContainer.ts`** — Groups scene assets for batch import/export workflows.

### Rendering Engine
- **`Engines/`** — Backend abstraction layer. Includes `AbstractEngine`, `ThinEngine`, `Engine`, and `WebGPUEngine`. Manages shader compilation, render pipeline contexts, texture management, and GPU capabilities. Extension modules add specialized features (compute shaders, multi-render targets, transform feedback, occlusion queries, etc.) via prototype augmentation.

### Materials and Shaders
- **`Materials/`** — Full material system including `StandardMaterial`, PBR materials (`PBRMaterial`, `PBRMetallicRoughnessMaterial`), `ShaderMaterial`, `NodeMaterial`, and a plugin/extension architecture for material customization. Sub-modules handle textures, uniforms, and effect management.
- **`Shaders/`** — GLSL shader source files.
- **`ShadersWGSL/`** — WGSL shader source files for WebGPU.

### Lighting
- **`Lights/`** — Light types (directional, point, spot, hemispheric, area) and shadow generators (cascaded shadow maps, PCF, PCSS). Includes clustered lighting and IES profile support.
- **`Probes/`** — Reflection probes for environment capture.
- **`Layers/`** — Highlight layers, glow layers, and effect layers.
- **`LensFlares/`** — Lens flare effects.

### Cameras and Input
- **`Cameras/`** — Camera types: `ArcRotateCamera`, `FreeCamera`, `UniversalCamera`, `FollowCamera`, `FlyCamera`, device orientation, stereoscopic/VR rigs, and gamepad cameras.
- **`Inputs/`**, **`DeviceInput/`**, **`Events/`** — Input abstraction and device management for keyboard, mouse, touch, and gamepad.
- **`Gamepads/`** — Gamepad API integration.

### Animation
- **`Animations/`** — Keyframe animation runtime with `Animation`, `Animatable`, `AnimationGroup`, easing functions, animation events, and weighted blending.
- **`BakedVertexAnimation/`** — Precomputed vertex animation playback via texture sampling.

### Physics
- **`Physics/`** — Dual-track physics architecture:
  - `v1/` — Legacy physics engine interface.
  - `v2/` — Modern physics API with `PhysicsBody`, `PhysicsShape`, `PhysicsConstraint`, and engine plugins (e.g., Havok).

### Particles
- **`Particles/`** — Particle systems including CPU, GPU (WebGL2 / compute shader), solid particle system, and node-based particle graph system. Includes various emitter types and sub-emitters.

### Audio
- **`Audio/`** — Web Audio API integration with `Sound`, `SoundTrack`, and `AudioEngine`.
- **`AudioV2/`** — Next-generation audio abstraction layer.

### Post-Processing and Advanced Rendering
- **`PostProcesses/`** — Screen-space effects and render pipelines (bloom, DOF, SSAO, FXAA, tone mapping, motion blur, etc.).
- **`Rendering/`** — Higher-level render orchestration: depth renderer, geometry buffer, pre-pass renderer, outline/edges rendering, bounding box renderer, global illumination, fluid rendering, and rendering groups.
- **`FrameGraph/`** — Declarative render graph system for defining rendering pipelines as DAGs.
- **`FlowGraph/`** — Visual scripting / logic graph system.
- **`Compute/`** — Compute shader abstractions.

### XR
- **`XR/`** — Full WebXR support: experience helper, session management, controller input, hand tracking, hit testing, anchors, and feature modules.

### Loading and Serialization
- **`Loading/`** — Scene loader framework with plugin registration. Includes the `.babylon` file parser and plugin infrastructure for external format loaders.
- **`Misc/`** — Utilities including `SceneSerializer`, file tools, texture tools, screenshot tools, worker pool, logging, performance monitoring, and deep copy helpers.

### Supporting Systems
- **`Maths/`** — Vector, matrix, quaternion, color, and scalar math. Spherical harmonics, geospatial math.
- **`Culling/`** — Frustum culling, bounding info, rays, and octree spatial indexing.
- **`Collisions/`** — Collision detection system.
- **`Behaviors/`** — Reusable behaviors (auto-rotate, bouncing, pointer drag, etc.).
- **`Gizmos/`** — Interactive manipulation handles (position, rotation, scale, bounding box).
- **`Sprites/`** — 2D sprite rendering in 3D space.
- **`Navigation/`** — Navigation mesh and pathfinding plugin interface.
- **`Debug/`** — Debug visualization tools (skeleton viewer, physics viewer, axes viewer).
- **`Instrumentation/`** — Performance instrumentation hooks.
- **`States/`** — Render state abstractions (stencil, depth, alpha).
- **`Decorators/`** — Serialization decorators (`@serialize`, `@serializeAsVector3`, etc.).
- **`Buffers/`** — GPU buffer management (vertex, index, uniform, storage).
- **`Offline/`** — Offline/local storage support for assets.
- **`ObjectModel/`** — Data model utilities.
- **`Helpers/`** — Convenience functions for common scene setup patterns.
- **`Compat/`** — Backward compatibility shims.

## Key Patterns

- **Module augmentation** is used extensively to add methods to `Scene`, `Engine`, `ThinEngine`, and `AbstractEngine` prototypes from separate files. Consumers must use side-effect imports to ensure the augmenting modules are loaded at runtime.
- **Observable pattern** is the primary event system (not DOM events).
- **Plugin architecture** for materials, loaders, physics engines, and post-process pipelines.
- **Tree-shakeable** — the package is designed so unused subsystems can be excluded by bundlers.
