import { Observable } from "../Misc/observable";
import { Nullable, IndicesArray, DataArray } from "../types";
import { Scene } from "../scene";
import { InternalTexture } from "../Materials/Textures/internalTexture";
import { IAudioEngine } from "../Audio/audioEngine";
import { IOfflineProvider } from "../Offline/IOfflineProvider";
import { ILoadingScreen } from "../Loading/loadingScreen";
import { DomManagement } from "../Misc/domManagement";
import { EngineStore } from "./engineStore";
import { _DevTools } from '../Misc/devTools';
import { WebGLPipelineContext } from './WebGL/webGLPipelineContext';
import { IPipelineContext } from './IPipelineContext';
import { ICustomAnimationFrameRequester } from '../Misc/customAnimationFrameRequester';
import { ThinEngine, EngineOptions } from './thinEngine';
import { Constants } from './constants';
import { IViewportLike, IColor4Like } from '../Maths/math.like';
import { RenderTargetTexture } from '../Materials/Textures/renderTargetTexture';
import { PerformanceMonitor } from '../Misc/performanceMonitor';
import { DataBuffer } from '../Meshes/dataBuffer';
import { PerfCounter } from '../Misc/perfCounter';
import { WebGLDataBuffer } from '../Meshes/WebGL/webGLDataBuffer';
import { Logger } from '../Misc/logger';

import "./Extensions/engine.alpha";
import "./Extensions/engine.readTexture";

declare type Material = import("../Materials/material").Material;
declare type PostProcess = import("../PostProcesses/postProcess").PostProcess;

/**
 * Defines the interface used by display changed events
 */
