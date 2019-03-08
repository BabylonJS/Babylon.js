import { NodeMaterialBlock, NodeMaterialBlockTargets } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialCompilationState } from '../../nodeMaterialCompilationState';

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

    /** @hidden */
    public get _canAddAtVertexRoot(): boolean {
        return false;
    }

    /** @hidden */
    public get _canAddAtFragmentRoot(): boolean {
        return false;
    }

    protected _buildBlock(state: NodeMaterialCompilationState) {
        super._buildBlock(state);

        let input = this._inputs[0];

        state.compilationString += `if (${input.associatedVariableName}.a < ${this.alphaCutOff}) discard;\r\n`;

        return this;
    }
}