# FBX Loader Goals

## Status

This specification captures the current Babylon.js FBX loader integration goals. Root-level migration reports are temporary agent handoff notes and should not be treated as durable feature documentation.

## Goals

- Provide a built-in, SDK-free FBX loader for Babylon.js.
- Preserve Babylon.js loader conventions, including package exports, side-effect registration, dynamic registration, and `SceneLoader` plugin options.
- Load common FBX assets with meshes, transforms, materials, textures, skinning, animation, cameras, and lights when supported by the current implementation.
- Handle tangent-space normal maps independently from Babylon scene handedness.
- Default FBX tangent-space normal maps to Y-up normal-map convention, with an explicit Y-down option for assets authored with inverted green/Y normal channels.
- Preserve compatibility for FBX `Bump` and `BumpFactor` texture slots by treating them as normal-map-like inputs when assigning to Babylon `StandardMaterial.bumpTexture`.
- Use Babylon texture-loading primitives for FBX textures, including embedded texture buffers, MIME type detection, and forced extensions.
- Return asset containers that own the FBX-created scene nodes, materials, and textures they need for consistent add/remove lifecycle behavior.
- Document known limitations clearly so future work can build on the current loader without changing behavior accidentally.

## Non-goals

- Depend on the Autodesk FBX SDK.
- Fully implement every FBX feature or every exporter-specific convention in the initial integration.
- Treat grayscale height/bump textures as physically correct height maps without a conversion path.
- Use graphics API names such as `opengl` or `directx` as the primary public loader option names for normal-map convention.
- Make scene handedness select normal-map green/Y channel convention.
