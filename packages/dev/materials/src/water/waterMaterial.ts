/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import { serializeAsVector2, serializeAsTexture, serialize, expandToProperty, serializeAsColor3, SerializationHelper } from "core/Misc/decorators";
import { Matrix, Vector2, Vector3 } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import { Plane } from "core/Maths/math.plane";
import type { IAnimatable } from "core/Animations/animatable.interface";
import { Constants } from "core/Engines/constants";
import { SmartArray } from "core/Misc/smartArray";
import type { Observer } from "core/Misc/observable";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import type { IEffectCreationOptions } from "core/Materials/effect";
import { MaterialDefines } from "core/Materials/materialDefines";
import type { IImageProcessingConfigurationDefines } from "core/Materials/imageProcessingConfiguration";
import { ImageProcessingConfiguration } from "core/Materials/imageProcessingConfiguration";
import { MaterialHelper } from "core/Materials/materialHelper";
import { PushMaterial } from "core/Materials/pushMaterial";
import { MaterialFlags } from "core/Materials/materialFlags";
import { VertexBuffer } from "core/Buffers/buffer";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { SubMesh } from "core/Meshes/subMesh";
import type { Mesh } from "core/Meshes/mesh";
import type { Camera } from "core/Cameras/camera";
import { Scene } from "core/scene";
import { RegisterClass } from "core/Misc/typeStore";

import "./water.fragment";
import "./water.vertex";
import { EffectFallbacks } from "core/Materials/effectFallbacks";
import { CreateGround } from "core/Meshes/Builders/groundBuilder";
import { addClipPlaneUniforms, bindClipPlane } from "core/Materials/clipPlaneMaterialHelper";

class WaterMaterialDefines extends MaterialDefines implements IImageProcessingConfigurationDefines {
    public BUMP = false;
    public REFLECTION = false;
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
    public INSTANCESCOLOR = false;
    public SPECULARTERM = false;
    public LOGARITHMICDEPTH = false;
    public USE_REVERSE_DEPTHBUFFER = false;
    public FRESNELSEPARATE = false;
    public BUMPSUPERIMPOSE = false;
    public BUMPAFFECTSREFLECTION = false;
    public USE_WORLD_COORDINATES = false;

    public IMAGEPROCESSING = false;
    public VIGNETTE = false;
    public VIGNETTEBLENDMODEMULTIPLY = false;
    public VIGNETTEBLENDMODEOPAQUE = false;
    public TONEMAPPING = false;
    public TONEMAPPING_ACES = false;
    public CONTRAST = false;
    public EXPOSURE = false;
    public COLORCURVES = false;
    public COLORGRADING = false;
    public COLORGRADING3D = false;
    public SAMPLER3DGREENDEPTH = false;
    public SAMPLER3DBGRMAP = false;
    public DITHER = false;
    public IMAGEPROCESSINGPOSTPROCESS = false;
    public SKIPFINALCOLORCLAMP = false;

    constructor() {
        super();
        this.rebuild();
    }
}

export class WaterMaterial extends PushMaterial {
    /*
     * Public members
     */
    @serializeAsTexture("bumpTexture")
    private _bumpTexture: BaseTexture;
    @expandToProperty("_markAllSubMeshesAsTexturesDirty")
    public bumpTexture: BaseTexture;

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

    /**
     * Defines the wind force.
     */
    @serialize()
    public windForce: number = 6;
    /**
     * Defines the direction of the wind in the plane (X, Z).
     */
    @serializeAsVector2()
    public windDirection: Vector2 = new Vector2(0, 1);
    /**
     * Defines the height of the waves.
     */
    @serialize()
    public waveHeight: number = 0.4;
    /**
     * Defines the bump height related to the bump map.
     */
    @serialize()
    public bumpHeight: number = 0.4;
    /**
     * Defines wether or not: to add a smaller moving bump to less steady waves.
     */
    @serialize("bumpSuperimpose")
    private _bumpSuperimpose = false;
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public bumpSuperimpose: boolean;

    /**
     * Defines wether or not color refraction and reflection differently with .waterColor2 and .colorBlendFactor2. Non-linear (physically correct) fresnel.
     */
    @serialize("fresnelSeparate")
    private _fresnelSeparate = false;
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public fresnelSeparate: boolean;

    /**
     * Defines wether or not bump Wwves modify the reflection.
     */
    @serialize("bumpAffectsReflection")
    private _bumpAffectsReflection = false;
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public bumpAffectsReflection: boolean;

