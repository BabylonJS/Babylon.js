import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialCompilationState } from 'Materials/Node/nodeMaterialCompilationState';

export class VertexOutputBlock extends NodeMaterialBlock {
    public constructor(name: string) {
        super(name);

        this.registerEntryPoint("vector", NodeMaterialBlockConnectionPointTypes.Vector3);
    }

    public compile(state: NodeMaterialCompilationState) {
        super.compile(state);

        let entryPoint = this.entryPoints[0];

        state.compilationString += `gl_Position = ${entryPoint.associatedVariableName};\r\n`;
    }
}