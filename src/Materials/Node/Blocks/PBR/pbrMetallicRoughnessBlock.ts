import { NodeMaterialBlock } from '../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../nodeMaterialBlockConnectionPoint';
import { MaterialHelper } from '../../../materialHelper';
import { NodeMaterialBlockTargets } from '../../Enums/nodeMaterialBlockTargets';
import { NodeMaterial, NodeMaterialDefines } from '../../nodeMaterial';
import { NodeMaterialSystemValues } from '../../Enums/nodeMaterialSystemValues';
import { InputBlock } from '../Input/inputBlock';
import { Light } from '../../../../Lights/light';
import { Nullable } from '../../../../types';
import { _TypeStore } from '../../../../Misc/typeStore';
import { AbstractMesh } from '../../../../Meshes/abstractMesh';
import { Effect, IEffectCreationOptions } from '../../../effect';
import { Mesh } from '../../../../Meshes/mesh';
import { PBRBaseMaterial } from '../../../PBR/pbrBaseMaterial';
import { Scene } from '../../../../scene';
import { editableInPropertyPage, PropertyTypeForEdition } from "../../nodeMaterialDecorator";
import { NodeMaterialConnectionPointCustomObject } from "../../nodeMaterialConnectionPointCustomObject";
import { AmbientOcclusionBlock } from './ambientOcclusionBlock';
import { SheenBlock } from './sheenBlock';
import { ReflectivityBlock } from './reflectivityBlock';
import { BaseTexture } from '../../../Textures/baseTexture';
import { BRDFTextureTools } from '../../../../Misc/brdfTextureTools';
import { MaterialFlags } from '../../../materialFlags';
import { AnisotropyBlock } from './anisotropyBlock';
import { ReflectionBlock } from './reflectionBlock';
import { ClearCoatBlock } from './clearCoatBlock';
import { SubSurfaceBlock } from './subSurfaceBlock';
import { RefractionBlock } from './refractionBlock';
import { PerturbNormalBlock } from '../Fragment/perturbNormalBlock';

const mapOutputToVariable: { [name: string] : [string, string] } = {
    "ambient":      ["finalAmbient", ""],
    "diffuse":      ["finalDiffuse", ""],
    "specular":     ["finalSpecularScaled",                         "!defined(UNLIT) && defined(SPECULARTERM)"],
    "sheenDir":     ["finalSheenScaled",                            "!defined(UNLIT) && defined(SHEEN)"],
    "clearcoatDir": ["finalClearCoatScaled",                        "!defined(UNLIT) && defined(CLEARCOAT)"],
    "diffuseInd":   ["finalIrradiance",                             "!defined(UNLIT) && defined(REFLECTION)"],
    "specularInd":  ["finalRadianceScaled",                         "!defined(UNLIT) && defined(REFLECTION)"],
    "sheenInd":     ["sheenOut.finalSheenRadianceScaled",           "!defined(UNLIT) && defined(REFLECTION) && defined(SHEEN) && defined(ENVIRONMENTBRDF)"],
    "clearcoatInd": ["clearcoatOut.finalClearCoatRadianceScaled",   "!defined(UNLIT) && defined(REFLECTION) && defined(CLEARCOAT)"],
    "refraction":   ["subSurfaceOut.finalRefraction",               "!defined(UNLIT) && defined(SS_REFRACTION)"],
    "lighting":     ["finalColor.rgb", ""],
    "shadow":       ["shadow", ""],
    "alpha":        ["alpha", ""],
};

/**
 * Block used to implement the PBR metallic/roughness model
 */
export class PBRMetallicRoughnessBlock extends NodeMaterialBlock {
    /**
     * Gets or sets the light associated with this block
     */
    public light: Nullable<Light>;

    private _lightId: number;
    private _scene: Scene;
    private _environmentBRDFTexture: Nullable<BaseTexture> = null;
    private _environmentBrdfSamplerName: string;
    private _vNormalWName: string;
    private _invertNormalName: string;

