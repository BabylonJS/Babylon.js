import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialCompilationState } from '../../nodeMaterialCompilationState';

/**
 * Block used to read a texture from a sampler
 */
export class TextureBlock extends NodeMaterialBlock {
    /**
     * Create a new TextureBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerEntryPoint("uv", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerEntryPoint("texture", NodeMaterialBlockConnectionPointTypes.Texture);

        this.registerExitPoint("color", NodeMaterialBlockConnectionPointTypes.Color4);
    }

    /**
     * Compile the block
     * @param state defines the current compilation state
     */
    public compile(state: NodeMaterialCompilationState) {
        super.compile(state);

        let uvEntryPoint = this.entryPoints[0];
        let samplerEntryPoint = this.entryPoints[1];

        let output = this.exitPoints[0];

        state.compilationString += `vec4 ${output.associatedVariableName} = texture2D(${samplerEntryPoint.associatedVariableName}, ${uvEntryPoint.associatedVariableName});\r\n`;
    }
}