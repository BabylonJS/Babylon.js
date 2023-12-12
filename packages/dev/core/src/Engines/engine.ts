import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import type { InternalTexture } from "../Materials/Textures/internalTexture";
import type { IOfflineProvider } from "../Offline/IOfflineProvider";
import type { ILoadingScreen } from "../Loading/loadingScreen";
import { _WarnImport } from "../Misc/devTools";
import type { WebGLPipelineContext } from "./WebGL/webGLPipelineContext";
import type { IPipelineContext } from "./IPipelineContext";
import type { ICustomAnimationFrameRequester } from "../Misc/customAnimationFrameRequester";
import type { EngineOptions } from "./thinEngine";
import { ThinEngine } from "./thinEngine";
import { Constants } from "./constants";
import type { IViewportLike, IColor4Like } from "../Maths/math.like";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { PerformanceMonitor } from "../Misc/performanceMonitor";
import type { DataBuffer } from "../Buffers/dataBuffer";
import { PerfCounter } from "../Misc/perfCounter";

import "./Extensions/engine.alpha";
import "./Extensions/engine.readTexture";
import "./Extensions/engine.dynamicBuffer";
import type { IAudioEngine } from "../Audio/Interfaces/IAudioEngine";

import type { Material } from "../Materials/material";
import type { PostProcess } from "../PostProcesses/postProcess";
import {
    _createShaderProgram,
    _readPixelsAsync,
    _rescaleTexture,
    _uploadImageToTexture,
    createInstancesBuffer,
    createShaderProgram,
    deleteInstancesBuffer,
    disableScissor,
    enableScissor,
    endFrame,
    generateMipMapsForCubemap,
    getFragmentShaderSource,
    getRenderHeight,
    getRenderWidth,
    getVertexShaderSource,
    scissorClear,
    setDepthStencilTexture,
    setDirectViewport,
    setDitheringState,
    setRasterizerState,
    setSize,
    setTextureFromPostProcess,
    setTextureFromPostProcessOutput,
    updateTextureComparisonFunction,
    wrapWebGLTexture,
} from "core/esm/Engines/WebGL/engine.webgl";
import {
    _cancelFrame,
    _renderFrame,
    _verifyPointerLock,
    beginFrame,
    cacheStencilState,
    createRenderPassId,
    displayLoadingUI,
    enterFullscreen,
    enterPointerlock,
    exitFullscreen,
    getCurrentRenderPassName,
    getInputElementClientRect,
    getLoadingScreen,
    getRenderPassNames,
    getRenderingCanvasClientRect,
    hideLoadingUI,
    releaseRenderPassId,
    restoreStencilState,
    setDepthWrite,
    setLoadingScreen,
    switchFullscreen,
} from "core/esm/Engines/engine.base";
import {
    EngineStore,
    MarkAllMaterialsAsDirty,
    _CreateCanvas,
    _ExitFullscreen,
    _ExitPointerlock,
    _RequestFullscreen,
    _RequestPointerlock,
    _createImageBitmapFromSource,
    getFontOffset,
    resizeImageBitmap,
} from "core/esm/Engines/engine.static";
import { getAspectRatioBase, getScreenAspectRatioBase } from "core/esm/Engines/engine.extendable";
import { _loadFile, _reportDrawCall } from "core/esm/Engines/engine.tools";
import { augmentEngineState } from "core/esm/Engines/engine.adapters";

import { EngineStore as EngineStoreLegacy } from "./engineStore";

/**
 * Defines the interface used by objects containing a viewport (like a camera)
 */
interface IViewportOwnerLike {
    /**
     * Gets or sets the viewport
     */
    viewport: IViewportLike;
}

/**
 * The engine class is responsible for interfacing with all lower-level APIs such as WebGL and Audio
 */
export class Engine extends ThinEngine {
    // Const statics

    /** Defines that alpha blending is disabled */
    public static readonly ALPHA_DISABLE = Constants.ALPHA_DISABLE;
    /** Defines that alpha blending to SRC ALPHA * SRC + DEST */
    public static readonly ALPHA_ADD = Constants.ALPHA_ADD;
    /** Defines that alpha blending to SRC ALPHA * SRC + (1 - SRC ALPHA) * DEST */
    public static readonly ALPHA_COMBINE = Constants.ALPHA_COMBINE;
    /** Defines that alpha blending to DEST - SRC * DEST */
    public static readonly ALPHA_SUBTRACT = Constants.ALPHA_SUBTRACT;
    /** Defines that alpha blending to SRC * DEST */
    public static readonly ALPHA_MULTIPLY = Constants.ALPHA_MULTIPLY;
    /** Defines that alpha blending to SRC ALPHA * SRC + (1 - SRC) * DEST */
    public static readonly ALPHA_MAXIMIZED = Constants.ALPHA_MAXIMIZED;
    /** Defines that alpha blending to SRC + DEST */
    public static readonly ALPHA_ONEONE = Constants.ALPHA_ONEONE;
    /** Defines that alpha blending to SRC + (1 - SRC ALPHA) * DEST */
    public static readonly ALPHA_PREMULTIPLIED = Constants.ALPHA_PREMULTIPLIED;
    /**
     * Defines that alpha blending to SRC + (1 - SRC ALPHA) * DEST
     * Alpha will be set to (1 - SRC ALPHA) * DEST ALPHA
     */
    public static readonly ALPHA_PREMULTIPLIED_PORTERDUFF = Constants.ALPHA_PREMULTIPLIED_PORTERDUFF;
    /** Defines that alpha blending to CST * SRC + (1 - CST) * DEST */
    public static readonly ALPHA_INTERPOLATE = Constants.ALPHA_INTERPOLATE;
    /**
     * Defines that alpha blending to SRC + (1 - SRC) * DEST
     * Alpha will be set to SRC ALPHA + (1 - SRC ALPHA) * DEST ALPHA
     */
    public static readonly ALPHA_SCREENMODE = Constants.ALPHA_SCREENMODE;

    /** Defines that the resource is not delayed*/
    public static readonly DELAYLOADSTATE_NONE = Constants.DELAYLOADSTATE_NONE;
    /** Defines that the resource was successfully delay loaded */
    public static readonly DELAYLOADSTATE_LOADED = Constants.DELAYLOADSTATE_LOADED;
    /** Defines that the resource is currently delay loading */
    public static readonly DELAYLOADSTATE_LOADING = Constants.DELAYLOADSTATE_LOADING;
    /** Defines that the resource is delayed and has not started loading */
    public static readonly DELAYLOADSTATE_NOTLOADED = Constants.DELAYLOADSTATE_NOTLOADED;

    // Depht or Stencil test Constants.
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn */
    public static readonly NEVER = Constants.NEVER;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn */
    public static readonly ALWAYS = Constants.ALWAYS;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value */
    public static readonly LESS = Constants.LESS;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value */
    public static readonly EQUAL = Constants.EQUAL;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value */
    public static readonly LEQUAL = Constants.LEQUAL;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value */
    public static readonly GREATER = Constants.GREATER;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value */
    public static readonly GEQUAL = Constants.GEQUAL;
    /** Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value */
    public static readonly NOTEQUAL = Constants.NOTEQUAL;

