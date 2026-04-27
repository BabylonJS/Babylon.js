# Post-Processes (`@babylonjs/post-processes`)

The post-processes package provides additional screen-space visual effects beyond those included in core.

**Implementation:** `packages/dev/postProcesses`

## Architecture Overview

This is a small collection of standalone post-process effects. Each effect is isolated in its own directory with a post-process class and companion fragment shader. The effects plug into the core `PostProcess` pipeline.

## Effects

| Effect | Directory | Description |
|---|---|---|
| ASCII Art | `src/asciiArt/` | Renders the scene as ASCII characters |
| Digital Rain | `src/digitalRain/` | Matrix-style falling character rain effect |
| Edge Detection | `src/edgeDetection/` | Outline / edge-detection screen filter |

## Pattern

Each effect follows the same structure:
- A post-process class extending core's `PostProcess`
- A fragment shader file defining the GPU effect
- Registration for serialization support
