//import type { NodeRenderGraphConnectionPoint } from "core/FrameGraph/Node/nodeRenderGraphBlockConnectionPoint";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";

export const RegisterElbowSupport = (stateManager: StateManager) => {
    stateManager.isElbowConnectionAllowed = (a, b) => {
        //const _pointA = a.portData.data as NodeRenderGraphConnectionPoint;
        //const _pointB = b.portData.data as NodeRenderGraphConnectionPoint;

        return true;
    };
};
