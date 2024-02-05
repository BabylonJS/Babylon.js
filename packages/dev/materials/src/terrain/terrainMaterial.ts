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

import "./terrain.fragment";
import "./terrain.vertex";
import { EffectFallbacks } from "core/Materials/effectFallbacks";
import { addClipPlaneUniforms, bindClipPlane } from "core/Materials/clipPlaneMaterialHelper";

class TerrainMaterialDefines extends MaterialDefines {
    public DIFFUSE = false;
    public BUMP = false;
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
    public IMAGEPROCESSINGPOSTPROCESS = false;
    public SKIPFINALCOLORCLAMP = false;
    public LOGARITHMICDEPTH = false;

    constructor() {
        super();
        this.rebuild();
    }
}

export class TerrainMaterial extends PushMaterial {
    @serializeAsTexture("mixTexture")
    private _mixTexture: BaseTexture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public mixTexture: BaseTexture;

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

    @serializeAsTexture("bumpTexture1")
    private _bumpTexture1: Texture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public bumpTexture1: Texture;

    @serializeAsTexture("bumpTexture2")
    private _bumpTexture2: Texture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public bumpTexture2: Texture;

    @serializeAsTexture("bumpTexture3")
    private _bumpTexture3: Texture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public bumpTexture3: Texture;

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
            subMesh.materialDefines = new TerrainMaterialDefines();
        }

        const defines = <TerrainMaterialDefines>subMesh.materialDefines;
        const scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        const engine = scene.getEngine();

        // Textures
        if (scene.texturesEnabled) {
            if (!this.mixTexture || !this.mixTexture.isReady()) {
                return false;
            }

            defines._needUVs = true;

            if (MaterialFlags.DiffuseTextureEnabled) {
                if (!this.diffuseTexture1 || !this.diffuseTexture1.isReady()) {
                    return false;
                }
                if (!this.diffuseTexture2 || !this.diffuseTexture2.isReady()) {
                    return false;
                }
                if (!this.diffuseTexture3 || !this.diffuseTexture3.isReady()) {
                    return false;
                }

                defines.DIFFUSE = true;
            }

            if (this.bumpTexture1 && this.bumpTexture2 && this.bumpTexture3 && MaterialFlags.BumpTextureEnabled) {
                if (!this.bumpTexture1.isReady()) {
                    return false;
                }
                if (!this.bumpTexture2.isReady()) {
                    return false;
                }
                if (!this.bumpTexture3.isReady()) {
                    return false;
                }

                defines._needNormals = true;
                defines.BUMP = true;
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
            const shaderName = "terrain";
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
                "diffuse1Infos",
                "diffuse2Infos",
                "diffuse3Infos",
            ];
            const samplers = [
                "textureSampler",
                "diffuse1Sampler",
                "diffuse2Sampler",
                "diffuse3Sampler",
                "bump1Sampler",
                "bump2Sampler",
                "bump3Sampler",
                "logarithmicDepthConstant",
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

        const defines = <TerrainMaterialDefines>subMesh.materialDefines;
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
            if (this.mixTexture) {
                this._activeEffect.setTexture("textureSampler", this._mixTexture);
                this._activeEffect.setFloat2("vTextureInfos", this._mixTexture.coordinatesIndex, this._mixTexture.level);
                this._activeEffect.setMatrix("textureMatrix", this._mixTexture.getTextureMatrix());

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
                }

                if (MaterialFlags.BumpTextureEnabled && scene.getEngine().getCaps().standardDerivatives) {
                    if (this._bumpTexture1) {
                        this._activeEffect.setTexture("bump1Sampler", this._bumpTexture1);
                    }
                    if (this._bumpTexture2) {
                        this._activeEffect.setTexture("bump2Sampler", this._bumpTexture2);
                    }
                    if (this._bumpTexture3) {
                        this._activeEffect.setTexture("bump3Sampler", this._bumpTexture3);
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

        if (this.mixTexture && this.mixTexture.animations && this.mixTexture.animations.length > 0) {
            results.push(this.mixTexture);
        }

        return results;
    }

    public getActiveTextures(): BaseTexture[] {
        const activeTextures = super.getActiveTextures();

        if (this._mixTexture) {
            activeTextures.push(this._mixTexture);
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

        if (this._bumpTexture1) {
            activeTextures.push(this._bumpTexture1);
        }

        if (this._bumpTexture2) {
            activeTextures.push(this._bumpTexture2);
        }

        if (this._bumpTexture3) {
            activeTextures.push(this._bumpTexture3);
        }

        return activeTextures;
    }

    public hasTexture(texture: BaseTexture): boolean {
        if (super.hasTexture(texture)) {
            return true;
        }

        if (this._mixTexture === texture) {
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

        if (this._bumpTexture1 === texture) {
            return true;
        }

        if (this._bumpTexture2 === texture) {
            return true;
        }

        if (this._bumpTexture3 === texture) {
            return true;
        }

        return false;
    }

    public dispose(forceDisposeEffect?: boolean): void {
        if (this.mixTexture) {
            this.mixTexture.dispose();
        }

        super.dispose(forceDisposeEffect);
    }

    public clone(name: string): TerrainMaterial {
        return SerializationHelper.Clone(() => new TerrainMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.TerrainMaterial";
        return serializationObject;
    }

    public getClassName(): string {
        return "TerrainMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): TerrainMaterial {
        return SerializationHelper.Parse(() => new TerrainMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.TerrainMaterial", TerrainMaterial);
