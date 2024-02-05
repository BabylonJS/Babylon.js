/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import { serializeAsTexture, serialize, expandToProperty, serializeAsColor3, SerializationHelper } from "core/Misc/decorators";
import type { Matrix } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import type { IAnimatable } from "core/Animations/animatable.interface";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Texture } from "core/Materials/Textures/texture";
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

import "./mix.fragment";
import "./mix.vertex";
import { EffectFallbacks } from "core/Materials/effectFallbacks";
import { addClipPlaneUniforms, bindClipPlane } from "core/Materials/clipPlaneMaterialHelper";

class MixMaterialDefines extends MaterialDefines {
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
    public SPECULARTERM = false;
    public NORMAL = false;
    public UV1 = false;
    public UV2 = false;
    public VERTEXCOLOR = false;
    public VERTEXALPHA = false;
    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0;
    public INSTANCES = false;
    public INSTANCESCOLOR = false;
    public MIXMAP2 = false;
    public IMAGEPROCESSINGPOSTPROCESS = false;
    public SKIPFINALCOLORCLAMP = false;
    public LOGARITHMICDEPTH = false;

    constructor() {
        super();
        this.rebuild();
    }
}

export class MixMaterial extends PushMaterial {
    /**
     * Mix textures
     */

    @serializeAsTexture("mixTexture1")
    private _mixTexture1: BaseTexture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public mixTexture1: BaseTexture;

    @serializeAsTexture("mixTexture2")
    private _mixTexture2: BaseTexture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public mixTexture2: BaseTexture;

    /**
     * Diffuse textures
     */

    @serializeAsTexture("diffuseTexture1")
    private _diffuseTexture1: Texture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public diffuseTexture1: Texture;

    @serializeAsTexture("diffuseTexture2")
    private _diffuseTexture2: Texture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public diffuseTexture2: Texture;

    @serializeAsTexture("diffuseTexture3")
    private _diffuseTexture3: Texture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public diffuseTexture3: Texture;

    @serializeAsTexture("diffuseTexture4")
    private _diffuseTexture4: Texture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public diffuseTexture4: Texture;

    @serializeAsTexture("diffuseTexture1")
    private _diffuseTexture5: Texture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public diffuseTexture5: Texture;

    @serializeAsTexture("diffuseTexture2")
    private _diffuseTexture6: Texture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public diffuseTexture6: Texture;

    @serializeAsTexture("diffuseTexture3")
    private _diffuseTexture7: Texture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public diffuseTexture7: Texture;

    @serializeAsTexture("diffuseTexture4")
    private _diffuseTexture8: Texture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public diffuseTexture8: Texture;

    /**
     * Uniforms
     */

    @serializeAsColor3()
    public diffuseColor = new Color3(1, 1, 1);

    @serializeAsColor3()
    public specularColor = new Color3(0, 0, 0);

