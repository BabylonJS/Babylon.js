import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialCompilationState } from 'Materials/Node/nodeMaterialCompilationState';

export class TextureBlock extends NodeMaterialBlock {
    public constructor(name: string) {
        super(name);

        this.registerEntryPoint("uv", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerEntryPoint("texture", NodeMaterialBlockConnectionPointTypes.Texture);

        this.registerExitPoint("color", NodeMaterialBlockConnectionPointTypes.Color4);
    }

    public compile(state: NodeMaterialCompilationState) {
        super.compile(state);

        let uvEntryPoint = this.entryPoints[0];
        let samplerEntryPoint = this.entryPoints[1];

        let output = this.exitPoints[0];

        state.compilationString += `vec4 ${output.associatedVariableName} = texture2D(${samplerEntryPoint.associatedVariableName}, ${uvEntryPoint.associatedVariableName});\r\n`;
    }
}