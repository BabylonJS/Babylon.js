# 14 — event/onSelect (pointer clicks on models)

Date: 2026-06-24
Branch: `khr-interactivity-importer-v2`

## Symptom
Interactivity models from `glTF-Test-Assets-Interactivity/Models` (WhackAMole, Calculator, Puzzle,
TrafficLight, …) did not respond to pointer clicks in the sandbox.

## Root cause
Those models trigger interactions with **`event/onSelect`** (extension `KHR_node_selectability`), which
had **no mapping** in `declarationMapper.ts` (only mentioned in a comment). Unmapped ops become no-ops
(spec 3.2.4 guard), so the click flow was dropped and clicking did nothing.

The op is declared WITH the extension, e.g.:
`{ "op": "event/onSelect", "extension": "KHR_node_selectability",
   "outputValueSockets": { "selectedNode": ref, "selectionRayOrigin": float3,
                           "selectionPoint": float3, "controllerIndex": int } }`
and each node has a `configuration.nodeIndex` selecting which glTF node is clickable.

## Fix
Map `event/onSelect` to the existing `FlowGraphMeshPickEventBlock`, resolving the configured node to a
Babylon mesh via the same 3-block composition used by `animation/start`:
`[MeshPickEvent, ArrayIndex, FlowGraphGLTFDataProvider]`.
- The data provider exposes `nodes` (glTF node index → Babylon node).
- `ArrayIndex` picks `nodes[nodeIndex]`, feeding the mesh-pick block's `asset` input.
- Output sockets: `selectedNode`→`pickedMesh`, `selectionPoint`→`pickedPoint`,
  `selectionRayOrigin`→`pickOrigin`, `controllerIndex`→`pointerId`; flow `out`→`done`.
- Mapping lives in `gltfExtensionsToFlowGraphMapping["KHR_node_selectability"]` (NOT the plain table),
  because the lookup keys extension ops by `extensions[extension][op]`.

The `nodeIndex` is a node **configuration**, so it is routed to the ArrayIndex block's config
(`configuration: { nodeIndex: { name: "index", toBlock: ArrayIndex } }`). To consume it,
`FlowGraphArrayIndexBlock` now reads an optional `config.index` (via `getNumericValue`) as the default
for its `index` data input — backward compatible (existing callers feed `index` as a value input).

At runtime the FlowGraph coordinator already dispatches `scene.onPointerObservable` POINTERPICK as a
MeshPick event (flowGraphSceneEventCoordinator), and glTF meshes are pickable by default, so the wiring
completes end-to-end.

## Files
- `packages/dev/core/src/FlowGraph/Blocks/Data/Utils/flowGraphArrayIndexBlock.pure.ts` (config.index)
- `packages/dev/loaders/src/glTF/2.0/Extensions/KHR_interactivity/declarationMapper.ts` (KHR_node_selectability/event/onSelect)

## Verification
- New loaders unit tests: `event/onSelect` fires the flow when its configured node mesh is picked, and
  does NOT fire when a different mesh is picked.
- FlowGraph + Interactivity unit suites: 516/516 (no regression from the ArrayIndex change).
- Sandbox: WhackAMole loads and renders cleanly (0 errors); moles are the onSelect targets.

## Notes / follow-ups
- `selectedNode` is exposed as the Babylon mesh (ref). `controllerIndex`/`pointerId` is the pointer id.
- KHR_node_selectability `selectable` toggling (disabling selection) is not yet honored — onSelect fires
  on any pick of the node. Fine for the current models; a future refinement could gate on selectability.