    // Stencil Actions Constants.
    /** Passed to stencilOperation to specify that stencil value must be kept */
    public static readonly KEEP = Constants.KEEP;
    /** Passed to stencilOperation to specify that stencil value must be replaced */
    public static readonly REPLACE = Constants.REPLACE;
    /** Passed to stencilOperation to specify that stencil value must be incremented */
    public static readonly INCR = Constants.INCR;
    /** Passed to stencilOperation to specify that stencil value must be decremented */
    public static readonly DECR = Constants.DECR;
    /** Passed to stencilOperation to specify that stencil value must be inverted */
    public static readonly INVERT = Constants.INVERT;
    /** Passed to stencilOperation to specify that stencil value must be incremented with wrapping */
    public static readonly INCR_WRAP = Constants.INCR_WRAP;
    /** Passed to stencilOperation to specify that stencil value must be decremented with wrapping */
    public static readonly DECR_WRAP = Constants.DECR_WRAP;

    /** Texture is not repeating outside of 0..1 UVs */
    public static readonly TEXTURE_CLAMP_ADDRESSMODE = Constants.TEXTURE_CLAMP_ADDRESSMODE;
    /** Texture is repeating outside of 0..1 UVs */
    public static readonly TEXTURE_WRAP_ADDRESSMODE = Constants.TEXTURE_WRAP_ADDRESSMODE;
    /** Texture is repeating and mirrored */
    public static readonly TEXTURE_MIRROR_ADDRESSMODE = Constants.TEXTURE_MIRROR_ADDRESSMODE;

    /** ALPHA */
    public static readonly TEXTUREFORMAT_ALPHA = Constants.TEXTUREFORMAT_ALPHA;
    /** LUMINANCE */
    public static readonly TEXTUREFORMAT_LUMINANCE = Constants.TEXTUREFORMAT_LUMINANCE;
    /** LUMINANCE_ALPHA */
    public static readonly TEXTUREFORMAT_LUMINANCE_ALPHA = Constants.TEXTUREFORMAT_LUMINANCE_ALPHA;
    /** RGB */
    public static readonly TEXTUREFORMAT_RGB = Constants.TEXTUREFORMAT_RGB;
    /** RGBA */
    public static readonly TEXTUREFORMAT_RGBA = Constants.TEXTUREFORMAT_RGBA;
    /** RED */
    public static readonly TEXTUREFORMAT_RED = Constants.TEXTUREFORMAT_RED;
    /** RED (2nd reference) */
    public static readonly TEXTUREFORMAT_R = Constants.TEXTUREFORMAT_R;
    /** RG */
    public static readonly TEXTUREFORMAT_RG = Constants.TEXTUREFORMAT_RG;
    /** RED_INTEGER */
    public static readonly TEXTUREFORMAT_RED_INTEGER = Constants.TEXTUREFORMAT_RED_INTEGER;
    /** RED_INTEGER (2nd reference) */
    public static readonly TEXTUREFORMAT_R_INTEGER = Constants.TEXTUREFORMAT_R_INTEGER;
    /** RG_INTEGER */
    public static readonly TEXTUREFORMAT_RG_INTEGER = Constants.TEXTUREFORMAT_RG_INTEGER;
    /** RGB_INTEGER */
    public static readonly TEXTUREFORMAT_RGB_INTEGER = Constants.TEXTUREFORMAT_RGB_INTEGER;
    /** RGBA_INTEGER */
    public static readonly TEXTUREFORMAT_RGBA_INTEGER = Constants.TEXTUREFORMAT_RGBA_INTEGER;

    /** UNSIGNED_BYTE */
    public static readonly TEXTURETYPE_UNSIGNED_BYTE = Constants.TEXTURETYPE_UNSIGNED_BYTE;
    /** UNSIGNED_BYTE (2nd reference) */
    public static readonly TEXTURETYPE_UNSIGNED_INT = Constants.TEXTURETYPE_UNSIGNED_INT;
    /** FLOAT */
    public static readonly TEXTURETYPE_FLOAT = Constants.TEXTURETYPE_FLOAT;
    /** HALF_FLOAT */
    public static readonly TEXTURETYPE_HALF_FLOAT = Constants.TEXTURETYPE_HALF_FLOAT;
    /** BYTE */
    public static readonly TEXTURETYPE_BYTE = Constants.TEXTURETYPE_BYTE;
    /** SHORT */
    public static readonly TEXTURETYPE_SHORT = Constants.TEXTURETYPE_SHORT;
    /** UNSIGNED_SHORT */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT = Constants.TEXTURETYPE_UNSIGNED_SHORT;
    /** INT */
    public static readonly TEXTURETYPE_INT = Constants.TEXTURETYPE_INT;
    /** UNSIGNED_INT */
    public static readonly TEXTURETYPE_UNSIGNED_INTEGER = Constants.TEXTURETYPE_UNSIGNED_INTEGER;
    /** UNSIGNED_SHORT_4_4_4_4 */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4 = Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4;
    /** UNSIGNED_SHORT_5_5_5_1 */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1 = Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1;
    /** UNSIGNED_SHORT_5_6_5 */
    public static readonly TEXTURETYPE_UNSIGNED_SHORT_5_6_5 = Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5;
    /** UNSIGNED_INT_2_10_10_10_REV */
    public static readonly TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV = Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV;
    /** UNSIGNED_INT_24_8 */
    public static readonly TEXTURETYPE_UNSIGNED_INT_24_8 = Constants.TEXTURETYPE_UNSIGNED_INT_24_8;
    /** UNSIGNED_INT_10F_11F_11F_REV */
    public static readonly TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV = Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV;
    /** UNSIGNED_INT_5_9_9_9_REV */
    public static readonly TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV = Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV;
    /** FLOAT_32_UNSIGNED_INT_24_8_REV */
    public static readonly TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV = Constants.TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV;

