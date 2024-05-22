import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { RegisterClass } from "../../../Misc/typeStore";
import { BaseMathBlock } from "./baseMathBlock";

/**
 * Block used to add 2 vectors
 */
export class AddBlock extends BaseMathBlock {
    /**
     * Creates a new AddBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "AddBlock";
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];

        state.compilationString += state._declareOutput(output) + ` = ${this.left.associatedVariableName} + ${this.right.associatedVariableName};\n`;

        return this;
    }
}

RegisterClass("BABYLON.AddBlock", AddBlock);
