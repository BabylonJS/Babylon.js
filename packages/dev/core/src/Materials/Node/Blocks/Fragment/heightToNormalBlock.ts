import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../../Misc/typeStore";
/**
 * Block used to convert a height vector to a normal
 */
export class HeightToNormalBlock extends NodeMaterialBlock {
    /**
     * Creates a new HeightToNormalBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("position", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("normal", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("tangent", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector3);

        this._inputs[3].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "HeightToNormalBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the position component
     */
    public get position(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the normal component
     */
    public get normal(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the tangent component
     */
    public get tangent(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];

        const heightToNormal = `
        vec3 heightToNormal(in float height, in vec3 position, in vec3 tangent, in vec3 normal) {
            vec3 biTangent = cross(tangent, normal);
            mat3 TBN = mat3(tangent, biTangent, normal);
            vec3 worlddX = dFdx(position * 100.0);
            vec3 worlddY = dFdy(position * 100.0);
            vec3 crossX = cross(normal, worlddX);
            vec3 crossY = cross(normal, worlddY);
            float d = abs(dot(crossY, worlddX));
            vec3 inToNormal = vec3(((((height + dFdx(height)) - height) * crossY) + (((height + dFdy(height)) - height) * crossX)) * sign(d));
            inToNormal.y *= -1.0;
            vec3 result = normalize((d * normal) - inToNormal);
            return TBN * result;
        }`;

        state._emitExtension("derivatives", "#extension GL_OES_standard_derivatives : enable");
        state._emitFunction("heightToNormal", heightToNormal, "// heightToNormal");
        state.compilationString +=
            this._declareOutput(output, state) +
            ` = heightToNormal(${this.input.associatedVariableName}, ${this.position.associatedVariableName}, ${this.tangent.associatedVariableName}.xyz, ${this.normal.associatedVariableName});\r\n`;

        return this;
    }
}

RegisterClass("BABYLON.HeightToNormalBlock", HeightToNormalBlock);
