import { NodeMaterialBlock } from "../../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialConnectionPointDirection } from "../../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../../Enums/nodeMaterialBlockTargets";
import type { NodeMaterial, NodeMaterialDefines } from "../../nodeMaterial";
import { NodeMaterialSystemValues } from "../../Enums/nodeMaterialSystemValues";
import { InputBlock } from "../Input/inputBlock";
import type { Light } from "../../../../Lights/light";
import type { Nullable } from "../../../../types";
import { RegisterClass } from "../../../../Misc/typeStore";
import type { AbstractMesh } from "../../../../Meshes/abstractMesh";
import type { Effect } from "../../../effect";
import type { Mesh } from "../../../../Meshes/mesh";
import { PBRBaseMaterial } from "../../../PBR/pbrBaseMaterial";
import type { Scene } from "../../../../scene";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import { SheenBlock } from "./sheenBlock";
import type { BaseTexture } from "../../../Textures/baseTexture";
import { GetEnvironmentBRDFTexture } from "../../../../Misc/brdfTextureTools";
import { MaterialFlags } from "../../../materialFlags";
import { AnisotropyBlock } from "./anisotropyBlock";
import { ReflectionBlock } from "./reflectionBlock";
import { ClearCoatBlock } from "./clearCoatBlock";
import { IridescenceBlock } from "./iridescenceBlock";
import { SubSurfaceBlock } from "./subSurfaceBlock";
import type { RefractionBlock } from "./refractionBlock";
import type { PerturbNormalBlock } from "../Fragment/perturbNormalBlock";
import { Constants } from "../../../../Engines/constants";
import { Color3 } from "../../../../Maths/math.color";
import { Logger } from "core/Misc/logger";
import {
    BindLight,
    BindLights,
    PrepareDefinesForLight,
    PrepareDefinesForLights,
    PrepareDefinesForMultiview,
    PrepareUniformsAndSamplersForLight,
} from "../../../materialHelper.functions";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

const MapOutputToVariable: { [name: string]: [string, string] } = {
    ambientClr: ["finalAmbient", ""],
    diffuseDir: ["finalDiffuse", ""],
    specularDir: ["finalSpecularScaled", "!defined(UNLIT) && defined(SPECULARTERM)"],
    clearcoatDir: ["finalClearCoatScaled", "!defined(UNLIT) && defined(CLEARCOAT)"],
    sheenDir: ["finalSheenScaled", "!defined(UNLIT) && defined(SHEEN)"],
    diffuseInd: ["finalIrradiance", "!defined(UNLIT) && defined(REFLECTION)"],
    specularInd: ["finalRadianceScaled", "!defined(UNLIT) && defined(REFLECTION)"],
    clearcoatInd: ["clearcoatOut.finalClearCoatRadianceScaled", "!defined(UNLIT) && defined(REFLECTION) && defined(CLEARCOAT)"],
    sheenInd: ["sheenOut.finalSheenRadianceScaled", "!defined(UNLIT) && defined(REFLECTION) && defined(SHEEN) && defined(ENVIRONMENTBRDF)"],
    refraction: ["subSurfaceOut.finalRefraction", "!defined(UNLIT) && defined(SS_REFRACTION)"],
    lighting: ["finalColor.rgb", ""],
    shadow: ["aggShadow", ""],
    alpha: ["alpha", ""],
};

/**
 * Block used to implement the PBR metallic/roughness model
 * @see https://playground.babylonjs.com/#D8AK3Z#80
 */
export class PBRMetallicRoughnessBlock extends NodeMaterialBlock {
    /**
     * Gets or sets the light associated with this block
     */
    public light: Nullable<Light>;

    private static _OnGenerateOnlyFragmentCodeChanged(block: NodeMaterialBlock, _propertyName: string): boolean {
        const that = block as PBRMetallicRoughnessBlock;

        if (that.worldPosition.isConnected || that.worldNormal.isConnected) {
            that.generateOnlyFragmentCode = !that.generateOnlyFragmentCode;
            Logger.Error("The worldPosition and worldNormal inputs must not be connected to be able to switch!");
            return false;
        }

        that._setTarget();

        return true;
    }

    private _setTarget(): void {
        this._setInitialTarget(this.generateOnlyFragmentCode ? NodeMaterialBlockTargets.Fragment : NodeMaterialBlockTargets.VertexAndFragment);
        this.getInputByName("worldPosition")!.target = this.generateOnlyFragmentCode ? NodeMaterialBlockTargets.Fragment : NodeMaterialBlockTargets.Vertex;
        this.getInputByName("worldNormal")!.target = this.generateOnlyFragmentCode ? NodeMaterialBlockTargets.Fragment : NodeMaterialBlockTargets.Vertex;
    }

    private _lightId: number;
    private _scene: Scene;
    private _environmentBRDFTexture: Nullable<BaseTexture> = null;
    private _environmentBrdfSamplerName: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private _vNormalWName: string;
    private _invertNormalName: string;
    private _metallicReflectanceColor: Color3 = Color3.White();
    private _metallicF0Factor = 1;
    private _vMetallicReflectanceFactorsName: string;
    private _baseDiffuseRoughnessName: string;

    /**
     * Create a new ReflectionBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);

        this._isUnique = true;

        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("view", NodeMaterialBlockConnectionPointTypes.Matrix, false);
        this.registerInput("cameraPosition", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("perturbedNormal", NodeMaterialBlockConnectionPointTypes.Vector4, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("baseColor", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("metallic", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("roughness", NodeMaterialBlockConnectionPointTypes.Float, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("ambientOcc", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("opacity", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("indexOfRefraction", NodeMaterialBlockConnectionPointTypes.Float, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("ambientColor", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput(
            "reflection",
            NodeMaterialBlockConnectionPointTypes.Object,
            true,
            NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("reflection", this, NodeMaterialConnectionPointDirection.Input, ReflectionBlock, "ReflectionBlock")
        );
        this.registerInput(
            "clearcoat",
            NodeMaterialBlockConnectionPointTypes.Object,
            true,
            NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("clearcoat", this, NodeMaterialConnectionPointDirection.Input, ClearCoatBlock, "ClearCoatBlock")
        );
        this.registerInput(
            "sheen",
            NodeMaterialBlockConnectionPointTypes.Object,
            true,
            NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("sheen", this, NodeMaterialConnectionPointDirection.Input, SheenBlock, "SheenBlock")
        );
        this.registerInput(
            "subsurface",
            NodeMaterialBlockConnectionPointTypes.Object,
            true,
            NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("subsurface", this, NodeMaterialConnectionPointDirection.Input, SubSurfaceBlock, "SubSurfaceBlock")
        );
        this.registerInput(
            "anisotropy",
            NodeMaterialBlockConnectionPointTypes.Object,
            true,
            NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("anisotropy", this, NodeMaterialConnectionPointDirection.Input, AnisotropyBlock, "AnisotropyBlock")
        );
        this.registerInput(
            "iridescence",
            NodeMaterialBlockConnectionPointTypes.Object,
            true,
            NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("iridescence", this, NodeMaterialConnectionPointDirection.Input, IridescenceBlock, "IridescenceBlock")
        );

        this.registerOutput("ambientClr", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("diffuseDir", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("specularDir", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("clearcoatDir", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("sheenDir", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("diffuseInd", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("specularInd", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("clearcoatInd", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("sheenInd", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("refraction", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("lighting", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("shadow", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("alpha", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
    }

    /**
     * Intensity of the direct lights e.g. the four lights available in your scene.
     * This impacts both the direct diffuse and specular highlights.
     */
    @editableInPropertyPage("Direct lights", PropertyTypeForEdition.Float, "INTENSITY", { min: 0, max: 1, notifiers: { update: true } })
    public directIntensity: number = 1.0;

    /**
     * Intensity of the environment e.g. how much the environment will light the object
     * either through harmonics for rough material or through the reflection for shiny ones.
     */
    @editableInPropertyPage("Environment lights", PropertyTypeForEdition.Float, "INTENSITY", { min: 0, max: 1, notifiers: { update: true } })
    public environmentIntensity: number = 1.0;

    /**
     * This is a special control allowing the reduction of the specular highlights coming from the
     * four lights of the scene. Those highlights may not be needed in full environment lighting.
     */
    @editableInPropertyPage("Specular highlights", PropertyTypeForEdition.Float, "INTENSITY", { min: 0, max: 1, notifiers: { update: true } })
    public specularIntensity: number = 1.0;

    /**
     * Defines the  falloff type used in this material.
     * It by default is Physical.
     */
    @editableInPropertyPage("Light falloff", PropertyTypeForEdition.List, "LIGHTING & COLORS", {
        notifiers: { update: true },
        options: [
            { label: "Physical", value: PBRBaseMaterial.LIGHTFALLOFF_PHYSICAL },
            { label: "GLTF", value: PBRBaseMaterial.LIGHTFALLOFF_GLTF },
            { label: "Standard", value: PBRBaseMaterial.LIGHTFALLOFF_STANDARD },
        ],
    })
    public lightFalloff = 0;

