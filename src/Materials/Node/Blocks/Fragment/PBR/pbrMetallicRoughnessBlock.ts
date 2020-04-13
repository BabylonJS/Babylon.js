import { NodeMaterialBlock } from '../../../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../../../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../../../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointDirection } from '../../../nodeMaterialBlockConnectionPoint';
import { MaterialHelper } from '../../../../materialHelper';
import { NodeMaterialBlockTargets } from '../../../Enums/nodeMaterialBlockTargets';
import { NodeMaterial, NodeMaterialDefines } from '../../../nodeMaterial';
import { NodeMaterialSystemValues } from '../../../Enums/nodeMaterialSystemValues';
import { InputBlock } from '../../Input/inputBlock';
import { Light } from '../../../../../Lights/light';
import { Nullable } from '../../../../../types';
import { _TypeStore } from '../../../../../Misc/typeStore';
import { AbstractMesh } from '../../../../../Meshes/abstractMesh';
import { Effect, IEffectCreationOptions } from '../../../../effect';
import { Mesh } from '../../../../../Meshes/mesh';
import { PBRBaseMaterial } from '../../../../PBR/pbrBaseMaterial';
import { Scene } from '../../../../../scene';
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../nodeMaterialDecorator";
import { NodeMaterialConnectionPointCustomObject } from "../../../nodeMaterialConnectionPointCustomObject";
import { AmbientOcclusionBlock } from './ambientOcclusionBlock';
import { SheenBlock } from './sheenBlock';
import { ReflectivityBlock } from './reflectivityBlock';
import { BaseTexture } from '../../../../Textures/baseTexture';
import { Engine } from '../../../../../Engines/engine';
import { BRDFTextureTools } from '../../../../../Misc/brdfTextureTools';
import { MaterialFlags } from '../../../../materialFlags';
import { AnisotropyBlock } from './anisotropyBlock';
import { ReflectionBlock } from './reflectionBlock';

export class PBRMetallicRoughnessBlock extends NodeMaterialBlock {
    private _lightId: number;

    /**
     * Gets or sets the light associated with this block
     */
    public light: Nullable<Light>;

