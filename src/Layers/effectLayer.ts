import { serialize, serializeAsColor4, serializeAsCameraReference } from "../Misc/decorators";
import { Tools } from "../Misc/tools";
import { SmartArray } from "../Misc/smartArray";
import { Observable } from "../Misc/observable";
import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { Scene } from "../scene";
import { ISize } from "../Maths/math.size";
import { Color4 } from '../Maths/math.color';
import { Engine } from "../Engines/engine";
import { EngineStore } from "../Engines/engineStore";
import { VertexBuffer } from "../Meshes/buffer";
import { SubMesh } from "../Meshes/subMesh";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { PostProcess } from "../PostProcesses/postProcess";
import { BaseTexture } from "../Materials/Textures/baseTexture";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { Effect } from "../Materials/effect";
import { Material } from "../Materials/material";
import { MaterialHelper } from "../Materials/materialHelper";
import { Constants } from "../Engines/constants";

import "../Shaders/glowMapGeneration.fragment";
import "../Shaders/glowMapGeneration.vertex";
import { _DevTools } from '../Misc/devTools';
import { DataBuffer } from '../Meshes/dataBuffer';
import { EffectFallbacks } from '../Materials/effectFallbacks';

/**
 * Effect layer options. This helps customizing the behaviour
 * of the effect layer.
 */
export interface IEffectLayerOptions {
    /**
     * Multiplication factor apply to the canvas size to compute the render target size
     * used to generated the objects (the smaller the faster).
     */
    mainTextureRatio: number;

    /**
     * Enforces a fixed size texture to ensure effect stability across devices.
     */
    mainTextureFixedSize?: number;

    /**
     * Alpha blending mode used to apply the blur. Default depends of the implementation.
     */
    alphaBlendingMode: number;

    /**
     * The camera attached to the layer.
     */
    camera: Nullable<Camera>;

    /**
     * The rendering group to draw the layer in.
     */
    renderingGroupId: number;
}

/**
 * The effect layer Helps adding post process effect blended with the main pass.
 *
 * This can be for instance use to generate glow or higlight effects on the scene.
 *
 * The effect layer class can not be used directly and is intented to inherited from to be
 * customized per effects.
 */
export abstract class EffectLayer {

    private _vertexBuffers: { [key: string]: Nullable<VertexBuffer> } = {};
    private _indexBuffer: Nullable<DataBuffer>;
    private _cachedDefines: string;
    private _effectLayerMapGenerationEffect: Effect;
    private _effectLayerOptions: IEffectLayerOptions;
    private _mergeEffect: Effect;

    protected _scene: Scene;
    protected _engine: Engine;
    protected _maxSize: number = 0;
    protected _mainTextureDesiredSize: ISize = { width: 0, height: 0 };
    protected _mainTexture: RenderTargetTexture;
    protected _shouldRender = true;
    protected _postProcesses: PostProcess[] = [];
    protected _textures: BaseTexture[] = [];
    protected _emissiveTextureAndColor: { texture: Nullable<BaseTexture>, color: Color4 } = { texture: null, color: new Color4() };

    /**
     * The name of the layer
     */
    @serialize()
    public name: string;

    /**
     * The clear color of the texture used to generate the glow map.
     */
    @serializeAsColor4()
    public neutralColor: Color4 = new Color4();

    /**
     * Specifies whether the highlight layer is enabled or not.
     */
    @serialize()
    public isEnabled: boolean = true;

    /**
     * Gets the camera attached to the layer.
     */
    @serializeAsCameraReference()
    public get camera(): Nullable<Camera> {
        return this._effectLayerOptions.camera;
    }

    /**
     * Gets the rendering group id the layer should render in.
     */
    @serialize()
    public get renderingGroupId(): number {
        return this._effectLayerOptions.renderingGroupId;
    }
    public set renderingGroupId(renderingGroupId: number) {
        this._effectLayerOptions.renderingGroupId = renderingGroupId;
    }

    /**
     * An event triggered when the effect layer has been disposed.
     */
    public onDisposeObservable = new Observable<EffectLayer>();

    /**
     * An event triggered when the effect layer is about rendering the main texture with the glowy parts.
     */
    public onBeforeRenderMainTextureObservable = new Observable<EffectLayer>();

