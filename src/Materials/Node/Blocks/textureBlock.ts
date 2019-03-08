import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialCompilationState } from '../nodeMaterialCompilationState';
import { NodeMaterialBlockTargets } from '../nodeMaterialBlockTargets';

/**
 * Block used to read a texture from a sampler
 */
export class TextureBlock extends NodeMaterialBlock {
    /**
     * Create a new TextureBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerInput("texture", NodeMaterialBlockConnectionPointTypes.Texture);

        this.registerOutput("color", NodeMaterialBlockConnectionPointTypes.Color4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "TextureBlock";
    }

    protected _buildBlock(state: NodeMaterialCompilationState) {
        super._buildBlock(state);

        let uvInput = this._inputs[0];
        let samplerInput = this._inputs[1];

        let output = this._outputs[0];

        state.compilationString += `vec4 ${output.associatedVariableName} = texture2D(${samplerInput.associatedVariableName}, ${uvInput.associatedVariableName});\r\n`;

        return this;
    }
}