    /**
     * Create a new ReflectionBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);

        this._isUnique = true;

        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("perturbedNormal", NodeMaterialBlockConnectionPointTypes.Vector4, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("cameraPosition", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("baseColor", NodeMaterialBlockConnectionPointTypes.Color4, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("opacityTexture", NodeMaterialBlockConnectionPointTypes.Color4, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("ambientColor", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("reflectivity", NodeMaterialBlockConnectionPointTypes.Object, false, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("reflectivity", this, NodeMaterialConnectionPointDirection.Input, ReflectivityBlock, "ReflectivityBlock"));
        this.registerInput("ambientOcclusion", NodeMaterialBlockConnectionPointTypes.Object, true, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("ambientOcclusion", this, NodeMaterialConnectionPointDirection.Input, AmbientOcclusionBlock, "AOBlock"));
        this.registerInput("reflection", NodeMaterialBlockConnectionPointTypes.Object, true, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("reflection", this, NodeMaterialConnectionPointDirection.Input, ReflectionBlock, "ReflectionBlock"));
        this.registerInput("sheen", NodeMaterialBlockConnectionPointTypes.Object, true, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("sheen", this, NodeMaterialConnectionPointDirection.Input, SheenBlock, "SheenBlock"));
        this.registerInput("clearcoat", NodeMaterialBlockConnectionPointTypes.Object, true, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("clearcoat", this, NodeMaterialConnectionPointDirection.Input, ClearCoatBlock, "ClearCoatBlock"));
        this.registerInput("subsurface", NodeMaterialBlockConnectionPointTypes.Object, true, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("subsurface", this, NodeMaterialConnectionPointDirection.Input, SubSurfaceBlock, "SubSurfaceBlock"));
        this.registerInput("anisotropy", NodeMaterialBlockConnectionPointTypes.Object, true, NodeMaterialBlockTargets.Fragment,
            new NodeMaterialConnectionPointCustomObject("anisotropy", this, NodeMaterialConnectionPointDirection.Input, AnisotropyBlock, "AnisotropyBlock"));

        this.registerOutput("ambient", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("diffuse", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("specular", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("sheenDir", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("clearcoatDir", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("diffuseInd", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("specularInd", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("sheenInd", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("clearcoatInd", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("refraction", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("lighting", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("shadow", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("alpha", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);
    }

    /**
     * Intensity of the direct lights e.g. the four lights available in your scene.
     * This impacts both the direct diffuse and specular highlights.
     */
    @editableInPropertyPage("Direct lights", PropertyTypeForEdition.Float, "INTENSITY", { min: 0, max: 1, "notifiers": { "update": true }})
    public directIntensity: number = 1.0;

    /**
     * Intensity of the environment e.g. how much the environment will light the object
     * either through harmonics for rough material or through the refelction for shiny ones.
     */
    @editableInPropertyPage("Environment lights", PropertyTypeForEdition.Float, "INTENSITY", { min: 0, max: 1, "notifiers": { "update": true }})
    public environmentIntensity: number = 1.0;

    /**
     * This is a special control allowing the reduction of the specular highlights coming from the
     * four lights of the scene. Those highlights may not be needed in full environment lighting.
     */
    @editableInPropertyPage("Specular highlights", PropertyTypeForEdition.Float, "INTENSITY", { min: 0, max: 1, "notifiers": { "update": true }})
    public specularIntensity: number = 1.0;

    /**
     * Defines the  falloff type used in this material.
     * It by default is Physical.
     */
    @editableInPropertyPage("Light falloff", PropertyTypeForEdition.List, "LIGHTING & COLORS", { "notifiers": { "update": true }, "options": [
        { label: "Physical", value: PBRBaseMaterial.LIGHTFALLOFF_PHYSICAL },
        { label: "GLTF", value: PBRBaseMaterial.LIGHTFALLOFF_GLTF },
        { label: "Standard", value: PBRBaseMaterial.LIGHTFALLOFF_STANDARD },
    ]})
    public lightFalloff = 0;

    /**
     * Specifies that the alpha is coming form the albedo channel alpha channel for alpha blending.
     */
    @editableInPropertyPage("Alpha from albedo", PropertyTypeForEdition.Boolean, "TRANSPARENCY", { "notifiers": { "update": true }})
    public useAlphaFromAlbedoTexture: boolean = false;

    /**
     * Specifies that alpha test should be used
     */
    @editableInPropertyPage("Alpha Testing", PropertyTypeForEdition.Boolean, "TRANSPARENCY")
    public useAlphaTest: boolean = false;

    /**
     * Defines the alpha limits in alpha test mode.
     */
    @editableInPropertyPage("Alpha CutOff", PropertyTypeForEdition.Float, "TRANSPARENCY", { min: 0, max: 1, "notifiers": { "update": true }})
    public alphaTestCutoff: number = 0.5;

    /**
     * Specifies that alpha blending should be used
     */
    @editableInPropertyPage("Alpha blending", PropertyTypeForEdition.Boolean, "TRANSPARENCY")
    public useAlphaBlending: boolean = false;

    /**
     * Defines if the alpha value should be determined via the rgb values.
     * If true the luminance of the pixel might be used to find the corresponding alpha value.
     */
    @editableInPropertyPage("Get alpha from opacity texture RGB", PropertyTypeForEdition.Boolean, "TRANSPARENCY", { "notifiers": { "update": true }})
    public opacityRGB: boolean = false;

    /**
     * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most luminous ones).
     * A car glass is a good exemple of that. When the street lights reflects on it you can not see what is behind.
     */
    @editableInPropertyPage("Radiance over alpha", PropertyTypeForEdition.Boolean, "RENDERING", { "notifiers": { "update": true }})
    public useRadianceOverAlpha: boolean = true;

    /**
     * Specifies that the material will keeps the specular highlights over a transparent surface (only the most luminous ones).
     * A car glass is a good exemple of that. When sun reflects on it you can not see what is behind.
     */
    @editableInPropertyPage("Specular over alpha", PropertyTypeForEdition.Boolean, "RENDERING", { "notifiers": { "update": true }})
    public useSpecularOverAlpha: boolean = true;

