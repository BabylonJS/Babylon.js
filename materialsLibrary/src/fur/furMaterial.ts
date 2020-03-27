import { Nullable } from "babylonjs/types";
import { serializeAsVector3, serializeAsTexture, serialize, expandToProperty, serializeAsColor3, SerializationHelper } from "babylonjs/Misc/decorators";
import { Matrix, Vector3 } from "babylonjs/Maths/math.vector";
import { Color3 } from "babylonjs/Maths/math.color";
import { IAnimatable } from 'babylonjs/Animations/animatable.interface';
import { Tags } from "babylonjs/Misc/tags";
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { DynamicTexture } from "babylonjs/Materials/Textures/dynamicTexture";
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
import { EffectFallbacks } from 'babylonjs/Materials/effectFallbacks';

import "./fur.fragment";
import "./fur.vertex";

class FurMaterialDefines extends MaterialDefines {
    public DIFFUSE = false;
    public HEIGHTMAP = false;
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
    public NORMAL = false;
    public UV1 = false;
    public UV2 = false;
    public VERTEXCOLOR = false;
    public VERTEXALPHA = false;
    public NUM_BONE_INFLUENCERS = 0;
    public BonesPerMesh = 0;
    public INSTANCES = false;
    public HIGHLEVEL = false;

    constructor() {
        super();
        this.rebuild();
    }
}

export class FurMaterial extends PushMaterial {

    @serializeAsTexture("diffuseTexture")
    private _diffuseTexture: BaseTexture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public diffuseTexture: BaseTexture;

    @serializeAsTexture("heightTexture")
    private _heightTexture: BaseTexture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public heightTexture: BaseTexture;

    @serializeAsColor3()
    public diffuseColor = new Color3(1, 1, 1);

    @serialize()
    public furLength: number = 1;

    @serialize()
    public furAngle: number = 0;

    @serializeAsColor3()
    public furColor = new Color3(0.44, 0.21, 0.02);

    @serialize()
    public furOffset: number = 0.0;

    @serialize()
    public furSpacing: number = 12;

    @serializeAsVector3()
    public furGravity = new Vector3(0, 0, 0);

    @serialize()
    public furSpeed: number = 100;

    @serialize()
    public furDensity: number = 20;

    @serialize()
    public furOcclusion: number = 0.0;

    public furTexture: DynamicTexture;

    @serialize("disableLighting")
    private _disableLighting = false;
    @expandToProperty("_markAllSubMeshesAsLightsDirty")
    public disableLighting: boolean;

    @serialize("maxSimultaneousLights")
    private _maxSimultaneousLights = 4;
    @expandToProperty("_markAllSubMeshesAsLightsDirty")
    public maxSimultaneousLights: number;

    @serialize()
    public highLevelFur: boolean = true;

    public _meshes: AbstractMesh[];

    private _furTime: number = 0;

    constructor(name: string, scene: Scene) {
        super(name, scene);
    }

    @serialize()
    public get furTime() {
        return this._furTime;
    }

