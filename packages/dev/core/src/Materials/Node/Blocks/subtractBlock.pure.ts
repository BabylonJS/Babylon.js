/** This file must only contain pure code and pure imports */

import { type NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { BaseMathBlock } from "./baseMathBlock";
import { RegisterClass } from "../../../Misc/typeStore";

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
    public override getClassName() {
        return "SubtractBlock";
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];

        state.compilationString += state._declareOutput(output) + ` = ${this.left.associatedVariableName} - ${this.right.associatedVariableName};\n`;

        return this;
    }
}

let _Registered = false;
/**
 * Register side effects for subtractBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterSubtractBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass("BABYLON.SubtractBlock", SubtractBlock);
}
