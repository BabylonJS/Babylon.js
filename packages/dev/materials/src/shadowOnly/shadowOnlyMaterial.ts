/* eslint-disable @typescript-eslint/naming-convention */
import { type Nullable } from "core/types";
import { SerializationHelper } from "core/Misc/decorators.serialization";
import { type Matrix } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type IShadowLight } from "core/Lights/shadowLight";
import { type IEffectCreationOptions } from "core/Materials/effect";
import { MaterialDefines } from "core/Materials/materialDefines";
import { MaterialPluginEvent } from "core/Materials/materialPluginEvent";
import { PushMaterial } from "core/Materials/pushMaterial";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import { VertexBuffer } from "core/Buffers/buffer";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type SubMesh } from "core/Meshes/subMesh";
import { type Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { RegisterClass } from "core/Misc/typeStore";
import { _ShaderImportLoader } from "core/Misc/shaderImportLoader";

import { EffectFallbacks } from "core/Materials/effectFallbacks";
import { type CascadedShadowGenerator } from "core/Lights/Shadows/cascadedShadowGenerator";
import { AddClipPlaneUniforms, BindClipPlane } from "core/Materials/clipPlaneMaterialHelper";
import {
    BindBonesParameters,
    BindFogParameters,
    BindLights,
    BindLogDepth,
    HandleFallbacksForShadows,
    PrepareAttributesForBones,
    PrepareAttributesForInstances,
    PrepareDefinesForAttributes,
    PrepareDefinesForFrameBoundValues,
    PrepareDefinesForLights,
    PrepareDefinesForMisc,
    PrepareUniformsAndSamplersList,
} from "core/Materials/materialHelper.functions";

class ShadowOnlyMaterialDefines extends MaterialDefines {
    public CLIPPLANE = false;
    public CLIPPLANE2 = false;
    public CLIPPLANE3 = false;
    public CLIPPLANE4 = false;
    public CLIPPLANE5 = false;
    public CLIPPLANE6 = false;
    public POINTSIZE = false;
    public FOG = false;
    public NORMAL = false;
    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0;
    public INSTANCES = false;
    public IMAGEPROCESSINGPOSTPROCESS = false;
    public SKIPFINALCOLORCLAMP = false;
    public LOGARITHMICDEPTH = false;

    constructor(externalProperties?: { [name: string]: { type: string; default: any } }) {
        super(externalProperties);
        this.rebuild();
    }
}

export class ShadowOnlyMaterial extends PushMaterial {
    private _activeLight: IShadowLight;
    private _needAlphaBlending = true;
    private static readonly _ShaderLoader = /*#__PURE__*/ new _ShaderImportLoader(
        () => [import("./shadowOnly.vertex"), import("./shadowOnly.fragment")],
        () => [import("./wgsl/shadowOnly.vertex"), import("./wgsl/shadowOnly.fragment")]
    );

    /**
     * Instantiates a ShadowOnly Material in the given scene
     * @param name The friendly name of the material
     * @param scene The scene to add the material to
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    constructor(name: string, scene?: Scene, forceGLSL = false) {
        super(name, scene, undefined, forceGLSL);
    }

    /**
     * @internal
     * Force the material uniform buffer into "no UBO" (individual uniform) mode so that any attached
     * material plugin (e.g. IBLShadowsPluginMaterial) binds its uniforms directly on the effect. This
     * lets ShadowOnlyMaterial host plugins without declaring a dedicated "Material" uniform block in its
     * shaders (its own uniforms - alpha/shadowColor/... - stay individual uniforms). This mirrors what the
     * base implementation already does on WebGPU ("leftovers UBO").
     */
    public override _createUniformBuffer(): void {
        this._uniformBuffer?.dispose();

        const engine = this.getScene().getEngine();
        this._uniformBuffer = new UniformBuffer(engine, undefined, undefined, this.name, true);
        if (engine.isWebGPU && !this._forceGLSL) {
            this._shaderLanguage = ShaderLanguage.WGSL;
        }

        this._uniformBufferLayoutBuilt = false;
    }

    public shadowColor = Color3.Black();

    public override needAlphaBlending(): boolean {
        return this._needAlphaBlending;
    }

    public override needAlphaTesting(): boolean {
        return false;
    }

    public override getAlphaTestTexture(): Nullable<BaseTexture> {
        return null;
    }

    public get activeLight(): IShadowLight {
        return this._activeLight;
    }

    public set activeLight(light: IShadowLight) {
        this._activeLight = light;
    }

    private _getFirstShadowLightForMesh(mesh: AbstractMesh): Nullable<IShadowLight> {
        for (const light of mesh.lightSources) {
            if (light.shadowEnabled) {
                return light as IShadowLight;
            }
        }
        return null;
    }

    // Methods
    public override isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        if (!this._uniformBufferLayoutBuilt) {
            this.buildUniformLayout();
        }

        const drawWrapper = subMesh._drawWrapper;

        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }

        if (!subMesh.materialDefines) {
            this._callbackPluginEventGeneric(MaterialPluginEvent.GetDefineNames, this._eventInfo);
            subMesh.materialDefines = new ShadowOnlyMaterialDefines(this._eventInfo.defineNames);
        }

        const defines = <ShadowOnlyMaterialDefines>subMesh.materialDefines;
        const scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        const engine = scene.getEngine();

        // Ensure that active light is the first shadow light
        if (this._activeLight) {
            for (const light of mesh.lightSources) {
                if (light.shadowEnabled) {
                    if (this._activeLight === light) {
                        break; // We are good
                    }

                    const lightPosition = mesh.lightSources.indexOf(this._activeLight);

                    if (lightPosition !== -1) {
                        mesh.lightSources.splice(lightPosition, 1);
                        mesh.lightSources.splice(0, 0, this._activeLight);
                    }
                    break;
                }
            }
        }

        PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances ? true : false);

        PrepareDefinesForMisc(
            mesh,
            scene,
            this._useLogarithmicDepth,
            this.pointsCloud,
            this.fogEnabled,
            this.needAlphaTestingForMesh(mesh),
            defines,
            undefined,
            undefined,
            undefined,
            this._isVertexOutputInvariant
        );

        defines._needNormals = PrepareDefinesForLights(scene, mesh, defines, false, 1);

        const shadowGenerator = this._getFirstShadowLightForMesh(mesh)?.getShadowGenerator();

        this._needAlphaBlending = true;

        if (shadowGenerator && (shadowGenerator as any).getClassName && (shadowGenerator as any).getClassName() === "CascadedShadowGenerator") {
            const csg = shadowGenerator as CascadedShadowGenerator;

            this._needAlphaBlending = !csg.autoCalcDepthBounds;
        }

        // External config
        this._eventInfo.defines = defines;
        this._eventInfo.mesh = mesh;
        this._callbackPluginEventPrepareDefinesBeforeAttributes(this._eventInfo);

        // Attribs
        PrepareDefinesForAttributes(mesh, defines, false, true);

        // External config
        this._callbackPluginEventPrepareDefines(this._eventInfo);

        // Plugin readiness
        this._eventInfo.isReadyForSubMesh = true;
        this._eventInfo.defines = defines;
        this._eventInfo.subMesh = subMesh;
        this._callbackPluginEventIsReadyForSubMesh(this._eventInfo);
        if (!this._eventInfo.isReadyForSubMesh) {
            return false;
        }

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();

            scene.resetCachedMaterial();

            // Fallbacks
            const fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }

            HandleFallbacksForShadows(defines, fallbacks, 1);

            if (defines.NUM_BONE_INFLUENCERS > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }

            defines.IMAGEPROCESSINGPOSTPROCESS = scene.imageProcessingConfiguration.applyByPostProcess;

            //Attributes
            const attribs = [VertexBuffer.PositionKind];

            if (defines.NORMAL) {
                attribs.push(VertexBuffer.NormalKind);
            }

            PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            PrepareAttributesForInstances(attribs, defines);

            const shaderName = "shadowOnly";
            const join = defines.toString();
            const uniforms = [
                "world",
                "view",
                "viewProjection",
                "vEyePosition",
                "vLightsType",
                "vFogInfos",
                "vFogColor",
                "pointSize",
                "alpha",
                "shadowColor",
                "mBones",
                "logarithmicDepthConstant",
            ];
            const samplers: string[] = [];

            const uniformBuffers: string[] = ["Scene", "Material"];

            const indexParameters = { maxSimultaneousLights: 1 };

            AddClipPlaneUniforms(uniforms);
            PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: 1,
                shaderLanguage: this._shaderLanguage,
            });

            // External config
            this._eventInfo.fallbacks = fallbacks;
            this._eventInfo.fallbackRank = 0;
            this._eventInfo.defines = defines;
            this._eventInfo.uniforms = uniforms;
            this._eventInfo.attributes = attribs;
            this._eventInfo.samplers = samplers;
            this._eventInfo.uniformBuffersNames = uniformBuffers;
            this._eventInfo.customCode = undefined;
            this._eventInfo.mesh = mesh;
            this._eventInfo.indexParameters = indexParameters;
            this._callbackPluginEventGeneric(MaterialPluginEvent.PrepareEffect, this._eventInfo);

            subMesh.setEffect(
                scene.getEngine().createEffect(
                    shaderName,
                    {
                        attributes: attribs,
                        uniformsNames: uniforms,
                        uniformBuffersNames: uniformBuffers,
                        samplers: samplers,
                        defines: join,
                        fallbacks: fallbacks,
                        onCompiled: this.onCompiled,
                        onError: this.onError,
                        indexParameters,
                        processCodeAfterIncludes: this._eventInfo.customCode,
                        shaderLanguage: this._shaderLanguage,
                        extraInitializationsAsync: ShadowOnlyMaterial._ShaderLoader.getLoadCallback(this._shaderLanguage),
                    },
                    engine
                ),
                defines,
                this._materialContext
            );
        }
        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = true;
        drawWrapper._wasPreviouslyUsingInstances = !!useInstances;

        return true;
    }

    public override bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        const scene = this.getScene();

        const defines = <ShadowOnlyMaterialDefines>subMesh.materialDefines;
        if (!defines) {
            return;
        }

        const effect = subMesh.effect;
        if (!effect) {
            return;
        }
        this._activeEffect = effect;

        // Binding unconditionally
        this._uniformBuffer.bindToEffect(effect, "Material");

        // Matrices
        this.bindOnlyWorldMatrix(world);
        this.bindViewProjection(effect);

        this._eventInfo.subMesh = subMesh;
        this._callbackPluginEventHardBindForSubMesh(this._eventInfo);

        // Bones
        BindBonesParameters(mesh, this._activeEffect);

        if (this._mustRebind(scene, effect, subMesh)) {
            // Clip plane
            BindClipPlane(effect, this, scene);

            // Point size
            if (this.pointsCloud) {
                this._activeEffect.setFloat("pointSize", this.pointSize);
            }

            this._activeEffect.setFloat("alpha", this.alpha);
            this._activeEffect.setColor3("shadowColor", this.shadowColor);

            // Log. depth
            if (this._useLogarithmicDepth) {
                BindLogDepth(defines, effect, scene);
            }

            scene.bindEyePosition(effect);

            this._eventInfo.subMesh = subMesh;
            this._callbackPluginEventBindForSubMesh(this._eventInfo);
        }

        // Lights
        if (scene.lightsEnabled) {
            BindLights(scene, mesh, this._activeEffect, defines, 1);

            const light = this._getFirstShadowLightForMesh(mesh);

            if (light) {
                // Make sure the uniforms for this light will be rebound for other materials using this light when rendering the current frame.
                // Indeed, there is an optimization in Light that binds the light uniforms only once per frame for a given light (if using ubo).
                // Doing this way assumes that all uses of this light are the same, meaning all parameters passed to Light._bindLlight
                // are the same, notably useSpecular. However, isReadyForSubMesh (see above) is passing false for this parameter, which may not be
                // the value the other materials may pass.
                light._renderId = -1;
            }
        }

        // View
        if ((scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) || defines["SHADOWCSM0"]) {
            this.bindView(effect);
        }

        // Fog
        BindFogParameters(scene, mesh, this._activeEffect);

        this._afterBind(mesh, this._activeEffect, subMesh);
        this._uniformBuffer.update();
    }

    public override clone(name: string): ShadowOnlyMaterial {
        return SerializationHelper.Clone<ShadowOnlyMaterial>(() => new ShadowOnlyMaterial(name, this.getScene()), this);
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.ShadowOnlyMaterial";
        return serializationObject;
    }

    public override getClassName(): string {
        return "ShadowOnlyMaterial";
    }

    // Statics
    public static override Parse(source: any, scene: Scene, rootUrl: string): ShadowOnlyMaterial {
        return SerializationHelper.Parse(() => new ShadowOnlyMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.ShadowOnlyMaterial", ShadowOnlyMaterial);
