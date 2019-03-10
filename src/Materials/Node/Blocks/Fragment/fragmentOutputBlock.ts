import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';

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

        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color3OrColor4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "FragmentOutputBlock";
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
        return true;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let input = this.color;
        state.sharedData.hints.needAlphaBlending = this.alphaBlendingEnabled;

        if (input.connectedPoint!.type === NodeMaterialBlockConnectionPointTypes.Color3) {
            state.compilationString += `gl_FragColor = vec4(${input.associatedVariableName}, 1.0);\r\n`;
        } else {
            state.compilationString += `gl_FragColor = ${input.associatedVariableName};\r\n`;
        }

        return this;
    }
}