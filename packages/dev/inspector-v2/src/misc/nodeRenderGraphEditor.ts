import { type NodeRenderGraph } from "core/index";

import { NodeRenderGraph as NodeRenderGraphClass } from "core/FrameGraph/Node/nodeRenderGraph";

export async function EditNodeRenderGraph(nodeRenderGraph: NodeRenderGraph) {
    const { NodeRenderGraphEditor } = await import("node-render-graph-editor/nodeRenderGraphEditor");
    NodeRenderGraphEditor.Show({
        nodeRenderGraph,
        hostScene: nodeRenderGraph.getScene(),
        customBlockDescriptions: NodeRenderGraphClass.CustomBlockDescriptions,
    });
}
