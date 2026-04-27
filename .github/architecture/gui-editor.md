# GUI Editor (`@babylonjs/gui-editor`)

The GUI Editor is a visual layout tool for designing Babylon.js 2D GUI interfaces.

**Implementation:** `packages/tools/guiEditor`

## Architecture Overview

The GUI Editor is a React-based application with a diagram/canvas workspace for visual layout editing. Unlike the node-based editors, this tool focuses on spatial arrangement of GUI controls rather than graph connections.

## Major Subsystems

### Diagram (`src/diagram/`)
The main canvas/workspace subsystem for visual GUI layout editing. Handles control placement, selection, resizing, alignment, and hierarchy management on a 2D design surface.

### Components (`src/components/`)
React UI panels and editor controls — toolbars, property panels, control palette, and hierarchy views.

### Root Modules
- **`workbenchEditor.tsx`** — Main editor React component and app shell.
- **`guiEditor.ts`** — Public API and bootstrap entry point.
- **`guiNodeTools.ts`** / **`tools.ts`** — GUI control creation and manipulation utilities.
- **`keyboardManager.ts`** — Keyboard shortcut and input handling.
- **`controlTypes.ts`** / **`nodeLocationInfo.ts`** — GUI control metadata and positioning models.
- **`globalState.ts`** — Shared editor state management.

### Legacy (`src/legacy/`)
Backward-compatibility code for older editor integration.

### Styling (`src/scss/`)
SCSS stylesheets for the editor UI.

### Assets (`src/imgs/`)
Static image and icon assets.