    /**
     * Enables specular anti aliasing in the PBR shader.
     * It will both interacts on the Geometry for analytical and IBL lighting.
     * It also prefilter the roughness map based on the bump values.
     */
    @editableInPropertyPage("Specular anti-aliasing", PropertyTypeForEdition.Boolean, "RENDERING", { "notifiers": { "update": true }})
    public enableSpecularAntiAliasing: boolean = false;

    /**
     * Defines if the material uses energy conservation.
     */
    @editableInPropertyPage("Energy Conservation", PropertyTypeForEdition.Boolean, "ADVANCED", { "notifiers": { "update": true }})
    public useEnergyConservation: boolean = true;

    /**
     * This parameters will enable/disable radiance occlusion by preventing the radiance to lit
     * too much the area relying on ambient texture to define their ambient occlusion.
     */
    @editableInPropertyPage("Radiance occlusion", PropertyTypeForEdition.Boolean, "ADVANCED", { "notifiers": { "update": true }})
    public useRadianceOcclusion: boolean = true;

    /**
     * This parameters will enable/disable Horizon occlusion to prevent normal maps to look shiny when the normal
     * makes the reflect vector face the model (under horizon).
     */
    @editableInPropertyPage("Horizon occlusion", PropertyTypeForEdition.Boolean, "ADVANCED", { "notifiers": { "update": true }})
    public useHorizonOcclusion: boolean = true;

    /**
     * If set to true, no lighting calculations will be applied.
     */
    @editableInPropertyPage("Unlit", PropertyTypeForEdition.Boolean, "ADVANCED", { "notifiers": { "update": true }})
    public unlit: boolean = false;

    /**
     * Force normal to face away from face.
     */
    @editableInPropertyPage("Force normal forward", PropertyTypeForEdition.Boolean, "ADVANCED", { "notifiers": { "update": true }})
    public forceNormalForward: boolean = false;

    /**
     * Defines the material debug mode.
     * It helps seeing only some components of the material while troubleshooting.
     */
    @editableInPropertyPage("Debug mode", PropertyTypeForEdition.List, "DEBUG", { "notifiers": { "update": true }, "options": [
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
        { label: "Albedo Map", value: 20 },
        { label: "Ambient Map", value: 21 },
        { label: "Opacity Map", value: 22 },
        //{ label: "Emissive Map", value: 23 },
        //{ label: "Light Map", value: 24 },
        { label: "Metallic Map", value: 25 },
        { label: "Reflectivity Map", value: 26 },
        { label: "ClearCoat Map", value: 27 },
        { label: "ClearCoat Tint Map", value: 28 },
        { label: "Sheen Map", value: 29 },
        { label: "Anisotropic Map", value: 30 },
        { label: "Thickness Map", value: 31 },
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
    ]})
    public debugMode = 0;

    /**
     * Specify from where on screen the debug mode should start.
     * The value goes from -1 (full screen) to 1 (not visible)
     * It helps with side by side comparison against the final render
     * This defaults to 0
     */
    @editableInPropertyPage("Split position", PropertyTypeForEdition.Float, "DEBUG", { min: -1, max: 1, "notifiers": { "update": true }})
    public debugLimit = 0;

    /**
     * As the default viewing range might not be enough (if the ambient is really small for instance)
     * You can use the factor to better multiply the final value.
     */
    @editableInPropertyPage("Output factor", PropertyTypeForEdition.Float, "DEBUG", { min: 0, max: 5, "notifiers": { "update": true }})
    public debugFactor = 1;