    /** nearest is mag = nearest and min = nearest and mip = none */
    public static readonly TEXTURE_NEAREST_SAMPLINGMODE = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    /** Bilinear is mag = linear and min = linear and mip = nearest */
    public static readonly TEXTURE_BILINEAR_SAMPLINGMODE = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
    /** Trilinear is mag = linear and min = linear and mip = linear */
    public static readonly TEXTURE_TRILINEAR_SAMPLINGMODE = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
    /** nearest is mag = nearest and min = nearest and mip = linear */
    public static readonly TEXTURE_NEAREST_NEAREST_MIPLINEAR = Constants.TEXTURE_NEAREST_NEAREST_MIPLINEAR;
    /** Bilinear is mag = linear and min = linear and mip = nearest */
    public static readonly TEXTURE_LINEAR_LINEAR_MIPNEAREST = Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST;
    /** Trilinear is mag = linear and min = linear and mip = linear */
    public static readonly TEXTURE_LINEAR_LINEAR_MIPLINEAR = Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR;
    /** mag = nearest and min = nearest and mip = nearest */
    public static readonly TEXTURE_NEAREST_NEAREST_MIPNEAREST = Constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST;
    /** mag = nearest and min = linear and mip = nearest */
    public static readonly TEXTURE_NEAREST_LINEAR_MIPNEAREST = Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST;
    /** mag = nearest and min = linear and mip = linear */
    public static readonly TEXTURE_NEAREST_LINEAR_MIPLINEAR = Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR;
    /** mag = nearest and min = linear and mip = none */
    public static readonly TEXTURE_NEAREST_LINEAR = Constants.TEXTURE_NEAREST_LINEAR;
    /** mag = nearest and min = nearest and mip = none */
    public static readonly TEXTURE_NEAREST_NEAREST = Constants.TEXTURE_NEAREST_NEAREST;
    /** mag = linear and min = nearest and mip = nearest */
    public static readonly TEXTURE_LINEAR_NEAREST_MIPNEAREST = Constants.TEXTURE_LINEAR_NEAREST_MIPNEAREST;
    /** mag = linear and min = nearest and mip = linear */
    public static readonly TEXTURE_LINEAR_NEAREST_MIPLINEAR = Constants.TEXTURE_LINEAR_NEAREST_MIPLINEAR;
    /** mag = linear and min = linear and mip = none */
    public static readonly TEXTURE_LINEAR_LINEAR = Constants.TEXTURE_LINEAR_LINEAR;
    /** mag = linear and min = nearest and mip = none */
    public static readonly TEXTURE_LINEAR_NEAREST = Constants.TEXTURE_LINEAR_NEAREST;

    /** Explicit coordinates mode */
    public static readonly TEXTURE_EXPLICIT_MODE = Constants.TEXTURE_EXPLICIT_MODE;
    /** Spherical coordinates mode */
    public static readonly TEXTURE_SPHERICAL_MODE = Constants.TEXTURE_SPHERICAL_MODE;
    /** Planar coordinates mode */
    public static readonly TEXTURE_PLANAR_MODE = Constants.TEXTURE_PLANAR_MODE;
    /** Cubic coordinates mode */
    public static readonly TEXTURE_CUBIC_MODE = Constants.TEXTURE_CUBIC_MODE;
    /** Projection coordinates mode */
    public static readonly TEXTURE_PROJECTION_MODE = Constants.TEXTURE_PROJECTION_MODE;
    /** Skybox coordinates mode */
    public static readonly TEXTURE_SKYBOX_MODE = Constants.TEXTURE_SKYBOX_MODE;
    /** Inverse Cubic coordinates mode */
    public static readonly TEXTURE_INVCUBIC_MODE = Constants.TEXTURE_INVCUBIC_MODE;
    /** Equirectangular coordinates mode */
    public static readonly TEXTURE_EQUIRECTANGULAR_MODE = Constants.TEXTURE_EQUIRECTANGULAR_MODE;
    /** Equirectangular Fixed coordinates mode */
    public static readonly TEXTURE_FIXED_EQUIRECTANGULAR_MODE = Constants.TEXTURE_FIXED_EQUIRECTANGULAR_MODE;
    /** Equirectangular Fixed Mirrored coordinates mode */
    public static readonly TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE = Constants.TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE;

    // Texture rescaling mode
    /** Defines that texture rescaling will use a floor to find the closer power of 2 size */
    public static readonly SCALEMODE_FLOOR = Constants.SCALEMODE_FLOOR;
    /** Defines that texture rescaling will look for the nearest power of 2 size */
    public static readonly SCALEMODE_NEAREST = Constants.SCALEMODE_NEAREST;
    /** Defines that texture rescaling will use a ceil to find the closer power of 2 size */
    public static readonly SCALEMODE_CEILING = Constants.SCALEMODE_CEILING;

    /**
     * Returns the current npm package of the sdk
     */
    // Not mixed with Version for tooling purpose.
    public static get NpmPackage(): string {
        return ThinEngine.NpmPackage;
    }

    /**
     * Returns the current version of the framework
     */
    public static get Version(): string {
        return ThinEngine.Version;
    }

    /** Gets the list of created engines */
    public static get Instances(): Engine[] {
        return EngineStore.Instances.map((e) => EngineStore._engineMappings.get(e)!);
    }

    /**
     * Gets the latest created engine
     */
    public static get LastCreatedEngine(): Nullable<Engine> {
        return EngineStore.LastCreatedEngine;
    }

    /**
     * Gets the latest created scene
     */
    public static get LastCreatedScene(): Nullable<Scene> {
        return EngineStore.LastCreatedScene;
    }

    /** @internal */
    /**
     * Engine abstraction for loading and creating an image bitmap from a given source string.
     * @param imageSource source to load the image from.
     * @param options An object that sets options for the image's extraction.
     * @returns ImageBitmap.
     */
    public _createImageBitmapFromSource(imageSource: string, options?: ImageBitmapOptions): Promise<ImageBitmap> {
        return _createImageBitmapFromSource({ createImageBitmap }, imageSource, options);
    }

    /**
     * Engine abstraction for createImageBitmap
     * @param image source for image
     * @param options An object that sets options for the image's extraction.
     * @returns ImageBitmap
     */
    public createImageBitmap(image: ImageBitmapSource, options?: ImageBitmapOptions): Promise<ImageBitmap> {
        return createImageBitmap(image, options);
    }

    /**
     * Resize an image and returns the image data as an uint8array
     * @param image image to resize
     * @param bufferWidth destination buffer width
     * @param bufferHeight destination buffer height
     * @returns an uint8array containing RGBA values of bufferWidth * bufferHeight size
     */
    public resizeImageBitmap(image: HTMLImageElement | ImageBitmap, bufferWidth: number, bufferHeight: number): Uint8Array {
        return resizeImageBitmap({ createCanvas: _CreateCanvas }, image, bufferWidth, bufferHeight);
    }

    /**
     * Will flag all materials in all scenes in all engines as dirty to trigger new shader compilation
     * @param flag defines which part of the materials must be marked as dirty
     * @param predicate defines a predicate used to filter which materials should be affected
     */
    public static MarkAllMaterialsAsDirty(flag: number, predicate?: (mat: Material) => boolean): void {
        MarkAllMaterialsAsDirty(flag, predicate);
    }

    /**
     * Method called to create the default loading screen.
     * This can be overridden in your own app.
     * @param canvas The rendering canvas element
     * @returns The loading screen
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static DefaultLoadingScreenFactory(canvas: HTMLCanvasElement): ILoadingScreen {
        throw _WarnImport("LoadingScreen");
    }

    /**
     * Method called to create the default rescale post process on each engine.
     */
    public static _RescalePostProcessFactory: Nullable<(engine: Engine) => PostProcess> = null;

    // Members

