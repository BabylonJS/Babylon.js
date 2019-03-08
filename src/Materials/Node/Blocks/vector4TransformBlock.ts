import { NodeMaterialBlock, NodeMaterialBlockTargets } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialCompilationState } from '../nodeMaterialCompilationState';

/**
 * Block used to transform a vector4 with a matrix
 */
export class Vector4TransformBlock extends NodeMaterialBlock {

    /**
     * Creates a new Vector4TransformBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Vertex);

        this.registerInput("vector", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerInput("transform", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector4);
    }

    protected _buildBlock(state: NodeMaterialCompilationState) {
        super._buildBlock(state);

        let output = this._outputs[0];
        let vector = this._inputs[0];
        let transform = this._inputs[1];

        state.compilationString += this._declareOutput(output, state) + ` = ${transform.associatedVariableName} * ${vector.associatedVariableName};\r\n`;

        return this;
    }
}