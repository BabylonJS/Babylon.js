import type { Observer } from "../../Misc/observable";
import { Observable } from "../../Misc/observable";
import type { SmartArray } from "../../Misc/smartArray";
import type { Nullable, Immutable } from "../../types";
import type { Camera } from "../../Cameras/camera";
import type { Scene } from "../../scene";
import { Matrix, Vector3 } from "../../Maths/math.vector";
import type { Color4 } from "../../Maths/math.color";
import type { RenderTargetCreationOptions, TextureSize } from "../../Materials/Textures/textureCreationOptions";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { SubMesh } from "../../Meshes/subMesh";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import { Texture } from "../../Materials/Textures/texture";
import { PostProcessManager } from "../../PostProcesses/postProcessManager";
import type { PostProcess } from "../../PostProcesses/postProcess";
import { RenderingManager } from "../../Rendering/renderingManager";
import { Constants } from "../../Engines/constants";
import type { IRenderTargetTexture, RenderTargetWrapper } from "../../Engines/renderTargetWrapper";

import "../../Engines/Extensions/engine.renderTarget";
import "../../Engines/Extensions/engine.renderTargetCube";
import { Engine } from "../../Engines/engine";
import { _ObserveArray } from "../../Misc/arrayTools";
import { DumpTools } from "../../Misc/dumpTools";

import type { Material } from "../material";

/**
 * Options for the RenderTargetTexture constructor
 */
export interface RenderTargetTextureOptions {
    /** True (default: false) if mipmaps need to be generated after render */
    generateMipMaps?: boolean;

    /** True (default) to not change the aspect ratio of the scene in the RTT */
    doNotChangeAspectRatio?: boolean;

    /** The type of the buffer in the RTT (byte (default), half float, float...) */
    type?: number;

    /** True (default: false) if a cube texture needs to be created */
    isCube?: boolean;

    /** The sampling mode to be used with the render target (Trilinear (default), Linear, Nearest...) */
    samplingMode?: number;

    /** True (default) to generate a depth buffer */
    generateDepthBuffer?: boolean;

    /** True (default: false) to generate a stencil buffer */
    generateStencilBuffer?: boolean;

    /** True (default: false) if multiple textures need to be created (Draw Buffers) */
    isMulti?: boolean;

    /** The internal format of the buffer in the RTT (RED, RG, RGB, RGBA (default), ALPHA...) */
    format?: number;

    /** True (default: false) if the texture allocation should be delayed */
    delayAllocation?: boolean;

    /** Sample count to use when creating the RTT */
    samples?: number;

    /** specific flags to use when creating the texture (e.g., Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures) */
    creationFlags?: number;

    /** True (default: false) to indicate that no color target should be created. (e.g., if you only want to write to the depth buffer) */
    noColorAttachment?: boolean;

    /** Specifies the internal texture to use directly instead of creating one (ignores `noColorAttachment` flag when set) **/
    colorAttachment?: InternalTexture;

    /** True (default: false) to create a SRGB texture */
    useSRGBBuffer?: boolean;

    /** Defines the underlying texture texture space */
    gammaSpace?: boolean;
}

/**
 * This Helps creating a texture that will be created from a camera in your scene.
 * It is basically a dynamic texture that could be used to create special effects for instance.
 * Actually, It is the base of lot of effects in the framework like post process, shadows, effect layers and rendering pipelines...
 */
export class RenderTargetTexture extends Texture implements IRenderTargetTexture {
    /**
     * The texture will only be rendered once which can be useful to improve performance if everything in your render is static for instance.
     */
    public static readonly REFRESHRATE_RENDER_ONCE: number = 0;
    /**
     * The texture will only be rendered rendered every frame and is recommended for dynamic contents.
     */
    public static readonly REFRESHRATE_RENDER_ONEVERYFRAME: number = 1;
    /**
     * The texture will be rendered every 2 frames which could be enough if your dynamic objects are not
     * the central point of your effect and can save a lot of performances.
     */
    public static readonly REFRESHRATE_RENDER_ONEVERYTWOFRAMES: number = 2;

    /**
     * Use this predicate to dynamically define the list of mesh you want to render.
     * If set, the renderList property will be overwritten.
     */
    public renderListPredicate: (AbstractMesh: AbstractMesh) => boolean;

    private _renderList: Nullable<Array<AbstractMesh>>;
    private _unObserveRenderList: Nullable<() => void> = null;

    /**
     * Use this list to define the list of mesh you want to render.
     */
    public get renderList(): Nullable<Array<AbstractMesh>> {
        return this._renderList;
    }

    public set renderList(value: Nullable<Array<AbstractMesh>>) {
        if (this._unObserveRenderList) {
            this._unObserveRenderList();
            this._unObserveRenderList = null;
        }

        if (value) {
            this._unObserveRenderList = _ObserveArray(value, this._renderListHasChanged);
        }

        this._renderList = value;
    }

    private _renderListHasChanged = (_functionName: String, previousLength: number) => {
        const newLength = this._renderList ? this._renderList.length : 0;
        if ((previousLength === 0 && newLength > 0) || newLength === 0) {
            this.getScene()?.meshes.forEach((mesh) => {
                mesh._markSubMeshesAsLightDirty();
            });
        }
    };

    /**
     * Use this function to overload the renderList array at rendering time.
     * Return null to render with the current renderList, else return the list of meshes to use for rendering.
     * For 2DArray RTT, layerOrFace is the index of the layer that is going to be rendered, else it is the faceIndex of
     * the cube (if the RTT is a cube, else layerOrFace=0).
     * The renderList passed to the function is the current render list (the one that will be used if the function returns null).
     * The length of this list is passed through renderListLength: don't use renderList.length directly because the array can
     * hold dummy elements!
     */
    public getCustomRenderList: (layerOrFace: number, renderList: Nullable<Immutable<Array<AbstractMesh>>>, renderListLength: number) => Nullable<Array<AbstractMesh>>;

    /**
     * Define if particles should be rendered in your texture.
     */
    public renderParticles = true;
    /**
     * Define if sprites should be rendered in your texture.
     */
    public renderSprites = false;

    /**
     * Force checking the layerMask property even if a custom list of meshes is provided (ie. if renderList is not undefined)
     */
    public forceLayerMaskCheck = false;

