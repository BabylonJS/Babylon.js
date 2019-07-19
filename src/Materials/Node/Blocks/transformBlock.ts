import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../Misc/typeStore';

/**
 * Block used to transform a vector (2, 3 or 4) with a matrix. It will generate a Vector4
 */
export class TransformBlock extends NodeMaterialBlock {
    /**
     * Defines the value to use to complement W value to transform it to a Vector4
     */
    public complementW = 1;

    /**
     * Defines the value to use to complement z value to transform it to a Vector4
     */
    public complementZ = 0;

    /**
     * Creates a new TransformBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("vector", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("transform", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "TransformBlock";
    }

    /**
     * Gets the vector input
     */
    public get vector(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
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

        if (vector.connectedPoint) {
            switch (vector.connectedPoint.type) {
                case NodeMaterialBlockConnectionPointTypes.Vector2:
                    state.compilationString += this._declareOutput(output, state) + ` = ${transform.associatedVariableName} * vec4(${vector.associatedVariableName}, ${this._writeFloat(this.complementZ)}, ${this._writeFloat(this.complementW)});\r\n`;
                case NodeMaterialBlockConnectionPointTypes.Vector3:
                    state.compilationString += this._declareOutput(output, state) + ` = ${transform.associatedVariableName} * vec4(${vector.associatedVariableName}, ${this._writeFloat(this.complementW)});\r\n`;
                    break;
                default:
                    state.compilationString += this._declareOutput(output, state) + ` = ${transform.associatedVariableName} * ${vector.associatedVariableName};\r\n`;
                    break;
            }
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.TransformBlock"] = TransformBlock;