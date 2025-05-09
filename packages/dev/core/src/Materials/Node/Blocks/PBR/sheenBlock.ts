import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialConnectionPointDirection } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import type { ReflectionBlock } from "./reflectionBlock";
import type { Scene } from "../../../../scene";
import type { Nullable } from "../../../../types";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * Block used to implement the sheen module of the PBR material
 */
export class SheenBlock extends NodeMaterialBlock {
    /**
     * Create a new SheenBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("intensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("color", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("roughness", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput(
            "sheen",
            NodeMaterialBlockConnectionPointTypes.Object,
            NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("sheen", this, NodeMaterialConnectionPointDirection.Output, SheenBlock, "SheenBlock")
        );
    }

    /**
     * If true, the sheen effect is layered above the base BRDF with the albedo-scaling technique.
     * It allows the strength of the sheen effect to not depend on the base color of the material,
     * making it easier to setup and tweak the effect
     */
    @editableInPropertyPage("Albedo scaling", PropertyTypeForEdition.Boolean, "PROPERTIES", { embedded: true, notifiers: { update: true } })
    public albedoScaling: boolean = false;

    /**
     * Defines if the sheen is linked to the sheen color.
     */
    @editableInPropertyPage("Link sheen with albedo", PropertyTypeForEdition.Boolean, "PROPERTIES", { embedded: true, notifiers: { update: true } })
    public linkSheenWithAlbedo: boolean = false;

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("sheenOut");
        state._excludeVariableName("sheenMapData");
        state._excludeVariableName("vSheenColor");
        state._excludeVariableName("vSheenRoughness");
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SheenBlock";
    }

    /**
     * Gets the intensity input component
     */
    public get intensity(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the color input component
     */
    public get color(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the roughness input component
     */
    public get roughness(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the sheen object output component
     */
    public get sheen(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public override prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        super.prepareDefines(mesh, nodeMaterial, defines);

        defines.setValue("SHEEN", true);
        defines.setValue("SHEEN_USE_ROUGHNESS_FROM_MAINTEXTURE", true, true);
        defines.setValue("SHEEN_LINKWITHALBEDO", this.linkSheenWithAlbedo, true);
        defines.setValue("SHEEN_ROUGHNESS", this.roughness.isConnected, true);
        defines.setValue("SHEEN_ALBEDOSCALING", this.albedoScaling, true);
    }

    /**
     * Gets the main code of the block (fragment side)
     * @param reflectionBlock instance of a ReflectionBlock null if the code must be generated without an active reflection module
     * @param state define the build state
     * @returns the shader code
     */
    public getCode(reflectionBlock: Nullable<ReflectionBlock>, state: NodeMaterialBuildState): string {
        let code = "";

        const color = this.color.isConnected ? this.color.associatedVariableName : `vec3${state.fSuffix}(1.)`;
        const intensity = this.intensity.isConnected ? this.intensity.associatedVariableName : "1.";
        const roughness = this.roughness.isConnected ? this.roughness.associatedVariableName : "0.";
        const texture = `vec4${state.fSuffix}(0.)`;
        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;

        code = `#ifdef SHEEN
            ${isWebGPU ? "var sheenOut: sheenOutParams" : "sheenOutParams sheenOut"};

            ${state._declareLocalVar("vSheenColor", NodeMaterialBlockConnectionPointTypes.Vector4)} = vec4${state.fSuffix}(${color}, ${intensity});

            sheenOut = sheenBlock(
                vSheenColor
            #ifdef SHEEN_ROUGHNESS
                , ${roughness}
            #endif
                , roughness
            #ifdef SHEEN_TEXTURE
                , ${texture}
                ${isWebGPU ? `, ${texture}Sampler` : ""}
                , 1.0
            #endif
                , reflectanceF0
            #ifdef SHEEN_LINKWITHALBEDO
                , baseColor
                , surfaceAlbedo
            #endif
            #ifdef ENVIRONMENTBRDF
                , NdotV
                , environmentBrdf
            #endif
            #if defined(REFLECTION) && defined(ENVIRONMENTBRDF)
                , AARoughnessFactors
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
                , reflectionOut.reflectionCoords
                , NdotVUnclamped
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
                #if !defined(${reflectionBlock?._defineSkyboxName}) && defined(RADIANCEOCCLUSION)
                    , seo
                #endif
                #if !defined(${reflectionBlock?._defineSkyboxName}) && defined(HORIZONOCCLUSION) && defined(BUMP) && defined(${reflectionBlock?._define3DName})
                    , eho
                #endif
            #endif
            );

            #ifdef SHEEN_LINKWITHALBEDO
                surfaceAlbedo = sheenOut.surfaceAlbedo;
            #endif
        #endif\n`;

        return code;
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.blocksWithDefines.push(this);
        }

        return this;
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        codeString += `${this._codeVariableName}.albedoScaling = ${this.albedoScaling};\n`;
        codeString += `${this._codeVariableName}.linkSheenWithAlbedo = ${this.linkSheenWithAlbedo};\n`;

        return codeString;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.albedoScaling = this.albedoScaling;
        serializationObject.linkSheenWithAlbedo = this.linkSheenWithAlbedo;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.albedoScaling = serializationObject.albedoScaling;
        this.linkSheenWithAlbedo = serializationObject.linkSheenWithAlbedo;
    }
}

RegisterClass("BABYLON.SheenBlock", SheenBlock);