    /**
     * Define the camera used to render the texture.
     */
    public activeCamera: Nullable<Camera>;
    /**
     * Override the mesh isReady function with your own one.
     */
    public customIsReadyFunction: (mesh: AbstractMesh, refreshRate: number, preWarm?: boolean) => boolean;
    /**
     * Override the render function of the texture with your own one.
     */
    public customRenderFunction: (
        opaqueSubMeshes: SmartArray<SubMesh>,
        alphaTestSubMeshes: SmartArray<SubMesh>,
        transparentSubMeshes: SmartArray<SubMesh>,
        depthOnlySubMeshes: SmartArray<SubMesh>,
        beforeTransparents?: () => void
    ) => void;
    /**
     * Define if camera post processes should be use while rendering the texture.
     */
    public useCameraPostProcesses: boolean;
    /**
     * Define if the camera viewport should be respected while rendering the texture or if the render should be done to the entire texture.
     */
    public ignoreCameraViewport: boolean = false;

    private _postProcessManager: Nullable<PostProcessManager>;

    /**
     * Post-processes for this render target
     */
    public get postProcesses() {
        return this._postProcesses;
    }
    private _postProcesses: PostProcess[];
    private _resizeObserver: Nullable<Observer<Engine>>;

    private get _prePassEnabled() {
        return !!this._prePassRenderTarget && this._prePassRenderTarget.enabled;
    }

    /**
     * An event triggered when the texture is unbind.
     */
    public onBeforeBindObservable = new Observable<RenderTargetTexture>();

    /**
     * An event triggered when the texture is unbind.
     */
    public onAfterUnbindObservable = new Observable<RenderTargetTexture>();

    private _onAfterUnbindObserver: Nullable<Observer<RenderTargetTexture>>;
    /**
     * Set a after unbind callback in the texture.
     * This has been kept for backward compatibility and use of onAfterUnbindObservable is recommended.
     */
    public set onAfterUnbind(callback: () => void) {
        if (this._onAfterUnbindObserver) {
            this.onAfterUnbindObservable.remove(this._onAfterUnbindObserver);
        }
        this._onAfterUnbindObserver = this.onAfterUnbindObservable.add(callback);
    }

    /**
     * An event triggered before rendering the texture
     */
    public onBeforeRenderObservable = new Observable<number>();

    private _onBeforeRenderObserver: Nullable<Observer<number>>;
    /**
     * Set a before render callback in the texture.
     * This has been kept for backward compatibility and use of onBeforeRenderObservable is recommended.
     */
    public set onBeforeRender(callback: (faceIndex: number) => void) {
        if (this._onBeforeRenderObserver) {
            this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
        }
        this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
    }

    /**
     * An event triggered after rendering the texture
     */
    public onAfterRenderObservable = new Observable<number>();

    private _onAfterRenderObserver: Nullable<Observer<number>>;
    /**
     * Set a after render callback in the texture.
     * This has been kept for backward compatibility and use of onAfterRenderObservable is recommended.
     */
    public set onAfterRender(callback: (faceIndex: number) => void) {
        if (this._onAfterRenderObserver) {
            this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
        }
        this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
    }

    /**
     * An event triggered after the texture clear
     */
    public onClearObservable = new Observable<Engine>();

    private _onClearObserver: Nullable<Observer<Engine>>;
    /**
     * Set a clear callback in the texture.
     * This has been kept for backward compatibility and use of onClearObservable is recommended.
     */
    public set onClear(callback: (Engine: Engine) => void) {
        if (this._onClearObserver) {
            this.onClearObservable.remove(this._onClearObserver);
        }
        this._onClearObserver = this.onClearObservable.add(callback);
    }

    /**
     * An event triggered when the texture is resized.
     */
    public onResizeObservable = new Observable<RenderTargetTexture>();

    /**
     * Define the clear color of the Render Target if it should be different from the scene.
     */
    public clearColor: Color4;
    protected _size: TextureSize;
    protected _initialSizeParameter: number | { width: number; height: number } | { ratio: number };
    protected _sizeRatio: Nullable<number>;
    /** @internal */
    public _generateMipMaps: boolean;
    /** @internal */
    public _cleared = false;
    /**
     * Skip the initial clear of the rtt at the beginning of the frame render loop
     */
    public skipInitialClear = false;
    protected _renderingManager: RenderingManager;
    /** @internal */
    public _waitingRenderList?: string[];
    protected _doNotChangeAspectRatio: boolean;
    protected _currentRefreshId = -1;
    protected _refreshRate = 1;
    protected _textureMatrix: Matrix;
    protected _samples = 1;
    protected _renderTargetOptions: RenderTargetCreationOptions;
    private _canRescale = true;
    protected _renderTarget: Nullable<RenderTargetWrapper> = null;
    /**
     * Current render pass id of the render target texture. Note it can change over the rendering as there's a separate id for each face of a cube / each layer of an array layer!
     */
    public renderPassId: number;
    private _renderPassIds: number[];
    /**
     * Gets the render pass ids used by the render target texture. For a single render target the array length will be 1, for a cube texture it will be 6 and for
     * a 2D texture array it will return an array of ids the size of the 2D texture array
     */
    public get renderPassIds(): readonly number[] {
        return this._renderPassIds;
    }

    /**
     * Gets the current value of the refreshId counter
     */
    public get currentRefreshId() {
        return this._currentRefreshId;
    }

    /**
     * Sets a specific material to be used to render a mesh/a list of meshes in this render target texture
     * @param mesh mesh or array of meshes
     * @param material material or array of materials to use for this render pass. If undefined is passed, no specific material will be used but the regular material instead (mesh.material). It's possible to provide an array of materials to use a different material for each rendering in the case of a cube texture (6 rendering) and a 2D texture array (as many rendering as the length of the array)
     */
    public setMaterialForRendering(mesh: AbstractMesh | AbstractMesh[], material?: Material | Material[]): void {
        let meshes;
        if (!Array.isArray(mesh)) {
            meshes = [mesh];
        } else {
            meshes = mesh;
        }
        for (let j = 0; j < meshes.length; ++j) {
            for (let i = 0; i < this._renderPassIds.length; ++i) {
                meshes[j].setMaterialForRenderPass(this._renderPassIds[i], material !== undefined ? (Array.isArray(material) ? material[i] : material) : undefined);
            }
        }
    }

