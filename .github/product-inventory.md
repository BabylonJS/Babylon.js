# Babylon.js Product Inventory

This document catalogs all public npm packages published under the `@babylonjs` scope and maps each to its internal implementation package(s). All packages share the same version (currently 8.x).

## Package Map

| Public Package | npm Name | Implementation Package | Path |
|---|---|---|---|
| Core | `@babylonjs/core` | `@dev/core` | `packages/dev/core` |
| GUI | `@babylonjs/gui` | `@dev/gui` | `packages/dev/gui` |
| Loaders | `@babylonjs/loaders` | `@dev/loaders` | `packages/dev/loaders` |
| Materials | `@babylonjs/materials` | `@dev/materials` | `packages/dev/materials` |
| Serializers | `@babylonjs/serializers` | `@dev/serializers` | `packages/dev/serializers` |
| Post-Processes | `@babylonjs/post-processes` | `@dev/post-processes` | `packages/dev/postProcesses` |
| Procedural Textures | `@babylonjs/procedural-textures` | `@dev/procedural-textures` | `packages/dev/proceduralTextures` |
| Addons | `@babylonjs/addons` | `@dev/addons` | `packages/dev/addons` |
| Smart Filters | `@babylonjs/smart-filters` | `@dev/smart-filters` | `packages/dev/smartFilters` |
| Smart Filters Blocks | `@babylonjs/smart-filters-blocks` | `@dev/smart-filters-blocks` | `packages/dev/smartFilterBlocks` |
| Lottie Player | `@babylonjs/lottie-player` | `@dev/lottie-player` | `packages/dev/lottiePlayer` |
| Inspector | `@babylonjs/inspector` | `@dev/inspector` | `packages/dev/inspector-v2` |
| Inspector (Legacy) | `@babylonjs/inspector-legacy` | `@dev/inspector-legacy` | `packages/dev/inspector` |
| Viewer | `@babylonjs/viewer` | `@tools/viewer` | `packages/tools/viewer` |
| Node Editor | `@babylonjs/node-editor` | `@tools/node-editor` | `packages/tools/nodeEditor` |
| Node Geometry Editor | `@babylonjs/node-geometry-editor` | `@tools/node-geometry-editor` | `packages/tools/nodeGeometryEditor` |
| Node Particle Editor | `@babylonjs/node-particle-editor` | `@tools/node-particle-editor` | `packages/tools/nodeParticleEditor` |
| Node Render Graph Editor | `@babylonjs/node-render-graph-editor` | `@tools/node-render-graph-editor` | `packages/tools/nodeRenderGraphEditor` |
| GUI Editor | `@babylonjs/gui-editor` | `@tools/gui-editor` | `packages/tools/guiEditor` |
| KTX2 Decoder | `@babylonjs/ktx2decoder` | `@tools/ktx2decoder` | `packages/tools/ktx2Decoder` |
| Accessibility | `@babylonjs/accessibility` | `@tools/accessibility` | `packages/tools/accessibility` |
| Shared UI Components | `@babylonjs/shared-ui-components` | `@dev/shared-ui-components` | `packages/dev/sharedUiComponents` |

## Product Categories

### Runtime Libraries

These packages are used directly in applications at runtime.

- **Core** (`@babylonjs/core`) — The main Babylon.js engine. Provides the scene graph, rendering engine (WebGL/WebGPU), materials, cameras, lights, animation, physics, particles, audio, XR support, and all foundational 3D capabilities. This is the only required package for any Babylon.js application.

- **GUI** (`@babylonjs/gui`) — Full-featured UI system for Babylon.js scenes. Includes a 2D texture-based UI system (buttons, text, sliders, grids, scroll viewers) rendered onto `AdvancedDynamicTexture`, and a 3D world-space GUI system with holographic-style controls, Fluent materials, and XR interaction support.

- **Loaders** (`@babylonjs/loaders`) — Scene loader plugins for importing 3D assets. Supports glTF 2.0 (with a rich extension system), glTF 1.0 (legacy), OBJ/MTL, STL, BVH motion capture, and Gaussian splat formats. Uses lazy dynamic imports for efficient loading.

- **Materials** (`@babylonjs/materials`) — Collection of specialized material implementations beyond the core PBR and Standard materials. Includes cel/toon shading, fire, fur, water, sky, grid, terrain, gradient, lava, tri-planar, and more.

- **Serializers** (`@babylonjs/serializers`) — Scene export plugins for saving 3D content. Supports glTF 2.0, OBJ, STL, USDZ, BVH, and 3MF export formats.

- **Post-Processes** (`@babylonjs/post-processes`) — Additional screen-space post-processing effects: ASCII art, digital rain, and edge detection.

- **Procedural Textures** (`@babylonjs/procedural-textures`) — GPU-generated procedural textures: brick, cloud, fire, grass, marble, normal map, Perlin noise, road, starfield, and wood.

- **Addons** (`@babylonjs/addons`) — Optional feature modules: atmospheric rendering, HTML-in-3D meshes, MSDF text rendering, and navigation/pathfinding.

