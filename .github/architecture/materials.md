# Materials (`@babylonjs/materials`)

The materials package provides a library of specialized material implementations beyond the PBR and Standard materials included in core.

**Implementation:** `packages/dev/materials`

## Architecture Overview

Each material is isolated in its own directory with a consistent structure: a material class extending `PushMaterial`, a companion `MaterialDefines` class, and imported vertex/fragment shader modules. The package root barrel-exports all materials.

## Material Types

| Material | Directory | Description |
|---|---|---|
| Cell | `src/cell/` | Cel/toon shading with light-step quantization |
| Custom | `src/custom/` | Programmable shader injection on top of Standard or PBR materials (`CustomMaterial`, `PBRCustomMaterial`) |
| Fire | `src/fire/` | Animated procedural fire effect |
| Fur | `src/fur/` | Multi-layer shell-based fur rendering |
| Gradient | `src/gradient/` | Gradient color transitions across surfaces |
| Grid | `src/grid/` | Procedural grid-line overlay |
| Lava | `src/lava/` | Animated flowing lava surface |
| Mix | `src/mix/` | Multi-texture blending material |
| Normal | `src/normal/` | Normal vector visualization (debug material) |
| Shadow Only | `src/shadowOnly/` | Transparent material that only renders received shadows |
| Simple | `src/simple/` | Lightweight simplified material |
| Sky | `src/sky/` | Atmospheric sky dome / scattering |
| Terrain | `src/terrain/` | Terrain texture splatting and blending |
| Tri-Planar | `src/triPlanar/` | Tri-planar texture projection for seamless mapping |
| Water | `src/water/` | Reflective/refractive water surface with wave animation |

## Common Patterns

- All materials extend **`PushMaterial`** from core.
- Each material defines a **`*Defines`** class derived from `MaterialDefines` for shader preprocessor control.
- Shader code is split into imported **`.vertex.ts`** / **`.fragment.ts`** modules.
- Serialization uses core decorators: `@serialize`, `@serializeAsTexture`, `@expandToProperty`.
- Materials register themselves with `RegisterClass` for deserialization support.
- Standard engine helpers are used for lighting, fog, bones, instances, clip planes, and shadow integration.