    public get enableOfflineSupport(): boolean {
        return this._engineState.enableOfflineSupport;
    }
    public set enableOfflineSupport(value: boolean) {
        this._engineState.enableOfflineSupport = value;
    }

    public get disableManifestCheck(): boolean {
        return this._engineState.disableManifestCheck;
    }
    public set disableManifestCheck(value: boolean) {
        this._engineState.disableManifestCheck = value;
    }

    public get disableContextMenu(): boolean {
        return this._engineState.disableContextMenu;
    }
    public set disableContextMenu(value: boolean) {
        this._engineState.disableContextMenu = value;
    }

    public get scenes(): Scene[] {
        return this._engineState.scenes;
    }

    public get _virtualScenes(): Scene[] {
        return this._engineState._virtualScenes;
    }
    public set _virtualScenes(value: Scene[]) {
        this._engineState._virtualScenes = value;
    }

    /**
     * Event raised when a new scene is created
     */
    public onNewSceneAddedObservable = new Observable<Scene>();

    /**
     * Gets the list of created postprocesses
     */
    public get postProcesses(): PostProcess[] {
        return this._engineState.postProcesses;
    }

    /**
     * Gets a boolean indicating if the pointer is currently locked
     */
    public get isPointerLock(): boolean {
        return this._engineState.isPointerLock;
    }

    // Observables

    /**
     * Observable event triggered each time the rendering canvas is resized
     */
    public onResizeObservable = new Observable<Engine>();

    /**
     * Observable event triggered each time the canvas loses focus
     */
    public onCanvasBlurObservable = new Observable<Engine>();

    /**
     * Observable event triggered each time the canvas gains focus
     */
    public onCanvasFocusObservable = new Observable<Engine>();

    /**
     * Observable event triggered each time the canvas receives pointerout event
     */
    public onCanvasPointerOutObservable = new Observable<PointerEvent>();

    /**
     * Observable raised when the engine begins a new frame
     */
    public onBeginFrameObservable = new Observable<Engine>();

    /**
     * If set, will be used to request the next animation frame for the render loop
     */
    public customAnimationFrameRequester: Nullable<ICustomAnimationFrameRequester> = null;

    /**
     * Observable raised when the engine ends the current frame
     */
    public onEndFrameObservable = new Observable<Engine>();

    /**
     * Observable raised when the engine is about to compile a shader
     */
    public onBeforeShaderCompilationObservable = new Observable<Engine>();

    /**
     * Observable raised when the engine has just compiled a shader
     */
    public onAfterShaderCompilationObservable = new Observable<Engine>();

    /**
     * Gets the audio engine
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic
     * @ignorenaming
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static audioEngine: Nullable<IAudioEngine>;

    /**
     * Default AudioEngine factory responsible of creating the Audio Engine.
     * By default, this will create a BabylonJS Audio Engine if the workload has been embedded.
     */
    public static AudioEngineFactory: (
        hostElement: Nullable<HTMLElement>,
        audioContext: Nullable<AudioContext>,
        audioDestination: Nullable<AudioDestinationNode | MediaStreamAudioDestinationNode>
    ) => IAudioEngine;

    /**
     * Default offline support factory responsible of creating a tool used to store data locally.
     * By default, this will create a Database object if the workload has been embedded.
     */
    public static OfflineProviderFactory: (urlToScene: string, callbackManifestChecked: (checked: boolean) => any, disableManifestCheck: boolean) => IOfflineProvider;

    // Deterministic lockstepMaxSteps
    protected _deterministicLockstep: boolean = false;
    protected _lockstepMaxSteps: number = 4;
    protected _timeStep: number = 1 / 60;

    protected get _supportsHardwareTextureRescaling() {
        return !!Engine._RescalePostProcessFactory;
    }

    /** @internal */
    public _drawCalls = new PerfCounter();

    /** Gets or sets the tab index to set to the rendering canvas. 1 is the minimum value to set to be able to capture keyboard events */
    public canvasTabIndex = 1;

    /**
     * Turn this value on if you want to pause FPS computation when in background
     */
    public disablePerformanceMonitorInBackground = false;
    /**
     * Gets the performance monitor attached to this engine
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#engineinstrumentation
     */
    public get performanceMonitor(): PerformanceMonitor {
        return this._engineState._performanceMonitor!;
    }

    protected _compatibilityMode = true;

    /**
     * (WebGPU only) True (default) to be in compatibility mode, meaning rendering all existing scenes without artifacts (same rendering than WebGL).
     * Setting the property to false will improve performances but may not work in some scenes if some precautions are not taken.
     * See https://doc.babylonjs.com/setup/support/webGPU/webGPUOptimization/webGPUNonCompatibilityMode for more details
     */
    public get compatibilityMode() {
        return this._compatibilityMode;
    }

    public set compatibilityMode(mode: boolean) {
        // not supported in WebGL
        this._compatibilityMode = true;
    }

    // Events

    /**
     * Gets the HTML element used to attach event listeners
     * @returns a HTML element
     */
    public getInputElement(): Nullable<HTMLElement> {
        return this._renderingCanvas;
    }

    /**
     * Creates a new engine
     * @param canvasOrContext defines the canvas or WebGL context to use for rendering. If you provide a WebGL context, Babylon.js will not hook events on the canvas (like pointers, keyboards, etc...) so no event observables will be available. This is mostly used when Babylon.js is used as a plugin on a system which already used the WebGL context
     * @param antialias defines enable antialiasing (default: false)
     * @param options defines further options to be sent to the getContext() function
     * @param adaptToDeviceRatio defines whether to adapt to the device's viewport characteristics (default: false)
     */
    constructor(
        canvasOrContext: Nullable<HTMLCanvasElement | OffscreenCanvas | WebGLRenderingContext | WebGL2RenderingContext>,
        antialias?: boolean,
        options?: EngineOptions,
        adaptToDeviceRatio: boolean = false
    ) {
        super(canvasOrContext, antialias, options, adaptToDeviceRatio);

        this._engineState.onBeginFrameObservable.add(() => {
            this.onBeginFrameObservable.notifyObservers(this);
        });
        this._engineState.onEndFrameObservable.add(() => {
            this.onEndFrameObservable.notifyObservers(this);
        });
        this._engineState.onBeforeShaderCompilationObservable.add(() => {
            this.onBeforeShaderCompilationObservable.notifyObservers(this);
        });
        this._engineState.onAfterShaderCompilationObservable.add(() => {
            this.onAfterShaderCompilationObservable.notifyObservers(this);
        });
        this._engineState.onResizeObservable.add(() => {
            this.onResizeObservable.notifyObservers(this);
        });
        this._engineState.onCanvasBlurObservable.add(() => {
            this.onCanvasBlurObservable.notifyObservers(this);
        });
        this._engineState.onCanvasFocusObservable.add(() => {
            this.onCanvasFocusObservable.notifyObservers(this);
        });

        augmentEngineState(this._engineState, {
            setDepthWrite,
        });

        EngineStoreLegacy.Instances.push(this);
    }

