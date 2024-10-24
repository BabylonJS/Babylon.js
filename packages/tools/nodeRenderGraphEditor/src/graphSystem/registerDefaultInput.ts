import type { GlobalState } from "../globalState";
import type { INodeContainer } from "shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { BlockNodeData } from "./blockNodeData";
import type { NodeRenderGraphConnectionPoint } from "core/FrameGraph/Node/nodeRenderGraphBlockConnectionPoint";
import { NodeRenderGraphBlockConnectionPointTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";
import { NodeRenderGraphInputBlock } from "core/FrameGraph/Node/Blocks/inputBlock";

export const RegisterDefaultInput = (stateManager: StateManager) => {
    stateManager.createDefaultInputData = (rootData: any, portData: IPortData, nodeContainer: INodeContainer) => {
        const point = portData.data as NodeRenderGraphConnectionPoint;
        const pointName = "output";
        const globalState = rootData as GlobalState;

        if (point.type === NodeRenderGraphBlockConnectionPointTypes.AutoDetect) {
            return null;
        }
        const emittedBlock = new NodeRenderGraphInputBlock(
            NodeRenderGraphBlockConnectionPointTypes[point.type],
            globalState.nodeRenderGraph.frameGraph,
            globalState.scene,
            point.type
        );

        const nodeRenderGraph = globalState.nodeRenderGraph;
        nodeRenderGraph.attachedBlocks.push(emittedBlock);
        if (!emittedBlock.isInput) {
            emittedBlock.autoConfigure();
        }

        return {
            data: new BlockNodeData(emittedBlock, nodeContainer),
            name: pointName,
        };
    };
};
