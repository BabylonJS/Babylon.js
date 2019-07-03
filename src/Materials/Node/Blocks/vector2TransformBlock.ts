import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';

/**
 * Block used to transform a vector2 with a matrix
 */
export class Vector2TransformBlock extends NodeMaterialBlock {
    /**
     * Defines the value to use to complement Vector2 to transform it to a Vector4
     */
    public complementZ = 1;

    /**
     * Defines the value to use to complement Vector2 to transform it to a Vector4
     */
    public complementW = 0;

    /**
     * Creates a new Vector2TransformBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("vector", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerInput("transform", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector2);
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

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "Vector2TransformBlock";
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let output = this._outputs[0];
        let vector = this.vector;
        let transform = this.transform;

        state.compilationString += this._declareOutput(output, state) + ` = vec2(${transform.associatedVariableName} * vec4(${vector.associatedVariableName}, ${this.complementZ}, ${this.complementW}));\r\n`;

        return this;
    }
}