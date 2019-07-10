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

        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Vector2OrVector3OrColor3OrVector4OrColor4);
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

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let input = this.color;
        state.sharedData.hints.needAlphaBlending = this.alphaBlendingEnabled;

        if (input.connectedPoint && input.connectedPoint!.type === NodeMaterialBlockConnectionPointTypes.Vector2) {
            state.compilationString += `gl_FragColor = vec4(${input.associatedVariableName}.r, ${input.associatedVariableName}.g, 0., 1.0);\r\n`;
        } else if (input.connectedPoint && (input.connectedPoint!.type === NodeMaterialBlockConnectionPointTypes.Color3 || input.connectedPoint!.type === NodeMaterialBlockConnectionPointTypes.Vector3)) {
            state.compilationString += `gl_FragColor = vec4(${input.associatedVariableName}, 1.0);\r\n`;
        } else {
            state.compilationString += `gl_FragColor = ${input.associatedVariableName};\r\n`;
        }

        return this;
    }
}