/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import { SerializationHelper } from "core/Misc/decorators";
import type { Matrix } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { IShadowLight } from "core/Lights/shadowLight";
import type { IEffectCreationOptions } from "core/Materials/effect";
import { MaterialDefines } from "core/Materials/materialDefines";
import { MaterialHelper } from "core/Materials/materialHelper";
import { PushMaterial } from "core/Materials/pushMaterial";
import { VertexBuffer } from "core/Buffers/buffer";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { SubMesh } from "core/Meshes/subMesh";
import type { Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { RegisterClass } from "core/Misc/typeStore";

import "./shadowOnly.fragment";
import "./shadowOnly.vertex";
import { EffectFallbacks } from "core/Materials/effectFallbacks";
import type { CascadedShadowGenerator } from "core/Lights/Shadows/cascadedShadowGenerator";
import { addClipPlaneUniforms, bindClipPlane } from "core/Materials/clipPlaneMaterialHelper";

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

    constructor() {
        super();
        this.rebuild();
    }
}

export class ShadowOnlyMaterial extends PushMaterial {
    private _activeLight: IShadowLight;
    private _needAlphaBlending = true;

    constructor(name: string, scene?: Scene) {
        super(name, scene);
    }

    public shadowColor = Color3.Black();

    public needAlphaBlending(): boolean {
        return this._needAlphaBlending;
    }

    public needAlphaTesting(): boolean {
        return false;
    }

    public getAlphaTestTexture(): Nullable<BaseTexture> {
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
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        const drawWrapper = subMesh._drawWrapper;

        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }

        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new ShadowOnlyMaterialDefines();
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

        MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances ? true : false);

        MaterialHelper.PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);

        defines._needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, 1);

        const shadowGenerator = this._getFirstShadowLightForMesh(mesh)?.getShadowGenerator();

        this._needAlphaBlending = true;

        if (shadowGenerator && (shadowGenerator as any).getClassName && (shadowGenerator as any).getClassName() === "CascadedShadowGenerator") {
            const csg = shadowGenerator as CascadedShadowGenerator;

            this._needAlphaBlending = !csg.autoCalcDepthBounds;
        }

        // Attribs
        MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, true);

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();

            scene.resetCachedMaterial();

            // Fallbacks
            const fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }

            MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, 1);

            if (defines.NUM_BONE_INFLUENCERS > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }

            defines.IMAGEPROCESSINGPOSTPROCESS = scene.imageProcessingConfiguration.applyByPostProcess;

            //Attributes
            const attribs = [VertexBuffer.PositionKind];

            if (defines.NORMAL) {
                attribs.push(VertexBuffer.NormalKind);
            }

            MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            MaterialHelper.PrepareAttributesForInstances(attribs, defines);

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

            const uniformBuffers: string[] = [];

            addClipPlaneUniforms(uniforms);
            MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: 1,
            });

            subMesh.setEffect(
                scene.getEngine().createEffect(
                    shaderName,
                    <IEffectCreationOptions>{
                        attributes: attribs,
                        uniformsNames: uniforms,
                        uniformBuffersNames: uniformBuffers,
                        samplers: samplers,
                        defines: join,
                        fallbacks: fallbacks,
                        onCompiled: this.onCompiled,
                        onError: this.onError,
                        indexParameters: { maxSimultaneousLights: 1 },
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

    public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
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

        // Matrices
        this.bindOnlyWorldMatrix(world);
        this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());

        // Bones
        MaterialHelper.BindBonesParameters(mesh, this._activeEffect);

        if (this._mustRebind(scene, effect, subMesh)) {
            // Clip plane
            bindClipPlane(effect, this, scene);

            // Point size
            if (this.pointsCloud) {
                this._activeEffect.setFloat("pointSize", this.pointSize);
            }

            this._activeEffect.setFloat("alpha", this.alpha);
            this._activeEffect.setColor3("shadowColor", this.shadowColor);

            // Log. depth
            if (this._useLogarithmicDepth) {
                MaterialHelper.BindLogDepth(defines, effect, scene);
            }

            scene.bindEyePosition(effect);
        }

        // Lights
        if (scene.lightsEnabled) {
            MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, 1);

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
            this._activeEffect.setMatrix("view", scene.getViewMatrix());
        }

        // Fog
        MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);

        this._afterBind(mesh, this._activeEffect, subMesh);
    }

    public clone(name: string): ShadowOnlyMaterial {
        return SerializationHelper.Clone<ShadowOnlyMaterial>(() => new ShadowOnlyMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.ShadowOnlyMaterial";
        return serializationObject;
    }

    public getClassName(): string {
        return "ShadowOnlyMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): ShadowOnlyMaterial {
        return SerializationHelper.Parse(() => new ShadowOnlyMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.ShadowOnlyMaterial", ShadowOnlyMaterial);