    public set furTime(furTime: number) {
        this._furTime = furTime;
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

    public updateFur(): void {
        for (var i = 1; i < this._meshes.length; i++) {
            var offsetFur = <FurMaterial>this._meshes[i].material;

            offsetFur.furLength = this.furLength;
            offsetFur.furAngle = this.furAngle;
            offsetFur.furGravity = this.furGravity;
            offsetFur.furSpacing = this.furSpacing;
            offsetFur.furSpeed = this.furSpeed;
            offsetFur.furColor = this.furColor;
            offsetFur.diffuseTexture = this.diffuseTexture;
            offsetFur.furTexture = this.furTexture;
            offsetFur.highLevelFur = this.highLevelFur;
            offsetFur.furTime = this.furTime;
            offsetFur.furDensity = this.furDensity;
        }
    }

    // Methods
    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        if (this.isFrozen) {
            if (subMesh.effect && subMesh.effect._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh._materialDefines) {
            subMesh._materialDefines = new FurMaterialDefines();
        }

        var defines = <FurMaterialDefines>subMesh._materialDefines;
        var scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        var engine = scene.getEngine();

        // Textures
        if (defines._areTexturesDirty) {
            if (scene.texturesEnabled) {
                if (this.diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
                    if (!this.diffuseTexture.isReady()) {
                        return false;
                    } else {
                        defines._needUVs = true;
                        defines.DIFFUSE = true;
                    }
                }
                if (this.heightTexture && engine.getCaps().maxVertexTextureImageUnits) {
                    if (!this.heightTexture.isReady()) {
                        return false;
                    } else {
                        defines._needUVs = true;
                        defines.HEIGHTMAP = true;
                    }
                }
            }
        }

        // High level
        if (this.highLevelFur !== defines.HIGHLEVEL) {
            defines.HIGHLEVEL = true;
            defines.markAsUnprocessed();
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
            var shaderName = "fur";
            var join = defines.toString();
            var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor",
                "vFogInfos", "vFogColor", "pointSize",
                "vDiffuseInfos",
                "mBones",
                "vClipPlane", "vClipPlane2", "vClipPlane3", "vClipPlane4", "vClipPlane5", "vClipPlane6", "diffuseMatrix",
                "furLength", "furAngle", "furColor", "furOffset", "furGravity", "furTime", "furSpacing", "furDensity", "furOcclusion"
            ];
            var samplers = ["diffuseSampler",
                "heightTexture", "furTexture"
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

        var defines = <FurMaterialDefines>subMesh._materialDefines;
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

        if (scene.getCachedMaterial() !== this) {
            // Textures
            if (this._diffuseTexture && MaterialFlags.DiffuseTextureEnabled) {
                this._activeEffect.setTexture("diffuseSampler", this._diffuseTexture);

                this._activeEffect.setFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                this._activeEffect.setMatrix("diffuseMatrix", this._diffuseTexture.getTextureMatrix());
            }

            if (this._heightTexture) {
                this._activeEffect.setTexture("heightTexture", this._heightTexture);
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

        if (scene.lightsEnabled && !this.disableLighting) {
            MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, this.maxSimultaneousLights);
        }

        // View
        if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
            this._activeEffect.setMatrix("view", scene.getViewMatrix());
        }

        // Fog
        MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);

        this._activeEffect.setFloat("furLength", this.furLength);
        this._activeEffect.setFloat("furAngle", this.furAngle);
        this._activeEffect.setColor4("furColor", this.furColor, 1.0);

        if (this.highLevelFur) {
            this._activeEffect.setVector3("furGravity", this.furGravity);
            this._activeEffect.setFloat("furOffset", this.furOffset);
            this._activeEffect.setFloat("furSpacing", this.furSpacing);
            this._activeEffect.setFloat("furDensity", this.furDensity);
            this._activeEffect.setFloat("furOcclusion", this.furOcclusion);

            this._furTime += this.getScene().getEngine().getDeltaTime() / this.furSpeed;
            this._activeEffect.setFloat("furTime", this._furTime);

            this._activeEffect.setTexture("furTexture", this.furTexture);
        }

        this._afterBind(mesh, this._activeEffect);
    }

    public getAnimatables(): IAnimatable[] {
        var results = [];

        if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
            results.push(this.diffuseTexture);
        }

        if (this.heightTexture && this.heightTexture.animations && this.heightTexture.animations.length > 0) {
            results.push(this.heightTexture);
        }

        return results;
    }

