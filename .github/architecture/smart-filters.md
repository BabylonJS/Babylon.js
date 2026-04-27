# Smart Filters (`@babylonjs/smart-filters`)

The smart filters package provides a graph-based engine for composing GPU image-processing pipelines.

**Implementation:** `packages/dev/smartFilters`

## Architecture Overview

A `SmartFilter` is a directed graph of **blocks** connected through **typed connection points**. The graph is compiled into a runtime that executes the pipeline by traversing from the output block, generating GPU commands, and managing render targets and shader compilation. The system supports serialization, optimization passes, and editor integration.

## Major Subsystems

### Block Foundation (`src/blockFoundation/`)
The core graph node model:
- **`BaseBlock`** — Abstract base for all blocks in the filter graph.
- **`InputBlock`** — Provides input values (textures, parameters) to the graph.
- **`OutputBlock`** — The final output node that produces the filtered result.
- **`ShaderBlock`** — Blocks that execute GPU shader programs.
- **`AggregateBlock`** — Composite blocks that encapsulate sub-graphs.

### Connection (`src/connection/`)
Typed connection points that link blocks together:
- Direction (input/output), data type, and compatibility checking.
- Runtime connection metadata for the execution pipeline.

### Command (`src/command/`)
Command generation layer that compiles the graph into a sequence of runtime operations (shader dispatches, render target binds, etc.).

### Runtime (`src/runtime/`)
Execution engine that:
- Traverses the compiled command sequence.
- Manages render target allocation and reuse.
- Handles shader compilation and initialization.
- Executes the filter pipeline each frame.

### Serialization (`src/serialization/`)
Save/load support for filter graphs. Serializers must be registered for each block type. The system throws if an unregistered block type is encountered.

### Optimization (`src/optimization/`)
Graph optimization and simplification passes that reduce the runtime cost of the filter pipeline (e.g., merging compatible blocks, reusing intermediate textures).

### Editor Utilities (`src/editorUtils/`)
Metadata and helper utilities used by the Smart Filters Editor for block display, property editing, and graph manipulation.

### Utilities (`src/utils/`)
Low-level helpers for texture sizing, render target management, and runtime support.

## Related Package

**Smart Filters Blocks** (`@babylonjs/smart-filters-blocks`, `packages/dev/smartFilterBlocks`) provides the built-in block library with 20+ effect blocks (pixelate, blur, exposure, contrast, green screen, glitch, composition, tint, etc.) organized into demo/effect namespaces.