- **Smart Filters** (`@babylonjs/smart-filters`) — Graph-based smart filter engine for composing GPU image-processing pipelines. Provides the block/connection-point model, runtime execution, serialization, and optimization.

- **Smart Filters Blocks** (`@babylonjs/smart-filters-blocks`) — Built-in block library for Smart Filters: pixelate, blur, exposure, contrast, green screen, glitch, composition, tint, and many more effects.

- **Lottie Player** (`@babylonjs/lottie-player`) — Runtime player for Lottie animations within Babylon.js, with its own parsing, node model, math utilities, and rendering pipeline.

- **KTX2 Decoder** (`@babylonjs/ktx2decoder`) — Texture transcoding support for KTX2 compressed textures, with multiple transcoder backends.

- **Accessibility** (`@babylonjs/accessibility`) — Accessibility layer that renders HTML "twin" DOM elements for 3D scene objects, enabling screen reader and keyboard navigation support.

- **Viewer** (`@babylonjs/viewer`) — Drop-in web component for displaying 3D models. Provides a `<babylon-viewer>` custom element with built-in environment setup, annotation support, and minimal configuration.

- **Inspector** (`@babylonjs/inspector`) — React + Fluent UI debugging tool with a scene explorer tree, property editor panes, performance viewer, curve editor, texture editor, and an extensible service/plugin architecture.

### Visual Editors (Tools)

These packages are standalone web-based visual editors deployed to the babylonjs.com website.

- **[Node Material Editor](https://nme.babylonjs.com)** (`@babylonjs/node-editor`) — Visual graph editor for creating Node Materials (shader graphs) using a drag-and-drop block-based interface.

- **[Node Geometry Editor](https://nge.babylonjs.com)** (`@babylonjs/node-geometry-editor`) — Visual graph editor for creating procedural geometry using node-based workflows.

- **[Node Particle Editor](https://npe.babylonjs.com)** (`@babylonjs/node-particle-editor`) — Visual graph editor for designing particle system behaviors through node graphs.

- **[Node Render Graph Editor](https://nrge.babylonjs.com)** (`@babylonjs/node-render-graph-editor`) — Visual graph editor for composing render graph pipelines.

- **[GUI Editor](https://gui.babylonjs.com)** (`@babylonjs/gui-editor`) — Visual layout editor for designing Babylon.js GUI interfaces with a diagram/canvas-based workspace.

- **[Smart Filters Editor](https://sfe.babylonjs.com)** (not published via NPM) — Visual editor for creating and editing Smart Filter graphs.

### Shared Infrastructure

- **Shared UI Components** (`@babylonjs/shared-ui-components`) — Reusable React component library shared across all visual editors. Provides color pickers, node graph system primitives, Fluent UI wrappers, split panes, and tab layouts.

- **Test Tools** (`@babylonjs/test-tools`) — Internal testing utilities shared across the Babylon.js test suite.

## Repository Structure

```
packages/
├── public/@babylonjs/    # Public npm packages (thin wrappers + build config)
├── dev/                  # Implementation packages for runtime libraries
│   ├── core/
│   ├── gui/
│   ├── loaders/
│   ├── materials/
│   ├── serializers/
│   ├── postProcesses/
│   ├── proceduralTextures/
│   ├── addons/
│   ├── smartFilters/
│   ├── smartFilterBlocks/
│   ├── lottiePlayer/
│   ├── inspector/
│   ├── inspector-v2/
│   └── sharedUiComponents/
└── tools/                # Implementation packages for tools and editors
    ├── viewer/
    ├── nodeEditor/
    ├── nodeGeometryEditor/
    ├── nodeParticleEditor/
    ├── nodeRenderGraphEditor/
    ├── guiEditor/
    ├── smartFiltersEditor/     # Editor UI (not a separate public package)
    ├── playground/             # playground.babylonjs.com (not published to npm)
    ├── sandbox/                # sandbox.babylonjs.com (not published to npm)
    ├── viewer-configurator/    # Viewer configuration tool (not published to npm)
    ├── ktx2Decoder/
    ├── accessibility/
    ├── testTools/
    └── tests/
```

## Architecture Documentation

For detailed architecture information about each product, see the files in [architecture/](architecture/):

- [Core](architecture/core.md)
- [GUI](architecture/gui.md)
- [Loaders](architecture/loaders.md)
- [Materials](architecture/materials.md)
- [Serializers](architecture/serializers.md)
- [Post-Processes](architecture/post-processes.md)
- [Procedural Textures](architecture/procedural-textures.md)
- [Addons](architecture/addons.md)
- [Smart Filters](architecture/smart-filters.md)
- [Lottie Player](architecture/lottie-player.md)
- [Inspector](architecture/inspector.md)
- [Viewer](architecture/viewer.md)
- [Node Editors](architecture/node-editors.md)
- [GUI Editor](architecture/gui-editor.md)
- [KTX2 Decoder](architecture/ktx2decoder.md)
- [Accessibility](architecture/accessibility.md)
- [Shared UI Components](architecture/shared-ui-components.md)
