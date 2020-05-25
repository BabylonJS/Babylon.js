import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../../Misc/typeStore';
import { InputBlock } from '../Input/inputBlock';
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { ReflectionBlock } from './reflectionBlock';
import { Scene } from '../../../../scene';
import { Nullable } from '../../../../types';
import { Mesh } from '../../../../Meshes/mesh';
import { SubMesh } from '../../../../Meshes/subMesh';
import { Effect } from '../../../effect';
import { PBRMetallicRoughnessBlock } from './pbrMetallicRoughnessBlock';
import { PerturbNormalBlock } from '../Fragment/perturbNormalBlock';

/**
 * Block used to implement the clear coat module of the PBR material
 */
export class ClearCoatBlock extends NodeMaterialBlock {

    private _scene: Scene;

    /**
     * Create a new ClearCoatBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("roughness", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("ior", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("texture", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("bumpTexture", NodeMaterialBlockConnectionPointTypes.Color4, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("tintColor", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("tintAtDistance", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("tintThickness", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("worldTangent", NodeMaterialBlockConnectionPointTypes.Vector4, true);

        this.registerOutput("clearcoat", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("clearcoat", this, NodeMaterialConnectionPointDirection.Output, ClearCoatBlock, "ClearCoatBlock"));
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("clearcoatOut");
        state._excludeVariableName("vClearCoatParams");
        state._excludeVariableName("vClearCoatTintParams");
        state._excludeVariableName("vClearCoatRefractionParams");
        state._excludeVariableName("vClearCoatTangentSpaceParams");
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "ClearCoatBlock";
    }

    /**
     * Gets the intensity input component
     */
    public get intensity(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the roughness input component
     */
    public get roughness(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the ior input component
     */
    public get ior(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the texture input component
     */
    public get texture(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the bump texture input component
     */
    public get bumpTexture(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the uv input component
     */
    public get uv(): NodeMaterialConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the tint color input component
     */
    public get tintColor(): NodeMaterialConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the tint "at distance" input component
     */
    public get tintAtDistance(): NodeMaterialConnectionPoint {
        return this._inputs[7];
    }

    /**
     * Gets the tint thickness input component
     */
    public get tintThickness(): NodeMaterialConnectionPoint {
        return this._inputs[8];
    }

    /**
     * Gets the world tangent input component
     */
    public get worldTangent(): NodeMaterialConnectionPoint {
        return this._inputs[9];
    }

    /**
     * Gets the clear coat object output component
     */
    public get clearcoat(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure(material: NodeMaterial) {
        if (!this.intensity.isConnected) {
            let intensityInput = new InputBlock("ClearCoat intensity", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
            intensityInput.value = 1;
            intensityInput.output.connectTo(this.intensity);
        }
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        super.prepareDefines(mesh, nodeMaterial, defines);

        defines.setValue("CLEARCOAT", true);
        defines.setValue("CLEARCOAT_TEXTURE", this.texture.isConnected, true);
        defines.setValue("CLEARCOAT_TINT", this.tintColor.isConnected || this.tintThickness.isConnected || this.tintAtDistance.isConnected, true);
        defines.setValue("CLEARCOAT_BUMP", this.bumpTexture.isConnected, true);
        defines.setValue("CLEARCOAT_DEFAULTIOR", this.ior.isConnected ? this.ior.connectInputBlock!.value === 1.5 : false, true);
    }

    public bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh, subMesh?: SubMesh) {
        super.bind(effect, nodeMaterial, mesh);

        // Clear Coat Refraction params
        const indexOfRefraction = this.ior.connectInputBlock?.value ?? 1.5;

        const a = 1 - indexOfRefraction;
        const b = 1 + indexOfRefraction;
        const f0 = Math.pow((-a / b), 2); // Schlicks approx: (ior1 - ior2) / (ior1 + ior2) where ior2 for air is close to vacuum = 1.
        const eta = 1 / indexOfRefraction;

        effect.setFloat4("vClearCoatRefractionParams", f0, eta, a, b);

        // Clear Coat tangent space params
        const mainPBRBlock = this.clearcoat.hasEndpoints ? this.clearcoat.endpoints[0].ownerBlock as PBRMetallicRoughnessBlock : null;
        const perturbedNormalBlock = mainPBRBlock?.perturbedNormal.isConnected ? mainPBRBlock.perturbedNormal.connectedPoint!.ownerBlock as PerturbNormalBlock : null;

        if (this._scene._mirroredCameraPosition) {
            effect.setFloat2("vClearCoatTangentSpaceParams", perturbedNormalBlock?.invertX ? 1.0 : -1.0, perturbedNormalBlock?.invertY ? 1.0 : -1.0);
        } else {
            effect.setFloat2("vClearCoatTangentSpaceParams", perturbedNormalBlock?.invertX ? -1.0 : 1.0, perturbedNormalBlock?.invertY ? -1.0 : 1.0);
        }
    }

    private _generateTBNSpace(state: NodeMaterialBuildState, worldPositionVarName: string, worldNormalVarName: string) {
        let code = "";

        let comments = `//${this.name}`;
        let worldTangent = this.worldTangent;

        state._emitExtension("derivatives", "#extension GL_OES_standard_derivatives : enable");

        let tangentReplaceString = { search: /defined\(TANGENT\)/g, replace: worldTangent.isConnected ? "defined(TANGENT)" : "defined(IGNORE)" };

        if (worldTangent.isConnected) {
            code += `vec3 tbnNormal = normalize(${worldNormalVarName}.xyz);\r\n`;
            code += `vec3 tbnTangent = normalize(${worldTangent.associatedVariableName}.xyz);\r\n`;
            code += `vec3 tbnBitangent = cross(tbnNormal, tbnTangent);\r\n`;
            code += `mat3 vTBN = mat3(tbnTangent, tbnBitangent, tbnNormal);\r\n`;
        }

        state._emitFunctionFromInclude("bumpFragmentMainFunctions", comments, {
            replaceStrings: [
                tangentReplaceString,
            ]
        });

        return code;
    }

    /**
     * Gets the main code of the block (fragment side)
     * @param state current state of the node material building
     * @param ccBlock instance of a ClearCoatBlock or null if the code must be generated without an active clear coat module
     * @param reflectionBlock instance of a ReflectionBlock null if the code must be generated without an active reflection module
     * @param worldPosVarName name of the variable holding the world position
     * @param generateTBNSpace if true, the code needed to create the TBN coordinate space is generated
     * @param vTBNAvailable indicate that the vTBN variable is already existing because it has already been generated by another block (PerturbNormal or Anisotropy)
     * @param worldNormalVarName name of the variable holding the world normal
     * @returns the shader code
     */
    public static GetCode(state: NodeMaterialBuildState, ccBlock: Nullable<ClearCoatBlock>, reflectionBlock: Nullable<ReflectionBlock>, worldPosVarName: string, generateTBNSpace: boolean, vTBNAvailable: boolean, worldNormalVarName: string): string {
        let code = "";

        const intensity = ccBlock?.intensity.isConnected ? ccBlock.intensity.associatedVariableName : "1.";
        const roughness = ccBlock?.roughness.isConnected ? ccBlock.roughness.associatedVariableName : "0.";
        const texture = ccBlock?.texture.isConnected ? ccBlock.texture.associatedVariableName : "vec2(0.)";
        const bumpTexture = ccBlock?.bumpTexture.isConnected ? ccBlock.bumpTexture.associatedVariableName : "vec4(0.)";
        const uv = ccBlock?.uv.isConnected ? ccBlock.uv.associatedVariableName : "vec2(0.)";

        const tintColor = ccBlock?.tintColor.isConnected ? ccBlock.tintColor.associatedVariableName : "vec3(1.)";
        const tintThickness = ccBlock?.tintThickness.isConnected ? ccBlock.tintThickness.associatedVariableName : "1.";
        const tintAtDistance = ccBlock?.tintAtDistance.isConnected ? ccBlock.tintAtDistance.associatedVariableName : "1.";
        const tintTexture = "vec4(0.)";

        if (ccBlock) {
            state._emitUniformFromString("vClearCoatRefractionParams", "vec4");
            state._emitUniformFromString("vClearCoatTangentSpaceParams", "vec2");
        }

        if (generateTBNSpace && ccBlock) {
            code += ccBlock._generateTBNSpace(state, worldPosVarName, worldNormalVarName);
            vTBNAvailable = ccBlock.worldTangent.isConnected;
        }

        code += `clearcoatOutParams clearcoatOut;

        #ifdef CLEARCOAT
            vec2 vClearCoatParams = vec2(${intensity}, ${roughness});
            vec4 vClearCoatTintParams = vec4(${tintColor}, ${tintThickness});

            clearcoatBlock(
                ${worldPosVarName}.xyz,
                geometricNormalW,
                viewDirectionW,
                vClearCoatParams,
                specularEnvironmentR0,
            #ifdef CLEARCOAT_TEXTURE
                ${texture}.rg,
            #endif
            #ifdef CLEARCOAT_TINT
                vClearCoatTintParams,
                ${tintAtDistance},
                vClearCoatRefractionParams,
                #ifdef CLEARCOAT_TINT_TEXTURE
                    ${tintTexture},
                #endif
            #endif
            #ifdef CLEARCOAT_BUMP
                vec2(0., 1.),
                ${bumpTexture},
                ${uv},
                #if defined(${vTBNAvailable ? "TANGENT" : "IGNORE"}) && defined(NORMAL)
                    vTBN,
                #else
                    vClearCoatTangentSpaceParams,
                #endif
                #ifdef OBJECTSPACE_NORMALMAP
                    normalMatrix,
                #endif
            #endif
            #if defined(FORCENORMALFORWARD) && defined(NORMAL)
                faceNormal,
            #endif
            #ifdef REFLECTION
                ${reflectionBlock?._vReflectionMicrosurfaceInfosName},
                ${reflectionBlock?._vReflectionInfosName},
                ${reflectionBlock?.reflectionColor},
                vLightingIntensity,
                #ifdef ${reflectionBlock?._define3DName}
                    ${reflectionBlock?._cubeSamplerName},
                #else
                    ${reflectionBlock?._2DSamplerName},
                #endif
                #ifndef LODBASEDMICROSFURACE
                    #ifdef ${reflectionBlock?._define3DName}
                        ${reflectionBlock?._cubeSamplerName},
                        ${reflectionBlock?._cubeSamplerName},
                    #else
                        ${reflectionBlock?._2DSamplerName},
                        ${reflectionBlock?._2DSamplerName},
                    #endif
                #endif
            #endif
            #if defined(ENVIRONMENTBRDF) && !defined(${reflectionBlock?._defineSkyboxName})
                #ifdef RADIANCEOCCLUSION
                    ambientMonochrome,
                #endif
            #endif
                clearcoatOut
            );
        #else
            clearcoatOut.specularEnvironmentR0 = specularEnvironmentR0;
        #endif\r\n`;

        return code;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        this._scene = state.sharedData.scene;

        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.bindableBlocks.push(this);
            state.sharedData.blocksWithDefines.push(this);
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.ClearCoatBlock"] = ClearCoatBlock;