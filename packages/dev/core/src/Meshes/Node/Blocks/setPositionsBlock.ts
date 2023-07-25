import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import type { INodeGeometryExecutionContext } from "../Interfaces/nodeGeometryExecutionContext";
import { NodeGeometryContextualSources } from "../Enums/nodeGeometryContextualSources";
import type { VertexData } from "../../../Meshes/mesh.vertexData";
import { Vector3 } from "../../../Maths/math.vector";

/**
 * Block used to generate the final geometry
 */
export class SetPositionsBlock extends NodeGeometryBlock implements INodeGeometryExecutionContext{
    private _vertexData: VertexData;
    private _currentIndex: number;

    /**
     * Create a new SetPositionsBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("geometry", NodeGeometryBlockConnectionPointTypes.Geometry);
        this.registerInput("positions", NodeGeometryBlockConnectionPointTypes.Vector3);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Geometry);
    }

    getContextualValue(source: NodeGeometryContextualSources) {
        switch(source) {
            case NodeGeometryContextualSources.Positions:
                return Vector3.FromArray(this._vertexData.positions as ArrayLike<number>, this._currentIndex * 3);
                break;
        }

        return null;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "SetPositionsBlock";
    }    

    /**
     * Gets the geometry input component
     */
    public get geometry(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the positions input component
     */
    public get positions(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }    

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }    

    protected _buildBlock(state: NodeGeometryBuildState) {
        state.context = this;

        this._vertexData = this.geometry.getConnectedValue(state);
        
        if (!this._vertexData || !this._vertexData.positions) {
            state.context = null;
            this.output._storedValue = null;
            return;
        }

        // Processing
        const vertexCount = this._vertexData.positions.length / 3;
        for (this._currentIndex = 0; this._currentIndex < vertexCount; this._currentIndex++) {
            const tempVector3 = this.positions.getConnectedValue(state) as Vector3;
            tempVector3.toArray(this._vertexData.positions, this._currentIndex * 3);
        }

        // Storage
        this.output._storedValue = this._vertexData;
        state.context = null;
    }

}

RegisterClass("BABYLON.SetPositionsBlock", SetPositionsBlock);
