import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
/**
 * Block used to step a value
 */
export class StepBlock extends NodeMaterialBlock {
    /**
     * Creates a new StepBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("value", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("edge", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Float);
    }

    /**
     * @returns the current class name
     * @returns the class name
     */
    public getClassName() {
        return "StepBlock";
    }

    /**
     * @returns the value operand input component
     */
    public get value(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * @returns the edge operand input component
     */
    public get edge(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * @returns the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];

        state.compilationString += this._declareOutput(output, state) + ` = step(${this.edge.associatedVariableName}, ${this.value.associatedVariableName});\r\n`;

        return this;
    }
}

RegisterClass("BABYLON.StepBlock", StepBlock);
