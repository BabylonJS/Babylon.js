import { serialize, serializeAsColor4, serializeAsCameraReference } from "../Misc/decorators";
import { Tools } from "../Misc/tools";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { Scene } from "../scene";
import type { ISize } from "../Maths/math.size";
import type { Color4 } from "../Maths/math.color";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { EngineStore } from "../Engines/engineStore";
import type { SubMesh } from "../Meshes/subMesh";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Mesh } from "../Meshes/mesh";
import type { PostProcess } from "../PostProcesses/postProcess";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import { Texture } from "../Materials/Textures/texture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { Effect } from "../Materials/effect";
import type { Material } from "../Materials/material";
import { Constants } from "../Engines/constants";

import { _WarnImport } from "../Misc/devTools";
import { GetExponentOfTwo } from "../Misc/tools.functions";
import type { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ThinEffectLayer } from "./thinEffectLayer";
import { UniqueIdGenerator } from "core/Misc/uniqueIdGenerator";

/**
 * Effect layer options. This helps customizing the behaviour
 * of the effect layer.
 */
export interface IEffectLayerOptions {
    /**
     * Multiplication factor apply to the canvas size to compute the render target size
     * used to generated the objects (the smaller the faster). Default: 0.5
     */
    mainTextureRatio: number;

    /**
     * Enforces a fixed size texture to ensure effect stability across devices. Default: undefined
     */
    mainTextureFixedSize?: number;

    /**
     * Alpha blending mode used to apply the blur. Default depends of the implementation. Default: ALPHA_COMBINE
     */
    alphaBlendingMode: number;

    /**
     * The camera attached to the layer. Default: null
     */
    camera: Nullable<Camera>;

    /**
     * The rendering group to draw the layer in. Default: -1
     */
    renderingGroupId: number;

    /**
     * The type of the main texture. Default: TEXTURETYPE_UNSIGNED_BYTE
     */
    mainTextureType: number;

    /**
     * The format of the main texture. Default: TEXTUREFORMAT_RGBA
     */
    mainTextureFormat: number;

    /**
     * Whether or not to generate a stencil buffer. Default: false
     */
    generateStencilBuffer: boolean;
}

/**
 * The effect layer Helps adding post process effect blended with the main pass.
 *
 * This can be for instance use to generate glow or highlight effects on the scene.
 *
 * The effect layer class can not be used directly and is intented to inherited from to be
 * customized per effects.
 */
export abstract class EffectLayer {
    private _effectLayerOptions: IEffectLayerOptions;
    protected _mainTextureCreatedSize: ISize = { width: 0, height: 0 };

    protected _scene: Scene;
    protected _engine: AbstractEngine;
    protected _maxSize: number = 0;
    protected _mainTextureDesiredSize: ISize = { width: 0, height: 0 };
    protected _mainTexture: RenderTargetTexture;
    protected get _shouldRender() {
        return this._thinEffectLayer._shouldRender;
    }
    protected set _shouldRender(value) {
        this._thinEffectLayer._shouldRender = value;
    }
    protected _postProcesses: PostProcess[] = [];
    protected _textures: BaseTexture[] = [];
    protected get _emissiveTextureAndColor(): { texture: Nullable<BaseTexture>; color: Color4 } {
        return this._thinEffectLayer._emissiveTextureAndColor;
    }
    protected set _emissiveTextureAndColor(value) {
        this._thinEffectLayer._emissiveTextureAndColor = value;
    }
    protected get _effectIntensity(): { [meshUniqueId: number]: number } {
        return this._thinEffectLayer._effectIntensity;
    }
    protected set _effectIntensity(value) {
        this._thinEffectLayer._effectIntensity = value;
    }
    protected readonly _thinEffectLayer: ThinEffectLayer;
    private readonly _internalThinEffectLayer: boolean;

    /**
     * Force all the effect layers to compile to glsl even on WebGPU engines.
     * False by default. This is mostly meant for backward compatibility.
     */
    public static get ForceGLSL() {
        return ThinEffectLayer.ForceGLSL;
    }

