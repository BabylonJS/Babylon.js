import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialConnectionPoint } from "core/Materials/Node/nodeMaterialBlockConnectionPoint";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";

export const RegisterElbowSupport = (stateManager: StateManager) => {
    stateManager.isElbowConnectionAllowed = (a, b) => {
        const pointA = a.portData.data as NodeMaterialConnectionPoint;
        const pointB = b.portData.data as NodeMaterialConnectionPoint;

        if (pointA.type === NodeMaterialBlockConnectionPointTypes.Object || pointB.type === NodeMaterialBlockConnectionPointTypes.Object) {
            return false; // We do not support Elbow on complex types
        }

        return true;
    };
};