    /**
     * Defines the water color blended with the refraction (near).
     */
    @serializeAsColor3()
    public waterColor: Color3 = new Color3(0.1, 0.1, 0.6);
    /**
     * Defines the blend factor related to the water color.
     */
    @serialize()
    public colorBlendFactor: number = 0.2;
    /**
     * Defines the water color blended with the reflection (far).
     */
    @serializeAsColor3()
    public waterColor2: Color3 = new Color3(0.1, 0.1, 0.6);
    /**
     * Defines the blend factor related to the water color (reflection, far).
     */
    @serialize()
    public colorBlendFactor2: number = 0.2;
    /**
     * Defines the maximum length of a wave.
     */
    @serialize()
    public waveLength: number = 0.1;

    /**
     * Defines the waves speed.
     */
    @serialize()
    public waveSpeed: number = 1.0;

    /**
     * Defines the number of times waves are repeated. This is typically used to adjust waves count according to the ground's size where the material is applied on.
     */
    @serialize()
    public waveCount: number = 20;
    /**
     * Sets or gets whether or not automatic clipping should be enabled or not. Setting to true will save performances and
     * will avoid calculating useless pixels in the pixel shader of the water material.
     */
    @serialize()
    public disableClipPlane: boolean = false;

    /**
     * Defines whether or not to use world coordinates for wave deformations.
     * The default value is false, meaning that the deformation is applied in object (local) space.
     * You will probably need to set it to true if you are using instances or thin instances for your water objects.
     */
    @serialize("useWorldCoordinatesForWaveDeformation")
    private _useWorldCoordinatesForWaveDeformation = false;
    @expandToProperty("_markAllSubMeshesAsMiscDirty")
    public useWorldCoordinatesForWaveDeformation: boolean;

    protected _renderTargets = new SmartArray<RenderTargetTexture>(16);

    /*
     * Private members
     */
    private _mesh: Nullable<AbstractMesh> = null;

    private _refractionRTT: Nullable<RenderTargetTexture>;
    private _reflectionRTT: Nullable<RenderTargetTexture>;

    private _reflectionTransform: Matrix = Matrix.Zero();
    private _lastTime: number = 0;
    private _lastDeltaTime: number = 0;

    private _waitingRenderList: Nullable<string[]>;

    private _imageProcessingConfiguration: Nullable<ImageProcessingConfiguration>;
    private _imageProcessingObserver: Nullable<Observer<ImageProcessingConfiguration>>;

    /**
     * Gets a boolean indicating that current material needs to register RTT
     */
    public get hasRenderTargetTextures(): boolean {
        return true;
    }

    /**
     * Constructor
     * @param name
     * @param scene
     * @param renderTargetSize
     */
    constructor(
        name: string,
        scene?: Scene,
        public renderTargetSize: Vector2 = new Vector2(512, 512)
    ) {
        super(name, scene);

        this._createRenderTargets(this.getScene(), renderTargetSize);

        // Create render targets
        this.getRenderTargetTextures = (): SmartArray<RenderTargetTexture> => {
            this._renderTargets.reset();
            this._renderTargets.push(<RenderTargetTexture>this._reflectionRTT);
            this._renderTargets.push(<RenderTargetTexture>this._refractionRTT);

            return this._renderTargets;
        };

        this._imageProcessingConfiguration = this.getScene().imageProcessingConfiguration;
        if (this._imageProcessingConfiguration) {
            this._imageProcessingObserver = this._imageProcessingConfiguration.onUpdateParameters.add(() => {
                this._markAllSubMeshesAsImageProcessingDirty();
            });
        }
    }

    // Get / Set
    public get refractionTexture(): Nullable<RenderTargetTexture> {
        return this._refractionRTT;
    }

    public get reflectionTexture(): Nullable<RenderTargetTexture> {
        return this._reflectionRTT;
    }

    // Methods
    public addToRenderList(node: any): void {
        if (this._refractionRTT && this._refractionRTT.renderList) {
            this._refractionRTT.renderList.push(node);
        }

        if (this._reflectionRTT && this._reflectionRTT.renderList) {
            this._reflectionRTT.renderList.push(node);
        }
    }

    public removeFromRenderList(node: any): void {
        if (this._refractionRTT && this._refractionRTT.renderList) {
            const idx = this._refractionRTT.renderList.indexOf(node);
            if (idx !== -1) {
                this._refractionRTT.renderList.splice(idx, 1);
            }
        }

        if (this._reflectionRTT && this._reflectionRTT.renderList) {
            const idx = this._reflectionRTT.renderList.indexOf(node);
            if (idx !== -1) {
                this._reflectionRTT.renderList.splice(idx, 1);
            }
        }
    }

