import { type FlowGraph } from "core/index";

/**
 * Launches the flow graph editor for the given flow graph, bound to the graph's own scene.
 * @param flowGraph The flow graph to edit.
 */
export async function EditFlowGraph(flowGraph: FlowGraph) {
    // The editor binds asset resolution and execution to the host scene. A flow graph always
    // knows its own scene, so we pass it through explicitly for clarity.
    await flowGraph.edit({ flowGraphEditorConfig: { hostScene: flowGraph.scene } });
}
