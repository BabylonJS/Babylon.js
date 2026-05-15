# Procedural Textures (`@babylonjs/procedural-textures`)

The procedural textures package provides GPU-generated textures that are computed at runtime rather than loaded from image files.

**Implementation:** `packages/dev/proceduralTextures`

## Architecture Overview

Each procedural texture is isolated in its own directory with a texture class (extending core's `ProceduralTexture`) and a companion fragment shader that generates the texture pattern on the GPU. The package barrel-exports all texture types.

## Texture Types

| Texture | Directory | Description |
|---|---|---|
| Brick | `src/brick/` | Procedural brick wall pattern |
| Cloud | `src/cloud/` | Animated cloud texture |
| Fire | `src/fire/` | Animated fire/flame texture |
| Grass | `src/grass/` | Grass/vegetation pattern |
| Marble | `src/marble/` | Marble veining texture |
| Normal Map | `src/normalMap/` | Procedural normal map generator |
| Perlin Noise | `src/perlinNoise/` | Perlin noise–based texture |
| Road | `src/road/` | Road/asphalt surface texture |
| Starfield | `src/starfield/` | Space/starfield background |
| Wood | `src/wood/` | Wood grain texture |

## Pattern

Each texture follows the same structure:
- A texture class extending `ProceduralTexture` with configurable parameters
- A fragment shader that generates the pattern on the GPU
- Serialization support via core decorators