    public static set ForceGLSL(value: boolean) {
        ThinEffectLayer.ForceGLSL = value;
    }

    /**
     * The unique id of the layer
     */
    public readonly uniqueId = UniqueIdGenerator.UniqueId;

    /**
     * The name of the layer
     */
    @serialize()
    public get name() {
        return this._thinEffectLayer.name;
    }

    public set name(value: string) {
        this._thinEffectLayer.name = value;
    }

    /**
     * The clear color of the texture used to generate the glow map.
     */
    @serializeAsColor4()
    public get neutralColor(): Color4 {
        return this._thinEffectLayer.neutralColor;
    }

    public set neutralColor(value: Color4) {
        this._thinEffectLayer.neutralColor = value;
    }

    /**
     * Specifies whether the highlight layer is enabled or not.
     */
    @serialize()
    public get isEnabled(): boolean {
        return this._thinEffectLayer.isEnabled;
    }

    public set isEnabled(value: boolean) {
        this._thinEffectLayer.isEnabled = value;
    }

    /**
     * Gets the camera attached to the layer.
     */
    @serializeAsCameraReference()
    public get camera(): Nullable<Camera> {
        return this._thinEffectLayer.camera;
    }

    /**
     * Gets the rendering group id the layer should render in.
     */
    @serialize()
    public get renderingGroupId(): number {
        return this._thinEffectLayer.renderingGroupId;
    }
    public set renderingGroupId(renderingGroupId: number) {
        this._thinEffectLayer.renderingGroupId = renderingGroupId;
    }

    /**
     * Specifies if the bounding boxes should be rendered normally or if they should undergo the effect of the layer
     */
    @serialize()
    public get disableBoundingBoxesFromEffectLayer() {
        return this._thinEffectLayer.disableBoundingBoxesFromEffectLayer;
    }

    public set disableBoundingBoxesFromEffectLayer(value: boolean) {
        this._thinEffectLayer.disableBoundingBoxesFromEffectLayer = value;
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
     * An event triggered when the effect layer changes its size.
     */
    public onSizeChangedObservable = new Observable<EffectLayer>();

    /**
     * Gets the main texture where the effect is rendered
     */
    public get mainTexture() {
        return this._mainTexture;
    }

    protected get _shaderLanguage(): ShaderLanguage {
        return this._thinEffectLayer.shaderLanguage;
    }

    /**
     * Gets the shader language used in this material.
     */
    public get shaderLanguage(): ShaderLanguage {
        return this._thinEffectLayer.shaderLanguage;
    }

    /**
     * @internal
     */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _WarnImport("EffectLayerSceneComponent");
    };
    /**
     * Sets a specific material to be used to render a mesh/a list of meshes in the layer
     * @param mesh mesh or array of meshes
     * @param material material to use by the layer when rendering the mesh(es). If undefined is passed, the specific material created by the layer will be used.
     */
    public setMaterialForRendering(mesh: AbstractMesh | AbstractMesh[], material?: Material): void {
        this._thinEffectLayer.setMaterialForRendering(mesh, material);
    }

    /**
     * Gets the intensity of the effect for a specific mesh.
     * @param mesh The mesh to get the effect intensity for
     * @returns The intensity of the effect for the mesh
     */
    public getEffectIntensity(mesh: AbstractMesh) {
        return this._thinEffectLayer.getEffectIntensity(mesh);
    }

    /**
     * Sets the intensity of the effect for a specific mesh.
     * @param mesh The mesh to set the effect intensity for
     * @param intensity The intensity of the effect for the mesh
     */
    public setEffectIntensity(mesh: AbstractMesh, intensity: number): void {
        this._thinEffectLayer.setEffectIntensity(mesh, intensity);
    }