    @serialize()
    public specularPower = 64;

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
            subMesh.materialDefines = new MixMaterialDefines();
        }

        const defines = <MixMaterialDefines>subMesh.materialDefines;
        const scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        const engine = scene.getEngine();

        // Textures
        if (scene.texturesEnabled) {
            if (!this._mixTexture1 || !this._mixTexture1.isReady()) {
                return false;
            }

            defines._needUVs = true;

            if (MaterialFlags.DiffuseTextureEnabled) {
                if (!this._diffuseTexture1 || !this._diffuseTexture1.isReady()) {
                    return false;
                }

                defines.DIFFUSE = true;

                if (!this._diffuseTexture2 || !this._diffuseTexture2.isReady()) {
                    return false;
                }
                if (!this._diffuseTexture3 || !this._diffuseTexture3.isReady()) {
                    return false;
                }
                if (!this._diffuseTexture4 || !this._diffuseTexture4.isReady()) {
                    return false;
                }

                if (this._mixTexture2) {
                    if (!this._mixTexture2.isReady()) {
                        return false;
                    }

                    defines.MIXMAP2 = true;

                    if (!this._diffuseTexture5 || !this._diffuseTexture5.isReady()) {
                        return false;
                    }
                    if (!this._diffuseTexture6 || !this._diffuseTexture6.isReady()) {
                        return false;
                    }
                    if (!this._diffuseTexture7 || !this._diffuseTexture7.isReady()) {
                        return false;
                    }
                    if (!this._diffuseTexture8 || !this._diffuseTexture8.isReady()) {
                        return false;
                    }
                }
            }
        }

        // Misc.
        MaterialHelper.PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);

        // Lights
        defines._needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);

        // Values that need to be evaluated on every frame
        MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances ? true : false);

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

            MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this.maxSimultaneousLights);

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

            if (defines.VERTEXCOLOR) {
                attribs.push(VertexBuffer.ColorKind);
            }

            MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            MaterialHelper.PrepareAttributesForInstances(attribs, defines);

            // Legacy browser patch
            const shaderName = "mix";
            const join = defines.toString();
            const uniforms = [
                "world",
                "view",
                "viewProjection",
                "vEyePosition",
                "vLightsType",
                "vDiffuseColor",
                "vSpecularColor",
                "vFogInfos",
                "vFogColor",
                "pointSize",
                "vTextureInfos",
                "mBones",
                "textureMatrix",
                "logarithmicDepthConstant",
                "diffuse1Infos",
                "diffuse2Infos",
                "diffuse3Infos",
                "diffuse4Infos",
                "diffuse5Infos",
                "diffuse6Infos",
                "diffuse7Infos",
                "diffuse8Infos",
            ];
            const samplers = [
                "mixMap1Sampler",
                "mixMap2Sampler",
                "diffuse1Sampler",
                "diffuse2Sampler",
                "diffuse3Sampler",
                "diffuse4Sampler",
                "diffuse5Sampler",
                "diffuse6Sampler",
                "diffuse7Sampler",
                "diffuse8Sampler",
            ];

            const uniformBuffers: string[] = [];

            addClipPlaneUniforms(uniforms);
            MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: this.maxSimultaneousLights,
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
                        indexParameters: { maxSimultaneousLights: this.maxSimultaneousLights },
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

        const defines = <MixMaterialDefines>subMesh.materialDefines;
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
            if (this._mixTexture1) {
                this._activeEffect.setTexture("mixMap1Sampler", this._mixTexture1);
                this._activeEffect.setFloat2("vTextureInfos", this._mixTexture1.coordinatesIndex, this._mixTexture1.level);
                this._activeEffect.setMatrix("textureMatrix", this._mixTexture1.getTextureMatrix());

                if (MaterialFlags.DiffuseTextureEnabled) {
                    if (this._diffuseTexture1) {
                        this._activeEffect.setTexture("diffuse1Sampler", this._diffuseTexture1);
                        this._activeEffect.setFloat2("diffuse1Infos", this._diffuseTexture1.uScale, this._diffuseTexture1.vScale);
                    }
                    if (this._diffuseTexture2) {
                        this._activeEffect.setTexture("diffuse2Sampler", this._diffuseTexture2);
                        this._activeEffect.setFloat2("diffuse2Infos", this._diffuseTexture2.uScale, this._diffuseTexture2.vScale);
                    }
                    if (this._diffuseTexture3) {
                        this._activeEffect.setTexture("diffuse3Sampler", this._diffuseTexture3);
                        this._activeEffect.setFloat2("diffuse3Infos", this._diffuseTexture3.uScale, this._diffuseTexture3.vScale);
                    }
                    if (this._diffuseTexture4) {
                        this._activeEffect.setTexture("diffuse4Sampler", this._diffuseTexture4);
                        this._activeEffect.setFloat2("diffuse4Infos", this._diffuseTexture4.uScale, this._diffuseTexture4.vScale);
                    }
                }
            }

            if (this._mixTexture2) {
                this._activeEffect.setTexture("mixMap2Sampler", this._mixTexture2);

                if (MaterialFlags.DiffuseTextureEnabled) {
                    if (this._diffuseTexture5) {
                        this._activeEffect.setTexture("diffuse5Sampler", this._diffuseTexture5);
                        this._activeEffect.setFloat2("diffuse5Infos", this._diffuseTexture5.uScale, this._diffuseTexture5.vScale);
                    }
                    if (this._diffuseTexture6) {
                        this._activeEffect.setTexture("diffuse6Sampler", this._diffuseTexture6);
                        this._activeEffect.setFloat2("diffuse6Infos", this._diffuseTexture6.uScale, this._diffuseTexture6.vScale);
                    }
                    if (this._diffuseTexture7) {
                        this._activeEffect.setTexture("diffuse7Sampler", this._diffuseTexture7);
                        this._activeEffect.setFloat2("diffuse7Infos", this._diffuseTexture7.uScale, this._diffuseTexture7.vScale);
                    }
                    if (this._diffuseTexture8) {
                        this._activeEffect.setTexture("diffuse8Sampler", this._diffuseTexture8);
                        this._activeEffect.setFloat2("diffuse8Infos", this._diffuseTexture8.uScale, this._diffuseTexture8.vScale);
                    }
                }
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

        if (defines.SPECULARTERM) {
            this._activeEffect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
        }

        if (scene.lightsEnabled && !this.disableLighting) {
            MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this.maxSimultaneousLights);
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

        if (this._mixTexture1 && this._mixTexture1.animations && this._mixTexture1.animations.length > 0) {
            results.push(this._mixTexture1);
        }

        if (this._mixTexture2 && this._mixTexture2.animations && this._mixTexture2.animations.length > 0) {
            results.push(this._mixTexture2);
        }

        return results;
    }

    public getActiveTextures(): BaseTexture[] {
        const activeTextures = super.getActiveTextures();

        // Mix map 1
        if (this._mixTexture1) {
            activeTextures.push(this._mixTexture1);
        }

        if (this._diffuseTexture1) {
            activeTextures.push(this._diffuseTexture1);
        }

        if (this._diffuseTexture2) {
            activeTextures.push(this._diffuseTexture2);
        }

        if (this._diffuseTexture3) {
            activeTextures.push(this._diffuseTexture3);
        }

        if (this._diffuseTexture4) {
            activeTextures.push(this._diffuseTexture4);
        }

        // Mix map 2
        if (this._mixTexture2) {
            activeTextures.push(this._mixTexture2);
        }

        if (this._diffuseTexture5) {
            activeTextures.push(this._diffuseTexture5);
        }

        if (this._diffuseTexture6) {
            activeTextures.push(this._diffuseTexture6);
        }

        if (this._diffuseTexture7) {
            activeTextures.push(this._diffuseTexture7);
        }

        if (this._diffuseTexture8) {
            activeTextures.push(this._diffuseTexture8);
        }

        return activeTextures;
    }

    public hasTexture(texture: BaseTexture): boolean {
        if (super.hasTexture(texture)) {
            return true;
        }

        // Mix map 1
        if (this._mixTexture1 === texture) {
            return true;
        }

        if (this._diffuseTexture1 === texture) {
            return true;
        }

        if (this._diffuseTexture2 === texture) {
            return true;
        }

        if (this._diffuseTexture3 === texture) {
            return true;
        }

        if (this._diffuseTexture4 === texture) {
            return true;
        }

        // Mix map 2
        if (this._mixTexture2 === texture) {
            return true;
        }

        if (this._diffuseTexture5 === texture) {
            return true;
        }

        if (this._diffuseTexture6 === texture) {
            return true;
        }

        if (this._diffuseTexture7 === texture) {
            return true;
        }

        if (this._diffuseTexture8 === texture) {
            return true;
        }

        return false;
    }

    public dispose(forceDisposeEffect?: boolean): void {
        if (this._mixTexture1) {
            this._mixTexture1.dispose();
        }

        super.dispose(forceDisposeEffect);
    }

    public clone(name: string): MixMaterial {
        return SerializationHelper.Clone(() => new MixMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.MixMaterial";
        return serializationObject;
    }

    public getClassName(): string {
        return "MixMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): MixMaterial {
        return SerializationHelper.Parse(() => new MixMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.MixMaterial", MixMaterial);
