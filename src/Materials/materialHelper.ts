import { Logger } from "../Misc/logger";
import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { Scene } from "../scene";
import { Engine } from "../Engines/engine";
import { EngineStore } from "../Engines/engineStore";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { VertexBuffer } from "../Meshes/buffer";
import { Light } from "../Lights/light";

import { UniformBuffer } from "./uniformBuffer";
import { Effect, IEffectCreationOptions } from "./effect";
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { WebVRFreeCamera } from '../Cameras/VR/webVRCamera';
import { MaterialDefines } from "./materialDefines";
import { Color3 } from '../Maths/math.color';
import { EffectFallbacks } from './effectFallbacks';
import { ThinMaterialHelper } from './thinMaterialHelper';

/**
 * "Static Class" containing the most commonly used helper while dealing with material for rendering purpose.
 *
 * It contains the basic tools to help defining defines, binding uniform for the common part of the materials.
 *
 * This works by convention in BabylonJS but is meant to be use only with shader following the in place naming rules and conventions.
 */
export class MaterialHelper {

    /**
     * Bind the current view position to an effect.
     * @param effect The effect to be bound
     * @param scene The scene the eyes position is used from
     * @param variableName name of the shader variable that will hold the eye position
     */
    public static BindEyePosition(effect: Effect, scene: Scene, variableName = "vEyePosition"): void {
        if (scene._forcedViewPosition) {
            effect.setVector3(variableName, scene._forcedViewPosition);
            return;
        }
        var globalPosition = scene.activeCamera!.globalPosition;
        if (!globalPosition) {
            // Use WebVRFreecamera's device position as global position is not it's actual position in babylon space
            globalPosition = (scene.activeCamera! as WebVRFreeCamera).devicePosition;
        }
        effect.setVector3(variableName, scene._mirroredCameraPosition ? scene._mirroredCameraPosition : globalPosition);
    }

    /**
     * Helps preparing the defines values about the UVs in used in the effect.
     * UVs are shared as much as we can accross channels in the shaders.
     * @param texture The texture we are preparing the UVs for
     * @param defines The defines to update
     * @param key The channel key "diffuse", "specular"... used in the shader
     */
    public static PrepareDefinesForMergedUV(texture: BaseTexture, defines: any, key: string): void {
        defines._needUVs = true;
        defines[key] = true;
        if (texture.getTextureMatrix().isIdentityAs3x2()) {
            defines[key + "DIRECTUV"] = texture.coordinatesIndex + 1;
            if (texture.coordinatesIndex === 0) {
                defines["MAINUV1"] = true;
            } else {
                defines["MAINUV2"] = true;
            }
        } else {
            defines[key + "DIRECTUV"] = 0;
        }
    }

    /**
     * Binds a texture matrix value to its corrsponding uniform
     * @param texture The texture to bind the matrix for
     * @param uniformBuffer The uniform buffer receivin the data
     * @param key The channel key "diffuse", "specular"... used in the shader
     */
    public static BindTextureMatrix(texture: BaseTexture, uniformBuffer: UniformBuffer, key: string): void {
        var matrix = texture.getTextureMatrix();

        uniformBuffer.updateMatrix(key + "Matrix", matrix);
    }

    /**
     * Gets the current status of the fog (should it be enabled?)
     * @param mesh defines the mesh to evaluate for fog support
     * @param scene defines the hosting scene
     * @returns true if fog must be enabled
     */
    public static GetFogState(mesh: AbstractMesh, scene: Scene) {
        return (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE);
    }

    /**
     * Helper used to prepare the list of defines associated with misc. values for shader compilation
     * @param mesh defines the current mesh
     * @param scene defines the current scene
     * @param useLogarithmicDepth defines if logarithmic depth has to be turned on
     * @param pointsCloud defines if point cloud rendering has to be turned on
     * @param fogEnabled defines if fog has to be turned on
     * @param alphaTest defines if alpha testing has to be turned on
     * @param defines defines the current list of defines
     */
    public static PrepareDefinesForMisc(mesh: AbstractMesh, scene: Scene, useLogarithmicDepth: boolean, pointsCloud: boolean, fogEnabled: boolean, alphaTest: boolean, defines: any): void {
        if (defines._areMiscDirty) {
            defines["LOGARITHMICDEPTH"] = useLogarithmicDepth;
            defines["POINTSIZE"] = pointsCloud;
            defines["FOG"] = fogEnabled && this.GetFogState(mesh, scene);
            defines["NONUNIFORMSCALING"] = mesh.nonUniformScaling;
            defines["ALPHATEST"] = alphaTest;
        }
    }

