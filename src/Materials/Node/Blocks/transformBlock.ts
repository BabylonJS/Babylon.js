import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../Misc/typeStore';
import { Scene } from '../../../scene';
import { InputBlock } from './Input/inputBlock';

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
        super(name, NodeMaterialBlockTargets.Vertex);

        this.registerInput("vector", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("transform", NodeMaterialBlockConnectionPointTypes.Matrix);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("xyz", NodeMaterialBlockConnectionPointTypes.Vector3);

        this._inputs[0].onConnectionObservable.add((other) => {
            if (other.ownerBlock.isInput) {
                let otherAsInput = other.ownerBlock as InputBlock;

                if (otherAsInput.name === "normal" || otherAsInput.name === "tangent") {
                    this.complementW = 0;
                }
            }
        });
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
     * Gets the xyz output component
     */
    public get xyz(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the matrix transform input
     */
    public get transform(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let vector = this.vector;
        let transform = this.transform;

        if (vector.connectedPoint) {
            switch (vector.connectedPoint.type) {
                case NodeMaterialBlockConnectionPointTypes.Vector2:
                    state.compilationString += this._declareOutput(this.output, state) + ` = ${transform.associatedVariableName} * vec4(${vector.associatedVariableName}, ${this._writeFloat(this.complementZ)}, ${this._writeFloat(this.complementW)});\r\n`;
                    break;
                case NodeMaterialBlockConnectionPointTypes.Vector3:
                case NodeMaterialBlockConnectionPointTypes.Color3:
                    state.compilationString += this._declareOutput(this.output, state) + ` = ${transform.associatedVariableName} * vec4(${vector.associatedVariableName}, ${this._writeFloat(this.complementW)});\r\n`;
                    break;
                default:
                    state.compilationString += this._declareOutput(this.output, state) + ` = ${transform.associatedVariableName} * ${vector.associatedVariableName};\r\n`;
                    break;
            }

            if (this.xyz.hasEndpoints) {
                state.compilationString += this._declareOutput(this.xyz, state) + ` = ${this.output.associatedVariableName}.xyz;\r\n`;
            }
        }

        return this;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.complementZ = this.complementZ;
        serializationObject.complementW = this.complementW;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.complementZ = serializationObject.complementZ !== undefined ? serializationObject.complementZ : 0.0;
        this.complementW = serializationObject.complementW !== undefined ? serializationObject.complementW : 1.0;
    }

    protected _dumpPropertiesCode() {
        var codeString = `${this._codeVariableName}.complementZ = ${this.complementZ};\r\n`;

        codeString += `${this._codeVariableName}.complementW = ${this.complementW};\r\n`;

        return codeString;
    }
}

_TypeStore.RegisteredTypes["BABYLON.TransformBlock"] = TransformBlock;