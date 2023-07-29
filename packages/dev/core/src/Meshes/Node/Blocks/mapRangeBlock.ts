import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";

/**
 * Defines a block used to move a value from a range to another
 */
export class MapRangeBlock extends NodeGeometryBlock {
    /**
     * Create a new MapRangeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("value", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("fromMin", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("fromMax", NodeGeometryBlockConnectionPointTypes.Float, true, 1);
        this.registerInput("toMin", NodeGeometryBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("toMax", NodeGeometryBlockConnectionPointTypes.Float, true, 1);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(NodeGeometryBlockConnectionPointTypes.Geometry);
        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "MapRangeBlock";
    }

    /**
     * Gets the value input component
     */
    public get value(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the fromMin input component
     */
    public get fromMin(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the fromMax input component
     */
    public get fromMax(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the toMin input component
     */
    public get toMin(): NodeGeometryConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the toMax input component
     */
    public get toMax(): NodeGeometryConnectionPoint {
        return this._inputs[4];
    }    

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock() {
        if (!this.value.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        this.output._storedFunction = (state) => {
            const value = this.value.getConnectedValue(state);
            const fromMin = this.fromMin.getConnectedValue(state);
            const fromMax = this.fromMax.getConnectedValue(state);
            const toMin = this.toMin.getConnectedValue(state);
            const toMax = this.toMax.getConnectedValue(state);            

            return ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin;
        };
    }
}

RegisterClass("BABYLON.MapRangeBlock", MapRangeBlock);
