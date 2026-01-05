import type { GlobalState } from "../globalState";
import type { INodeContainer } from "shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { BlockNodeData } from "./blockNodeData";
import type { NodeGeometryConnectionPoint } from "core/Meshes/Node/nodeGeometryBlockConnectionPoint";
import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";
import { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";

export const RegisterDefaultInput = (stateManager: StateManager) => {
    stateManager.createDefaultInputData = (rootData: any, portData: IPortData, nodeContainer: INodeContainer) => {
        const point = portData.data as NodeGeometryConnectionPoint;
        const pointName = "output";

        if (point.type === NodeGeometryBlockConnectionPointTypes.AutoDetect) {
            return null;
        }
        if (point.type === NodeGeometryBlockConnectionPointTypes.Geometry) {
            return null;
        }
        const emittedBlock = new GeometryInputBlock(NodeGeometryBlockConnectionPointTypes[point.type], point.type);

        const nodeGeometry = (rootData as GlobalState).nodeGeometry;
        nodeGeometry.attachedBlocks.push(emittedBlock);
        if (!emittedBlock.isInput) {
            emittedBlock.autoConfigure(nodeGeometry);
        }

        return {
            data: new BlockNodeData(emittedBlock, nodeContainer),
            name: pointName,
        };
    };
};
