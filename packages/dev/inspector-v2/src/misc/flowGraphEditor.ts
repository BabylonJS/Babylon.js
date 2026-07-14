import { type FlowGraph } from "core/index";

/**
 * Launches the flow graph editor for the given flow graph, bound to the graph's own scene.
 * @param flowGraph The flow graph to edit.
 */
export async function EditFlowGraph(flowGraph: FlowGraph) {
    // Like the node editors (NME/NGE/NRGE/NPE), the flow graph editor is launched through the core
    // `edit()` entry point, which lazy-loads the editor UMD bundle from the CDN. The "correct"
    // GUI-Editor-style dynamic ESM import (below) is not yet wired for these editors — see the
    // shared build-step limitation tracked in https://github.com/BabylonJS/Babylon.js/pull/17646.
    // const { FlowGraphEditor } = await import("flow-graph-editor/flowGraphEditor");
    // FlowGraphEditor.Show({ flowGraph, hostScene: flowGraph.scene, attachToLiveScene: true });
    await flowGraph.edit({ flowGraphEditorConfig: { hostScene: flowGraph.scene, attachToLiveScene: true } });
}
