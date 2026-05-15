# GUI (`@babylonjs/gui`)

The GUI package provides a full-featured UI system for Babylon.js scenes, split into a 2D texture-based UI layer and a 3D world-space UI layer.

**Implementation:** `packages/dev/gui`

## Architecture Overview

The package has two distinct subsystems: **2D GUI** renders UI controls onto an `AdvancedDynamicTexture` as a texture overlay, while **3D GUI** places interactive controls directly in 3D scene space using meshes and specialized materials. Both share the concept of a `Control` hierarchy but differ in rendering approach.

## 2D GUI (`src/2D/`)

The 2D system renders UI elements as a texture applied to a full-screen plane or mapped onto a mesh.

### Controls (`2D/controls/`)
Standard UI widget library:
- **Layout containers** — `Grid`, `StackPanel`, `Rectangle`, `Ellipse`, `Container`
- **Text** — `TextBlock`, `InputText`, `InputPassword`
- **Buttons** — `Button`, `ToggleButton`
- **Images** — `Image`, `ImageBasedSlider`
- **Sliders** — `Slider`, `ImageBasedSlider`, `BaseSlider` (in `controls/sliders/`)
- **Scroll viewers** — `ScrollViewer`, `ScrollBar` (in `controls/scrollViewers/`)
- **Selectors** — `RadioButton`, `Checkbox`, `Selector`
- **Misc** — `Line`, `ColorPicker`, `DisplayGrid`, `VirtualKeyboard`, `FocusableButton`
- **Gradient** — Gradient fill helpers (in `controls/gradient/`)

### Frame Graph Integration (`2D/FrameGraph/`)
Integration with the core frame graph system for advanced rendering pipeline control over GUI rendering.

## 3D GUI (`src/3D/`)

The 3D system manages interactive UI controls placed in world space, commonly used for XR/VR interfaces.

### Controls (`3D/controls/`)
World-space interactive elements:
- **Buttons** — `Button3D`, `HolographicButton`, `TouchHolographicButton`
- **Panels** — `PlanePanel`, `CylinderPanel`, `SpherePanel`, `ScatterPanel`, `StackPanel3D`
- **Sliders** — `Slider3D`, `TouchHolographicSlider`
- **Misc** — `MeshButton3D`, `NearMenu`, `HandMenu`, `TouchButton3D`
- **Base** — `Control3D`, `Container3D`, `VolumeBasedPanel`

### Behaviors (`3D/behaviors/`)
Reusable interaction behaviors for 3D controls (e.g., follow behavior, surface magnetism).

### Gizmos (`3D/gizmos/`)
Manipulation gizmos specific to 3D GUI elements.

### Materials (`3D/materials/`)
Specialized materials for holographic-style 3D UI:
- **`fluent/`** — Fluent Design–style material base
- **`fluentBackplate/`** — Backplate material for holographic panels
- **`fluentButton/`** — Button-specific Fluent material
- **`handle/`** — Handle/affordance material
- **`mrdl/`** — Mixed Reality Design Language materials for panels, sliders, and interactive widgets
