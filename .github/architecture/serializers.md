# Serializers (`@babylonjs/serializers`)

The serializers package provides scene and mesh export plugins for saving Babylon.js content to various 3D file formats.

**Implementation:** `packages/dev/serializers`

## Architecture Overview

The package is a thin barrel-export collection of format-specific exporters. Each format is isolated in its own directory with its own serializer/exporter implementation. There is no shared serializer abstraction — each format implements its own export logic tailored to the target format's requirements.

## Supported Export Formats

| Format | Directory | Description |
|---|---|---|
| glTF 2.0 | `src/glTF/` | Full glTF 2.0 scene/file exporter with extension support |
| OBJ | `src/OBJ/` | Wavefront OBJ mesh exporter |
| STL | `src/stl/` | STL mesh export for 3D printing workflows |
| USDZ | `src/USDZ/` | USDZ package exporter for Apple's AR ecosystem |
| BVH | `src/BVH/` | BVH animation/skeletal hierarchy exporter |
| 3MF | `src/3MF/` | 3D Manufacturing Format exporter |

## Key Pattern

Each directory contains a self-contained exporter that:
1. Takes Babylon.js scene objects (meshes, materials, animations) as input.
2. Converts the internal representation to the target format's data model.
3. Produces the output file(s) as a downloadable blob or data buffer.
