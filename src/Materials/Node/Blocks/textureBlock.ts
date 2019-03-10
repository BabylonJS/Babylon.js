import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';

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

    /**
     * Gets the uv input component
     */
    public get uv(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the texture input component
     */
    public get texture(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }      

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let uvInput = this.uv;
        let samplerInput = this.texture;

        let output = this._outputs[0];

        state.compilationString += `vec4 ${output.associatedVariableName} = texture2D(${samplerInput.associatedVariableName}, ${uvInput.associatedVariableName});\r\n`;

        return this;
    }
}