    private _isCubeData: boolean;

    /**
     * Define if the texture has multiple draw buffers or if false a single draw buffer.
     */
    public get isMulti(): boolean {
        return this._renderTarget?.isMulti ?? false;
    }

    /**
     * Gets render target creation options that were used.
     */
    public get renderTargetOptions(): RenderTargetCreationOptions {
        return this._renderTargetOptions;
    }

    /**
     * Gets the render target wrapper associated with this render target
     */
    public get renderTarget(): Nullable<RenderTargetWrapper> {
        return this._renderTarget;
    }

    protected _onRatioRescale(): void {
        if (this._sizeRatio) {
            this.resize(this._initialSizeParameter);
        }
    }

    /**
     * Gets or sets the center of the bounding box associated with the texture (when in cube mode)
     * It must define where the camera used to render the texture is set
     */
    public boundingBoxPosition = Vector3.Zero();

    private _boundingBoxSize: Vector3;

    /**
     * Gets or sets the size of the bounding box associated with the texture (when in cube mode)
     * When defined, the cubemap will switch to local mode
     * @see https://community.arm.com/graphics/b/blog/posts/reflections-based-on-local-cubemaps-in-unity
     * @example https://www.babylonjs-playground.com/#RNASML
     */
    public set boundingBoxSize(value: Vector3) {
        if (this._boundingBoxSize && this._boundingBoxSize.equals(value)) {
            return;
        }
        this._boundingBoxSize = value;
        const scene = this.getScene();
        if (scene) {
            scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
        }
    }
    public get boundingBoxSize(): Vector3 {
        return this._boundingBoxSize;
    }

    /**
     * In case the RTT has been created with a depth texture, get the associated
     * depth texture.
     * Otherwise, return null.
     */
    public get depthStencilTexture(): Nullable<InternalTexture> {
        return this._renderTarget?._depthStencilTexture ?? null;
    }

    /**
     * Instantiate a render target texture. This is mainly used to render of screen the scene to for instance apply post process
     * or used a shadow, depth texture...
     * @param name The friendly name of the texture
     * @param size The size of the RTT (number if square, or {width: number, height:number} or {ratio:} to define a ratio from the main scene)
     * @param scene The scene the RTT belongs to. Default is the last created scene.
     * @param options The options for creating the render target texture.
     */
    constructor(name: string, size: number | { width: number; height: number; layers?: number } | { ratio: number }, scene?: Nullable<Scene>, options?: RenderTargetTextureOptions);

    /**
     * Instantiate a render target texture. This is mainly used to render of screen the scene to for instance apply post process
     * or used a shadow, depth texture...
     * @param name The friendly name of the texture
     * @param size The size of the RTT (number if square, or {width: number, height:number} or {ratio:} to define a ratio from the main scene)
     * @param scene The scene the RTT belongs to. Default is the last created scene
     * @param generateMipMaps True (default: false) if mipmaps need to be generated after render
     * @param doNotChangeAspectRatio True (default) to not change the aspect ratio of the scene in the RTT
     * @param type The type of the buffer in the RTT (byte (default), half float, float...)
     * @param isCube True (default: false) if a cube texture needs to be created
     * @param samplingMode The sampling mode to be used with the render target (Trilinear (default), Linear, Nearest...)
     * @param generateDepthBuffer True (default) to generate a depth buffer
     * @param generateStencilBuffer True (default: false) to generate a stencil buffer
     * @param isMulti True (default: false) if multiple textures need to be created (Draw Buffers)
     * @param format The internal format of the buffer in the RTT (RED, RG, RGB, RGBA (default), ALPHA...)
     * @param delayAllocation True (default: false) if the texture allocation should be delayed
     * @param samples Sample count to use when creating the RTT
     * @param creationFlags specific flags to use when creating the texture (e.g., Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures)
     * @param noColorAttachment True (default: false) to indicate that no color target should be created. (e.g., if you only want to write to the depth buffer)
     * @param useSRGBBuffer True (default: false) to create a SRGB texture
     */
    constructor(
        name: string,
        size: number | { width: number; height: number; layers?: number } | { ratio: number },
        scene?: Nullable<Scene>,
        generateMipMaps?: boolean,
        doNotChangeAspectRatio?: boolean,
        type?: number,
        isCube?: boolean,
        samplingMode?: number,
        generateDepthBuffer?: boolean,
        generateStencilBuffer?: boolean,
        isMulti?: boolean,
        format?: number,
        delayAllocation?: boolean,
        samples?: number,
        creationFlags?: number,
        noColorAttachment?: boolean,
        useSRGBBuffer?: boolean
    );

