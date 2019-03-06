import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialCompilationState } from '../../nodeMaterialCompilationState';

/**
 * Block used to output the final color
 */
export class FragmentOutputBlock extends NodeMaterialBlock {
    /**
     * Create a new FragmentOutputBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerEntryPoint("color", NodeMaterialBlockConnectionPointTypes.Color4);
    }

    /**
     * Compile the block
     * @param state defines the current compilation state
     */
    public compile(state: NodeMaterialCompilationState) {
        super.compile(state);

        let entryPoint = this.entryPoints[0];

        state.compilationString += `gl_FragColor = ${entryPoint.associatedVariableName};\r\n`;
    }
}