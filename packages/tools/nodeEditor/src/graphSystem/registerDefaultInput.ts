import { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialConnectionPoint } from "core/Materials/Node/nodeMaterialBlockConnectionPoint";
import type { GlobalState } from "../globalState";
import type { INodeContainer } from "shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { BlockNodeData } from "./blockNodeData";

export const RegisterDefaultInput = (stateManager: StateManager) => {
    stateManager.createDefaultInputData = (rootData: any, portData: IPortData, nodeContainer: INodeContainer) => {
        const point = portData.data as NodeMaterialConnectionPoint;
        const customInputBlock = point.createCustomInputBlock();
        let pointName = "output";
        let emittedBlock;

        if (!customInputBlock) {
            if (point.type === NodeMaterialBlockConnectionPointTypes.AutoDetect) {
                return null;
            }
            emittedBlock = new InputBlock(NodeMaterialBlockConnectionPointTypes[point.type], undefined, point.type);
        } else {
            [emittedBlock, pointName] = customInputBlock;
        }

        const nodeMaterial = (rootData as GlobalState).nodeMaterial;
        nodeMaterial.attachedBlocks.push(emittedBlock);
        if (!emittedBlock.isInput) {
            emittedBlock.autoConfigure(nodeMaterial);
        }

        return {
            data: new BlockNodeData(emittedBlock, nodeContainer),
            name: pointName,
        };
    };
};