    // protected _initGLContext(): void {
    //     super._initGLContext();

    //     this._rescalePostProcess = null;
    // }

    /** @internal */
    public _verifyPointerLock(): void {
        _verifyPointerLock(this._engineState);
    }

    /**
     * Gets current aspect ratio
     * @param viewportOwner defines the camera to use to get the aspect ratio
     * @param useScreen defines if screen size must be used (or the current render target if any)
     * @returns a number defining the aspect ratio
     */
    public getAspectRatio(viewportOwner: IViewportOwnerLike, useScreen = false): number {
        return getAspectRatioBase({ getRenderHeightFunc: getRenderHeight, getRenderWidthFunc: getRenderWidth }, this._engineState, viewportOwner, useScreen);
    }

    /**
     * Gets current screen aspect ratio
     * @returns a number defining the aspect ratio
     */
    public getScreenAspectRatio(): number {
        return getScreenAspectRatioBase({ getRenderHeightFunc: getRenderHeight, getRenderWidthFunc: getRenderWidth }, this._engineState);
    }

    /**
     * Gets the client rect of the HTML canvas attached with the current webGL context
     * @returns a client rectangle
     */
    public getRenderingCanvasClientRect(): Nullable<ClientRect> {
        return getRenderingCanvasClientRect(this._engineState);
    }

    /**
     * Gets the client rect of the HTML element used for events
     * @returns a client rectangle
     */
    public getInputElementClientRect(): Nullable<ClientRect> {
        return getInputElementClientRect(this._engineState);
    }

    /**
     * Gets a boolean indicating that the engine is running in deterministic lock step mode
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
     * @returns true if engine is in deterministic lock step mode
     */
    public isDeterministicLockStep(): boolean {
        return this._engineState._deterministicLockstep;
    }

    /**
     * Gets the max steps when engine is running in deterministic lock step
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#deterministic-lockstep
     * @returns the max steps
     */
    public getLockstepMaxSteps(): number {
        return this._engineState._lockstepMaxSteps;
    }

    /**
     * Returns the time in ms between steps when using deterministic lock step.
     * @returns time step in (ms)
     */
    public getTimeStep(): number {
        return this._engineState._timeStep * 1000;
    }

    /**
     * Force the mipmap generation for the given render target texture
     * @param texture defines the render target texture to use
     * @param unbind defines whether or not to unbind the texture after generation. Defaults to true.
     */
    public generateMipMapsForCubemap(texture: InternalTexture, unbind = true) {
        generateMipMapsForCubemap(this._engineState, texture, unbind);
    }

    /** States */

    /**
     * Gets a boolean indicating if depth writing is enabled
     * @returns the current depth writing state
     */
    public getDepthWrite(): boolean {
        return this._engineState._depthCullingState.depthMask;
    }

    /**
     * Enable or disable depth writing
     * @param enable defines the state to set
     */
    public setDepthWrite(enable: boolean): void {
        this._engineState._depthCullingState.depthMask = enable;
    }

    /**
     * Gets a boolean indicating if stencil buffer is enabled
     * @returns the current stencil buffer state
     */
    public getStencilBuffer(): boolean {
        return this._engineState._stencilState.stencilTest;
    }

    /**
     * Enable or disable the stencil buffer
     * @param enable defines if the stencil buffer must be enabled or disabled
     */
    public setStencilBuffer(enable: boolean): void {
        this._engineState._stencilState.stencilTest = enable;
    }

    /**
     * Gets the current stencil mask
     * @returns a number defining the new stencil mask to use
     */
    public getStencilMask(): number {
        return this._engineState._stencilState.stencilMask;
    }

    /**
     * Sets the current stencil mask
     * @param mask defines the new stencil mask to use
     */
    public setStencilMask(mask: number): void {
        this._engineState._stencilState.stencilMask = mask;
    }

    /**
     * Gets the current stencil function
     * @returns a number defining the stencil function to use
     */
    public getStencilFunction(): number {
        return this._engineState._stencilState.stencilFunc;
    }

    /**
     * Gets the current stencil reference value
     * @returns a number defining the stencil reference value to use
     */
    public getStencilFunctionReference(): number {
        return this._engineState._stencilState.stencilFuncRef;
    }

    /**
     * Gets the current stencil mask
     * @returns a number defining the stencil mask to use
     */
    public getStencilFunctionMask(): number {
        return this._engineState._stencilState.stencilFuncMask;
    }

    /**
     * Sets the current stencil function
     * @param stencilFunc defines the new stencil function to use
     */
    public setStencilFunction(stencilFunc: number) {
        this._engineState._stencilState.stencilFunc = stencilFunc;
    }

    /**
     * Sets the current stencil reference
     * @param reference defines the new stencil reference to use
     */
    public setStencilFunctionReference(reference: number) {
        this._engineState._stencilState.stencilFuncRef = reference;
    }

    /**
     * Sets the current stencil mask
     * @param mask defines the new stencil mask to use
     */
    public setStencilFunctionMask(mask: number) {
        this._engineState._stencilState.stencilFuncMask = mask;
    }

    /**
     * Gets the current stencil operation when stencil fails
     * @returns a number defining stencil operation to use when stencil fails
     */
    public getStencilOperationFail(): number {
        return this._engineState._stencilState.stencilOpStencilFail;
    }

    /**
     * Gets the current stencil operation when depth fails
     * @returns a number defining stencil operation to use when depth fails
     */
    public getStencilOperationDepthFail(): number {
        return this._engineState._stencilState.stencilOpDepthFail;
    }

    /**
     * Gets the current stencil operation when stencil passes
     * @returns a number defining stencil operation to use when stencil passes
     */
    public getStencilOperationPass(): number {
        return this._engineState._stencilState.stencilOpStencilDepthPass;
    }

    /**
     * Sets the stencil operation to use when stencil fails
     * @param operation defines the stencil operation to use when stencil fails
     */
    public setStencilOperationFail(operation: number): void {
        this._engineState._stencilState.stencilOpStencilFail = operation;
    }

    /**
     * Sets the stencil operation to use when depth fails
     * @param operation defines the stencil operation to use when depth fails
     */
    public setStencilOperationDepthFail(operation: number): void {
        this._engineState._stencilState.stencilOpDepthFail = operation;
    }

    /**
     * Sets the stencil operation to use when stencil passes
     * @param operation defines the stencil operation to use when stencil passes
     */
    public setStencilOperationPass(operation: number): void {
        this._engineState._stencilState.stencilOpStencilDepthPass = operation;
    }

    /**
     * Sets a boolean indicating if the dithering state is enabled or disabled
     * @param value defines the dithering state
     */
    public setDitheringState(value: boolean): void {
        setDitheringState(this._engineState, value);
    }

    /**
     * Sets a boolean indicating if the rasterizer state is enabled or disabled
     * @param value defines the rasterizer state
     */
    public setRasterizerState(value: boolean): void {
        setRasterizerState(this._engineState, value);
    }

