import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';

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

        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color4);
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

    /** @hidden */
    public get _canAddAtVertexRoot(): boolean {
        return false;
    }

    /** @hidden */
    public get _canAddAtFragmentRoot(): boolean {
        return false;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        state.sharedData.hints.needAlphaTesting = true;

        state.compilationString += `if (${this.color.associatedVariableName}.a < ${this.alphaCutOff}) discard;\r\n`;

        return this;
    }
}