    /**
     * Instantiates a new effect Layer and references it in the scene.
     * @param name The name of the layer
     * @param scene The scene to use the layer in
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     * @param thinEffectLayer The thin instance of the effect layer (optional)
     */
    constructor(
        /** The Friendly of the effect in the scene */
        name: string,
        scene?: Scene,
        forceGLSL = false,
        thinEffectLayer?: ThinEffectLayer
    ) {
        this._internalThinEffectLayer = !thinEffectLayer;
        if (!thinEffectLayer) {
            thinEffectLayer = new ThinEffectLayer(name, scene, forceGLSL, false, this._importShadersAsync.bind(this));
            thinEffectLayer.getEffectName = this.getEffectName.bind(this);
            thinEffectLayer.isReady = this.isReady.bind(this);
            thinEffectLayer._createMergeEffect = this._createMergeEffect.bind(this);
            thinEffectLayer._createTextureAndPostProcesses = this._createTextureAndPostProcesses.bind(this);
            thinEffectLayer._internalCompose = this._internalRender.bind(this);
            thinEffectLayer._setEmissiveTextureAndColor = this._setEmissiveTextureAndColor.bind(this);
            thinEffectLayer._numInternalDraws = this._numInternalDraws.bind(this);
            thinEffectLayer._addCustomEffectDefines = this._addCustomEffectDefines.bind(this);
            thinEffectLayer.hasMesh = this.hasMesh.bind(this);
            thinEffectLayer.shouldRender = this.shouldRender.bind(this);
            thinEffectLayer._shouldRenderMesh = this._shouldRenderMesh.bind(this);
            thinEffectLayer._canRenderMesh = this._canRenderMesh.bind(this);
            thinEffectLayer._useMeshMaterial = this._useMeshMaterial.bind(this);
        }

        this._thinEffectLayer = thinEffectLayer;
        this.name = name;

        this._scene = scene || <Scene>EngineStore.LastCreatedScene;
        EffectLayer._SceneComponentInitialization(this._scene);

        this._engine = this._scene.getEngine();
        this._maxSize = this._engine.getCaps().maxTextureSize;
        this._scene.addEffectLayer(this);

        this._thinEffectLayer.onDisposeObservable.add(() => {
            this.onDisposeObservable.notifyObservers(this);
        });

        this._thinEffectLayer.onBeforeRenderLayerObservable.add(() => {
            this.onBeforeRenderMainTextureObservable.notifyObservers(this);
        });

        this._thinEffectLayer.onBeforeComposeObservable.add(() => {
            this.onBeforeComposeObservable.notifyObservers(this);
        });

        this._thinEffectLayer.onBeforeRenderMeshToEffect.add((mesh) => {
            this.onBeforeRenderMeshToEffect.notifyObservers(mesh);
        });

        this._thinEffectLayer.onAfterRenderMeshToEffect.add((mesh) => {
            this.onAfterRenderMeshToEffect.notifyObservers(mesh);
        });

        this._thinEffectLayer.onAfterComposeObservable.add(() => {
            this.onAfterComposeObservable.notifyObservers(this);
        });
    }

    protected get _shadersLoaded() {
        return this._thinEffectLayer._shadersLoaded;
    }

    protected set _shadersLoaded(value: boolean) {
        this._thinEffectLayer._shadersLoaded = value;
    }

    /**
     * Get the effect name of the layer.
     * @returns The effect name
     */
    public abstract getEffectName(): string;

    /**
     * Checks for the readiness of the element composing the layer.
     * @param subMesh the mesh to check for
     * @param useInstances specify whether or not to use instances to render the mesh
     * @returns true if ready otherwise, false
     */
    public abstract isReady(subMesh: SubMesh, useInstances: boolean): boolean;

