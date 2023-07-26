import type { Nullable } from "../../types";
import type { VertexData } from "../mesh.vertexData";
import type { NodeGeometryConnectionPoint } from "./nodeGeometryBlockConnectionPoint";
import { NodeGeometryContextualSources } from "./Enums/nodeGeometryContextualSources";
import { Vector3 } from "../../Maths/math.vector";
import type { INodeGeometryExecutionContext } from "./Interfaces/nodeGeometryExecutionContext";

/**
 * Class used to store node based geometry build state
 */
export class NodeGeometryBuildState {
    public notConnectedNonOptionalInputs: NodeGeometryConnectionPoint[] = [];
    public buildId: number;
    public verbose: boolean;
    public vertexData: Nullable<VertexData> = null;
    public geometryContext: Nullable<VertexData> = null;
    public executionContext: Nullable<INodeGeometryExecutionContext> = null;

    /**
     * Gets the value associated with a contextual source
     * @param source Source of the contextual value
     * @returns the value associated with the source
     */
    getContextualValue(source: NodeGeometryContextualSources) {
        if (!this.executionContext || !this.geometryContext) {
            return null;
        }

        switch(source) {
            case NodeGeometryContextualSources.Positions:
                return Vector3.FromArray(this.geometryContext.positions as ArrayLike<number>, this.executionContext.getExecutionIndex() * 3);
                break;
        }

        return null;
    }

    /**
     * Emits console errors and exceptions if there is a failing check
     */
    public emitErrors() {
        let errorMessage = "";

        for (const notConnectedInput of this.notConnectedNonOptionalInputs) {
            errorMessage += `input ${notConnectedInput.name} from block ${
                notConnectedInput.ownerBlock.name
            }[${notConnectedInput.ownerBlock.getClassName()}] is not connected and is not optional.\r\n`;
        }

        if (errorMessage) {
            throw "Build of NodeGeometry failed:\r\n" + errorMessage;
        }
    }
}