    /** @internal */
    constructor(
        name: string,
        size: number | { width: number; height: number; layers?: number } | { ratio: number },
        scene?: Nullable<Scene>,
        generateMipMaps: boolean | RenderTargetTextureOptions = false,
        doNotChangeAspectRatio: boolean = true,
        type: number = Constants.TEXTURETYPE_UNSIGNED_INT,
        isCube = false,
        samplingMode = Texture.TRILINEAR_SAMPLINGMODE,
        generateDepthBuffer = true,
        generateStencilBuffer = false,
        isMulti = false,
        format = Constants.TEXTUREFORMAT_RGBA,
        delayAllocation = false,
        samples?: number,
        creationFlags?: number,
        noColorAttachment = false,
        useSRGBBuffer = false
    ) {
        let colorAttachment: InternalTexture | undefined = undefined;
        let gammaSpace = true;
        if (typeof generateMipMaps === "object") {
            const options = generateMipMaps;
            generateMipMaps = !!options.generateMipMaps;
            doNotChangeAspectRatio = options.doNotChangeAspectRatio ?? true;
            type = options.type ?? Constants.TEXTURETYPE_UNSIGNED_BYTE;
            isCube = !!options.isCube;
            samplingMode = options.samplingMode ?? Texture.TRILINEAR_SAMPLINGMODE;
            generateDepthBuffer = options.generateDepthBuffer ?? true;
            generateStencilBuffer = !!options.generateStencilBuffer;
            isMulti = !!options.isMulti;
            format = options.format ?? Constants.TEXTUREFORMAT_RGBA;
            delayAllocation = !!options.delayAllocation;
            samples = options.samples;
            creationFlags = options.creationFlags;
            noColorAttachment = !!options.noColorAttachment;
            useSRGBBuffer = !!options.useSRGBBuffer;
            colorAttachment = options.colorAttachment;
            gammaSpace = options.gammaSpace ?? gammaSpace;
        }

        super(null, scene, !generateMipMaps, undefined, samplingMode, undefined, undefined, undefined, undefined, format);

        scene = this.getScene();
        if (!scene) {
            return;
        }

        const engine = this.getScene()!.getEngine();

        this._gammaSpace = gammaSpace;
        this._coordinatesMode = Texture.PROJECTION_MODE;
        this.renderList = [] as AbstractMesh[];
        this.name = name;
        this.isRenderTarget = true;
        this._initialSizeParameter = size;
        this._renderPassIds = [];
        this._isCubeData = isCube;

        this._processSizeParameter(size);

        this.renderPassId = this._renderPassIds[0];

        this._resizeObserver = engine.onResizeObservable.add(() => {});

        this._generateMipMaps = generateMipMaps ? true : false;
        this._doNotChangeAspectRatio = doNotChangeAspectRatio;

        // Rendering groups
        this._renderingManager = new RenderingManager(scene);
        this._renderingManager._useSceneAutoClearSetup = true;

        if (isMulti) {
            return;
        }

        this._renderTargetOptions = {
            generateMipMaps: generateMipMaps,
            type: type,
            format: this._format ?? undefined,
            samplingMode: this.samplingMode,
            generateDepthBuffer: generateDepthBuffer,
            generateStencilBuffer: generateStencilBuffer,
            samples,
            creationFlags,
            noColorAttachment: noColorAttachment,
            useSRGBBuffer,
            colorAttachment: colorAttachment,
            label: this.name,
        };

        if (this.samplingMode === Texture.NEAREST_SAMPLINGMODE) {
            this.wrapU = Texture.CLAMP_ADDRESSMODE;
            this.wrapV = Texture.CLAMP_ADDRESSMODE;
        }

        if (!delayAllocation) {
            if (isCube) {
                this._renderTarget = scene.getEngine().createRenderTargetCubeTexture(this.getRenderSize(), this._renderTargetOptions);
                this.coordinatesMode = Texture.INVCUBIC_MODE;
                this._textureMatrix = Matrix.Identity();
            } else {
                this._renderTarget = scene.getEngine().createRenderTargetTexture(this._size, this._renderTargetOptions);
            }
            this._texture = this._renderTarget.texture;
            if (samples !== undefined) {
                this.samples = samples;
            }
        }
    }

    /**
     * Creates a depth stencil texture.
     * This is only available in WebGL 2 or with the depth texture extension available.
     * @param comparisonFunction Specifies the comparison function to set on the texture. If 0 or undefined, the texture is not in comparison mode (default: 0)
     * @param bilinearFiltering Specifies whether or not bilinear filtering is enable on the texture (default: true)
     * @param generateStencil Specifies whether or not a stencil should be allocated in the texture (default: false)
     * @param samples sample count of the depth/stencil texture (default: 1)
     * @param format format of the depth texture (default: Constants.TEXTUREFORMAT_DEPTH32_FLOAT)
     */
    public createDepthStencilTexture(
        comparisonFunction: number = 0,
        bilinearFiltering: boolean = true,
        generateStencil: boolean = false,
        samples: number = 1,
        format: number = Constants.TEXTUREFORMAT_DEPTH32_FLOAT
    ): void {
        this._renderTarget?.createDepthStencilTexture(comparisonFunction, bilinearFiltering, generateStencil, samples, format);
    }

    private _releaseRenderPassId(): void {
        if (this._scene) {
            const engine = this._scene.getEngine();
            for (let i = 0; i < this._renderPassIds.length; ++i) {
                engine.releaseRenderPassId(this._renderPassIds[i]);
            }
        }
        this._renderPassIds = [];
    }

    private _createRenderPassId(): void {
        this._releaseRenderPassId();

        const engine = this._scene!.getEngine(); // scene can't be null in a RenderTargetTexture, see constructor
        const numPasses = this._isCubeData ? 6 : this.getRenderLayers() || 1;

        for (let i = 0; i < numPasses; ++i) {
            this._renderPassIds[i] = engine.createRenderPassId(`RenderTargetTexture - ${this.name}#${i}`);
        }
    }

    protected _processSizeParameter(size: number | { width: number; height: number } | { ratio: number }, createRenderPassIds = true): void {
        if ((<{ ratio: number }>size).ratio) {
            this._sizeRatio = (<{ ratio: number }>size).ratio;
            const engine = this._getEngine()!;
            this._size = {
                width: this._bestReflectionRenderTargetDimension(engine.getRenderWidth(), this._sizeRatio),
                height: this._bestReflectionRenderTargetDimension(engine.getRenderHeight(), this._sizeRatio),
            };
        } else {
            this._size = <number | { width: number; height: number; layers?: number }>size;
        }

        if (createRenderPassIds) {
            this._createRenderPassId();
        }
    }

    /**
     * Define the number of samples to use in case of MSAA.
     * It defaults to one meaning no MSAA has been enabled.
     */
    public get samples(): number {
        return this._renderTarget?.samples ?? this._samples;
    }

    public set samples(value: number) {
        if (this._renderTarget) {
            this._samples = this._renderTarget.setSamples(value);
        }
    }

    /**
     * Resets the refresh counter of the texture and start bak from scratch.
     * Could be useful to regenerate the texture if it is setup to render only once.
     */
    public resetRefreshCounter(): void {
        this._currentRefreshId = -1;
    }

    /**
     * Define the refresh rate of the texture or the rendering frequency.
     * Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
     */
    public get refreshRate(): number {
        return this._refreshRate;
    }
    public set refreshRate(value: number) {
        this._refreshRate = value;
        this.resetRefreshCounter();
    }

    /**
     * Adds a post process to the render target rendering passes.
     * @param postProcess define the post process to add
     */
    public addPostProcess(postProcess: PostProcess): void {
        if (!this._postProcessManager) {
            const scene = this.getScene();

            if (!scene) {
                return;
            }
            this._postProcessManager = new PostProcessManager(scene);
            this._postProcesses = new Array<PostProcess>();
        }

        this._postProcesses.push(postProcess);
        this._postProcesses[0].autoClear = false;
    }

