import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialCompilationState } from '../../nodeMaterialCompilationState';

/**
 * Block used to transform a vector4 with a matrix
 */
export class Vector4TransformBlock extends NodeMaterialBlock {

    /**
     * Creates a new Vector4TransformBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerEntryPoint("vector", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerEntryPoint("transform", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerExitPoint("output", NodeMaterialBlockConnectionPointTypes.Vector4);
    }

    /**
     * Compile the block
     * @param state defines the current compilation state
     */
    public compile(state: NodeMaterialCompilationState) {
        super.compile(state);

        let output = this._exitPoints[0];
        let vector = this._entryPoints[0];
        let transform = this._entryPoints[1];

        state.compilationString += `vec4 ${output.associatedVariableName} = ${transform.associatedVariableName} * ${vector.associatedVariableName};\r\n`;
    }
}