import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialCompilationState } from 'Materials/Node/nodeMaterialCompilationState';

export class FragmentOutputBlock extends NodeMaterialBlock {
    public constructor(name: string) {
        super(name);

        this.registerEntryPoint("color", NodeMaterialBlockConnectionPointTypes.Color4);
    }

    public compile(state: NodeMaterialCompilationState) {
        super.compile(state);

        let entryPoint = this.entryPoints[0];

        state.compilationString += `gl_FragColor = ${entryPoint.associatedVariableName};\r\n`;
    }
}