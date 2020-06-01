import { Nullable } from "babylonjs/types";
import { SerializationHelper } from "babylonjs/Misc/decorators";
import { Matrix } from "babylonjs/Maths/math.vector";
import { Color3 } from "babylonjs/Maths/math.color";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { IShadowLight } from "babylonjs/Lights/shadowLight";
import { IEffectCreationOptions } from "babylonjs/Materials/effect";
import { MaterialDefines } from "babylonjs/Materials/materialDefines";
import { MaterialHelper } from "babylonjs/Materials/materialHelper";
import { PushMaterial } from "babylonjs/Materials/pushMaterial";
import { VertexBuffer } from "babylonjs/Meshes/buffer";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { SubMesh } from "babylonjs/Meshes/subMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Scene } from "babylonjs/scene";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

import "./shadowOnly.fragment";
import "./shadowOnly.vertex";
import { EffectFallbacks } from 'babylonjs/Materials/effectFallbacks';
import { CascadedShadowGenerator } from 'babylonjs/Lights/Shadows/cascadedShadowGenerator';

class ShadowOnlyMaterialDefines extends MaterialDefines {
    public CLIPPLANE = false;
    public CLIPPLANE2 = false;
    public CLIPPLANE3 = false;
    public CLIPPLANE4 = false;
    public CLIPPLANE5 = false;
    public CLIPPLANE6 = false;
    public POINTSIZE = false;
    public FOG = false;
    public HIGH_DEFINITION_PIPELINE = false;
    public SCENE_MRT_COUNT = 0;
    public NORMAL = false;
    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0;
    public INSTANCES = false;

    constructor() {
        super();
        this.rebuild();
    }
}

export class ShadowOnlyMaterial extends PushMaterial {
    private _activeLight: IShadowLight;
    private _needAlphaBlending = true;

    constructor(name: string, scene: Scene) {
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
        for (var light of mesh.lightSources) {
            if (light.shadowEnabled) {
                return light as IShadowLight;
            }
        }
        return null;
    }

    // Methods
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        if (this.isFrozen) {
            if (subMesh.effect && subMesh.effect._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh._materialDefines) {
            subMesh._materialDefines = new ShadowOnlyMaterialDefines();
        }

        var defines = <ShadowOnlyMaterialDefines>subMesh._materialDefines;
        var scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        var engine = scene.getEngine();

        // Ensure that active light is the first shadow light
        if (this._activeLight) {
            for (var light of mesh.lightSources) {
                if (light.shadowEnabled) {
                    if (this._activeLight === light) {
                        break; // We are good
                    }

                    var lightPosition = mesh.lightSources.indexOf(this._activeLight);

                    if (lightPosition !== -1) {
                        mesh.lightSources.splice(lightPosition, 1);
                        mesh.lightSources.splice(0, 0, this._activeLight);
                    }
                    break;
                }
            }
        }

        MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances ? true : false);

        MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);

        // Deferred
        MaterialHelper.PrepareDefinesForDeferred(scene, defines);

        defines._needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, 1);

        const shadowGenerator = this._getFirstShadowLightForMesh(mesh)?.getShadowGenerator();

        this._needAlphaBlending = true;

        if (shadowGenerator && (shadowGenerator as any).getClassName && (shadowGenerator as any).getClassName() === 'CascadedShadowGenerator') {
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
            var fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }

            MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, 1);

            if (defines.NUM_BONE_INFLUENCERS > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }

            //Attributes
            var attribs = [VertexBuffer.PositionKind];

            if (defines.NORMAL) {
                attribs.push(VertexBuffer.NormalKind);
            }

            MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            MaterialHelper.PrepareAttributesForInstances(attribs, defines);

            var shaderName = "shadowOnly";
            var join = defines.toString();
            var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType",
                "vFogInfos", "vFogColor", "pointSize", "alpha", "shadowColor",
                "mBones",
                "vClipPlane", "vClipPlane2", "vClipPlane3", "vClipPlane4", "vClipPlane5", "vClipPlane6"
            ];
            var samplers = new Array<string>();

            var uniformBuffers = new Array<string>();

            MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: 1
            });

            subMesh.setEffect(scene.getEngine().createEffect(shaderName,
                <IEffectCreationOptions>{
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: join,
                    fallbacks: fallbacks,
                    onCompiled: this.onCompiled,
                    onError: this.onError,
                    indexParameters: { maxSimultaneousLights: 1 }
                }, engine), defines);
        }
        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        subMesh.effect._wasPreviouslyReady = true;

        return true;
    }

    public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        var scene = this.getScene();

        var defines = <ShadowOnlyMaterialDefines>subMesh._materialDefines;
        if (!defines) {
            return;
        }

        var effect = subMesh.effect;
        if (!effect) {
            return;
        }
        this._activeEffect = effect;

        // Matrices
        this.bindOnlyWorldMatrix(world);
        this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());

        // Bones
        MaterialHelper.BindBonesParameters(mesh, this._activeEffect);

        if (this._mustRebind(scene, effect)) {
            // Clip plane
            MaterialHelper.BindClipPlane(this._activeEffect, scene);

            // Point size
            if (this.pointsCloud) {
                this._activeEffect.setFloat("pointSize", this.pointSize);
            }

            this._activeEffect.setFloat("alpha", this.alpha);
            this._activeEffect.setColor3("shadowColor", this.shadowColor);

            MaterialHelper.BindEyePosition(effect, scene);
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
        if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE || defines["SHADOWCSM0"]) {
            this._activeEffect.setMatrix("view", scene.getViewMatrix());
        }

        // Fog
        MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);

        this._afterBind(mesh, this._activeEffect);
    }

    public clone(name: string): ShadowOnlyMaterial {
        return SerializationHelper.Clone<ShadowOnlyMaterial>(() => new ShadowOnlyMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this);
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

_TypeStore.RegisteredTypes["BABYLON.ShadowOnlyMaterial"] = ShadowOnlyMaterial;