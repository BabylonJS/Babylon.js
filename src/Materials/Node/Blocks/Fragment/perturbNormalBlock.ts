import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../../Misc/typeStore';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { InputBlock } from '../Input/inputBlock';
import { Effect } from '../../../effect';
import { Mesh } from '../../../../Meshes/mesh';
import { Scene } from '../../../../scene';
import { editableInPropertyPage, PropertyTypeForEdition } from "../../nodeMaterialDecorator";

import "../../../../Shaders/ShadersInclude/bumpFragmentMainFunctions";
import "../../../../Shaders/ShadersInclude/bumpFragmentFunctions";
import "../../../../Shaders/ShadersInclude/bumpFragment";

/**
 * Block used to pertub normals based on a normal map
 */
export class PerturbNormalBlock extends NodeMaterialBlock {
    private _tangentSpaceParameterName = "";

    /** Gets or sets a boolean indicating that normal should be inverted on X axis */
    @editableInPropertyPage("Invert X axis", PropertyTypeForEdition.Boolean, "PROPERTIES", { "notifiers": { "update": false }})
    public invertX = false;
    /** Gets or sets a boolean indicating that normal should be inverted on Y axis */
    @editableInPropertyPage("Invert Y axis", PropertyTypeForEdition.Boolean, "PROPERTIES", { "notifiers": { "update": false }})
    public invertY = false;

    /**
     * Create a new PerturbNormalBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        // Vertex
        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector4, false);
        this.registerInput("worldTangent", NodeMaterialBlockConnectionPointTypes.Vector4, true);
        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2, false);
        this.registerInput("normalMapColor", NodeMaterialBlockConnectionPointTypes.Color3, false);
        this.registerInput("strength", NodeMaterialBlockConnectionPointTypes.Float, false);

        // Fragment
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector4);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "PerturbNormalBlock";
    }

    /**
     * Gets the world position input component
     */
    public get worldPosition(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the world normal input component
     */
    public get worldNormal(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the world tangent input component
     */
    public get worldTangent(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the uv input component
     */
    public get uv(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
    * Gets the normal map color input component
    */
    public get normalMapColor(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
    * Gets the strength input component
    */
    public get strength(): NodeMaterialConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        defines.setValue("BUMP", true);
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (nodeMaterial.getScene()._mirroredCameraPosition) {
            effect.setFloat2(this._tangentSpaceParameterName, this.invertX ? 1.0 : -1.0, this.invertY ? 1.0 : -1.0);
        } else {
            effect.setFloat2(this._tangentSpaceParameterName, this.invertX ? -1.0 : 1.0, this.invertY ? -1.0 : 1.0);
        }
    }

    public autoConfigure(material: NodeMaterial) {
        if (!this.uv.isConnected) {
            let uvInput = material.getInputBlockByPredicate((b) => b.isAttribute && b.name === "uv");

            if (!uvInput) {
                uvInput = new InputBlock("uv");
                uvInput.setAsAttribute();
            }
            uvInput.output.connectTo(this.uv);
        }

        if (!this.strength.isConnected) {
            let strengthInput = new InputBlock("strength");
            strengthInput.value = 1.0;
            strengthInput.output.connectTo(this.strength);
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let comments = `//${this.name}`;
        let uv = this.uv;
        let worldPosition = this.worldPosition;
        let worldNormal = this.worldNormal;
        let worldTangent = this.worldTangent;

        state.sharedData.blocksWithDefines.push(this);
        state.sharedData.bindableBlocks.push(this);

        this._tangentSpaceParameterName = state._getFreeDefineName("tangentSpaceParameter");

        state._emitUniformFromString(this._tangentSpaceParameterName, "vec2");

        let replaceForBumpInfos = this.strength.isConnectedToInputBlock && this.strength.connectInputBlock!.isConstant ? `${state._emitFloat(1.0 / this.strength.connectInputBlock!.value)}` : `1.0 / ${this.strength.associatedVariableName}`;

        state._emitExtension("derivatives", "#extension GL_OES_standard_derivatives : enable");

        let tangentReplaceString = { search: /defined\(TANGENT\)/g, replace: worldTangent.isConnected ? "defined(TANGENT)" : "defined(IGNORE)" };

        if (worldTangent.isConnected) {
            state.compilationString += `vec3 tbnNormal = normalize(${worldNormal.associatedVariableName}.xyz);\r\n`;
            state.compilationString += `vec3 tbnTangent = normalize(${worldTangent.associatedVariableName}.xyz);\r\n`;
            state.compilationString += `vec3 tbnBitangent = cross(tbnNormal, tbnTangent);\r\n`;
            state.compilationString += `mat3 vTBN = mat3(tbnTangent, tbnBitangent, tbnNormal);\r\n`;
        }

        state._emitFunctionFromInclude("bumpFragmentMainFunctions", comments, {
            replaceStrings: [
                tangentReplaceString,
            ]
        });

        state._emitFunctionFromInclude("bumpFragmentFunctions", comments, {
            replaceStrings: [
                { search: /vBumpInfos.y/g, replace: replaceForBumpInfos},
                { search: /vTangentSpaceParams/g, replace: this._tangentSpaceParameterName},
                { search: /vPositionW/g, replace: worldPosition.associatedVariableName + ".xyz"},
            ]
        });

        state.compilationString += this._declareOutput(this.output, state) + " = vec4(0.);\r\n";
        state.compilationString += state._emitCodeFromInclude("bumpFragment", comments, {
            replaceStrings: [
                { search: /perturbNormal\(TBN,vBumpUV\+uvOffset\)/g, replace: `perturbNormal(TBN, ${this.normalMapColor.associatedVariableName})` },
                { search: /vBumpInfos.y/g, replace: replaceForBumpInfos},
                { search: /vBumpUV/g, replace: uv.associatedVariableName},
                { search: /vPositionW/g, replace: worldPosition.associatedVariableName + ".xyz"},
                { search: /normalW=/g, replace: this.output.associatedVariableName + ".xyz = " },
                { search: /mat3\(normalMatrix\)\*normalW/g, replace: "mat3(normalMatrix) * " + this.output.associatedVariableName + ".xyz" },
                { search: /normalW/g, replace: worldNormal.associatedVariableName + ".xyz" },
                tangentReplaceString
            ]
        });

        return this;
    }

    protected _dumpPropertiesCode() {
        var codeString = `${this._codeVariableName}.invertX = ${this.invertX};\r\n`;

        codeString += `${this._codeVariableName}.invertY = ${this.invertY};\r\n`;

        return codeString;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.invertX = this.invertX;
        serializationObject.invertY = this.invertY;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.invertX = serializationObject.invertX;
        this.invertY = serializationObject.invertY;
    }
}

_TypeStore.RegisteredTypes["BABYLON.PerturbNormalBlock"] = PerturbNormalBlock;