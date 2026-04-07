# Viewer (`@babylonjs/viewer`)

The Viewer is a drop-in web component for displaying 3D models with minimal configuration.

**Implementation:** `packages/tools/viewer`

## Architecture Overview

The Viewer is implemented as a set of **custom HTML elements** (Web Components) that wrap the Babylon.js engine. The architecture is intentionally flat — most logic lives in a small number of root-level TypeScript modules rather than deep directory hierarchies. Shader files are separated into GLSL and WGSL directories.

## Major Modules

### Viewer Element (`viewerElement.ts`)
The main `<babylon-viewer>` custom element. This is the primary public API — users add the element to their HTML and configure it with attributes for model source, environment, camera behavior, etc.

### Viewer (`viewer.ts`)
Core viewer behavior and rendering orchestration. Manages the Babylon.js engine, scene, camera, and model loading lifecycle. Handles resizing, animation playback, and interaction.

### Viewer Annotation Element (`viewerAnnotationElement.ts`)
Custom element for adding annotation overlays (hotspots, labels) to the 3D viewer.

### Viewer Factory (`viewerFactory.ts`)
Factory and creation helpers for programmatically instantiating viewer instances outside of the custom element workflow.

### Default Environment (`defaultEnvironment.ts`)
Built-in environment configuration including skybox, ground plane, lighting, and tone mapping defaults that provide a good out-of-box visual experience.

### Shaders (`Shaders/`, `ShadersWGSL/`)
Custom shader implementations for the viewer's rendering pipeline, in both GLSL and WGSL for WebGL and WebGPU support respectively.

## Related Package

**Viewer Configurator** (`packages/tools/viewer-configurator`) is a React-based companion tool for visually configuring viewer settings. It has a simple `components/` + `hooks/` architecture.