    /**
     * Initialize the block and prepare the context for build
     * @param state defines the state that will be used for the build
     */
    public initialize(state: NodeMaterialBuildState) {
        state._excludeVariableName("vLightingIntensity");

        state._excludeVariableName("geometricNormalW");
        state._excludeVariableName("normalW");
        state._excludeVariableName("faceNormal");

        state._excludeVariableName("albedoOpacityOut");
        state._excludeVariableName("surfaceAlbedo");
        state._excludeVariableName("alpha");

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
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
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
     * Gets the perturbed normal input component
     */
    public get perturbedNormal(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the camera position input component
     */
    public get cameraPosition(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the base color input component
     */
    public get baseColor(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the opacity texture input component
     */
    public get opacityTexture(): NodeMaterialConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the ambient color input component
     */
    public get ambientColor(): NodeMaterialConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the reflectivity object parameters
     */
    public get reflectivity(): NodeMaterialConnectionPoint {
        return this._inputs[7];
    }

    /**
     * Gets the ambient occlusion object parameters
     */
    public get ambientOcclusion(): NodeMaterialConnectionPoint {
        return this._inputs[8];
    }

    /**
     * Gets the reflection object parameters
     */
    public get reflection(): NodeMaterialConnectionPoint {
        return this._inputs[9];
    }

    /**
     * Gets the sheen object parameters
     */
    public get sheen(): NodeMaterialConnectionPoint {
        return this._inputs[10];
    }

    /**
     * Gets the clear coat object parameters
     */
    public get clearcoat(): NodeMaterialConnectionPoint {
        return this._inputs[11];
    }

    /**
     * Gets the sub surface object parameters
     */
    public get subsurface(): NodeMaterialConnectionPoint {
        return this._inputs[12];
    }

    /**
     * Gets the anisotropy object parameters
     */
    public get anisotropy(): NodeMaterialConnectionPoint {
        return this._inputs[13];
    }

    /**
     * Gets the ambient output component
     */
    public get ambient(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the diffuse output component
     */
    public get diffuse(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the specular output component
     */
    public get specular(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    /**
     * Gets the sheen output component
     */
    public get sheenDir(): NodeMaterialConnectionPoint {
        return this._outputs[3];
    }

    /**
     * Gets the clear coat output component
     */
    public get clearcoatDir(): NodeMaterialConnectionPoint {
        return this._outputs[4];
    }

    /**
     * Gets the indirect diffuse output component
     */
    public get diffuseIndirect(): NodeMaterialConnectionPoint {
        return this._outputs[5];
    }

    /**
     * Gets the indirect specular output component
     */
    public get specularIndirect(): NodeMaterialConnectionPoint {
        return this._outputs[6];
    }

    /**
     * Gets the indirect sheen output component
     */
    public get sheenIndirect(): NodeMaterialConnectionPoint {
        return this._outputs[7];
    }

    /**
     * Gets the indirect clear coat output component
     */
    public get clearcoatIndirect(): NodeMaterialConnectionPoint {
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
        // General
        defines.setValue("PBR", true);
        defines.setValue("METALLICWORKFLOW", true);
        defines.setValue("DEBUGMODE", this.debugMode, true);
        defines.setValue("NORMALXYSCALE", true);
        defines.setValue("BUMP", this.perturbedNormal.isConnected, true);
        defines.setValue("LODBASEDMICROSFURACE", this._scene.getEngine().getCaps().textureLOD);

        // Albedo & Opacity
        defines.setValue("OPACITY", this.opacityTexture.isConnected, true);

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
        defines.setValue("ALPHABLEND", this.useAlphaBlending, true);
        defines.setValue("ALPHAFROMALBEDO", this.useAlphaFromAlbedoTexture, true);
        defines.setValue("ALPHATEST", this.useAlphaTest, true);
        defines.setValue("ALPHATESTVALUE", this.alphaTestCutoff, true);
        defines.setValue("OPACITYRGB", this.opacityRGB, true);

        // Rendering
        defines.setValue("RADIANCEOVERALPHA", this.useRadianceOverAlpha, true);
        defines.setValue("SPECULAROVERALPHA", this.useSpecularOverAlpha, true);
        defines.setValue("SPECULARAA", this._scene.getEngine().getCaps().standardDerivatives && this.enableSpecularAntiAliasing, true);

        // Advanced
        defines.setValue("BRDF_V_HEIGHT_CORRELATED", true);
        defines.setValue("MS_BRDF_ENERGY_CONSERVATION", this.useEnergyConservation, true);
        defines.setValue("RADIANCEOCCLUSION", this.useRadianceOcclusion, true);
        defines.setValue("HORIZONOCCLUSION", this.useHorizonOcclusion, true);
        defines.setValue("UNLIT", this.unlit, true);
        defines.setValue("FORCENORMALFORWARD", this.forceNormalForward, true);

        if (this._environmentBRDFTexture && MaterialFlags.ReflectionTextureEnabled) {
            defines.setValue("ENVIRONMENTBRDF", true);
            defines.setValue("ENVIRONMENTBRDF_RGBD", this._environmentBRDFTexture.isRGBD, true);
        } else {
            defines.setValue("ENVIRONMENTBRDF" , false);
            defines.setValue("ENVIRONMENTBRDF_RGBD", false);
        }

        if (!defines._areLightsDirty) {
            return;
        }

        const scene = mesh.getScene();

        if (!this.light) {
            // Lights
            MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, nodeMaterial.maxSimultaneousLights);
            defines._needNormals = true;

            // Multiview
            MaterialHelper.PrepareDefinesForMultiview(scene, defines);
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
        MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
            uniformsNames: state.uniforms,
            uniformBuffersNames: uniformBuffers,
            samplers: state.samplers,
            defines: defines,
            maxSimultaneousLights: nodeMaterial.maxSimultaneousLights
        });
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

        effect.setTexture(this._environmentBrdfSamplerName, this._environmentBRDFTexture);

        effect.setFloat2("vDebugMode", this.debugLimit, this.debugFactor);

        const ambientScene = this._scene.ambientColor;

        if (ambientScene) {
            effect.setColor3("ambientFromScene", ambientScene);
        }

        const invertNormal = (scene.useRightHandedSystem === (scene._mirroredCameraPosition != null));

        effect.setFloat(this._invertNormalName, invertNormal ? -1 : 1);

        effect.setFloat4("vLightingIntensity", this.directIntensity, 1, this.environmentIntensity * this._scene.environmentIntensity, this.specularIntensity);
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

        const reflectionBlock = this.reflection.isConnected ? this.reflection.connectedPoint?.ownerBlock as ReflectionBlock : null;

        state.compilationString += reflectionBlock?.handleVertexSide(state) ?? "";

        state._emitUniformFromString("vDebugMode", "vec2", "defined(IGNORE) || DEBUGMODE > 0");
        state._emitUniformFromString("ambientFromScene", "vec3");

        if (state._emitVaryingFromString("vClipSpacePosition", "vec4", "defined(IGNORE) || DEBUGMODE > 0")) {
            state._injectAtEnd += `#if DEBUGMODE > 0\r\n`;
            state._injectAtEnd += `vClipSpacePosition = gl_Position;\r\n`;
            state._injectAtEnd += `#endif\r\n`;
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

    /**
     * Gets the code corresponding to the albedo/opacity module
     * @returns the shader code
     */
    public getAlbedoOpacityCode(): string {
        let code = `albedoOpacityOutParams albedoOpacityOut;\r\n`;

        const albedoColor = this.baseColor.isConnected ? this.baseColor.associatedVariableName : "vec4(1., 1., 1., 1.)";
        const opacityTexture = this.opacityTexture.isConnected ? this.opacityTexture.associatedVariableName : "";

        code += `albedoOpacityBlock(
                ${albedoColor},
            #ifdef ALBEDO
                vec4(1.),
                vec2(1., 1.),
            #endif
            #ifdef OPACITY
                ${opacityTexture},
                vec2(1., 1.),
            #endif
                albedoOpacityOut
            );

            vec3 surfaceAlbedo = albedoOpacityOut.surfaceAlbedo;
            float alpha = albedoOpacityOut.alpha;\r\n`;

        return code;
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        this._scene = state.sharedData.scene;

        if (!this._environmentBRDFTexture) {
            this._environmentBRDFTexture = BRDFTextureTools.GetEnvironmentBRDFTexture(this._scene);
        }

        const reflectionBlock = this.reflection.isConnected ? this.reflection.connectedPoint?.ownerBlock as ReflectionBlock : null;

        if (reflectionBlock) {
            // Need those variables to be setup when calling _injectVertexCode
            reflectionBlock.worldPositionConnectionPoint = this.worldPosition;
            reflectionBlock.cameraPositionConnectionPoint = this.cameraPosition;
            reflectionBlock.worldNormalConnectionPoint = this.worldNormal;
        }

        if (state.target !== NodeMaterialBlockTargets.Fragment) {
            // Vertex
            this._injectVertexCode(state);

            return this;
        }

        // Fragment
        state.sharedData.bindableBlocks.push(this);
        state.sharedData.blocksWithDefines.push(this);

        let comments = `//${this.name}`;
        let worldPosVarName = "v_" + this.worldPosition.associatedVariableName;
        let normalShading = this.perturbedNormal;

        this._environmentBrdfSamplerName = state._getFreeVariableName("environmentBrdfSampler");

        state._emit2DSampler(this._environmentBrdfSamplerName);

        state.sharedData.hints.needAlphaBlending = state.sharedData.hints.needAlphaBlending || this.useAlphaBlending;
        state.sharedData.hints.needAlphaTesting = state.sharedData.hints.needAlphaTesting || this.useAlphaTest;

        state._emitExtension("lod", "#extension GL_EXT_shader_texture_lod : enable", "defined(LODBASEDMICROSFURACE)");

        //
        // Includes
        //
        if (!this.light) { // Emit for all lights
            state._emitFunctionFromInclude(state.supportUniformBuffers ? "lightUboDeclaration" : "lightFragmentDeclaration", comments, {
                repeatKey: "maxSimultaneousLights"
            });
        } else {
            state._emitFunctionFromInclude(state.supportUniformBuffers ? "lightUboDeclaration" : "lightFragmentDeclaration", comments, {
                replaceStrings: [{ search: /{X}/g, replace: this._lightId.toString() }]
            }, this._lightId.toString());
        }

        state._emitFunctionFromInclude("helperFunctions", comments);
        state._emitFunctionFromInclude("pbrHelperFunctions", comments);
        state._emitFunctionFromInclude("imageProcessingFunctions", comments);

        state._emitFunctionFromInclude("shadowsFragmentFunctions", comments, {
            replaceStrings: [
                { search: /vPositionW/g, replace: worldPosVarName + ".xyz" }
            ]
        });

        state._emitFunctionFromInclude("pbrDirectLightingSetupFunctions", comments, {
            replaceStrings: [
                { search: /vPositionW/g, replace: worldPosVarName + ".xyz" }
            ]
        });

        state._emitFunctionFromInclude("pbrDirectLightingFalloffFunctions", comments);
        state._emitFunctionFromInclude("pbrBRDFFunctions", comments);

        state._emitFunctionFromInclude("pbrDirectLightingFunctions", comments, {
            replaceStrings: [
                { search: /vPositionW/g, replace: worldPosVarName + ".xyz" }
            ]
        });

        state._emitFunctionFromInclude("pbrIBLFunctions", comments);

        state._emitFunctionFromInclude("pbrBlockAlbedoOpacity", comments);
        state._emitFunctionFromInclude("pbrBlockReflectivity", comments);
        state._emitFunctionFromInclude("pbrBlockAmbientOcclusion", comments);
        state._emitFunctionFromInclude("pbrBlockAlphaFresnel", comments);
        state._emitFunctionFromInclude("pbrBlockAnisotropic", comments);

        //
        // code
        //

        state._emitUniformFromString("vLightingIntensity", "vec4");

        // _____________________________ Geometry Information ____________________________
        this._vNormalWName = state._getFreeVariableName("vNormalW");

        state.compilationString += `vec4 ${this._vNormalWName} = normalize(${this.worldNormal.associatedVariableName});\r\n`;

        if (state._registerTempVariable("viewDirectionW")) {
            state.compilationString += `vec3 viewDirectionW = normalize(${this.cameraPosition.associatedVariableName} - ${worldPosVarName}.xyz);\r\n`;
        }

        state.compilationString += `vec3 geometricNormalW = ${this._vNormalWName}.xyz;\r\n`;

        state.compilationString += `vec3 normalW = ${normalShading.isConnected ? "normalize(" + normalShading.associatedVariableName + ".xyz)" : "geometricNormalW"};\r\n`;

        this._invertNormalName = state._getFreeVariableName("invertNormal");

        state._emitUniformFromString(this._invertNormalName, "float");

        state.compilationString += state._emitCodeFromInclude("pbrBlockNormalFinal", comments, {
            replaceStrings: [
                { search: /vPositionW/g, replace: worldPosVarName + ".xyz" },
                { search: /vEyePosition.w/g, replace: this._invertNormalName },
            ]
        });

        // _____________________________ Albedo & Opacity ______________________________
        state.compilationString += this.getAlbedoOpacityCode();

        state.compilationString += state._emitCodeFromInclude("depthPrePass", comments);

        // _____________________________ AO  _______________________________
        const aoBlock = this.ambientOcclusion.connectedPoint?.ownerBlock as Nullable<AmbientOcclusionBlock>;

        state.compilationString += AmbientOcclusionBlock.GetCode(aoBlock);

        // _____________________________ UNLIT  _______________________________

        state.compilationString += `#ifdef UNLIT
                vec3 diffuseBase = vec3(1., 1., 1.);
            #else\r\n`;

        // _____________________________ Reflectivity _______________________________
        const aoIntensity = aoBlock?.intensity.isConnected ? aoBlock.intensity.associatedVariableName : "1.";

        state.compilationString += (this.reflectivity.connectedPoint?.ownerBlock as Nullable<ReflectivityBlock>)?.getCode(aoIntensity) ?? "";

        // _____________________________ Geometry info _________________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockGeometryInfo", comments, {
            replaceStrings: [
                { search: /REFLECTIONMAP_SKYBOX/g, replace: reflectionBlock?._defineSkyboxName ?? "REFLECTIONMAP_SKYBOX" },
                { search: /REFLECTIONMAP_3D/g, replace: reflectionBlock?._define3DName ?? "REFLECTIONMAP_3D" },
            ]
        });

        // _____________________________ Anisotropy _______________________________________
        const anisotropyBlock = this.anisotropy.isConnected ? this.anisotropy.connectedPoint?.ownerBlock as AnisotropyBlock : null;

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
            ]
        });

        // ___________________ Compute Reflectance aka R0 F0 info _________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockReflectance0", comments);

        // ________________________________ Sheen ______________________________
        const sheenBlock = this.sheen.isConnected ? this.sheen.connectedPoint?.ownerBlock as SheenBlock : null;

        if (sheenBlock) {
            state.compilationString += sheenBlock.getCode(reflectionBlock);
        }

        state._emitFunctionFromInclude("pbrBlockSheen", comments, {
            replaceStrings: [
                { search: /REFLECTIONMAP_3D/g, replace: reflectionBlock?._define3DName ?? "REFLECTIONMAP_3D" },
                { search: /REFLECTIONMAP_SKYBOX/g, replace: reflectionBlock?._defineSkyboxName ?? "REFLECTIONMAP_SKYBOX" },
                { search: /LODINREFLECTIONALPHA/g, replace: reflectionBlock?._defineLODReflectionAlpha ?? "LODINREFLECTIONALPHA" },
                { search: /LINEARSPECULARREFLECTION/g, replace: reflectionBlock?._defineLinearSpecularReflection ?? "LINEARSPECULARREFLECTION" },
            ]
        });

        // _____________________________ Clear Coat ____________________________
        const clearcoatBlock = this.clearcoat.isConnected ? this.clearcoat.connectedPoint?.ownerBlock as ClearCoatBlock : null;
        const generateTBNSpace = !this.perturbedNormal.isConnected && !this.anisotropy.isConnected;
        const isTangentConnectedToPerturbNormal = this.perturbedNormal.isConnected && (this.perturbedNormal.connectedPoint?.ownerBlock as PerturbNormalBlock).worldTangent.isConnected;
        const isTangentConnectedToAnisotropy = this.anisotropy.isConnected && (this.anisotropy.connectedPoint?.ownerBlock as AnisotropyBlock).worldTangent.isConnected;
        let vTBNAvailable = isTangentConnectedToPerturbNormal || (!this.perturbedNormal.isConnected && isTangentConnectedToAnisotropy);

        state.compilationString += ClearCoatBlock.GetCode(state, clearcoatBlock, reflectionBlock, worldPosVarName, generateTBNSpace, vTBNAvailable, this.worldNormal.associatedVariableName);

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
            ]
        });

