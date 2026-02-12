import type { NodeRenderGraph } from "core/index";

export async function EditNodeRenderGraph(nodeRenderGraph: NodeRenderGraph) {
    // TODO: Figure out how to get all the various build steps to work with this.
    //       See the initial attempt here: https://github.com/BabylonJS/Babylon.js/pull/17646
    // const { NodeRenderGraphEditor } = await import("node-render-graph-editor/nodeRenderGraphEditor");
    // NodeRenderGraphEditor.Show({ nodeRenderGraph: renderGraph, hostScene: frameGraph.scene });
    await nodeRenderGraph.edit({ nodeRenderGraphEditorConfig: { backgroundColor: nodeRenderGraph.getScene().clearColor, hostScene: nodeRenderGraph.getScene() } });
}