    /**
     * Specifies that alpha test should be used
     */
    @editableInPropertyPage("Alpha Testing", PropertyTypeForEdition.Boolean, "OPACITY")
    public useAlphaTest: boolean = false;

    /**
     * Defines the alpha limits in alpha test mode.
     */
    @editableInPropertyPage("Alpha CutOff", PropertyTypeForEdition.Float, "OPACITY", { min: 0, max: 1, notifiers: { update: true } })
    public alphaTestCutoff: number = 0.5;

    /**
     * Specifies that alpha blending should be used
     */
    @editableInPropertyPage("Alpha blending", PropertyTypeForEdition.Boolean, "OPACITY")
    public useAlphaBlending: boolean = false;

    /**
     * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most luminous ones).
     * A car glass is a good example of that. When the street lights reflects on it you can not see what is behind.
     */
    @editableInPropertyPage("Radiance over alpha", PropertyTypeForEdition.Boolean, "RENDERING", { notifiers: { update: true } })
    public useRadianceOverAlpha: boolean = true;

    /**
     * Specifies that the material will keeps the specular highlights over a transparent surface (only the most luminous ones).
     * A car glass is a good example of that. When sun reflects on it you can not see what is behind.
     */
    @editableInPropertyPage("Specular over alpha", PropertyTypeForEdition.Boolean, "RENDERING", { notifiers: { update: true } })
    public useSpecularOverAlpha: boolean = true;

    /**
     * Enables specular anti aliasing in the PBR shader.
     * It will both interacts on the Geometry for analytical and IBL lighting.
     * It also prefilter the roughness map based on the bump values.
     */
    @editableInPropertyPage("Specular anti-aliasing", PropertyTypeForEdition.Boolean, "RENDERING", { notifiers: { update: true } })
    public enableSpecularAntiAliasing: boolean = false;

    /**
     * Enables realtime filtering on the texture.
     */
    @editableInPropertyPage("Realtime filtering", PropertyTypeForEdition.Boolean, "RENDERING", { notifiers: { update: true } })
    public realTimeFiltering: boolean = false;

    /**
     * Quality switch for realtime filtering
     */
    @editableInPropertyPage("Realtime filtering quality", PropertyTypeForEdition.List, "RENDERING", {
        notifiers: { update: true },
        options: [
            { label: "Low", value: Constants.TEXTURE_FILTERING_QUALITY_LOW },
            { label: "Medium", value: Constants.TEXTURE_FILTERING_QUALITY_MEDIUM },
            { label: "High", value: Constants.TEXTURE_FILTERING_QUALITY_HIGH },
        ],
    })
    public realTimeFilteringQuality = Constants.TEXTURE_FILTERING_QUALITY_LOW;

    /**
     * Base Diffuse Model
     */
    @editableInPropertyPage("Diffuse Model", PropertyTypeForEdition.List, "RENDERING", {
        notifiers: { update: true },
        options: [
            { label: "Lambert", value: Constants.MATERIAL_DIFFUSE_MODEL_LAMBERT },
            { label: "Burley", value: Constants.MATERIAL_DIFFUSE_MODEL_BURLEY },
            { label: "Oren-Nayar", value: Constants.MATERIAL_DIFFUSE_MODEL_E_OREN_NAYAR },
            { label: "Legacy", value: Constants.MATERIAL_DIFFUSE_MODEL_LEGACY },
        ],
    })
    public baseDiffuseModel = Constants.MATERIAL_DIFFUSE_MODEL_E_OREN_NAYAR;