export interface IDisplayChangedEventArgs {
    /** Gets the vrDisplay object (if any) */
    vrDisplay: Nullable<any>;
    /** Gets a boolean indicating if webVR is supported */
    vrSupported: boolean;
}

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

    /** Defines that the ressource is not delayed*/
    public static readonly DELAYLOADSTATE_NONE = Constants.DELAYLOADSTATE_NONE;
    /** Defines that the ressource was successfully delay loaded */
    public static readonly DELAYLOADSTATE_LOADED = Constants.DELAYLOADSTATE_LOADED;
    /** Defines that the ressource is currently delay loading */
    public static readonly DELAYLOADSTATE_LOADING = Constants.DELAYLOADSTATE_LOADING;
    /** Defines that the ressource is delayed and has not started loading */
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

    /** nearest is mag = nearest and min = nearest and mip = linear */
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
        return EngineStore.Instances;
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

    /**
     * Will flag all materials in all scenes in all engines as dirty to trigger new shader compilation
     * @param flag defines which part of the materials must be marked as dirty
     * @param predicate defines a predicate used to filter which materials should be affected
     */
    public static MarkAllMaterialsAsDirty(flag: number, predicate?: (mat: Material) => boolean): void {
        for (var engineIndex = 0; engineIndex < Engine.Instances.length; engineIndex++) {
            var engine = Engine.Instances[engineIndex];

            for (var sceneIndex = 0; sceneIndex < engine.scenes.length; sceneIndex++) {
                engine.scenes[sceneIndex].markAllMaterialsAsDirty(flag, predicate);
            }
        }
    }

    /**
     * Method called to create the default loading screen.
     * This can be overriden in your own app.
     * @param canvas The rendering canvas element
     * @returns The loading screen
     */
    public static DefaultLoadingScreenFactory(canvas: HTMLCanvasElement): ILoadingScreen {
        throw _DevTools.WarnImport("LoadingScreen");
    }

    /**
     * Method called to create the default rescale post process on each engine.
     */
    public static _RescalePostProcessFactory: Nullable<(engine: Engine) => PostProcess> = null;

    // Members

    /**
     * Gets or sets a boolean to enable/disable IndexedDB support and avoid XHR on .manifest
     **/
    public enableOfflineSupport = false;

    /**
     * Gets or sets a boolean to enable/disable checking manifest if IndexedDB support is enabled (js will always consider the database is up to date)
     **/
    public disableManifestCheck = false;

    /**
     * Gets the list of created scenes
     */
    public scenes = new Array<Scene>();

    /**
     * Event raised when a new scene is created
     */
    public onNewSceneAddedObservable = new Observable<Scene>();

    /**
     * Gets the list of created postprocesses
     */
    public postProcesses = new Array<PostProcess>();

    /**
     * Gets a boolean indicating if the pointer is currently locked
     */
    public isPointerLock = false;

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
     * Observable raised when the engine has jsut compiled a shader
     */
    public onAfterShaderCompilationObservable = new Observable<Engine>();

    /**
     * Gets the audio engine
     * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music
     * @ignorenaming
     */
    public static audioEngine: IAudioEngine;

    /**
     * Default AudioEngine factory responsible of creating the Audio Engine.
     * By default, this will create a BabylonJS Audio Engine if the workload has been embedded.
     */
    public static AudioEngineFactory: (hostElement: Nullable<HTMLElement>) => IAudioEngine;

    /**
     * Default offline support factory responsible of creating a tool used to store data locally.
     * By default, this will create a Database object if the workload has been embedded.
     */
    public static OfflineProviderFactory: (urlToScene: string, callbackManifestChecked: (checked: boolean) => any, disableManifestCheck: boolean) => IOfflineProvider;

    private _loadingScreen: ILoadingScreen;
    private _pointerLockRequested: boolean;
    private _rescalePostProcess: PostProcess;

    // Deterministic lockstepMaxSteps
    private _deterministicLockstep: boolean = false;
    private _lockstepMaxSteps: number = 4;
    private _timeStep: number = 1 / 60;

    protected get _supportsHardwareTextureRescaling() {
        return !!Engine._RescalePostProcessFactory;
    }

    // FPS
    private _fps = 60;
    private _deltaTime = 0;

    /** @hidden */
    public _drawCalls = new PerfCounter();

    /** Gets or sets the tab index to set to the rendering canvas. 1 is the minimum value to set to be able to capture keyboard events */
    public canvasTabIndex = 1;

    /**
     * Turn this value on if you want to pause FPS computation when in background
     */
    public disablePerformanceMonitorInBackground = false;

    private _performanceMonitor = new PerformanceMonitor();
    /**
     * Gets the performance monitor attached to this engine
     * @see http://doc.babylonjs.com/how_to/optimizing_your_scene#engineinstrumentation
     */
    public get performanceMonitor(): PerformanceMonitor {
        return this._performanceMonitor;
    }

    // Focus
    private _onFocus: () => void;
    private _onBlur: () => void;
    private _onCanvasPointerOut: (event: PointerEvent) => void;
    private _onCanvasBlur: () => void;
    private _onCanvasFocus: () => void;

    private _onFullscreenChange: () => void;
    private _onPointerLockChange: () => void;

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
     * @param canvasOrContext defines the canvas or WebGL context to use for rendering. If you provide a WebGL context, Babylon.js will not hook events on the canvas (like pointers, keyboards, etc...) so no event observables will be available. This is mostly used when Babylon.js is used as a plugin on a system which alreay used the WebGL context
     * @param antialias defines enable antialiasing (default: false)
     * @param options defines further options to be sent to the getContext() function
     * @param adaptToDeviceRatio defines whether to adapt to the device's viewport characteristics (default: false)
     */
    constructor(canvasOrContext: Nullable<HTMLCanvasElement | WebGLRenderingContext>, antialias?: boolean, options?: EngineOptions, adaptToDeviceRatio: boolean = false) {
        super(canvasOrContext, antialias, options, adaptToDeviceRatio);

        if (!canvasOrContext) {
            return;
        }

        options = this._creationOptions;

        Engine.Instances.push(this);

        if ((<any>canvasOrContext).getContext) {
            let canvas = <HTMLCanvasElement>canvasOrContext;

            this._onCanvasFocus = () => {
                this.onCanvasFocusObservable.notifyObservers(this);
            };

            this._onCanvasBlur = () => {
                this.onCanvasBlurObservable.notifyObservers(this);
            };

            canvas.addEventListener("focus", this._onCanvasFocus);
            canvas.addEventListener("blur", this._onCanvasBlur);

            this._onBlur = () => {
                if (this.disablePerformanceMonitorInBackground) {
                    this._performanceMonitor.disable();
                }
                this._windowIsBackground = true;
            };

            this._onFocus = () => {
                if (this.disablePerformanceMonitorInBackground) {
                    this._performanceMonitor.enable();
                }
                this._windowIsBackground = false;
            };

            this._onCanvasPointerOut = (ev) => {
                this.onCanvasPointerOutObservable.notifyObservers(ev);
            };

            canvas.addEventListener("pointerout", this._onCanvasPointerOut);

            if (DomManagement.IsWindowObjectExist()) {
                let hostWindow = this.getHostWindow()!;
                hostWindow.addEventListener("blur", this._onBlur);
                hostWindow.addEventListener("focus", this._onFocus);

                let anyDoc = document as any;

                // Fullscreen
                this._onFullscreenChange = () => {

                    if (anyDoc.fullscreen !== undefined) {
                        this.isFullscreen = anyDoc.fullscreen;
                    } else if (anyDoc.mozFullScreen !== undefined) {
                        this.isFullscreen = anyDoc.mozFullScreen;
                    } else if (anyDoc.webkitIsFullScreen !== undefined) {
                        this.isFullscreen = anyDoc.webkitIsFullScreen;
                    } else if (anyDoc.msIsFullScreen !== undefined) {
                        this.isFullscreen = anyDoc.msIsFullScreen;
                    }

                    // Pointer lock
                    if (this.isFullscreen && this._pointerLockRequested && canvas) {
                        Engine._RequestPointerlock(canvas);
                    }
                };

                document.addEventListener("fullscreenchange", this._onFullscreenChange, false);
                document.addEventListener("mozfullscreenchange", this._onFullscreenChange, false);
                document.addEventListener("webkitfullscreenchange", this._onFullscreenChange, false);
                document.addEventListener("msfullscreenchange", this._onFullscreenChange, false);

                // Pointer lock
                this._onPointerLockChange = () => {
                    this.isPointerLock = (anyDoc.mozPointerLockElement === canvas ||
                        anyDoc.webkitPointerLockElement === canvas ||
                        anyDoc.msPointerLockElement === canvas ||
                        anyDoc.pointerLockElement === canvas
                    );
                };

                document.addEventListener("pointerlockchange", this._onPointerLockChange, false);
                document.addEventListener("mspointerlockchange", this._onPointerLockChange, false);
                document.addEventListener("mozpointerlockchange", this._onPointerLockChange, false);
                document.addEventListener("webkitpointerlockchange", this._onPointerLockChange, false);

                // Create Audio Engine if needed.
                if (!Engine.audioEngine && options.audioEngine && Engine.AudioEngineFactory) {
                    Engine.audioEngine = Engine.AudioEngineFactory(this.getRenderingCanvas());
                }
            }

            this._connectVREvents();

            this.enableOfflineSupport = Engine.OfflineProviderFactory !== undefined;

            if (!options.doNotHandleTouchAction) {
                this._disableTouchAction();
            }

            this._deterministicLockstep = !!options.deterministicLockstep;
            this._lockstepMaxSteps = options.lockstepMaxSteps || 0;
            this._timeStep = options.timeStep || 1 / 60;

        }

        // Load WebVR Devices
        this._prepareVRComponent();
        if (options.autoEnableWebVR) {
            this.initWebVR();
        }
    }

    /**
     * Gets current aspect ratio
     * @param viewportOwner defines the camera to use to get the aspect ratio
     * @param useScreen defines if screen size must be used (or the current render target if any)
     * @returns a number defining the aspect ratio
     */
    public getAspectRatio(viewportOwner: IViewportOwnerLike, useScreen = false): number {
        var viewport = viewportOwner.viewport;
        return (this.getRenderWidth(useScreen) * viewport.width) / (this.getRenderHeight(useScreen) * viewport.height);
    }

    /**
     * Gets current screen aspect ratio
     * @returns a number defining the aspect ratio
     */
    public getScreenAspectRatio(): number {
        return (this.getRenderWidth(true)) / (this.getRenderHeight(true));
    }

    /**
     * Gets the client rect of the HTML canvas attached with the current webGL context
     * @returns a client rectanglee
     */
    public getRenderingCanvasClientRect(): Nullable<ClientRect> {
        if (!this._renderingCanvas) {
            return null;
        }
        return this._renderingCanvas.getBoundingClientRect();
    }

    /**
     * Gets the client rect of the HTML element used for events
     * @returns a client rectanglee
     */
    public getInputElementClientRect(): Nullable<ClientRect> {
        if (!this._renderingCanvas) {
            return null;
        }
        return this.getInputElement()!.getBoundingClientRect();
    }

    /**
     * Gets a boolean indicating that the engine is running in deterministic lock step mode
     * @see http://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
     * @returns true if engine is in deterministic lock step mode
     */
    public isDeterministicLockStep(): boolean {
        return this._deterministicLockstep;
    }

    /**
     * Gets the max steps when engine is running in deterministic lock step
     * @see http://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
     * @returns the max steps
     */
    public getLockstepMaxSteps(): number {
        return this._lockstepMaxSteps;
    }

    /**
     * Returns the time in ms between steps when using deterministic lock step.
     * @returns time step in (ms)
     */
    public getTimeStep(): number {
        return this._timeStep * 1000;
    }

    /**
     * Force the mipmap generation for the given render target texture
     * @param texture defines the render target texture to use
     * @param unbind defines whether or not to unbind the texture after generation. Defaults to true.
     */
    public generateMipMapsForCubemap(texture: InternalTexture, unbind = true) {
        if (texture.generateMipMaps) {
            var gl = this._gl;
            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture, true);
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            if (unbind) {
                this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);
            }
        }
    }

    /** States */

    /**
     * Set various states to the webGL context
     * @param culling defines backface culling state
     * @param zOffset defines the value to apply to zOffset (0 by default)
     * @param force defines if states must be applied even if cache is up to date
     * @param reverseSide defines if culling must be reversed (CCW instead of CW and CW instead of CCW)
     */
    public setState(culling: boolean, zOffset: number = 0, force?: boolean, reverseSide = false): void {
        // Culling
        if (this._depthCullingState.cull !== culling || force) {
            this._depthCullingState.cull = culling;
        }

        // Cull face
        var cullFace = this.cullBackFaces ? this._gl.BACK : this._gl.FRONT;
        if (this._depthCullingState.cullFace !== cullFace || force) {
            this._depthCullingState.cullFace = cullFace;
        }

        // Z offset
        this.setZOffset(zOffset);

        // Front face
        var frontFace = reverseSide ? this._gl.CW : this._gl.CCW;
        if (this._depthCullingState.frontFace !== frontFace || force) {
            this._depthCullingState.frontFace = frontFace;
        }
    }

    /**
     * Set the z offset to apply to current rendering
     * @param value defines the offset to apply
     */
    public setZOffset(value: number): void {
        this._depthCullingState.zOffset = value;
    }

    /**
     * Gets the current value of the zOffset
     * @returns the current zOffset state
     */
    public getZOffset(): number {
        return this._depthCullingState.zOffset;
    }

    /**
     * Enable or disable depth buffering
     * @param enable defines the state to set
     */
    public setDepthBuffer(enable: boolean): void {
        this._depthCullingState.depthTest = enable;
    }

    /**
     * Gets a boolean indicating if depth writing is enabled
     * @returns the current depth writing state
     */
    public getDepthWrite(): boolean {
        return this._depthCullingState.depthMask;
    }

    /**
     * Enable or disable depth writing
     * @param enable defines the state to set
     */
    public setDepthWrite(enable: boolean): void {
        this._depthCullingState.depthMask = enable;
    }

    /**
     * Gets a boolean indicating if stencil buffer is enabled
     * @returns the current stencil buffer state
     */
    public getStencilBuffer(): boolean {
        return this._stencilState.stencilTest;
    }

    /**
     * Enable or disable the stencil buffer
     * @param enable defines if the stencil buffer must be enabled or disabled
     */
    public setStencilBuffer(enable: boolean): void {
        this._stencilState.stencilTest = enable;
    }

    /**
     * Gets the current stencil mask
     * @returns a number defining the new stencil mask to use
     */
    public getStencilMask(): number {
        return this._stencilState.stencilMask;
    }

    /**
     * Sets the current stencil mask
     * @param mask defines the new stencil mask to use
     */
    public setStencilMask(mask: number): void {
        this._stencilState.stencilMask = mask;
    }

    /**
     * Gets the current stencil function
     * @returns a number defining the stencil function to use
     */
    public getStencilFunction(): number {
        return this._stencilState.stencilFunc;
    }

    /**
     * Gets the current stencil reference value
     * @returns a number defining the stencil reference value to use
     */
    public getStencilFunctionReference(): number {
        return this._stencilState.stencilFuncRef;
    }

    /**
     * Gets the current stencil mask
     * @returns a number defining the stencil mask to use
     */
    public getStencilFunctionMask(): number {
        return this._stencilState.stencilFuncMask;
    }

    /**
     * Sets the current stencil function
     * @param stencilFunc defines the new stencil function to use
     */
    public setStencilFunction(stencilFunc: number) {
        this._stencilState.stencilFunc = stencilFunc;
    }

    /**
     * Sets the current stencil reference
     * @param reference defines the new stencil reference to use
     */
    public setStencilFunctionReference(reference: number) {
        this._stencilState.stencilFuncRef = reference;
    }

    /**
     * Sets the current stencil mask
     * @param mask defines the new stencil mask to use
     */
    public setStencilFunctionMask(mask: number) {
        this._stencilState.stencilFuncMask = mask;
    }

    /**
     * Gets the current stencil operation when stencil fails
     * @returns a number defining stencil operation to use when stencil fails
     */
    public getStencilOperationFail(): number {
        return this._stencilState.stencilOpStencilFail;
    }

    /**
     * Gets the current stencil operation when depth fails
     * @returns a number defining stencil operation to use when depth fails
     */
    public getStencilOperationDepthFail(): number {
        return this._stencilState.stencilOpDepthFail;
    }

    /**
     * Gets the current stencil operation when stencil passes
     * @returns a number defining stencil operation to use when stencil passes
     */
    public getStencilOperationPass(): number {
        return this._stencilState.stencilOpStencilDepthPass;
    }

    /**
     * Sets the stencil operation to use when stencil fails
     * @param operation defines the stencil operation to use when stencil fails
     */
    public setStencilOperationFail(operation: number): void {
        this._stencilState.stencilOpStencilFail = operation;
    }

    /**
     * Sets the stencil operation to use when depth fails
     * @param operation defines the stencil operation to use when depth fails
     */
    public setStencilOperationDepthFail(operation: number): void {
        this._stencilState.stencilOpDepthFail = operation;
    }

    /**
     * Sets the stencil operation to use when stencil passes
     * @param operation defines the stencil operation to use when stencil passes
     */
    public setStencilOperationPass(operation: number): void {
        this._stencilState.stencilOpStencilDepthPass = operation;
    }

    /**
     * Sets a boolean indicating if the dithering state is enabled or disabled
     * @param value defines the dithering state
     */
    public setDitheringState(value: boolean): void {
        if (value) {
            this._gl.enable(this._gl.DITHER);
        } else {
            this._gl.disable(this._gl.DITHER);
        }
    }

    /**
     * Sets a boolean indicating if the rasterizer state is enabled or disabled
     * @param value defines the rasterizer state
     */
    public setRasterizerState(value: boolean): void {
        if (value) {
            this._gl.disable(this._gl.RASTERIZER_DISCARD);
        } else {
            this._gl.enable(this._gl.RASTERIZER_DISCARD);
        }
    }

    /**
     * Gets the current depth function
     * @returns a number defining the depth function
     */
    public getDepthFunction(): Nullable<number> {
        return this._depthCullingState.depthFunc;
    }

    /**
     * Sets the current depth function
     * @param depthFunc defines the function to use
     */
    public setDepthFunction(depthFunc: number) {
        this._depthCullingState.depthFunc = depthFunc;
    }

    /**
     * Sets the current depth function to GREATER
     */
    public setDepthFunctionToGreater(): void {
        this._depthCullingState.depthFunc = this._gl.GREATER;
    }

    /**
     * Sets the current depth function to GEQUAL
     */
    public setDepthFunctionToGreaterOrEqual(): void {
        this._depthCullingState.depthFunc = this._gl.GEQUAL;
    }

    /**
     * Sets the current depth function to LESS
     */
    public setDepthFunctionToLess(): void {
        this._depthCullingState.depthFunc = this._gl.LESS;
    }

    /**
     * Sets the current depth function to LEQUAL
     */
    public setDepthFunctionToLessOrEqual(): void {
        this._depthCullingState.depthFunc = this._gl.LEQUAL;
    }

    private _cachedStencilBuffer: boolean;
    private _cachedStencilFunction: number;
    private _cachedStencilMask: number;
    private _cachedStencilOperationPass: number;
    private _cachedStencilOperationFail: number;
    private _cachedStencilOperationDepthFail: number;
    private _cachedStencilReference: number;

    /**
     * Caches the the state of the stencil buffer
     */
    public cacheStencilState() {
        this._cachedStencilBuffer = this.getStencilBuffer();
        this._cachedStencilFunction = this.getStencilFunction();
        this._cachedStencilMask = this.getStencilMask();
        this._cachedStencilOperationPass = this.getStencilOperationPass();
        this._cachedStencilOperationFail = this.getStencilOperationFail();
        this._cachedStencilOperationDepthFail = this.getStencilOperationDepthFail();
        this._cachedStencilReference = this.getStencilFunctionReference();
    }

    /**
     * Restores the state of the stencil buffer
     */
    public restoreStencilState() {
        this.setStencilFunction(this._cachedStencilFunction);
        this.setStencilMask(this._cachedStencilMask);
        this.setStencilBuffer(this._cachedStencilBuffer);
        this.setStencilOperationPass(this._cachedStencilOperationPass);
        this.setStencilOperationFail(this._cachedStencilOperationFail);
        this.setStencilOperationDepthFail(this._cachedStencilOperationDepthFail);
        this.setStencilFunctionReference(this._cachedStencilReference);
    }

    /**
     * Directly set the WebGL Viewport
     * @param x defines the x coordinate of the viewport (in screen space)
     * @param y defines the y coordinate of the viewport (in screen space)
     * @param width defines the width of the viewport (in screen space)
     * @param height defines the height of the viewport (in screen space)
     * @return the current viewport Object (if any) that is being replaced by this call. You can restore this viewport later on to go back to the original state
     */
    public setDirectViewport(x: number, y: number, width: number, height: number): Nullable<IViewportLike> {
        let currentViewport = this._cachedViewport;
        this._cachedViewport = null;

        this._viewport(x, y, width, height);

        return currentViewport;
    }

    /**
     * Executes a scissor clear (ie. a clear on a specific portion of the screen)
     * @param x defines the x-coordinate of the top left corner of the clear rectangle
     * @param y defines the y-coordinate of the corner of the clear rectangle
     * @param width defines the width of the clear rectangle
     * @param height defines the height of the clear rectangle
     * @param clearColor defines the clear color
     */
    public scissorClear(x: number, y: number, width: number, height: number, clearColor: IColor4Like): void {
        this.enableScissor(x, y, width, height);
        this.clear(clearColor, true, true, true);
        this.disableScissor();
    }

    /**
     * Enable scissor test on a specific rectangle (ie. render will only be executed on a specific portion of the screen)
     * @param x defines the x-coordinate of the top left corner of the clear rectangle
     * @param y defines the y-coordinate of the corner of the clear rectangle
     * @param width defines the width of the clear rectangle
     * @param height defines the height of the clear rectangle
     */
    public enableScissor(x: number, y: number, width: number, height: number): void {
        let gl = this._gl;

        // Change state
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(x, y, width, height);
    }

    /**
     * Disable previously set scissor test rectangle
     */
    public disableScissor() {
        let gl = this._gl;

        gl.disable(gl.SCISSOR_TEST);
    }

    protected _reportDrawCall() {
        this._drawCalls.addCount(1, false);
    }

    /**
     * Initializes a webVR display and starts listening to display change events
     * The onVRDisplayChangedObservable will be notified upon these changes
     * @returns The onVRDisplayChangedObservable
     */
    public initWebVR(): Observable<IDisplayChangedEventArgs> {
        throw _DevTools.WarnImport("WebVRCamera");
    }

    /** @hidden */
    public _prepareVRComponent() {
        // Do nothing as the engine side effect will overload it
    }

    /** @hidden */
    public _connectVREvents(canvas?: HTMLCanvasElement, document?: any) {
        // Do nothing as the engine side effect will overload it
    }

    /** @hidden */
    public _submitVRFrame() {
        // Do nothing as the engine side effect will overload it
    }
    /**
     * Call this function to leave webVR mode
     * Will do nothing if webVR is not supported or if there is no webVR device
     * @see http://doc.babylonjs.com/how_to/webvr_camera
     */
    public disableVR() {
        // Do nothing as the engine side effect will overload it
    }

    /**
     * Gets a boolean indicating that the system is in VR mode and is presenting
     * @returns true if VR mode is engaged
     */
    public isVRPresenting() {
        return false;
    }

    /** @hidden */
    public _requestVRFrame() {
        // Do nothing as the engine side effect will overload it
    }

    /** @hidden */
    public _loadFileAsync(url: string, offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean): Promise<string | ArrayBuffer> {
        return new Promise((resolve, reject) => {
            this._loadFile(url, (data) => {
                resolve(data);
            }, undefined, offlineProvider, useArrayBuffer, (request, exception) => {
                reject(exception);
            });
        });
    }

    /**
    * Gets the source code of the vertex shader associated with a specific webGL program
    * @param program defines the program to use
    * @returns a string containing the source code of the vertex shader associated with the program
    */
    public getVertexShaderSource(program: WebGLProgram): Nullable<string> {
        var shaders = this._gl.getAttachedShaders(program);

        if (!shaders) {
            return null;
        }

        return this._gl.getShaderSource(shaders[0]);
    }

    /**
     * Gets the source code of the fragment shader associated with a specific webGL program
     * @param program defines the program to use
     * @returns a string containing the source code of the fragment shader associated with the program
     */
    public getFragmentShaderSource(program: WebGLProgram): Nullable<string> {
        var shaders = this._gl.getAttachedShaders(program);

        if (!shaders) {
            return null;
        }

        return this._gl.getShaderSource(shaders[1]);
    }

    /**
     * Sets a depth stencil texture from a render target to the according uniform.
     * @param channel The texture channel
     * @param uniform The uniform to set
     * @param texture The render target texture containing the depth stencil texture to apply
     */
    public setDepthStencilTexture(channel: number, uniform: Nullable<WebGLUniformLocation>, texture: Nullable<RenderTargetTexture>): void {
        if (channel === undefined) {
            return;
        }

        if (uniform) {
            this._boundUniforms[channel] = uniform;
        }

        if (!texture || !texture.depthStencilTexture) {
            this._setTexture(channel, null);
        }
        else {
            this._setTexture(channel, texture, false, true);
        }
    }

    /**
     * Sets a texture to the webGL context from a postprocess
     * @param channel defines the channel to use
     * @param postProcess defines the source postprocess
     */
    public setTextureFromPostProcess(channel: number, postProcess: Nullable<PostProcess>): void {
        this._bindTexture(channel, postProcess ? postProcess._textures.data[postProcess._currentRenderTextureInd] : null);
    }

    /**
     * Binds the output of the passed in post process to the texture channel specified
     * @param channel The channel the texture should be bound to
     * @param postProcess The post process which's output should be bound
     */
    public setTextureFromPostProcessOutput(channel: number, postProcess: Nullable<PostProcess>): void {
        this._bindTexture(channel, postProcess ? postProcess._outputTexture : null);
    }

    protected _rebuildBuffers(): void {
        // Index / Vertex
        for (var scene of this.scenes) {
            scene.resetCachedMaterial();
            scene._rebuildGeometries();
            scene._rebuildTextures();
        }

        super._rebuildBuffers();
    }

    /** @hidden */
    public _renderFrame() {
        for (var index = 0; index < this._activeRenderLoops.length; index++) {
            var renderFunction = this._activeRenderLoops[index];

            renderFunction();
        }
    }

    public _renderLoop(): void {
        if (!this._contextWasLost) {
            var shouldRender = true;
            if (!this.renderEvenInBackground && this._windowIsBackground) {
                shouldRender = false;
            }

            if (shouldRender) {
                // Start new frame
                this.beginFrame();

                // Child canvases
                if (!this._renderViews()) {
                    // Main frame
                    this._renderFrame();
                }

                // Present
                this.endFrame();
            }
        }

        if (this._activeRenderLoops.length > 0) {
            // Register new frame
            if (this.customAnimationFrameRequester) {
                this.customAnimationFrameRequester.requestID = this._queueNewFrame(this.customAnimationFrameRequester.renderFunction || this._boundRenderFunction, this.customAnimationFrameRequester);
                this._frameHandler = this.customAnimationFrameRequester.requestID;
            } else if (this.isVRPresenting()) {
                this._requestVRFrame();
            } else {
                this._frameHandler = this._queueNewFrame(this._boundRenderFunction, this.getHostWindow());
            }
        } else {
            this._renderingQueueLaunched = false;
        }
    }

    /** @hidden */
    public _renderViews() {
        return false;
    }

    /**
     * Toggle full screen mode
     * @param requestPointerLock defines if a pointer lock should be requested from the user
     */
    public switchFullscreen(requestPointerLock: boolean): void {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen(requestPointerLock);
        }
    }

    /**
     * Enters full screen mode
     * @param requestPointerLock defines if a pointer lock should be requested from the user
     */
    public enterFullscreen(requestPointerLock: boolean): void {
        if (!this.isFullscreen) {
            this._pointerLockRequested = requestPointerLock;
            if (this._renderingCanvas) {
                Engine._RequestFullscreen(this._renderingCanvas);
            }
        }
    }

    /**
     * Exits full screen mode
     */
    public exitFullscreen(): void {
        if (this.isFullscreen) {
            Engine._ExitFullscreen();
        }
    }

    /**
     * Enters Pointerlock mode
     */
    public enterPointerlock(): void {
        if (this._renderingCanvas) {
            Engine._RequestPointerlock(this._renderingCanvas);
        }
    }

    /**
     * Exits Pointerlock mode
     */
    public exitPointerlock(): void {
        Engine._ExitPointerlock();
    }

    /**
     * Begin a new frame
     */
    public beginFrame(): void {
        this._measureFps();

        this.onBeginFrameObservable.notifyObservers(this);
        super.beginFrame();
    }

    /**
     * Enf the current frame
     */
    public endFrame(): void {
        super.endFrame();
        this._submitVRFrame();

        this.onEndFrameObservable.notifyObservers(this);
    }

    public resize(): void {
        // We're not resizing the size of the canvas while in VR mode & presenting
        if (this.isVRPresenting()) {
            return;
        }

        super.resize();
    }

    /**
     * Force a specific size of the canvas
     * @param width defines the new canvas' width
     * @param height defines the new canvas' height
     * @returns true if the size was changed
     */
    public setSize(width: number, height: number): boolean {
        if (!this._renderingCanvas) {
            return false;
        }

        if (!super.setSize(width, height)) {
            return false;
        }

        if (this.scenes) {
            for (var index = 0; index < this.scenes.length; index++) {
                var scene = this.scenes[index];

                for (var camIndex = 0; camIndex < scene.cameras.length; camIndex++) {
                    var cam = scene.cameras[camIndex];

                    cam._currentRenderId = 0;
                }
            }

            if (this.onResizeObservable.hasObservers()) {
                this.onResizeObservable.notifyObservers(this);
            }
        }

        return true;
    }

    /**
     * Updates a dynamic vertex buffer.
     * @param vertexBuffer the vertex buffer to update
     * @param data the data used to update the vertex buffer
     * @param byteOffset the byte offset of the data
     * @param byteLength the byte length of the data
     */
    public updateDynamicVertexBuffer(vertexBuffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void {
        this.bindArrayBuffer(vertexBuffer);

        if (byteOffset === undefined) {
            byteOffset = 0;
        }

        const dataLength = (data as number[]).length || (data as ArrayBuffer).byteLength;

        if (byteLength === undefined || byteLength >= dataLength && byteOffset === 0) {
            if (data instanceof Array) {
                this._gl.bufferSubData(this._gl.ARRAY_BUFFER, byteOffset, new Float32Array(data));
            } else {
                this._gl.bufferSubData(this._gl.ARRAY_BUFFER, byteOffset, <ArrayBuffer>data);
            }
        } else {
            if (data instanceof Array) {
                this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, new Float32Array(data).subarray(byteOffset, byteOffset + byteLength));
            } else {
                if (data instanceof ArrayBuffer) {
                    data = new Uint8Array(data, byteOffset, byteLength);
                } else {
                    data = new Uint8Array(data.buffer, data.byteOffset + byteOffset, byteLength);
                }

                this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, <ArrayBuffer>data);
            }
        }

        this._resetVertexBufferBinding();
    }

    public _deletePipelineContext(pipelineContext: IPipelineContext): void {
        let webGLPipelineContext = pipelineContext as WebGLPipelineContext;
        if (webGLPipelineContext && webGLPipelineContext.program) {
            if (webGLPipelineContext.transformFeedback) {
                this.deleteTransformFeedback(webGLPipelineContext.transformFeedback);
                webGLPipelineContext.transformFeedback = null;
            }
        }
        super._deletePipelineContext(pipelineContext);
    }

    public createShaderProgram(pipelineContext: IPipelineContext, vertexCode: string, fragmentCode: string, defines: Nullable<string>, context?: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): WebGLProgram {
        context = context || this._gl;

        this.onBeforeShaderCompilationObservable.notifyObservers(this);

        let program = super.createShaderProgram(pipelineContext, vertexCode, fragmentCode, defines, context, transformFeedbackVaryings);
        this.onAfterShaderCompilationObservable.notifyObservers(this);

        return program;
    }

    protected _createShaderProgram(pipelineContext: WebGLPipelineContext, vertexShader: WebGLShader, fragmentShader: WebGLShader, context: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): WebGLProgram {
        var shaderProgram = context.createProgram();
        pipelineContext.program = shaderProgram;

        if (!shaderProgram) {
            throw new Error("Unable to create program");
        }

        context.attachShader(shaderProgram, vertexShader);
        context.attachShader(shaderProgram, fragmentShader);

        if (this.webGLVersion > 1 && transformFeedbackVaryings) {
            let transformFeedback = this.createTransformFeedback();

            this.bindTransformFeedback(transformFeedback);
            this.setTranformFeedbackVaryings(shaderProgram, transformFeedbackVaryings);
            pipelineContext.transformFeedback = transformFeedback;
        }

        context.linkProgram(shaderProgram);

        if (this.webGLVersion > 1 && transformFeedbackVaryings) {
            this.bindTransformFeedback(null);
        }

        pipelineContext.context = context;
        pipelineContext.vertexShader = vertexShader;
        pipelineContext.fragmentShader = fragmentShader;

        if (!pipelineContext.isParallelCompiled) {
            this._finalizePipelineContext(pipelineContext);
        }

        return shaderProgram;
    }

    public _releaseTexture(texture: InternalTexture): void {
        super._releaseTexture(texture);

        // Set output texture of post process to null if the texture has been released/disposed
        this.scenes.forEach((scene) => {
            scene.postProcesses.forEach((postProcess) => {
                if (postProcess._outputTexture == texture) {
                    postProcess._outputTexture = null;
                }
            });
            scene.cameras.forEach((camera) => {
                camera._postProcesses.forEach((postProcess) => {
                    if (postProcess) {
                        if (postProcess._outputTexture == texture) {
                            postProcess._outputTexture = null;
                        }
                    }
                });
            });
        });
    }

    /**
     * @hidden
     * Rescales a texture
     * @param source input texutre
     * @param destination destination texture
     * @param scene scene to use to render the resize
     * @param internalFormat format to use when resizing
     * @param onComplete callback to be called when resize has completed
     */
    public _rescaleTexture(source: InternalTexture, destination: InternalTexture, scene: Nullable<any>, internalFormat: number, onComplete: () => void): void {
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.LINEAR);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);

        let rtt = this.createRenderTargetTexture({
            width: destination.width,
            height: destination.height,
        }, {
            generateMipMaps: false,
            type: Constants.TEXTURETYPE_UNSIGNED_INT,
            samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            generateDepthBuffer: false,
            generateStencilBuffer: false
        }
        );

        if (!this._rescalePostProcess && Engine._RescalePostProcessFactory) {
            this._rescalePostProcess = Engine._RescalePostProcessFactory(this);
        }

        this._rescalePostProcess.getEffect().executeWhenCompiled(() => {
            this._rescalePostProcess.onApply = function(effect) {
                effect._bindTexture("textureSampler", source);
            };

            let hostingScene: Scene = scene;

            if (!hostingScene) {
                hostingScene = this.scenes[this.scenes.length - 1];
            }
            hostingScene.postProcessManager.directRender([this._rescalePostProcess], rtt, true);

            this._bindTextureDirectly(this._gl.TEXTURE_2D, destination, true);
            this._gl.copyTexImage2D(this._gl.TEXTURE_2D, 0, internalFormat, 0, 0, destination.width, destination.height, 0);

            this.unBindFramebuffer(rtt);
            this._releaseTexture(rtt);

            if (onComplete) {
                onComplete();
            }
        });
    }

    // FPS

    /**
     * Gets the current framerate
     * @returns a number representing the framerate
     */
    public getFps(): number {
        return this._fps;
    }

    /**
     * Gets the time spent between current and previous frame
     * @returns a number representing the delta time in ms
     */
    public getDeltaTime(): number {
        return this._deltaTime;
    }

    private _measureFps(): void {
        this._performanceMonitor.sampleFrame();
        this._fps = this._performanceMonitor.averageFPS;
        this._deltaTime = this._performanceMonitor.instantaneousFrameTime || 0;
    }

    /** @hidden */
    public _uploadImageToTexture(texture: InternalTexture, image: HTMLImageElement | ImageBitmap, faceIndex: number = 0, lod: number = 0) {
        var gl = this._gl;

        var textureType = this._getWebGLTextureType(texture.type);
        var format = this._getInternalFormat(texture.format);
        var internalFormat = this._getRGBABufferInternalSizedFormat(texture.type, format);

        var bindTarget = texture.isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;

        this._bindTextureDirectly(bindTarget, texture, true);
        this._unpackFlipY(texture.invertY);

        var target = gl.TEXTURE_2D;
        if (texture.isCube) {
            target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
        }

        gl.texImage2D(target, lod, internalFormat, format, textureType, image);
        this._bindTextureDirectly(bindTarget, null, true);
    }

    /**
     * Update a dynamic index buffer
     * @param indexBuffer defines the target index buffer
     * @param indices defines the data to update
     * @param offset defines the offset in the target index buffer where update should start
     */
    public updateDynamicIndexBuffer(indexBuffer: DataBuffer, indices: IndicesArray, offset: number = 0): void {
        // Force cache update
        this._currentBoundBuffer[this._gl.ELEMENT_ARRAY_BUFFER] = null;
        this.bindIndexBuffer(indexBuffer);
        var arrayBuffer;

        if (indices instanceof Uint16Array || indices instanceof Uint32Array) {
            arrayBuffer = indices;
        } else {
            arrayBuffer = indexBuffer.is32Bits ? new Uint32Array(indices) : new Uint16Array(indices);
        }

        this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, arrayBuffer, this._gl.DYNAMIC_DRAW);

        this._resetIndexBufferBinding();
    }

    /**
     * Updates the sample count of a render target texture
     * @see http://doc.babylonjs.com/features/webgl2#multisample-render-targets
     * @param texture defines the texture to update
     * @param samples defines the sample count to set
     * @returns the effective sample count (could be 0 if multisample render targets are not supported)
     */
    public updateRenderTargetTextureSampleCount(texture: Nullable<InternalTexture>, samples: number): number {
        if (this.webGLVersion < 2 || !texture) {
            return 1;
        }

        if (texture.samples === samples) {
            return samples;
        }

        var gl = this._gl;

        samples = Math.min(samples, this.getCaps().maxMSAASamples);

        // Dispose previous render buffers
        if (texture._depthStencilBuffer) {
            gl.deleteRenderbuffer(texture._depthStencilBuffer);
            texture._depthStencilBuffer = null;
        }

        if (texture._MSAAFramebuffer) {
            gl.deleteFramebuffer(texture._MSAAFramebuffer);
            texture._MSAAFramebuffer = null;
        }

        if (texture._MSAARenderBuffer) {
            gl.deleteRenderbuffer(texture._MSAARenderBuffer);
            texture._MSAARenderBuffer = null;
        }

        if (samples > 1 && gl.renderbufferStorageMultisample) {
            let framebuffer = gl.createFramebuffer();

            if (!framebuffer) {
                throw new Error("Unable to create multi sampled framebuffer");
            }

            texture._MSAAFramebuffer = framebuffer;
            this._bindUnboundFramebuffer(texture._MSAAFramebuffer);

            var colorRenderbuffer = gl.createRenderbuffer();

            if (!colorRenderbuffer) {
                throw new Error("Unable to create multi sampled framebuffer");
            }

            gl.bindRenderbuffer(gl.RENDERBUFFER, colorRenderbuffer);
            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, this._getRGBAMultiSampleBufferFormat(texture.type), texture.width, texture.height);

            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colorRenderbuffer);

            texture._MSAARenderBuffer = colorRenderbuffer;
        } else {
            this._bindUnboundFramebuffer(texture._framebuffer);
        }

        texture.samples = samples;
        texture._depthStencilBuffer = this._setupFramebufferDepthAttachments(texture._generateStencilBuffer, texture._generateDepthBuffer, texture.width, texture.height, samples);

        this._bindUnboundFramebuffer(null);

        return samples;
    }

    /**
     * Updates a depth texture Comparison Mode and Function.
     * If the comparison Function is equal to 0, the mode will be set to none.
     * Otherwise, this only works in webgl 2 and requires a shadow sampler in the shader.
     * @param texture The texture to set the comparison function for
     * @param comparisonFunction The comparison function to set, 0 if no comparison required
     */
    public updateTextureComparisonFunction(texture: InternalTexture, comparisonFunction: number): void {
        if (this.webGLVersion === 1) {
            Logger.Error("WebGL 1 does not support texture comparison.");
            return;
        }

        var gl = this._gl;

        if (texture.isCube) {
            this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, texture, true);

            if (comparisonFunction === 0) {
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_FUNC, Constants.LEQUAL);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_MODE, gl.NONE);
            }
            else {
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
            }

            this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
        } else {
            this._bindTextureDirectly(this._gl.TEXTURE_2D, texture, true);

            if (comparisonFunction === 0) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, Constants.LEQUAL);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
            }
            else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
            }

            this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
        }

        texture._comparisonFunction = comparisonFunction;
    }

    /**
     * Creates a webGL buffer to use with instanciation
     * @param capacity defines the size of the buffer
     * @returns the webGL buffer
     */
    public createInstancesBuffer(capacity: number): DataBuffer {
        var buffer = this._gl.createBuffer();

        if (!buffer) {
            throw new Error("Unable to create instance buffer");
        }

        var result = new WebGLDataBuffer(buffer);
        result.capacity = capacity;

        this.bindArrayBuffer(result);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, capacity, this._gl.DYNAMIC_DRAW);
        return result;
    }

    /**
     * Delete a webGL buffer used with instanciation
     * @param buffer defines the webGL buffer to delete
     */
    public deleteInstancesBuffer(buffer: WebGLBuffer): void {
        this._gl.deleteBuffer(buffer);
    }

    private _clientWaitAsync(sync: WebGLSync, flags = 0, interval_ms = 10) {
        let gl = <WebGL2RenderingContext>(this._gl as any);
        return new Promise((resolve, reject) => {
            let check = () => {
                const res = gl.clientWaitSync(sync, flags, 0);
                if (res == gl.WAIT_FAILED) {
                reject();
                return;
                }
                if (res == gl.TIMEOUT_EXPIRED) {
                setTimeout(check, interval_ms);
                return;
                }
                resolve();
            };

            check();
        });
    }

    /** @hidden */
    public _readPixelsAsync(x: number, y: number, w: number, h: number, format: number, type: number, outputBuffer: ArrayBufferView) {
        if (this._webGLVersion < 2) {
            throw new Error("_readPixelsAsync only work on WebGL2+");
        }

        let gl = <WebGL2RenderingContext>(this._gl as any);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buf);
        gl.bufferData(gl.PIXEL_PACK_BUFFER, outputBuffer.byteLength, gl.STREAM_READ);
        gl.readPixels(x, y, w, h, format, type, 0);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (!sync) {
            return null;
        }

        gl.flush();

        return this._clientWaitAsync(sync, 0, 10).then(() => {
            gl.deleteSync(sync);

            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buf);
            gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, outputBuffer);
            gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
            gl.deleteBuffer(buf);

            return outputBuffer;
        });
    }

    public dispose(): void {
        this.hideLoadingUI();

        this.onNewSceneAddedObservable.clear();

        // Release postProcesses
        while (this.postProcesses.length) {
            this.postProcesses[0].dispose();
        }

        // Rescale PP
        if (this._rescalePostProcess) {
            this._rescalePostProcess.dispose();
        }

        // Release scenes
        while (this.scenes.length) {
            this.scenes[0].dispose();
        }

        // Release audio engine
        if (Engine.Instances.length === 1 && Engine.audioEngine) {
            Engine.audioEngine.dispose();
        }

        //WebVR
        this.disableVR();

        // Events
        if (DomManagement.IsWindowObjectExist()) {
            window.removeEventListener("blur", this._onBlur);
            window.removeEventListener("focus", this._onFocus);

            if (this._renderingCanvas) {
                this._renderingCanvas.removeEventListener("focus", this._onCanvasFocus);
                this._renderingCanvas.removeEventListener("blur", this._onCanvasBlur);
                this._renderingCanvas.removeEventListener("pointerout", this._onCanvasPointerOut);
            }

            if (DomManagement.IsDocumentAvailable()) {
                document.removeEventListener("fullscreenchange", this._onFullscreenChange);
                document.removeEventListener("mozfullscreenchange", this._onFullscreenChange);
                document.removeEventListener("webkitfullscreenchange", this._onFullscreenChange);
                document.removeEventListener("msfullscreenchange", this._onFullscreenChange);
                document.removeEventListener("pointerlockchange", this._onPointerLockChange);
                document.removeEventListener("mspointerlockchange", this._onPointerLockChange);
                document.removeEventListener("mozpointerlockchange", this._onPointerLockChange);
                document.removeEventListener("webkitpointerlockchange", this._onPointerLockChange);
            }
        }

        super.dispose();

        // Remove from Instances
        var index = Engine.Instances.indexOf(this);

        if (index >= 0) {
            Engine.Instances.splice(index, 1);
        }

        // Observables
        this.onResizeObservable.clear();
        this.onCanvasBlurObservable.clear();
        this.onCanvasFocusObservable.clear();
        this.onCanvasPointerOutObservable.clear();
        this.onBeginFrameObservable.clear();
        this.onEndFrameObservable.clear();
    }

    private _disableTouchAction(): void {
        if (!this._renderingCanvas || !this._renderingCanvas.setAttribute) {
            return;
        }

        this._renderingCanvas.setAttribute("touch-action", "none");
        this._renderingCanvas.style.touchAction = "none";
        (this._renderingCanvas.style as any).msTouchAction = "none";
    }

    // Loading screen

    /**
     * Display the loading screen
     * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
     */
    public displayLoadingUI(): void {
        if (!DomManagement.IsWindowObjectExist()) {
            return;
        }
        const loadingScreen = this.loadingScreen;
        if (loadingScreen) {
            loadingScreen.displayLoadingUI();
        }
    }

    /**
     * Hide the loading screen
     * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
     */
    public hideLoadingUI(): void {
        if (!DomManagement.IsWindowObjectExist()) {
            return;
        }
        const loadingScreen = this._loadingScreen;
        if (loadingScreen) {
            loadingScreen.hideLoadingUI();
        }
    }

    /**
     * Gets the current loading screen object
     * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
     */
    public get loadingScreen(): ILoadingScreen {
        if (!this._loadingScreen && this._renderingCanvas) {
            this._loadingScreen = Engine.DefaultLoadingScreenFactory(this._renderingCanvas);
        }
        return this._loadingScreen;
    }

    /**
     * Sets the current loading screen object
     * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
     */
    public set loadingScreen(loadingScreen: ILoadingScreen) {
        this._loadingScreen = loadingScreen;
    }

    /**
     * Sets the current loading screen text
     * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
     */
    public set loadingUIText(text: string) {
        this.loadingScreen.loadingUIText = text;
    }

    /**
     * Sets the current loading screen background color
     * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
     */
    public set loadingUIBackgroundColor(color: string) {
        this.loadingScreen.loadingUIBackgroundColor = color;
    }

    /** Pointerlock and fullscreen */

    /**
     * Ask the browser to promote the current element to pointerlock mode
     * @param element defines the DOM element to promote
     */
    static _RequestPointerlock(element: HTMLElement): void {
        element.requestPointerLock = element.requestPointerLock || (<any>element).msRequestPointerLock || (<any>element).mozRequestPointerLock || (<any>element).webkitRequestPointerLock;
        if (element.requestPointerLock) {
            element.requestPointerLock();
        }
    }

    /**
     * Asks the browser to exit pointerlock mode
     */
    static _ExitPointerlock(): void {
        let anyDoc = document as any;
        document.exitPointerLock = document.exitPointerLock || anyDoc.msExitPointerLock || anyDoc.mozExitPointerLock || anyDoc.webkitExitPointerLock;

        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }

    /**
     * Ask the browser to promote the current element to fullscreen rendering mode
     * @param element defines the DOM element to promote
     */
    static _RequestFullscreen(element: HTMLElement): void {
        var requestFunction = element.requestFullscreen || (<any>element).msRequestFullscreen || (<any>element).webkitRequestFullscreen || (<any>element).mozRequestFullScreen;
        if (!requestFunction) { return; }
        requestFunction.call(element);
    }

    /**
     * Asks the browser to exit fullscreen mode
     */
    static _ExitFullscreen(): void {
        let anyDoc = document as any;

        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        else if (anyDoc.mozCancelFullScreen) {
            anyDoc.mozCancelFullScreen();
        }
        else if (anyDoc.webkitCancelFullScreen) {
            anyDoc.webkitCancelFullScreen();
        }
        else if (anyDoc.msCancelFullScreen) {
            anyDoc.msCancelFullScreen();
        }
    }
}
