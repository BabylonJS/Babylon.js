/** This file must only contain pure code and pure imports */

import { type NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { BaseMathBlock } from "./baseMathBlock";
import { RegisterClass } from "../../../Misc/typeStore";

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
    public override getClassName() {
        return "MultiplyBlock";
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];

        state.compilationString += state._declareOutput(output) + ` = ${this.left.associatedVariableName} * ${this.right.associatedVariableName};\n`;

        return this;
    }
}

let _registered = false;
export function registerMultiplyBlock(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    RegisterClass("BABYLON.MultiplyBlock", MultiplyBlock);
}