    protected _environmentBRDFTexture: Nullable<BaseTexture> = null;
    protected _environmentBrdfSamplerName: string;

    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.VertexAndFragment);

        this._isUnique = true;

        this.registerInput("worldPosition", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Vertex);
        this.registerInput("worldNormal", NodeMaterialBlockConnectionPointTypes.Vector4, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("perturbedNormal", NodeMaterialBlockConnectionPointTypes.Vector4, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("cameraPosition", NodeMaterialBlockConnectionPointTypes.Vector3, false, NodeMaterialBlockTargets.Fragment);
        this.registerInput("baseColor", NodeMaterialBlockConnectionPointTypes.Color4, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("baseTexture", NodeMaterialBlockConnectionPointTypes.Color4, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("opacityTexture", NodeMaterialBlockConnectionPointTypes.Color4, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("reflectivity", NodeMaterialBlockConnectionPointTypes.Object, false, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("reflectivity", this, NodeMaterialConnectionPointDirection.Input, ReflectivityBlock, "ReflectivityBlock"));
        this.registerInput("ambientColor", NodeMaterialBlockConnectionPointTypes.Color3, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("ambientOcclusion", NodeMaterialBlockConnectionPointTypes.Object, true, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("ambientOcclusion", this, NodeMaterialConnectionPointDirection.Input, AmbientOcclusionBlock, "AOBlock"));
        this.registerInput("reflection", NodeMaterialBlockConnectionPointTypes.Object, true, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("reflection", this, NodeMaterialConnectionPointDirection.Input, ReflectionBlock, "ReflectionBlock"));
        this.registerInput("sheen", NodeMaterialBlockConnectionPointTypes.Object, true, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("sheen", this, NodeMaterialConnectionPointDirection.Input, SheenBlock, "SheenBlock"));
        this.registerInput("clearCoat", NodeMaterialBlockConnectionPointTypes.Object, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("subSurface", NodeMaterialBlockConnectionPointTypes.Object, true, NodeMaterialBlockTargets.Fragment);
        this.registerInput("anisotropy", NodeMaterialBlockConnectionPointTypes.Object, true, NodeMaterialBlockTargets.Fragment, new NodeMaterialConnectionPointCustomObject("anisotropy", this, NodeMaterialConnectionPointDirection.Input, AnisotropyBlock, "AnisotropyBlock"));

        this.registerOutput("ambient", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("diffuse", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("specular", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("sheen", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("clearcoat", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("diffuseInd", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("specularInd", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("sheenInd", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("clearcoatInd", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("refraction", NodeMaterialBlockConnectionPointTypes.Color3, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("lighting", NodeMaterialBlockConnectionPointTypes.Color4, NodeMaterialBlockTargets.Fragment);
        this.registerOutput("shadow", NodeMaterialBlockConnectionPointTypes.Float, NodeMaterialBlockTargets.Fragment);

        this._environmentBRDFTexture = BRDFTextureTools.GetEnvironmentBRDFTexture(Engine.LastCreatedScene!);
    }

    @editableInPropertyPage("Alpha from albedo", PropertyTypeForEdition.Boolean, "TRANSPARENCY", { "notifiers": { "update": true }})
    public useAlphaFromAlbedoTexture: boolean = false;

    @editableInPropertyPage("Alpha Testing", PropertyTypeForEdition.Boolean, "TRANSPARENCY", { "notifiers": { "update": true }})
    public useAlphaTest: boolean = false;

    @editableInPropertyPage("Alpha CutOff", PropertyTypeForEdition.Float, "TRANSPARENCY", { min: 0, max: 1, "notifiers": { "update": true }})
    public alphaTestCutoff: number = 0.4;

    @editableInPropertyPage("Alpha blending", PropertyTypeForEdition.Boolean, "TRANSPARENCY", { "notifiers": { "update": true }})
    public useAlphaBlending: boolean = false;

    @editableInPropertyPage("Get alpha from opacity texture RGB", PropertyTypeForEdition.Boolean, "TRANSPARENCY", { "notifiers": { "update": true }})
    public opacityRGB: boolean = false;

    @editableInPropertyPage("Radiance over alpha", PropertyTypeForEdition.Boolean, "RENDERING", { "notifiers": { "update": true }})
    public useRadianceOverAlpha: boolean = true;

    @editableInPropertyPage("Specular over alpha", PropertyTypeForEdition.Boolean, "RENDERING", { "notifiers": { "update": true }})
    public useSpecularOverAlpha: boolean = true;

    @editableInPropertyPage("Specular anti-aliasing", PropertyTypeForEdition.Boolean, "RENDERING", { "notifiers": { "update": true }})
    public enableSpecularAntiAliasing: boolean = false;

    @editableInPropertyPage("Energy Conservation", PropertyTypeForEdition.Boolean, "ADVANCED", { "notifiers": { "update": true }})
    public useEnergyConservation: boolean = true;

    @editableInPropertyPage("Radiance occlusion", PropertyTypeForEdition.Boolean, "ADVANCED", { "notifiers": { "update": true }})
    public useRadianceOcclusion: boolean = true;

    @editableInPropertyPage("Horizon occlusion", PropertyTypeForEdition.Boolean, "ADVANCED", { "notifiers": { "update": true }})
    public useHorizonOcclusion: boolean = true;

    @editableInPropertyPage("Unlit", PropertyTypeForEdition.Boolean, "ADVANCED", { "notifiers": { "update": true }})
    public unlit: boolean = false;

    @editableInPropertyPage("Debug mode", PropertyTypeForEdition.List, "DEBUG", { "notifiers": { "update": true }, "options": [
        { label: "None", value: 0 },
        // Geometry
        { label: "Normalized position", value: 1 },
        { label: "Normals", value: 2 },
        { label: "Tangents", value: 3 },
        { label: "Bitangents", value: 4 },
        { label: "Bump Normals", value: 5 },
        { label: "UV1", value: 6 },
        { label: "UV2", value: 7 },
        { label: "ClearCoat Normals", value: 8 },
        { label: "ClearCoat Tangents", value: 9 },
        { label: "ClearCoat Bitangents", value: 10 },
        { label: "Anisotropic Normals", value: 11 },
        { label: "Anisotropic Tangents", value: 12 },
        { label: "Anisotropic Bitangents", value: 13 },
        // Maps
        { label: "Albdeo Map", value: 20 },
        { label: "Ambient Map", value: 21 },
        { label: "Opacity Map", value: 22 },
        { label: "Emissive Map", value: 23 },
        { label: "Light Map", value: 24 },
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

    @editableInPropertyPage("Split position", PropertyTypeForEdition.Float, "DEBUG", { min: -1, max: 1, "notifiers": { "update": true }})
    public debugLimit = 0;

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

    public get worldPosition(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    public get worldNormal(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    public get perturbedNormal(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    public get cameraPosition(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    public get baseColor(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    public get baseTexture(): NodeMaterialConnectionPoint {
        return this._inputs[5];
    }

    public get opacityTexture(): NodeMaterialConnectionPoint {
        return this._inputs[6];
    }

    public get reflectivityParams(): NodeMaterialConnectionPoint {
        return this._inputs[7];
    }

    public get ambientColor(): NodeMaterialConnectionPoint {
        return this._inputs[8];
    }

    public get ambientOcclusionParams(): NodeMaterialConnectionPoint {
        return this._inputs[9];
    }

    public get reflectionParams(): NodeMaterialConnectionPoint {
        return this._inputs[10];
    }

    public get sheenParams(): NodeMaterialConnectionPoint {
        return this._inputs[11];
    }

    public get clearcoatParams(): NodeMaterialConnectionPoint {
        return this._inputs[12];
    }

    public get subSurfaceParams(): NodeMaterialConnectionPoint {
        return this._inputs[13];
    }

    public get anisotropyParams(): NodeMaterialConnectionPoint {
        return this._inputs[14];
    }

    public get ambient(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    public get diffuse(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    public get specular(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    public get sheen(): NodeMaterialConnectionPoint {
        return this._outputs[3];
    }

    public get clearcoat(): NodeMaterialConnectionPoint {
        return this._outputs[4];
    }

    public get diffuseIndirect(): NodeMaterialConnectionPoint {
        return this._outputs[5];
    }

    public get specularIndirect(): NodeMaterialConnectionPoint {
        return this._outputs[6];
    }

    public get sheenIndirect(): NodeMaterialConnectionPoint {
        return this._outputs[7];
    }

    public get clearcoatIndirect(): NodeMaterialConnectionPoint {
        return this._outputs[8];
    }

    public get refraction(): NodeMaterialConnectionPoint {
        return this._outputs[9];
    }

    public get lighting(): NodeMaterialConnectionPoint {
        return this._outputs[10];
    }

    public get shadow(): NodeMaterialConnectionPoint {
        return this._outputs[11];
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
        defines.setValue("PBR", true);
        defines.setValue("METALLICWORKFLOW", true);
        defines.setValue("DEBUGMODE", this.debugMode);

        // Albedo & Opacity
        if (this.baseTexture.isConnected) {
            defines.setValue("ALBEDO", true);
        }

        if (this.opacityTexture.isConnected) {
            defines.setValue("OPACITY", true);
        }

        defines.setValue("ALPHABLEND", this.useAlphaBlending);
        defines.setValue("ALPHAFROMALBEDO", this.useAlphaFromAlbedoTexture);
        defines.setValue("ALPHATEST", this.useAlphaTest);
        defines.setValue("ALPHATESTVALUE", this.alphaTestCutoff);
        defines.setValue("OPACITYRGB", this.opacityRGB);

        // Rendering
        defines.setValue("RADIANCEOVERALPHA", this.useRadianceOverAlpha);
        defines.setValue("SPECULAROVERALPHA", this.useSpecularOverAlpha);
        defines.setValue("SPECULARAA", Engine.LastCreatedScene!.getEngine().getCaps().standardDerivatives && this.enableSpecularAntiAliasing);

        // Advanced
        defines.setValue("BRDF_V_HEIGHT_CORRELATED", true);
        defines.setValue("MS_BRDF_ENERGY_CONSERVATION", this.useEnergyConservation);
        defines.setValue("RADIANCEOCCLUSION", this.useRadianceOcclusion);
        defines.setValue("HORIZONOCCLUSION", this.useHorizonOcclusion);
        defines.setValue("UNLIT", this.unlit);

        if (this._environmentBRDFTexture && MaterialFlags.ReflectionTextureEnabled) {
            defines.setValue("ENVIRONMENTBRDF", true);
            defines.setValue("ENVIRONMENTBRDF_RGBD", this._environmentBRDFTexture.isRGBD);
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
            //MaterialHelper.PrepareDefinesForMultiview(scene, defines);
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

        const reflectionBlock = this.reflectionParams.isConnected ? this.reflectionParams.connectedPoint?.ownerBlock as ReflectionBlock : null;

        state.compilationString += reflectionBlock?.handleVertexSide(state) ?? "";

        state._emitUniformFromString("vDebugMode", "vec2", "defined(DUMMY) || DEBUGMODE > 0");

        if (state._emitVaryingFromString("vClipSpacePosition", "vec4", "defined(DUMMY) || DEBUGMODE > 0")) {
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

    public getAlbedoOpacityCode(): string {
        let code = `albedoOpacityOutParams albedoOpacityOut;\r\n`;

        const albedoColor = this.baseColor.isConnected ? this.baseColor.associatedVariableName : "vec4(1., 1., 1., 1.)";
        const albedoTexture = this.baseTexture.isConnected ? this.baseTexture.associatedVariableName : "";
        const opacityTexture = this.opacityTexture.isConnected ? this.opacityTexture.associatedVariableName : "";

        code += `albedoOpacityBlock(
                ${albedoColor},
            #ifdef ALBEDO
                ${albedoTexture},
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

        const reflectionBlock = this.reflectionParams.isConnected ? this.reflectionParams.connectedPoint?.ownerBlock as ReflectionBlock : null;

        if (reflectionBlock) {
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
        let worldPos = this.worldPosition;
        let normalShading = this.perturbedNormal;

        this._environmentBrdfSamplerName = state._getFreeVariableName("environmentBrdfSampler");

        state._emit2DSampler(this._environmentBrdfSamplerName);

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
                { search: /vPositionW/g, replace: "v_" + worldPos.associatedVariableName + ".xyz" }
            ]
        });

        state._emitFunctionFromInclude("pbrDirectLightingSetupFunctions", comments, {
            replaceStrings: [
                { search: /vPositionW/g, replace: "v_" + worldPos.associatedVariableName + ".xyz" }
            ]
        });

        state._emitFunctionFromInclude("pbrDirectLightingFalloffFunctions", comments);
        state._emitFunctionFromInclude("pbrBRDFFunctions", comments);

        state._emitFunctionFromInclude("pbrDirectLightingFunctions", comments, {
            replaceStrings: [
                { search: /vPositionW/g, replace: "v_" + worldPos.associatedVariableName + ".xyz" }
            ]
        });

        state._emitFunctionFromInclude("pbrIBLFunctions", comments);

        state._emitFunctionFromInclude("pbrBlockAlbedoOpacity", comments);
        state._emitFunctionFromInclude("pbrBlockReflectivity", comments);
        state._emitFunctionFromInclude("pbrBlockAmbientOcclusion", comments);
        state._emitFunctionFromInclude("pbrBlockAlphaFresnel", comments);
        state._emitFunctionFromInclude("pbrBlockAnisotropic", comments);
        //state._emitFunctionFromInclude("pbrBlockReflection", comments);
        state._emitFunctionFromInclude("pbrBlockSheen", comments);
        state._emitFunctionFromInclude("pbrBlockClearcoat", comments);
        state._emitFunctionFromInclude("pbrBlockSubSurface", comments);

        //
        // code
        //

        state.compilationString += `vec4 vLightingIntensity = vec4(1.);\r\n`;

        // _____________________________ Geometry Information ____________________________
        if (state._registerTempVariable("viewDirectionW")) {
            state.compilationString += `vec3 viewDirectionW = normalize(${this.cameraPosition.associatedVariableName} - ${"v_" + worldPos.associatedVariableName}.xyz);\r\n`;
        }

        state.compilationString += `vec3 geometricNormalW = ${this.worldNormal.associatedVariableName}.xyz;\r\n`;

        state.compilationString += `vec3 normalW = ${normalShading.isConnected ? normalShading.associatedVariableName + ".xyz" : "geometricNormalW"};\r\n`;

        state.compilationString += state._emitCodeFromInclude("pbrBlockNormalFinal", comments, {
            replaceStrings: [
                { search: /vPositionW/g, replace: worldPos.associatedVariableName },
                { search: /vEyePosition.w/g, replace: "1." },
            ]
        });

        // _____________________________ Albedo & Opacity ______________________________
        state.compilationString += this.getAlbedoOpacityCode();

        state.compilationString += state._emitCodeFromInclude("depthPrePass", comments);

        // _____________________________ AO  _______________________________
        const aoBlock = this.ambientOcclusionParams.connectedPoint?.ownerBlock as Nullable<AmbientOcclusionBlock>;

        state.compilationString += AmbientOcclusionBlock.getCode(aoBlock);

        // _____________________________ Reflectivity _______________________________
        const aoIntensity = aoBlock?.intensity.isConnected ? aoBlock.intensity.associatedVariableName : "1.";

        state.compilationString += (this.reflectivityParams.connectedPoint?.ownerBlock as Nullable<ReflectivityBlock>)?.getCode(aoIntensity) ?? "";

        // _____________________________ Geometry info _________________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockGeometryInfo", comments);

        // _____________________________ Anisotropy _______________________________________
        const anisotropyBlock = this.anisotropyParams.isConnected ? this.anisotropyParams.connectedPoint?.ownerBlock as AnisotropyBlock : null;

        if (anisotropyBlock) {
            state.compilationString += anisotropyBlock.getCode();
        }

        // _____________________________ Reflection _______________________________________
        if (reflectionBlock && reflectionBlock.texture) {
            state.compilationString += `
                struct reflectionOutParams
                {
                    vec4 environmentRadiance;
                    vec3 environmentIrradiance;
                #ifdef ${reflectionBlock._define3DName}
                    vec3 reflectionCoords;
                #else
                    vec2 reflectionCoords;
                #endif
                #ifdef SS_TRANSLUCENCY
                    #ifdef USESPHERICALFROMREFLECTIONMAP
                        #if !defined(NORMAL) || !defined(USESPHERICALINVERTEX)
                            vec3 irradianceVector;
                        #endif
                    #endif
                #endif
                };
            `;

            state.compilationString += `reflectionOutParams reflectionOut;\r\n`;
            state.compilationString += reflectionBlock.getCode(state, anisotropyBlock ? "anisotropicOut.anisotropicNormal" : "normalW", "environmentRadiance", "irradianceVector", "environmentIrradiance");
            state.compilationString += `
                #ifdef SS_TRANSLUCENCY
                    reflectionOut.irradianceVector = irradianceVector;
                #endif
                reflectionOut.environmentRadiance = environmentRadiance;
                reflectionOut.environmentIrradiance = environmentIrradiance;
                reflectionOut.reflectionCoords = ${reflectionBlock._reflectionCoordsName};\r\n`;
        }

        // ___________________ Compute Reflectance aka R0 F0 info _________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockReflectance0", comments);

        // ________________________________ Sheen ______________________________

        // _____________________________ Clear Coat ____________________________
        state.compilationString += `clearcoatOutParams clearcoatOut;
            #ifdef CLEARCOAT
            #else
                clearcoatOut.specularEnvironmentR0 = specularEnvironmentR0;
            #endif\r\n`;

        // _________________________ Specular Environment Reflectance __________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockReflectance", comments);

        // ___________________________________ SubSurface ______________________________________
        state.compilationString += `subSurfaceOutParams subSurfaceOut;
            #ifdef SUBSURFACE
            #else
                subSurfaceOut.specularEnvironmentReflectance = specularEnvironmentReflectance;
            #endif\r\n`;

        // _____________________________ Direct Lighting Info __________________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockDirectLighting", comments);

        /*if (this.light) {
            state.compilationString += state._emitCodeFromInclude("lightFragment", comments, {
                replaceStrings: [
                    { search: /{X}/g, replace: this._lightId.toString() }
                ]
            });
        } else {
            state.compilationString += state._emitCodeFromInclude("lightFragment", comments, {
                repeatKey: "maxSimultaneousLights"
            });
        }*/

        // _____________________________ Compute Final Lit and Unlit Components ________________________
        state.compilationString += state._emitCodeFromInclude("pbrBlockFinalLitComponents", comments);

        const aoColor = this.ambientColor.isConnected ? this.ambientColor.associatedVariableName : "vec3(0., 0., 0.)";

        let aoDirectLightIntensity = aoBlock?.directLightIntensity.isConnected ? aoBlock.directLightIntensity.associatedVariableName : PBRBaseMaterial.DEFAULT_AO_ON_ANALYTICAL_LIGHTS.toString();

        if (!aoBlock?.directLightIntensity.isConnected && aoDirectLightIntensity.indexOf('.') === -1) {
            aoDirectLightIntensity += ".";
        }

        state.compilationString += state._emitCodeFromInclude("pbrBlockFinalUnlitComponents", comments, {
            replaceStrings: [
                { search: /vec3 finalEmissive[\s\S]*?finalEmissive\*=vLightingIntensity\.y;/g, replace: "" },
                { search: /vAmbientColor/g, replace: aoColor },
                { search: /vAmbientInfos\.w/g, replace: aoDirectLightIntensity },
            ]
        });

        state.compilationString += state._emitCodeFromInclude("pbrBlockFinalColorComposition", comments, {
            replaceStrings: [
                { search: /finalEmissive/g, replace: "vec3(0.)" },
            ]
        });

        state.compilationString += state._emitCodeFromInclude("pbrBlockImageProcessing", comments, {
            replaceStrings: [
                { search: /visibility/g, replace: "1." },
            ]
        });

        if (this.lighting.hasEndpoints) {
            state.compilationString += this._declareOutput(this.lighting, state) + ` = finalColor;\r\n`;
        }

        if (this.shadow.hasEndpoints) {
            state.compilationString += this._declareOutput(this.shadow, state) + ` = shadow;\r\n`;
        }

        state.compilationString += state._emitCodeFromInclude("pbrDebug", comments);

        return this;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        if (this.light) {
            serializationObject.lightId = this.light.id;
        }

        /*if (this.texture) {
            serializationObject.texture = this.texture.serialize();
        }*/

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        if (serializationObject.lightId) {
            this.light = scene.getLightByID(serializationObject.lightId);
        }

        /*if (serializationObject.texture) {
            rootUrl = serializationObject.texture.url.indexOf("data:") === 0 ? "" : rootUrl;
            if (serializationObject.texture.isCube) {
                this.texture = CubeTexture.Parse(serializationObject.texture, scene, rootUrl);
            } else {
                this.texture = Texture.Parse(serializationObject.texture, scene, rootUrl);
            }
        }*/
    }
}

_TypeStore.RegisteredTypes["BABYLON.PBRMetallicRoughnessBlock"] = PBRMetallicRoughnessBlock;