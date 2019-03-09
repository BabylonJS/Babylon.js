import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';

/**
 * Block used to output the final color
 */
export class FragmentOutputBlock extends NodeMaterialBlock {
    /**
     * Gets or sets a boolean indicating if this block will output an alpha value
     */
    public alphaBlendingEnabled = false;
    /**
     * Create a new FragmentOutputBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment, true);

        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "FragmentOutputBlock";
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

        let input = this._inputs[0];
        state.sharedData.hints.needAlphaBlending = this.alphaBlendingEnabled;

        state.compilationString += `gl_FragColor = ${input.associatedVariableName};\r\n`;

        return this;
    }
}