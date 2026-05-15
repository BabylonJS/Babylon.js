# Accessibility (`@babylonjs/accessibility`)

The accessibility package provides DOM-based accessibility support for Babylon.js 3D scenes.

**Implementation:** `packages/tools/accessibility`

## Architecture Overview

The package renders HTML "twin" elements in the DOM that mirror the structure of 3D scene objects. These DOM twins make 3D content accessible to screen readers and enable keyboard navigation, bridging the gap between the canvas-rendered 3D world and assistive technologies.

## Major Subsystems

### HTML Twin (`src/HtmlTwin/`)
The core accessibility layer. Creates and maintains a parallel DOM tree that represents the 3D scene's interactive objects. Each significant scene entity gets a corresponding HTML element with appropriate ARIA attributes, labels, and keyboard event handlers.

### Legacy (`src/legacy/`)
Backward-compatibility code for older integration patterns.

## How It Works

1. The HTML Twin renderer observes the Babylon.js scene.
2. For each accessible scene object (meshes, controls, etc.), it creates a corresponding hidden HTML element.
3. These elements receive ARIA roles, labels (from `accessibilityTag` metadata), and tab indices.
4. Screen readers can traverse the DOM twins to announce scene content.
5. Keyboard focus and interaction events on the DOM twins are forwarded back to the 3D scene.