    public enableRenderTargets(enable: boolean): void {
        const refreshRate = enable ? 1 : 0;

        if (this._refractionRTT) {
            this._refractionRTT.refreshRate = refreshRate;
        }

        if (this._reflectionRTT) {
            this._reflectionRTT.refreshRate = refreshRate;
        }
    }

    public getRenderList(): Nullable<AbstractMesh[]> {
        return this._refractionRTT ? this._refractionRTT.renderList : [];
    }

    public get renderTargetsEnabled(): boolean {
        return !(this._refractionRTT && this._refractionRTT.refreshRate === 0);
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

    public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
        const drawWrapper = subMesh._drawWrapper;

        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady && drawWrapper._wasPreviouslyUsingInstances === useInstances) {
                return true;
            }
        }

        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new WaterMaterialDefines();
        }

        const defines = <WaterMaterialDefines>subMesh.materialDefines;
        const scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        const engine = scene.getEngine();

        // Textures
        if (defines._areTexturesDirty) {
            defines._needUVs = false;
            if (scene.texturesEnabled) {
                if (this.bumpTexture && MaterialFlags.BumpTextureEnabled) {
                    if (!this.bumpTexture.isReady()) {
                        return false;
                    } else {
                        defines._needUVs = true;
                        defines.BUMP = true;
                    }
                }

                if (MaterialFlags.ReflectionTextureEnabled) {
                    defines.REFLECTION = true;
                }
            }
        }

        MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, this, defines, useInstances ? true : false);

        MaterialHelper.PrepareDefinesForMisc(mesh, scene, this._useLogarithmicDepth, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);

        if (defines._areMiscDirty) {
            defines.FRESNELSEPARATE = this._fresnelSeparate;
            defines.BUMPSUPERIMPOSE = this._bumpSuperimpose;
            defines.BUMPAFFECTSREFLECTION = this._bumpAffectsReflection;
            defines.USE_WORLD_COORDINATES = this._useWorldCoordinatesForWaveDeformation;
        }

        // Lights
        defines._needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, true, this._maxSimultaneousLights, this._disableLighting);

        // Image processing
        if (defines._areImageProcessingDirty && this._imageProcessingConfiguration) {
            if (!this._imageProcessingConfiguration.isReady()) {
                return false;
            }

            this._imageProcessingConfiguration.prepareDefines(defines);

            defines.IS_REFLECTION_LINEAR = this.reflectionTexture != null && !this.reflectionTexture.gammaSpace;
            defines.IS_REFRACTION_LINEAR = this.refractionTexture != null && !this.refractionTexture.gammaSpace;
        }

        // Attribs
        MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true);

        // Configure this
        this._mesh = mesh;

        if (this._waitingRenderList) {
            for (let i = 0; i < this._waitingRenderList.length; i++) {
                this.addToRenderList(scene.getNodeById(this._waitingRenderList[i]));
            }

            this._waitingRenderList = null;
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

            if (defines.LOGARITHMICDEPTH) {
                fallbacks.addFallback(0, "LOGARITHMICDEPTH");
            }

            MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, this.maxSimultaneousLights);

            if (defines.NUM_BONE_INFLUENCERS > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }

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
            const shaderName = "water";
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
                "vNormalInfos",
                "mBones",
                "normalMatrix",
                "logarithmicDepthConstant",

                // Water
                "reflectionViewProjection",
                "windDirection",
                "waveLength",
                "time",
                "windForce",
                "cameraPosition",
                "bumpHeight",
                "waveHeight",
                "waterColor",
                "waterColor2",
                "colorBlendFactor",
                "colorBlendFactor2",
                "waveSpeed",
                "waveCount",
            ];
            const samplers = [
                "normalSampler",
                // Water
                "refractionSampler",
                "reflectionSampler",
            ];
            const uniformBuffers: string[] = [];

            if (ImageProcessingConfiguration) {
                ImageProcessingConfiguration.PrepareUniforms(uniforms, defines);
                ImageProcessingConfiguration.PrepareSamplers(samplers, defines);
            }

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
                        indexParameters: { maxSimultaneousLights: this._maxSimultaneousLights },
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

        const defines = <WaterMaterialDefines>subMesh.materialDefines;
        if (!defines) {
            return;
        }

        const effect = subMesh.effect;
        if (!effect || !this._mesh) {
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
            if (this.bumpTexture && MaterialFlags.BumpTextureEnabled) {
                this._activeEffect.setTexture("normalSampler", this.bumpTexture);

                this._activeEffect.setFloat2("vNormalInfos", this.bumpTexture.coordinatesIndex, this.bumpTexture.level);
                this._activeEffect.setMatrix("normalMatrix", this.bumpTexture.getTextureMatrix());
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

        // Log. depth
        MaterialHelper.BindLogDepth(defines, this._activeEffect, scene);

        // Water
        if (MaterialFlags.ReflectionTextureEnabled) {
            this._activeEffect.setTexture("refractionSampler", this._refractionRTT);
            this._activeEffect.setTexture("reflectionSampler", this._reflectionRTT);
        }

        const wrvp = this._reflectionTransform.multiply(scene.getProjectionMatrix());

        // Add delta time. Prevent adding delta time if it hasn't changed.
        const deltaTime = scene.getEngine().getDeltaTime();
        if (deltaTime !== this._lastDeltaTime) {
            this._lastDeltaTime = deltaTime;
            this._lastTime += this._lastDeltaTime;
        }

        this._activeEffect.setMatrix("reflectionViewProjection", wrvp);
        this._activeEffect.setVector2("windDirection", this.windDirection);
        this._activeEffect.setFloat("waveLength", this.waveLength);
        this._activeEffect.setFloat("time", this._lastTime / 100000);
        this._activeEffect.setFloat("windForce", this.windForce);
        this._activeEffect.setFloat("waveHeight", this.waveHeight);
        this._activeEffect.setFloat("bumpHeight", this.bumpHeight);
        this._activeEffect.setColor4("waterColor", this.waterColor, 1.0);
        this._activeEffect.setFloat("colorBlendFactor", this.colorBlendFactor);
        this._activeEffect.setColor4("waterColor2", this.waterColor2, 1.0);
        this._activeEffect.setFloat("colorBlendFactor2", this.colorBlendFactor2);
        this._activeEffect.setFloat("waveSpeed", this.waveSpeed);
        this._activeEffect.setFloat("waveCount", this.waveCount);

        // image processing
        if (this._imageProcessingConfiguration && !this._imageProcessingConfiguration.applyByPostProcess) {
            this._imageProcessingConfiguration.bind(this._activeEffect);
        }

        this._afterBind(mesh, this._activeEffect, subMesh);
    }

    private _createRenderTargets(scene: Scene, renderTargetSize: Vector2): void {
        // Render targets
        this._refractionRTT = new RenderTargetTexture(name + "_refraction", { width: renderTargetSize.x, height: renderTargetSize.y }, scene, false, true);
        this._refractionRTT.wrapU = Constants.TEXTURE_MIRROR_ADDRESSMODE;
        this._refractionRTT.wrapV = Constants.TEXTURE_MIRROR_ADDRESSMODE;
        this._refractionRTT.ignoreCameraViewport = true;

        this._reflectionRTT = new RenderTargetTexture(name + "_reflection", { width: renderTargetSize.x, height: renderTargetSize.y }, scene, false, true);
        this._reflectionRTT.wrapU = Constants.TEXTURE_MIRROR_ADDRESSMODE;
        this._reflectionRTT.wrapV = Constants.TEXTURE_MIRROR_ADDRESSMODE;
        this._reflectionRTT.ignoreCameraViewport = true;

        let isVisible: boolean;
        let clipPlane: Nullable<Plane> = null;
        let savedViewMatrix: Matrix;
        const mirrorMatrix = Matrix.Zero();

        this._refractionRTT.onBeforeRender = () => {
            if (this._mesh) {
                isVisible = this._mesh.isVisible;
                this._mesh.isVisible = false;
            }

            // Clip plane
            if (!this.disableClipPlane) {
                clipPlane = scene.clipPlane;

                const positiony = this._mesh ? this._mesh.absolutePosition.y : 0.0;
                scene.clipPlane = Plane.FromPositionAndNormal(new Vector3(0, positiony + 0.05, 0), new Vector3(0, 1, 0));
            }
        };

        this._refractionRTT.onAfterRender = () => {
            if (this._mesh) {
                this._mesh.isVisible = isVisible;
            }

            // Clip plane
            if (!this.disableClipPlane) {
                scene.clipPlane = clipPlane;
            }
        };

        this._reflectionRTT.onBeforeRender = () => {
            if (this._mesh) {
                isVisible = this._mesh.isVisible;
                this._mesh.isVisible = false;
            }

            // Clip plane
            if (!this.disableClipPlane) {
                clipPlane = scene.clipPlane;

                const positiony = this._mesh ? this._mesh.absolutePosition.y : 0.0;
                scene.clipPlane = Plane.FromPositionAndNormal(new Vector3(0, positiony - 0.05, 0), new Vector3(0, -1, 0));

                Matrix.ReflectionToRef(scene.clipPlane, mirrorMatrix);
            }

            // Transform
            savedViewMatrix = scene.getViewMatrix();

            mirrorMatrix.multiplyToRef(savedViewMatrix, this._reflectionTransform);
            scene.setTransformMatrix(this._reflectionTransform, scene.getProjectionMatrix());
            scene._mirroredCameraPosition = Vector3.TransformCoordinates((<Camera>scene.activeCamera).position, mirrorMatrix);
        };

        this._reflectionRTT.onAfterRender = () => {
            if (this._mesh) {
                this._mesh.isVisible = isVisible;
            }

            // Clip plane
            scene.clipPlane = clipPlane;

            // Transform
            scene.setTransformMatrix(savedViewMatrix, scene.getProjectionMatrix());
            scene._mirroredCameraPosition = null;
        };
    }

    public getAnimatables(): IAnimatable[] {
        const results = [];

        if (this.bumpTexture && this.bumpTexture.animations && this.bumpTexture.animations.length > 0) {
            results.push(this.bumpTexture);
        }
        if (this._reflectionRTT && this._reflectionRTT.animations && this._reflectionRTT.animations.length > 0) {
            results.push(this._reflectionRTT);
        }
        if (this._refractionRTT && this._refractionRTT.animations && this._refractionRTT.animations.length > 0) {
            results.push(this._refractionRTT);
        }

        return results;
    }

    public getActiveTextures(): BaseTexture[] {
        const activeTextures = super.getActiveTextures();

        if (this._bumpTexture) {
            activeTextures.push(this._bumpTexture);
        }

        return activeTextures;
    }

    public hasTexture(texture: BaseTexture): boolean {
        if (super.hasTexture(texture)) {
            return true;
        }

        if (this._bumpTexture === texture) {
            return true;
        }

        return false;
    }

    public dispose(forceDisposeEffect?: boolean): void {
        if (this.bumpTexture) {
            this.bumpTexture.dispose();
        }

        let index = this.getScene().customRenderTargets.indexOf(<RenderTargetTexture>this._refractionRTT);
        if (index != -1) {
            this.getScene().customRenderTargets.splice(index, 1);
        }
        index = -1;
        index = this.getScene().customRenderTargets.indexOf(<RenderTargetTexture>this._reflectionRTT);
        if (index != -1) {
            this.getScene().customRenderTargets.splice(index, 1);
        }

        if (this._reflectionRTT) {
            this._reflectionRTT.dispose();
        }
        if (this._refractionRTT) {
            this._refractionRTT.dispose();
        }

        // Remove image-processing observer
        if (this._imageProcessingConfiguration && this._imageProcessingObserver) {
            this._imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingObserver);
        }

        super.dispose(forceDisposeEffect);
    }

    public clone(name: string): WaterMaterial {
        return SerializationHelper.Clone(() => new WaterMaterial(name, this.getScene()), this);
    }

    public serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.WaterMaterial";

        serializationObject.renderList = [];
        if (this._refractionRTT && this._refractionRTT.renderList) {
            for (let i = 0; i < this._refractionRTT.renderList.length; i++) {
                serializationObject.renderList.push(this._refractionRTT.renderList[i].id);
            }
        }

        return serializationObject;
    }

    public getClassName(): string {
        return "WaterMaterial";
    }

    // Statics
    public static Parse(source: any, scene: Scene, rootUrl: string): WaterMaterial {
        const mat = SerializationHelper.Parse(() => new WaterMaterial(source.name, scene), source, scene, rootUrl);
        mat._waitingRenderList = source.renderList;

        return mat;
    }

    public static CreateDefaultMesh(name: string, scene: Scene): Mesh {
        const mesh = CreateGround(name, { width: 512, height: 512, subdivisions: 32, updatable: false }, scene);
        return mesh;
    }
}

RegisterClass("BABYLON.WaterMaterial", WaterMaterial);
