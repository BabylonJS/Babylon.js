import type { Nullable } from "../../types";
import type { VertexData } from "../mesh.vertexData";
import type { NodeGeometryConnectionPoint } from "./nodeGeometryBlockConnectionPoint";
import { NodeGeometryContextualSources } from "./Enums/nodeGeometryContextualSources";
import { Matrix, Vector2, Vector3, Vector4 } from "../../Maths/math.vector";
import type { INodeGeometryExecutionContext } from "./Interfaces/nodeGeometryExecutionContext";
import { NodeGeometryBlockConnectionPointTypes } from "./Enums/nodeGeometryConnectionPointTypes";

/**
 * Class used to store node based geometry build state
 */
export class NodeGeometryBuildState {
    private _rotationMatrix = new Matrix();
    private _scalingMatrix = new Matrix();
    private _positionMatrix = new Matrix();
    private _scalingRotationMatrix = new Matrix();
    private _transformMatrix = new Matrix();
    private _tempVector3 = new Vector3();

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

        const index = this.executionContext.getExecutionIndex();

        switch (source) {
            case NodeGeometryContextualSources.Positions:
                if (!this.geometryContext.positions) {
                    return Vector3.Zero();
                }
                return Vector3.FromArray(this.geometryContext.positions as ArrayLike<number>, index * 3);
            case NodeGeometryContextualSources.Normals:
                if (!this.geometryContext.normals) {
                    return Vector3.Zero();
                }
                return Vector3.FromArray(this.geometryContext.normals as ArrayLike<number>, index * 3);
            case NodeGeometryContextualSources.Colors:
                if (!this.geometryContext.colors) {
                    return Vector4.Zero();
                }
                return Vector4.FromArray(this.geometryContext.colors as ArrayLike<number>, index * 4);
            case NodeGeometryContextualSources.Tangents:
                if (!this.geometryContext.tangents) {
                    return Vector4.Zero();
                }
                return Vector4.FromArray(this.geometryContext.tangents as ArrayLike<number>, index * 4);
        }

        return null;
    }

    /**
     * Adapt a value to a target type
     * @param source defines the value to adapt
     * @param targetType defines the target type
     * @returns the adapted value
     */
    adapt(source: NodeGeometryConnectionPoint, targetType: NodeGeometryBlockConnectionPointTypes) {
        const value = source.getConnectedValue(this);

        if (source.type === targetType) {
            return value;
        }

        switch (targetType) {
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
     * Adapt an input value to a target type
     * @param source defines the value to adapt
     * @param targetType defines the target type
     * @param defaultValue defines the default value to use if not connected
     * @returns the adapted value
     */
    adaptInput(source: NodeGeometryConnectionPoint, targetType: NodeGeometryBlockConnectionPointTypes, defaultValue: any) {
        if (!source.isConnected) {
            return source.notConnectedValue || defaultValue;
        }

        const value = source.getConnectedValue(this);

        if (source._connectedPoint?.type === targetType) {
            return value;
        }

        switch (targetType) {
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

    /** @hidden */
    public _instantiate(clone:VertexData, currentPosition: Vector3, rotation: Vector3, scaling: Vector3, additionalVertexData: VertexData[]) {
            // Transform
            Matrix.ScalingToRef(scaling.x, scaling.y, scaling.z, this._scalingMatrix);
            Matrix.RotationYawPitchRollToRef(rotation.y, rotation.x, rotation.z, this._rotationMatrix);
            Matrix.TranslationToRef(
                currentPosition.x, currentPosition.y, currentPosition.z,
                this._positionMatrix
            );

            this._scalingMatrix.multiplyToRef(this._rotationMatrix, this._scalingRotationMatrix);
            this._scalingRotationMatrix.multiplyToRef(this._positionMatrix, this._transformMatrix);
            for (let clonePositionIndex = 0; clonePositionIndex < clone.positions!.length; clonePositionIndex += 3) {
                this._tempVector3.fromArray(clone.positions!, clonePositionIndex);
                Vector3.TransformCoordinatesToRef(this._tempVector3, this._transformMatrix, this._tempVector3);
                this._tempVector3.toArray(clone.positions!, clonePositionIndex);

                if (clone.normals) {
                    this._tempVector3.fromArray(clone.normals, clonePositionIndex);
                    Vector3.TransformNormalToRef(this._tempVector3, this._scalingRotationMatrix, this._tempVector3);
                    this._tempVector3.toArray(clone.normals, clonePositionIndex);
                }
            }

            additionalVertexData.push(clone);
    }
}