    /**
     * Gets the current depth function
     * @returns a number defining the depth function
     */
    public getDepthFunction(): Nullable<number> {
        return this._engineState._depthCullingState.depthFunc;
    }

    /**
     * Sets the current depth function
     * @param depthFunc defines the function to use
     */
    public setDepthFunction(depthFunc: number) {
        this._engineState._depthCullingState.depthFunc = depthFunc;
    }

    /**
     * Sets the current depth function to GREATER
     */
    public setDepthFunctionToGreater(): void {
        this.setDepthFunction(Constants.GREATER);
    }

    /**
     * Sets the current depth function to GEQUAL
     */
    public setDepthFunctionToGreaterOrEqual(): void {
        this.setDepthFunction(Constants.GEQUAL);
    }

    /**
     * Sets the current depth function to LESS
     */
    public setDepthFunctionToLess(): void {
        this.setDepthFunction(Constants.LESS);
    }

    /**
     * Sets the current depth function to LEQUAL
     */
    public setDepthFunctionToLessOrEqual(): void {
        this.setDepthFunction(Constants.LEQUAL);
    }

    /**
     * Caches the state of the stencil buffer
     */
    public cacheStencilState() {
        cacheStencilState(this._engineState);
    }

    /**
     * Restores the state of the stencil buffer
     */
    public restoreStencilState() {
        restoreStencilState(this._engineState);
    }

    /**
     * Directly set the WebGL Viewport
     * @param x defines the x coordinate of the viewport (in screen space)
     * @param y defines the y coordinate of the viewport (in screen space)
     * @param width defines the width of the viewport (in screen space)
     * @param height defines the height of the viewport (in screen space)
     * @returns the current viewport Object (if any) that is being replaced by this call. You can restore this viewport later on to go back to the original state
     */
    public setDirectViewport(x: number, y: number, width: number, height: number): Nullable<IViewportLike> {
        return setDirectViewport(this._engineState, x, y, width, height);
    }

    /**
     * Executes a scissor clear (ie. a clear on a specific portion of the screen)
     * @param x defines the x-coordinate of the bottom left corner of the clear rectangle
     * @param y defines the y-coordinate of the corner of the clear rectangle
     * @param width defines the width of the clear rectangle
     * @param height defines the height of the clear rectangle
     * @param clearColor defines the clear color
     */
    public scissorClear(x: number, y: number, width: number, height: number, clearColor: IColor4Like): void {
        scissorClear(this._engineState, x, y, width, height, clearColor);
    }

    /**
     * Enable scissor test on a specific rectangle (ie. render will only be executed on a specific portion of the screen)
     * @param x defines the x-coordinate of the bottom left corner of the clear rectangle
     * @param y defines the y-coordinate of the corner of the clear rectangle
     * @param width defines the width of the clear rectangle
     * @param height defines the height of the clear rectangle
     */
    public enableScissor(x: number, y: number, width: number, height: number): void {
        enableScissor(this._engineState, x, y, width, height);
    }

    /**
     * Disable previously set scissor test rectangle
     */
    public disableScissor() {
        disableScissor(this._engineState);
    }

    /**
     * @internal
     */
    public _reportDrawCall(numDrawCalls = 1) {
        _reportDrawCall(this._engineState, numDrawCalls);
    }

    /**
     * @internal
     */
    public _loadFileAsync(url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean): Promise<string | ArrayBuffer> {
        return new Promise((resolve, reject) => {
            _loadFile(
                this._engineState,
                url,
                (data) => {
                    resolve(data);
                },
                undefined,
                offlineProvider,
                useArrayBuffer,
                (request, exception) => {
                    reject(exception);
                }
            );
        });
    }

    /**
     * Gets the source code of the vertex shader associated with a specific webGL program
     * @param program defines the program to use
     * @returns a string containing the source code of the vertex shader associated with the program
     */
    public getVertexShaderSource(program: WebGLProgram): Nullable<string> {
        return getVertexShaderSource(this._engineState, program);
    }

    /**
     * Gets the source code of the fragment shader associated with a specific webGL program
     * @param program defines the program to use
     * @returns a string containing the source code of the fragment shader associated with the program
     */
    public getFragmentShaderSource(program: WebGLProgram): Nullable<string> {
        return getFragmentShaderSource(this._engineState, program);
    }

    /**
     * Sets a depth stencil texture from a render target to the according uniform.
     * @param channel The texture channel
     * @param uniform The uniform to set
     * @param texture The render target texture containing the depth stencil texture to apply
     * @param name The texture name
     */
    public setDepthStencilTexture(channel: number, uniform: Nullable<WebGLUniformLocation>, texture: Nullable<RenderTargetTexture>, name?: string): void {
        setDepthStencilTexture(this._engineState, channel, uniform, texture, name);
    }

    /**
     * Sets a texture to the webGL context from a postprocess
     * @param channel defines the channel to use
     * @param postProcess defines the source postprocess
     * @param name name of the channel
     */
    public setTextureFromPostProcess(channel: number, postProcess: Nullable<PostProcess>, name: string): void {
        setTextureFromPostProcess(this._engineState, channel, postProcess, name);
    }

    /**
     * Binds the output of the passed in post process to the texture channel specified
     * @param channel The channel the texture should be bound to
     * @param postProcess The post process which's output should be bound
     * @param name name of the channel
     */
    public setTextureFromPostProcessOutput(channel: number, postProcess: Nullable<PostProcess>, name: string): void {
        setTextureFromPostProcessOutput(this._engineState, channel, postProcess, name);
    }

    // protected _rebuildBuffers(): void {
    //     // Index / Vertex
    //     for (const scene of this.scenes) {
    //         scene.resetCachedMaterial();
    //         scene._rebuildGeometries();
    //         scene._rebuildTextures();
    //     }

    //     for (const scene of this._virtualScenes) {
    //         scene.resetCachedMaterial();
    //         scene._rebuildGeometries();
    //         scene._rebuildTextures();
    //     }

    //     super._rebuildBuffers();
    // }

    /** @internal */
    public _renderFrame() {
        _renderFrame(this._engineState);
    }

    protected _cancelFrame() {
        _cancelFrame(this._engineState);
    }

    // public _renderLoop(): void {
    //     if (!this._contextWasLost) {
    //         let shouldRender = true;
    //         if (this.isDisposed || (!this.renderEvenInBackground && this._windowIsBackground)) {
    //             shouldRender = false;
    //         }

    //         if (shouldRender) {
    //             // Start new frame
    //             this.beginFrame();

    //             // Child canvases
    //             if (!this._renderViews()) {
    //                 // Main frame
    //                 this._renderFrame();
    //             }

    //             // Present
    //             this.endFrame();
    //         }
    //     }

