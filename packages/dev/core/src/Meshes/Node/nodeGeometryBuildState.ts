import type { Nullable } from "../../types";
import type { VertexData } from "../mesh.vertexData";
import type { NodeGeometryConnectionPoint } from "./nodeGeometryBlockConnectionPoint";
import { NodeGeometryContextualSources } from "./Enums/nodeGeometryContextualSources";
import { Matrix, Vector2, Vector3, Vector4 } from "../../Maths/math.vector";
import type { INodeGeometryExecutionContext } from "./Interfaces/nodeGeometryExecutionContext";
import { NodeGeometryBlockConnectionPointTypes } from "./Enums/nodeGeometryConnectionPointTypes";
import type { INodeGeometryInstancingContext } from "./Interfaces/nodeGeometryInstancingContext";

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
    /** Gets or sets the list of non contextual inputs having no contextudal data */
    public noContextualData: NodeGeometryContextualSources[] = [];
    /** Gets or sets the build identifier */
    public buildId: number;
    /** Gets or sets a boolean indicating that verbose mode is on */
    public verbose: boolean;
    /** Gets or sets the vertex data */
    public vertexData: Nullable<VertexData> = null;

    private _geometryContext: Nullable<VertexData> = null;
    private _executionContext: Nullable<INodeGeometryExecutionContext> = null;
    private _instancingContext: Nullable<INodeGeometryInstancingContext> = null;

    private _geometryContextStack: Array<Nullable<VertexData>> = [];
    private _executionContextStack: Array<Nullable<INodeGeometryExecutionContext>> = [];
    private _instancingContextStack: Array<Nullable<INodeGeometryInstancingContext>> = [];

    /** Gets or sets the geometry context */
    public get geometryContext() {
        return this._geometryContext;
    }

    /** Gets or sets the execution context */
    public get executionContext() {
        return this._executionContext;
    }

    /** Gets or sets the instancing context */
    public get instancingContext() {
        return this._instancingContext;
    }

    /**
     * Push the new active geometry context
     * @param geometryContext defines the geometry context
     */
    public pushGeometryContext(geometryContext: VertexData) {
        this._geometryContext = geometryContext;
        this._geometryContextStack.push(this._geometryContext);
    }

    /**
     * Push the new active execution context
     * @param executionContext defines the execution context
     */
    public pushExecutionContext(executionContext: INodeGeometryExecutionContext) {
        this._executionContext = executionContext;
        this._executionContextStack.push(this._executionContext);
    }

    /**
     * Push the new active instancing context
     * @param instancingContext defines the instancing context
     */
    public pushInstancingContext(instancingContext: INodeGeometryInstancingContext) {
        this._instancingContext = instancingContext;
        this._instancingContextStack.push(this._instancingContext);
    }

    /**
     * Remove current geometry context and restore the previous one
     */
    public restoreGeometryContext() {
        this._geometryContextStack.pop();
        this._geometryContext = this._geometryContextStack.length > 0 ? this._geometryContextStack[this._geometryContextStack.length - 1] : null;
    }

    /**
     * Remove current execution context and restore the previous one
     */
    public restoreExecutionContext() {
        this._executionContextStack.pop();
        this._executionContext = this._executionContextStack.length > 0 ? this._executionContextStack[this._executionContextStack.length - 1] : null;
    }

    /**
     * Remove current isntancing context and restore the previous one
     */
    public restoreInstancingContext() {
        this._instancingContextStack.pop();
        this._instancingContext = this._instancingContextStack.length > 0 ? this._instancingContextStack[this._instancingContextStack.length - 1] : null;
    }

    /**
     * Gets the value associated with a contextual source
     * @param source Source of the contextual value
     * @param skipWarning Do not store the warning for reporting if true
     * @returns the value associated with the source
     */
    public getContextualValue(source: NodeGeometryContextualSources, skipWarning = false) {
        if (!this.executionContext) {
            if (!skipWarning) {
                this.noContextualData.push(source);
            }
            return null;
        }

        const index = this.executionContext.getExecutionIndex();

        switch (source) {
            case NodeGeometryContextualSources.Positions:
                if (this.executionContext.getOverridePositionsContextualValue) {
                    return this.executionContext.getOverridePositionsContextualValue();
                }
                if (!this.geometryContext || !this.geometryContext.positions) {
                    return Vector3.Zero();
                }
                return Vector3.FromArray(this.geometryContext.positions as ArrayLike<number>, index * 3);
            case NodeGeometryContextualSources.Normals:
                if (this.executionContext.getOverrideNormalsContextualValue) {
                    return this.executionContext.getOverrideNormalsContextualValue();
                }
                if (!this.geometryContext || !this.geometryContext.normals) {
                    return Vector3.Zero();
                }
                return Vector3.FromArray(this.geometryContext.normals as ArrayLike<number>, index * 3);
            case NodeGeometryContextualSources.Colors:
                if (!this.geometryContext || !this.geometryContext.colors) {
                    return Vector4.Zero();
                }
                return Vector4.FromArray(this.geometryContext.colors as ArrayLike<number>, index * 4);
            case NodeGeometryContextualSources.Tangents:
                if (!this.geometryContext || !this.geometryContext.tangents) {
                    return Vector4.Zero();
                }
                return Vector4.FromArray(this.geometryContext.tangents as ArrayLike<number>, index * 4);
            case NodeGeometryContextualSources.UV:
                if (this.executionContext.getOverrideUVs1ContextualValue) {
                    return this.executionContext.getOverrideUVs1ContextualValue();
                }
                if (!this.geometryContext || !this.geometryContext.uvs) {
                    return Vector2.Zero();
                }
                return Vector2.FromArray(this.geometryContext.uvs as ArrayLike<number>, index * 2);
            case NodeGeometryContextualSources.UV2:
                if (!this.geometryContext || !this.geometryContext.uvs2) {
                    return Vector2.Zero();
                }
                return Vector2.FromArray(this.geometryContext.uvs2 as ArrayLike<number>, index * 2);
            case NodeGeometryContextualSources.UV3:
                if (!this.geometryContext || !this.geometryContext.uvs3) {
                    return Vector2.Zero();
                }
                return Vector2.FromArray(this.geometryContext.uvs3 as ArrayLike<number>, index * 2);
            case NodeGeometryContextualSources.UV4:
                if (!this.geometryContext || !this.geometryContext.uvs4) {
                    return Vector2.Zero();
                }
                return Vector2.FromArray(this.geometryContext.uvs4 as ArrayLike<number>, index * 2);
            case NodeGeometryContextualSources.UV5:
                if (!this.geometryContext || !this.geometryContext.uvs5) {
                    return Vector2.Zero();
                }
                return Vector2.FromArray(this.geometryContext.uvs5 as ArrayLike<number>, index * 2);
            case NodeGeometryContextualSources.UV6:
                if (!this.geometryContext || !this.geometryContext.uvs6) {
                    return Vector2.Zero();
                }
                return Vector2.FromArray(this.geometryContext.uvs6 as ArrayLike<number>, index * 2);
            case NodeGeometryContextualSources.VertexID:
                return index;
            case NodeGeometryContextualSources.FaceID:
                return this.executionContext.getExecutionFaceIndex();
            case NodeGeometryContextualSources.LoopID:
                return this.executionContext.getExecutionLoopIndex();
            case NodeGeometryContextualSources.InstanceID:
                return this.instancingContext ? this.instancingContext.getInstanceIndex() : 0;
            case NodeGeometryContextualSources.GeometryID:
                return !this.geometryContext ? 0 : this.geometryContext.uniqueId;
            case NodeGeometryContextualSources.CollectionID: {
                if (!this.geometryContext || !this.geometryContext.metadata) {
                    return 0;
                }
                return this.geometryContext.metadata.collectionId || 0;
            }
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
        const value = source.getConnectedValue(this) || 0;

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
            return source.value || defaultValue;
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
            }[${notConnectedInput.ownerBlock.getClassName()}] is not connected and is not optional.\n`;
        }

        for (const source of this.noContextualData) {
            errorMessage += `Contextual input ${NodeGeometryContextualSources[source]} has no context to pull data from (must be connected to a setXXX block or a instantiateXXX block).\n`;
        }

        if (errorMessage) {
            // eslint-disable-next-line no-throw-literal
            throw "Build of NodeGeometry failed:\n" + errorMessage;
        }
    }

    /** @internal  */
    public _instantiate(clone: VertexData, currentPosition: Vector3, rotation: Vector3, scaling: Vector3, additionalVertexData: VertexData[]) {
        // Transform
        Matrix.ScalingToRef(scaling.x, scaling.y, scaling.z, this._scalingMatrix);
        Matrix.RotationYawPitchRollToRef(rotation.y, rotation.x, rotation.z, this._rotationMatrix);
        Matrix.TranslationToRef(currentPosition.x, currentPosition.y, currentPosition.z, this._positionMatrix);

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

    /** @internal  */
    public _instantiateWithMatrix(clone: VertexData, transform: Matrix, additionalVertexData: VertexData[]) {
        for (let clonePositionIndex = 0; clonePositionIndex < clone.positions!.length; clonePositionIndex += 3) {
            this._tempVector3.fromArray(clone.positions!, clonePositionIndex);
            Vector3.TransformCoordinatesToRef(this._tempVector3, transform, this._tempVector3);
            this._tempVector3.toArray(clone.positions!, clonePositionIndex);

            if (clone.normals) {
                this._tempVector3.fromArray(clone.normals, clonePositionIndex);
                Vector3.TransformNormalToRef(this._tempVector3, transform, this._tempVector3);
                this._tempVector3.toArray(clone.normals, clonePositionIndex);
            }
        }

        additionalVertexData.push(clone);
    }

    /** @internal  */
    public _instantiateWithPositionAndMatrix(clone: VertexData, currentPosition: Vector3, transform: Matrix, additionalVertexData: VertexData[]) {
        Matrix.TranslationToRef(currentPosition.x, currentPosition.y, currentPosition.z, this._positionMatrix);
        transform.multiplyToRef(this._positionMatrix, this._transformMatrix);

        for (let clonePositionIndex = 0; clonePositionIndex < clone.positions!.length; clonePositionIndex += 3) {
            this._tempVector3.fromArray(clone.positions!, clonePositionIndex);
            Vector3.TransformCoordinatesToRef(this._tempVector3, this._transformMatrix, this._tempVector3);
            this._tempVector3.toArray(clone.positions!, clonePositionIndex);

            if (clone.normals) {
                this._tempVector3.fromArray(clone.normals, clonePositionIndex);
                Vector3.TransformNormalToRef(this._tempVector3, this._transformMatrix, this._tempVector3);
                this._tempVector3.toArray(clone.normals, clonePositionIndex);
            }
        }

        additionalVertexData.push(clone);
    }
}