    /**
     * Helper used to prepare the list of defines associated with frame values for shader compilation
     * @param scene defines the current scene
     * @param engine defines the current engine
     * @param defines specifies the list of active defines
     * @param useInstances defines if instances have to be turned on
     * @param useClipPlane defines if clip plane have to be turned on
     * @param useInstances defines if instances have to be turned on
     * @param useThinInstances defines if thin instances have to be turned on
     */
    public static PrepareDefinesForFrameBoundValues(scene: Scene, engine: Engine, defines: any, useInstances: boolean, useClipPlane: Nullable<boolean> = null, useThinInstances: boolean = false): void {
        var changed = false;
        let useClipPlane1 = false;
        let useClipPlane2 = false;
        let useClipPlane3 = false;
        let useClipPlane4 = false;
        let useClipPlane5 = false;
        let useClipPlane6 = false;

        useClipPlane1 = useClipPlane == null ? (scene.clipPlane !== undefined && scene.clipPlane !== null) : useClipPlane;
        useClipPlane2 = useClipPlane == null ? (scene.clipPlane2 !== undefined && scene.clipPlane2 !== null) : useClipPlane;
        useClipPlane3 = useClipPlane == null ? (scene.clipPlane3 !== undefined && scene.clipPlane3 !== null) : useClipPlane;
        useClipPlane4 = useClipPlane == null ? (scene.clipPlane4 !== undefined && scene.clipPlane4 !== null) : useClipPlane;
        useClipPlane5 = useClipPlane == null ? (scene.clipPlane5 !== undefined && scene.clipPlane5 !== null) : useClipPlane;
        useClipPlane6 = useClipPlane == null ? (scene.clipPlane6 !== undefined && scene.clipPlane6 !== null) : useClipPlane;

        if (defines["CLIPPLANE"] !== useClipPlane1) {
            defines["CLIPPLANE"] = useClipPlane1;
            changed = true;
        }

        if (defines["CLIPPLANE2"] !== useClipPlane2) {
            defines["CLIPPLANE2"] = useClipPlane2;
            changed = true;
        }

        if (defines["CLIPPLANE3"] !== useClipPlane3) {
            defines["CLIPPLANE3"] = useClipPlane3;
            changed = true;
        }

        if (defines["CLIPPLANE4"] !== useClipPlane4) {
            defines["CLIPPLANE4"] = useClipPlane4;
            changed = true;
        }

        if (defines["CLIPPLANE5"] !== useClipPlane5) {
            defines["CLIPPLANE5"] = useClipPlane5;
            changed = true;
        }

        if (defines["CLIPPLANE6"] !== useClipPlane6) {
            defines["CLIPPLANE6"] = useClipPlane6;
            changed = true;
        }

        if (defines["DEPTHPREPASS"] !== !engine.getColorWrite()) {
            defines["DEPTHPREPASS"] = !defines["DEPTHPREPASS"];
            changed = true;
        }

        if (defines["INSTANCES"] !== useInstances) {
            defines["INSTANCES"] = useInstances;
            changed = true;
        }

        if (defines["THIN_INSTANCES"] !== useThinInstances) {
            defines["THIN_INSTANCES"] = useThinInstances;
            changed = true;
        }

        if (changed) {
            defines.markAsUnprocessed();
        }
    }