    /**
     * Clear all the post processes attached to the render target
     * @param dispose define if the cleared post processes should also be disposed (false by default)
     */
    public clearPostProcesses(dispose: boolean = false): void {
        if (!this._postProcesses) {
            return;
        }

        if (dispose) {
            for (const postProcess of this._postProcesses) {
                postProcess.dispose();
            }
        }

        this._postProcesses = [];
    }

    /**
     * Remove one of the post process from the list of attached post processes to the texture
     * @param postProcess define the post process to remove from the list
     */
    public removePostProcess(postProcess: PostProcess): void {
        if (!this._postProcesses) {
            return;
        }

        const index = this._postProcesses.indexOf(postProcess);

        if (index === -1) {
            return;
        }

        this._postProcesses.splice(index, 1);

        if (this._postProcesses.length > 0) {
            this._postProcesses[0].autoClear = false;
        }
    }

    /** @internal */
    public _shouldRender(): boolean {
        if (this._currentRefreshId === -1) {
            // At least render once
            this._currentRefreshId = 1;
            return true;
        }

        if (this.refreshRate === this._currentRefreshId) {
            this._currentRefreshId = 1;
            return true;
        }

        this._currentRefreshId++;
        return false;
    }

    /**
     * Gets the actual render size of the texture.
     * @returns the width of the render size
     */
    public getRenderSize(): number {
        return this.getRenderWidth();
    }

    /**
     * Gets the actual render width of the texture.
     * @returns the width of the render size
     */
    public getRenderWidth(): number {
        if ((<{ width: number; height: number }>this._size).width) {
            return (<{ width: number; height: number }>this._size).width;
        }

        return <number>this._size;
    }

    /**
     * Gets the actual render height of the texture.
     * @returns the height of the render size
     */
    public getRenderHeight(): number {
        if ((<{ width: number; height: number }>this._size).width) {
            return (<{ width: number; height: number }>this._size).height;
        }

        return <number>this._size;
    }

    /**
     * Gets the actual number of layers of the texture.
     * @returns the number of layers
     */
    public getRenderLayers(): number {
        const layers = (<{ width: number; height: number; layers?: number }>this._size).layers;
        if (layers) {
            return layers;
        }

        return 0;
    }

    /**
     * Don't allow this render target texture to rescale. Mainly used to prevent rescaling by the scene optimizer.
     */
    public disableRescaling() {
        this._canRescale = false;
    }

    /**
     * Get if the texture can be rescaled or not.
     */
    public get canRescale(): boolean {
        return this._canRescale;
    }

    /**
     * Resize the texture using a ratio.
     * @param ratio the ratio to apply to the texture size in order to compute the new target size
     */
    public scale(ratio: number): void {
        const newSize = Math.max(1, this.getRenderSize() * ratio);

        this.resize(newSize);
    }

    /**
     * Get the texture reflection matrix used to rotate/transform the reflection.
     * @returns the reflection matrix
     */
    public getReflectionTextureMatrix(): Matrix {
        if (this.isCube) {
            return this._textureMatrix;
        }

        return super.getReflectionTextureMatrix();
    }

    /**
     * Resize the texture to a new desired size.
     * Be careful as it will recreate all the data in the new texture.
     * @param size Define the new size. It can be:
     *   - a number for squared texture,
     *   - an object containing { width: number, height: number }
     *   - or an object containing a ratio { ratio: number }
     */
    public resize(size: number | { width: number; height: number } | { ratio: number }): void {
        const wasCube = this.isCube;

        this._renderTarget?.dispose();
        this._renderTarget = null;

        const scene = this.getScene();

        if (!scene) {
            return;
        }

        this._processSizeParameter(size, false);

        if (wasCube) {
            this._renderTarget = scene.getEngine().createRenderTargetCubeTexture(this.getRenderSize(), this._renderTargetOptions);
        } else {
            this._renderTarget = scene.getEngine().createRenderTargetTexture(this._size, this._renderTargetOptions);
        }
        this._texture = this._renderTarget.texture;

        if (this._renderTargetOptions.samples !== undefined) {
            this.samples = this._renderTargetOptions.samples;
        }

        if (this.onResizeObservable.hasObservers()) {
            this.onResizeObservable.notifyObservers(this);
        }
    }

    private _defaultRenderListPrepared: boolean;

    /**
     * Renders all the objects from the render list into the texture.
     * @param useCameraPostProcess Define if camera post processes should be used during the rendering
     * @param dumpForDebug Define if the rendering result should be dumped (copied) for debugging purpose
     */
    public render(useCameraPostProcess: boolean = false, dumpForDebug: boolean = false): void {
        this._render(useCameraPostProcess, dumpForDebug);
    }

    /**
     * This function will check if the render target texture can be rendered (textures are loaded, shaders are compiled)
     * @returns true if all required resources are ready
     */
    public isReadyForRendering(): boolean {
        return this._render(false, false, true);
    }

    private _render(useCameraPostProcess: boolean = false, dumpForDebug: boolean = false, checkReadiness: boolean = false): boolean {
        const scene = this.getScene();

        if (!scene) {
            return checkReadiness;
        }

        const engine = scene.getEngine();

        if (this.useCameraPostProcesses !== undefined) {
            useCameraPostProcess = this.useCameraPostProcesses;
        }

        if (this._waitingRenderList) {
            if (!this.renderListPredicate) {
                this.renderList = [];
                for (let index = 0; index < this._waitingRenderList.length; index++) {
                    const id = this._waitingRenderList[index];
                    const mesh = scene.getMeshById(id);
                    if (mesh) {
                        this.renderList.push(mesh);
                    }
                }
            }
            this._waitingRenderList = undefined;
        }

        // Is predicate defined?
        if (this.renderListPredicate) {
            if (this.renderList) {
                this.renderList.length = 0; // Clear previous renderList
            } else {
                this.renderList = [];
            }

            const scene = this.getScene();

            if (!scene) {
                return checkReadiness;
            }

            const sceneMeshes = scene.meshes;

            for (let index = 0; index < sceneMeshes.length; index++) {
                const mesh = sceneMeshes[index];
                if (this.renderListPredicate(mesh)) {
                    this.renderList.push(mesh);
                }
            }
        }

        const currentRenderPassId = engine.currentRenderPassId;

        this.onBeforeBindObservable.notifyObservers(this);

        // Set custom projection.
        // Needs to be before binding to prevent changing the aspect ratio.
        const camera: Nullable<Camera> = this.activeCamera ?? scene.activeCamera;
        const sceneCamera = scene.activeCamera;

        if (camera) {
            if (camera !== scene.activeCamera) {
                scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix(true));
                scene.activeCamera = camera;
            }
            engine.setViewport(camera.rigParent ? camera.rigParent.viewport : camera.viewport, this.getRenderWidth(), this.getRenderHeight());
        }

