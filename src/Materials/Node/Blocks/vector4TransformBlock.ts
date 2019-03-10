import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';

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

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "Vector4TransformBlock";
    }

    /**
     * Gets the vector input
     */
    public get vector(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the matrix transform input
     */
    public get transform(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let output = this._outputs[0];
        let vector = this.vector;
        let transform = this.transform;

        state.compilationString += this._declareOutput(output, state) + ` = ${transform.associatedVariableName} * ${vector.associatedVariableName};\r\n`;

        return this;
    }
}