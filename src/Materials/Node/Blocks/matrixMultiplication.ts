import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../nodeMaterialBlockTargets';

/**
 * Block used to multiply two matrices
 */
export class MatrixMultiplicationBlock extends NodeMaterialBlock {
    /**
     * Creates a new MatrixMultiplicationBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Vertex);

        this.registerInput("left", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerInput("right", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "MatrixMultiplicationBlock";
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let output = this._outputs[0];
        let input0 = this._inputs[0];
        let input1 = this._inputs[1];

        state.compilationString += this._declareOutput(output, state) + ` = ${input0.associatedVariableName} * ${input1.associatedVariableName};\r\n`;

        return this;
    }
}