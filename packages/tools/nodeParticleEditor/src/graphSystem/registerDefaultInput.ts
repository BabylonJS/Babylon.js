import type { GlobalState } from "../globalState";
import type { INodeContainer } from "shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { BlockNodeData } from "./blockNodeData";
import type { NodeParticleConnectionPoint } from "core/Particles/Node/nodeParticleBlockConnectionPoint";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { ParticleInputBlock } from "core/Particles/Node/Blocks/particleInputBlock";

export const RegisterDefaultInput = (stateManager: StateManager) => {
    stateManager.createDefaultInputData = (rootData: any, portData: IPortData, nodeContainer: INodeContainer) => {
        const point = portData.data as NodeParticleConnectionPoint;
        const pointName = "output";

        if (point.type === NodeParticleBlockConnectionPointTypes.AutoDetect) {
            return null;
        }
        if (point.type === NodeParticleBlockConnectionPointTypes.Particle) {
            return null;
        }
        const emittedBlock = new ParticleInputBlock(NodeParticleBlockConnectionPointTypes[point.type], point.type);

        const nodeParticleSet = (rootData as GlobalState).nodeParticleSet;
        nodeParticleSet.attachedBlocks.push(emittedBlock);

        return {
            data: new BlockNodeData(emittedBlock, nodeContainer),
            name: pointName,
        };
    };
};
