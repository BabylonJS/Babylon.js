import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialCompilationState } from '../nodeMaterialCompilationState';
import { NodeMaterialBlockTargets } from '../nodeMaterialBlockTargets';

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
        super(name, NodeMaterialBlockTargets.Vertex);

        this.registerInput("vector", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerInput("transform", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector2);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "Vector2TransformBlock";
    }

    protected _buildBlock(state: NodeMaterialCompilationState) {
        super._buildBlock(state);

        let output = this._outputs[0];
        let vector = this._inputs[0];
        let transform = this._inputs[1];

        state.compilationString += this._declareOutput(output, state) + ` = vec2(${transform.associatedVariableName} * vec4(${vector.associatedVariableName}, ${this.complementZ}, ${this.complementW}));\r\n`;

        return this;
    }
}