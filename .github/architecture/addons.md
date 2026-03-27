# Addons (`@babylonjs/addons`)

The addons package provides optional feature modules that extend Babylon.js with specialized capabilities not included in the core engine.

**Implementation:** `packages/dev/addons`

## Architecture Overview

The package is a collection of independent feature modules, each in its own directory. These modules are self-contained and can be imported individually. They depend on core but are optional for most applications.

## Modules

### Atmosphere (`src/atmosphere/`)
Atmospheric and sky rendering additions. Provides realistic atmospheric scattering and sky dome effects beyond the basic sky material.

### HTML Mesh (`src/htmlMesh/`)
Enables embedding HTML content into 3D scenes by mapping DOM elements onto mesh surfaces. Useful for displaying web content, forms, or rich text within a 3D environment.

### MSDF Text (`src/msdfText/`)
Multi-channel Signed Distance Field text rendering. Provides high-quality, resolution-independent text rendering in 3D scenes using MSDF font atlases.

### Navigation (`src/navigation/`)
Navigation mesh and pathfinding functionality. Integrates with the `@recast-navigation` library to provide AI navigation, crowd simulation, and path planning on navigation meshes.
