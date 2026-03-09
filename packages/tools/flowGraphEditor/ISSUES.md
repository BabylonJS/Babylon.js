# Flow Graph Editor — Open Issues & Feature Requests

## Notes

When done with an issue, update the MANUAL.md to reflect the new feature or fix, and mark the issue as implemented (if applicable). If an issue is a bug, add a note in the manual about the expected behavior and how to reproduce it.

## Critical (blocks productive work)

- [x] **No Copy/Paste or Duplicate** — Can't duplicate blocks or groups of blocks. The keyboard handler has a placeholder that returns `null`. Users end up rebuilding identical subgraphs manually. _(Implemented — Ctrl+C/V clones blocks with config and default values; Ctrl+G creates smart groups with auto-exposed ports)_

- [x] **No runtime data inspection / value probes** — When the graph is running in the preview, there's no way to see what values are flowing through connections. Debug support is explicitly disabled (`RegisterDebugSupport` returns false). _(Implemented)_

- [x] **No graph validation before execution** — No check for unconnected required inputs, type mismatches, or unreachable blocks. The graph just fails silently at runtime. _(Implemented)_

## High (significantly impacts experience)

- [x] **No breakpoints or step-through execution** — You can Start/Pause/Stop the graph, but can't set a breakpoint on a block to pause there. Step-through execution would be invaluable for understanding complex control flow (ForLoop, Switch, MultiGate). _(Implemented)_

- [ ] **No minimap** — For large graphs, there's no spatial overview. Zoom-to-fit and reorganize exist, but no persistent minimap showing current position in the graph.

- [x] **No connection type-mismatch feedback at design time** — Port compatibility only checks data-vs-signal and direction, not the actual data type. Connecting a `Vector3` output to a `number` input doesn't warn — it just fails at runtime. _(Implemented — `checkCompatibilityState` now validates data types via `richType.typeName`. Incompatible connections are blocked with a descriptive error dialog. Ports glow red during drag when hovering over an incompatible target. Compatible type pairs: same type, Any↔anything, Number↔Integer, Quaternion←Vector3/Vector4/Matrix via typeTransformer.)_

- [x] **No Save/Load as Snippet** — No ability to save a flow graph as a snippet (to Share DB) or load one by snippet ID. This would enable easy sharing, embedding in Playgrounds, and quick iteration without manual file management. _(Implemented)_

- [x] **Several constructor config fields not editable in the panel** — Some blocks (like `FlowGraphInterpolationBlock` with `keyFramesCount`, `duration`, `animationType`; custom events with `eventId`/`eventData`; `FlowGraphGetAssetBlock` with `useIndexAsUniqueId`) have config fields that aren't exposed in the CONSTRUCTION VARIABLES panel. _(Implemented — added constructor config entries for InterpolationBlock (keyFramesCount, animationType), custom event blocks (eventId), BitwiseXorBlock, DoNBlock (startIndex), GetPropertyBlock (resetToDefaultWhenUndefined), and ForLoopBlock (initialIndex). GetAssetBlock was already covered by its dedicated property panel.)_

- [x] **No time-scale control for scene execution** — No way to slow down (or speed up) the scene while debugging the flow graph. A time-scale slider would let users observe execution step by step in slow motion, making it much easier to follow fast-running logic like animations, loops, and event chains. _(Implemented — Speed preset buttons in the toolbar: 0.1×, 0.25×, 0.5×, 1×)_

- [x] **Complex config fields need custom property panels** — Several blocks have constructor config fields with complex types that can't be edited with simple controls. _(Implemented — all phases completed via custom property panel components with in-place port mutation.)_

    - [x] **Phase 1a: Scene mesh picker for pointer/pick event blocks** — `PointerEventPropertyComponent` with mesh dropdown from `SceneContext.meshes`. Registered for all 6 blocks.

    - [x] **Phase 1b: AnimationGroup picker for PlayAnimationBlock** — `PlayAnimationPropertyComponent` with AnimationGroup dropdown from `SceneContext.animationGroups`.

    - [x] **Phase 2: Type-adaptive value editor for ConstantBlock** — `ConstantBlockPropertyComponent` with type selector and matching widget (Float, CheckBox, TextInput, Vector2/3, Color3/4, Matrix). Type changes update output richType.

    - [x] **Phase 3a: Numeric case list editor for SwitchBlock** — `SwitchBlockPropertyComponent` with add/remove controls. Uses `addCase()`/`removeCase()` mutation API + signal output cleanup.

    - [x] **Phase 3b: Numeric case list editor for DataSwitchBlock** — `DataSwitchPropertyComponent` with in-place port mutation (registerDataInput/removeDataInput + internal map updates).

    - [x] **Phase 3c: String list editor for SetVariableBlock (multi mode)** — `SetVariablePropertyComponent` handles both single and multi modes. Multi mode shows dynamic variable list with add/remove.

    - [x] **Phase 4: EventData editor for custom event blocks** — `CustomEventPropertyComponent` shared by Send and Receive blocks. Dynamic key-type list with add/remove. Uses in-place port mutation.

- [x] **`FlowGraphSendCustomEventBlock.getClassName()` returns wrong name** — `FlowGraphSendCustomEventBlock.getClassName()` returns `"FlowGraphReceiveCustomEventBlock"` instead of `"FlowGraphSendCustomEventBlock"`. This is a core-side bug that prevents the editor from distinguishing the two block types and giving them separate config panels. _(Fixed — corrected `getClassName()` and `RegisterClass` to use `FlowGraphBlockNames.SendCustomEvent`)_

## Medium (quality-of-life improvements)

- [ ] **No floating comment/note annotations** — Block-level comments exist, but free-floating sticky notes can't be placed on the canvas to document sections of the graph.

- [ ] **No nested frames** — Frames can group blocks, but can't be nested inside other frames for hierarchical organization of large graphs.

- [ ] **No "find in graph" / block search** — The block palette has search, but there's no way to search within the current graph to find a specific block by name or type (e.g., "find all GetVariable blocks").

- [ ] **No per-port default value editing for complex types** — The INPUT VALUES panel only handles primitives (number, boolean, string, FlowGraphInteger). Vector2/3/4, Color3/4, Matrix defaults can't be set inline without connected Constant blocks.

- [ ] **No export/import of subgraphs** — Frame export exists, but there's no library/template system to save reusable subgraphs and import them into other flow graphs.

## Low (nice to have)

- [ ] **No zoom slider or zoom-level indicator** — Users can scroll to zoom, but there's no visible zoom percentage or slider control.

- [ ] **No keyboard shortcuts panel** — No discoverable list of hotkeys. Users have to guess or read code.

- [ ] **No "recent" or "favorites" in the block palette** — Frequently-used blocks have no quick-access section; always requires search or drilling into categories.

- [ ] **No connection reroute/waypoint nodes** — Long connections crossing the graph can't be rerouted through waypoints for visual clarity.