    //     if (this._activeRenderLoops.length > 0) {
    //         // Register new frame
    //         if (this.customAnimationFrameRequester) {
    //             this.customAnimationFrameRequester.requestID = this._queueNewFrame(
    //                 this.customAnimationFrameRequester.renderFunction || this._boundRenderFunction,
    //                 this.customAnimationFrameRequester
    //             );
    //             this._frameHandler = this.customAnimationFrameRequester.requestID;
    //         } else {
    //             this._frameHandler = this._queueNewFrame(this._boundRenderFunction, this.getHostWindow());
    //         }
    //     } else {
    //         this._renderingQueueLaunched = false;
    //     }
    // }

    /** @internal */
    public _renderViews() {
        return false;
    }

    /**
     * Toggle full screen mode
     * @param requestPointerLock defines if a pointer lock should be requested from the user
     */
    public switchFullscreen(requestPointerLock: boolean): void {
        switchFullscreen(this._engineState, requestPointerLock);
    }

    /**
     * Enters full screen mode
     * @param requestPointerLock defines if a pointer lock should be requested from the user
     */
    public enterFullscreen(requestPointerLock: boolean): void {
        enterFullscreen(this._engineState, requestPointerLock);
    }

    /**
     * Exits full screen mode
     */
    public exitFullscreen(): void {
        exitFullscreen(this._engineState);
    }

    /**
     * Enters Pointerlock mode
     */
    public enterPointerlock(): void {
        enterPointerlock(this._engineState);
    }

    /**
     * Exits Pointerlock mode
     */
    public exitPointerlock(): void {
        _ExitPointerlock();
    }

    /**
     * Begin a new frame
     */
    public beginFrame = () => {
        beginFrame(this._engineState);
    };

    /**
     * End the current frame
     */
    public endFrame = () => {
        endFrame(this._engineState);
    };

    /**
     * Force a specific size of the canvas
     * @param width defines the new canvas' width
     * @param height defines the new canvas' height
     * @param forceSetSize true to force setting the sizes of the underlying canvas
     * @returns true if the size was changed
     */
    public setSize(width: number, height: number, forceSetSize = false): boolean {
        return setSize(this._engineState, width, height, forceSetSize);
    }

    // public _deletePipelineContext(pipelineContext: IPipelineContext): void {
    //     const webGLPipelineContext = pipelineContext as WebGLPipelineContext;
    //     if (webGLPipelineContext && webGLPipelineContext.program) {
    //         if (webGLPipelineContext.transformFeedback) {
    //             this.deleteTransformFeedback(webGLPipelineContext.transformFeedback);
    //             webGLPipelineContext.transformFeedback = null;
    //         }
    //     }
    //     super._deletePipelineContext(pipelineContext);
    // }

    public createShaderProgram(
        pipelineContext: IPipelineContext,
        vertexCode: string,
        fragmentCode: string,
        defines: Nullable<string>,
        context?: WebGLRenderingContext,
        transformFeedbackVaryings: Nullable<string[]> = null
    ): WebGLProgram {
        return createShaderProgram(this._engineState, pipelineContext, vertexCode, fragmentCode, defines, context, transformFeedbackVaryings);
    }

    protected _createShaderProgram(
        pipelineContext: WebGLPipelineContext,
        vertexShader: WebGLShader,
        fragmentShader: WebGLShader,
        context: WebGLRenderingContext,
        transformFeedbackVaryings: Nullable<string[]> = null
    ): WebGLProgram {
        return _createShaderProgram(this._engineState, pipelineContext, vertexShader, fragmentShader, context, transformFeedbackVaryings);
    }

    // /**
    //  * @internal
    //  */
    // public _releaseTexture(texture: InternalTexture): void {
    //     super._releaseTexture(texture);
    // }

    /**
     * @internal
     */
    // public _releaseRenderTargetWrapper(rtWrapper: RenderTargetWrapper): void {
    //     super._releaseRenderTargetWrapper(rtWrapper);

    //     // Set output texture of post process to null if the framebuffer has been released/disposed
    //     this.scenes.forEach((scene) => {
    //         scene.postProcesses.forEach((postProcess) => {
    //             if (postProcess._outputTexture === rtWrapper) {
    //                 postProcess._outputTexture = null;
    //             }
    //         });
    //         scene.cameras.forEach((camera) => {
    //             camera._postProcesses.forEach((postProcess) => {
    //                 if (postProcess) {
    //                     if (postProcess._outputTexture === rtWrapper) {
    //                         postProcess._outputTexture = null;
    //                     }
    //                 }
    //             });
    //         });
    //     });
    // }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected static _RenderPassIdCounter = 0;
    /**
     * Gets or sets the current render pass id
     */
    public currentRenderPassId = Constants.RENDERPASS_MAIN;
    /**
     * Gets the names of the render passes that are currently created
     * @returns list of the render pass names
     */
    public getRenderPassNames(): string[] {
        return getRenderPassNames(this._engineState);
    }

    /**
     * Gets the name of the current render pass
     * @returns name of the current render pass
     */
    public getCurrentRenderPassName(): string {
        return getCurrentRenderPassName(this._engineState);
    }

    /**
     * Creates a render pass id
     * @param name Name of the render pass (for debug purpose only)
     * @returns the id of the new render pass
     */
    public createRenderPassId(name?: string) {
        return createRenderPassId(this._engineState, name);
    }

    /**
     * Releases a render pass id
     * @param id id of the render pass to release
     */
    public releaseRenderPassId(id: number): void {
        releaseRenderPassId(this._engineState, id);
    }

    /**
     * @internal
     * Rescales a texture
     * @param source input texture
     * @param destination destination texture
     * @param scene scene to use to render the resize
     * @param internalFormat format to use when resizing
     * @param onComplete callback to be called when resize has completed
     */
    public _rescaleTexture(source: InternalTexture, destination: InternalTexture, scene: Nullable<any>, internalFormat: number, onComplete: () => void): void {
        _rescaleTexture(this._engineState, source, destination, scene, internalFormat, onComplete);
    }

    // FPS

    /**
     * Gets the current framerate
     * @returns a number representing the framerate
     */
    public getFps(): number {
        return this._engineState._fps;
    }

    /**
     * Gets the time spent between current and previous frame
     * @returns a number representing the delta time in ms
     */
    public getDeltaTime(): number {
        return this._engineState._deltaTime;
    }

    /**
     * Wraps an external web gl texture in a Babylon texture.
     * @param texture defines the external texture
     * @param hasMipMaps defines whether the external texture has mip maps (default: false)
     * @param samplingMode defines the sampling mode for the external texture (default: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE)
     * @param width defines the width for the external texture (default: 0)
     * @param height defines the height for the external texture (default: 0)
     * @returns the babylon internal texture
     */
    public wrapWebGLTexture(
        texture: WebGLTexture,
        hasMipMaps: boolean = false,
        samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        width: number = 0,
        height: number = 0
    ): InternalTexture {
        return wrapWebGLTexture(this._engineState, texture, hasMipMaps, samplingMode, width, height);
    }

