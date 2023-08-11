import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import type { INodeGeometryExecutionContext } from "../../Interfaces/nodeGeometryExecutionContext";
import type { VertexData } from "../../../mesh.vertexData";
import type { Vector3 } from "../../../../Maths/math.vector";

/**
 * Block used to set normals for a geometry
 */
export class SetNormalsBlock extends NodeGeometryBlock implements INodeGeometryExecutionContext {
    private _vertexData: VertexData;
    private _currentIndex: number;

    /**
     * Create a new SetNormalsBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("normals", NodeGeometryBlockConnectionPointTypes.Vector3);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    /**
     * Gets the current index in the current flow
     * @returns the current index
     */
    public getExecutionIndex(): number {
        return this._currentIndex;
    }

    /**
     * Gets the current face index in the current flow
     * @returns the current face index
     */
    public getExecutionFaceIndex(): number {
        return 0;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "SetNormalsBlock";
    }

    /**
     * Gets the geometry input component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the normals input component
     */
    public get normals(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeGeometryBuildState) {
        state.executionContext = this;

        this._vertexData = this.geometry.getConnectedValue(state);
        state.geometryContext = this._vertexData;

        if (!this._vertexData || !this._vertexData.positions) {
            state.executionContext = null;
            state.geometryContext = null;
            this.output._storedValue = null;
            return;
        }

        if (!this.normals.isConnected) {
            state.executionContext = null;
            state.geometryContext = null;
            this.output._storedValue = this._vertexData;
            return;
        }

        if (!this._vertexData.normals) {
            this._vertexData.normals = [];
        }

        // Processing
        const vertexCount = this._vertexData.positions.length / 3;
        for (this._currentIndex = 0; this._currentIndex < vertexCount; this._currentIndex++) {
            const tempVector3 = this.normals.getConnectedValue(state) as Vector3;
            if (tempVector3) {
                tempVector3.toArray(this._vertexData.normals, this._currentIndex * 3);
            }
        }

        // Storage
        this.output._storedValue = this._vertexData;
        state.executionContext = null;
        state.geometryContext = null;
    }
}

RegisterClass("BABYLON.SetNormalsBlock", SetNormalsBlock);
