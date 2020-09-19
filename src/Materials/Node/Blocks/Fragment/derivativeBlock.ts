import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../../Misc/typeStore';

/**
 * Block used to get the derivative value on x and y of a given input
 */
export class DerivativeBlock extends NodeMaterialBlock {
    /**
     * Create a new DerivativeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect, false);
        this.registerOutput("dx", NodeMaterialBlockConnectionPointTypes.BasedOnInput);
        this.registerOutput("dy", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._outputs[1]._typeConnectionSource = this._inputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "DerivativeBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the derivative output on x
     */
    public get dx(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the derivative output on y
     */
    public get dy(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let dx = this._outputs[0];
        let dy = this._outputs[1];

        state._emitExtension("derivatives", "#extension GL_OES_standard_derivatives : enable");

        if (dx.hasEndpoints) {
            state.compilationString += this._declareOutput(dx, state) + ` = dFdx(${this.input.associatedVariableName});\r\n`;
        }

        if (dy.hasEndpoints) {
            state.compilationString += this._declareOutput(dy, state) + ` = dFdy(${this.input.associatedVariableName});\r\n`;
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.DerivativeBlock"] = DerivativeBlock;