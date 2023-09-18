import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryConnectionPoint } from "core/Meshes/Node/nodeGeometryBlockConnectionPoint";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";

export const RegisterDebugSupport = (stateManager: StateManager) => {
    stateManager.isDebugConnectionAllowed = (a, b) => {
        const pointA = a.portData.data as NodeGeometryConnectionPoint;
        const pointB = b.portData.data as NodeGeometryConnectionPoint;

        if (pointA.type === NodeGeometryBlockConnectionPointTypes.Geometry || pointB.type === NodeGeometryBlockConnectionPointTypes.Geometry) {
            return false; // We do not support debug on geometries
        }

        if (pointA.type === NodeGeometryBlockConnectionPointTypes.Texture || pointB.type === NodeGeometryBlockConnectionPointTypes.Texture) {
            return false; // We do not support debug on texture data
        }

        return true;
    };
};
