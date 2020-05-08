import { Nullable } from "babylonjs/types";
import { serializeAsTexture, serialize, expandToProperty, serializeAsColor3, SerializationHelper } from "babylonjs/Misc/decorators";
import { Matrix } from "babylonjs/Maths/math.vector";
import { Color3 } from "babylonjs/Maths/math.color";

import { IAnimatable } from 'babylonjs/Animations/animatable.interface';
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { IEffectCreationOptions } from "babylonjs/Materials/effect";
import { MaterialDefines } from "babylonjs/Materials/materialDefines";
import { MaterialHelper } from "babylonjs/Materials/materialHelper";
import { PushMaterial } from "babylonjs/Materials/pushMaterial";
import { MaterialFlags } from "babylonjs/Materials/materialFlags";
import { VertexBuffer } from "babylonjs/Meshes/buffer";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { SubMesh } from "babylonjs/Meshes/subMesh";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Scene } from "babylonjs/scene";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

import "./triplanar.fragment";
import "./triplanar.vertex";
import { EffectFallbacks } from 'babylonjs/Materials/effectFallbacks';

class TriPlanarMaterialDefines extends MaterialDefines {
    public DIFFUSEX = false;
    public DIFFUSEY = false;
    public DIFFUSEZ = false;

    public BUMPX = false;
    public BUMPY = false;
    public BUMPZ = false;

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
    public VERTEXCOLOR = false;
    public VERTEXALPHA = false;
    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0;
    public INSTANCES = false;

    constructor() {
        super();
        this.rebuild();
    }
}

export class TriPlanarMaterial extends PushMaterial {
    @serializeAsTexture()
    public mixTexture: BaseTexture;

    @serializeAsTexture("diffuseTextureX")
    private _diffuseTextureX: BaseTexture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public diffuseTextureX: BaseTexture;

    @serializeAsTexture("diffuseTexturY")
    private _diffuseTextureY: BaseTexture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public diffuseTextureY: BaseTexture;

    @serializeAsTexture("diffuseTextureZ")
    private _diffuseTextureZ: BaseTexture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public diffuseTextureZ: BaseTexture;

    @serializeAsTexture("normalTextureX")
    private _normalTextureX: BaseTexture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public normalTextureX: BaseTexture;

    @serializeAsTexture("normalTextureY")
    private _normalTextureY: BaseTexture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public normalTextureY: BaseTexture;

    @serializeAsTexture("normalTextureZ")
    private _normalTextureZ: BaseTexture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public normalTextureZ: BaseTexture;

    @serialize()
    public tileSize: number = 1;

    @serializeAsColor3()
    public diffuseColor = new Color3(1, 1, 1);

    @serializeAsColor3()
    public specularColor = new Color3(0.2, 0.2, 0.2);

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

    constructor(name: string, scene: Scene) {
        super(name, scene);
    }

    public needAlphaBlending(): boolean {
        return (this.alpha < 1.0);
    }

    public needAlphaTesting(): boolean {
        return false;
    }

    public getAlphaTestTexture(): Nullable<BaseTexture> {
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
            subMesh._materialDefines = new TriPlanarMaterialDefines();
        }

        var defines = <TriPlanarMaterialDefines>subMesh._materialDefines;
        var scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        var engine = scene.getEngine();

        // Textures
        if (defines._areTexturesDirty) {
            if (scene.texturesEnabled) {
                if (MaterialFlags.DiffuseTextureEnabled) {
                    var textures = [this.diffuseTextureX, this.diffuseTextureY, this.diffuseTextureZ];
                    var textureDefines = ["DIFFUSEX", "DIFFUSEY", "DIFFUSEZ"];

                    for (var i = 0; i < textures.length; i++) {
                        if (textures[i]) {
                            if (!textures[i].isReady()) {
                                return false;
                            } else {
                                (<any>defines)[textureDefines[i]] = true;
                            }
                        }
                    }
                }
                if (MaterialFlags.BumpTextureEnabled) {
                    var textures = [this.normalTextureX, this.normalTextureY, this.normalTextureZ];
                    var textureDefines = ["BUMPX", "BUMPY", "BUMPZ"];

                    for (var i = 0; i < textures.length; i++) {
                        if (textures[i]) {
                            if (!textures[i].isReady()) {
                                return false;
                            } else {
                                (<any>defines)[textureDefines[i]] = true;
                            }
                        }
                    }
                }
            }
        }

