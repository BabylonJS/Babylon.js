# Lottie Player (`@babylonjs/lottie-player`)

The Lottie player package provides a runtime player for Lottie animations within Babylon.js.

**Implementation:** `packages/dev/lottiePlayer`

## Architecture Overview

The package is structured like a small rendering engine, with a parsing layer that reads Lottie JSON, an internal node model that represents the animation structure, a math layer for transforms and interpolation, and a rendering layer that draws the result into the Babylon.js scene.

## Major Subsystems

### Parsing (`src/parsing/`)
Lottie JSON parsing and conversion into the internal data model. Handles the Lottie animation format specification and translates it into the player's internal representation.

### Nodes (`src/nodes/`)
Internal animation node/data model. Represents the hierarchical structure of a Lottie animation (layers, shapes, transforms, effects) as a tree of typed nodes.

### Maths (`src/maths/`)
Geometry, interpolation, and timing helpers. Provides the mathematical operations needed for transform calculations, keyframe interpolation, and animation timing.

### Rendering (`src/rendering/`)
Animation playback and rendering pipeline. Traverses the node tree, evaluates animations at the current time, and renders the result using Babylon.js rendering primitives.
