# Flow Graph Editor — Phase 2 Issues & Feature Requests

## Notes

Phase 1 issues are tracked in [ISSUES-Phase-1.md](ISSUES-Phase-1.md). This file covers gaps identified from a user-workflow perspective — what's missing when you actually sit down to build a flow graph for your scene.

When done with an issue, update the MANUAL.md to reflect the new feature or fix, and mark the issue as implemented (if applicable). If an issue is a bug, add a note in the manual about the expected behavior and how to reproduce it.

## Critical (blocks productive work)

- [ ] **No default scene — editor is unusable without external Playground snippet** — Opening the editor shows an empty preview with "Load a Playground snippet to preview the scene". There is no built-in default scene (box + camera + light), so you cannot start wiring logic without first creating a separate Playground snippet. Every session requires leaving the editor to set up a scene. **Expected:** The editor should create a minimal default scene (camera, light, ground, a few meshes) so users can immediately start experimenting with flow graph logic.

- [ ] **No local file loading (.glb/.gltf/.babylon drag-and-drop)** — The only way to get a scene is pasting a Playground snippet ID. Users cannot drag-and-drop a `.glb`, `.gltf`, or `.babylon` file onto the preview pane to use as their test scene. This forces every workflow through the Playground snippet server. **Expected:** Drag-and-drop (or a file picker) in the preview pane should load a local scene file using `SceneLoader`, extract meshes/lights/cameras into `SceneContext`, and allow flow graph authoring against it.

- [ ] **No glTF / KHR_interactivity round-trip** — The editor cannot import a glTF file containing an embedded flow graph (via the `KHR_interactivity` extension), nor export one. This is the primary production use-case for flow graphs — authoring interactive behavior that ships with a 3D asset. Currently the editor only works with its own JSON format and the Babylon snippet server. **Expected:** "Import glTF" loads both the scene and the flow graph from `KHR_interactivity`; "Export glTF" serializes the flow graph back into the extension. This enables the standard asset pipeline: author in editor → export glTF → load in any Babylon.js app.

## High (significantly impacts experience)

- [ ] **No "How to Use" code export dialog** — After saving a flow graph (to file or snippet), there is no guidance on how to actually load and run it in a user's own scene. A user who builds a flow graph in the editor has no idea what code to write to consume it. **Expected:** A "How to Use" / "Embed" button in the toolbar (next to Save File / Save Snippet) that opens a dialog with copy-to-clipboard code samples showing both integration methods:

    - **From snippet:** `FlowGraph.ParseFromSnippetAsync("<snippetId>", scene)` — pre-filled with the current snippet ID if the graph has been saved to the snippet server.
    - **From JSON file:** Loading the saved `.json` file and calling `FlowGraph.ParseFlowGraphAsync(data, { scene })`.

    The dialog should include minimal but complete boilerplate (import statements, async wrapper) so users can paste the code directly into their project.

- [ ] **No variables panel** — There is no way to see all graph variables at a glance, set initial values, rename them globally, or inspect current runtime values. Users must create `GetVariable`/`SetVariable` blocks and hope the variable names match across the graph. A typo in a variable name silently creates a separate variable. **Expected:** A "Variables" panel listing all variables defined in the graph with their name, type, and default value. Users should be able to add, rename, and delete variables from this panel. Renaming should propagate to all `GetVariable`/`SetVariable` blocks referencing that name.

- [ ] **No right-click context menu** — No context menu exists on the canvas, nodes, or links. The shared UI library has a `ContextMenu` primitive (`sharedUiComponents/src/fluent/primitives/contextMenu.tsx`) but the flow graph editor doesn't use it. Common operations require memorizing keyboard shortcuts. **Expected:** Right-click context menus for:

    - **Canvas:** Add block (opens search), Paste, Create sticky note, Create frame, Select all
    - **Node:** Delete, Duplicate, Add breakpoint/Remove breakpoint, Create frame from selection, Disconnect all ports
    - **Link:** Delete connection, Insert block on connection
    - **Frame:** Delete frame, Collapse/Expand, Export subgraph (future)

- [ ] **5 blocks missing from the editor palette** — These blocks exist in `FlowGraphBlockNames`, have tooltip descriptions written in `nodeListComponent.tsx`, but are absent from `allBlockNames.ts` so they never appear in the palette. All 5 are matrix-related data conversion blocks:

    - `TransformCoordinatesSystem` — transforms coordinates between local/world/view/projection spaces
    - `CombineMatrix2D` — constructs a 2D matrix from components
    - `CombineMatrix3D` — constructs a 3D matrix from components
    - `ExtractMatrix2D` — extracts components from a 2D matrix
    - `ExtractMatrix3D` — extracts components from a 3D matrix

    **Fix:** Add these 5 entries to the `Data_Conversion` category in `allBlockNames.ts`.

