# Node Editors

Babylon.js includes four visual graph editors that share a common architecture. Each editor allows users to create content by connecting blocks in a node-based interface.

| Editor | Public Package | Implementation |
|---|---|---|
| Node Material Editor | `@babylonjs/node-editor` | `packages/tools/nodeEditor` |
| Node Geometry Editor | `@babylonjs/node-geometry-editor` | `packages/tools/nodeGeometryEditor` |
| Node Particle Editor | `@babylonjs/node-particle-editor` | `packages/tools/nodeParticleEditor` |
| Node Render Graph Editor | `@babylonjs/node-render-graph-editor` | `packages/tools/nodeRenderGraphEditor` |

## Shared Architecture

All four editors follow the same architectural pattern:

### Graph System (`src/graphSystem/`)
The core domain layer for graph editing. Handles the node graph model, layout, block interaction, connection drawing, and editing logic. This is the central engine of each editor.

### Components (`src/components/`)
React UI for the editor shell — toolbars, panels, sidebars, and property editors.

### Shared Components (`src/sharedComponents/`)
Reusable UI widgets shared within each editor tool.

### Legacy (`src/legacy/`)
Backward-compatibility code for older editor APIs and integration patterns.

### Assets (`src/imgs/`)
Static image and icon assets used in the editor UI.

### Root Modules
- **`graphEditor.tsx`** — Main editor React component and app shell.
- **`blockTools.ts`** — Block/node registration and manipulation utilities.
- **`serializationTools.ts`** — Import/export and persistence for node graphs.
- **Editor entry point** (e.g., `nodeEditor.ts`, `nodeGeometryEditor.ts`) — Public API and bootstrap.

## Individual Editor Purposes

### Node Material Editor (`@babylonjs/node-editor`)
Visual editor for creating **Node Materials** — shader graphs that define how surfaces are rendered. Users connect math, texture, lighting, and output blocks to build custom shaders without writing GLSL/WGSL code.

### Node Geometry Editor (`@babylonjs/node-geometry-editor`)
Visual editor for creating **procedural geometry**. Users connect geometry generation, transformation, and combination blocks to build meshes algorithmically.

### Node Particle Editor (`@babylonjs/node-particle-editor`)
Visual editor for designing **particle system behaviors**. Users connect emitter, force, color, size, and lifetime blocks to define particle effects.

### Node Render Graph Editor (`@babylonjs/node-render-graph-editor`)
Visual editor for composing **render graph pipelines**. Users connect rendering passes, post-processes, and output targets to define custom rendering workflows.

## Shared Infrastructure

All editors depend on **Shared UI Components** (`@dev/shared-ui-components`), which provides the underlying `nodeGraphSystem` primitives, color picker, split panes, and Fluent UI wrappers used across all editor tools.
