import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { RegisterClass } from "../../../Misc/typeStore";
import { BaseMathBlock } from "./baseMathBlock";

/**
 * Block used to subtract 2 vectors
 */
export class SubtractBlock extends BaseMathBlock {
    /**
     * Creates a new SubtractBlock
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
        return "SubtractBlock";
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        state.compilationString += this._declareOutput(this.output, state) + ` = ${this.left.associatedVariableName} - ${this.right.associatedVariableName};\n`;

        return this;
    }
}

RegisterClass("BABYLON.SubtractBlock", SubtractBlock);
