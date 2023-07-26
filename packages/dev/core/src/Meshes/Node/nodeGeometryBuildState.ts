import type { Nullable } from "../../types";
import type { VertexData } from "../mesh.vertexData";
import type { NodeGeometryConnectionPoint } from "./nodeGeometryBlockConnectionPoint";
import { NodeGeometryContextualSources } from "./Enums/nodeGeometryContextualSources";
import { Vector2, Vector3, Vector4 } from "../../Maths/math.vector";
import type { INodeGeometryExecutionContext } from "./Interfaces/nodeGeometryExecutionContext";
import { NodeGeometryBlockConnectionPointTypes } from "./Enums/nodeGeometryConnectionPointTypes";

/**
 * Class used to store node based geometry build state
 */
export class NodeGeometryBuildState {
    /** Gets or sets the list of non connected mandatory inputs */
    public notConnectedNonOptionalInputs: NodeGeometryConnectionPoint[] = [];
    /** Gets or sets the build identifier */
    public buildId: number;
    /** Gets or sets a boolean indicating that verbose mode is on */
    public verbose: boolean;
    /** Gets or sets the vertex data */
    public vertexData: Nullable<VertexData> = null;
    /** Gets or sets the geometry context */
    public geometryContext: Nullable<VertexData> = null;
    /** Gets or sets the execution context */
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

        const index = this.executionContext.getExecutionIndex() * 3;

        switch(source) {
            case NodeGeometryContextualSources.Positions:
                if (!this.geometryContext.positions) {
                    return Vector3.Zero();
                }
                return Vector3.FromArray(this.geometryContext.positions as ArrayLike<number>, index);
            case NodeGeometryContextualSources.Normals:
                if (!this.geometryContext.normals) {
                    return Vector3.Zero();
                }
                return Vector3.FromArray(this.geometryContext.normals as ArrayLike<number>, index);    
        }

        return null;
    }

    adapt(source: NodeGeometryConnectionPoint, target: NodeGeometryConnectionPoint) {
        const value = source.getConnectedValue(this);

        if (source.type === target.type) {
            return value;
        }

        switch(target.type) {
            case NodeGeometryBlockConnectionPointTypes.Vector2:
                return new Vector2(value, value);
            case NodeGeometryBlockConnectionPointTypes.Vector3:
                return new Vector3(value, value, value);
            case NodeGeometryBlockConnectionPointTypes.Vector4:
                return new Vector4(value, value, value, value);
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
