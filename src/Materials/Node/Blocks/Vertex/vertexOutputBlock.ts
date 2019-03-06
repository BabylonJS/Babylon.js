import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialCompilationState } from '../../nodeMaterialCompilationState';

/**
 * Block used to output the vertex position
 */
export class VertexOutputBlock extends NodeMaterialBlock {

    /**
     * Creates a new VertexOutputBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerEntryPoint("vector", NodeMaterialBlockConnectionPointTypes.Vector3);
    }

    /**
     * Compile the block
     * @param state defines the current compilation state
     */
    public compile(state: NodeMaterialCompilationState) {
        super.compile(state);

        let entryPoint = this.entryPoints[0];

        state.compilationString += `gl_Position = ${entryPoint.associatedVariableName};\r\n`;
    }
}