    public getActiveTextures(): BaseTexture[] {
        var activeTextures = super.getActiveTextures();

        if (this._diffuseTexture) {
            activeTextures.push(this._diffuseTexture);
        }

        if (this._heightTexture) {
            activeTextures.push(this._heightTexture);
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

        if (this._heightTexture === texture) {
            return true;
        }

        return false;
    }

    public dispose(forceDisposeEffect?: boolean): void {
        if (this.diffuseTexture) {
            this.diffuseTexture.dispose();
        }

        if (this._meshes) {
            for (var i = 1; i < this._meshes.length; i++) {
                let mat = this._meshes[i].material;

                if (mat) {
                    mat.dispose(forceDisposeEffect);
                }
                this._meshes[i].dispose();
            }
        }

        super.dispose(forceDisposeEffect);
    }

    public clone(name: string): FurMaterial {
        return SerializationHelper.Clone(() => new FurMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this);
        serializationObject.customType = "BABYLON.FurMaterial";

        if (this._meshes) {
            serializationObject.sourceMeshName = this._meshes[0].name;
            serializationObject.quality = this._meshes.length;
        }

        return serializationObject;
    }

    public getClassName(): string {
        return "FurMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): FurMaterial {
        var material = SerializationHelper.Parse(() => new FurMaterial(source.name, scene), source, scene, rootUrl);

        if (source.sourceMeshName && material.highLevelFur) {
            scene.executeWhenReady(() => {
                var sourceMesh = <Mesh>scene.getMeshByName(source.sourceMeshName);
                if (sourceMesh) {
                    var furTexture = FurMaterial.GenerateTexture("Fur Texture", scene);
                    material.furTexture = furTexture;
                    FurMaterial.FurifyMesh(sourceMesh, source.quality);
                }
            });
        }

        return material;
    }

    public static GenerateTexture(name: string, scene: Scene): DynamicTexture {
        // Generate fur textures
        var texture = new DynamicTexture("FurTexture " + name, 256, scene, true);
        var context = texture.getContext();

        for (var i = 0; i < 20000; ++i) {
            context.fillStyle = "rgba(255, " + Math.floor(Math.random() * 255) + ", " + Math.floor(Math.random() * 255) + ", 1)";
            context.fillRect((Math.random() * texture.getSize().width), (Math.random() * texture.getSize().height), 2, 2);
        }

        texture.update(false);
        texture.wrapU = Texture.WRAP_ADDRESSMODE;
        texture.wrapV = Texture.WRAP_ADDRESSMODE;

        return texture;
    }

    // Creates and returns an array of meshes used as shells for the Fur Material
    // that can be disposed later in your code
    // The quality is in interval [0, 100]
    public static FurifyMesh(sourceMesh: Mesh, quality: number): Mesh[] {
        var meshes = [sourceMesh];
        var mat: FurMaterial = <FurMaterial>sourceMesh.material;
        var i;

        if (!(mat instanceof FurMaterial)) {
            throw "The material of the source mesh must be a Fur Material";
        }

        for (i = 1; i < quality; i++) {
            var offsetFur = new FurMaterial(mat.name + i, sourceMesh.getScene());
            sourceMesh.getScene().materials.pop();
            Tags.EnableFor(offsetFur);
            Tags.AddTagsTo(offsetFur, "furShellMaterial");

            offsetFur.furLength = mat.furLength;
            offsetFur.furAngle = mat.furAngle;
            offsetFur.furGravity = mat.furGravity;
            offsetFur.furSpacing = mat.furSpacing;
            offsetFur.furSpeed = mat.furSpeed;
            offsetFur.furColor = mat.furColor;
            offsetFur.diffuseTexture = mat.diffuseTexture;
            offsetFur.furOffset = i / quality;
            offsetFur.furTexture = mat.furTexture;
            offsetFur.highLevelFur = mat.highLevelFur;
            offsetFur.furTime = mat.furTime;
            offsetFur.furDensity = mat.furDensity;

            var offsetMesh = sourceMesh.clone(sourceMesh.name + i) as Mesh;

            offsetMesh.material = offsetFur;
            offsetMesh.skeleton = sourceMesh.skeleton;
            offsetMesh.position = Vector3.Zero();
            meshes.push(offsetMesh);
        }

        for (i = 1; i < meshes.length; i++) {
            meshes[i].parent = sourceMesh;
        }

        (<FurMaterial>sourceMesh.material)._meshes = meshes;

        return meshes;
    }
}

_TypeStore.RegisteredTypes["BABYLON.FurMaterial"] = FurMaterial;