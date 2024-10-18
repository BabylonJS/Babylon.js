import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { BaseMathBlock } from "./baseMathBlock";

/**
 * Block used to divide 2 vectors
 */
export class DivideBlock extends BaseMathBlock {
    /**
     * Creates a new DivideBlock
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
        return "DivideBlock";
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];

        state.compilationString += state._declareOutput(output) + ` = ${this.left.associatedVariableName} / ${this.right.associatedVariableName};\n`;

        return this;
    }
}
