# Shared UI Components (`@babylonjs/shared-ui-components`)

The shared UI components package is a reusable React component library shared across all Babylon.js visual editors and tools.

**Implementation:** `packages/dev/sharedUiComponents`

## Architecture Overview

This package provides the common UI building blocks used by the Inspector, Node Editors, GUI Editor, Smart Filters Editor, and other tools. It includes both generic widgets and editor-specific primitives like the node graph system.

## Major Subsystems

### Node Graph System (`src/nodeGraphSystem/`)
Shared infrastructure for node-based graph editors. Provides the graph canvas, node rendering, connection drawing, port management, and interaction handling that all node editors build upon.

### Fluent Wrappers (`src/fluent/`)
Wrapper components around Fluent UI v9 that apply consistent sizing, density, and theming. Tools should use these wrappers instead of raw Fluent components to ensure uniform appearance and compact-mode support.

### Components (`src/components/`)
General-purpose shared controls and building blocks used across multiple tools.

### Color Picker (`src/colorPicker/`)
Reusable color selection UI with hex input, RGB sliders, and a visual color wheel/gradient.

### Lines (`src/lines/`)
Line and connector drawing helpers used in graph editors and property panels.

### Split Panes (`src/split/`)
Resizable split-pane layout components for dividing editor workspaces into panels.

### Tabs (`src/tabs/`)
Tabbed navigation and layout components for multi-panel editor interfaces.

### Images (`src/imgs/`)
Static image assets shared across tools.
