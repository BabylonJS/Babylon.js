import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../Misc/typeStore';
import { NodeMaterial } from '../nodeMaterial';
import { InputBlock } from './Input/inputBlock';

/**
 * Creates a mat4 to rotate a Vector by a set axis.
 */
export class Rotate3dBlock extends NodeMaterialBlock {

    /**
     * Creates a new Rotate3dBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("axis", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("angle", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector3);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "Rotate3dBlock";
    }

    /**
     * Gets the input vector
     */
    public get input(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the input axis
     */
    public get axis(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the input angle
     */
    public get angle(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure(material: NodeMaterial) {
        if (!this.angle.isConnected) {
            let angleInput = new InputBlock("angle");
            angleInput.value = 0;
            angleInput.output.connectTo(this.angle);
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let output = this._outputs[0];
        let axis = this.axis;
        let angle = this.angle;
        let input = this.input;

        state._emitFunction('rotation3d',
        `
        //https://github.com/dmnsgn/glsl-rotate/blob/master/rotation-3d.glsl
        mat4 rotation3d(vec3 axis, float angle) {
            axis = normalize(axis);
            float s = sin(angle);
            float c = cos(angle);
            float oc = 1.0 - c;
            return mat4(
                oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0
                );
        }
        `, '// rotation3d');

        state.compilationString += this._declareOutput(output, state) + ` = (vec4(${input.associatedVariableName}, 1.0)*rotation3d(${axis.associatedVariableName}, ${angle.associatedVariableName})).xyz;\r\n`;

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.Rotate3dBlock"] = Rotate3dBlock;