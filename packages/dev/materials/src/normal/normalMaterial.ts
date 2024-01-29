/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import { serializeAsTexture, serialize, expandToProperty, serializeAsColor3, SerializationHelper } from "core/Misc/decorators";
import type { Matrix } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import type { IAnimatable } from "core/Animations/animatable.interface";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { IEffectCreationOptions } from "core/Materials/effect";
import { MaterialDefines } from "core/Materials/materialDefines";
import { MaterialHelper } from "core/Materials/materialHelper";
import { PushMaterial } from "core/Materials/pushMaterial";
import { MaterialFlags } from "core/Materials/materialFlags";
import { VertexBuffer } from "core/Buffers/buffer";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { SubMesh } from "core/Meshes/subMesh";
import type { Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { RegisterClass } from "core/Misc/typeStore";

import "./normal.fragment";
import "./normal.vertex";
import { EffectFallbacks } from "core/Materials/effectFallbacks";
import { addClipPlaneUniforms, bindClipPlane } from "core/Materials/clipPlaneMaterialHelper";

class NormalMaterialDefines extends MaterialDefines {
    public DIFFUSE = false;
    public CLIPPLANE = false;
    public CLIPPLANE2 = false;
    public CLIPPLANE3 = false;
    public CLIPPLANE4 = false;
    public CLIPPLANE5 = false;
    public CLIPPLANE6 = false;
    public ALPHATEST = false;
    public DEPTHPREPASS = false;
    public POINTSIZE = false;
    public FOG = false;
    public LIGHT0 = false;
    public LIGHT1 = false;
    public LIGHT2 = false;
    public LIGHT3 = false;
    public SPOTLIGHT0 = false;
    public SPOTLIGHT1 = false;
    public SPOTLIGHT2 = false;
    public SPOTLIGHT3 = false;
    public HEMILIGHT0 = false;
    public HEMILIGHT1 = false;
    public HEMILIGHT2 = false;
    public HEMILIGHT3 = false;
    public DIRLIGHT0 = false;
    public DIRLIGHT1 = false;
    public DIRLIGHT2 = false;
    public DIRLIGHT3 = false;
    public POINTLIGHT0 = false;
    public POINTLIGHT1 = false;
    public POINTLIGHT2 = false;
    public POINTLIGHT3 = false;
    public SHADOW0 = false;
    public SHADOW1 = false;
    public SHADOW2 = false;
    public SHADOW3 = false;
    public SHADOWS = false;
    public SHADOWESM0 = false;
    public SHADOWESM1 = false;
    public SHADOWESM2 = false;
    public SHADOWESM3 = false;
    public SHADOWPOISSON0 = false;
    public SHADOWPOISSON1 = false;
    public SHADOWPOISSON2 = false;
    public SHADOWPOISSON3 = false;
    public SHADOWPCF0 = false;
    public SHADOWPCF1 = false;
    public SHADOWPCF2 = false;
    public SHADOWPCF3 = false;
    public SHADOWPCSS0 = false;
    public SHADOWPCSS1 = false;
    public SHADOWPCSS2 = false;
    public SHADOWPCSS3 = false;
    public NORMAL = false;
    public UV1 = false;
    public UV2 = false;
    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0;
    public INSTANCES = false;
    public LIGHTING = false;
    public IMAGEPROCESSINGPOSTPROCESS = false;
    public SKIPFINALCOLORCLAMP = false;
    public LOGARITHMICDEPTH = false;

    constructor() {
        super();
        this.rebuild();
    }
}

export class NormalMaterial extends PushMaterial {
    @serializeAsTexture("diffuseTexture")
    private _diffuseTexture: BaseTexture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public diffuseTexture: BaseTexture;

    @serializeAsColor3()
    public diffuseColor = new Color3(1, 1, 1);

    @serialize("disableLighting")
    private _disableLighting = false;
    @expandToProperty("_markAllSubMeshesAsLightsDirty")
    public disableLighting: boolean;

    @serialize("maxSimultaneousLights")
    private _maxSimultaneousLights = 4;
    @expandToProperty("_markAllSubMeshesAsLightsDirty")
    public maxSimultaneousLights: number;

    constructor(name: string, scene?: Scene) {
        super(name, scene);
    }

    public needAlphaBlending(): boolean {
        return this.alpha < 1.0;
    }

    public needAlphaBlendingForMesh(mesh: AbstractMesh): boolean {
        return this.needAlphaBlending() || mesh.visibility < 1.0;
    }

    public needAlphaTesting(): boolean {
        return false;
    }

    public getAlphaTestTexture(): Nullable<BaseTexture> {
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
            subMesh.materialDefines = new NormalMaterialDefines();
        }

        const defines = <NormalMaterialDefines>subMesh.materialDefines;
        const scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        const engine = scene.getEngine();

        // Textures
        if (defines._areTexturesDirty) {
            defines._needUVs = false;
            if (scene.texturesEnabled) {
                if (this._diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
                    if (!this._diffuseTexture.isReady()) {
                        return false;
                    } else {
                        defines._needUVs = true;
                        defines.DIFFUSE = true;
                    }
                }
            }
        }

        // Misc.
        MaterialHelper.PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);

        // Lights
        defines._needNormals = true;
        MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);

        // Values that need to be evaluated on every frame
        MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances ? true : false);

        defines.LIGHTING = !this._disableLighting;

        // Attribs
        MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true);

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();

            scene.resetCachedMaterial();

            // Fallbacks
            const fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }

            MaterialHelper.HandleFallbacksForShadows(defines, fallbacks);

            if (defines.NUM_BONE_INFLUENCERS > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }

            defines.IMAGEPROCESSINGPOSTPROCESS = scene.imageProcessingConfiguration.applyByPostProcess;

            //Attributes
            const attribs = [VertexBuffer.PositionKind];

            if (defines.NORMAL) {
                attribs.push(VertexBuffer.NormalKind);
            }

            if (defines.UV1) {
                attribs.push(VertexBuffer.UVKind);
            }

            if (defines.UV2) {
                attribs.push(VertexBuffer.UV2Kind);
            }

            MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            MaterialHelper.PrepareAttributesForInstances(attribs, defines);

            const shaderName = "normal";
            const join = defines.toString();

            const uniforms = [
                "world",
                "view",
                "viewProjection",
                "vEyePosition",
                "vLightsType",
                "vDiffuseColor",
                "vFogInfos",
                "vFogColor",
                "pointSize",
                "vDiffuseInfos",
                "mBones",
                "diffuseMatrix",
                "logarithmicDepthConstant",
            ];
            const samplers = ["diffuseSampler"];
            const uniformBuffers: string[] = [];

            addClipPlaneUniforms(uniforms);
            MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: 4,
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
                        indexParameters: { maxSimultaneousLights: 4 },
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

        const defines = <NormalMaterialDefines>subMesh.materialDefines;
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
            // Textures
            if (this.diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
                this._activeEffect.setTexture("diffuseSampler", this.diffuseTexture);

                this._activeEffect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                this._activeEffect.setMatrix("diffuseMatrix", this.diffuseTexture.getTextureMatrix());
            }
            // Clip plane
            bindClipPlane(effect, this, scene);

            // Point size
            if (this.pointsCloud) {
                this._activeEffect.setFloat("pointSize", this.pointSize);
            }

            // Log. depth
            if (this._useLogarithmicDepth) {
                MaterialHelper.BindLogDepth(defines, effect, scene);
            }

            scene.bindEyePosition(effect);
        }

        this._activeEffect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);

        // Lights
        if (scene.lightsEnabled && !this.disableLighting) {
            MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines);
        }

        // View
        if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
            this._activeEffect.setMatrix("view", scene.getViewMatrix());
        }

        // Fog
        MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);

        this._afterBind(mesh, this._activeEffect, subMesh);
    }

    public getAnimatables(): IAnimatable[] {
        const results = [];

        if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
            results.push(this.diffuseTexture);
        }

        return results;
    }

    public getActiveTextures(): BaseTexture[] {
        const activeTextures = super.getActiveTextures();

        if (this._diffuseTexture) {
            activeTextures.push(this._diffuseTexture);
        }

        return activeTextures;
    }

    public hasTexture(texture: BaseTexture): boolean {
        if (super.hasTexture(texture)) {
            return true;
        }

        if (this.diffuseTexture === texture) {
            return true;
        }

        return false;
    }

    public dispose(forceDisposeEffect?: boolean): void {
        if (this.diffuseTexture) {
            this.diffuseTexture.dispose();
        }

        super.dispose(forceDisposeEffect);
    }

    public clone(name: string): NormalMaterial {
        return SerializationHelper.Clone(() => new NormalMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.NormalMaterial";
        return serializationObject;
    }

    public getClassName(): string {
        return "NormalMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): NormalMaterial {
        return SerializationHelper.Parse(() => new NormalMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.NormalMaterial", NormalMaterial);
