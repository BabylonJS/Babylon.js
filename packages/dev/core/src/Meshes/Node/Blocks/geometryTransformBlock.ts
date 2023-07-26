import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { Vector3, Vector4 } from "../../../Maths";

/**
 * Block used to apply a transform to vector
 */
export class GeometryTransformBlock extends NodeGeometryBlock {
    /**
     * Create a new GeometryTransformBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("value", NodeGeometryBlockConnectionPointTypes.Vector3);
        this.registerInput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];        
        this._inputs[0].acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Vector4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "GeometryTransformBlock";
    }    

    /**
     * Gets the value input component
     */
    public get value(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the matrix input component
     */
    public get matrix(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }    

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }    

    protected _buildBlock(state: NodeGeometryBuildState) {
        if (!this.value.isConnected || !this.matrix.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        this.output._storedFunction = (state) => {
            const value = this.value.getConnectedValue(state);

            switch (this.value.type) {
                case NodeGeometryBlockConnectionPointTypes.Vector3:
                    return Vector3.TransformCoordinates(value, this.matrix.getConnectedValue(state));
                case NodeGeometryBlockConnectionPointTypes.Vector4:
                    return Vector4.TransformCoordinates(value, this.matrix.getConnectedValue(state));
                }

            return null;
        }
    }
}

RegisterClass("BABYLON.GeometryTransformBlock", GeometryTransformBlock);