        // _________________________ Specular Environment Reflectance __________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockReflectance", comments, {
            replaceStrings: [
                { search: /REFLECTIONMAP_SKYBOX/g, replace: reflectionBlock?._defineSkyboxName ?? "REFLECTIONMAP_SKYBOX" },
                { search: /REFLECTIONMAP_3D/g, replace: reflectionBlock?._define3DName ?? "REFLECTIONMAP_3D" },
            ]
        });

        // ___________________________________ SubSurface ______________________________________
        const subsurfaceBlock = this.subsurface.isConnected ? this.subsurface.connectedPoint?.ownerBlock as SubSurfaceBlock : null;
        const refractionBlock = this.subsurface.isConnected ? (this.subsurface.connectedPoint?.ownerBlock as SubSurfaceBlock).refraction.connectedPoint?.ownerBlock as RefractionBlock : null;

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
            ]
        });

        // _____________________________ Direct Lighting Info __________________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockDirectLighting", comments);

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

        // _____________________________ Compute Final Lit Components ________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockFinalLitComponents", comments);

        // _____________________________ UNLIT (2) ________________________
        state.compilationString += `#endif\r\n`; // UNLIT

        // _____________________________ Compute Final Unlit Components ________________________
        const aoColor = this.ambientColor.isConnected ? this.ambientColor.associatedVariableName : "vec3(0., 0., 0.)";

        let aoDirectLightIntensity = aoBlock?.directLightIntensity.isConnected ? aoBlock.directLightIntensity.associatedVariableName : PBRBaseMaterial.DEFAULT_AO_ON_ANALYTICAL_LIGHTS.toString();

        if (!aoBlock?.directLightIntensity.isConnected && aoDirectLightIntensity.indexOf('.') === -1) {
            aoDirectLightIntensity += ".";
        }

        state.compilationString += state._emitCodeFromInclude("pbrBlockFinalUnlitComponents", comments, {
            replaceStrings: [
                { search: /vec3 finalEmissive[\s\S]*?finalEmissive\*=vLightingIntensity\.y;/g, replace: "" },
                { search: /vAmbientColor/g, replace: aoColor + " * ambientFromScene" },
                { search: /vAmbientInfos\.w/g, replace: aoDirectLightIntensity },
            ]
        });

        // _____________________________ Output Final Color Composition ________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockFinalColorComposition", comments, {
            replaceStrings: [
                { search: /finalEmissive/g, replace: "vec3(0.)" },
            ]
        });

        // _____________________________ Apply image processing ________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockImageProcessing", comments, {
            replaceStrings: [
                { search: /visibility/g, replace: "1." },
            ]
        });

        // _____________________________ Generate debug code ________________________
        state.compilationString += state._emitCodeFromInclude("pbrDebug", comments, {
            replaceStrings: [
                { search: /vNormalW/g, replace: this._vNormalWName },
                { search: /vPositionW/g, replace: worldPosVarName },
                { search: /albedoTexture\.rgb;/g, replace: "vec3(1.);\r\ngl_FragColor.rgb = toGammaSpace(gl_FragColor.rgb);\r\n" },
                { search: /opacityMap/g, replace: this.opacityTexture.associatedVariableName },
            ]
        });

        // _____________________________ Generate end points ________________________
        for (var output of this._outputs) {
            if (output.hasEndpoints) {
                const remap = mapOutputToVariable[output.name];
                if (remap) {
                    const [varName, conditions] = remap;
                    if (conditions) {
                        state.compilationString += `#if ${conditions}\r\n`;
                    }
                    state.compilationString += `${this._declareOutput(output, state)} = ${varName};\r\n`;
                    if (conditions) {
                        state.compilationString += `#else\r\n`;
                        state.compilationString += `${this._declareOutput(output, state)} = vec3(0.);\r\n`;
                        state.compilationString += `#endif\r\n`;
                    }
                } else {
                    console.error(`There's no remapping for the ${output.name} end point! No code generated`);
                }
            }
        }

        return this;
    }

    protected _dumpPropertiesCode() {
        let codeString: string = "";

        codeString += `${this._codeVariableName}.lightFalloff = ${this.lightFalloff};\r\n`;
        codeString += `${this._codeVariableName}.useAlphaFromAlbedoTexture = ${this.useAlphaFromAlbedoTexture};\r\n`;
        codeString += `${this._codeVariableName}.useAlphaTest = ${this.useAlphaTest};\r\n`;
        codeString += `${this._codeVariableName}.alphaTestCutoff = ${this.alphaTestCutoff};\r\n`;
        codeString += `${this._codeVariableName}.useAlphaBlending = ${this.useAlphaBlending};\r\n`;
        codeString += `${this._codeVariableName}.opacityRGB = ${this.opacityRGB};\r\n`;
        codeString += `${this._codeVariableName}.useRadianceOverAlpha = ${this.useRadianceOverAlpha};\r\n`;
        codeString += `${this._codeVariableName}.useSpecularOverAlpha = ${this.useSpecularOverAlpha};\r\n`;
        codeString += `${this._codeVariableName}.enableSpecularAntiAliasing = ${this.enableSpecularAntiAliasing};\r\n`;
        codeString += `${this._codeVariableName}.useEnergyConservation = ${this.useEnergyConservation};\r\n`;
        codeString += `${this._codeVariableName}.useRadianceOcclusion = ${this.useRadianceOcclusion};\r\n`;
        codeString += `${this._codeVariableName}.useHorizonOcclusion = ${this.useHorizonOcclusion};\r\n`;
        codeString += `${this._codeVariableName}.unlit = ${this.unlit};\r\n`;
        codeString += `${this._codeVariableName}.forceNormalForward = ${this.forceNormalForward};\r\n`;
        codeString += `${this._codeVariableName}.debugMode = ${this.debugMode};\r\n`;
        codeString += `${this._codeVariableName}.debugLimit = ${this.debugLimit};\r\n`;
        codeString += `${this._codeVariableName}.debugFactor = ${this.debugFactor};\r\n`;

        return codeString;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        if (this.light) {
            serializationObject.lightId = this.light.id;
        }

        serializationObject.lightFalloff = this.lightFalloff;
        serializationObject.useAlphaFromAlbedoTexture = this.useAlphaFromAlbedoTexture;
        serializationObject.useAlphaTest = this.useAlphaTest;
        serializationObject.alphaTestCutoff = this.alphaTestCutoff;
        serializationObject.useAlphaBlending = this.useAlphaBlending;
        serializationObject.opacityRGB = this.opacityRGB;
        serializationObject.useRadianceOverAlpha = this.useRadianceOverAlpha;
        serializationObject.useSpecularOverAlpha = this.useSpecularOverAlpha;
        serializationObject.enableSpecularAntiAliasing = this.enableSpecularAntiAliasing;
        serializationObject.useEnergyConservation = this.useEnergyConservation;
        serializationObject.useRadianceOcclusion = this.useRadianceOcclusion;
        serializationObject.useHorizonOcclusion = this.useHorizonOcclusion;
        serializationObject.unlit = this.unlit;
        serializationObject.forceNormalForward = this.forceNormalForward;
        serializationObject.debugMode = this.debugMode;
        serializationObject.debugLimit = this.debugLimit;
        serializationObject.debugFactor = this.debugFactor;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        if (serializationObject.lightId) {
            this.light = scene.getLightByID(serializationObject.lightId);
        }

        this.lightFalloff = serializationObject.lightFalloff ?? 0;
        this.useAlphaFromAlbedoTexture = serializationObject.useAlphaFromAlbedoTexture;
        this.useAlphaTest = serializationObject.useAlphaTest;
        this.alphaTestCutoff = serializationObject.alphaTestCutoff;
        this.useAlphaBlending = serializationObject.useAlphaBlending;
        this.opacityRGB = serializationObject.opacityRGB;
        this.useRadianceOverAlpha = serializationObject.useRadianceOverAlpha;
        this.useSpecularOverAlpha = serializationObject.useSpecularOverAlpha;
        this.enableSpecularAntiAliasing = serializationObject.enableSpecularAntiAliasing;
        this.useEnergyConservation = serializationObject.useEnergyConservation;
        this.useRadianceOcclusion = serializationObject.useRadianceOcclusion;
        this.useHorizonOcclusion = serializationObject.useHorizonOcclusion;
        this.unlit = serializationObject.unlit;
        this.forceNormalForward = !!serializationObject.forceNormalForward;
        this.debugMode = serializationObject.debugMode;
        this.debugLimit = serializationObject.debugLimit;
        this.debugFactor = serializationObject.debugFactor;
    }
}

_TypeStore.RegisteredTypes["BABYLON.PBRMetallicRoughnessBlock"] = PBRMetallicRoughnessBlock;