        this._defaultRenderListPrepared = false;

        let returnValue = checkReadiness;

        if (!checkReadiness) {
            if (this.is2DArray && !this.isMulti) {
                for (let layer = 0; layer < this.getRenderLayers(); layer++) {
                    this._renderToTarget(0, useCameraPostProcess, dumpForDebug, layer, camera);
                    scene.incrementRenderId();
                    scene.resetCachedMaterial();
                }
            } else if (this.isCube && !this.isMulti) {
                for (let face = 0; face < 6; face++) {
                    this._renderToTarget(face, useCameraPostProcess, dumpForDebug, undefined, camera);
                    scene.incrementRenderId();
                    scene.resetCachedMaterial();
                }
            } else {
                this._renderToTarget(0, useCameraPostProcess, dumpForDebug, undefined, camera);
            }
        } else {
            if (!scene.getViewMatrix()) {
                // We probably didn't execute scene.render() yet, so make sure we have a view/projection matrix setup for the scene
                scene.updateTransformMatrix();
            }
            const numLayers = this.is2DArray ? this.getRenderLayers() : this.isCube ? 6 : 1;
            for (let layer = 0; layer < numLayers && returnValue; layer++) {
                let currentRenderList: Nullable<Array<AbstractMesh>> = null;
                const defaultRenderList = this.renderList ? this.renderList : scene.getActiveMeshes().data;
                const defaultRenderListLength = this.renderList ? this.renderList.length : scene.getActiveMeshes().length;

                engine.currentRenderPassId = this._renderPassIds[layer];

                this.onBeforeRenderObservable.notifyObservers(layer);

                if (this.getCustomRenderList) {
                    currentRenderList = this.getCustomRenderList(layer, defaultRenderList, defaultRenderListLength);
                }

                if (!currentRenderList) {
                    currentRenderList = defaultRenderList;
                }

                if (!this._doNotChangeAspectRatio) {
                    scene.updateTransformMatrix(true);
                }

                for (let i = 0; i < currentRenderList.length && returnValue; ++i) {
                    const mesh = currentRenderList[i];

                    if (!mesh.isEnabled() || mesh.isBlocked || !mesh.isVisible || !mesh.subMeshes) {
                        continue;
                    }

                    if (this.customIsReadyFunction) {
                        if (!this.customIsReadyFunction(mesh, this.refreshRate, checkReadiness)) {
                            returnValue = false;
                            continue;
                        }
                    } else if (!mesh.isReady(true)) {
                        returnValue = false;
                        continue;
                    }
                }

                this.onAfterRenderObservable.notifyObservers(layer);

                if (this.is2DArray || this.isCube) {
                    scene.incrementRenderId();
                    scene.resetCachedMaterial();
                }
            }
        }

        this.onAfterUnbindObservable.notifyObservers(this);

        engine.currentRenderPassId = currentRenderPassId;

        if (sceneCamera) {
            scene.activeCamera = sceneCamera;
            if (this.activeCamera && this.activeCamera !== scene.activeCamera) {
                scene.setTransformMatrix(scene.activeCamera.getViewMatrix(), scene.activeCamera.getProjectionMatrix(true));
            }
            engine.setViewport(scene.activeCamera.viewport);
        }

        scene.resetCachedMaterial();

