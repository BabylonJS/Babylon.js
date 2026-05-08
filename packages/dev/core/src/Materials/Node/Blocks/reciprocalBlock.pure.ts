/** This file must only contain pure code and pure imports */

import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import { type NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { type NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
/**
 * Block used to get the reciprocal (1 / x) of a value
 */
export class ReciprocalBlock extends NodeMaterialBlock {
    /**
     * Creates a new ReciprocalBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ReciprocalBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];

        if (this.input.type === NodeMaterialBlockConnectionPointTypes.Matrix) {
            state.compilationString += state._declareOutput(output) + ` = inverse(${this.input.associatedVariableName});\n`;
        } else {
            state.compilationString += state._declareOutput(output) + ` = 1. / ${this.input.associatedVariableName};\n`;
        }

        return this;
    }
}

let _Registered = false;
/**
 * Register side effects for reciprocalBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterReciprocalBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass("BABYLON.ReciprocalBlock", ReciprocalBlock);
}