    /**
     * An event triggered when the generated texture is being merged in the scene.
     */
    public onBeforeComposeObservable = new Observable<EffectLayer>();

    /**
     * An event triggered when the mesh is rendered into the effect render target.
     */
    public onBeforeRenderMeshToEffect = new Observable<AbstractMesh>();

    /**
     * An event triggered after the mesh has been rendered into the effect render target.
     */
    public onAfterRenderMeshToEffect = new Observable<AbstractMesh>();

    /**
     * An event triggered when the generated texture has been merged in the scene.
     */
    public onAfterComposeObservable = new Observable<EffectLayer>();

    /**
     * An event triggered when the efffect layer changes its size.
     */
    public onSizeChangedObservable = new Observable<EffectLayer>();

    /** @hidden */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _DevTools.WarnImport("EffectLayerSceneComponent");
    }

    /**
     * Instantiates a new effect Layer and references it in the scene.
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     */
    constructor(
        /** The Friendly of the effect in the scene */
        name: string,
        scene: Scene) {
        this.name = name;

        this._scene = scene || EngineStore.LastCreatedScene;
        EffectLayer._SceneComponentInitialization(this._scene);

        this._engine = this._scene.getEngine();
        this._maxSize = this._engine.getCaps().maxTextureSize;
        this._scene.effectLayers.push(this);

        // Generate Buffers
        this._generateIndexBuffer();
        this._generateVertexBuffer();
    }

    /**
     * Get the effect name of the layer.
     * @return The effect name
     */
    public abstract getEffectName(): string;

    /**
     * Checks for the readiness of the element composing the layer.
     * @param subMesh the mesh to check for
     * @param useInstances specify whether or not to use instances to render the mesh
     * @return true if ready otherwise, false
     */
    public abstract isReady(subMesh: SubMesh, useInstances: boolean): boolean;

    /**
     * Returns whether or nood the layer needs stencil enabled during the mesh rendering.
     * @returns true if the effect requires stencil during the main canvas render pass.
     */
    public abstract needStencil(): boolean;

    /**
     * Create the merge effect. This is the shader use to blit the information back
     * to the main canvas at the end of the scene rendering.
     * @returns The effect containing the shader used to merge the effect on the  main canvas
     */
    protected abstract _createMergeEffect(): Effect;

    /**
     * Creates the render target textures and post processes used in the effect layer.
     */
    protected abstract _createTextureAndPostProcesses(): void;

    /**
     * Implementation specific of rendering the generating effect on the main canvas.
     * @param effect The effect used to render through
     */
    protected abstract _internalRender(effect: Effect): void;

    /**
     * Sets the required values for both the emissive texture and and the main color.
     */
    protected abstract _setEmissiveTextureAndColor(mesh: Mesh, subMesh: SubMesh, material: Material): void;

    /**
     * Free any resources and references associated to a mesh.
     * Internal use
     * @param mesh The mesh to free.
     */
    public abstract _disposeMesh(mesh: Mesh): void;

    /**
     * Serializes this layer (Glow or Highlight for example)
     * @returns a serialized layer object
     */
    public abstract serialize?(): any;

    /**
     * Initializes the effect layer with the required options.
     * @param options Sets of none mandatory options to use with the layer (see IEffectLayerOptions for more information)
     */
    protected _init(options: Partial<IEffectLayerOptions>): void {
        // Adapt options
        this._effectLayerOptions = {
            mainTextureRatio: 0.5,
            alphaBlendingMode: Constants.ALPHA_COMBINE,
            camera: null,
            renderingGroupId: -1,
            ...options,
        };

        this._setMainTextureSize();
        this._createMainTexture();
        this._createTextureAndPostProcesses();
        this._mergeEffect = this._createMergeEffect();
    }

    /**
     * Generates the index buffer of the full screen quad blending to the main canvas.
     */
    private _generateIndexBuffer(): void {
        // Indices
        var indices = [];
        indices.push(0);
        indices.push(1);
        indices.push(2);

        indices.push(0);
        indices.push(2);
        indices.push(3);

        this._indexBuffer = this._engine.createIndexBuffer(indices);
    }

    /**
     * Generates the vertex buffer of the full screen quad blending to the main canvas.
     */
    private _generateVertexBuffer(): void {
        // VBO
        var vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);

        var vertexBuffer = new VertexBuffer(this._engine, vertices, VertexBuffer.PositionKind, false, false, 2);
        this._vertexBuffers[VertexBuffer.PositionKind] = vertexBuffer;
    }

    /**
     * Sets the main texture desired size which is the closest power of two
     * of the engine canvas size.
     */
    private _setMainTextureSize(): void {
        if (this._effectLayerOptions.mainTextureFixedSize) {
            this._mainTextureDesiredSize.width = this._effectLayerOptions.mainTextureFixedSize;
            this._mainTextureDesiredSize.height = this._effectLayerOptions.mainTextureFixedSize;
        }
        else {
            this._mainTextureDesiredSize.width = this._engine.getRenderWidth() * this._effectLayerOptions.mainTextureRatio;
            this._mainTextureDesiredSize.height = this._engine.getRenderHeight() * this._effectLayerOptions.mainTextureRatio;

            this._mainTextureDesiredSize.width = this._engine.needPOTTextures ? Engine.GetExponentOfTwo(this._mainTextureDesiredSize.width, this._maxSize) : this._mainTextureDesiredSize.width;
            this._mainTextureDesiredSize.height = this._engine.needPOTTextures ? Engine.GetExponentOfTwo(this._mainTextureDesiredSize.height, this._maxSize) : this._mainTextureDesiredSize.height;
        }

        this._mainTextureDesiredSize.width = Math.floor(this._mainTextureDesiredSize.width);
        this._mainTextureDesiredSize.height = Math.floor(this._mainTextureDesiredSize.height);
    }

    /**
     * Creates the main texture for the effect layer.
     */
    protected _createMainTexture(): void {
        this._mainTexture = new RenderTargetTexture("HighlightLayerMainRTT",
            {
                width: this._mainTextureDesiredSize.width,
                height: this._mainTextureDesiredSize.height
            },
            this._scene,
            false,
            true,
            Constants.TEXTURETYPE_UNSIGNED_INT);
        this._mainTexture.activeCamera = this._effectLayerOptions.camera;
        this._mainTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._mainTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._mainTexture.anisotropicFilteringLevel = 1;
        this._mainTexture.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        this._mainTexture.renderParticles = false;
        this._mainTexture.renderList = null;
        this._mainTexture.ignoreCameraViewport = true;

        // Custom render function
        this._mainTexture.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void => {
            this.onBeforeRenderMainTextureObservable.notifyObservers(this);

            var index: number;

            let engine = this._scene.getEngine();

            if (depthOnlySubMeshes.length) {
                engine.setColorWrite(false);
                for (index = 0; index < depthOnlySubMeshes.length; index++) {
                    this._renderSubMesh(depthOnlySubMeshes.data[index]);
                }
                engine.setColorWrite(true);
            }

            for (index = 0; index < opaqueSubMeshes.length; index++) {
                this._renderSubMesh(opaqueSubMeshes.data[index]);
            }

            for (index = 0; index < alphaTestSubMeshes.length; index++) {
                this._renderSubMesh(alphaTestSubMeshes.data[index]);
            }

            const previousAlphaMode = engine.getAlphaMode();

            for (index = 0; index < transparentSubMeshes.length; index++) {
                this._renderSubMesh(transparentSubMeshes.data[index], true);
            }

            engine.setAlphaMode(previousAlphaMode);
        };

        this._mainTexture.onClearObservable.add((engine: Engine) => {
            engine.clear(this.neutralColor, true, true, true);
        });
    }

    /**
     * Adds specific effects defines.
     * @param defines The defines to add specifics to.
     */
    protected _addCustomEffectDefines(defines: string[]): void {
        // Nothing to add by default.
    }

    /**
     * Checks for the readiness of the element composing the layer.
     * @param subMesh the mesh to check for
     * @param useInstances specify whether or not to use instances to render the mesh
     * @param emissiveTexture the associated emissive texture used to generate the glow
     * @return true if ready otherwise, false
     */
    protected _isReady(subMesh: SubMesh, useInstances: boolean, emissiveTexture: Nullable<BaseTexture>): boolean {
        let material = subMesh.getMaterial();

        if (!material) {
            return false;
        }

        if (!material.isReadyForSubMesh(subMesh.getMesh(), subMesh, useInstances)) {
            return false;
        }

        var defines: string[] = [];

        var attribs = [VertexBuffer.PositionKind];

        var mesh = subMesh.getMesh();
        var uv1 = false;
        var uv2 = false;

        // Diffuse
        if (material) {
            const needAlphaTest = material.needAlphaTesting();

            const diffuseTexture = material.getAlphaTestTexture();
            const needAlphaBlendFromDiffuse = diffuseTexture && diffuseTexture.hasAlpha &&
                ((material as any).useAlphaFromDiffuseTexture || (material as any)._useAlphaFromAlbedoTexture);

            if (diffuseTexture && (needAlphaTest || needAlphaBlendFromDiffuse)) {
                defines.push("#define DIFFUSE");
                if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind) &&
                    diffuseTexture.coordinatesIndex === 1) {
                    defines.push("#define DIFFUSEUV2");
                    uv2 = true;
                }
                else if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                    defines.push("#define DIFFUSEUV1");
                    uv1 = true;
                }

                if (needAlphaTest) {
                    defines.push("#define ALPHATEST");
                    defines.push("#define ALPHATESTVALUE 0.4");
                }
            }

            var opacityTexture = (material as any).opacityTexture;
            if (opacityTexture) {
                defines.push("#define OPACITY");
                if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind) &&
                    opacityTexture.coordinatesIndex === 1) {
                    defines.push("#define OPACITYUV2");
                    uv2 = true;
                }
                else if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                    defines.push("#define OPACITYUV1");
                    uv1 = true;
                }
            }
        }

        // Emissive
        if (emissiveTexture) {
            defines.push("#define EMISSIVE");
            if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind) &&
                emissiveTexture.coordinatesIndex === 1) {
                defines.push("#define EMISSIVEUV2");
                uv2 = true;
            }
            else if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                defines.push("#define EMISSIVEUV1");
                uv1 = true;
            }
        }

        // Vertex
        if (mesh.isVerticesDataPresent(VertexBuffer.ColorKind) && mesh.hasVertexAlpha) {
            attribs.push(VertexBuffer.ColorKind);
            defines.push("#define VERTEXALPHA");
        }

        if (uv1) {
            attribs.push(VertexBuffer.UVKind);
            defines.push("#define UV1");
        }
        if (uv2) {
            attribs.push(VertexBuffer.UV2Kind);
            defines.push("#define UV2");
        }

        // Bones
        const fallbacks = new EffectFallbacks();
        if (mesh.useBones && mesh.computeBonesUsingShaders) {
            attribs.push(VertexBuffer.MatricesIndicesKind);
            attribs.push(VertexBuffer.MatricesWeightsKind);
            if (mesh.numBoneInfluencers > 4) {
                attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                attribs.push(VertexBuffer.MatricesWeightsExtraKind);
            }

            defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);

            let skeleton = mesh.skeleton;
            if (skeleton && skeleton.isUsingTextureForMatrices) {
                defines.push("#define BONETEXTURE");
            } else {
                defines.push("#define BonesPerMesh " + (skeleton ? (skeleton.bones.length + 1) : 0));
            }

            if (mesh.numBoneInfluencers > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }
        } else {
            defines.push("#define NUM_BONE_INFLUENCERS 0");
        }

        // Morph targets
        var manager = (<Mesh>mesh).morphTargetManager;
        let morphInfluencers = 0;
        if (manager) {
            if (manager.numInfluencers > 0) {
                defines.push("#define MORPHTARGETS");
                morphInfluencers = manager.numInfluencers;
                defines.push("#define NUM_MORPH_INFLUENCERS " + morphInfluencers);
                MaterialHelper.PrepareAttributesForMorphTargetsInfluencers(attribs, mesh, morphInfluencers);
            }
        }

        // Instances
        if (useInstances) {
            defines.push("#define INSTANCES");
            MaterialHelper.PushAttributesForInstances(attribs);
            if (subMesh.getRenderingMesh().hasThinInstances) {
                defines.push("#define THIN_INSTANCES");
            }
        }

        this._addCustomEffectDefines(defines);

        // Get correct effect
        var join = defines.join("\n");
        if (this._cachedDefines !== join) {
            this._cachedDefines = join;
            this._effectLayerMapGenerationEffect = this._scene.getEngine().createEffect("glowMapGeneration",
                attribs,
                ["world", "mBones", "viewProjection",
                    "glowColor", "morphTargetInfluences", "boneTextureWidth",
                    "diffuseMatrix", "emissiveMatrix", "opacityMatrix", "opacityIntensity"],
                ["diffuseSampler", "emissiveSampler", "opacitySampler", "boneSampler"], join,
                fallbacks, undefined, undefined, { maxSimultaneousMorphTargets: morphInfluencers });
        }

        return this._effectLayerMapGenerationEffect.isReady();
    }

    /**
     * Renders the glowing part of the scene by blending the blurred glowing meshes on top of the rendered scene.
     */
    public render(): void {
        var currentEffect = this._mergeEffect;

        // Check
        if (!currentEffect.isReady()) {
            return;
        }

        for (var i = 0; i < this._postProcesses.length; i++) {
            if (!this._postProcesses[i].isReady()) {
                return;
            }
        }

        var engine = this._scene.getEngine();

        this.onBeforeComposeObservable.notifyObservers(this);

        // Render
        engine.enableEffect(currentEffect);
        engine.setState(false);

        // VBOs
        engine.bindBuffers(this._vertexBuffers, this._indexBuffer, currentEffect);

        // Cache
        var previousAlphaMode = engine.getAlphaMode();

        // Go Blend.
        engine.setAlphaMode(this._effectLayerOptions.alphaBlendingMode);

        // Blends the map on the main canvas.
        this._internalRender(currentEffect);

        // Restore Alpha
        engine.setAlphaMode(previousAlphaMode);

        this.onAfterComposeObservable.notifyObservers(this);

        // Handle size changes.
        var size = this._mainTexture.getSize();
        this._setMainTextureSize();
        if (size.width !== this._mainTextureDesiredSize.width || size.height !== this._mainTextureDesiredSize.height) {
            // Recreate RTT and post processes on size change.
            this.onSizeChangedObservable.notifyObservers(this);
            this._disposeTextureAndPostProcesses();
            this._createMainTexture();
            this._createTextureAndPostProcesses();
        }
    }

    /**
     * Determine if a given mesh will be used in the current effect.
     * @param mesh mesh to test
     * @returns true if the mesh will be used
     */
    public hasMesh(mesh: AbstractMesh): boolean {
        if (this.renderingGroupId === -1 || mesh.renderingGroupId === this.renderingGroupId) {
            return true;
        }
        return false;
    }

    /**
     * Returns true if the layer contains information to display, otherwise false.
     * @returns true if the glow layer should be rendered
     */
    public shouldRender(): boolean {
        return this.isEnabled && this._shouldRender;
    }

    /**
     * Returns true if the mesh should render, otherwise false.
     * @param mesh The mesh to render
     * @returns true if it should render otherwise false
     */
    protected _shouldRenderMesh(mesh: AbstractMesh): boolean {
        return true;
    }

    /**
     * Returns true if the mesh can be rendered, otherwise false.
     * @param mesh The mesh to render
     * @param material The material used on the mesh
     * @returns true if it can be rendered otherwise false
     */
    protected _canRenderMesh(mesh: AbstractMesh, material: Material): boolean {
        return !material.needAlphaBlendingForMesh(mesh);
    }

    /**
     * Returns true if the mesh should render, otherwise false.
     * @param mesh The mesh to render
     * @returns true if it should render otherwise false
     */
    protected _shouldRenderEmissiveTextureForMesh(): boolean {
        return true;
    }

    /**
     * Renders the submesh passed in parameter to the generation map.
     */
    protected _renderSubMesh(subMesh: SubMesh, enableAlphaMode: boolean = false): void {
        if (!this.shouldRender()) {
            return;
        }

        var material = subMesh.getMaterial();
        var ownerMesh = subMesh.getMesh();
        var replacementMesh = subMesh.getReplacementMesh();
        var renderingMesh = subMesh.getRenderingMesh();
        var effectiveMesh = subMesh.getEffectiveMesh();
        var scene = this._scene;
        var engine = scene.getEngine();

        effectiveMesh._internalAbstractMeshDataInfo._isActiveIntermediate = false;

        if (!material) {
            return;
        }

        // Do not block in blend mode.
        if (!this._canRenderMesh(renderingMesh, material)) {
            return;
        }

        // Culling
        let sideOrientation = renderingMesh.overrideMaterialSideOrientation ?? material.sideOrientation;
        const mainDeterminant = renderingMesh._getWorldMatrixDeterminant();
        if (mainDeterminant < 0) {
            sideOrientation = (sideOrientation === Material.ClockWiseSideOrientation ? Material.CounterClockWiseSideOrientation : Material.ClockWiseSideOrientation);
        }

        const reverse = sideOrientation === Material.ClockWiseSideOrientation;
        engine.setState(material.backFaceCulling, material.zOffset, undefined, reverse);

        // Managing instances
        var batch = renderingMesh._getInstancesRenderList(subMesh._id, !!replacementMesh);
        if (batch.mustReturn) {
            return;
        }

        // Early Exit per mesh
        if (!this._shouldRenderMesh(renderingMesh)) {
            return;
        }

        var hardwareInstancedRendering = batch.hardwareInstancedRendering[subMesh._id] || renderingMesh.hasThinInstances;

        this._setEmissiveTextureAndColor(renderingMesh, subMesh, material);

        this.onBeforeRenderMeshToEffect.notifyObservers(ownerMesh);

        if (this._useMeshMaterial(renderingMesh)) {
            renderingMesh.render(subMesh, hardwareInstancedRendering, replacementMesh || undefined);
        }
        else if (this._isReady(subMesh, hardwareInstancedRendering, this._emissiveTextureAndColor.texture)) {
            engine.enableEffect(this._effectLayerMapGenerationEffect);
            renderingMesh._bind(subMesh, this._effectLayerMapGenerationEffect, Material.TriangleFillMode);

            this._effectLayerMapGenerationEffect.setMatrix("viewProjection", scene.getTransformMatrix());

            this._effectLayerMapGenerationEffect.setFloat4("glowColor",
                this._emissiveTextureAndColor.color.r,
                this._emissiveTextureAndColor.color.g,
                this._emissiveTextureAndColor.color.b,
                this._emissiveTextureAndColor.color.a);

            const needAlphaTest = material.needAlphaTesting();

            const diffuseTexture = material.getAlphaTestTexture();
            const needAlphaBlendFromDiffuse = diffuseTexture && diffuseTexture.hasAlpha &&
                ((material as any).useAlphaFromDiffuseTexture || (material as any)._useAlphaFromAlbedoTexture);

            if (diffuseTexture && (needAlphaTest || needAlphaBlendFromDiffuse)) {
                this._effectLayerMapGenerationEffect.setTexture("diffuseSampler", diffuseTexture);
                const textureMatrix = diffuseTexture.getTextureMatrix();

                if (textureMatrix) {
                    this._effectLayerMapGenerationEffect.setMatrix("diffuseMatrix", textureMatrix);
                }
            }

            const opacityTexture = (material as any).opacityTexture;
            if (opacityTexture) {
                this._effectLayerMapGenerationEffect.setTexture("opacitySampler", opacityTexture);
                this._effectLayerMapGenerationEffect.setFloat("opacityIntensity", opacityTexture.level);
                const textureMatrix = opacityTexture.getTextureMatrix();
                if (textureMatrix) {
                    this._effectLayerMapGenerationEffect.setMatrix("opacityMatrix", textureMatrix);
                }
            }

            // Glow emissive only
            if (this._emissiveTextureAndColor.texture) {
                this._effectLayerMapGenerationEffect.setTexture("emissiveSampler", this._emissiveTextureAndColor.texture);
                this._effectLayerMapGenerationEffect.setMatrix("emissiveMatrix", this._emissiveTextureAndColor.texture.getTextureMatrix());
            }

            // Bones
            if (renderingMesh.useBones && renderingMesh.computeBonesUsingShaders && renderingMesh.skeleton) {
                const skeleton = renderingMesh.skeleton;

                if (skeleton.isUsingTextureForMatrices) {
                    const boneTexture = skeleton.getTransformMatrixTexture(renderingMesh);
                    if (!boneTexture) {
                        return;
                    }

                    this._effectLayerMapGenerationEffect.setTexture("boneSampler", boneTexture);
                    this._effectLayerMapGenerationEffect.setFloat("boneTextureWidth", 4.0 * (skeleton.bones.length + 1));
                } else {
                    this._effectLayerMapGenerationEffect.setMatrices("mBones", skeleton.getTransformMatrices((renderingMesh)));
                }
            }

            // Morph targets
            MaterialHelper.BindMorphTargetParameters(renderingMesh, this._effectLayerMapGenerationEffect);

            // Alpha mode
            if (enableAlphaMode) {
                engine.setAlphaMode(material.alphaMode);
            }

            // Draw
            renderingMesh._processRendering(effectiveMesh, subMesh, this._effectLayerMapGenerationEffect, material.fillMode, batch, hardwareInstancedRendering,
                (isInstance, world) => this._effectLayerMapGenerationEffect.setMatrix("world", world));
        } else {
            // Need to reset refresh rate of the main map
            this._mainTexture.resetRefreshCounter();
        }

        this.onAfterRenderMeshToEffect.notifyObservers(ownerMesh);
    }

    /**
     * Defines whether the current material of the mesh should be use to render the effect.
     * @param mesh defines the current mesh to render
     */
    protected _useMeshMaterial(mesh: AbstractMesh): boolean {
        return false;
    }

    /**
     * Rebuild the required buffers.
     * @hidden Internal use only.
     */
    public _rebuild(): void {
        let vb = this._vertexBuffers[VertexBuffer.PositionKind];

        if (vb) {
            vb._rebuild();
        }

        this._generateIndexBuffer();
    }

    /**
     * Dispose only the render target textures and post process.
     */
    private _disposeTextureAndPostProcesses(): void {
        this._mainTexture.dispose();

        for (var i = 0; i < this._postProcesses.length; i++) {
            if (this._postProcesses[i]) {
                this._postProcesses[i].dispose();
            }
        }
        this._postProcesses = [];

        for (var i = 0; i < this._textures.length; i++) {
            if (this._textures[i]) {
                this._textures[i].dispose();
            }
        }
        this._textures = [];
    }

    /**
     * Dispose the highlight layer and free resources.
     */
    public dispose(): void {
        var vertexBuffer = this._vertexBuffers[VertexBuffer.PositionKind];
        if (vertexBuffer) {
            vertexBuffer.dispose();
            this._vertexBuffers[VertexBuffer.PositionKind] = null;
        }

        if (this._indexBuffer) {
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }

        // Clean textures and post processes
        this._disposeTextureAndPostProcesses();

        // Remove from scene
        var index = this._scene.effectLayers.indexOf(this, 0);
        if (index > -1) {
            this._scene.effectLayers.splice(index, 1);
        }

        // Callback
        this.onDisposeObservable.notifyObservers(this);

        this.onDisposeObservable.clear();
        this.onBeforeRenderMainTextureObservable.clear();
        this.onBeforeComposeObservable.clear();
        this.onBeforeRenderMeshToEffect.clear();
        this.onAfterRenderMeshToEffect.clear();
        this.onAfterComposeObservable.clear();
        this.onSizeChangedObservable.clear();
    }

    /**
      * Gets the class name of the effect layer
      * @returns the string with the class name of the effect layer
      */
    public getClassName(): string {
        return "EffectLayer";
    }

    /**
     * Creates an effect layer from parsed effect layer data
     * @param parsedEffectLayer defines effect layer data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing the effect layer information
     * @returns a parsed effect Layer
     */
    public static Parse(parsedEffectLayer: any, scene: Scene, rootUrl: string): EffectLayer {
        var effectLayerType = Tools.Instantiate(parsedEffectLayer.customType);

        return effectLayerType.Parse(parsedEffectLayer, scene, rootUrl);
    }
}