        return returnValue;
    }

    private _bestReflectionRenderTargetDimension(renderDimension: number, scale: number): number {
        const minimum = 128;
        const x = renderDimension * scale;
        const curved = Engine.NearestPOT(x + (minimum * minimum) / (minimum + x));

        // Ensure we don't exceed the render dimension (while staying POT)
        return Math.min(Engine.FloorPOT(renderDimension), curved);
    }

    private _prepareRenderingManager(currentRenderList: Array<AbstractMesh>, currentRenderListLength: number, camera: Nullable<Camera>, checkLayerMask: boolean): void {
        const scene = this.getScene();

        if (!scene) {
            return;
        }

        this._renderingManager.reset();

        const sceneRenderId = scene.getRenderId();
        for (let meshIndex = 0; meshIndex < currentRenderListLength; meshIndex++) {
            const mesh = currentRenderList[meshIndex];

            if (mesh && !mesh.isBlocked) {
                if (this.customIsReadyFunction) {
                    if (!this.customIsReadyFunction(mesh, this.refreshRate, false)) {
                        this.resetRefreshCounter();
                        continue;
                    }
                } else if (!mesh.isReady(this.refreshRate === 0)) {
                    this.resetRefreshCounter();
                    continue;
                }

                if (!mesh._internalAbstractMeshDataInfo._currentLODIsUpToDate && scene.activeCamera) {
                    mesh._internalAbstractMeshDataInfo._currentLOD = scene.customLODSelector
                        ? scene.customLODSelector(mesh, this.activeCamera || scene.activeCamera)
                        : mesh.getLOD(this.activeCamera || scene.activeCamera);
                    mesh._internalAbstractMeshDataInfo._currentLODIsUpToDate = true;
                }
                if (!mesh._internalAbstractMeshDataInfo._currentLOD) {
                    continue;
                }

                let meshToRender = mesh._internalAbstractMeshDataInfo._currentLOD;

                meshToRender._preActivateForIntermediateRendering(sceneRenderId);

                let isMasked;
                if (checkLayerMask && camera) {
                    isMasked = (mesh.layerMask & camera.layerMask) === 0;
                } else {
                    isMasked = false;
                }

                if (mesh.isEnabled() && mesh.isVisible && mesh.subMeshes && !isMasked) {
                    if (meshToRender !== mesh) {
                        meshToRender._activate(sceneRenderId, true);
                    }
                    if (mesh._activate(sceneRenderId, true) && mesh.subMeshes.length) {
                        if (!mesh.isAnInstance) {
                            meshToRender._internalAbstractMeshDataInfo._onlyForInstancesIntermediate = false;
                        } else {
                            if (mesh._internalAbstractMeshDataInfo._actAsRegularMesh) {
                                meshToRender = mesh;
                            }
                        }
                        meshToRender._internalAbstractMeshDataInfo._isActiveIntermediate = true;

                        for (let subIndex = 0; subIndex < meshToRender.subMeshes.length; subIndex++) {
                            const subMesh = meshToRender.subMeshes[subIndex];
                            this._renderingManager.dispatch(subMesh, meshToRender);
                        }
                    }
                }
            }
        }

        for (let particleIndex = 0; particleIndex < scene.particleSystems.length; particleIndex++) {
            const particleSystem = scene.particleSystems[particleIndex];

            const emitter: any = particleSystem.emitter;

            if (!particleSystem.isStarted() || !emitter || (emitter.position && !emitter.isEnabled())) {
                continue;
            }

            this._renderingManager.dispatchParticles(particleSystem);
        }
    }

    /**
     * @internal
     * @param faceIndex face index to bind to if this is a cubetexture
     * @param layer defines the index of the texture to bind in the array
     */
    public _bindFrameBuffer(faceIndex: number = 0, layer = 0) {
        const scene = this.getScene();
        if (!scene) {
            return;
        }

        const engine = scene.getEngine();
        if (this._renderTarget) {
            engine.bindFramebuffer(this._renderTarget, this.isCube ? faceIndex : undefined, undefined, undefined, this.ignoreCameraViewport, 0, layer);
        }
    }

    protected _unbindFrameBuffer(engine: Engine, faceIndex: number): void {
        if (!this._renderTarget) {
            return;
        }
        engine.unBindFramebuffer(this._renderTarget, this.isCube, () => {
            this.onAfterRenderObservable.notifyObservers(faceIndex);
        });
    }

    /**
     * @internal
     */
    public _prepareFrame(scene: Scene, faceIndex?: number, layer?: number, useCameraPostProcess?: boolean) {
        if (this._postProcessManager) {
            if (!this._prePassEnabled) {
                this._postProcessManager._prepareFrame(this._texture, this._postProcesses);
            }
        } else if (!useCameraPostProcess || !scene.postProcessManager._prepareFrame(this._texture)) {
            this._bindFrameBuffer(faceIndex, layer);
        }
    }

    private _renderToTarget(faceIndex: number, useCameraPostProcess: boolean, dumpForDebug: boolean, layer = 0, camera: Nullable<Camera> = null): void {
        const scene = this.getScene();

        if (!scene) {
            return;
        }

        const engine = scene.getEngine();

        engine._debugPushGroup?.(`render to face #${faceIndex} layer #${layer}`, 1);

        // Bind
        this._prepareFrame(scene, faceIndex, layer, useCameraPostProcess);

        if (this.is2DArray) {
            engine.currentRenderPassId = this._renderPassIds[layer];
            this.onBeforeRenderObservable.notifyObservers(layer);
        } else {
            engine.currentRenderPassId = this._renderPassIds[faceIndex];
            this.onBeforeRenderObservable.notifyObservers(faceIndex);
        }

        const fastPath = engine.snapshotRendering && engine.snapshotRenderingMode === Constants.SNAPSHOTRENDERING_FAST;

        if (!fastPath) {
            // Get the list of meshes to render
            let currentRenderList: Nullable<Array<AbstractMesh>> = null;
            const defaultRenderList = this.renderList ? this.renderList : scene.getActiveMeshes().data;
            const defaultRenderListLength = this.renderList ? this.renderList.length : scene.getActiveMeshes().length;

            if (this.getCustomRenderList) {
                currentRenderList = this.getCustomRenderList(this.is2DArray ? layer : faceIndex, defaultRenderList, defaultRenderListLength);
            }

            if (!currentRenderList) {
                // No custom render list provided, we prepare the rendering for the default list, but check
                // first if we did not already performed the preparation before so as to avoid re-doing it several times
                if (!this._defaultRenderListPrepared) {
                    this._prepareRenderingManager(defaultRenderList, defaultRenderListLength, camera, !this.renderList || this.forceLayerMaskCheck);
                    this._defaultRenderListPrepared = true;
                }
                currentRenderList = defaultRenderList;
            } else {
                // Prepare the rendering for the custom render list provided
                this._prepareRenderingManager(currentRenderList, currentRenderList.length, camera, this.forceLayerMaskCheck);
            }

            // Before clear
            for (const step of scene._beforeRenderTargetClearStage) {
                step.action(this, faceIndex, layer);
            }

            // Clear
            if (this.onClearObservable.hasObservers()) {
                this.onClearObservable.notifyObservers(engine);
            } else if (!this.skipInitialClear) {
                engine.clear(this.clearColor || scene.clearColor, true, true, true);
            }

            if (!this._doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }

            // Before Camera Draw
            for (const step of scene._beforeRenderTargetDrawStage) {
                step.action(this, faceIndex, layer);
            }

            // Render
            this._renderingManager.render(this.customRenderFunction, currentRenderList, this.renderParticles, this.renderSprites);

            // After Camera Draw
            for (const step of scene._afterRenderTargetDrawStage) {
                step.action(this, faceIndex, layer);
            }

            const saveGenerateMipMaps = this._texture?.generateMipMaps ?? false;

            if (this._texture) {
                this._texture.generateMipMaps = false; // if left true, the mipmaps will be generated (if this._texture.generateMipMaps = true) when the first post process binds its own RTT: by doing so it will unbind the current RTT,
                // which will trigger a mipmap generation. We don't want this because it's a wasted work, we will do an unbind of the current RTT at the end of the process (see unbindFrameBuffer) which will
                // trigger the generation of the final mipmaps
            }

            if (this._postProcessManager) {
                this._postProcessManager._finalizeFrame(false, this._renderTarget ?? undefined, faceIndex, this._postProcesses, this.ignoreCameraViewport);
            } else if (useCameraPostProcess) {
                scene.postProcessManager._finalizeFrame(false, this._renderTarget ?? undefined, faceIndex);
            }

            for (const step of scene._afterRenderTargetPostProcessStage) {
                step.action(this, faceIndex, layer);
            }

            if (this._texture) {
                this._texture.generateMipMaps = saveGenerateMipMaps;
            }

            if (!this._doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }

            // Dump ?
            if (dumpForDebug) {
                DumpTools.DumpFramebuffer(this.getRenderWidth(), this.getRenderHeight(), engine);
            }
        } else {
            // Clear
            if (this.onClearObservable.hasObservers()) {
                this.onClearObservable.notifyObservers(engine);
            } else {
                if (!this.skipInitialClear) {
                    engine.clear(this.clearColor || scene.clearColor, true, true, true);
                }
            }
        }

        // Unbind
        this._unbindFrameBuffer(engine, faceIndex);

        if (this._texture && this.isCube && faceIndex === 5) {
            engine.generateMipMapsForCubemap(this._texture);
        }

        engine._debugPopGroup?.(1);
    }

    /**
     * Overrides the default sort function applied in the rendering group to prepare the meshes.
     * This allowed control for front to back rendering or reversely depending of the special needs.
     *
     * @param renderingGroupId The rendering group id corresponding to its index
     * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
     * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
     * @param transparentSortCompareFn The transparent queue comparison function use to sort.
     */
    public setRenderingOrder(
        renderingGroupId: number,
        opaqueSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
        alphaTestSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
        transparentSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null
    ): void {
        this._renderingManager.setRenderingOrder(renderingGroupId, opaqueSortCompareFn, alphaTestSortCompareFn, transparentSortCompareFn);
    }

    /**
     * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
     *
     * @param renderingGroupId The rendering group id corresponding to its index
     * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
     */
    public setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean): void {
        this._renderingManager.setRenderingAutoClearDepthStencil(renderingGroupId, autoClearDepthStencil);
        this._renderingManager._useSceneAutoClearSetup = false;
    }

    /**
     * Clones the texture.
     * @returns the cloned texture
     */
    public clone(): RenderTargetTexture {
        const textureSize = this.getSize();
        const newTexture = new RenderTargetTexture(
            this.name,
            textureSize,
            this.getScene(),
            this._renderTargetOptions.generateMipMaps,
            this._doNotChangeAspectRatio,
            this._renderTargetOptions.type,
            this.isCube,
            this._renderTargetOptions.samplingMode,
            this._renderTargetOptions.generateDepthBuffer,
            this._renderTargetOptions.generateStencilBuffer,
            undefined,
            this._renderTargetOptions.format,
            undefined,
            this._renderTargetOptions.samples
        );

        // Base texture
        newTexture.hasAlpha = this.hasAlpha;
        newTexture.level = this.level;

        // RenderTarget Texture
        newTexture.coordinatesMode = this.coordinatesMode;
        if (this.renderList) {
            newTexture.renderList = this.renderList.slice(0);
        }

        return newTexture;
    }

    /**
     * Serialize the texture to a JSON representation we can easily use in the respective Parse function.
     * @returns The JSON representation of the texture
     */
    public serialize(): any {
        if (!this.name) {
            return null;
        }

        const serializationObject = super.serialize();

        serializationObject.renderTargetSize = this.getRenderSize();
        serializationObject.renderList = [];

        if (this.renderList) {
            for (let index = 0; index < this.renderList.length; index++) {
                serializationObject.renderList.push(this.renderList[index].id);
            }
        }

        return serializationObject;
    }

    /**
     *  This will remove the attached framebuffer objects. The texture will not be able to be used as render target anymore
     */
    public disposeFramebufferObjects(): void {
        this._renderTarget?.dispose(true);
    }

    /**
     * Release and destroy the underlying lower level texture aka internalTexture.
     */
    public releaseInternalTexture(): void {
        this._renderTarget?.releaseTextures();
        this._texture = null;
    }

    /**
     * Dispose the texture and release its associated resources.
     */
    public dispose(): void {
        this.onResizeObservable.clear();
        this.onClearObservable.clear();
        this.onAfterRenderObservable.clear();
        this.onAfterUnbindObservable.clear();
        this.onBeforeBindObservable.clear();
        this.onBeforeRenderObservable.clear();

        if (this._postProcessManager) {
            this._postProcessManager.dispose();
            this._postProcessManager = null;
        }

        if (this._prePassRenderTarget) {
            this._prePassRenderTarget.dispose();
        }

        this._releaseRenderPassId();
        this.clearPostProcesses(true);

        if (this._resizeObserver) {
            this.getScene()!.getEngine().onResizeObservable.remove(this._resizeObserver);
            this._resizeObserver = null;
        }

        this.renderList = null;

        // Remove from custom render targets
        const scene = this.getScene();

        if (!scene) {
            return;
        }

        let index = scene.customRenderTargets.indexOf(this);

        if (index >= 0) {
            scene.customRenderTargets.splice(index, 1);
        }

        for (const camera of scene.cameras) {
            index = camera.customRenderTargets.indexOf(this);

            if (index >= 0) {
                camera.customRenderTargets.splice(index, 1);
            }
        }

        this._renderTarget?.dispose();
        this._renderTarget = null;
        this._texture = null;

        super.dispose();
    }

    /** @internal */
    public _rebuild(): void {
        if (this.refreshRate === RenderTargetTexture.REFRESHRATE_RENDER_ONCE) {
            this.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
        }

        if (this._postProcessManager) {
            this._postProcessManager._rebuild();
        }
    }

    /**
     * Clear the info related to rendering groups preventing retention point in material dispose.
     */
    public freeRenderingGroups(): void {
        if (this._renderingManager) {
            this._renderingManager.freeRenderingGroups();
        }
    }

    /**
     * Gets the number of views the corresponding to the texture (eg. a MultiviewRenderTarget will have > 1)
     * @returns the view count
     */
    public getViewCount() {
        return 1;
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Texture._CreateRenderTargetTexture = (name: string, renderTargetSize: number, scene: Scene, generateMipMaps: boolean, creationFlags?: number) => {
    return new RenderTargetTexture(name, renderTargetSize, scene, generateMipMaps);
};