    /**
     * Defines if the material uses energy conservation.
     */
    @editableInPropertyPage("Energy Conservation", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { update: true } })
    public useEnergyConservation: boolean = true;

    /**
     * This parameters will enable/disable radiance occlusion by preventing the radiance to lit
     * too much the area relying on ambient texture to define their ambient occlusion.
     */
    @editableInPropertyPage("Radiance occlusion", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { update: true } })
    public useRadianceOcclusion: boolean = true;

    /**
     * This parameters will enable/disable Horizon occlusion to prevent normal maps to look shiny when the normal
     * makes the reflect vector face the model (under horizon).
     */
    @editableInPropertyPage("Horizon occlusion", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { update: true } })
    public useHorizonOcclusion: boolean = true;

    /**
     * If set to true, no lighting calculations will be applied.
     */
    @editableInPropertyPage("Unlit", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { update: true } })
    public unlit: boolean = false;

    /**
     * Force normal to face away from face.
     */
    @editableInPropertyPage("Force normal forward", PropertyTypeForEdition.Boolean, "ADVANCED", { notifiers: { update: true } })
    public forceNormalForward: boolean = false;

    /** Indicates that no code should be generated in the vertex shader. Can be useful in some specific circumstances (like when doing ray marching for eg) */
    @editableInPropertyPage("Generate only fragment code", PropertyTypeForEdition.Boolean, "ADVANCED", {
        notifiers: { rebuild: true, update: true, onValidation: PBRMetallicRoughnessBlock._OnGenerateOnlyFragmentCodeChanged },
    })
    public generateOnlyFragmentCode = false;

    /**
     * Defines the material debug mode.
     * It helps seeing only some components of the material while troubleshooting.
     */
    @editableInPropertyPage("Debug mode", PropertyTypeForEdition.List, "DEBUG", {
        notifiers: { update: true },
        options: [
            { label: "None", value: 0 },
            // Geometry
            { label: "Normalized position", value: 1 },
            { label: "Normals", value: 2 },
            { label: "Tangents", value: 3 },
            { label: "Bitangents", value: 4 },
            { label: "Bump Normals", value: 5 },
            //{ label: "UV1", value: 6 },
            //{ label: "UV2", value: 7 },
            { label: "ClearCoat Normals", value: 8 },
            { label: "ClearCoat Tangents", value: 9 },
            { label: "ClearCoat Bitangents", value: 10 },
            { label: "Anisotropic Normals", value: 11 },
            { label: "Anisotropic Tangents", value: 12 },
            { label: "Anisotropic Bitangents", value: 13 },
            // Maps
            //{ label: "Emissive Map", value: 23 },
            //{ label: "Light Map", value: 24 },
            // Env
            { label: "Env Refraction", value: 40 },
            { label: "Env Reflection", value: 41 },
            { label: "Env Clear Coat", value: 42 },
            // Lighting
            { label: "Direct Diffuse", value: 50 },
            { label: "Direct Specular", value: 51 },
            { label: "Direct Clear Coat", value: 52 },
            { label: "Direct Sheen", value: 53 },
            { label: "Env Irradiance", value: 54 },
            // Lighting Params
            { label: "Surface Albedo", value: 60 },
            { label: "Reflectance 0", value: 61 },
            { label: "Metallic", value: 62 },
            { label: "Metallic F0", value: 71 },
            { label: "Roughness", value: 63 },
            { label: "AlphaG", value: 64 },
            { label: "NdotV", value: 65 },
            { label: "ClearCoat Color", value: 66 },
            { label: "ClearCoat Roughness", value: 67 },
            { label: "ClearCoat NdotV", value: 68 },
            { label: "Transmittance", value: 69 },
            { label: "Refraction Transmittance", value: 70 },
            // Misc
            { label: "SEO", value: 80 },
            { label: "EHO", value: 81 },
            { label: "Energy Factor", value: 82 },
            { label: "Specular Reflectance", value: 83 },
            { label: "Clear Coat Reflectance", value: 84 },
            { label: "Sheen Reflectance", value: 85 },
            { label: "Luminance Over Alpha", value: 86 },
            { label: "Alpha", value: 87 },
            { label: "Albedo color", value: 88 },
            { label: "Ambient occlusion color", value: 89 },
        ],
    })
    public debugMode = 0;

    /**
     * Specify from where on screen the debug mode should start.
     * The value goes from -1 (full screen) to 1 (not visible)
     * It helps with side by side comparison against the final render
     * This defaults to 0
     */
    @editableInPropertyPage("Split position", PropertyTypeForEdition.Float, "DEBUG", { min: -1, max: 1, notifiers: { update: true } })
    public debugLimit = 0;

    /**
     * As the default viewing range might not be enough (if the ambient is really small for instance)
     * You can use the factor to better multiply the final value.
     */
    @editableInPropertyPage("Output factor", PropertyTypeForEdition.Float, "DEBUG", { min: 0, max: 5, notifiers: { update: true } })
    public debugFactor = 1;

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public override initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("vLightingIntensity");

        state._excludeVariableName("geometricNormalW");
        state._excludeVariableName("normalW");
        state._excludeVariableName("faceNormal");

        state._excludeVariableName("albedoOpacityOut");
        state._excludeVariableName("surfaceAlbedo");
        state._excludeVariableName("alpha");

        state._excludeVariableName("aoOut");

        state._excludeVariableName("baseColor");
        state._excludeVariableName("reflectivityOut");
        state._excludeVariableName("microSurface");
        state._excludeVariableName("roughness");
        state._excludeVariableName("vReflectivityColor");

        state._excludeVariableName("NdotVUnclamped");
        state._excludeVariableName("NdotV");
        state._excludeVariableName("alphaG");
        state._excludeVariableName("AARoughnessFactors");
        state._excludeVariableName("environmentBrdf");
        state._excludeVariableName("ambientMonochrome");
        state._excludeVariableName("seo");
        state._excludeVariableName("eho");

        state._excludeVariableName("environmentRadiance");
        state._excludeVariableName("irradianceVector");
        state._excludeVariableName("environmentIrradiance");

        state._excludeVariableName("diffuseBase");
        state._excludeVariableName("specularBase");
        state._excludeVariableName("preInfo");
        state._excludeVariableName("info");
        state._excludeVariableName("shadow");

        state._excludeVariableName("finalDiffuse");
        state._excludeVariableName("finalAmbient");
        state._excludeVariableName("ambientOcclusionForDirectDiffuse");

        state._excludeVariableName("finalColor");

        state._excludeVariableName("vClipSpacePosition");
        state._excludeVariableName("vDebugMode");
        state._excludeVariableName("vViewDepth");

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._initShaderSourceAsync(state.shaderLanguage);
    }

    private async _initShaderSourceAsync(shaderLanguage: ShaderLanguage) {
        this._codeIsReady = false;
        if (shaderLanguage === ShaderLanguage.WGSL) {
            await Promise.all([import("../../../../ShadersWGSL/pbr.vertex"), import("../../../../ShadersWGSL/pbr.fragment")]);
        } else {
            await Promise.all([import("../../../../Shaders/pbr.vertex"), import("../../../../Shaders/pbr.fragment")]);
        }

        this._codeIsReady = true;
        this.onCodeIsReadyObservable.notifyObservers(this);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "PBRMetallicRoughnessBlock";
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
     * Gets the view matrix parameter
     */
    public get view(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the camera position input component
     */
    public get cameraPosition(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the perturbed normal input component
     */
    public get perturbedNormal(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the base color input component
     */
    public get baseColor(): NodeMaterialConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the metallic input component
     */
    public get metallic(): NodeMaterialConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the roughness input component
     */
    public get roughness(): NodeMaterialConnectionPoint {
        return this._inputs[7];
    }

    /**
     * Gets the ambient occlusion input component
     */
    public get ambientOcc(): NodeMaterialConnectionPoint {
        return this._inputs[8];
    }

    /**
     * Gets the opacity input component
     */
    public get opacity(): NodeMaterialConnectionPoint {
        return this._inputs[9];
    }

    /**
     * Gets the index of refraction input component
     */
    public get indexOfRefraction(): NodeMaterialConnectionPoint {
        return this._inputs[10];
    }

    /**
     * Gets the ambient color input component
     */
    public get ambientColor(): NodeMaterialConnectionPoint {
        return this._inputs[11];
    }

    /**
     * Gets the reflection object parameters
     */
    public get reflection(): NodeMaterialConnectionPoint {
        return this._inputs[12];
    }

    /**
     * Gets the clear coat object parameters
     */
    public get clearcoat(): NodeMaterialConnectionPoint {
        return this._inputs[13];
    }

    /**
     * Gets the sheen object parameters
     */
    public get sheen(): NodeMaterialConnectionPoint {
        return this._inputs[14];
    }

    /**
     * Gets the sub surface object parameters
     */
    public get subsurface(): NodeMaterialConnectionPoint {
        return this._inputs[15];
    }

    /**
     * Gets the anisotropy object parameters
     */
    public get anisotropy(): NodeMaterialConnectionPoint {
        return this._inputs[16];
    }

    /**
     * Gets the iridescence object parameters
     */
    public get iridescence(): NodeMaterialConnectionPoint {
        return this._inputs[17];
    }

    /**
     * Gets the ambient output component
     */
    public get ambientClr(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the diffuse output component
     */
    public get diffuseDir(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the specular output component
     */
    public get specularDir(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the clear coat output component
     */
    public get clearcoatDir(): NodeMaterialConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the sheen output component
     */
    public get sheenDir(): NodeMaterialConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the indirect diffuse output component
     */
    public get diffuseInd(): NodeMaterialConnectionPoint {
        return this._outputs[5];
    }

    /**
     * Gets the indirect specular output component
     */
    public get specularInd(): NodeMaterialConnectionPoint {
        return this._outputs[6];
    }

    /**
     * Gets the indirect clear coat output component
     */
    public get clearcoatInd(): NodeMaterialConnectionPoint {
        return this._outputs[7];
    }

    /**
     * Gets the indirect sheen output component
     */
    public get sheenInd(): NodeMaterialConnectionPoint {
        return this._outputs[8];
    }

    /**
     * Gets the refraction output component
     */
    public get refraction(): NodeMaterialConnectionPoint {
        return this._outputs[9];
    }

    /**
     * Gets the global lighting output component
     */
    public get lighting(): NodeMaterialConnectionPoint {
        return this._outputs[10];
    }

    /**
     * Gets the shadow output component
     */
    public get shadow(): NodeMaterialConnectionPoint {
        return this._outputs[11];
    }

    /**
     * Gets the alpha output component
     */
    public get alpha(): NodeMaterialConnectionPoint {
        return this._outputs[12];
    }

    public override autoConfigure(material: NodeMaterial, additionalFilteringInfo: (node: NodeMaterialBlock) => boolean = () => true) {
        if (!this.cameraPosition.isConnected) {
            let cameraPositionInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.CameraPosition && additionalFilteringInfo(b));

            if (!cameraPositionInput) {
                cameraPositionInput = new InputBlock("cameraPosition");
                cameraPositionInput.setAsSystemValue(NodeMaterialSystemValues.CameraPosition);
            }
            cameraPositionInput.output.connectTo(this.cameraPosition);
        }

        if (!this.view.isConnected) {
            let viewInput = material.getInputBlockByPredicate((b) => b.systemValue === NodeMaterialSystemValues.View && additionalFilteringInfo(b));

            if (!viewInput) {
                viewInput = new InputBlock("view");
                viewInput.setAsSystemValue(NodeMaterialSystemValues.View);
            }
            viewInput.output.connectTo(this.view);
        }
    }

    public override prepareDefines(defines: NodeMaterialDefines, nodeMaterial: NodeMaterial, mesh?: AbstractMesh) {
        if (!mesh) {
            return;
        }

        // General
        defines.setValue("PBR", true);
        defines.setValue("METALLICWORKFLOW", true);
        defines.setValue("DEBUGMODE", this.debugMode, true);
        defines.setValue("DEBUGMODE_FORCERETURN", true);
        defines.setValue("NORMALXYSCALE", true);
        defines.setValue("BUMP", this.perturbedNormal.isConnected, true);
        defines.setValue("LODBASEDMICROSFURACE", this._scene.getEngine().getCaps().textureLOD);

        // Albedo & Opacity
        defines.setValue("ALBEDO", false, true);
        defines.setValue("OPACITY", this.opacity.isConnected, true);

        // Ambient occlusion
        defines.setValue("AMBIENT", true, true);
        defines.setValue("AMBIENTINGRAYSCALE", false, true);

        // Reflectivity
        defines.setValue("REFLECTIVITY", false, true);
        defines.setValue("AOSTOREINMETALMAPRED", false, true);
        defines.setValue("METALLNESSSTOREINMETALMAPBLUE", false, true);
        defines.setValue("ROUGHNESSSTOREINMETALMAPALPHA", false, true);
        defines.setValue("ROUGHNESSSTOREINMETALMAPGREEN", false, true);

        // Lighting & colors
        if (this.lightFalloff === PBRBaseMaterial.LIGHTFALLOFF_STANDARD) {
            defines.setValue("USEPHYSICALLIGHTFALLOFF", false);
            defines.setValue("USEGLTFLIGHTFALLOFF", false);
        } else if (this.lightFalloff === PBRBaseMaterial.LIGHTFALLOFF_GLTF) {
            defines.setValue("USEPHYSICALLIGHTFALLOFF", false);
            defines.setValue("USEGLTFLIGHTFALLOFF", true);
        } else {
            defines.setValue("USEPHYSICALLIGHTFALLOFF", true);
            defines.setValue("USEGLTFLIGHTFALLOFF", false);
        }

        // Transparency
        const alphaTestCutOffString = this.alphaTestCutoff.toString();

        defines.setValue("ALPHABLEND", this.useAlphaBlending, true);
        defines.setValue("ALPHAFROMALBEDO", false, true);
        defines.setValue("ALPHATEST", this.useAlphaTest, true);
        defines.setValue("ALPHATESTVALUE", alphaTestCutOffString.indexOf(".") < 0 ? alphaTestCutOffString + "." : alphaTestCutOffString, true);
        defines.setValue("OPACITYRGB", false, true);

        // Rendering
        defines.setValue("RADIANCEOVERALPHA", this.useRadianceOverAlpha, true);
        defines.setValue("SPECULAROVERALPHA", this.useSpecularOverAlpha, true);
        defines.setValue("SPECULARAA", this._scene.getEngine().getCaps().standardDerivatives && this.enableSpecularAntiAliasing, true);
        defines.setValue("REALTIME_FILTERING", this.realTimeFiltering, true);

        const scene = mesh.getScene();
        const engine = scene.getEngine();

        if (engine._features.needTypeSuffixInShaderConstants) {
            defines.setValue("NUM_SAMPLES", this.realTimeFilteringQuality + "u", true);
        } else {
            defines.setValue("NUM_SAMPLES", "" + this.realTimeFilteringQuality, true);
        }

        defines.setValue("BASE_DIFFUSE_MODEL", this.baseDiffuseModel, true);

        // Advanced
        defines.setValue("BRDF_V_HEIGHT_CORRELATED", true);
        defines.setValue("LEGACY_SPECULAR_ENERGY_CONSERVATION", true);
        defines.setValue("MS_BRDF_ENERGY_CONSERVATION", this.useEnergyConservation, true);
        defines.setValue("RADIANCEOCCLUSION", this.useRadianceOcclusion, true);
        defines.setValue("HORIZONOCCLUSION", this.useHorizonOcclusion, true);
        defines.setValue("UNLIT", this.unlit, true);
        defines.setValue("FORCENORMALFORWARD", this.forceNormalForward, true);

        if (this._environmentBRDFTexture && MaterialFlags.ReflectionTextureEnabled) {
            defines.setValue("ENVIRONMENTBRDF", true);
            defines.setValue("ENVIRONMENTBRDF_RGBD", this._environmentBRDFTexture.isRGBD, true);
        } else {
            defines.setValue("ENVIRONMENTBRDF", false);
            defines.setValue("ENVIRONMENTBRDF_RGBD", false);
        }

        if (defines._areImageProcessingDirty && nodeMaterial.imageProcessingConfiguration) {
            nodeMaterial.imageProcessingConfiguration.prepareDefines(defines);
        }

        if (!defines._areLightsDirty) {
            return;
        }

        if (!this.light) {
            // Lights
            PrepareDefinesForLights(scene, mesh, defines, true, nodeMaterial.maxSimultaneousLights);
            defines._needNormals = true;

            // Multiview
            PrepareDefinesForMultiview(scene, defines);
        } else {
            const state = {
                needNormals: false,
                needRebuild: false,
                lightmapMode: false,
                shadowEnabled: false,
                specularEnabled: false,
            };

            PrepareDefinesForLight(scene, mesh, this.light, this._lightId, defines, true, state);

            if (state.needRebuild) {
                defines.rebuild();
            }
        }
    }

    public override updateUniformsAndSamples(state: NodeMaterialBuildState, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines, uniformBuffers: string[]) {
        for (let lightIndex = 0; lightIndex < nodeMaterial.maxSimultaneousLights; lightIndex++) {
            if (!defines["LIGHT" + lightIndex]) {
                break;
            }
            const onlyUpdateBuffersList = state.uniforms.indexOf("vLightData" + lightIndex) >= 0;
            PrepareUniformsAndSamplersForLight(
                lightIndex,
                state.uniforms,
                state.samplers,
                defines["PROJECTEDLIGHTTEXTURE" + lightIndex],
                uniformBuffers,
                onlyUpdateBuffersList,
                defines["IESLIGHTTEXTURE" + lightIndex],
                defines["CLUSTLIGHT" + lightIndex],
                defines["RECTAREALIGHTEMISSIONTEXTURE" + lightIndex]
            );
        }
    }

    public override isReady(mesh: AbstractMesh, nodeMaterial: NodeMaterial, defines: NodeMaterialDefines) {
        if (this._environmentBRDFTexture && !this._environmentBRDFTexture.isReady()) {
            return false;
        }

        if (defines._areImageProcessingDirty && nodeMaterial.imageProcessingConfiguration) {
            if (!nodeMaterial.imageProcessingConfiguration.isReady()) {
                return false;
            }
        }

        return true;
    }

    public override bind(effect: Effect, nodeMaterial: NodeMaterial, mesh?: Mesh) {
        if (!mesh) {
            return;
        }

        const scene = mesh.getScene();

        if (!this.light) {
            BindLights(scene, mesh, effect, true, nodeMaterial.maxSimultaneousLights);
        } else {
            BindLight(this.light, this._lightId, scene, effect, true);
        }

        effect.setTexture(this._environmentBrdfSamplerName, this._environmentBRDFTexture);

        effect.setFloat2("vDebugMode", this.debugLimit, this.debugFactor);

        const ambientScene = this._scene.ambientColor;

        if (ambientScene) {
            effect.setColor3("ambientFromScene", ambientScene);
        }

        const invertNormal = scene.useRightHandedSystem === (scene._mirroredCameraPosition != null);

        effect.setFloat(this._invertNormalName, invertNormal ? -1 : 1);

        effect.setFloat4("vLightingIntensity", this.directIntensity, 1, this.environmentIntensity * this._scene.environmentIntensity, this.specularIntensity);

        // reflectivity bindings
        const metallicF90 = this._metallicF0Factor;

        effect.setColor4(this._vMetallicReflectanceFactorsName, this._metallicReflectanceColor, metallicF90);

        if (nodeMaterial.imageProcessingConfiguration) {
            nodeMaterial.imageProcessingConfiguration.bind(effect);
        }
    }

    private _injectVertexCode(state: NodeMaterialBuildState) {
        const worldPos = this.worldPosition;
        const worldNormal = this.worldNormal;
        const comments = `//${this.name}`;
        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;
        const scene = state.sharedData.nodeMaterial.getScene();

        // Declaration
        if (!this.light) {
            // Emit for all lights
            state._emitFunctionFromInclude(state.supportUniformBuffers ? "lightVxUboDeclaration" : "lightVxFragmentDeclaration", comments, {
                repeatKey: "maxSimultaneousLights",
            });
            this._lightId = 0;

            state.sharedData.dynamicUniformBlocks.push(this);
        } else {
            this._lightId = (state.counters["lightCounter"] !== undefined ? state.counters["lightCounter"] : -1) + 1;
            state.counters["lightCounter"] = this._lightId;

            state._emitFunctionFromInclude(
                state.supportUniformBuffers ? "lightVxUboDeclaration" : "lightVxFragmentDeclaration",
                comments,
                {
                    replaceStrings: [{ search: /{X}/g, replace: this._lightId.toString() }],
                },
                this._lightId.toString()
            );
        }

        // Inject code in vertex
        const worldPosVaryingName = "v_" + worldPos.associatedVariableName;
        if (state._emitVaryingFromString(worldPosVaryingName, NodeMaterialBlockConnectionPointTypes.Vector4)) {
            state.compilationString += (isWebGPU ? "vertexOutputs." : "") + `${worldPosVaryingName} = ${worldPos.associatedVariableName};\n`;
        }

        const worldNormalVaryingName = "v_" + worldNormal.associatedVariableName;
        if (state._emitVaryingFromString(worldNormalVaryingName, NodeMaterialBlockConnectionPointTypes.Vector4)) {
            state.compilationString += (isWebGPU ? "vertexOutputs." : "") + `${worldNormalVaryingName} = ${worldNormal.associatedVariableName};\n`;
        }

        const reflectionBlock = this.reflection.isConnected ? (this.reflection.connectedPoint?.ownerBlock as ReflectionBlock) : null;

        if (reflectionBlock) {
            reflectionBlock.viewConnectionPoint = this.view;
        }

        state.compilationString += reflectionBlock?.handleVertexSide(state) ?? "";

        if (state._emitVaryingFromString("vClipSpacePosition", NodeMaterialBlockConnectionPointTypes.Vector4, "defined(IGNORE) || DEBUGMODE > 0")) {
            state._injectAtEnd += `#if DEBUGMODE > 0\n`;
            state._injectAtEnd += (isWebGPU ? "vertexOutputs." : "") + `vClipSpacePosition = ${isWebGPU ? "vertexOutputs.position" : "gl_Position"};\n`;
            state._injectAtEnd += `#endif\n`;
        }

        if (this.light) {
            state.compilationString += state._emitCodeFromInclude("shadowsVertex", comments, {
                replaceStrings: [
                    { search: /{X}/g, replace: this._lightId.toString() },
                    { search: /worldPos/g, replace: worldPos.associatedVariableName },
                ],
            });
        } else {
            state.compilationString += `${state._declareLocalVar("worldPos", NodeMaterialBlockConnectionPointTypes.Vector4)} = ${worldPos.associatedVariableName};\n`;
            if (this.view.isConnected) {
                state.compilationString += `${state._declareLocalVar("view", NodeMaterialBlockConnectionPointTypes.Matrix)} = ${this.view.associatedVariableName};\n`;
                state._emitVaryingFromString("vViewDepth", NodeMaterialBlockConnectionPointTypes.Float);
                state.compilationString +=
                    (state.shaderLanguage === ShaderLanguage.WGSL ? "vertexOutputs." : "") +
                    `vViewDepth = ${scene.useRightHandedSystem ? "-" : ""}(${this.view.associatedVariableName} * ${worldPos.associatedVariableName}).z;\n`;
            }
            state.compilationString += state._emitCodeFromInclude("shadowsVertex", comments, {
                repeatKey: "maxSimultaneousLights",
            });
        }
    }

    private _getAlbedoOpacityCode(state: NodeMaterialBuildState): string {
        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;

        let code = isWebGPU ? "var albedoOpacityOut: albedoOpacityOutParams;\n" : `albedoOpacityOutParams albedoOpacityOut;\n`;

        const albedoColor = this.baseColor.isConnected ? this.baseColor.associatedVariableName : "vec3(1.)";
        const opacity = this.opacity.isConnected ? this.opacity.associatedVariableName : "1.";

        code += `albedoOpacityOut = albedoOpacityBlock(
                vec4${state.fSuffix}(${albedoColor}, 1.)
            #ifdef ALBEDO
                ,vec4${state.fSuffix}(1.)
                ,vec2${state.fSuffix}(1., 1.)
            #endif
                ,1. /* Base Weight */
            #ifdef OPACITY
                ,vec4${state.fSuffix}(${opacity})
                ,vec2${state.fSuffix}(1., 1.)
            #endif
            );

            ${state._declareLocalVar("surfaceAlbedo", NodeMaterialBlockConnectionPointTypes.Vector3)} = albedoOpacityOut.surfaceAlbedo;
            ${state._declareLocalVar("alpha", NodeMaterialBlockConnectionPointTypes.Float)} = albedoOpacityOut.alpha;\n`;

        return code;
    }

    private _getAmbientOcclusionCode(state: NodeMaterialBuildState): string {
        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;
        let code = isWebGPU ? "var aoOut: ambientOcclusionOutParams;\n" : `ambientOcclusionOutParams aoOut;\n`;

        const ao = this.ambientOcc.isConnected ? this.ambientOcc.associatedVariableName : "1.";

        code += `aoOut = ambientOcclusionBlock(
            #ifdef AMBIENT
                vec3${state.fSuffix}(${ao}),
                vec4${state.fSuffix}(0., 1.0, 1.0, 0.)
            #endif
            );\n`;

        return code;
    }

    private _getReflectivityCode(state: NodeMaterialBuildState): string {
        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;
        let code = isWebGPU ? "var reflectivityOut: reflectivityOutParams;\n" : `reflectivityOutParams reflectivityOut;\n`;
        const aoIntensity = "1.";

        this._vMetallicReflectanceFactorsName = state._getFreeVariableName("vMetallicReflectanceFactors");
        state._emitUniformFromString(this._vMetallicReflectanceFactorsName, NodeMaterialBlockConnectionPointTypes.Vector4);

        this._baseDiffuseRoughnessName = state._getFreeVariableName("baseDiffuseRoughness");
        state._emitUniformFromString(this._baseDiffuseRoughnessName, NodeMaterialBlockConnectionPointTypes.Float);

        const outsideIOR = 1; // consider air as clear coat and other layers would remap in the shader.
        const ior = this.indexOfRefraction.connectInputBlock?.value ?? 1.5;
        // Based of the schlick fresnel approximation model
        // for dielectrics.
        const f0 = Math.pow((ior - outsideIOR) / (ior + outsideIOR), 2);

        code += `${state._declareLocalVar("baseColor", NodeMaterialBlockConnectionPointTypes.Vector3)} = surfaceAlbedo;
            ${isWebGPU ? "let" : `vec4${state.fSuffix}`} vReflectivityColor = vec4${state.fSuffix}(${this.metallic.associatedVariableName}, ${this.roughness.associatedVariableName}, ${this.indexOfRefraction.associatedVariableName || "1.5"}, ${f0});
            reflectivityOut = reflectivityBlock(
                vReflectivityColor
            #ifdef METALLICWORKFLOW
                , surfaceAlbedo
                , ${(isWebGPU ? "uniforms." : "") + this._vMetallicReflectanceFactorsName}
            #endif
                , ${(isWebGPU ? "uniforms." : "") + this._baseDiffuseRoughnessName}
            #ifdef BASE_DIFFUSE_ROUGHNESS
                , 0.
                , vec2${state.fSuffix}(0., 0.)
            #endif
            #ifdef REFLECTIVITY
                , vec3${state.fSuffix}(0., 0., ${aoIntensity})
                , vec4${state.fSuffix}(1.)
            #endif
            #if defined(METALLICWORKFLOW) && defined(REFLECTIVITY)  && defined(AOSTOREINMETALMAPRED)
                , aoOut.ambientOcclusionColor
            #endif
            #ifdef MICROSURFACEMAP
                , microSurfaceTexel <== not handled!
            #endif
            );

            ${state._declareLocalVar("microSurface", NodeMaterialBlockConnectionPointTypes.Float)} = reflectivityOut.microSurface;
            ${state._declareLocalVar("roughness", NodeMaterialBlockConnectionPointTypes.Float)} = reflectivityOut.roughness;
            ${state._declareLocalVar("diffuseRoughness", NodeMaterialBlockConnectionPointTypes.Float)} = reflectivityOut.diffuseRoughness;

            #ifdef METALLICWORKFLOW
                surfaceAlbedo = reflectivityOut.surfaceAlbedo;
            #endif
            #if defined(METALLICWORKFLOW) && defined(REFLECTIVITY) && defined(AOSTOREINMETALMAPRED)
                aoOut.ambientOcclusionColor = reflectivityOut.ambientOcclusionColor;
            #endif\n`;

        return code;
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        this._scene = state.sharedData.scene;
        const isWebGPU = state.shaderLanguage === ShaderLanguage.WGSL;

        if (!this._environmentBRDFTexture) {
            this._environmentBRDFTexture = GetEnvironmentBRDFTexture(this._scene);
        }

        const reflectionBlock = this.reflection.isConnected ? (this.reflection.connectedPoint?.ownerBlock as ReflectionBlock) : null;

        if (reflectionBlock) {
            // Need those variables to be setup when calling _injectVertexCode
            reflectionBlock.worldPositionConnectionPoint = this.worldPosition;
            reflectionBlock.cameraPositionConnectionPoint = this.cameraPosition;
            reflectionBlock.worldNormalConnectionPoint = this.worldNormal;
            reflectionBlock.viewConnectionPoint = this.view;
        }

        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            // Vertex
            this._injectVertexCode(state);

            return this;
        }

        // Fragment
        state.sharedData.forcedBindableBlocks.push(this);
        state.sharedData.blocksWithDefines.push(this);
        state.sharedData.blockingBlocks.push(this);
        if (this.generateOnlyFragmentCode) {
            state.sharedData.dynamicUniformBlocks.push(this);
        }

        const comments = `//${this.name}`;
        const normalShading = this.perturbedNormal;

        let worldPosVarName = this.worldPosition.associatedVariableName;
        let worldPosVarName4 = this.worldPosition.associatedVariableName;
        let worldNormalVarName = this.worldNormal.associatedVariableName;
        if (this.generateOnlyFragmentCode) {
            worldPosVarName = state._getFreeVariableName("globalWorldPos");
            state._emitFunction("pbr_globalworldpos", `${state._declareLocalVar(worldPosVarName, NodeMaterialBlockConnectionPointTypes.Vector3, false, true)};\n`, comments);
            state.compilationString += `${worldPosVarName} = ${this.worldPosition.associatedVariableName}.xyz;\n`;

            worldPosVarName4 = state._getFreeVariableName("globalWorldPos4");
            state._emitFunction("pbr_globalworldpos4", `${state._declareLocalVar(worldPosVarName4, NodeMaterialBlockConnectionPointTypes.Vector4, false, true)};\n`, comments);
            state.compilationString += `${worldPosVarName4} = ${this.worldPosition.associatedVariableName};\n`;

            worldNormalVarName = state._getFreeVariableName("globalWorldNormal");
            state._emitFunction("pbr_globalworldnorm", `${state._declareLocalVar(worldNormalVarName, NodeMaterialBlockConnectionPointTypes.Vector4, false, true)};\n`, comments);
            state.compilationString += `${worldNormalVarName} = ${this.worldNormal.associatedVariableName};\n`;

            state.compilationString += state._emitCodeFromInclude("shadowsVertex", comments, {
                repeatKey: "maxSimultaneousLights",
                substitutionVars: `worldPos,${this.worldPosition.associatedVariableName}`,
            });

            state.compilationString += `#if DEBUGMODE > 0\n`;
            state.compilationString += `${state._declareLocalVar("vClipSpacePosition", NodeMaterialBlockConnectionPointTypes.Vector4)} = vec4${state.fSuffix}((vec2${state.fSuffix}(${isWebGPU ? "fragmentInputs.position" : "gl_FragCoord.xy"}) / vec2${state.fSuffix}(1.0)) * 2.0 - 1.0, 0.0, 1.0);\n`;
            state.compilationString += `#endif\n`;
        } else {
            worldPosVarName = (isWebGPU ? "input." : "") + "v_" + worldPosVarName;
            worldNormalVarName = (isWebGPU ? "input." : "") + "v_" + worldNormalVarName;
        }

        this._environmentBrdfSamplerName = state._getFreeVariableName("environmentBrdfSampler");

        state._emit2DSampler(this._environmentBrdfSamplerName);

        state.sharedData.hints.needAlphaBlending = state.sharedData.hints.needAlphaBlending || this.useAlphaBlending;
        state.sharedData.hints.needAlphaTesting = state.sharedData.hints.needAlphaTesting || this.useAlphaTest;

        state._emitExtension("lod", "#extension GL_EXT_shader_texture_lod : enable", "defined(LODBASEDMICROSFURACE)");
        state._emitExtension("derivatives", "#extension GL_OES_standard_derivatives : enable");

        state._emitUniformFromString("vDebugMode", NodeMaterialBlockConnectionPointTypes.Vector2, "defined(IGNORE) || DEBUGMODE > 0");
        state._emitUniformFromString("ambientFromScene", NodeMaterialBlockConnectionPointTypes.Vector3);

        // Image processing uniforms
        state.uniforms.push("exposureLinear");
        state.uniforms.push("contrast");
        state.uniforms.push("vInverseScreenSize");
        state.uniforms.push("vignetteSettings1");
        state.uniforms.push("vignetteSettings2");
        state.uniforms.push("vCameraColorCurveNegative");
        state.uniforms.push("vCameraColorCurveNeutral");
        state.uniforms.push("vCameraColorCurvePositive");
        state.uniforms.push("txColorTransform");
        state.uniforms.push("colorTransformSettings");
        state.uniforms.push("ditherIntensity");

        //
        // Includes
        //
        if (!this.light) {
            if (this.generateOnlyFragmentCode && this.view.isConnected) {
                state.compilationString += `${state._declareLocalVar("vViewDepth", NodeMaterialBlockConnectionPointTypes.Float)} = (${this.view.associatedVariableName} * ${worldPosVarName4}).z;\n`;
            }

            // Emit for all lights
            state._emitFunctionFromInclude(state.supportUniformBuffers ? "lightUboDeclaration" : "lightFragmentDeclaration", comments, {
                repeatKey: "maxSimultaneousLights",
                substitutionVars: this.generateOnlyFragmentCode ? "varying," : undefined,
            });
        } else {
            state._emitFunctionFromInclude(
                state.supportUniformBuffers ? "lightUboDeclaration" : "lightFragmentDeclaration",
                comments,
                {
                    replaceStrings: [{ search: /{X}/g, replace: this._lightId.toString() }],
                },
                this._lightId.toString()
            );
        }

        state._emitFunctionFromInclude("helperFunctions", comments);
        state._emitFunctionFromInclude("importanceSampling", comments);
        state._emitFunctionFromInclude("pbrHelperFunctions", comments);
        state._emitFunctionFromInclude("imageProcessingDeclaration", comments);
        state._emitFunctionFromInclude("imageProcessingFunctions", comments);

        state._emitFunctionFromInclude("shadowsFragmentFunctions", comments);

        state._emitFunctionFromInclude("pbrDirectLightingSetupFunctions", comments);

        state._emitFunctionFromInclude("pbrDirectLightingFalloffFunctions", comments);
        state._emitFunctionFromInclude("pbrBRDFFunctions", comments, {
            replaceStrings: [{ search: /REFLECTIONMAP_SKYBOX/g, replace: reflectionBlock?._defineSkyboxName ?? "REFLECTIONMAP_SKYBOX" }],
        });
        state._emitFunctionFromInclude("hdrFilteringFunctions", comments);

        state._emitFunctionFromInclude("pbrDirectLightingFunctions", comments);

        state._emitFunctionFromInclude("pbrIBLFunctions", comments);

        state._emitFunctionFromInclude("pbrBlockAlbedoOpacity", comments);
        state._emitFunctionFromInclude("pbrBlockReflectivity", comments);
        state._emitFunctionFromInclude("pbrBlockAmbientOcclusion", comments);
        state._emitFunctionFromInclude("pbrBlockAlphaFresnel", comments);
        state._emitFunctionFromInclude("pbrBlockAnisotropic", comments);

        if (!isWebGPU) {
            // In WebGPU, those functions are part of pbrDirectLightingFunctions
            state._emitFunctionFromInclude("pbrClusteredLightingFunctions", comments);
        }

        //
        // code
        //

        state._emitUniformFromString("vLightingIntensity", NodeMaterialBlockConnectionPointTypes.Vector4);

        if (reflectionBlock?.generateOnlyFragmentCode) {
            state.compilationString += reflectionBlock.handleVertexSide(state);
        }

        // _____________________________ Geometry Information ____________________________
        this._vNormalWName = state._getFreeVariableName("vNormalW");

        state.compilationString += `${state._declareLocalVar(this._vNormalWName, NodeMaterialBlockConnectionPointTypes.Vector4)} = normalize(${worldNormalVarName});\n`;

        if (state._registerTempVariable("viewDirectionW")) {
            state.compilationString += `${state._declareLocalVar("viewDirectionW", NodeMaterialBlockConnectionPointTypes.Vector3)} = normalize(${this.cameraPosition.associatedVariableName} - ${worldPosVarName}.xyz);\n`;
        }

        state.compilationString += `${state._declareLocalVar("geometricNormalW", NodeMaterialBlockConnectionPointTypes.Vector3)} = ${this._vNormalWName}.xyz;\n`;

        state.compilationString += `${state._declareLocalVar("normalW", NodeMaterialBlockConnectionPointTypes.Vector3)} = ${normalShading.isConnected ? "normalize(" + normalShading.associatedVariableName + ".xyz)" : "geometricNormalW"};\n`;

        this._invertNormalName = state._getFreeVariableName("invertNormal");

        state._emitUniformFromString(this._invertNormalName, NodeMaterialBlockConnectionPointTypes.Float);

        state.compilationString += state._emitCodeFromInclude("pbrBlockNormalFinal", comments, {
            replaceStrings: [
                { search: /vPositionW/g, replace: worldPosVarName + ".xyz" },
                { search: /vEyePosition.w/g, replace: this._invertNormalName },
            ],
        });

        // _____________________________ Albedo & Opacity ______________________________
        state.compilationString += this._getAlbedoOpacityCode(state);

        state.compilationString += state._emitCodeFromInclude("depthPrePass", comments);

        // _____________________________ AO  _______________________________
        state.compilationString += this._getAmbientOcclusionCode(state);

        state.compilationString += state._emitCodeFromInclude("pbrBlockLightmapInit", comments);

        // _____________________________ UNLIT  _______________________________
        state.compilationString += `#ifdef UNLIT
                ${state._declareLocalVar("diffuseBase", NodeMaterialBlockConnectionPointTypes.Vector3)} = vec3${state.fSuffix}(1., 1., 1.);
            #else\n`;

        // _____________________________ Reflectivity _______________________________
        state.compilationString += this._getReflectivityCode(state);

        // _____________________________ Geometry info _________________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockGeometryInfo", comments, {
            replaceStrings: [
                { search: /REFLECTIONMAP_SKYBOX/g, replace: reflectionBlock?._defineSkyboxName ?? "REFLECTIONMAP_SKYBOX" },
                { search: /REFLECTIONMAP_3D/g, replace: reflectionBlock?._define3DName ?? "REFLECTIONMAP_3D" },
            ],
        });

        // _____________________________ Anisotropy _______________________________________
        const anisotropyBlock = this.anisotropy.isConnected ? (this.anisotropy.connectedPoint?.ownerBlock as AnisotropyBlock) : null;

        if (anisotropyBlock) {
            anisotropyBlock.worldPositionConnectionPoint = this.worldPosition;
            anisotropyBlock.worldNormalConnectionPoint = this.worldNormal;

            state.compilationString += anisotropyBlock.getCode(state, !this.perturbedNormal.isConnected);
        }

        // _____________________________ Reflection _______________________________________
        if (reflectionBlock && reflectionBlock.hasTexture) {
            state.compilationString += reflectionBlock.getCode(state, anisotropyBlock ? "anisotropicOut.anisotropicNormal" : "normalW");
        }

        state._emitFunctionFromInclude("pbrBlockReflection", comments, {
            replaceStrings: [
                { search: /computeReflectionCoords/g, replace: "computeReflectionCoordsPBR" },
                { search: /REFLECTIONMAP_3D/g, replace: reflectionBlock?._define3DName ?? "REFLECTIONMAP_3D" },
                { search: /REFLECTIONMAP_OPPOSITEZ/g, replace: reflectionBlock?._defineOppositeZ ?? "REFLECTIONMAP_OPPOSITEZ" },
                { search: /REFLECTIONMAP_PROJECTION/g, replace: reflectionBlock?._defineProjectionName ?? "REFLECTIONMAP_PROJECTION" },
                { search: /REFLECTIONMAP_SKYBOX/g, replace: reflectionBlock?._defineSkyboxName ?? "REFLECTIONMAP_SKYBOX" },
                { search: /LODINREFLECTIONALPHA/g, replace: reflectionBlock?._defineLODReflectionAlpha ?? "LODINREFLECTIONALPHA" },
                { search: /LINEARSPECULARREFLECTION/g, replace: reflectionBlock?._defineLinearSpecularReflection ?? "LINEARSPECULARREFLECTION" },
                { search: /vReflectionFilteringInfo/g, replace: reflectionBlock?._vReflectionFilteringInfoName ?? "vReflectionFilteringInfo" },
            ],
        });

        // ___________________ Compute Reflectance aka R0 F0 info _________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockReflectance0", comments, {
            replaceStrings: [{ search: /metallicReflectanceFactors/g, replace: (isWebGPU ? "uniforms." : "") + this._vMetallicReflectanceFactorsName }],
        });
        // ________________________________ Sheen ______________________________
        const sheenBlock = this.sheen.isConnected ? (this.sheen.connectedPoint?.ownerBlock as SheenBlock) : null;

        if (sheenBlock) {
            state.compilationString += sheenBlock.getCode(reflectionBlock, state);
        }

        state._emitFunctionFromInclude("pbrBlockSheen", comments, {
            replaceStrings: [
                { search: /REFLECTIONMAP_3D/g, replace: reflectionBlock?._define3DName ?? "REFLECTIONMAP_3D" },
                { search: /REFLECTIONMAP_SKYBOX/g, replace: reflectionBlock?._defineSkyboxName ?? "REFLECTIONMAP_SKYBOX" },
                { search: /LODINREFLECTIONALPHA/g, replace: reflectionBlock?._defineLODReflectionAlpha ?? "LODINREFLECTIONALPHA" },
                { search: /LINEARSPECULARREFLECTION/g, replace: reflectionBlock?._defineLinearSpecularReflection ?? "LINEARSPECULARREFLECTION" },
            ],
        });

        // ____________________ Clear Coat Initialization Code _____________________
        const clearcoatBlock = this.clearcoat.isConnected ? (this.clearcoat.connectedPoint?.ownerBlock as ClearCoatBlock) : null;

        state.compilationString += ClearCoatBlock._GetInitializationCode(state, clearcoatBlock);

        // _____________________________ Iridescence _______________________________
        const iridescenceBlock = this.iridescence.isConnected ? (this.iridescence.connectedPoint?.ownerBlock as IridescenceBlock) : null;
        state.compilationString += IridescenceBlock.GetCode(iridescenceBlock, state);

        state._emitFunctionFromInclude("pbrBlockIridescence", comments, {
            replaceStrings: [],
        });

        // _____________________________ Clear Coat ____________________________
        const generateTBNSpace = !this.perturbedNormal.isConnected && !this.anisotropy.isConnected;
        const isTangentConnectedToPerturbNormal =
            this.perturbedNormal.isConnected && (this.perturbedNormal.connectedPoint?.ownerBlock as PerturbNormalBlock).worldTangent?.isConnected;
        const isTangentConnectedToAnisotropy = this.anisotropy.isConnected && (this.anisotropy.connectedPoint?.ownerBlock as AnisotropyBlock).worldTangent.isConnected;
        let vTBNAvailable = isTangentConnectedToPerturbNormal || (!this.perturbedNormal.isConnected && isTangentConnectedToAnisotropy);

        state.compilationString += ClearCoatBlock.GetCode(state, clearcoatBlock, reflectionBlock, worldPosVarName, generateTBNSpace, vTBNAvailable, worldNormalVarName);

        if (generateTBNSpace) {
            vTBNAvailable = clearcoatBlock?.worldTangent.isConnected ?? false;
        }

        state._emitFunctionFromInclude("pbrBlockClearcoat", comments, {
            replaceStrings: [
                { search: /computeReflectionCoords/g, replace: "computeReflectionCoordsPBR" },
                { search: /REFLECTIONMAP_3D/g, replace: reflectionBlock?._define3DName ?? "REFLECTIONMAP_3D" },
                { search: /REFLECTIONMAP_OPPOSITEZ/g, replace: reflectionBlock?._defineOppositeZ ?? "REFLECTIONMAP_OPPOSITEZ" },
                { search: /REFLECTIONMAP_PROJECTION/g, replace: reflectionBlock?._defineProjectionName ?? "REFLECTIONMAP_PROJECTION" },
                { search: /REFLECTIONMAP_SKYBOX/g, replace: reflectionBlock?._defineSkyboxName ?? "REFLECTIONMAP_SKYBOX" },
                { search: /LODINREFLECTIONALPHA/g, replace: reflectionBlock?._defineLODReflectionAlpha ?? "LODINREFLECTIONALPHA" },
                { search: /LINEARSPECULARREFLECTION/g, replace: reflectionBlock?._defineLinearSpecularReflection ?? "LINEARSPECULARREFLECTION" },
                { search: /defined\(TANGENT\)/g, replace: vTBNAvailable ? "defined(TANGENT)" : "defined(IGNORE)" },
            ],
        });

        // _________________________ Specular Environment Reflectance __________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockReflectance", comments, {
            replaceStrings: [
                { search: /REFLECTIONMAP_SKYBOX/g, replace: reflectionBlock?._defineSkyboxName ?? "REFLECTIONMAP_SKYBOX" },
                { search: /REFLECTIONMAP_3D/g, replace: reflectionBlock?._define3DName ?? "REFLECTIONMAP_3D" },
                { search: /uniforms\.vReflectivityColor/g, replace: "vReflectivityColor" },
            ],
        });

        // ___________________________________ SubSurface ______________________________________
        const subsurfaceBlock = this.subsurface.isConnected ? (this.subsurface.connectedPoint?.ownerBlock as SubSurfaceBlock) : null;
        const refractionBlock = this.subsurface.isConnected
            ? ((this.subsurface.connectedPoint?.ownerBlock as SubSurfaceBlock).refraction.connectedPoint?.ownerBlock as RefractionBlock)
            : null;

        if (refractionBlock) {
            refractionBlock.viewConnectionPoint = this.view;
            refractionBlock.indexOfRefractionConnectionPoint = this.indexOfRefraction;
        }

        state.compilationString += SubSurfaceBlock.GetCode(state, subsurfaceBlock, reflectionBlock, worldPosVarName);

        state._emitFunctionFromInclude("pbrBlockSubSurface", comments, {
            replaceStrings: [
                { search: /REFLECTIONMAP_3D/g, replace: reflectionBlock?._define3DName ?? "REFLECTIONMAP_3D" },
                { search: /REFLECTIONMAP_OPPOSITEZ/g, replace: reflectionBlock?._defineOppositeZ ?? "REFLECTIONMAP_OPPOSITEZ" },
                { search: /REFLECTIONMAP_PROJECTION/g, replace: reflectionBlock?._defineProjectionName ?? "REFLECTIONMAP_PROJECTION" },
                { search: /SS_REFRACTIONMAP_3D/g, replace: refractionBlock?._define3DName ?? "SS_REFRACTIONMAP_3D" },
                { search: /SS_LODINREFRACTIONALPHA/g, replace: refractionBlock?._defineLODRefractionAlpha ?? "SS_LODINREFRACTIONALPHA" },
                { search: /SS_LINEARSPECULARREFRACTION/g, replace: refractionBlock?._defineLinearSpecularRefraction ?? "SS_LINEARSPECULARREFRACTION" },
                { search: /SS_REFRACTIONMAP_OPPOSITEZ/g, replace: refractionBlock?._defineOppositeZ ?? "SS_REFRACTIONMAP_OPPOSITEZ" },
            ],
        });

        // _____________________________ Direct Lighting Info __________________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockDirectLighting", comments);

        if (this.light) {
            state.compilationString += state._emitCodeFromInclude("lightFragment", comments, {
                replaceStrings: [
                    { search: /{X}/g, replace: this._lightId.toString() },
                    { search: new RegExp(`${isWebGPU ? "fragmentInputs." : ""}vPositionW`, "g"), replace: worldPosVarName + ".xyz" },
                    { search: /uniforms\.vReflectivityColor/g, replace: "vReflectivityColor" },
                ],
            });
        } else {
            let substitutionVars = `vPositionW,${worldPosVarName}.xyz`;

            if (isWebGPU) {
                substitutionVars = "fragmentInputs." + substitutionVars;
                if (this.generateOnlyFragmentCode) {
                    substitutionVars += `,fragmentInputs.vViewDepth,vViewDepth`;
                }
            }

            state.compilationString += state._emitCodeFromInclude("lightFragment", comments, {
                repeatKey: "maxSimultaneousLights",
                substitutionVars: substitutionVars + ",uniforms.vReflectivityColor,vReflectivityColor",
            });
        }

        // _____________________________ Compute Final Lit Components ________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockFinalLitComponents", comments);

        // _____________________________ UNLIT (2) ________________________
        state.compilationString += `#endif\n`; // UNLIT

        // _____________________________ Compute Final Unlit Components ________________________
        const aoColor = this.ambientColor.isConnected ? this.ambientColor.associatedVariableName : `vec3${state.fSuffix}(0., 0., 0.)`;

        let aoDirectLightIntensity = PBRBaseMaterial.DEFAULT_AO_ON_ANALYTICAL_LIGHTS.toString();

        if (aoDirectLightIntensity.indexOf(".") === -1) {
            aoDirectLightIntensity += ".";
        }

        let replaceStrings = [
            { search: /vec3 finalEmissive[\s\S]*?finalEmissive\*=vLightingIntensity\.y;/g, replace: "" },
            { search: new RegExp(`${isWebGPU ? "uniforms." : ""}vAmbientColor`, "g"), replace: aoColor + ` * ${isWebGPU ? "uniforms." : ""}ambientFromScene` },
            { search: new RegExp(`${isWebGPU ? "uniforms." : ""}vAmbientInfos.w`, "g"), replace: aoDirectLightIntensity },
        ];

        if (isWebGPU) {
            replaceStrings[0] = { search: /var finalEmissive[\s\S]*?finalEmissive\*=uniforms.vLightingIntensity\.y;/g, replace: "" };
        }

        state.compilationString += state._emitCodeFromInclude("pbrBlockFinalUnlitComponents", comments, {
            replaceStrings: replaceStrings,
        });

        // _____________________________ Output Final Color Composition ________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockFinalColorComposition", comments, {
            replaceStrings: [{ search: /finalEmissive/g, replace: `vec3${state.fSuffix}(0.)` }],
        });

        // _____________________________ Apply image processing ________________________
        if (isWebGPU) {
            replaceStrings = [{ search: /mesh.visibility/g, replace: "1." }];
        } else {
            replaceStrings = [{ search: /visibility/g, replace: "1." }];
        }

        state.compilationString += state._emitCodeFromInclude("pbrBlockImageProcessing", comments, {
            replaceStrings: replaceStrings,
        });

        // _____________________________ Generate debug code ________________________

        const colorOutput = isWebGPU ? "fragmentOutputs.color" : "gl_FragColor";
        replaceStrings = [
            { search: new RegExp(`${isWebGPU ? "fragmentInputs." : ""}vNormalW`, "g"), replace: this._vNormalWName },
            { search: new RegExp(`${isWebGPU ? "fragmentInputs." : ""}vPositionW`, "g"), replace: worldPosVarName },
            { search: /uniforms\.vReflectivityColor/g, replace: "vReflectivityColor" },
            {
                search: /albedoTexture\.rgb;/g,
                replace: `vec3${state.fSuffix}(1.);\n${colorOutput}.rgb = toGammaSpace(${colorOutput}.rgb);\n`,
            },
        ];
        state.compilationString += state._emitCodeFromInclude("pbrDebug", comments, {
            replaceStrings: replaceStrings,
        });

        // _____________________________ Generate end points ________________________
        for (const output of this._outputs) {
            if (output.hasEndpoints) {
                const remap = MapOutputToVariable[output.name];
                if (remap) {
                    const [varName, conditions] = remap;
                    if (conditions) {
                        state.compilationString += `#if ${conditions}\n`;
                    }
                    state.compilationString += `${state._declareOutput(output)} = ${varName};\n`;
                    if (conditions) {
                        state.compilationString += `#else\n`;
                        state.compilationString += `${state._declareOutput(output)} = vec3${state.fSuffix}(0.);\n`;
                        state.compilationString += `#endif\n`;
                    }
                } else {
                    state.sharedData.raiseBuildError(`There's no remapping for the ${output.name} end point! No code generated`);
                }
            }
        }

        return this;
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        codeString += `${this._codeVariableName}.lightFalloff = ${this.lightFalloff};\n`;
        codeString += `${this._codeVariableName}.useAlphaTest = ${this.useAlphaTest};\n`;
        codeString += `${this._codeVariableName}.alphaTestCutoff = ${this.alphaTestCutoff};\n`;
        codeString += `${this._codeVariableName}.useAlphaBlending = ${this.useAlphaBlending};\n`;
        codeString += `${this._codeVariableName}.useRadianceOverAlpha = ${this.useRadianceOverAlpha};\n`;
        codeString += `${this._codeVariableName}.useSpecularOverAlpha = ${this.useSpecularOverAlpha};\n`;
        codeString += `${this._codeVariableName}.enableSpecularAntiAliasing = ${this.enableSpecularAntiAliasing};\n`;
        codeString += `${this._codeVariableName}.realTimeFiltering = ${this.realTimeFiltering};\n`;
        codeString += `${this._codeVariableName}.realTimeFilteringQuality = ${this.realTimeFilteringQuality};\n`;
        codeString += `${this._codeVariableName}.useEnergyConservation = ${this.useEnergyConservation};\n`;
        codeString += `${this._codeVariableName}.useRadianceOcclusion = ${this.useRadianceOcclusion};\n`;
        codeString += `${this._codeVariableName}.useHorizonOcclusion = ${this.useHorizonOcclusion};\n`;
        codeString += `${this._codeVariableName}.unlit = ${this.unlit};\n`;
        codeString += `${this._codeVariableName}.forceNormalForward = ${this.forceNormalForward};\n`;
        codeString += `${this._codeVariableName}.debugMode = ${this.debugMode};\n`;
        codeString += `${this._codeVariableName}.debugLimit = ${this.debugLimit};\n`;
        codeString += `${this._codeVariableName}.debugFactor = ${this.debugFactor};\n`;

        return codeString;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        if (this.light) {
            serializationObject.lightId = this.light.id;
        }

        serializationObject.lightFalloff = this.lightFalloff;
        serializationObject.useAlphaTest = this.useAlphaTest;
        serializationObject.alphaTestCutoff = this.alphaTestCutoff;
        serializationObject.useAlphaBlending = this.useAlphaBlending;
        serializationObject.useRadianceOverAlpha = this.useRadianceOverAlpha;
        serializationObject.useSpecularOverAlpha = this.useSpecularOverAlpha;
        serializationObject.enableSpecularAntiAliasing = this.enableSpecularAntiAliasing;
        serializationObject.realTimeFiltering = this.realTimeFiltering;
        serializationObject.realTimeFilteringQuality = this.realTimeFilteringQuality;
        serializationObject.useEnergyConservation = this.useEnergyConservation;
        serializationObject.useRadianceOcclusion = this.useRadianceOcclusion;
        serializationObject.useHorizonOcclusion = this.useHorizonOcclusion;
        serializationObject.unlit = this.unlit;
        serializationObject.forceNormalForward = this.forceNormalForward;
        serializationObject.debugMode = this.debugMode;
        serializationObject.debugLimit = this.debugLimit;
        serializationObject.debugFactor = this.debugFactor;
        serializationObject.generateOnlyFragmentCode = this.generateOnlyFragmentCode;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        if (serializationObject.lightId) {
            this.light = scene.getLightById(serializationObject.lightId);
        }

        this.lightFalloff = serializationObject.lightFalloff ?? 0;
        this.useAlphaTest = serializationObject.useAlphaTest;
        this.alphaTestCutoff = serializationObject.alphaTestCutoff;
        this.useAlphaBlending = serializationObject.useAlphaBlending;
        this.useRadianceOverAlpha = serializationObject.useRadianceOverAlpha;
        this.useSpecularOverAlpha = serializationObject.useSpecularOverAlpha;
        this.enableSpecularAntiAliasing = serializationObject.enableSpecularAntiAliasing;
        this.realTimeFiltering = !!serializationObject.realTimeFiltering;
        this.realTimeFilteringQuality = serializationObject.realTimeFilteringQuality ?? Constants.TEXTURE_FILTERING_QUALITY_LOW;
        this.useEnergyConservation = serializationObject.useEnergyConservation;
        this.useRadianceOcclusion = serializationObject.useRadianceOcclusion;
        this.useHorizonOcclusion = serializationObject.useHorizonOcclusion;
        this.unlit = serializationObject.unlit;
        this.forceNormalForward = !!serializationObject.forceNormalForward;
        this.debugMode = serializationObject.debugMode;
        this.debugLimit = serializationObject.debugLimit;
        this.debugFactor = serializationObject.debugFactor;
        this.generateOnlyFragmentCode = !!serializationObject.generateOnlyFragmentCode;

        this._setTarget();
    }
}

RegisterClass("BABYLON.PBRMetallicRoughnessBlock", PBRMetallicRoughnessBlock);
