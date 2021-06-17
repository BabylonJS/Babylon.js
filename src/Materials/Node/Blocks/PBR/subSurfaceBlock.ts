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
import { Nullable } from '../../../../types';
import { RefractionBlock } from './refractionBlock';

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
        this.registerInput("refraction", NodeMaterialBlockConnectionPointTypes.Object, true, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("refraction", this, NodeMaterialConnectionPointDirection.Input, RefractionBlock, "RefractionBlock"));

        this.registerOutput("subsurface", NodeMaterialBlockConnectionPointTypes.Object, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("subsurface", this, NodeMaterialConnectionPointDirection.Output, SubSurfaceBlock, "SubSurfaceBlock"));
    }

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("subSurfaceOut");
        state._excludeVariableName("vThicknessParam");
        state._excludeVariableName("vTintColor");
        state._excludeVariableName("vSubSurfaceIntensity");
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
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
     * Gets the sub surface object output component
     */
    public get subsurface(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure(material: NodeMaterial) {
        if (!this.thickness.isConnected) {
            let thicknessInput = new InputBlock("SubSurface thickness", NodeMaterialBlockTargets.Fragment, NodeMaterialBlockConnectionPointTypes.Float);
            thicknessInput.value = 0;
            thicknessInput.output.connectTo(this.thickness);
        }
    }

    public prepareDefines(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        super.prepareDefines(mesh, nodeMaterial, defines);

        const translucencyEnabled = this.translucencyDiffusionDist.isConnected || this.translucencyIntensity.isConnected;

        defines.setValue("SUBSURFACE", translucencyEnabled || this.refraction.isConnected, true);
        defines.setValue("SS_TRANSLUCENCY", translucencyEnabled, true);
        defines.setValue("SS_THICKNESSANDMASK_TEXTURE", false, true);
        defines.setValue("SS_REFRACTIONINTENSITY_TEXTURE", false, true);
        defines.setValue("SS_TRANSLUCENCYINTENSITY_TEXTURE", false, true);
        defines.setValue("SS_MASK_FROM_THICKNESS_TEXTURE", false, true);
        defines.setValue("SS_USE_GLTF_TEXTURES", false, true);
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

        code += refractionBlock?.getCode(state) ?? "";

        code += `subSurfaceOutParams subSurfaceOut;

        #ifdef SUBSURFACE
            vec2 vThicknessParam = vec2(0., ${thickness});
            vec4 vTintColor = vec4(${tintColor}, ${refractionTintAtDistance});
            vec3 vSubSurfaceIntensity = vec3(${refractionIntensity}, ${translucencyIntensity}, 0.);

            subSurfaceBlock(
                vSubSurfaceIntensity,
                vThicknessParam,
                vTintColor,
                normalW,
                specularEnvironmentReflectance,
            #ifdef SS_THICKNESSANDMASK_TEXTURE
                vec4(0.),
            #endif
            #ifdef REFLECTION
                #ifdef SS_TRANSLUCENCY
                    ${reflectionBlock?._reflectionMatrixName},
                    #ifdef USESPHERICALFROMREFLECTIONMAP
                        #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
                            reflectionOut.irradianceVector,
                        #endif
                        #if defined(REALTIME_FILTERING)
                            ${reflectionBlock?._cubeSamplerName},
                            ${reflectionBlock?._vReflectionFilteringInfoName},
                        #endif
                        #endif
                    #ifdef USEIRRADIANCEMAP
                        irradianceSampler,
                    #endif
                #endif
            #endif
            #if defined(SS_REFRACTION) || defined(SS_TRANSLUCENCY)
                surfaceAlbedo,
            #endif
            #ifdef SS_REFRACTION
                ${worldPosVarName}.xyz,
                viewDirectionW,
                ${refractionView},
                ${refractionBlock?._vRefractionInfosName ?? ""},
                ${refractionBlock?._refractionMatrixName ?? ""},
                ${refractionBlock?._vRefractionMicrosurfaceInfosName ?? ""},
                vLightingIntensity,
                #ifdef SS_LINKREFRACTIONTOTRANSPARENCY
                    alpha,
                #endif
                #ifdef ${refractionBlock?._defineLODRefractionAlpha ?? "IGNORE"}
                    NdotVUnclamped,
                #endif
                #ifdef ${refractionBlock?._defineLinearSpecularRefraction ?? "IGNORE"}
                    roughness,
                #endif
                alphaG,
                #ifdef ${refractionBlock?._define3DName ?? "IGNORE"}
                    ${refractionBlock?._cubeSamplerName ?? ""},
                #else
                    ${refractionBlock?._2DSamplerName ?? ""},
                #endif
                #ifndef LODBASEDMICROSFURACE
                    #ifdef ${refractionBlock?._define3DName ?? "IGNORE"}
                        ${refractionBlock?._cubeSamplerName ?? ""},
                        ${refractionBlock?._cubeSamplerName ?? ""},
                    #else
                        ${refractionBlock?._2DSamplerName ?? ""},
                        ${refractionBlock?._2DSamplerName ?? ""},
                    #endif
                #endif
                #ifdef ANISOTROPIC
                    anisotropicOut,
                #endif
                #ifdef REALTIME_FILTERING
                    ${refractionBlock?._vRefractionFilteringInfoName ?? ""},
                #endif
                #ifdef SS_USE_LOCAL_REFRACTIONMAP_CUBIC
                    vRefractionPosition,
                    vRefractionSize,
                #endif
            #endif
            #ifdef SS_TRANSLUCENCY
                ${translucencyDiffusionDistance},
            #endif
                subSurfaceOut
            );

            #ifdef SS_REFRACTION
                surfaceAlbedo = subSurfaceOut.surfaceAlbedo;
                #ifdef SS_LINKREFRACTIONTOTRANSPARENCY
                    alpha = subSurfaceOut.alpha;
                #endif
            #endif
        #else
            subSurfaceOut.specularEnvironmentReflectance = specularEnvironmentReflectance;
        #endif\r\n`;

        return code;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        if (state.target === NodeMaterialBlockTargets.Fragment) {
            state.sharedData.blocksWithDefines.push(this);
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.SubSurfaceBlock"] = SubSurfaceBlock;