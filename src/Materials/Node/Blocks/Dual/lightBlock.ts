import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { MaterialHelper } from '../../../materialHelper';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { Effect } from '../../../effect';
import { Mesh } from '../../../../Meshes/mesh';
import { NodeMaterialSystemValues } from '../../Enums/nodeMaterialSystemValues';
import { InputBlock } from '../Input/inputBlock';
import { Light } from '../../../../Lights/light';
import { Nullable } from '../../../../types';
import { _TypeStore } from '../../../../Misc/typeStore';
import { Scene } from '../../../../scene';

import "../../../../Shaders/ShadersInclude/lightFragmentDeclaration";
import "../../../../Shaders/ShadersInclude/lightUboDeclaration";
import "../../../../Shaders/ShadersInclude/lightFragment";
import "../../../../Shaders/ShadersInclude/helperFunctions";
import "../../../../Shaders/ShadersInclude/lightsFragmentFunctions";
import "../../../../Shaders/ShadersInclude/shadowsFragmentFunctions";
import "../../../../Shaders/ShadersInclude/shadowsVertex";

/**
 * Block used to add light in the fragment shader
 */
export class LightBlock extends NodeMaterialBlock {
    private _lightId: number;

    /**
     * Gets or sets the light associated with this block
     */
    public light: Nullable<Light>;