    /**
     * Returns whether or not the layer needs stencil enabled during the mesh rendering.
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
     * @param renderNum Index of the _internalRender call (0 for the first time _internalRender is called, 1 for the second time, etc. _internalRender is called the number of times returned by _numInternalDraws())
     */
    protected abstract _internalRender(effect: Effect, renderIndex: number): void;

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
     * Number of times _internalRender will be called. Some effect layers need to render the mesh several times, so they should override this method with the number of times the mesh should be rendered
     * @returns Number of times a mesh must be rendered in the layer
     */
    protected _numInternalDraws(): number {
        return this._internalThinEffectLayer ? 1 : this._thinEffectLayer._numInternalDraws();
    }

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
            mainTextureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            mainTextureFormat: Constants.TEXTUREFORMAT_RGBA,
            generateStencilBuffer: false,
            ...options,
        };

        this._setMainTextureSize();
        this._thinEffectLayer._init(options);
        this._createMainTexture();
        this._createTextureAndPostProcesses();
    }

    /**
     * Sets the main texture desired size which is the closest power of two
     * of the engine canvas size.
     */
    private _setMainTextureSize(): void {
        if (this._effectLayerOptions.mainTextureFixedSize) {
            this._mainTextureDesiredSize.width = this._effectLayerOptions.mainTextureFixedSize;
            this._mainTextureDesiredSize.height = this._effectLayerOptions.mainTextureFixedSize;
        } else {
            this._mainTextureDesiredSize.width = this._engine.getRenderWidth() * this._effectLayerOptions.mainTextureRatio;
            this._mainTextureDesiredSize.height = this._engine.getRenderHeight() * this._effectLayerOptions.mainTextureRatio;

            this._mainTextureDesiredSize.width = this._engine.needPOTTextures
                ? GetExponentOfTwo(this._mainTextureDesiredSize.width, this._maxSize)
                : this._mainTextureDesiredSize.width;
            this._mainTextureDesiredSize.height = this._engine.needPOTTextures
                ? GetExponentOfTwo(this._mainTextureDesiredSize.height, this._maxSize)
                : this._mainTextureDesiredSize.height;
        }

        this._mainTextureDesiredSize.width = Math.floor(this._mainTextureDesiredSize.width);
        this._mainTextureDesiredSize.height = Math.floor(this._mainTextureDesiredSize.height);
    }

    /**
     * Creates the main texture for the effect layer.
     */
    protected _createMainTexture(): void {
        this._mainTexture = new RenderTargetTexture(
            "EffectLayerMainRTT",
            {
                width: this._mainTextureDesiredSize.width,
                height: this._mainTextureDesiredSize.height,
            },
            this._scene,
            {
                type: this._effectLayerOptions.mainTextureType,
                format: this._effectLayerOptions.mainTextureFormat,
                samplingMode: Texture.TRILINEAR_SAMPLINGMODE,
                generateStencilBuffer: this._effectLayerOptions.generateStencilBuffer,
                existingObjectRenderer: this._thinEffectLayer.objectRenderer,
            }
        );
        this._mainTexture.activeCamera = this._effectLayerOptions.camera;
        this._mainTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
        this._mainTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._mainTexture.anisotropicFilteringLevel = 1;
        this._mainTexture.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        this._mainTexture.renderParticles = false;
        this._mainTexture.renderList = null;
        this._mainTexture.ignoreCameraViewport = true;

        this._mainTexture.onClearObservable.add((engine: AbstractEngine) => {
            engine.clear(this.neutralColor, true, true, true);
        });
    }

    /**
     * Adds specific effects defines.
     * @param defines The defines to add specifics to.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _addCustomEffectDefines(defines: string[]): void {
        // Nothing to add by default.
    }

    /**
     * Checks for the readiness of the element composing the layer.
     * @param subMesh the mesh to check for
     * @param useInstances specify whether or not to use instances to render the mesh
     * @param emissiveTexture the associated emissive texture used to generate the glow
     * @returns true if ready otherwise, false
     */
    protected _isReady(subMesh: SubMesh, useInstances: boolean, emissiveTexture: Nullable<BaseTexture>): boolean {
        return this._internalThinEffectLayer
            ? this._thinEffectLayer._internalIsSubMeshReady(subMesh, useInstances, emissiveTexture)
            : this._thinEffectLayer._isSubMeshReady(subMesh, useInstances, emissiveTexture);
    }

    protected async _importShadersAsync(): Promise<void> {}

    protected _arePostProcessAndMergeReady(): boolean {
        return this._internalThinEffectLayer ? this._thinEffectLayer._internalIsLayerReady() : this._thinEffectLayer.isLayerReady();
    }

    /**
     * Checks if the layer is ready to be used.
     * @returns true if the layer is ready to be used
     */
    public isLayerReady(): boolean {
        return this._arePostProcessAndMergeReady() && this._mainTexture.isReady();
    }

    /**
     * Renders the glowing part of the scene by blending the blurred glowing meshes on top of the rendered scene.
     */
    public render(): void {
        if (!this._thinEffectLayer.compose()) {
            return;
        }

        // Handle size changes.
        this._setMainTextureSize();
        if (
            (this._mainTextureCreatedSize.width !== this._mainTextureDesiredSize.width || this._mainTextureCreatedSize.height !== this._mainTextureDesiredSize.height) &&
            this._mainTextureDesiredSize.width !== 0 &&
            this._mainTextureDesiredSize.height !== 0
        ) {
            // Recreate RTT and post processes on size change.
            this.onSizeChangedObservable.notifyObservers(this);
            this._disposeTextureAndPostProcesses();
            this._createMainTexture();
            this._createTextureAndPostProcesses();
            this._mainTextureCreatedSize.width = this._mainTextureDesiredSize.width;
            this._mainTextureCreatedSize.height = this._mainTextureDesiredSize.height;
        }
    }

    /**
     * Determine if a given mesh will be used in the current effect.
     * @param mesh mesh to test
     * @returns true if the mesh will be used
     */
    public hasMesh(mesh: AbstractMesh): boolean {
        return this._internalThinEffectLayer ? this._thinEffectLayer._internalHasMesh(mesh) : this._thinEffectLayer.hasMesh(mesh);
    }

    /**
     * Returns true if the layer contains information to display, otherwise false.
     * @returns true if the glow layer should be rendered
     */
    public shouldRender(): boolean {
        return this._internalThinEffectLayer ? this._thinEffectLayer._internalShouldRender() : this._thinEffectLayer.shouldRender();
    }

    /**
     * Returns true if the mesh should render, otherwise false.
     * @param mesh The mesh to render
     * @returns true if it should render otherwise false
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _shouldRenderMesh(mesh: AbstractMesh): boolean {
        return this._internalThinEffectLayer ? true : this._thinEffectLayer._shouldRenderMesh(mesh);
    }

    /**
     * Returns true if the mesh can be rendered, otherwise false.
     * @param mesh The mesh to render
     * @param material The material used on the mesh
     * @returns true if it can be rendered otherwise false
     */
    protected _canRenderMesh(mesh: AbstractMesh, material: Material): boolean {
        return this._internalThinEffectLayer ? this._thinEffectLayer._internalCanRenderMesh(mesh, material) : this._thinEffectLayer._canRenderMesh(mesh, material);
    }

    /**
     * Returns true if the mesh should render, otherwise false.
     * @returns true if it should render otherwise false
     */
    protected _shouldRenderEmissiveTextureForMesh(): boolean {
        return true;
    }

    /**
     * Defines whether the current material of the mesh should be use to render the effect.
     * @param mesh defines the current mesh to render
     * @returns true if the mesh material should be use
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected _useMeshMaterial(mesh: AbstractMesh): boolean {
        return this._internalThinEffectLayer ? false : this._thinEffectLayer._useMeshMaterial(mesh);
    }

    /**
     * Rebuild the required buffers.
     * @internal Internal use only.
     */
    public _rebuild(): void {
        this._thinEffectLayer._rebuild();
    }

    /**
     * Dispose only the render target textures and post process.
     */
    private _disposeTextureAndPostProcesses(): void {
        this._mainTexture.dispose();

        for (let i = 0; i < this._postProcesses.length; i++) {
            if (this._postProcesses[i]) {
                this._postProcesses[i].dispose();
            }
        }
        this._postProcesses = [];

        for (let i = 0; i < this._textures.length; i++) {
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
        this._thinEffectLayer.dispose();

        // Clean textures and post processes
        this._disposeTextureAndPostProcesses();

        // Remove from scene
        this._scene.removeEffectLayer(this);

        // Callback
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
        const effectLayerType = Tools.Instantiate(parsedEffectLayer.customType);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return effectLayerType.Parse(parsedEffectLayer, scene, rootUrl);
    }
}
