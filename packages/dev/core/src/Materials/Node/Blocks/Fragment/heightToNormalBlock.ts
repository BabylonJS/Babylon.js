import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import type { Scene } from "../../../../scene";
import { Logger } from "core/Misc/logger";

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
        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerInput("worldTangent", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("xyz", NodeMaterialBlockConnectionPointTypes.Vector3);

        this._inputs[3].addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Color3 | NodeMaterialBlockConnectionPointTypes.Vector3 | NodeMaterialBlockConnectionPointTypes.Vector4
        );
    }

    /**
     * Defines if the output should be generated in world or tangent space.
     * Note that in tangent space the result is also scaled by 0.5 and offsetted by 0.5 so that it can directly be used as a PerturbNormal.normalMapColor input
     */
    @editableInPropertyPage("Generate in world space instead of tangent space", PropertyTypeForEdition.Boolean, "PROPERTIES", { notifiers: { update: true } })
    public generateInWorldSpace: boolean = false;

    /**
     * Defines that the worldNormal input will be normalized by the HeightToNormal block before being used
     */
    @editableInPropertyPage("Force normalization for the worldNormal input", PropertyTypeForEdition.Boolean, "PROPERTIES", { notifiers: { update: true } })
    public automaticNormalizationNormal: boolean = true;

    /**
     * Defines that the worldTangent input will be normalized by the HeightToNormal block before being used
     */
    @editableInPropertyPage("Force normalization for the worldTangent input", PropertyTypeForEdition.Boolean, "PROPERTIES", { notifiers: { update: true } })
    public automaticNormalizationTangent: boolean = true;

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
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the normal component
     */
    public get worldNormal(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the tangent component
     */
    public get worldTangent(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the xyz component
     */
    public get xyz(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];

        if (!this.generateInWorldSpace && !this.worldTangent.isConnected) {
            Logger.Error(`You must connect the 'worldTangent' input of the ${this.name} block!`);
        }

        const startCode = this.generateInWorldSpace
            ? ""
            : `
            vec3 biTangent = cross(normal, tangent);
            mat3 TBN = mat3(tangent, biTangent, normal);
            `;

        const endCode = this.generateInWorldSpace
            ? ""
            : `
            result = TBN * result;
            result = result * vec3(0.5) + vec3(0.5);
            `;

        const heightToNormal = `
            vec4 heightToNormal(in float height, in vec3 position, in vec3 tangent, in vec3 normal) {
                ${startCode}
                ${this.automaticNormalizationTangent ? "tangent = normalize(tangent);" : ""}
                ${this.automaticNormalizationNormal ? "normal = normalize(normal);" : ""}
                vec3 worlddX = dFdx(position);
                vec3 worlddY = dFdy(position);
                vec3 crossX = cross(normal, worlddX);
                vec3 crossY = cross(normal, worlddY);
                float d = abs(dot(crossY, worlddX));
                vec3 inToNormal = vec3(((((height + dFdx(height)) - height) * crossY) + (((height + dFdy(height)) - height) * crossX)) * sign(d));
                inToNormal.y *= -1.0;
                vec3 result = normalize((d * normal) - inToNormal);
                ${endCode}
                return vec4(result, 0.);
            }`;

        state._emitExtension("derivatives", "#extension GL_OES_standard_derivatives : enable");
        state._emitFunction("heightToNormal", heightToNormal, "// heightToNormal");
        state.compilationString +=
            this._declareOutput(output, state) +
            ` = heightToNormal(${this.input.associatedVariableName}, ${this.worldPosition.associatedVariableName}, ${
                this.worldTangent.isConnected ? this.worldTangent.associatedVariableName : "vec3(0.)"
            }.xyz, ${this.worldNormal.associatedVariableName});\n`;

        if (this.xyz.hasEndpoints) {
            state.compilationString += this._declareOutput(this.xyz, state) + ` = ${this.output.associatedVariableName}.xyz;\n`;
        }

        return this;
    }

    protected _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();
        codeString += `${this._codeVariableName}.generateInWorldSpace = ${this.generateInWorldSpace};\n`;
        codeString += `${this._codeVariableName}.automaticNormalizationNormal = ${this.automaticNormalizationNormal};\n`;
        codeString += `${this._codeVariableName}.automaticNormalizationTangent = ${this.automaticNormalizationTangent};\n`;

        return codeString;
    }

    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.generateInWorldSpace = this.generateInWorldSpace;
        serializationObject.automaticNormalizationNormal = this.automaticNormalizationNormal;
        serializationObject.automaticNormalizationTangent = this.automaticNormalizationTangent;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.generateInWorldSpace = serializationObject.generateInWorldSpace;
        this.automaticNormalizationNormal = serializationObject.automaticNormalizationNormal;
        this.automaticNormalizationTangent = serializationObject.automaticNormalizationTangent;
    }
}

RegisterClass("BABYLON.HeightToNormalBlock", HeightToNormalBlock);