    /**
     * @internal
     */
    public _uploadImageToTexture(texture: InternalTexture, image: HTMLImageElement | ImageBitmap, faceIndex: number = 0, lod: number = 0) {
        _uploadImageToTexture(this._engineState, texture, image, faceIndex, lod);
    }

    /**
     * Updates a depth texture Comparison Mode and Function.
     * If the comparison Function is equal to 0, the mode will be set to none.
     * Otherwise, this only works in webgl 2 and requires a shadow sampler in the shader.
     * @param texture The texture to set the comparison function for
     * @param comparisonFunction The comparison function to set, 0 if no comparison required
     */
    public updateTextureComparisonFunction(texture: InternalTexture, comparisonFunction: number): void {
        updateTextureComparisonFunction(this._engineState, texture, comparisonFunction);
    }

    /**
     * Creates a webGL buffer to use with instantiation
     * @param capacity defines the size of the buffer
     * @returns the webGL buffer
     */
    public createInstancesBuffer(capacity: number): DataBuffer {
        return createInstancesBuffer(this._engineState, capacity);
    }

    /**
     * Delete a webGL buffer used with instantiation
     * @param buffer defines the webGL buffer to delete
     */
    public deleteInstancesBuffer(buffer: WebGLBuffer): void {
        deleteInstancesBuffer(this._engineState, buffer);
    }

    /**
     * @internal
     */
    public _readPixelsAsync(x: number, y: number, w: number, h: number, format: number, type: number, outputBuffer: ArrayBufferView) {
        return _readPixelsAsync(this._engineState, x, y, w, h, format, type, outputBuffer);
    }

    public dispose(): void {
        EngineStoreLegacy.Instances.splice(EngineStoreLegacy.Instances.indexOf(this), 1);
    }
    //     this.hideLoadingUI();

    //     this.onNewSceneAddedObservable.clear();

    //     // Release postProcesses
    //     while (this.postProcesses.length) {
    //         this.postProcesses[0].dispose();
    //     }

    //     // Rescale PP
    //     if (this._rescalePostProcess) {
    //         this._rescalePostProcess.dispose();
    //     }

    //     // Release scenes
    //     while (this.scenes.length) {
    //         this.scenes[0].dispose();
    //     }

    //     while (this._virtualScenes.length) {
    //         this._virtualScenes[0].dispose();
    //     }

    //     // Release audio engine
    //     if (EngineStore.Instances.length === 1 && Engine.audioEngine) {
    //         Engine.audioEngine.dispose();
    //         Engine.audioEngine = null;
    //     }

    //     // Events
    //     const hostWindow = this.getHostWindow(); // it calls IsWindowObjectExist()
    //     if (hostWindow && typeof hostWindow.removeEventListener === "function") {
    //         hostWindow.removeEventListener("blur", this._onBlur);
    //         hostWindow.removeEventListener("focus", this._onFocus);
    //     }

    //     if (this._renderingCanvas) {
    //         this._renderingCanvas.removeEventListener("focus", this._onCanvasFocus);
    //         this._renderingCanvas.removeEventListener("blur", this._onCanvasBlur);
    //         this._renderingCanvas.removeEventListener("pointerout", this._onCanvasPointerOut);
    //         this._renderingCanvas.removeEventListener("contextmenu", this._onCanvasContextMenu);
    //     }

    //     if (IsDocumentAvailable()) {
    //         document.removeEventListener("fullscreenchange", this._onFullscreenChange);
    //         document.removeEventListener("mozfullscreenchange", this._onFullscreenChange);
    //         document.removeEventListener("webkitfullscreenchange", this._onFullscreenChange);
    //         document.removeEventListener("msfullscreenchange", this._onFullscreenChange);
    //         document.removeEventListener("pointerlockchange", this._onPointerLockChange);
    //         document.removeEventListener("mspointerlockchange", this._onPointerLockChange);
    //         document.removeEventListener("mozpointerlockchange", this._onPointerLockChange);
    //         document.removeEventListener("webkitpointerlockchange", this._onPointerLockChange);
    //     }

    //     super.dispose();

    //     // Remove from Instances
    //     const index = EngineStore.Instances.indexOf(this._engineState);

    //     if (index >= 0) {
    //         EngineStore.Instances.splice(index, 1);
    //     }

    //     // no more engines left in the engine store? Notify!
    //     if (!Engine.Instances.length) {
    //         EngineStore.OnEnginesDisposedObservable.notifyObservers(this);
    //     }

    //     // Observables
    //     this.onResizeObservable.clear();
    //     this.onCanvasBlurObservable.clear();
    //     this.onCanvasFocusObservable.clear();
    //     this.onCanvasPointerOutObservable.clear();
    //     this.onBeginFrameObservable.clear();
    //     this.onEndFrameObservable.clear();
    // }

    // Loading screen

    /**
     * Display the loading screen
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
     */
    public displayLoadingUI(): void {
        displayLoadingUI(this._engineState);
    }

    /**
     * Hide the loading screen
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
     */
    public hideLoadingUI(): void {
        hideLoadingUI(this._engineState);
    }

    /**
     * Gets the current loading screen object
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
     */
    public get loadingScreen(): ILoadingScreen {
        return getLoadingScreen(this._engineState);
    }

    /**
     * Sets the current loading screen object
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
     */
    public set loadingScreen(loadingScreen: ILoadingScreen) {
        setLoadingScreen(this._engineState, loadingScreen);
    }

    /**
     * Sets the current loading screen text
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
     */
    public set loadingUIText(text: string) {
        this.loadingScreen.loadingUIText = text;
    }

    /**
     * Sets the current loading screen background color
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
     */
    public set loadingUIBackgroundColor(color: string) {
        this.loadingScreen.loadingUIBackgroundColor = color;
    }

    /**
     * creates and returns a new video element
     * @param constraints video constraints
     * @returns video element
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public createVideoElement(constraints: MediaTrackConstraints): any {
        return document.createElement("video");
    }

    /** Pointerlock and fullscreen */

    /**
     * Ask the browser to promote the current element to pointerlock mode
     * @param element defines the DOM element to promote
     */
    static _RequestPointerlock(element: HTMLElement): void {
        _RequestPointerlock(element);
    }

    /**
     * Asks the browser to exit pointerlock mode
     */
    static _ExitPointerlock(): void {
        _ExitPointerlock();
    }

    /**
     * Ask the browser to promote the current element to fullscreen rendering mode
     * @param element defines the DOM element to promote
     */
    static _RequestFullscreen(element: HTMLElement): void {
        _RequestFullscreen(element);
    }

    /**
     * Asks the browser to exit fullscreen mode
     */
    static _ExitFullscreen(): void {
        _ExitFullscreen();
    }

    /**
     * Get Font size information
     * @param font font name
     * @returns an object containing ascent, height and descent
     */
    public getFontOffset(font: string): { ascent: number; height: number; descent: number } {
        return getFontOffset(font);
    }
}