    /**
     * Create a new LightBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);

        this._isUnique = true;

        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("cameraPosition", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("glossiness", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("glossPower", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("diffuseColor", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("specularColor", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput("diffuseOutput", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("specularOutput", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("shadow", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "LightBlock";
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
    * Gets the camera (or eye) position component
    */
    public get cameraPosition(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
    * Gets the glossiness component
    */
    public get glossiness(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
    * Gets the glossinness power component
    */
    public get glossPower(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
    * Gets the diffuse color component
    */
    public get diffuseColor(): NodeMaterialConnectionPoint {
        return this._inputs[5];
    }

    /**
    * Gets the specular color component
    */
    public get specularColor(): NodeMaterialConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the diffuse output component
     */
    public get diffuseOutput(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the specular output component
     */
    public get specularOutput(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the shadow output component
     */
    public get shadow(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    public autoConfigure(material: NodeMaterial) {
        if (!this.cameraPosition.isConnected) {
            let cameraPositionInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.CameraPosition);

            if (!cameraPositionInput) {
                cameraPositionInput = new InputBlock("cameraPosition");
                cameraPositionInput.setAsSystemValue(NodeMaterialSystemValues.CameraPosition);
            }
            cameraPositionInput.output.connectTo(this.cameraPosition);
        }
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        if (!defines._areLightsDirty) {
            return;
        }

        const scene = mesh.getScene();

        if (!this.light) {
            MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, nodeMaterial.maxSimultaneousLights);
        } else {
            let state = {
                needNormals: false,
                needRebuild: false,
                lightmapMode: false,
                shadowEnabled: false,
                specularEnabled: false
            };

            MaterialHelper.PrepareDefinesForLight(scene, mesh, this.light, this._lightId, defines, true, state);

            if (state.needRebuild) {
                defines.rebuild();
            }
        }
    }

    public updateUniformsAndSamples(state: NodeMaterialBuildState, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines, uniformBuffers: string[]) {
        for (var lightIndex = 0; lightIndex < nodeMaterial.maxSimultaneousLights; lightIndex++) {
            if (!defines["LIGHT" + lightIndex]) {
                break;
            }
            MaterialHelper.PrepareUniformsAndSamplersForLight(lightIndex, state.uniforms, state.samplers, defines["PROJECTEDLIGHTTEXTURE" + lightIndex], uniformBuffers);
        }
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (!mesh) {
            return;
        }

        const scene = mesh.getScene();

        if (!this.light) {
            MaterialHelper.BindLights(scene, mesh, effect, true, nodeMaterial.maxSimultaneousLights);
        } else {
            MaterialHelper.BindLight(this.light, this._lightId, scene, effect, true);
        }
    }

    private _injectVertexCode(state: NodeMaterialBuildState) {
        let worldPos = this.worldPosition;
        let comments = `//${this.name}`;

        // Declaration
        if (!this.light) { // Emit for all lights
            state._emitFunctionFromInclude(state.supportUniformBuffers ? "lightUboDeclaration" : "lightFragmentDeclaration", comments, {
                repeatKey: "maxSimultaneousLights"
            });
            this._lightId = 0;

            state.sharedData.dynamicUniformBlocks.push(this);
        } else {

            this._lightId = (state.counters["lightCounter"] !== undefined ? state.counters["lightCounter"] : -1) + 1;
            state.counters["lightCounter"] = this._lightId;

            state._emitFunctionFromInclude(state.supportUniformBuffers ? "lightUboDeclaration" : "lightFragmentDeclaration", comments, {
                replaceStrings: [{ search: /{X}/g, replace: this._lightId.toString() }]
            }, this._lightId.toString());
        }

        // Inject code in vertex
        let worldPosVaryingName = "v_" + worldPos.associatedVariableName;
        if (state._emitVaryingFromString(worldPosVaryingName, "vec4")) {
            state.compilationString += `${worldPosVaryingName} = ${worldPos.associatedVariableName};\r\n`;
        }

        if (this.light) {
            state.compilationString += state._emitCodeFromInclude("shadowsVertex", comments, {
                replaceStrings: [
                    { search: /{X}/g, replace: this._lightId.toString() },
                    { search: /worldPos/g, replace: worldPos.associatedVariableName }
                ]
            });
        } else {
            state.compilationString += `vec4 worldPos = ${worldPos.associatedVariableName};\r\n`;
            state.compilationString += state._emitCodeFromInclude("shadowsVertex", comments, {
                repeatKey: "maxSimultaneousLights"
            });
        }
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            // Vertex
            this._injectVertexCode(state);

            return;
        }

        // Fragment
        state.sharedData.bindableBlocks.push(this);
        state.sharedData.blocksWithDefines.push(this);

        let comments = `//${this.name}`;
        let worldPos = this.worldPosition;

        state._emitFunctionFromInclude("helperFunctions", comments);

        state._emitFunctionFromInclude("lightsFragmentFunctions", comments, {
            replaceStrings: [
                { search: /vPositionW/g, replace: "v_" + worldPos.associatedVariableName + ".xyz" }
            ]
        });

        state._emitFunctionFromInclude("shadowsFragmentFunctions", comments, {
            replaceStrings: [
                { search: /vPositionW/g, replace: "v_" + worldPos.associatedVariableName + ".xyz" }
            ]
        });

        if (!this.light) { // Emit for all lights
            state._emitFunctionFromInclude(state.supportUniformBuffers ? "lightUboDeclaration" : "lightFragmentDeclaration", comments, {
                repeatKey: "maxSimultaneousLights"
            });
        } else {
            state._emitFunctionFromInclude(state.supportUniformBuffers ? "lightUboDeclaration" : "lightFragmentDeclaration", comments, {
                replaceStrings: [{ search: /{X}/g, replace: this._lightId.toString() }]
            }, this._lightId.toString());
        }

        // Code
        if (this._lightId === 0) {
            if (state._registerTempVariable("viewDirectionW")) {
                state.compilationString += `vec3 viewDirectionW = normalize(${this.cameraPosition.associatedVariableName} - ${"v_" + worldPos.associatedVariableName}.xyz);\r\n`;
            }
            state.compilationString += `lightingInfo info;\r\n`;
            state.compilationString += `float shadow = 1.;\r\n`;
            state.compilationString += `float glossiness = ${this.glossiness.isConnected ? this.glossiness.associatedVariableName : "1.0"} * ${this.glossPower.isConnected ? this.glossPower.associatedVariableName : "1024.0"};\r\n`;
            state.compilationString += `vec3 diffuseBase = vec3(0., 0., 0.);\r\n`;
            state.compilationString += `vec3 specularBase = vec3(0., 0., 0.);\r\n`;
            state.compilationString += `vec3 normalW = ${this.worldNormal.associatedVariableName}.xyz;\r\n`;
        }

        if (this.light) {
            state.compilationString += state._emitCodeFromInclude("lightFragment", comments, {
                replaceStrings: [
                    { search: /{X}/g, replace: this._lightId.toString() }
                ]
            });
        } else {
            state.compilationString += state._emitCodeFromInclude("lightFragment", comments, {
                repeatKey: "maxSimultaneousLights"
            });
        }

        let diffuseOutput = this.diffuseOutput;
        let specularOutput = this.specularOutput;

        state.compilationString += this._declareOutput(diffuseOutput, state) + ` = diffuseBase${this.diffuseColor.isConnected ? " * " + this.diffuseColor.associatedVariableName : ""};\r\n`;
        if (specularOutput.hasEndpoints) {
            state.compilationString += this._declareOutput(specularOutput, state) + ` = specularBase${this.specularColor.isConnected ? " * " + this.specularColor.associatedVariableName : ""};\r\n`;
        }

        if (this.shadow.hasEndpoints) {
            state.compilationString += this._declareOutput(this.shadow, state) + ` = shadow;\r\n`;
        }

        return this;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        if (this.light) {
            serializationObject.lightId = this.light.id;
        }

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        if (serializationObject.lightId) {
            this.light = scene.getLightByID(serializationObject.lightId);
        }
    }
}

_TypeStore.RegisteredTypes["BABYLON.LightBlock"] = LightBlock;