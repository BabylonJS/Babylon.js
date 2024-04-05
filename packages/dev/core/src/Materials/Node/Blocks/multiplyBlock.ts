import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { RegisterClass } from "../../../Misc/typeStore";
import { BaseMathBlock } from "./baseMathBlock";

/**
 * Block used to multiply 2 values
 */
export class MultiplyBlock extends BaseMathBlock {
    /**
     * Creates a new MultiplyBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "MultiplyBlock";
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        state.compilationString += this._declareOutput(this.output, state) + ` = ${this.left.associatedVariableName} * ${this.right.associatedVariableName};\n`;

        return this;
    }
}

RegisterClass("BABYLON.MultiplyBlock", MultiplyBlock);
