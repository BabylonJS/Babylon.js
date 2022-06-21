import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";

export const registerElbowSupport = (stateManager: StateManager) => {
    stateManager.isElbowConnectionAllowed = (a, b) => {
        const pointA = a.connectionPoint;
        const pointB = b.connectionPoint;

        if (pointA.type === NodeMaterialBlockConnectionPointTypes.Object || pointB.type === NodeMaterialBlockConnectionPointTypes.Object) {
            return false;  // We do not support Elbow on complex types
        }

        return true;
    }
}