import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockTargets } from '../../nodeMaterialBlockTargets';
import { NodeMaterialBlockConnectionPointTypes } from '../../nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../../nodeMaterialBlockConnectionPoint';
import { MaterialHelper } from '../../../materialHelper';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { Effect } from '../../../effect';
import { Mesh } from '../../../../Meshes/mesh';
import { NodeMaterialWellKnownValues } from '../../nodeMaterialWellKnownValues';

/**
 * Block used to add light in the fragment shader
 */
export class LightBlock extends NodeMaterialBlock {
    private _lightId: number;

    /**
     * Create a new LightBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);

        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);

        this.registerInput("light", NodeMaterialBlockConnectionPointTypes.Light, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("cameraPosition", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("diffuseOutput", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("specularOutput", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
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
    * Gets the light input component
    */
    public get light(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
    * Gets the camera (or eye) position component
    */
    public get cameraPosition(): NodeMaterialConnectionPoint {
        return this._inputs[3];
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

    public autoConfigure() {
        if (this.cameraPosition.isUndefined) {
            this.cameraPosition.setAsWellKnownValue(NodeMaterialWellKnownValues.CameraPosition);
        }
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        if (!this.light.value) {
            return;
        }

        let state = {
            needNormals: false,
            needRebuild: false,
            lightmapMode: false,
            shadowEnabled: false,
            specularEnabled: false
        };

        MaterialHelper.PrepareDefinesForLight(mesh.getScene(), mesh, this.light.value, this._lightId, defines, true, state);

        if (state.needRebuild) {
            defines.rebuild();
        }
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (!mesh || !this.light.value) {
            return;
        }

        MaterialHelper.BindLight(this.light.value, this._lightId, mesh.getScene(), mesh, effect, true, false);
    }

    private _injectVertexCode(state: NodeMaterialBuildState) {
        let worldPos = this.worldPosition;
        let worldNormal = this.worldNormal;

        // Inject code in vertex
        let worldPosVaryingName = "v_" + worldPos.associatedVariableName;
        state._emitVaryings(worldPos, undefined, true, false, worldPosVaryingName, NodeMaterialBlockConnectionPointTypes.Vector3);

        let worldNormalVaryingName = "v_" + worldNormal.associatedVariableName;
        state._emitVaryings(worldNormal, undefined, true, false, worldNormalVaryingName, NodeMaterialBlockConnectionPointTypes.Vector3);

        state.compilationString += `${worldPosVaryingName} = ${worldPos.associatedVariableName}.xyz;\r\n`;
        state.compilationString += `${worldNormalVaryingName} = ${worldNormal.associatedVariableName}.xyz;\r\n`;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            return;
        }

        // Vertex
        this._injectVertexCode(state._vertexState);

        // Fragment
        state.sharedData.bindableBlocks.push(this);
        state.sharedData.blocksWithDefines.push(this);

        this._lightId = (state.counters["lightCounter"] !== undefined ? state.counters["lightCounter"] : -1) + 1;
        state.counters["lightCounter"] = this._lightId;

        let comments = `//${this.name}`;
        let worldPos = this.worldPosition;
        let worldNormal = this.worldNormal;

        state._emitFunctionFromInclude("lightsFragmentFunctions", comments, {
            replaceStrings: [
                { search: /vPositionW/g, replace: "v_" + worldPos.associatedVariableName },
                { search: /normalW/g, replace: "v_" + worldNormal.associatedVariableName }
            ]
        });

        state._emitFunctionFromInclude(state.supportUniformBuffers ? "lightUboDeclaration" : "lightFragmentDeclaration", comments, {
            replaceStrings: [{ search: /{X}/g, replace: this._lightId.toString() }]
        }, this._lightId.toString());

        // Uniforms and samplers
        MaterialHelper.PrepareUniformsAndSamplersForLight(this._lightId, state.uniforms, state.samplers, undefined, state.uniformBuffers);

        // Code
        if (this._lightId === 0) {
            state.compilationString += `vec3 viewDirectionW = normalize(${this.cameraPosition.associatedVariableName} - ${"v_" + worldPos.associatedVariableName});\r\n`;
            state.compilationString += `lightingInfo info;\r\n`;
            state.compilationString += `float shadow = 1.;\r\n`;
            state.compilationString += `float glossiness = 0.;\r\n`;
        }

        let diffuseOutput = this.diffuseOutput;
        let specularOutput = this.specularOutput;

        state.compilationString += `vec3 ${diffuseOutput.associatedVariableName} = vec3(0., 0., 0.);\r\n`;
        state.compilationString += `#ifdef SPECULARTERM\r\n`;
        state.compilationString += `vec3 ${specularOutput.associatedVariableName} = vec3(0., 0., 0.);\r\n`;
        state.compilationString += `#endif\r\n`;

        state.compilationString += state._emitCodeFromInclude("lightFragment", comments, {
            replaceStrings: [
                { search: /{X}/g, replace: this._lightId.toString() },
                { search: /diffuseBase/g, replace: diffuseOutput.associatedVariableName },
                { search: /specularBase/g, replace: specularOutput.associatedVariableName },
                { search: /normalW/g, replace: "v_" + worldNormal.associatedVariableName }
            ]
        });

        return this;
    }
}