        // Misc.
        MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);

        // Lights
        defines._needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, this._maxSimultaneousLights, this._disableLighting);

        // Values that need to be evaluated on every frame
        MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances ? true : false);

        // Attribs
        MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true);

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();
            scene.resetCachedMaterial();

            // Fallbacks
            var fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }

            MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this.maxSimultaneousLights);

            if (defines.NUM_BONE_INFLUENCERS > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }

            //Attributes
            var attribs = [VertexBuffer.PositionKind];

            if (defines.NORMAL) {
                attribs.push(VertexBuffer.NormalKind);
            }

            if (defines.VERTEXCOLOR) {
                attribs.push(VertexBuffer.ColorKind);
            }

            MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            MaterialHelper.PrepareAttributesForInstances(attribs, defines);

            // Legacy browser patch
            var shaderName = "triplanar";
            var join = defines.toString();
            var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor", "vSpecularColor",
                "vFogInfos", "vFogColor", "pointSize",
                "mBones",
                "vClipPlane", "vClipPlane2", "vClipPlane3", "vClipPlane4", "vClipPlane5", "vClipPlane6",
                "tileSize"
            ];
            var samplers = ["diffuseSamplerX", "diffuseSamplerY", "diffuseSamplerZ",
                "normalSamplerX", "normalSamplerY", "normalSamplerZ"
            ];

            var uniformBuffers = new Array<string>();

            MaterialHelper.PrepareUniformsAndSamplersList(<IEffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: this.maxSimultaneousLights
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
                    indexParameters: { maxSimultaneousLights: this.maxSimultaneousLights }
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

        var defines = <TriPlanarMaterialDefines>subMesh._materialDefines;
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

        this._activeEffect.setFloat("tileSize", this.tileSize);

        if (scene.getCachedMaterial() !== this) {
            // Textures
            if (this.diffuseTextureX) {
                this._activeEffect.setTexture("diffuseSamplerX", this.diffuseTextureX);
            }
            if (this.diffuseTextureY) {
                this._activeEffect.setTexture("diffuseSamplerY", this.diffuseTextureY);
            }
            if (this.diffuseTextureZ) {
                this._activeEffect.setTexture("diffuseSamplerZ", this.diffuseTextureZ);
            }
            if (this.normalTextureX) {
                this._activeEffect.setTexture("normalSamplerX", this.normalTextureX);
            }
            if (this.normalTextureY) {
                this._activeEffect.setTexture("normalSamplerY", this.normalTextureY);
            }
            if (this.normalTextureZ) {
                this._activeEffect.setTexture("normalSamplerZ", this.normalTextureZ);
            }
            // Clip plane
            MaterialHelper.BindClipPlane(this._activeEffect, scene);

            // Point size
            if (this.pointsCloud) {
                this._activeEffect.setFloat("pointSize", this.pointSize);
            }

            MaterialHelper.BindEyePosition(effect, scene);
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

        this._afterBind(mesh, this._activeEffect);
    }

    public getAnimatables(): IAnimatable[] {
        var results = [];

        if (this.mixTexture && this.mixTexture.animations && this.mixTexture.animations.length > 0) {
            results.push(this.mixTexture);
        }

        return results;
    }

    public getActiveTextures(): BaseTexture[] {
        var activeTextures = super.getActiveTextures();

        if (this._diffuseTextureX) {
            activeTextures.push(this._diffuseTextureX);
        }

        if (this._diffuseTextureY) {
            activeTextures.push(this._diffuseTextureY);
        }

        if (this._diffuseTextureZ) {
            activeTextures.push(this._diffuseTextureZ);
        }

        if (this._normalTextureX) {
            activeTextures.push(this._normalTextureX);
        }

        if (this._normalTextureY) {
            activeTextures.push(this._normalTextureY);
        }

        if (this._normalTextureZ) {
            activeTextures.push(this._normalTextureZ);
        }

        return activeTextures;
    }

    public hasTexture(texture: BaseTexture): boolean {
        if (super.hasTexture(texture)) {
            return true;
        }

        if (this._diffuseTextureX === texture) {
            return true;
        }

        if (this._diffuseTextureY === texture) {
            return true;
        }

        if (this._diffuseTextureZ === texture) {
            return true;
        }

        if (this._normalTextureX === texture) {
            return true;
        }

        if (this._normalTextureY === texture) {
            return true;
        }

        if (this._normalTextureZ === texture) {
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

    public clone(name: string): TriPlanarMaterial {
        return SerializationHelper.Clone(() => new TriPlanarMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.TriPlanarMaterial";
        return serializationObject;
    }

    public getClassName(): string {
        return "TriPlanarMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): TriPlanarMaterial {
        return SerializationHelper.Parse(() => new TriPlanarMaterial(source.name, scene), source, scene, rootUrl);
    }
}

_TypeStore.RegisteredTypes["BABYLON.TriPlanarMaterial"] = TriPlanarMaterial;