    /**
     * Prepares the defines for bones
     * @param mesh The mesh containing the geometry data we will draw
     * @param defines The defines to update
     */
    public static PrepareDefinesForBones(mesh: AbstractMesh, defines: any) {
        if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
            defines["NUM_BONE_INFLUENCERS"] = mesh.numBoneInfluencers;

            const materialSupportsBoneTexture = defines["BONETEXTURE"] !== undefined;

            if (mesh.skeleton.isUsingTextureForMatrices && materialSupportsBoneTexture) {
                defines["BONETEXTURE"] = true;
            } else {
                defines["BonesPerMesh"] = (mesh.skeleton.bones.length + 1);
                defines["BONETEXTURE"] = materialSupportsBoneTexture ? false : undefined;
            }
        } else {
            defines["NUM_BONE_INFLUENCERS"] = 0;
            defines["BonesPerMesh"] = 0;
        }
    }

    /**
     * Prepares the defines for morph targets
     * @param mesh The mesh containing the geometry data we will draw
     * @param defines The defines to update
     */
    public static PrepareDefinesForMorphTargets(mesh: AbstractMesh, defines: any) {
        var manager = (<Mesh>mesh).morphTargetManager;
        if (manager) {
            defines["MORPHTARGETS_UV"] = manager.supportsUVs && defines["UV1"];
            defines["MORPHTARGETS_TANGENT"] = manager.supportsTangents && defines["TANGENT"];
            defines["MORPHTARGETS_NORMAL"] = manager.supportsNormals && defines["NORMAL"];
            defines["MORPHTARGETS"] = (manager.numInfluencers > 0);
            defines["NUM_MORPH_INFLUENCERS"] = manager.numInfluencers;
        } else {
            defines["MORPHTARGETS_UV"] = false;
            defines["MORPHTARGETS_TANGENT"] = false;
            defines["MORPHTARGETS_NORMAL"] = false;
            defines["MORPHTARGETS"] = false;
            defines["NUM_MORPH_INFLUENCERS"] = 0;
        }
    }

    /**
     * Prepares the defines used in the shader depending on the attributes data available in the mesh
     * @param mesh The mesh containing the geometry data we will draw
     * @param defines The defines to update
     * @param useVertexColor Precise whether vertex colors should be used or not (override mesh info)
     * @param useBones Precise whether bones should be used or not (override mesh info)
     * @param useMorphTargets Precise whether morph targets should be used or not (override mesh info)
     * @param useVertexAlpha Precise whether vertex alpha should be used or not (override mesh info)
     * @returns false if defines are considered not dirty and have not been checked
     */
    public static PrepareDefinesForAttributes(mesh: AbstractMesh, defines: any, useVertexColor: boolean, useBones: boolean, useMorphTargets = false, useVertexAlpha = true): boolean {
        if (!defines._areAttributesDirty && defines._needNormals === defines._normals && defines._needUVs === defines._uvs) {
            return false;
        }

        defines._normals = defines._needNormals;
        defines._uvs = defines._needUVs;

        defines["NORMAL"] = (defines._needNormals && mesh.isVerticesDataPresent(VertexBuffer.NormalKind));

        if (defines._needNormals && mesh.isVerticesDataPresent(VertexBuffer.TangentKind)) {
            defines["TANGENT"] = true;
        }

        if (defines._needUVs) {
            defines["UV1"] = mesh.isVerticesDataPresent(VertexBuffer.UVKind);
            defines["UV2"] = mesh.isVerticesDataPresent(VertexBuffer.UV2Kind);
        } else {
            defines["UV1"] = false;
            defines["UV2"] = false;
        }

        if (useVertexColor) {
            var hasVertexColors = mesh.useVertexColors && mesh.isVerticesDataPresent(VertexBuffer.ColorKind);
            defines["VERTEXCOLOR"] = hasVertexColors;
            defines["VERTEXALPHA"] = mesh.hasVertexAlpha && hasVertexColors && useVertexAlpha;
        }

        if (useBones) {
            this.PrepareDefinesForBones(mesh, defines);
        }

        if (useMorphTargets) {
            this.PrepareDefinesForMorphTargets(mesh, defines);
        }

        return true;
    }

    /**
     * Prepares the defines related to multiview
     * @param scene The scene we are intending to draw
     * @param defines The defines to update
     */
    public static PrepareDefinesForMultiview(scene: Scene, defines: any) {
        if (scene.activeCamera) {
            var previousMultiview = defines.MULTIVIEW;
            defines.MULTIVIEW = (scene.activeCamera.outputRenderTarget !== null && scene.activeCamera.outputRenderTarget.getViewCount() > 1);
            if (defines.MULTIVIEW != previousMultiview) {
                defines.markAsUnprocessed();
            }
        }
    }

    /**
     * Prepares the defines related to the prepass
     * @param scene The scene we are intending to draw
     * @param defines The defines to update
     * @param canRenderToMRT Indicates if this material renders to several textures in the prepass
     */
    public static PrepareDefinesForPrePass(scene: Scene, defines: any, canRenderToMRT: boolean) {
        var previousPrePass = defines.PREPASS;

        if (scene.prePassRenderer && canRenderToMRT) {
            defines.PREPASS = true;
            defines.SCENE_MRT_COUNT = scene.prePassRenderer.mrtCount;
        } else {
            defines.PREPASS = false;
        }

        if (defines.PREPASS != previousPrePass) {
            defines.markAsUnprocessed();
            defines.markAsImageProcessingDirty();
        }
    }

    /**
     * Prepares the defines related to the light information passed in parameter
     * @param scene The scene we are intending to draw
     * @param mesh The mesh the effect is compiling for
     * @param light The light the effect is compiling for
     * @param lightIndex The index of the light
     * @param defines The defines to update
     * @param specularSupported Specifies whether specular is supported or not (override lights data)
     * @param state Defines the current state regarding what is needed (normals, etc...)
     */
    public static PrepareDefinesForLight(scene: Scene, mesh: AbstractMesh, light: Light, lightIndex: number, defines: any, specularSupported: boolean, state: {
        needNormals: boolean,
        needRebuild: boolean,
        shadowEnabled: boolean,
        specularEnabled: boolean,
        lightmapMode: boolean
    }) {
        state.needNormals = true;

        if (defines["LIGHT" + lightIndex] === undefined) {
            state.needRebuild = true;
        }

        defines["LIGHT" + lightIndex] = true;

        defines["SPOTLIGHT" + lightIndex] = false;
        defines["HEMILIGHT" + lightIndex] = false;
        defines["POINTLIGHT" + lightIndex] = false;
        defines["DIRLIGHT" + lightIndex] = false;

        light.prepareLightSpecificDefines(defines, lightIndex);

        // FallOff.
        defines["LIGHT_FALLOFF_PHYSICAL" + lightIndex] = false;
        defines["LIGHT_FALLOFF_GLTF" + lightIndex] = false;
        defines["LIGHT_FALLOFF_STANDARD" + lightIndex] = false;

        switch (light.falloffType) {
            case Light.FALLOFF_GLTF:
                defines["LIGHT_FALLOFF_GLTF" + lightIndex] = true;
                break;
            case Light.FALLOFF_PHYSICAL:
                defines["LIGHT_FALLOFF_PHYSICAL" + lightIndex] = true;
                break;
            case Light.FALLOFF_STANDARD:
                defines["LIGHT_FALLOFF_STANDARD" + lightIndex] = true;
                break;
        }

        // Specular
        if (specularSupported && !light.specular.equalsFloats(0, 0, 0)) {
            state.specularEnabled = true;
        }

        // Shadows
        defines["SHADOW" + lightIndex] = false;
        defines["SHADOWCSM" + lightIndex] = false;
        defines["SHADOWCSMDEBUG" + lightIndex] = false;
        defines["SHADOWCSMNUM_CASCADES" + lightIndex] = false;
        defines["SHADOWCSMUSESHADOWMAXZ" + lightIndex] = false;
        defines["SHADOWCSMNOBLEND" + lightIndex] = false;
        defines["SHADOWCSM_RIGHTHANDED" + lightIndex] = false;
        defines["SHADOWPCF" + lightIndex] = false;
        defines["SHADOWPCSS" + lightIndex] = false;
        defines["SHADOWPOISSON" + lightIndex] = false;
        defines["SHADOWESM" + lightIndex] = false;
        defines["SHADOWCUBE" + lightIndex] = false;
        defines["SHADOWLOWQUALITY" + lightIndex] = false;
        defines["SHADOWMEDIUMQUALITY" + lightIndex] = false;

        if (mesh && mesh.receiveShadows && scene.shadowsEnabled && light.shadowEnabled) {
            var shadowGenerator = light.getShadowGenerator();
            if (shadowGenerator) {
                const shadowMap = shadowGenerator.getShadowMap();
                if (shadowMap) {
                    if (shadowMap.renderList && shadowMap.renderList.length > 0) {
                        state.shadowEnabled = true;
                        shadowGenerator.prepareDefines(defines, lightIndex);
                    }
                }
            }
        }

        if (light.lightmapMode != Light.LIGHTMAP_DEFAULT) {
            state.lightmapMode = true;
            defines["LIGHTMAPEXCLUDED" + lightIndex] = true;
            defines["LIGHTMAPNOSPECULAR" + lightIndex] = (light.lightmapMode == Light.LIGHTMAP_SHADOWSONLY);
        } else {
            defines["LIGHTMAPEXCLUDED" + lightIndex] = false;
            defines["LIGHTMAPNOSPECULAR" + lightIndex] = false;
        }
    }

    /**
     * Prepares the defines related to the light information passed in parameter
     * @param scene The scene we are intending to draw
     * @param mesh The mesh the effect is compiling for
     * @param defines The defines to update
     * @param specularSupported Specifies whether specular is supported or not (override lights data)
     * @param maxSimultaneousLights Specfies how manuy lights can be added to the effect at max
     * @param disableLighting Specifies whether the lighting is disabled (override scene and light)
     * @returns true if normals will be required for the rest of the effect
     */
    public static PrepareDefinesForLights(scene: Scene, mesh: AbstractMesh, defines: any, specularSupported: boolean, maxSimultaneousLights = 4, disableLighting = false): boolean {
        if (!defines._areLightsDirty) {
            return defines._needNormals;
        }

        var lightIndex = 0;
        let state = {
            needNormals: false,
            needRebuild: false,
            lightmapMode: false,
            shadowEnabled: false,
            specularEnabled: false
        };

        if (scene.lightsEnabled && !disableLighting) {
            for (var light of mesh.lightSources) {
                this.PrepareDefinesForLight(scene, mesh, light, lightIndex, defines, specularSupported, state);

                lightIndex++;
                if (lightIndex === maxSimultaneousLights) {
                    break;
                }
            }
        }

        defines["SPECULARTERM"] = state.specularEnabled;
        defines["SHADOWS"] = state.shadowEnabled;

        // Resetting all other lights if any
        for (var index = lightIndex; index < maxSimultaneousLights; index++) {
            if (defines["LIGHT" + index] !== undefined) {
                defines["LIGHT" + index] = false;
                defines["HEMILIGHT" + index] = false;
                defines["POINTLIGHT" + index] = false;
                defines["DIRLIGHT" + index] = false;
                defines["SPOTLIGHT" + index] = false;
                defines["SHADOW" + index] = false;
                defines["SHADOWCSM" + index] = false;
                defines["SHADOWCSMDEBUG" + index] = false;
                defines["SHADOWCSMNUM_CASCADES" + index] = false;
                defines["SHADOWCSMUSESHADOWMAXZ" + index] = false;
                defines["SHADOWCSMNOBLEND" + index] = false;
                defines["SHADOWCSM_RIGHTHANDED" + index] = false;
                defines["SHADOWPCF" + index] = false;
                defines["SHADOWPCSS" + index] = false;
                defines["SHADOWPOISSON" + index] = false;
                defines["SHADOWESM" + index] = false;
                defines["SHADOWCUBE" + index] = false;
                defines["SHADOWLOWQUALITY" + index] = false;
                defines["SHADOWMEDIUMQUALITY" + index] = false;
            }
        }

        let caps = scene.getEngine().getCaps();

        if (defines["SHADOWFLOAT"] === undefined) {
            state.needRebuild = true;
        }

        defines["SHADOWFLOAT"] = state.shadowEnabled &&
            ((caps.textureFloatRender && caps.textureFloatLinearFiltering) ||
                (caps.textureHalfFloatRender && caps.textureHalfFloatLinearFiltering));
        defines["LIGHTMAPEXCLUDED"] = state.lightmapMode;

        if (state.needRebuild) {
            defines.rebuild();
        }

        return state.needNormals;
    }

    /**
     * Prepares the uniforms and samplers list to be used in the effect (for a specific light)
     * @param lightIndex defines the light index
     * @param uniformsList The uniform list
     * @param samplersList The sampler list
     * @param projectedLightTexture defines if projected texture must be used
     * @param uniformBuffersList defines an optional list of uniform buffers
     */
    public static PrepareUniformsAndSamplersForLight(lightIndex: number, uniformsList: string[], samplersList: string[], projectedLightTexture?: any, uniformBuffersList: Nullable<string[]> = null) {
        uniformsList.push(
            "vLightData" + lightIndex,
            "vLightDiffuse" + lightIndex,
            "vLightSpecular" + lightIndex,
            "vLightDirection" + lightIndex,
            "vLightFalloff" + lightIndex,
            "vLightGround" + lightIndex,
            "lightMatrix" + lightIndex,
            "shadowsInfo" + lightIndex,
            "depthValues" + lightIndex,
        );

        if (uniformBuffersList) {
            uniformBuffersList.push("Light" + lightIndex);
        }

        samplersList.push("shadowSampler" + lightIndex);
        samplersList.push("depthSampler" + lightIndex);

        uniformsList.push(
            "viewFrustumZ" + lightIndex,
            "cascadeBlendFactor" + lightIndex,
            "lightSizeUVCorrection" + lightIndex,
            "depthCorrection" + lightIndex,
            "penumbraDarkness" + lightIndex,
            "frustumLengths" + lightIndex,
        );

        if (projectedLightTexture) {
            samplersList.push("projectionLightSampler" + lightIndex);
            uniformsList.push(
                "textureProjectionMatrix" + lightIndex,
            );
        }
    }

    /**
     * Prepares the uniforms and samplers list to be used in the effect
     * @param uniformsListOrOptions The uniform names to prepare or an EffectCreationOptions containing the liist and extra information
     * @param samplersList The sampler list
     * @param defines The defines helping in the list generation
     * @param maxSimultaneousLights The maximum number of simultanous light allowed in the effect
     */
    public static PrepareUniformsAndSamplersList(uniformsListOrOptions: string[] | IEffectCreationOptions, samplersList?: string[], defines?: any, maxSimultaneousLights = 4): void {
        let uniformsList: string[];
        let uniformBuffersList: Nullable<string[]> = null;

        if ((<IEffectCreationOptions>uniformsListOrOptions).uniformsNames) {
            var options = <IEffectCreationOptions>uniformsListOrOptions;
            uniformsList = options.uniformsNames;
            uniformBuffersList = options.uniformBuffersNames;
            samplersList = options.samplers;
            defines = options.defines;
            maxSimultaneousLights = options.maxSimultaneousLights || 0;
        } else {
            uniformsList = <string[]>uniformsListOrOptions;
            if (!samplersList) {
                samplersList = [];
            }
        }

        for (var lightIndex = 0; lightIndex < maxSimultaneousLights; lightIndex++) {
            if (!defines["LIGHT" + lightIndex]) {
                break;
            }
            this.PrepareUniformsAndSamplersForLight(lightIndex, uniformsList, samplersList, defines["PROJECTEDLIGHTTEXTURE" + lightIndex], uniformBuffersList);
        }

        if (defines["NUM_MORPH_INFLUENCERS"]) {
            uniformsList.push("morphTargetInfluences");
        }
    }

    /**
     * This helps decreasing rank by rank the shadow quality (0 being the highest rank and quality)
     * @param defines The defines to update while falling back
     * @param fallbacks The authorized effect fallbacks
     * @param maxSimultaneousLights The maximum number of lights allowed
     * @param rank the current rank of the Effect
     * @returns The newly affected rank
     */
    public static HandleFallbacksForShadows(defines: any, fallbacks: EffectFallbacks, maxSimultaneousLights = 4, rank = 0): number {
        let lightFallbackRank = 0;
        for (var lightIndex = 0; lightIndex < maxSimultaneousLights; lightIndex++) {
            if (!defines["LIGHT" + lightIndex]) {
                break;
            }

            if (lightIndex > 0) {
                lightFallbackRank = rank + lightIndex;
                fallbacks.addFallback(lightFallbackRank, "LIGHT" + lightIndex);
            }

            if (!defines["SHADOWS"]) {
                if (defines["SHADOW" + lightIndex]) {
                    fallbacks.addFallback(rank, "SHADOW" + lightIndex);
                }

                if (defines["SHADOWPCF" + lightIndex]) {
                    fallbacks.addFallback(rank, "SHADOWPCF" + lightIndex);
                }

                if (defines["SHADOWPCSS" + lightIndex]) {
                    fallbacks.addFallback(rank, "SHADOWPCSS" + lightIndex);
                }

                if (defines["SHADOWPOISSON" + lightIndex]) {
                    fallbacks.addFallback(rank, "SHADOWPOISSON" + lightIndex);
                }

                if (defines["SHADOWESM" + lightIndex]) {
                    fallbacks.addFallback(rank, "SHADOWESM" + lightIndex);
                }
            }
        }
        return lightFallbackRank++;
    }

    private static _TmpMorphInfluencers = { "NUM_MORPH_INFLUENCERS": 0 };
    /**
     * Prepares the list of attributes required for morph targets according to the effect defines.
     * @param attribs The current list of supported attribs
     * @param mesh The mesh to prepare the morph targets attributes for
     * @param influencers The number of influencers
     */
    public static PrepareAttributesForMorphTargetsInfluencers(attribs: string[], mesh: AbstractMesh, influencers: number): void {
        this._TmpMorphInfluencers.NUM_MORPH_INFLUENCERS = influencers;
        this.PrepareAttributesForMorphTargets(attribs, mesh, this._TmpMorphInfluencers);
    }

    /**
     * Prepares the list of attributes required for morph targets according to the effect defines.
     * @param attribs The current list of supported attribs
     * @param mesh The mesh to prepare the morph targets attributes for
     * @param defines The current Defines of the effect
     */
    public static PrepareAttributesForMorphTargets(attribs: string[], mesh: AbstractMesh, defines: any): void {
        var influencers = defines["NUM_MORPH_INFLUENCERS"];

        if (influencers > 0 && EngineStore.LastCreatedEngine) {
            var maxAttributesCount = EngineStore.LastCreatedEngine.getCaps().maxVertexAttribs;
            var manager = (<Mesh>mesh).morphTargetManager;
            var normal = manager && manager.supportsNormals && defines["NORMAL"];
            var tangent = manager && manager.supportsTangents && defines["TANGENT"];
            var uv = manager && manager.supportsUVs && defines["UV1"];
            for (var index = 0; index < influencers; index++) {
                attribs.push(VertexBuffer.PositionKind + index);

                if (normal) {
                    attribs.push(VertexBuffer.NormalKind + index);
                }

                if (tangent) {
                    attribs.push(VertexBuffer.TangentKind + index);
                }

                if (uv) {
                    attribs.push(VertexBuffer.UVKind + "_" + index);
                }

                if (attribs.length > maxAttributesCount) {
                    Logger.Error("Cannot add more vertex attributes for mesh " + mesh.name);
                }
            }
        }
    }

    /**
     * Prepares the list of attributes required for bones according to the effect defines.
     * @param attribs The current list of supported attribs
     * @param mesh The mesh to prepare the bones attributes for
     * @param defines The current Defines of the effect
     * @param fallbacks The current efffect fallback strategy
     */
    public static PrepareAttributesForBones(attribs: string[], mesh: AbstractMesh, defines: any, fallbacks: EffectFallbacks): void {
        if (defines["NUM_BONE_INFLUENCERS"] > 0) {
            fallbacks.addCPUSkinningFallback(0, mesh);

            attribs.push(VertexBuffer.MatricesIndicesKind);
            attribs.push(VertexBuffer.MatricesWeightsKind);
            if (defines["NUM_BONE_INFLUENCERS"] > 4) {
                attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                attribs.push(VertexBuffer.MatricesWeightsExtraKind);
            }
        }
    }

    /**
     * Check and prepare the list of attributes required for instances according to the effect defines.
     * @param attribs The current list of supported attribs
     * @param defines The current MaterialDefines of the effect
     */
    public static PrepareAttributesForInstances(attribs: string[], defines: MaterialDefines): void {
        if (defines["INSTANCES"] || defines["THIN_INSTANCES"]) {
            this.PushAttributesForInstances(attribs);
        }
    }

    /**
     * Add the list of attributes required for instances to the attribs array.
     * @param attribs The current list of supported attribs
     */
    public static PushAttributesForInstances(attribs: string[]): void {
        attribs.push("world0");
        attribs.push("world1");
        attribs.push("world2");
        attribs.push("world3");
    }

    /**
     * Binds the light information to the effect.
     * @param light The light containing the generator
     * @param effect The effect we are binding the data to
     * @param lightIndex The light index in the effect used to render
     */
    public static BindLightProperties(light: Light, effect: Effect, lightIndex: number): void {
        light.transferToEffect(effect, lightIndex + "");
    }

    /**
     * Binds the lights information from the scene to the effect for the given mesh.
     * @param light Light to bind
     * @param lightIndex Light index
     * @param scene The scene where the light belongs to
     * @param effect The effect we are binding the data to
     * @param useSpecular Defines if specular is supported
     * @param rebuildInParallel Specifies whether the shader is rebuilding in parallel
     */
    public static BindLight(light: Light, lightIndex: number, scene: Scene, effect: Effect, useSpecular: boolean, rebuildInParallel = false): void {
        light._bindLight(lightIndex, scene, effect, useSpecular, rebuildInParallel);
    }

    /**
     * Binds the lights information from the scene to the effect for the given mesh.
     * @param scene The scene the lights belongs to
     * @param mesh The mesh we are binding the information to render
     * @param effect The effect we are binding the data to
     * @param defines The generated defines for the effect
     * @param maxSimultaneousLights The maximum number of light that can be bound to the effect
     * @param rebuildInParallel Specifies whether the shader is rebuilding in parallel
     */
    public static BindLights(scene: Scene, mesh: AbstractMesh, effect: Effect, defines: any, maxSimultaneousLights = 4, rebuildInParallel = false): void {
        let len = Math.min(mesh.lightSources.length, maxSimultaneousLights);

        for (var i = 0; i < len; i++) {

            let light = mesh.lightSources[i];
            this.BindLight(light, i, scene, effect, typeof defines === "boolean" ? defines : defines["SPECULARTERM"], rebuildInParallel);
        }
    }

    private static _tempFogColor = Color3.Black();
    /**
     * Binds the fog information from the scene to the effect for the given mesh.
     * @param scene The scene the lights belongs to
     * @param mesh The mesh we are binding the information to render
     * @param effect The effect we are binding the data to
     * @param linearSpace Defines if the fog effect is applied in linear space
     */
    public static BindFogParameters(scene: Scene, mesh: AbstractMesh, effect: Effect, linearSpace = false): void {
        if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
            effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
            // Convert fog color to linear space if used in a linear space computed shader.
            if (linearSpace) {
                scene.fogColor.toLinearSpaceToRef(this._tempFogColor);
                effect.setColor3("vFogColor", this._tempFogColor);
            }
            else {
                effect.setColor3("vFogColor", scene.fogColor);
            }
        }
    }

    /**
     * Binds the bones information from the mesh to the effect.
     * @param mesh The mesh we are binding the information to render
     * @param effect The effect we are binding the data to
     */
    public static BindBonesParameters(mesh?: AbstractMesh, effect?: Effect): void {
        if (!effect || !mesh) {
            return;
        }
        if (mesh.computeBonesUsingShaders && effect._bonesComputationForcedToCPU) {
            mesh.computeBonesUsingShaders = false;
        }

        if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
            const skeleton = mesh.skeleton;

            if (skeleton.isUsingTextureForMatrices && effect.getUniformIndex("boneTextureWidth") > -1) {
                const boneTexture = skeleton.getTransformMatrixTexture(mesh);
                effect.setTexture("boneSampler", boneTexture);
                effect.setFloat("boneTextureWidth", 4.0 * (skeleton.bones.length + 1));
            } else {
                const matrices = skeleton.getTransformMatrices(mesh);

                if (matrices) {
                    effect.setMatrices("mBones", matrices);
                }
            }
        }
    }

    /**
     * Binds the morph targets information from the mesh to the effect.
     * @param abstractMesh The mesh we are binding the information to render
     * @param effect The effect we are binding the data to
     */
    public static BindMorphTargetParameters(abstractMesh: AbstractMesh, effect: Effect): void {
        let manager = (<Mesh>abstractMesh).morphTargetManager;
        if (!abstractMesh || !manager) {
            return;
        }

        effect.setFloatArray("morphTargetInfluences", manager.influences);
    }

    /**
     * Binds the logarithmic depth information from the scene to the effect for the given defines.
     * @param defines The generated defines used in the effect
     * @param effect The effect we are binding the data to
     * @param scene The scene we are willing to render with logarithmic scale for
     */
    public static BindLogDepth(defines: any, effect: Effect, scene: Scene): void {
        if (defines["LOGARITHMICDEPTH"]) {
            effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log((<Camera>scene.activeCamera).maxZ + 1.0) / Math.LN2));
        }
    }

    /**
     * Binds the clip plane information from the scene to the effect.
     * @param scene The scene the clip plane information are extracted from
     * @param effect The effect we are binding the data to
     */
    public static BindClipPlane(effect: Effect, scene: Scene): void {
        ThinMaterialHelper.BindClipPlane(effect, scene);
    }
}