- [ ] **No composite block templates (pre-wired block groups)** — The KHR_interactivity glTF extension maps single interactivity nodes to groups of multiple Babylon.js flow graph blocks that must be instantiated together with pre-configured internal connections. For example, `pointer/interpolate` requires 4 blocks wired together (ValueInterpolation + JsonPointerParser + PlayAnimation + BezierCurveEasing), `pointer/get` and `pointer/set` each need 2 blocks (GetProperty/SetProperty + JsonPointerParser), and `animation/start` and `animation/stop` each need 3 blocks (PlayAnimation/StopAnimation + ArrayIndex + GLTFDataProvider). Currently these multi-block patterns only exist in the glTF loader's `declarationMapper.ts` as import-time wiring logic — there is no way to add them from the editor palette as a single drag-and-drop operation. **Expected:** A "composite block" or "block template" system that:

    - Defines a group of blocks with their internal connections as a reusable template (the `blocks[]` + `interBlockConnectors[]` + `typeToTypeMapping` structure in `declarationMapper.ts` is already a good model)
    - Appears in the block palette as a single entry (e.g., under a "Composites" or "glTF Interactivity" category)
    - When dropped onto the canvas, instantiates all constituent blocks, wires their internal connections, and optionally groups them in a frame
    - Exposes only the "external" ports (inputs/outputs not consumed by internal wiring) so the user sees a clean interface
      This is essential for glTF round-trip: when a user authors a flow graph that will be exported via KHR_interactivity, they need to build the same multi-block patterns that the importer produces. Without palette entries for these composites, users must manually recreate complex wiring that the spec treats as a single node.

- [ ] **No multiple execution context support** — A `FlowGraph` can have multiple `FlowGraphContext` instances, each representing an independent execution with its own variable state, connection values, and asset bindings. This is the core mechanism for running the same graph logic on different entities (e.g., the same "click to animate" behavior on 10 different meshes, each with its own state). The editor currently hardcodes `selectedContextIndex = 0` in `GlobalState` and never exposes context management to the user. The single context is auto-created by `flowGraph.start()` when none exist. **Expected:**
    - A **Contexts panel** (or dropdown in the toolbar) listing all execution contexts, showing their name/ID and key variable values at a glance
    - Ability to **create, delete, and rename** contexts
    - Ability to **configure per-context assets** — e.g., assign a different `assetsContext` (mesh set, animation groups) to each context so the same graph drives different objects
    - A **context switcher** that controls which context the debug tools inspect — breakpoints, value probes, and the debug overlay should reflect the selected context's execution state
    - Contexts should round-trip through serialization (already supported in core: `flowGraph.serialize()` includes all contexts, `ParseFlowGraphContext` restores them)

## Medium (quality-of-life improvements)

- [ ] **No port-level tooltips or descriptions** — Block-level tooltips in the palette are comprehensive (every block has a description). However, individual ports on nodes have no documentation. A user seeing ports named `a`, `b`, `val`, `res` gets no hint about what each expects or produces. **Expected:** Hover over a port to see a tooltip with the port name, data type, and a brief description (e.g., "a (Number): The left operand"). Port descriptions could come from the block's `_registerInput`/`_registerOutput` metadata.

- [ ] **No undo/redo buttons in the toolbar** — Undo/redo works via Ctrl+Z / Ctrl+Shift+Z, but there are no visible toolbar buttons. New users may not discover the feature exists. **Expected:** Undo and Redo icon buttons in the toolbar with disabled state when at the beginning/end of the history stack.

- [ ] **No toast/notification system for editor operations** — Errors and validation results only appear in the log panel at the bottom. Operations like "Graph saved", "Snippet loaded", "Validation passed (0 errors)" give no immediate visual feedback in the main workspace. Users must look at the log panel to know if an action succeeded. **Expected:** Brief toast notifications (auto-dismissing after 3–5 seconds) for key operations: save/load success/failure, validation summary, snippet ID copied, etc.

## Low (nice to have)

- [ ] **No Select All (Ctrl+A)** — There is no keyboard shortcut to select all nodes and frames on the canvas. Users must drag a selection box around the entire graph.

- [ ] **No align/distribute for selection** — `distributeGraph()` auto-layouts the entire graph via dagre, but there is no way to align or evenly distribute just the selected nodes (align left/right/top/bottom, distribute horizontally/vertically). Useful for tidying up sub-sections of a large graph.

- [ ] **No TypeScript support for Playground snippets** — The preview scene loader evaluates Playground code as JavaScript only (`eval()`). TypeScript snippets from the Playground are not transpiled before execution, causing them to fail silently. **Expected:** Detect TypeScript snippets and either transpile them or show a clear error message.
