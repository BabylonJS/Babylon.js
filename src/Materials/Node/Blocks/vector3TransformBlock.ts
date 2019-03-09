import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../nodeMaterialBlockTargets';

/**
 * Block used to transform a vector3 with a matrix
 */
export class Vector3TransformBlock extends NodeMaterialBlock {
    /**
     * Defines the value to use to complement Vector3 to transform it to a Vector4
     */
    public complement = 1;

    /**
     * Creates a new Vector3TransformBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Vertex);

        this.registerInput("vector", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("transform", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "Vector3TransformBlock";
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let output = this._outputs[0];
        let vector = this._inputs[0];
        let transform = this._inputs[1];

        state.compilationString += this._declareOutput(output, state) + ` = ${transform.associatedVariableName} * vec4(${vector.associatedVariableName}, ${this.complement});\r\n`;

        return this;
    }
}