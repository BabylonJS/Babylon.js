import { type FlowGraph } from "core/index";

/**
 * Launches the flow graph editor for the given flow graph, bound to the graph's own scene.
 * @param flowGraph The flow graph to edit.
 */
export async function EditFlowGraph(flowGraph: FlowGraph) {
    // Unlike the other editors (GUI/NME/NGE/NRGE/NPE), the flow graph editor has no published npm
    // package, so it cannot be referenced through the standard dynamic import form. It is instead
    // launched through the core `edit()` entry point, which lazy-loads the editor bundle from
    // `FlowGraph.EditorURL`. Switch to a dynamic import once an editor package is published.
    await flowGraph.edit({ flowGraphEditorConfig: { hostScene: flowGraph.scene, attachToLiveScene: true } });
}
