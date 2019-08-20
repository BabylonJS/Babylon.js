import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../../Misc/typeStore';

/**
 * Block used to add an alpha test in the fragment shader
 */
export class AlphaTestBlock extends NodeMaterialBlock {

    /**
     * Gets or sets the alpha value where alpha testing happens
     */
    public alphaCutOff = 0.4;

    /**
     * Create a new AlphaTestBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color4, true);
        this.registerInput("alpha", NodeMaterialBlockConnectionPointTypes.Float, true);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "AlphaTestBlock";
    }

    /**
     * Gets the color input component
     */
    public get color(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the alpha input component
     */
    public get alpha(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        state.sharedData.hints.needAlphaTesting = true;

        if (this.color.connectedPoint) {
            state.compilationString += `if (${this.color.associatedVariableName}.a < ${this.alphaCutOff}) discard;\r\n`;
        } else {
            state.compilationString += `if (${this.alpha.associatedVariableName} < ${this.alphaCutOff}) discard;\r\n`;
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.AlphaTestBlock"] = AlphaTestBlock;
