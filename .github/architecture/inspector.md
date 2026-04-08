# Inspector (`@babylonjs/inspector`)

The Inspector is a React-based debugging and development tool for Babylon.js scenes. It provides a scene explorer, property editors, performance monitoring, and various specialized panes.

**Implementation:** `packages/dev/inspector-v2`

## Architecture Overview

The Inspector is built with **React 18** and **Fluent UI v9**. It uses a modular service-container architecture where features are registered as services and rendered into a shell with a toolbar, side panes, and extensible panels. The tool can be embedded in any Babylon.js application or launched as a standalone debug layer.

## Major Subsystems

### Components (`src/components/`)
React UI components for the main panels:
- **Scene Explorer** (`components/scene/sceneExplorer.tsx`) — Tree view of all scene entities with search, drag-drop, and virtualized rendering.
- **Properties Pane** (`components/properties/propertiesPane.tsx`) — Context-sensitive property editor using an extensible accordion layout.
- **Curve Editor** — Animation curve editing interface.

### Services (`src/services/`)
Core inspector services organized by pane type:
- **Scene pane services** (`services/panes/scene/`) — Scene explorer panels for nodes, materials, textures, sounds, skeletons, etc.
- **Properties pane services** (`services/panes/properties/`) — Property editors for scene, node, camera, material, texture, physics, animation, etc.
- **Tools pane** (`services/panes/tools/`) — Capture, export, and import utilities.
- **Debug pane** (`services/panes/debug/`) — Debug visualization services.
- **Stats pane** (`services/panes/stats/`) — Performance metrics display.
- **Curve Editor pane** (`services/panes/curveEditor/`) — Animation curve editor service.
- **Performance Viewer pane** (`services/panes/performanceViewer/`) — Runtime performance analysis.
- **Texture Editor pane** (`services/panes/textureEditor/`) — Texture inspection and editing.

### Modularity (`src/modularity/`)
Service container and service definition infrastructure. The Inspector registers all features as composable services that can be discovered, instantiated, and wired together at runtime.

### Extensibility (`src/extensibility/`, `src/extensions/`)
Runtime extension system allowing third-party code to add custom panes, panels, and property editors to the Inspector.

### Contexts (`src/contexts/`)
React contexts for shared state: settings, watcher state, extension manager, selection, and theme.

### Hooks (`src/hooks/`)
Reusable React hooks for observables, polling, settings persistence, resource management, and theming.

### Instrumentation (`src/instrumentation/`)
Utilities for instrumenting Babylon.js functions and properties to enable live monitoring and editing in the Inspector.

### Legacy (`src/legacy/`)
Backward-compatibility layer for the older Inspector / Debug Layer API.

### Themes (`src/themes/`)
Theme definitions and Fluent UI styling configuration.

## Key Patterns

- Uses **`makeStyles`** from Fluent UI (Griffel) for styling; inline `style` attributes are discouraged.
- Shared UI primitives come from **`@dev/shared-ui-components`** wrappers, not raw Fluent components.
- Persistence uses **`ISettingsStore`** for saving user preferences.
- Icons must be **unsized Fluent icons** with Fluent spacing tokens.
