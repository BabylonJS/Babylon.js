import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialConnectionPointDirection } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../../Misc/typeStore";
import { InputBlock } from "../Input/inputBlock";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import type { ReflectionBlock } from "./reflectionBlock";
import type { Scene } from "../../../../scene";
import type { Nullable } from "../../../../types";
import type { Mesh } from "../../../../Meshes/mesh";
import type { Effect } from "../../../effect";
import type { PBRMetallicRoughnessBlock } from "./pbrMetallicRoughnessBlock";
import type { PerturbNormalBlock } from "../Fragment/perturbNormalBlock";
import { PBRClearCoatConfiguration } from "../../../PBR/pbrClearCoatConfiguration";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { TBNBlock } from "../Fragment/TBNBlock";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Block used to implement the clear coat module of the PBR material
 */
export class ClearCoatBlock extends NodeMaterialBlock {
    private _scene: Scene;
    private _tangentCorrectionFactorName = "";

    /**
     * Create a new ClearCoatBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("roughness", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("indexOfRefraction", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("normalMapColor", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("uv", NodeMaterialBlockConnectionPointTypes.Vector2, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("tintColor", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("tintAtDistance", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("tintThickness", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("worldTangent", NodeMaterialBlockConnectionPointTypes.Vector4, true);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.worldNormal.addExcludedConnectionPointFromAllowedTypes(
            NodeMaterialBlockConnectionPointTypes.Color4 | NodeMaterialBlockConnectionPointTypes.Vector4 | NodeMaterialBlockConnectionPointTypes.Vector3
        );
        this.registerInput(
            "TBN",
            NodeMaterialBlockConnectionPointTypes.Object,
            true,
            NodeMaterialBlockTargets.VertexAndFragment,
            new NodeMaterialConnectionPointCustomObject("TBN", this, NodeMaterialConnectionPointDirection.Input, TBNBlock, "TBNBlock")
        );

        this.registerOutput(
            "clearcoat",
            NodeMaterialBlockConnectionPointTypes.Object,
            NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("clearcoat", this, NodeMaterialConnectionPointDirection.Output, ClearCoatBlock, "ClearCoatBlock")
        );
    }

    /**
     * Defines if the F0 value should be remapped to account for the interface change in the material.
     */
    @editableInPropertyPage("Remap F0 on interface change", PropertyTypeForEdition.Boolean, "ADVANCED")
    public remapF0OnInterfaceChange: boolean = true;

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("clearcoatOut");
        state._excludeVariableName("vClearCoatParams");
        state._excludeVariableName("vClearCoatTintParams");
        state._excludeVariableName("vClearCoatRefractionParams");
        state._excludeVariableName("vClearCoatTangentSpaceParams");
        state._excludeVariableName("vGeometricNormaClearCoatW");
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
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
    public get indexOfRefraction(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the bump texture input component
     */
    public get normalMapColor(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the uv input component
     */
    public get uv(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the tint color input component
     */
    public get tintColor(): NodeMaterialConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the tint "at distance" input component
     */
    public get tintAtDistance(): NodeMaterialConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the tint thickness input component
     */
    public get tintThickness(): NodeMaterialConnectionPoint {
        return this._inputs[7];
    }

    /**
     * Gets the world tangent input component
     */
    public get worldTangent(): NodeMaterialConnectionPoint {
        return this._inputs[8];
    }

    /**
     * Gets the world normal input component
     */
    public get worldNormal(): NodeMaterialConnectionPoint {
        return this._inputs[9];
    }

    /**
     * Gets the TBN input component
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public get TBN(): NodeMaterialConnectionPoint {
        return this._inputs[10];
    }

    /**
     * Gets the clear coat object output component
     */
    public get clearcoat(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public override autoConfigure() {
        if (!this.intensity.isConnected) {
            const intensityInput = new InputBlock("ClearCoat intensity", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
            intensityInput.value = 1;
            intensityInput.output.connectTo(this.intensity);
        }
    }

    public override prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        super.prepareDefines(mesh, nodeMaterial, defines);

        defines.setValue("CLEARCOAT", true);
        defines.setValue("CLEARCOAT_TEXTURE", false, true);
        defines.setValue("CLEARCOAT_USE_ROUGHNESS_FROM_MAINTEXTURE", true, true);
        defines.setValue("CLEARCOAT_TINT", this.tintColor.isConnected || this.tintThickness.isConnected || this.tintAtDistance.isConnected, true);
        defines.setValue("CLEARCOAT_BUMP", this.normalMapColor.isConnected, true);
        defines.setValue(
            "CLEARCOAT_DEFAULTIOR",
            this.indexOfRefraction.isConnected ? this.indexOfRefraction.connectInputBlock!.value === PBRClearCoatConfiguration._DefaultIndexOfRefraction : true,
            true
        );
        defines.setValue("CLEARCOAT_REMAP_F0", this.remapF0OnInterfaceChange, true);
    }

    public override bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        super.bind(effect, nodeMaterial, mesh);

        // Clear Coat Refraction params
        const indexOfRefraction = this.indexOfRefraction.connectInputBlock?.value ?? PBRClearCoatConfiguration._DefaultIndexOfRefraction;

        const a = 1 - indexOfRefraction;
        const b = 1 + indexOfRefraction;
        const f0 = Math.pow(-a / b, 2); // Schlicks approx: (ior1 - ior2) / (ior1 + ior2) where ior2 for air is close to vacuum = 1.
        const eta = 1 / indexOfRefraction;

        effect.setFloat4("vClearCoatRefractionParams", f0, eta, a, b);

        // Clear Coat tangent space params
        const mainPBRBlock = this.clearcoat.hasEndpoints ? (this.clearcoat.endpoints[0].ownerBlock as PBRMetallicRoughnessBlock) : null;
        const perturbedNormalBlock = mainPBRBlock?.perturbedNormal.isConnected ? (mainPBRBlock.perturbedNormal.connectedPoint!.ownerBlock as PerturbNormalBlock) : null;

        if (this._scene._mirroredCameraPosition) {
            effect.setFloat2("vClearCoatTangentSpaceParams", perturbedNormalBlock?.invertX ? 1.0 : -1.0, perturbedNormalBlock?.invertY ? 1.0 : -1.0);
        } else {
            effect.setFloat2("vClearCoatTangentSpaceParams", perturbedNormalBlock?.invertX ? -1.0 : 1.0, perturbedNormalBlock?.invertY ? -1.0 : 1.0);
        }

        if (mesh) {
            effect.setFloat(this._tangentCorrectionFactorName, mesh.getWorldMatrix().determinant() < 0 ? -1 : 1);
        }
    }

    private _generateTBNSpace(state: NodeMaterialBuildState, worldPositionVarName: string, worldNormalVarName: string) {
        let code = "";

        const comments = `//${this.name}`;
        const worldTangent = this.worldTangent;
        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;

        if (!isWebGPU) {
            state._emitExtension("derivatives", "#extension GL_OES_standard_derivatives : enable");
        }

        const tangentReplaceString = { search: /defined\(TANGENT\)/g, replace: worldTangent.isConnected ? "defined(TANGENT)" : "defined(IGNORE)" };

        const TBN = this.TBN;
        if (TBN.isConnected) {
            state.compilationString += `
            #ifdef TBNBLOCK
                ${isWebGPU ? "var TBN" : "mat3 TBN"} = ${TBN.associatedVariableName};
            #endif
            `;
        } else if (worldTangent.isConnected) {
            code += `${state._declareLocalVar("tbnNormal", NodeMaterialBlockConnectionPointTypes.Vector3)} = normalize(${worldNormalVarName}.xyz);\n`;
            code += `${state._declareLocalVar("tbnTangent", NodeMaterialBlockConnectionPointTypes.Vector3)} = normalize(${worldTangent.associatedVariableName}.xyz);\n`;
            code += `${state._declareLocalVar("tbnBitangent", NodeMaterialBlockConnectionPointTypes.Vector3)} = cross(tbnNormal, tbnTangent) * ${this._tangentCorrectionFactorName};\n`;
            code += `${isWebGPU ? "var vTBN" : "mat3 vTBN"} = ${isWebGPU ? "mat3x3f" : "mat3"}(tbnTangent, tbnBitangent, tbnNormal);\n`;
        }

        state._emitFunctionFromInclude("bumpFragmentMainFunctions", comments, {
            replaceStrings: [tangentReplaceString],
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
    public static GetCode(
        state: NodeMaterialBuildState,
        ccBlock: Nullable<ClearCoatBlock>,
        reflectionBlock: Nullable<ReflectionBlock>,
        worldPosVarName: string,
        generateTBNSpace: boolean,
        vTBNAvailable: boolean,
        worldNormalVarName: string
    ): string {
        let code = "";

        const intensity = ccBlock?.intensity.isConnected ? ccBlock.intensity.associatedVariableName : "1.";
        const roughness = ccBlock?.roughness.isConnected ? ccBlock.roughness.associatedVariableName : "0.";
        const normalMapColor = ccBlock?.normalMapColor.isConnected ? ccBlock.normalMapColor.associatedVariableName : `vec3${state.fSuffix}(0.)`;
        const uv = ccBlock?.uv.isConnected ? ccBlock.uv.associatedVariableName : `vec2${state.fSuffix}(0.)`;

        const tintColor = ccBlock?.tintColor.isConnected ? ccBlock.tintColor.associatedVariableName : `vec3${state.fSuffix}(1.)`;
        const tintThickness = ccBlock?.tintThickness.isConnected ? ccBlock.tintThickness.associatedVariableName : "1.";
        const tintAtDistance = ccBlock?.tintAtDistance.isConnected ? ccBlock.tintAtDistance.associatedVariableName : "1.";
        const tintTexture = `vec4${state.fSuffix}(0.)`;

        if (ccBlock) {
            state._emitUniformFromString("vClearCoatRefractionParams", NodeMaterialBlockConnectionPointTypes.Vector4);
            state._emitUniformFromString("vClearCoatTangentSpaceParams", NodeMaterialBlockConnectionPointTypes.Vector2);

            const normalShading = ccBlock.worldNormal;
            code += `${state._declareLocalVar("vGeometricNormaClearCoatW", NodeMaterialBlockConnectionPointTypes.Vector3)} = ${normalShading.isConnected ? "normalize(" + normalShading.associatedVariableName + ".xyz)" : "geometricNormalW"};\n`;
        } else {
            code += `${state._declareLocalVar("vGeometricNormaClearCoatW", NodeMaterialBlockConnectionPointTypes.Vector3)} = geometricNormalW;\n`;
        }

        if (generateTBNSpace && ccBlock) {
            code += ccBlock._generateTBNSpace(state, worldPosVarName, worldNormalVarName);
            vTBNAvailable = ccBlock.worldTangent.isConnected;
        }

        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;
        code += `${isWebGPU ? "var clearcoatOut: clearcoatOutParams" : "clearcoatOutParams clearcoatOut"};

        #ifdef CLEARCOAT
            ${state._declareLocalVar("vClearCoatParams", NodeMaterialBlockConnectionPointTypes.Vector2)} = vec2${state.fSuffix}(${intensity}, ${roughness});
            ${state._declareLocalVar("vClearCoatTintParams", NodeMaterialBlockConnectionPointTypes.Vector4)} = vec4${state.fSuffix}(${tintColor}, ${tintThickness});

            clearcoatOut = clearcoatBlock(
                ${worldPosVarName}.xyz
                , vGeometricNormaClearCoatW
                , viewDirectionW
                , vClearCoatParams
                , specularEnvironmentR0
            #ifdef CLEARCOAT_TEXTURE
                , vec2${state.fSuffix}(0.)
            #endif
            #ifdef CLEARCOAT_TINT
                , vClearCoatTintParams
                , ${tintAtDistance}
                , ${isWebGPU ? "uniforms." : ""}vClearCoatRefractionParams
                #ifdef CLEARCOAT_TINT_TEXTURE
                    , ${tintTexture}
                #endif
            #endif
            #ifdef CLEARCOAT_BUMP
                , vec2${state.fSuffix}(0., 1.)
                , vec4${state.fSuffix}(${normalMapColor}, 0.)
                , ${uv}
                #if defined(${vTBNAvailable ? "TANGENT" : "IGNORE"}) && defined(NORMAL)
                    , vTBN
                #else
                    , ${isWebGPU ? "uniforms." : ""}vClearCoatTangentSpaceParams
                #endif
                #ifdef OBJECTSPACE_NORMALMAP
                    , normalMatrix
                #endif
            #endif
            #if defined(FORCENORMALFORWARD) && defined(NORMAL)
                , faceNormal
            #endif
            #ifdef REFLECTION
                , ${isWebGPU ? "uniforms." : ""}${reflectionBlock?._vReflectionMicrosurfaceInfosName}
                , ${reflectionBlock?._vReflectionInfosName}
                , ${reflectionBlock?.reflectionColor}
                , ${isWebGPU ? "uniforms." : ""}vLightingIntensity
                #ifdef ${reflectionBlock?._define3DName}
                    , ${reflectionBlock?._cubeSamplerName}       
                    ${isWebGPU ? `, ${reflectionBlock?._cubeSamplerName}Sampler` : ""}
                #else
                    , ${reflectionBlock?._2DSamplerName}       
                    ${isWebGPU ? `, ${reflectionBlock?._2DSamplerName}Sampler` : ""}
                #endif
                #ifndef LODBASEDMICROSFURACE
                    #ifdef ${reflectionBlock?._define3DName}
                        , ${reflectionBlock?._cubeSamplerName}       
                        ${isWebGPU ? `, ${reflectionBlock?._cubeSamplerName}Sampler` : ""}
                        , ${reflectionBlock?._cubeSamplerName}
                        ${isWebGPU ? `, ${reflectionBlock?._cubeSamplerName}Sampler` : ""}
                    #else
                        , ${reflectionBlock?._2DSamplerName}
                        ${isWebGPU ? `, ${reflectionBlock?._2DSamplerName}Sampler` : ""}
                        , ${reflectionBlock?._2DSamplerName}
                        ${isWebGPU ? `, ${reflectionBlock?._2DSamplerName}Sampler` : ""}                        
                    #endif
                #endif
            #endif
            #if defined(CLEARCOAT_BUMP) || defined(TWOSIDEDLIGHTING)
                , (${state._generateTernary("1.", "-1.", isWebGPU ? "fragmentInputs.frontFacing" : "gl_FrontFacing")})
            #endif
            );
        #else
            clearcoatOut.specularEnvironmentR0 = specularEnvironmentR0;
        #endif\n`;

        return code;
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        this._scene = state.sharedData.scene;

        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.bindableBlocks.push(this);
            state.sharedData.blocksWithDefines.push(this);

            this._tangentCorrectionFactorName = state._getFreeDefineName("tangentCorrectionFactor");
            state._emitUniformFromString(this._tangentCorrectionFactorName, NodeMaterialBlockConnectionPointTypes.Float);
        }

        return this;
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        codeString += `${this._codeVariableName}.remapF0OnInterfaceChange = ${this.remapF0OnInterfaceChange};\n`;

        return codeString;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.remapF0OnInterfaceChange = this.remapF0OnInterfaceChange;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.remapF0OnInterfaceChange = serializationObject.remapF0OnInterfaceChange ?? true;
    }
}

RegisterClass("BABYLON.ClearCoatBlock", ClearCoatBlock);
