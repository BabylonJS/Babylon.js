import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";

/**
 * Defines a block used to convert from int to float
 */
export class IntFloatConverterBlock extends NodeGeometryBlock {
    /**
     * Create a new IntFloatConverterBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("float ", NodeGeometryBlockConnectionPointTypes.Float, true);
        this.registerInput("int ", NodeGeometryBlockConnectionPointTypes.Int, true);

        this.registerOutput("float", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("int", NodeGeometryBlockConnectionPointTypes.Int);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "IntFloatConverterBlock";
    }

    /**
     * Gets the float input component
     */
    public get floatIn(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the int input component
     */
    public get intIn(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the float output component
     */
    public get floatOut(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the int output component
     */
    public get intOut(): NodeGeometryConnectionPoint {
        return this._outputs[1];
    }

    protected override _inputRename(name: string) {
        if (name === "float ") {
            return "floatIn";
        }
        if (name === "int ") {
            return "intIn";
        }
        return name;
    }

    protected override _buildBlock() {
        this.floatOut._storedFunction = (state) => {
            if (this.floatIn.isConnected) {
                return this.floatIn.getConnectedValue(state);
            }
            if (this.intIn.isConnected) {
                return this.intIn.getConnectedValue(state);
            }

            return 0;
        };

        this.intOut._storedFunction = (state) => {
            if (this.floatIn.isConnected) {
                return Math.floor(this.floatIn.getConnectedValue(state));
            }
            if (this.intIn.isConnected) {
                return Math.floor(this.intIn.getConnectedValue(state));
            }

            return 0;
        };
    }
}

RegisterClass("BABYLON.IntFloatConverterBlock", IntFloatConverterBlock);
