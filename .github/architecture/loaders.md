# Loaders (`@babylonjs/loaders`)

The loaders package provides scene loader plugins for importing 3D assets in various file formats into Babylon.js scenes.

**Implementation:** `packages/dev/loaders`

## Architecture Overview

The package is organized as a set of format-specific **SceneLoader plugins** registered through the core's `RegisterSceneLoaderPlugin` API. Loaders are registered lazily via `src/dynamic.ts` using dynamic imports so that unused format parsers are not bundled. The glTF 2.0 loader has the most elaborate architecture, featuring a registry-driven extension system.

## Supported Formats

### glTF (`src/glTF/`)
The primary and most feature-rich loader.

- **glTF 2.0** (`src/glTF/2.0/`) — Full glTF 2.0 support with a modular extension system.
  - **Extensions** (`src/glTF/2.0/Extensions/`) — Registered via `glTFLoaderExtensionRegistry.ts`. Extensions are categorized as either format-specific (only activated when the glTF file declares the extension) or generic helpers (applied to all glTF loads). Covers Draco compression, texture transforms, PBR extensions (clearcoat, sheen, transmission, iridescence), KHR_lights, KHR_materials_*, EXT_meshopt, MSFT_*, and more.
  - **`dynamic.ts`** — Registers built-in extensions via `registerBuiltInGLTFExtensions()`.
- **glTF 1.0** (`src/glTF/1.0/`) — Legacy glTF 1.x loader with its own extension model.

### OBJ (`src/OBJ/`)
Wavefront OBJ mesh loader with companion MTL material file parsing.

### STL (`src/STL/`)
STL mesh loader for 3D printing–style geometry files.

### BVH (`src/BVH/`)
BVH motion capture / skeletal hierarchy file loader.

### SPLAT (`src/SPLAT/`)
Gaussian splat point cloud format loader.

## Extension Architecture (glTF 2.0)

The glTF 2.0 loader uses a plugin registry pattern:
1. Extensions are registered with `registerGLTFExtension(name, isGLTFExtension, factory)`.
2. During loading, the loader checks the glTF file's `extensionsUsed` array and instantiates matching extension factories.
3. Extensions hook into the loading pipeline at defined points (materials, textures, meshes, nodes, etc.).
4. New extensions must be added to `packages/dev/loaders/src/glTF/2.0/Extensions/dynamic.ts`.
