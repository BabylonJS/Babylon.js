import type { INodeContainer } from "shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";

export const RegisterDefaultInput = (stateManager: StateManager) => {
    stateManager.createDefaultInputData = (_rootData: any, _portData: IPortData, _nodeContainer: INodeContainer) => {
        // Flow graph blocks don't have a concept of auto-created input blocks.
        // Users add blocks explicitly from the node list.
        return null;
    };
};
