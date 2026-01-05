import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialConnectionPointDirection } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../../Misc/typeStore";
import { InputBlock } from "../Input/inputBlock";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import type { NodeMaterialDefines } from "../../nodeMaterial";
import type { ReflectionBlock } from "./reflectionBlock";
import type { Nullable } from "../../../../types";
import { RefractionBlock } from "./refractionBlock";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { PBRSubSurfaceConfiguration } from "core/Materials/PBR/pbrSubSurfaceConfiguration";

/**
 * Block used to implement the sub surface module of the PBR material
 */
export class SubSurfaceBlock extends NodeMaterialBlock {
    /**
     * Create a new SubSurfaceBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Fragment);

        this._isUnique = true;

        this.registerInput("thickness", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("tintColor", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("translucencyIntensity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("translucencyDiffusionDist", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput(
            "refraction",
            NodeMaterialBlockConnectionPointTypes.Object,
            true,
            NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("refraction", this, NodeMaterialConnectionPointDirection.Input, RefractionBlock, "RefractionBlock")
        );
        this.registerInput("dispersion", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);

        this.registerOutput(
            "subsurface",
            NodeMaterialBlockConnectionPointTypes.Object,
            NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("subsurface", this, NodeMaterialConnectionPointDirection.Output, SubSurfaceBlock, "SubSurfaceBlock")
        );
    }

    /**
     * Set it to true if your rendering in 8.0+ is different from that in 7 when you use sub-surface properties (transmission, refraction, etc.)
     */
    @editableInPropertyPage("Apply albedo after sub-surface", PropertyTypeForEdition.Boolean, "ADVANCED")
    public applyAlbedoAfterSubSurface: boolean = PBRSubSurfaceConfiguration.DEFAULT_APPLY_ALBEDO_AFTERSUBSURFACE;

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("subSurfaceOut");
        state._excludeVariableName("vThicknessParam");
        state._excludeVariableName("vTintColor");
        state._excludeVariableName("vTranslucencyColor");
        state._excludeVariableName("vSubSurfaceIntensity");
        state._excludeVariableName("dispersion");
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SubSurfaceBlock";
    }

    /**
     * Gets the thickness component
     */
    public get thickness(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the tint color input component
     */
    public get tintColor(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the translucency intensity input component
     */
    public get translucencyIntensity(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the translucency diffusion distance input component
     */
    public get translucencyDiffusionDist(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the refraction object parameters
     */
    public get refraction(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the dispersion input component
     */
    public get dispersion(): NodeMaterialConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the sub surface object output component
     */
    public get subsurface(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public override autoConfigure() {
        if (!this.thickness.isConnected) {
            const thicknessInput = new InputBlock("SubSurface thickness", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
            thicknessInput.value = 0;
            thicknessInput.output.connectTo(this.thickness);
        }
    }

    public override prepareDefines(defines: NodeMaterialDefines) {
        const translucencyEnabled = this.translucencyDiffusionDist.isConnected || this.translucencyIntensity.isConnected;

        defines.setValue("SUBSURFACE", translucencyEnabled || this.refraction.isConnected, true);
        defines.setValue("SS_TRANSLUCENCY", translucencyEnabled, true);
        defines.setValue("SS_THICKNESSANDMASK_TEXTURE", false, true);
        defines.setValue("SS_REFRACTIONINTENSITY_TEXTURE", false, true);
        defines.setValue("SS_TRANSLUCENCYINTENSITY_TEXTURE", false, true);
        defines.setValue("SS_USE_GLTF_TEXTURES", false, true);
        defines.setValue("SS_DISPERSION", this.dispersion.isConnected, true);
        defines.setValue("SS_APPLY_ALBEDO_AFTER_SUBSURFACE", this.applyAlbedoAfterSubSurface, true);
    }

    /**
     * Gets the main code of the block (fragment side)
     * @param state current state of the node material building
     * @param ssBlock instance of a SubSurfaceBlock or null if the code must be generated without an active sub surface module
     * @param reflectionBlock instance of a ReflectionBlock null if the code must be generated without an active reflection module
     * @param worldPosVarName name of the variable holding the world position
     * @returns the shader code
     */
    public static GetCode(state: NodeMaterialBuildState, ssBlock: Nullable<SubSurfaceBlock>, reflectionBlock: Nullable<ReflectionBlock>, worldPosVarName: string): string {
        let code = "";

        const thickness = ssBlock?.thickness.isConnected ? ssBlock.thickness.associatedVariableName : "0.";
        const tintColor = ssBlock?.tintColor.isConnected ? ssBlock.tintColor.associatedVariableName : "vec3(1.)";
        const translucencyIntensity = ssBlock?.translucencyIntensity.isConnected ? ssBlock?.translucencyIntensity.associatedVariableName : "1.";
        const translucencyDiffusionDistance = ssBlock?.translucencyDiffusionDist.isConnected ? ssBlock?.translucencyDiffusionDist.associatedVariableName : "vec3(1.)";

        const refractionBlock: Nullable<RefractionBlock> = (ssBlock?.refraction.isConnected ? ssBlock?.refraction.connectedPoint?.ownerBlock : null) as Nullable<RefractionBlock>;

        const refractionTintAtDistance = refractionBlock?.tintAtDistance.isConnected ? refractionBlock.tintAtDistance.associatedVariableName : "1.";
        const refractionIntensity = refractionBlock?.intensity.isConnected ? refractionBlock.intensity.associatedVariableName : "1.";
        const refractionView = refractionBlock?.view.isConnected ? refractionBlock.view.associatedVariableName : "";

        const dispersion = ssBlock?.dispersion.isConnected ? ssBlock?.dispersion.associatedVariableName : "0.0";
        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;

        code += refractionBlock?.getCode(state) ?? "";

        code += `${isWebGPU ? "var subSurfaceOut: subSurfaceOutParams" : "subSurfaceOutParams subSurfaceOut"};

        #ifdef SUBSURFACE
            ${state._declareLocalVar("vThicknessParam", NodeMaterialBlockConnectionPointTypes.Vector2)} = vec2${state.fSuffix}(0., ${thickness});
            ${state._declareLocalVar("vTintColor", NodeMaterialBlockConnectionPointTypes.Vector4)} = vec4${state.fSuffix}(${tintColor}, ${refractionTintAtDistance});
            ${state._declareLocalVar("vSubSurfaceIntensity", NodeMaterialBlockConnectionPointTypes.Vector3)} = vec3(${refractionIntensity}, ${translucencyIntensity}, 0.);
            ${state._declareLocalVar("dispersion", NodeMaterialBlockConnectionPointTypes.Float)} = ${dispersion};
            subSurfaceOut = subSurfaceBlock(
                vSubSurfaceIntensity
                , vThicknessParam
                , vTintColor
                , normalW
            #ifdef LEGACY_SPECULAR_ENERGY_CONSERVATION
        `;

        code += isWebGPU
            ? `, vec3f(max(colorSpecularEnvironmentReflectance.r, max(colorSpecularEnvironmentReflectance.g, colorSpecularEnvironmentReflectance.b)))/n`
            : `, vec3(max(colorSpecularEnvironmentReflectance.r, max(colorSpecularEnvironmentReflectance.g, colorSpecularEnvironmentReflectance.b)))/n`;

        code += `#else
                , baseSpecularEnvironmentReflectance
            #endif
            #ifdef SS_THICKNESSANDMASK_TEXTURE
                , vec4${state.fSuffix}(0.)
            #endif
            #ifdef REFLECTION
                #ifdef SS_TRANSLUCENCY
                    , ${(isWebGPU ? "uniforms." : "") + reflectionBlock?._reflectionMatrixName}
                    #ifdef USESPHERICALFROMREFLECTIONMAP
                        #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
                            , reflectionOut.irradianceVector
                        #endif
                        #if defined(REALTIME_FILTERING)
                            , ${reflectionBlock?._cubeSamplerName}
                            ${isWebGPU ? `, ${reflectionBlock?._cubeSamplerName}Sampler` : ""}
                            , ${reflectionBlock?._vReflectionFilteringInfoName}
                        #endif
                        #endif
                    #ifdef USEIRRADIANCEMAP
                        , irradianceSampler
                        ${isWebGPU ? `, irradianceSamplerSampler` : ""}
                    #endif
                #endif
            #endif
            #if defined(SS_REFRACTION) || defined(SS_TRANSLUCENCY)
                , surfaceAlbedo
            #endif
            #ifdef SS_REFRACTION
                , ${worldPosVarName}.xyz
                , viewDirectionW
                , ${refractionView}
                , ${(isWebGPU ? "uniforms." : "") + (refractionBlock?._vRefractionInfosName ?? "")}
                , ${(isWebGPU ? "uniforms." : "") + (refractionBlock?._refractionMatrixName ?? "")}
                , ${(isWebGPU ? "uniforms." : "") + (refractionBlock?._vRefractionMicrosurfaceInfosName ?? "")}
                , ${isWebGPU ? "uniforms." : ""}vLightingIntensity
                #ifdef SS_LINKREFRACTIONTOTRANSPARENCY
                    , alpha
                #endif
                #ifdef ${refractionBlock?._defineLODRefractionAlpha ?? "IGNORE"}
                    , NdotVUnclamped
                #endif
                #ifdef ${refractionBlock?._defineLinearSpecularRefraction ?? "IGNORE"}
                    , roughness
                #endif
                , alphaG
                #ifdef ${refractionBlock?._define3DName ?? "IGNORE"}
                    , ${refractionBlock?._cubeSamplerName ?? ""}
                    ${isWebGPU ? `, ${refractionBlock?._cubeSamplerName}Sampler` : ""}
                #else
                    , ${refractionBlock?._2DSamplerName ?? ""}
                    ${isWebGPU ? `, ${refractionBlock?._2DSamplerName}Sampler` : ""}
                #endif
                #ifndef LODBASEDMICROSFURACE
                    #ifdef ${refractionBlock?._define3DName ?? "IGNORE"}
                        , ${refractionBlock?._cubeSamplerName ?? ""}                        
                        ${isWebGPU ? `, ${refractionBlock?._cubeSamplerName}Sampler` : ""}
                        , ${refractionBlock?._cubeSamplerName ?? ""}                        
                        ${isWebGPU ? `, ${refractionBlock?._cubeSamplerName}Sampler` : ""}
                    #else
                        , ${refractionBlock?._2DSamplerName ?? ""}
                        ${isWebGPU ? `, ${refractionBlock?._2DSamplerName}Sampler` : ""}
                        , ${refractionBlock?._2DSamplerName ?? ""}
                        ${isWebGPU ? `, ${refractionBlock?._2DSamplerName}Sampler` : ""}
                    #endif
                #endif
                #ifdef ANISOTROPIC
                    , anisotropicOut
                #endif
                #ifdef REALTIME_FILTERING
                    , ${refractionBlock?._vRefractionFilteringInfoName ?? ""}
                #endif
                #ifdef SS_USE_LOCAL_REFRACTIONMAP_CUBIC
                    , vRefractionPosition
                    , vRefractionSize
                #endif
                #ifdef SS_DISPERSION
                    , dispersion
                #endif
            #endif
            #ifdef SS_TRANSLUCENCY
                , ${translucencyDiffusionDistance}
                , vTintColor
                #ifdef SS_TRANSLUCENCYCOLOR_TEXTURE
                    , vec4${state.fSuffix}(0.)
                #endif
            #endif                
            );

            #ifdef SS_REFRACTION
                surfaceAlbedo = subSurfaceOut.surfaceAlbedo;
                #ifdef SS_LINKREFRACTIONTOTRANSPARENCY
                    alpha = subSurfaceOut.alpha;
                #endif
            #endif
        #else
            subSurfaceOut.specularEnvironmentReflectance = colorSpecularEnvironmentReflectance;
        #endif\n`;

        return code;
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.blocksWithDefines.push(this);
        }

        return this;
    }
}

RegisterClass("BABYLON.SubSurfaceBlock", SubSurfaceBlock);
