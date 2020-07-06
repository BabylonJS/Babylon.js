import { EngineStore } from './engineStore';
import { IInternalTextureLoader } from '../Materials/Textures/internalTextureLoader';
import { Effect, IEffectCreationOptions } from '../Materials/effect';
import { _DevTools } from '../Misc/devTools';
import { IShaderProcessor } from './Processors/iShaderProcessor';
import { UniformBuffer } from '../Materials/uniformBuffer';
import { Nullable, DataArray, IndicesArray } from '../types';
import { EngineCapabilities } from './engineCapabilities';
import { Observable } from '../Misc/observable';
import { DepthCullingState } from '../States/depthCullingState';
import { StencilState } from '../States/stencilState';
import { AlphaState } from '../States/alphaCullingState';
import { Constants } from './constants';
import { InternalTexture, InternalTextureSource } from '../Materials/Textures/internalTexture';
import { IViewportLike, IColor4Like } from '../Maths/math.like';
import { DataBuffer } from '../Meshes/dataBuffer';
import { IFileRequest } from '../Misc/fileRequest';
import { Logger } from '../Misc/logger';
import { DomManagement } from '../Misc/domManagement';
import { WebGL2ShaderProcessor } from './WebGL/webGL2ShaderProcessors';
import { WebGLDataBuffer } from '../Meshes/WebGL/webGLDataBuffer';
import { IPipelineContext } from './IPipelineContext';
import { WebGLPipelineContext } from './WebGL/webGLPipelineContext';
import { VertexBuffer } from '../Meshes/buffer';
import { InstancingAttributeInfo } from './instancingAttributeInfo';
import { BaseTexture } from '../Materials/Textures/baseTexture';
import { IOfflineProvider } from '../Offline/IOfflineProvider';
import { IEffectFallbacks } from '../Materials/iEffectFallbacks';
import { IWebRequest } from '../Misc/interfaces/iWebRequest';
import { CanvasGenerator } from '../Misc/canvasGenerator';

declare type WebRequest = import("../Misc/webRequest").WebRequest;
declare type LoadFileError = import("../Misc/fileTools").LoadFileError;
declare type Observer<T> = import("../Misc/observable").Observer<T>;
declare type VideoTexture = import("../Materials/Textures/videoTexture").VideoTexture;
declare type RenderTargetTexture = import("../Materials/Textures/renderTargetTexture").RenderTargetTexture;
declare type Texture = import("../Materials/Textures/texture").Texture;

/**
 * Defines the interface used by objects working like Scene
 * @hidden
 */
export interface ISceneLike {
    _addPendingData(data: any): void;
    _removePendingData(data: any): void;
    offlineProvider: IOfflineProvider;
}

/**
 * Keeps track of all the buffer info used in engine.
 */
class BufferPointer {
    public active: boolean;
    public index: number;
    public size: number;
    public type: number;
    public normalized: boolean;
    public stride: number;
    public offset: number;
    public buffer: WebGLBuffer;
}

/** Interface defining initialization parameters for Engine class */
export interface EngineOptions extends WebGLContextAttributes {
    /**
     * Defines if the engine should no exceed a specified device ratio
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
     */
    limitDeviceRatio?: number;
    /**
     * Defines if webvr should be enabled automatically
     * @see https://doc.babylonjs.com/how_to/webvr_camera
     */
    autoEnableWebVR?: boolean;
    /**
     * Defines if webgl2 should be turned off even if supported
     * @see https://doc.babylonjs.com/features/webgl2
     */
    disableWebGL2Support?: boolean;
    /**
     * Defines if webaudio should be initialized as well
     * @see https://doc.babylonjs.com/how_to/playing_sounds_and_music
     */
    audioEngine?: boolean;
    /**
     * Defines if animations should run using a deterministic lock step
     * @see https://doc.babylonjs.com/babylon101/animations#deterministic-lockstep
     */
    deterministicLockstep?: boolean;
    /** Defines the maximum steps to use with deterministic lock step mode */
    lockstepMaxSteps?: number;
    /** Defines the seconds between each deterministic lock step */
    timeStep?: number;
    /**
     * Defines that engine should ignore context lost events
     * If this event happens when this parameter is true, you will have to reload the page to restore rendering
     */

    doNotHandleContextLost?: boolean;
    /**
     * Defines that engine should ignore modifying touch action attribute and style
     * If not handle, you might need to set it up on your side for expected touch devices behavior.
     */
    doNotHandleTouchAction?: boolean;
    /**
     * Defines that engine should compile shaders with high precision floats (if supported). True by default
     */
    useHighPrecisionFloats?: boolean;
    /**
     * Make the canvas XR Compatible for XR sessions
     */
    xrCompatible?: boolean;
}

/**
 * The base engine class (root of all engines)
 */
export class ThinEngine {
    /** Use this array to turn off some WebGL2 features on known buggy browsers version */
    public static ExceptionList = [
        { key: "Chrome\/63\.0", capture: "63\\.0\\.3239\\.(\\d+)", captureConstraint: 108, targets: ["uniformBuffer"] },
        { key: "Firefox\/58", capture: null, captureConstraint: null, targets: ["uniformBuffer"] },
        { key: "Firefox\/59", capture: null, captureConstraint: null, targets: ["uniformBuffer"] },
        { key: "Chrome\/72.+?Mobile", capture: null, captureConstraint: null, targets: ["vao"] },
        { key: "Chrome\/73.+?Mobile", capture: null, captureConstraint: null, targets: ["vao"] },
        { key: "Chrome\/74.+?Mobile", capture: null, captureConstraint: null, targets: ["vao"] },
        { key: "Mac OS.+Chrome\/71", capture: null, captureConstraint: null, targets: ["vao"] },
        { key: "Mac OS.+Chrome\/72", capture: null, captureConstraint: null, targets: ["vao"] }
    ];

    /** @hidden */
    public static _TextureLoaders: IInternalTextureLoader[] = [];

    /**
     * Returns the current npm package of the sdk
     */
    // Not mixed with Version for tooling purpose.
    public static get NpmPackage(): string {
        return "babylonjs@4.2.0-alpha.23";
    }

    /**
     * Returns the current version of the framework
     */
    public static get Version(): string {
        return "4.2.0-alpha.23";
    }

    /**
     * Returns a string describing the current engine
     */
    public get description(): string {
        let description = "WebGL" + this.webGLVersion;

        if (this._caps.parallelShaderCompile) {
            description += " - Parallel shader compilation";
        }

        return description;
    }

    // Updatable statics so stick with vars here

    /**
     * Gets or sets the epsilon value used by collision engine
     */
    public static CollisionsEpsilon = 0.001;

    /**
     * Gets or sets the relative url used to load shaders if using the engine in non-minified mode
     */
    public static get ShadersRepository(): string {
        return Effect.ShadersRepository;
    }
    public static set ShadersRepository(value: string) {
        Effect.ShadersRepository = value;
    }

    // Public members

    /** @hidden */
    public _shaderProcessor: IShaderProcessor;

    /**
     * Gets or sets a boolean that indicates if textures must be forced to power of 2 size even if not required
     */
    public forcePOTTextures = false;

    /**
     * Gets a boolean indicating if the engine is currently rendering in fullscreen mode
     */
    public isFullscreen = false;

    /**
     * Gets or sets a boolean indicating if back faces must be culled (true by default)
     */
    public cullBackFaces = true;

    /**
     * Gets or sets a boolean indicating if the engine must keep rendering even if the window is not in foregroun
     */
    public renderEvenInBackground = true;

    /**
     * Gets or sets a boolean indicating that cache can be kept between frames
     */
    public preventCacheWipeBetweenFrames = false;

    /** Gets or sets a boolean indicating if the engine should validate programs after compilation */
    public validateShaderPrograms = false;

    /**
     * Gets or sets a boolean indicating if depth buffer should be reverse, going from far to near.
     * This can provide greater z depth for distant objects.
     */
    public useReverseDepthBuffer = false;
    // Uniform buffers list

    /**
     * Gets or sets a boolean indicating that uniform buffers must be disabled even if they are supported
     */
    public disableUniformBuffers = false;

    /** @hidden */
    public _uniformBuffers = new Array<UniformBuffer>();

    /**
     * Gets a boolean indicating that the engine supports uniform buffers
     * @see https://doc.babylonjs.com/features/webgl2#uniform-buffer-objets
     */
    public get supportsUniformBuffers(): boolean {
        return this.webGLVersion > 1 && !this.disableUniformBuffers;
    }

    // Private Members

    /** @hidden */
    public _gl: WebGLRenderingContext;
    /** @hidden */
    public _webGLVersion = 1.0;
    protected _renderingCanvas: Nullable<HTMLCanvasElement>;
    protected _windowIsBackground = false;
    protected _creationOptions: EngineOptions;

    protected _highPrecisionShadersAllowed = true;
    /** @hidden */
    public get _shouldUseHighPrecisionShader(): boolean {
        return !!(this._caps.highPrecisionShaderSupported && this._highPrecisionShadersAllowed);
    }

    /**
     * Gets a boolean indicating that only power of 2 textures are supported
     * Please note that you can still use non power of 2 textures but in this case the engine will forcefully convert them
     */
    public get needPOTTextures(): boolean {
        return this._webGLVersion < 2 || this.forcePOTTextures;
    }

    /** @hidden */
    public _badOS = false;

    /** @hidden */
    public _badDesktopOS = false;

    private _hardwareScalingLevel: number;
    /** @hidden */
    public _caps: EngineCapabilities;
    private _isStencilEnable: boolean;

    private _glVersion: string;
    private _glRenderer: string;
    private _glVendor: string;

    /** @hidden */
    public _videoTextureSupported: boolean;

    protected _renderingQueueLaunched = false;
    protected _activeRenderLoops = new Array<() => void>();

    // Lost context
    /**
     * Observable signaled when a context lost event is raised
     */
    public onContextLostObservable = new Observable<ThinEngine>();
    /**
     * Observable signaled when a context restored event is raised
     */
    public onContextRestoredObservable = new Observable<ThinEngine>();
    private _onContextLost: (evt: Event) => void;
    private _onContextRestored: (evt: Event) => void;
    protected _contextWasLost = false;

    /** @hidden */
    public _doNotHandleContextLost = false;

    /**
     * Gets or sets a boolean indicating if resources should be retained to be able to handle context lost events
     * @see https://doc.babylonjs.com/how_to/optimizing_your_scene#handling-webgl-context-lost
     */
    public get doNotHandleContextLost(): boolean {
        return this._doNotHandleContextLost;
    }

    public set doNotHandleContextLost(value: boolean) {
        this._doNotHandleContextLost = value;
    }

    /**
     * Gets or sets a boolean indicating that vertex array object must be disabled even if they are supported
     */
    public disableVertexArrayObjects = false;

    // States
    /** @hidden */
    protected _colorWrite = true;
    /** @hidden */
    protected _colorWriteChanged = true;
    /** @hidden */
    protected _depthCullingState = new DepthCullingState();
    /** @hidden */
    protected _stencilState = new StencilState();
    /** @hidden */
    public _alphaState = new AlphaState();
    /** @hidden */
    public _alphaMode = Constants.ALPHA_ADD;
    /** @hidden */
    public _alphaEquation = Constants.ALPHA_DISABLE;

    // Cache
    /** @hidden */
    public _internalTexturesCache = new Array<InternalTexture>();
    /** @hidden */
    protected _activeChannel = 0;
    private _currentTextureChannel = -1;
    /** @hidden */
    protected _boundTexturesCache: { [key: string]: Nullable<InternalTexture> } = {};
    /** @hidden */
    protected _currentEffect: Nullable<Effect>;
    /** @hidden */
    protected _currentProgram: Nullable<WebGLProgram>;
    private _compiledEffects: { [key: string]: Effect } = {};
    private _vertexAttribArraysEnabled: boolean[] = [];
    /** @hidden */
    protected _cachedViewport: Nullable<IViewportLike>;
    private _cachedVertexArrayObject: Nullable<WebGLVertexArrayObject>;
    /** @hidden */
    protected _cachedVertexBuffers: any;
    /** @hidden */
    protected _cachedIndexBuffer: Nullable<DataBuffer>;
    /** @hidden */
    protected _cachedEffectForVertexBuffers: Nullable<Effect>;
    /** @hidden */
    public _currentRenderTarget: Nullable<InternalTexture>;
    private _uintIndicesCurrentlySet = false;
    protected _currentBoundBuffer = new Array<Nullable<WebGLBuffer>>();
    /** @hidden */
    public _currentFramebuffer: Nullable<WebGLFramebuffer> = null;
    /** @hidden */
    public _dummyFramebuffer: Nullable<WebGLFramebuffer> = null;
    private _currentBufferPointers = new Array<BufferPointer>();
    private _currentInstanceLocations = new Array<number>();
    private _currentInstanceBuffers = new Array<DataBuffer>();
    private _textureUnits: Int32Array;

    /** @hidden */
    public _workingCanvas: Nullable<HTMLCanvasElement | OffscreenCanvas>;
    /** @hidden */
    public _workingContext: Nullable<CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D>;

    /** @hidden */
    public _boundRenderFunction: any;

    private _vaoRecordInProgress = false;
    private _mustWipeVertexAttributes = false;

    private _emptyTexture: Nullable<InternalTexture>;
    private _emptyCubeTexture: Nullable<InternalTexture>;
    private _emptyTexture3D: Nullable<InternalTexture>;
    private _emptyTexture2DArray: Nullable<InternalTexture>;

    /** @hidden */
    public _frameHandler: number;

    private _nextFreeTextureSlots = new Array<number>();
    private _maxSimultaneousTextures = 0;

    private _activeRequests = new Array<IFileRequest>();

    /** @hidden */
    public _transformTextureUrl: Nullable<(url: string) => string> = null;

    protected get _supportsHardwareTextureRescaling() {
        return false;
    }

    private _framebufferDimensionsObject: Nullable<{framebufferWidth: number, framebufferHeight: number}>;

    /**
     * sets the object from which width and height will be taken from when getting render width and height
     * Will fallback to the gl object
     * @param dimensions the framebuffer width and height that will be used.
     */
    public set framebufferDimensionsObject(dimensions: Nullable<{framebufferWidth: number, framebufferHeight: number}>) {
      this._framebufferDimensionsObject = dimensions;
    }

    /**
     * Gets the current viewport
     */
    public get currentViewport(): Nullable<IViewportLike> {
        return this._cachedViewport;
    }

    /**
     * Gets the default empty texture
     */
    public get emptyTexture(): InternalTexture {
        if (!this._emptyTexture) {
            this._emptyTexture = this.createRawTexture(new Uint8Array(4), 1, 1, Constants.TEXTUREFORMAT_RGBA, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
        }

        return this._emptyTexture;
    }

    /**
     * Gets the default empty 3D texture
     */
    public get emptyTexture3D(): InternalTexture {
        if (!this._emptyTexture3D) {
            this._emptyTexture3D = this.createRawTexture3D(new Uint8Array(4), 1, 1, 1, Constants.TEXTUREFORMAT_RGBA, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
        }

        return this._emptyTexture3D;
    }

    /**
     * Gets the default empty 2D array texture
     */
    public get emptyTexture2DArray(): InternalTexture {
        if (!this._emptyTexture2DArray) {
            this._emptyTexture2DArray = this.createRawTexture2DArray(new Uint8Array(4), 1, 1, 1, Constants.TEXTUREFORMAT_RGBA, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
        }

        return this._emptyTexture2DArray;
    }

    /**
     * Gets the default empty cube texture
     */
    public get emptyCubeTexture(): InternalTexture {
        if (!this._emptyCubeTexture) {
            var faceData = new Uint8Array(4);
            var cubeData = [faceData, faceData, faceData, faceData, faceData, faceData];
            this._emptyCubeTexture = this.createRawCubeTexture(cubeData, 1, Constants.TEXTUREFORMAT_RGBA, Constants.TEXTURETYPE_UNSIGNED_INT, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
        }

        return this._emptyCubeTexture;
    }

    /**
     * Defines whether the engine has been created with the premultipliedAlpha option on or not.
     */
    public readonly premultipliedAlpha: boolean = true;

    /**
     * Observable event triggered before each texture is initialized
     */
    public onBeforeTextureInitObservable = new Observable<Texture>();

    /**
     * Creates a new engine
     * @param canvasOrContext defines the canvas or WebGL context to use for rendering. If you provide a WebGL context, Babylon.js will not hook events on the canvas (like pointers, keyboards, etc...) so no event observables will be available. This is mostly used when Babylon.js is used as a plugin on a system which alreay used the WebGL context
     * @param antialias defines enable antialiasing (default: false)
     * @param options defines further options to be sent to the getContext() function
     * @param adaptToDeviceRatio defines whether to adapt to the device's viewport characteristics (default: false)
     */
    constructor(canvasOrContext: Nullable<HTMLCanvasElement | WebGLRenderingContext | WebGL2RenderingContext>, antialias?: boolean, options?: EngineOptions, adaptToDeviceRatio: boolean = false) {

        let canvas: Nullable<HTMLCanvasElement> = null;

        if (!canvasOrContext) {
            return;
        }

        options = options || {};

        if ((canvasOrContext as any).getContext) {
            canvas = <HTMLCanvasElement>canvasOrContext;
            this._renderingCanvas = canvas;

            if (antialias != null) {
                options.antialias = antialias;
            }

            if (options.deterministicLockstep === undefined) {
                options.deterministicLockstep = false;
            }

            if (options.lockstepMaxSteps === undefined) {
                options.lockstepMaxSteps = 4;
            }

            if (options.timeStep === undefined) {
                options.timeStep = 1 / 60;
            }

            if (options.preserveDrawingBuffer === undefined) {
                options.preserveDrawingBuffer = false;
            }

            if (options.audioEngine === undefined) {
                options.audioEngine = true;
            }

            if (options.stencil === undefined) {
                options.stencil = true;
            }

            if (options.premultipliedAlpha === false) {
                this.premultipliedAlpha = false;
            }

            if (options.xrCompatible === undefined) {
                options.xrCompatible = true;
            }

            this._doNotHandleContextLost = options.doNotHandleContextLost ? true : false;

            // Exceptions
            if (navigator && navigator.userAgent) {
                let ua = navigator.userAgent;

                for (var exception of ThinEngine.ExceptionList) {
                    let key = exception.key;
                    let targets = exception.targets;
                    let check = new RegExp(key);

                    if (check.test(ua)) {
                        if (exception.capture && exception.captureConstraint) {
                            let capture = exception.capture;
                            let constraint = exception.captureConstraint;

                            let regex = new RegExp(capture);
                            let matches = regex.exec(ua);

                            if (matches && matches.length > 0) {
                                let capturedValue = parseInt(matches[matches.length - 1]);
                                if (capturedValue >= constraint) {
                                    continue;
                                }
                            }
                        }

                        for (var target of targets) {
                            switch (target) {
                                case "uniformBuffer":
                                    this.disableUniformBuffers = true;
                                    break;
                                case "vao":
                                    this.disableVertexArrayObjects = true;
                                    break;
                            }
                        }
                    }
                }
            }

            // Context lost
            if (!this._doNotHandleContextLost) {
                this._onContextLost = (evt: Event) => {
                    evt.preventDefault();
                    this._contextWasLost = true;
                    Logger.Warn("WebGL context lost.");

                    this.onContextLostObservable.notifyObservers(this);
                };

                this._onContextRestored = () => {
                    // Adding a timeout to avoid race condition at browser level
                    setTimeout(() => {
                        // Rebuild gl context
                        this._initGLContext();
                        // Rebuild effects
                        this._rebuildEffects();
                        // Rebuild textures
                        this._rebuildInternalTextures();
                        // Rebuild buffers
                        this._rebuildBuffers();
                        // Cache
                        this.wipeCaches(true);
                        Logger.Warn("WebGL context successfully restored.");
                        this.onContextRestoredObservable.notifyObservers(this);
                        this._contextWasLost = false;
                    }, 0);
                };

                canvas.addEventListener("webglcontextlost", this._onContextLost, false);
                canvas.addEventListener("webglcontextrestored", this._onContextRestored, false);

                options.powerPreference = "high-performance";
            }

            // GL
            if (!options.disableWebGL2Support) {
                try {
                    this._gl = <any>(canvas.getContext("webgl2", options) || canvas.getContext("experimental-webgl2", options));
                    if (this._gl) {
                        this._webGLVersion = 2.0;

                        // Prevent weird browsers to lie (yeah that happens!)
                        if (!this._gl.deleteQuery) {
                            this._webGLVersion = 1.0;
                        }
                    }
                } catch (e) {
                    // Do nothing
                }
            }

            if (!this._gl) {
                if (!canvas) {
                    throw new Error("The provided canvas is null or undefined.");
                }
                try {
                    this._gl = <WebGLRenderingContext>(canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options));
                } catch (e) {
                    throw new Error("WebGL not supported");
                }
            }

            if (!this._gl) {
                throw new Error("WebGL not supported");
            }
        } else {
            this._gl = <WebGLRenderingContext>canvasOrContext;
            this._renderingCanvas = this._gl.canvas as HTMLCanvasElement;

            if (this._gl.renderbufferStorageMultisample) {
                this._webGLVersion = 2.0;
            }

            const attributes = this._gl.getContextAttributes();
            if (attributes) {
                options.stencil = attributes.stencil;
            }
        }

        // Ensures a consistent color space unpacking of textures cross browser.
        this._gl.pixelStorei(this._gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this._gl.NONE);

        if (options.useHighPrecisionFloats !== undefined) {
            this._highPrecisionShadersAllowed = options.useHighPrecisionFloats;
        }

        // Viewport
        const devicePixelRatio = DomManagement.IsWindowObjectExist() ? (window.devicePixelRatio || 1.0) : 1.0;

        var limitDeviceRatio = options.limitDeviceRatio || devicePixelRatio;
        this._hardwareScalingLevel = adaptToDeviceRatio ? 1.0 / Math.min(limitDeviceRatio, devicePixelRatio) : 1.0;
        this.resize();

        this._isStencilEnable = options.stencil ? true : false;
        this._initGLContext();

        // Prepare buffer pointers
        for (var i = 0; i < this._caps.maxVertexAttribs; i++) {
            this._currentBufferPointers[i] = new BufferPointer();
        }

        // Shader processor
        if (this.webGLVersion > 1) {
            this._shaderProcessor = new WebGL2ShaderProcessor();
        }

        // Detect if we are running on a faulty buggy OS.
        this._badOS = /iPad/i.test(navigator.userAgent) || /iPhone/i.test(navigator.userAgent);

        // Detect if we are running on a faulty buggy desktop OS.
        this._badDesktopOS = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        this._creationOptions = options;
        console.log(`Babylon.js v${ThinEngine.Version} - ${this.description}`);
    }

    private _rebuildInternalTextures(): void {
        let currentState = this._internalTexturesCache.slice(); // Do a copy because the rebuild will add proxies

        for (var internalTexture of currentState) {
            internalTexture._rebuild();
        }
    }

    private _rebuildEffects(): void {
        for (var key in this._compiledEffects) {
            let effect = <Effect>this._compiledEffects[key];

            effect._prepareEffect();
        }

        Effect.ResetCache();
    }

    /**
     * Gets a boolean indicating if all created effects are ready
     * @returns true if all effects are ready
     */
    public areAllEffectsReady(): boolean {
        for (var key in this._compiledEffects) {
            let effect = <Effect>this._compiledEffects[key];

            if (!effect.isReady()) {
                return false;
            }
        }

        return true;
    }

    protected _rebuildBuffers(): void {
        // Uniforms
        for (var uniformBuffer of this._uniformBuffers) {
            uniformBuffer._rebuild();
        }
    }

    protected _initGLContext(): void {
        // Caps
        this._caps = {
            maxTexturesImageUnits: this._gl.getParameter(this._gl.MAX_TEXTURE_IMAGE_UNITS),
            maxCombinedTexturesImageUnits: this._gl.getParameter(this._gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
            maxVertexTextureImageUnits: this._gl.getParameter(this._gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
            maxTextureSize: this._gl.getParameter(this._gl.MAX_TEXTURE_SIZE),
            maxSamples: this._webGLVersion > 1 ? this._gl.getParameter(this._gl.MAX_SAMPLES) : 1,
            maxCubemapTextureSize: this._gl.getParameter(this._gl.MAX_CUBE_MAP_TEXTURE_SIZE),
            maxRenderTextureSize: this._gl.getParameter(this._gl.MAX_RENDERBUFFER_SIZE),
            maxVertexAttribs: this._gl.getParameter(this._gl.MAX_VERTEX_ATTRIBS),
            maxVaryingVectors: this._gl.getParameter(this._gl.MAX_VARYING_VECTORS),
            maxFragmentUniformVectors: this._gl.getParameter(this._gl.MAX_FRAGMENT_UNIFORM_VECTORS),
            maxVertexUniformVectors: this._gl.getParameter(this._gl.MAX_VERTEX_UNIFORM_VECTORS),
            parallelShaderCompile: this._gl.getExtension('KHR_parallel_shader_compile'),
            standardDerivatives: this._webGLVersion > 1 || (this._gl.getExtension('OES_standard_derivatives') !== null),
            maxAnisotropy: 1,
            astc: this._gl.getExtension('WEBGL_compressed_texture_astc') || this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_astc'),
            s3tc: this._gl.getExtension('WEBGL_compressed_texture_s3tc') || this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc'),
            pvrtc: this._gl.getExtension('WEBGL_compressed_texture_pvrtc') || this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc'),
            etc1: this._gl.getExtension('WEBGL_compressed_texture_etc1') || this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_etc1'),
            etc2: this._gl.getExtension('WEBGL_compressed_texture_etc') || this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_etc') ||
                this._gl.getExtension('WEBGL_compressed_texture_es3_0'), // also a requirement of OpenGL ES 3
            textureAnisotropicFilterExtension: this._gl.getExtension('EXT_texture_filter_anisotropic') || this._gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') || this._gl.getExtension('MOZ_EXT_texture_filter_anisotropic'),
            uintIndices: this._webGLVersion > 1 || this._gl.getExtension('OES_element_index_uint') !== null,
            fragmentDepthSupported: this._webGLVersion > 1 || this._gl.getExtension('EXT_frag_depth') !== null,
            highPrecisionShaderSupported: false,
            timerQuery: this._gl.getExtension('EXT_disjoint_timer_query_webgl2') || this._gl.getExtension("EXT_disjoint_timer_query"),
            canUseTimestampForTimerQuery: false,
            drawBuffersExtension: false,
            maxMSAASamples: 1,
            colorBufferFloat: this._webGLVersion > 1 && this._gl.getExtension('EXT_color_buffer_float'),
            textureFloat: (this._webGLVersion > 1 || this._gl.getExtension('OES_texture_float')) ? true : false,
            textureHalfFloat: (this._webGLVersion > 1 || this._gl.getExtension('OES_texture_half_float')) ? true : false,
            textureHalfFloatRender: false,
            textureFloatLinearFiltering: false,
            textureFloatRender: false,
            textureHalfFloatLinearFiltering: false,
            vertexArrayObject: false,
            instancedArrays: false,
            textureLOD: (this._webGLVersion > 1 || this._gl.getExtension('EXT_shader_texture_lod')) ? true : false,
            blendMinMax: false,
            multiview: this._gl.getExtension('OVR_multiview2'),
            oculusMultiview: this._gl.getExtension('OCULUS_multiview'),
            depthTextureExtension: false
        };

        // Infos
        this._glVersion = this._gl.getParameter(this._gl.VERSION);

        var rendererInfo: any = this._gl.getExtension("WEBGL_debug_renderer_info");
        if (rendererInfo != null) {
            this._glRenderer = this._gl.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL);
            this._glVendor = this._gl.getParameter(rendererInfo.UNMASKED_VENDOR_WEBGL);
        }

        if (!this._glVendor) {
            this._glVendor = "Unknown vendor";
        }

        if (!this._glRenderer) {
            this._glRenderer = "Unknown renderer";
        }

        // Constants
        if (this._gl.HALF_FLOAT_OES !== 0x8D61) {
            this._gl.HALF_FLOAT_OES = 0x8D61;   // Half floating-point type (16-bit).
        }
        if (this._gl.RGBA16F !== 0x881A) {
            this._gl.RGBA16F = 0x881A;      // RGBA 16-bit floating-point color-renderable internal sized format.
        }
        if (this._gl.RGBA32F !== 0x8814) {
            this._gl.RGBA32F = 0x8814;      // RGBA 32-bit floating-point color-renderable internal sized format.
        }
        if (this._gl.DEPTH24_STENCIL8 !== 35056) {
            this._gl.DEPTH24_STENCIL8 = 35056;
        }

        // Extensions
        if (this._caps.timerQuery) {
            if (this._webGLVersion === 1) {
                this._gl.getQuery = (<any>this._caps.timerQuery).getQueryEXT.bind(this._caps.timerQuery);
            }
            this._caps.canUseTimestampForTimerQuery = this._gl.getQuery(this._caps.timerQuery.TIMESTAMP_EXT, this._caps.timerQuery.QUERY_COUNTER_BITS_EXT) > 0;
        }

        this._caps.maxAnisotropy = this._caps.textureAnisotropicFilterExtension ? this._gl.getParameter(this._caps.textureAnisotropicFilterExtension.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;
        this._caps.textureFloatLinearFiltering = this._caps.textureFloat && this._gl.getExtension('OES_texture_float_linear') ? true : false;
        this._caps.textureFloatRender = this._caps.textureFloat && this._canRenderToFloatFramebuffer() ? true : false;
        this._caps.textureHalfFloatLinearFiltering = (this._webGLVersion > 1 || (this._caps.textureHalfFloat && this._gl.getExtension('OES_texture_half_float_linear'))) ? true : false;

        // Checks if some of the format renders first to allow the use of webgl inspector.
        if (this._webGLVersion > 1) {
            if (this._gl.HALF_FLOAT_OES !== 0x140B) {
                this._gl.HALF_FLOAT_OES = 0x140B;
            }
        }
        this._caps.textureHalfFloatRender = this._caps.textureHalfFloat && this._canRenderToHalfFloatFramebuffer();
        // Draw buffers
        if (this._webGLVersion > 1) {
            this._caps.drawBuffersExtension = true;
            this._caps.maxMSAASamples = this._gl.getParameter(this._gl.MAX_SAMPLES);
        } else {
            var drawBuffersExtension = this._gl.getExtension('WEBGL_draw_buffers');

            if (drawBuffersExtension !== null) {
                this._caps.drawBuffersExtension = true;
                this._gl.drawBuffers = drawBuffersExtension.drawBuffersWEBGL.bind(drawBuffersExtension);
                this._gl.DRAW_FRAMEBUFFER = this._gl.FRAMEBUFFER;

                for (var i = 0; i < 16; i++) {
                    (<any>this._gl)["COLOR_ATTACHMENT" + i + "_WEBGL"] = (<any>drawBuffersExtension)["COLOR_ATTACHMENT" + i + "_WEBGL"];
                }
            }
        }

        // Depth Texture
        if (this._webGLVersion > 1) {
            this._caps.depthTextureExtension = true;
        } else {
            var depthTextureExtension = this._gl.getExtension('WEBGL_depth_texture');

            if (depthTextureExtension != null) {
                this._caps.depthTextureExtension = true;
                this._gl.UNSIGNED_INT_24_8 = depthTextureExtension.UNSIGNED_INT_24_8_WEBGL;
            }
        }

        // Vertex array object
        if (this.disableVertexArrayObjects) {
            this._caps.vertexArrayObject = false;
        } else if (this._webGLVersion > 1) {
            this._caps.vertexArrayObject = true;
        } else {
            var vertexArrayObjectExtension = this._gl.getExtension('OES_vertex_array_object');

            if (vertexArrayObjectExtension != null) {
                this._caps.vertexArrayObject = true;
                this._gl.createVertexArray = vertexArrayObjectExtension.createVertexArrayOES.bind(vertexArrayObjectExtension);
                this._gl.bindVertexArray = vertexArrayObjectExtension.bindVertexArrayOES.bind(vertexArrayObjectExtension);
                this._gl.deleteVertexArray = vertexArrayObjectExtension.deleteVertexArrayOES.bind(vertexArrayObjectExtension);
            }
        }

        // Instances count
        if (this._webGLVersion > 1) {
            this._caps.instancedArrays = true;
        } else {
            var instanceExtension = <ANGLE_instanced_arrays>this._gl.getExtension('ANGLE_instanced_arrays');

            if (instanceExtension != null) {
                this._caps.instancedArrays = true;
                this._gl.drawArraysInstanced = instanceExtension.drawArraysInstancedANGLE.bind(instanceExtension);
                this._gl.drawElementsInstanced = instanceExtension.drawElementsInstancedANGLE.bind(instanceExtension);
                this._gl.vertexAttribDivisor = instanceExtension.vertexAttribDivisorANGLE.bind(instanceExtension);
            } else {
                this._caps.instancedArrays = false;
            }
        }

        if (this._gl.getShaderPrecisionFormat) {
            var vertex_highp = this._gl.getShaderPrecisionFormat(this._gl.VERTEX_SHADER, this._gl.HIGH_FLOAT);
            var fragment_highp = this._gl.getShaderPrecisionFormat(this._gl.FRAGMENT_SHADER, this._gl.HIGH_FLOAT);

            if (vertex_highp && fragment_highp) {
                this._caps.highPrecisionShaderSupported = vertex_highp.precision !== 0 && fragment_highp.precision !== 0;
            }
        }

        if (this._webGLVersion > 1) {
            this._caps.blendMinMax = true;
        }
        else {
            const blendMinMaxExtension = this._gl.getExtension('EXT_blend_minmax');
            if (blendMinMaxExtension != null) {
                this._caps.blendMinMax = true;
                this._gl.MAX = blendMinMaxExtension.MAX_EXT;
                this._gl.MIN = blendMinMaxExtension.MIN_EXT;
            }
        }

        // Depth buffer
        this._depthCullingState.depthTest = true;
        this._depthCullingState.depthFunc = this._gl.LEQUAL;
        this._depthCullingState.depthMask = true;

        // Texture maps
        this._maxSimultaneousTextures = this._caps.maxCombinedTexturesImageUnits;
        for (let slot = 0; slot < this._maxSimultaneousTextures; slot++) {
            this._nextFreeTextureSlots.push(slot);
        }
    }

    /**
     * Gets version of the current webGL context
     */
    public get webGLVersion(): number {
        return this._webGLVersion;
    }

    /**
     * Gets a string idenfifying the name of the class
     * @returns "Engine" string
     */
    public getClassName(): string {
        return "ThinEngine";
    }

    /**
     * Returns true if the stencil buffer has been enabled through the creation option of the context.
     */
    public get isStencilEnable(): boolean {
        return this._isStencilEnable;
    }

    /** @hidden */
    public _prepareWorkingCanvas(): void {
        if (this._workingCanvas) {
            return;
        }

        this._workingCanvas = CanvasGenerator.CreateCanvas(1, 1);
        let context = this._workingCanvas.getContext("2d");

        if (context) {
            this._workingContext = context;
        }
    }

    /**
     * Reset the texture cache to empty state
     */
    public resetTextureCache() {
        for (var key in this._boundTexturesCache) {
            if (!this._boundTexturesCache.hasOwnProperty(key)) {
                continue;
            }
            this._boundTexturesCache[key] = null;
        }

        this._currentTextureChannel = -1;
    }

    /**
     * Gets an object containing information about the current webGL context
     * @returns an object containing the vender, the renderer and the version of the current webGL context
     */
    public getGlInfo() {
        return {
            vendor: this._glVendor,
            renderer: this._glRenderer,
            version: this._glVersion
        };
    }

    /**
     * Defines the hardware scaling level.
     * By default the hardware scaling level is computed from the window device ratio.
     * if level = 1 then the engine will render at the exact resolution of the canvas. If level = 0.5 then the engine will render at twice the size of the canvas.
     * @param level defines the level to use
     */
    public setHardwareScalingLevel(level: number): void {
        this._hardwareScalingLevel = level;
        this.resize();
    }

    /**
     * Gets the current hardware scaling level.
     * By default the hardware scaling level is computed from the window device ratio.
     * if level = 1 then the engine will render at the exact resolution of the canvas. If level = 0.5 then the engine will render at twice the size of the canvas.
     * @returns a number indicating the current hardware scaling level
     */
    public getHardwareScalingLevel(): number {
        return this._hardwareScalingLevel;
    }

    /**
     * Gets the list of loaded textures
     * @returns an array containing all loaded textures
     */
    public getLoadedTexturesCache(): InternalTexture[] {
        return this._internalTexturesCache;
    }

    /**
     * Gets the object containing all engine capabilities
     * @returns the EngineCapabilities object
     */
    public getCaps(): EngineCapabilities {
        return this._caps;
    }

    /**
     * stop executing a render loop function and remove it from the execution array
     * @param renderFunction defines the function to be removed. If not provided all functions will be removed.
     */
    public stopRenderLoop(renderFunction?: () => void): void {
        if (!renderFunction) {
            this._activeRenderLoops = [];
            return;
        }

        var index = this._activeRenderLoops.indexOf(renderFunction);

        if (index >= 0) {
            this._activeRenderLoops.splice(index, 1);
        }
    }

    /** @hidden */
    public _renderLoop(): void {
        if (!this._contextWasLost) {
            var shouldRender = true;
            if (!this.renderEvenInBackground && this._windowIsBackground) {
                shouldRender = false;
            }

            if (shouldRender) {
                // Start new frame
                this.beginFrame();

                for (var index = 0; index < this._activeRenderLoops.length; index++) {
                    var renderFunction = this._activeRenderLoops[index];

                    renderFunction();
                }

                // Present
                this.endFrame();
            }
        }

        if (this._activeRenderLoops.length > 0) {
            this._frameHandler = this._queueNewFrame(this._boundRenderFunction, this.getHostWindow());
        } else {
            this._renderingQueueLaunched = false;
        }
    }

    /**
     * Gets the HTML canvas attached with the current webGL context
     * @returns a HTML canvas
     */
    public getRenderingCanvas(): Nullable<HTMLCanvasElement> {
        return this._renderingCanvas;
    }

    /**
     * Gets host window
     * @returns the host window object
     */
    public getHostWindow(): Nullable<Window> {
        if (!DomManagement.IsWindowObjectExist()) {
            return null;
        }

        if (this._renderingCanvas && this._renderingCanvas.ownerDocument && this._renderingCanvas.ownerDocument.defaultView) {
            return this._renderingCanvas.ownerDocument.defaultView;
        }

        return window;
    }

    /**
     * Gets the current render width
     * @param useScreen defines if screen size must be used (or the current render target if any)
     * @returns a number defining the current render width
     */
    public getRenderWidth(useScreen = false): number {
        if (!useScreen && this._currentRenderTarget) {
            return this._currentRenderTarget.width;
        }

        return this._framebufferDimensionsObject ? this._framebufferDimensionsObject.framebufferWidth : this._gl.drawingBufferWidth;
    }

    /**
     * Gets the current render height
     * @param useScreen defines if screen size must be used (or the current render target if any)
     * @returns a number defining the current render height
     */
    public getRenderHeight(useScreen = false): number {
        if (!useScreen && this._currentRenderTarget) {
            return this._currentRenderTarget.height;
        }

        return this._framebufferDimensionsObject ? this._framebufferDimensionsObject.framebufferHeight : this._gl.drawingBufferHeight;
    }

    /**
     * Can be used to override the current requestAnimationFrame requester.
     * @hidden
     */
    protected _queueNewFrame(bindedRenderFunction: any, requester?: any): number {
        return ThinEngine.QueueNewFrame(bindedRenderFunction, requester);
    }

    /**
     * Register and execute a render loop. The engine can have more than one render function
     * @param renderFunction defines the function to continuously execute
     */
    public runRenderLoop(renderFunction: () => void): void {
        if (this._activeRenderLoops.indexOf(renderFunction) !== -1) {
            return;
        }

        this._activeRenderLoops.push(renderFunction);

        if (!this._renderingQueueLaunched) {
            this._renderingQueueLaunched = true;
            this._boundRenderFunction = this._renderLoop.bind(this);
            this._frameHandler = this._queueNewFrame(this._boundRenderFunction, this.getHostWindow());
        }
    }

    /**
     * Clear the current render buffer or the current render target (if any is set up)
     * @param color defines the color to use
     * @param backBuffer defines if the back buffer must be cleared
     * @param depth defines if the depth buffer must be cleared
     * @param stencil defines if the stencil buffer must be cleared
     */
    public clear(color: Nullable<IColor4Like>, backBuffer: boolean, depth: boolean, stencil: boolean = false): void {
        this.applyStates();

        var mode = 0;
        if (backBuffer && color) {
            this._gl.clearColor(color.r, color.g, color.b, color.a !== undefined ? color.a : 1.0);
            mode |= this._gl.COLOR_BUFFER_BIT;
        }

        if (depth) {
            if (this.useReverseDepthBuffer) {
                this._depthCullingState.depthFunc = this._gl.GREATER;
                this._gl.clearDepth(0.0);
            } else {
                this._gl.clearDepth(1.0);
            }
            mode |= this._gl.DEPTH_BUFFER_BIT;
        }
        if (stencil) {
            this._gl.clearStencil(0);
            mode |= this._gl.STENCIL_BUFFER_BIT;
        }
        this._gl.clear(mode);
    }

    private _viewportCached = { x: 0, y: 0, z: 0, w: 0 };

    /** @hidden */
    public _viewport(x: number, y: number, width: number, height: number): void {
        if (x !== this._viewportCached.x ||
            y !== this._viewportCached.y ||
            width !== this._viewportCached.z ||
            height !== this._viewportCached.w) {
            this._viewportCached.x = x;
            this._viewportCached.y = y;
            this._viewportCached.z = width;
            this._viewportCached.w = height;

            this._gl.viewport(x, y, width, height);
        }
    }

    /**
     * Set the WebGL's viewport
     * @param viewport defines the viewport element to be used
     * @param requiredWidth defines the width required for rendering. If not provided the rendering canvas' width is used
     * @param requiredHeight defines the height required for rendering. If not provided the rendering canvas' height is used
     */
    public setViewport(viewport: IViewportLike, requiredWidth?: number, requiredHeight?: number): void {
        var width = requiredWidth || this.getRenderWidth();
        var height = requiredHeight || this.getRenderHeight();
        var x = viewport.x || 0;
        var y = viewport.y || 0;

        this._cachedViewport = viewport;

        this._viewport(x * width, y * height, width * viewport.width, height * viewport.height);
    }

    /**
     * Begin a new frame
     */
    public beginFrame(): void {
    }

    /**
     * Enf the current frame
     */
    public endFrame(): void {
        // Force a flush in case we are using a bad OS.
        if (this._badOS) {
            this.flushFramebuffer();
        }
    }

    /**
     * Resize the view according to the canvas' size
     */
    public resize(): void {
        let width: number;
        let height: number;

        if (DomManagement.IsWindowObjectExist()) {
            width = this._renderingCanvas ? (this._renderingCanvas.clientWidth || this._renderingCanvas.width) : window.innerWidth;
            height = this._renderingCanvas ? (this._renderingCanvas.clientHeight || this._renderingCanvas.height) : window.innerHeight;
        } else {
            width = this._renderingCanvas ? this._renderingCanvas.width : 100;
            height = this._renderingCanvas ? this._renderingCanvas.height : 100;
        }

        this.setSize(width / this._hardwareScalingLevel, height / this._hardwareScalingLevel);
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

        width = width | 0;
        height = height | 0;

        if (this._renderingCanvas.width === width && this._renderingCanvas.height === height) {
            return false;
        }

        this._renderingCanvas.width = width;
        this._renderingCanvas.height = height;

        return true;
    }

    /**
     * Binds the frame buffer to the specified texture.
     * @param texture The texture to render to or null for the default canvas
     * @param faceIndex The face of the texture to render to in case of cube texture
     * @param requiredWidth The width of the target to render to
     * @param requiredHeight The height of the target to render to
     * @param forceFullscreenViewport Forces the viewport to be the entire texture/screen if true
     * @param lodLevel defines the lod level to bind to the frame buffer
     * @param layer defines the 2d array index to bind to frame buffer to
     */
    public bindFramebuffer(texture: InternalTexture, faceIndex: number = 0, requiredWidth?: number, requiredHeight?: number, forceFullscreenViewport?: boolean, lodLevel = 0, layer = 0): void {
        if (this._currentRenderTarget) {
            this.unBindFramebuffer(this._currentRenderTarget);
        }
        this._currentRenderTarget = texture;
        this._bindUnboundFramebuffer(texture._MSAAFramebuffer ? texture._MSAAFramebuffer : texture._framebuffer);

        const gl = this._gl;
        if (texture.is2DArray) {
            gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, texture._webGLTexture, lodLevel, layer);
        }
        else if (texture.isCube) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, texture._webGLTexture, lodLevel);
        }

        const depthStencilTexture = texture._depthStencilTexture;
        if (depthStencilTexture) {
            const attachment = (depthStencilTexture._generateStencilBuffer) ? gl.DEPTH_STENCIL_ATTACHMENT : gl.DEPTH_ATTACHMENT;
            if (texture.is2DArray) {
                gl.framebufferTextureLayer(gl.FRAMEBUFFER, attachment, depthStencilTexture._webGLTexture, lodLevel, layer);
            }
            else if (texture.isCube) {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, depthStencilTexture._webGLTexture, lodLevel);
            }
            else {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, depthStencilTexture._webGLTexture, lodLevel);
            }
        }

        if (this._cachedViewport && !forceFullscreenViewport) {
            this.setViewport(this._cachedViewport, requiredWidth, requiredHeight);
        } else {
            if (!requiredWidth) {
                requiredWidth = texture.width;
                if (lodLevel) {
                    requiredWidth = requiredWidth / Math.pow(2, lodLevel);
                }
            }
            if (!requiredHeight) {
                requiredHeight = texture.height;
                if (lodLevel) {
                    requiredHeight = requiredHeight / Math.pow(2, lodLevel);
                }
            }

            this._viewport(0, 0, requiredWidth, requiredHeight);
        }

        this.wipeCaches();
    }

    /** @hidden */
    public _bindUnboundFramebuffer(framebuffer: Nullable<WebGLFramebuffer>) {
        if (this._currentFramebuffer !== framebuffer) {
            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, framebuffer);
            this._currentFramebuffer = framebuffer;
        }
    }

    /**
     * Unbind the current render target texture from the webGL context
     * @param texture defines the render target texture to unbind
     * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
     * @param onBeforeUnbind defines a function which will be called before the effective unbind
     */
    public unBindFramebuffer(texture: InternalTexture, disableGenerateMipMaps = false, onBeforeUnbind?: () => void): void {
        this._currentRenderTarget = null;

        // If MSAA, we need to bitblt back to main texture
        var gl = this._gl;
        if (texture._MSAAFramebuffer) {
            if (texture._textureArray) {
                // This texture is part of a MRT texture, we need to treat all attachments
                this.unBindMultiColorAttachmentFramebuffer(texture._textureArray!, disableGenerateMipMaps, onBeforeUnbind);
                return;
            }
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, texture._MSAAFramebuffer);
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, texture._framebuffer);
            gl.blitFramebuffer(0, 0, texture.width, texture.height,
                0, 0, texture.width, texture.height,
                gl.COLOR_BUFFER_BIT, gl.NEAREST);
        }

        if (texture.generateMipMaps && !disableGenerateMipMaps && !texture.isCube) {
            this._bindTextureDirectly(gl.TEXTURE_2D, texture, true);
            gl.generateMipmap(gl.TEXTURE_2D);
            this._bindTextureDirectly(gl.TEXTURE_2D, null);
        }

        if (onBeforeUnbind) {
            if (texture._MSAAFramebuffer) {
                // Bind the correct framebuffer
                this._bindUnboundFramebuffer(texture._framebuffer);
            }
            onBeforeUnbind();
        }

        this._bindUnboundFramebuffer(null);
    }

    /**
     * Force a webGL flush (ie. a flush of all waiting webGL commands)
     */
    public flushFramebuffer(): void {
        this._gl.flush();
    }

    /**
     * Unbind the current render target and bind the default framebuffer
     */
    public restoreDefaultFramebuffer(): void {
        if (this._currentRenderTarget) {
            this.unBindFramebuffer(this._currentRenderTarget);
        } else {
            this._bindUnboundFramebuffer(null);
        }
        if (this._cachedViewport) {
            this.setViewport(this._cachedViewport);
        }

        this.wipeCaches();
    }

    // VBOs

    /** @hidden */
    protected _resetVertexBufferBinding(): void {
        this.bindArrayBuffer(null);
        this._cachedVertexBuffers = null;
    }

    /**
     * Creates a vertex buffer
     * @param data the data for the vertex buffer
     * @returns the new WebGL static buffer
     */
    public createVertexBuffer(data: DataArray): DataBuffer {
        return this._createVertexBuffer(data, this._gl.STATIC_DRAW);
    }

    private _createVertexBuffer(data: DataArray, usage: number): DataBuffer {
        var vbo = this._gl.createBuffer();

        if (!vbo) {
            throw new Error("Unable to create vertex buffer");
        }

        let dataBuffer = new WebGLDataBuffer(vbo);
        this.bindArrayBuffer(dataBuffer);

        if (data instanceof Array) {
            this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(data), this._gl.STATIC_DRAW);
        } else {
            this._gl.bufferData(this._gl.ARRAY_BUFFER, <ArrayBuffer>data, this._gl.STATIC_DRAW);
        }

        this._resetVertexBufferBinding();

        dataBuffer.references = 1;
        return dataBuffer;
    }

    /**
     * Creates a dynamic vertex buffer
     * @param data the data for the dynamic vertex buffer
     * @returns the new WebGL dynamic buffer
     */
    public createDynamicVertexBuffer(data: DataArray): DataBuffer {
        return this._createVertexBuffer(data, this._gl.DYNAMIC_DRAW);
    }

    protected _resetIndexBufferBinding(): void {
        this.bindIndexBuffer(null);
        this._cachedIndexBuffer = null;
    }

    /**
     * Creates a new index buffer
     * @param indices defines the content of the index buffer
     * @param updatable defines if the index buffer must be updatable
     * @returns a new webGL buffer
     */
    public createIndexBuffer(indices: IndicesArray, updatable?: boolean): DataBuffer {
        var vbo = this._gl.createBuffer();
        let dataBuffer = new WebGLDataBuffer(vbo!);

        if (!vbo) {
            throw new Error("Unable to create index buffer");
        }

        this.bindIndexBuffer(dataBuffer);

        const data = this._normalizeIndexData(indices);
        this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, data, updatable ? this._gl.DYNAMIC_DRAW : this._gl.STATIC_DRAW);
        this._resetIndexBufferBinding();
        dataBuffer.references = 1;
        dataBuffer.is32Bits = (data.BYTES_PER_ELEMENT === 4);
        return dataBuffer;
    }

    protected _normalizeIndexData(indices: IndicesArray): Uint16Array | Uint32Array {
        if (indices instanceof Uint16Array) {
            return indices;
        }

        // Check 32 bit support
        if (this._caps.uintIndices) {
            if (indices instanceof Uint32Array) {
                return indices;
            } else {
                // number[] or Int32Array, check if 32 bit is necessary
                for (var index = 0; index < indices.length; index++) {
                    if (indices[index] >= 65535) {
                        return new Uint32Array(indices);
                    }
                }

                return new Uint16Array(indices);
            }
        }

        // No 32 bit support, force conversion to 16 bit (values greater 16 bit are lost)
        return new Uint16Array(indices);
    }

    /**
     * Bind a webGL buffer to the webGL context
     * @param buffer defines the buffer to bind
     */
    public bindArrayBuffer(buffer: Nullable<DataBuffer>): void {
        if (!this._vaoRecordInProgress) {
            this._unbindVertexArrayObject();
        }
        this.bindBuffer(buffer, this._gl.ARRAY_BUFFER);
    }

    /**
     * Bind a specific block at a given index in a specific shader program
     * @param pipelineContext defines the pipeline context to use
     * @param blockName defines the block name
     * @param index defines the index where to bind the block
     */
    public bindUniformBlock(pipelineContext: IPipelineContext, blockName: string, index: number): void {
        let program = (pipelineContext as WebGLPipelineContext).program!;

        var uniformLocation = this._gl.getUniformBlockIndex(program, blockName);

        this._gl.uniformBlockBinding(program, uniformLocation, index);
    }

    protected bindIndexBuffer(buffer: Nullable<DataBuffer>): void {
        if (!this._vaoRecordInProgress) {
            this._unbindVertexArrayObject();
        }
        this.bindBuffer(buffer, this._gl.ELEMENT_ARRAY_BUFFER);
    }

    private bindBuffer(buffer: Nullable<DataBuffer>, target: number): void {
        if (this._vaoRecordInProgress || this._currentBoundBuffer[target] !== buffer) {
            this._gl.bindBuffer(target, buffer ? buffer.underlyingResource : null);
            this._currentBoundBuffer[target] = buffer;
        }
    }

    /**
     * update the bound buffer with the given data
     * @param data defines the data to update
     */
    public updateArrayBuffer(data: Float32Array): void {
        this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, data);
    }

    private _vertexAttribPointer(buffer: DataBuffer, indx: number, size: number, type: number, normalized: boolean, stride: number, offset: number): void {
        var pointer = this._currentBufferPointers[indx];

        var changed = false;
        if (!pointer.active) {
            changed = true;
            pointer.active = true;
            pointer.index = indx;
            pointer.size = size;
            pointer.type = type;
            pointer.normalized = normalized;
            pointer.stride = stride;
            pointer.offset = offset;
            pointer.buffer = buffer;
        } else {
            if (pointer.buffer !== buffer) { pointer.buffer = buffer; changed = true; }
            if (pointer.size !== size) { pointer.size = size; changed = true; }
            if (pointer.type !== type) { pointer.type = type; changed = true; }
            if (pointer.normalized !== normalized) { pointer.normalized = normalized; changed = true; }
            if (pointer.stride !== stride) { pointer.stride = stride; changed = true; }
            if (pointer.offset !== offset) { pointer.offset = offset; changed = true; }
        }

        if (changed || this._vaoRecordInProgress) {
            this.bindArrayBuffer(buffer);
            this._gl.vertexAttribPointer(indx, size, type, normalized, stride, offset);
        }
    }

    /** @hidden */
    public _bindIndexBufferWithCache(indexBuffer: Nullable<DataBuffer>): void {
        if (indexBuffer == null) {
            return;
        }
        if (this._cachedIndexBuffer !== indexBuffer) {
            this._cachedIndexBuffer = indexBuffer;
            this.bindIndexBuffer(indexBuffer);
            this._uintIndicesCurrentlySet = indexBuffer.is32Bits;
        }
    }

    private _bindVertexBuffersAttributes(vertexBuffers: { [key: string]: Nullable<VertexBuffer> }, effect: Effect): void {
        var attributes = effect.getAttributesNames();

        if (!this._vaoRecordInProgress) {
            this._unbindVertexArrayObject();
        }

        this.unbindAllAttributes();

        for (var index = 0; index < attributes.length; index++) {
            var order = effect.getAttributeLocation(index);

            if (order >= 0) {
                var vertexBuffer = vertexBuffers[attributes[index]];

                if (!vertexBuffer) {
                    continue;
                }

                this._gl.enableVertexAttribArray(order);
                if (!this._vaoRecordInProgress) {
                    this._vertexAttribArraysEnabled[order] = true;
                }

                var buffer = vertexBuffer.getBuffer();
                if (buffer) {
                    this._vertexAttribPointer(buffer, order, vertexBuffer.getSize(), vertexBuffer.type, vertexBuffer.normalized, vertexBuffer.byteStride, vertexBuffer.byteOffset);

                    if (vertexBuffer.getIsInstanced()) {
                        this._gl.vertexAttribDivisor(order, vertexBuffer.getInstanceDivisor());
                        if (!this._vaoRecordInProgress) {
                            this._currentInstanceLocations.push(order);
                            this._currentInstanceBuffers.push(buffer);
                        }
                    }
                }
            }
        }
    }

    /**
     * Records a vertex array object
     * @see https://doc.babylonjs.com/features/webgl2#vertex-array-objects
     * @param vertexBuffers defines the list of vertex buffers to store
     * @param indexBuffer defines the index buffer to store
     * @param effect defines the effect to store
     * @returns the new vertex array object
     */
    public recordVertexArrayObject(vertexBuffers: { [key: string]: VertexBuffer; }, indexBuffer: Nullable<DataBuffer>, effect: Effect): WebGLVertexArrayObject {
        var vao = this._gl.createVertexArray();

        this._vaoRecordInProgress = true;

        this._gl.bindVertexArray(vao);

        this._mustWipeVertexAttributes = true;
        this._bindVertexBuffersAttributes(vertexBuffers, effect);

        this.bindIndexBuffer(indexBuffer);

        this._vaoRecordInProgress = false;
        this._gl.bindVertexArray(null);

        return vao;
    }

    /**
     * Bind a specific vertex array object
     * @see https://doc.babylonjs.com/features/webgl2#vertex-array-objects
     * @param vertexArrayObject defines the vertex array object to bind
     * @param indexBuffer defines the index buffer to bind
     */
    public bindVertexArrayObject(vertexArrayObject: WebGLVertexArrayObject, indexBuffer: Nullable<DataBuffer>): void {
        if (this._cachedVertexArrayObject !== vertexArrayObject) {
            this._cachedVertexArrayObject = vertexArrayObject;

            this._gl.bindVertexArray(vertexArrayObject);
            this._cachedVertexBuffers = null;
            this._cachedIndexBuffer = null;

            this._uintIndicesCurrentlySet = indexBuffer != null && indexBuffer.is32Bits;
            this._mustWipeVertexAttributes = true;
        }
    }

    /**
     * Bind webGl buffers directly to the webGL context
     * @param vertexBuffer defines the vertex buffer to bind
     * @param indexBuffer defines the index buffer to bind
     * @param vertexDeclaration defines the vertex declaration to use with the vertex buffer
     * @param vertexStrideSize defines the vertex stride of the vertex buffer
     * @param effect defines the effect associated with the vertex buffer
     */
    public bindBuffersDirectly(vertexBuffer: DataBuffer, indexBuffer: DataBuffer, vertexDeclaration: number[], vertexStrideSize: number, effect: Effect): void {
        if (this._cachedVertexBuffers !== vertexBuffer || this._cachedEffectForVertexBuffers !== effect) {
            this._cachedVertexBuffers = vertexBuffer;
            this._cachedEffectForVertexBuffers = effect;

            let attributesCount = effect.getAttributesCount();

            this._unbindVertexArrayObject();
            this.unbindAllAttributes();

            var offset = 0;
            for (var index = 0; index < attributesCount; index++) {

                if (index < vertexDeclaration.length) {

                    var order = effect.getAttributeLocation(index);

                    if (order >= 0) {
                        this._gl.enableVertexAttribArray(order);
                        this._vertexAttribArraysEnabled[order] = true;
                        this._vertexAttribPointer(vertexBuffer, order, vertexDeclaration[index], this._gl.FLOAT, false, vertexStrideSize, offset);
                    }

                    offset += vertexDeclaration[index] * 4;
                }
            }
        }

        this._bindIndexBufferWithCache(indexBuffer);
    }

    private _unbindVertexArrayObject(): void {
        if (!this._cachedVertexArrayObject) {
            return;
        }

        this._cachedVertexArrayObject = null;
        this._gl.bindVertexArray(null);
    }

    /**
     * Bind a list of vertex buffers to the webGL context
     * @param vertexBuffers defines the list of vertex buffers to bind
     * @param indexBuffer defines the index buffer to bind
     * @param effect defines the effect associated with the vertex buffers
     */
    public bindBuffers(vertexBuffers: { [key: string]: Nullable<VertexBuffer> }, indexBuffer: Nullable<DataBuffer>, effect: Effect): void {
        if (this._cachedVertexBuffers !== vertexBuffers || this._cachedEffectForVertexBuffers !== effect) {
            this._cachedVertexBuffers = vertexBuffers;
            this._cachedEffectForVertexBuffers = effect;

            this._bindVertexBuffersAttributes(vertexBuffers, effect);
        }

        this._bindIndexBufferWithCache(indexBuffer);
    }

    /**
     * Unbind all instance attributes
     */
    public unbindInstanceAttributes() {
        var boundBuffer;
        for (var i = 0, ul = this._currentInstanceLocations.length; i < ul; i++) {
            var instancesBuffer = this._currentInstanceBuffers[i];
            if (boundBuffer != instancesBuffer && instancesBuffer.references) {
                boundBuffer = instancesBuffer;
                this.bindArrayBuffer(instancesBuffer);
            }
            var offsetLocation = this._currentInstanceLocations[i];
            this._gl.vertexAttribDivisor(offsetLocation, 0);
        }
        this._currentInstanceBuffers.length = 0;
        this._currentInstanceLocations.length = 0;
    }

    /**
     * Release and free the memory of a vertex array object
     * @param vao defines the vertex array object to delete
     */
    public releaseVertexArrayObject(vao: WebGLVertexArrayObject) {
        this._gl.deleteVertexArray(vao);
    }

    /** @hidden */
    public _releaseBuffer(buffer: DataBuffer): boolean {
        buffer.references--;

        if (buffer.references === 0) {
            this._deleteBuffer(buffer);
            return true;
        }

        return false;
    }

    protected _deleteBuffer(buffer: DataBuffer): void {
        this._gl.deleteBuffer(buffer.underlyingResource);
    }

    /**
     * Update the content of a webGL buffer used with instanciation and bind it to the webGL context
     * @param instancesBuffer defines the webGL buffer to update and bind
     * @param data defines the data to store in the buffer
     * @param offsetLocations defines the offsets or attributes information used to determine where data must be stored in the buffer
     */
    public updateAndBindInstancesBuffer(instancesBuffer: DataBuffer, data: Float32Array, offsetLocations: number[] | InstancingAttributeInfo[]): void {
        this.bindArrayBuffer(instancesBuffer);
        if (data) {
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, data);
        }

        if ((<any>offsetLocations[0]).index !== undefined) {
            this.bindInstancesBuffer(instancesBuffer, offsetLocations as any, true);
        } else {
            for (let index = 0; index < 4; index++) {
                let offsetLocation = <number>offsetLocations[index];

                if (!this._vertexAttribArraysEnabled[offsetLocation]) {
                    this._gl.enableVertexAttribArray(offsetLocation);
                    this._vertexAttribArraysEnabled[offsetLocation] = true;
                }

                this._vertexAttribPointer(instancesBuffer, offsetLocation, 4, this._gl.FLOAT, false, 64, index * 16);
                this._gl.vertexAttribDivisor(offsetLocation, 1);
                this._currentInstanceLocations.push(offsetLocation);
                this._currentInstanceBuffers.push(instancesBuffer);
            }
        }
    }

    /**
     * Bind the content of a webGL buffer used with instantiation
     * @param instancesBuffer defines the webGL buffer to bind
     * @param attributesInfo defines the offsets or attributes information used to determine where data must be stored in the buffer
     * @param computeStride defines Whether to compute the strides from the info or use the default 0
     */
    public bindInstancesBuffer(instancesBuffer: DataBuffer, attributesInfo: InstancingAttributeInfo[], computeStride = true): void {
        this.bindArrayBuffer(instancesBuffer);

        let stride = 0;
        if (computeStride) {
            for (let i = 0; i < attributesInfo.length; i++) {
                let ai = attributesInfo[i];
                stride += ai.attributeSize * 4;
            }
        }

        for (let i = 0; i < attributesInfo.length; i++) {
            let ai = attributesInfo[i];
            if (ai.index === undefined) {
                ai.index = this._currentEffect!.getAttributeLocationByName(ai.attributeName);
            }

            if (ai.index < 0) {
                continue;
            }

            if (!this._vertexAttribArraysEnabled[ai.index]) {
                this._gl.enableVertexAttribArray(ai.index);
                this._vertexAttribArraysEnabled[ai.index] = true;
            }

            this._vertexAttribPointer(instancesBuffer, ai.index, ai.attributeSize, ai.attributeType || this._gl.FLOAT, ai.normalized || false, stride, ai.offset);
            this._gl.vertexAttribDivisor(ai.index, ai.divisor === undefined ? 1 : ai.divisor);
            this._currentInstanceLocations.push(ai.index);
            this._currentInstanceBuffers.push(instancesBuffer);
        }
    }

    /**
     * Disable the instance attribute corresponding to the name in parameter
     * @param name defines the name of the attribute to disable
     */
    public disableInstanceAttributeByName(name: string) {
        if (!this._currentEffect) {
            return;
        }

        const attributeLocation = this._currentEffect.getAttributeLocationByName(name);
        this.disableInstanceAttribute(attributeLocation);
    }

    /**
     * Disable the instance attribute corresponding to the location in parameter
     * @param attributeLocation defines the attribute location of the attribute to disable
     */
    public disableInstanceAttribute(attributeLocation: number) {
        let shouldClean = false;
        let index: number;
        while ((index = this._currentInstanceLocations.indexOf(attributeLocation)) !== -1) {
            this._currentInstanceLocations.splice(index, 1);
            this._currentInstanceBuffers.splice(index, 1);

            shouldClean = true;
            index = this._currentInstanceLocations.indexOf(attributeLocation);
        }

        if (shouldClean) {
            this._gl.vertexAttribDivisor(attributeLocation, 0);
            this.disableAttributeByIndex(attributeLocation);
        }
    }

    /**
     * Disable the attribute corresponding to the location in parameter
     * @param attributeLocation defines the attribute location of the attribute to disable
     */
    public disableAttributeByIndex(attributeLocation: number) {
        this._gl.disableVertexAttribArray(attributeLocation);
        this._vertexAttribArraysEnabled[attributeLocation] = false;
        this._currentBufferPointers[attributeLocation].active = false;
    }

    /**
     * Send a draw order
     * @param useTriangles defines if triangles must be used to draw (else wireframe will be used)
     * @param indexStart defines the starting index
     * @param indexCount defines the number of index to draw
     * @param instancesCount defines the number of instances to draw (if instanciation is enabled)
     */
    public draw(useTriangles: boolean, indexStart: number, indexCount: number, instancesCount?: number): void {
        this.drawElementsType(useTriangles ? Constants.MATERIAL_TriangleFillMode : Constants.MATERIAL_WireFrameFillMode, indexStart, indexCount, instancesCount);
    }

    /**
     * Draw a list of points
     * @param verticesStart defines the index of first vertex to draw
     * @param verticesCount defines the count of vertices to draw
     * @param instancesCount defines the number of instances to draw (if instanciation is enabled)
     */
    public drawPointClouds(verticesStart: number, verticesCount: number, instancesCount?: number): void {
        this.drawArraysType(Constants.MATERIAL_PointFillMode, verticesStart, verticesCount, instancesCount);
    }

    /**
     * Draw a list of unindexed primitives
     * @param useTriangles defines if triangles must be used to draw (else wireframe will be used)
     * @param verticesStart defines the index of first vertex to draw
     * @param verticesCount defines the count of vertices to draw
     * @param instancesCount defines the number of instances to draw (if instanciation is enabled)
     */
    public drawUnIndexed(useTriangles: boolean, verticesStart: number, verticesCount: number, instancesCount?: number): void {
        this.drawArraysType(useTriangles ? Constants.MATERIAL_TriangleFillMode : Constants.MATERIAL_WireFrameFillMode, verticesStart, verticesCount, instancesCount);
    }

    /**
     * Draw a list of indexed primitives
     * @param fillMode defines the primitive to use
     * @param indexStart defines the starting index
     * @param indexCount defines the number of index to draw
     * @param instancesCount defines the number of instances to draw (if instanciation is enabled)
     */
    public drawElementsType(fillMode: number, indexStart: number, indexCount: number, instancesCount?: number): void {
        // Apply states
        this.applyStates();

        this._reportDrawCall();

        // Render

        const drawMode = this._drawMode(fillMode);
        var indexFormat = this._uintIndicesCurrentlySet ? this._gl.UNSIGNED_INT : this._gl.UNSIGNED_SHORT;
        var mult = this._uintIndicesCurrentlySet ? 4 : 2;
        if (instancesCount) {
            this._gl.drawElementsInstanced(drawMode, indexCount, indexFormat, indexStart * mult, instancesCount);
        } else {
            this._gl.drawElements(drawMode, indexCount, indexFormat, indexStart * mult);
        }
    }

    /**
     * Draw a list of unindexed primitives
     * @param fillMode defines the primitive to use
     * @param verticesStart defines the index of first vertex to draw
     * @param verticesCount defines the count of vertices to draw
     * @param instancesCount defines the number of instances to draw (if instanciation is enabled)
     */
    public drawArraysType(fillMode: number, verticesStart: number, verticesCount: number, instancesCount?: number): void {
        // Apply states
        this.applyStates();

        this._reportDrawCall();

        const drawMode = this._drawMode(fillMode);
        if (instancesCount) {
            this._gl.drawArraysInstanced(drawMode, verticesStart, verticesCount, instancesCount);
        } else {
            this._gl.drawArrays(drawMode, verticesStart, verticesCount);
        }
    }

    private _drawMode(fillMode: number): number {
        switch (fillMode) {
            // Triangle views
            case Constants.MATERIAL_TriangleFillMode:
                return this._gl.TRIANGLES;
            case Constants.MATERIAL_PointFillMode:
                return this._gl.POINTS;
            case Constants.MATERIAL_WireFrameFillMode:
                return this._gl.LINES;
            // Draw modes
            case Constants.MATERIAL_PointListDrawMode:
                return this._gl.POINTS;
            case Constants.MATERIAL_LineListDrawMode:
                return this._gl.LINES;
            case Constants.MATERIAL_LineLoopDrawMode:
                return this._gl.LINE_LOOP;
            case Constants.MATERIAL_LineStripDrawMode:
                return this._gl.LINE_STRIP;
            case Constants.MATERIAL_TriangleStripDrawMode:
                return this._gl.TRIANGLE_STRIP;
            case Constants.MATERIAL_TriangleFanDrawMode:
                return this._gl.TRIANGLE_FAN;
            default:
                return this._gl.TRIANGLES;
        }
    }

    /** @hidden */
    protected _reportDrawCall() {
        // Will be implemented by children
    }

    // Shaders

    /** @hidden */
    public _releaseEffect(effect: Effect): void {
        if (this._compiledEffects[effect._key]) {
            delete this._compiledEffects[effect._key];

            this._deletePipelineContext(effect.getPipelineContext() as WebGLPipelineContext);
        }
    }

    /** @hidden */
    public _deletePipelineContext(pipelineContext: IPipelineContext): void {
        let webGLPipelineContext = pipelineContext as WebGLPipelineContext;
        if (webGLPipelineContext && webGLPipelineContext.program) {
            webGLPipelineContext.program.__SPECTOR_rebuildProgram = null;

            this._gl.deleteProgram(webGLPipelineContext.program);
        }
    }

    /**
     * Create a new effect (used to store vertex/fragment shaders)
     * @param baseName defines the base name of the effect (The name of file without .fragment.fx or .vertex.fx)
     * @param attributesNamesOrOptions defines either a list of attribute names or an IEffectCreationOptions object
     * @param uniformsNamesOrEngine defines either a list of uniform names or the engine to use
     * @param samplers defines an array of string used to represent textures
     * @param defines defines the string containing the defines to use to compile the shaders
     * @param fallbacks defines the list of potential fallbacks to use if shader conmpilation fails
     * @param onCompiled defines a function to call when the effect creation is successful
     * @param onError defines a function to call when the effect creation has failed
     * @param indexParameters defines an object containing the index values to use to compile shaders (like the maximum number of simultaneous lights)
     * @returns the new Effect
     */
    public createEffect(baseName: any, attributesNamesOrOptions: string[] | IEffectCreationOptions, uniformsNamesOrEngine: string[] | ThinEngine, samplers?: string[], defines?: string,
        fallbacks?: IEffectFallbacks,
        onCompiled?: Nullable<(effect: Effect) => void>, onError?: Nullable<(effect: Effect, errors: string) => void>, indexParameters?: any): Effect {
        var vertex = baseName.vertexElement || baseName.vertex || baseName.vertexToken || baseName;
        var fragment = baseName.fragmentElement || baseName.fragment || baseName.fragmentToken || baseName;

        var name = vertex + "+" + fragment + "@" + (defines ? defines : (<IEffectCreationOptions>attributesNamesOrOptions).defines);
        if (this._compiledEffects[name]) {
            var compiledEffect = <Effect>this._compiledEffects[name];
            if (onCompiled && compiledEffect.isReady()) {
                onCompiled(compiledEffect);
            }

            return compiledEffect;
        }
        var effect = new Effect(baseName, attributesNamesOrOptions, uniformsNamesOrEngine, samplers, this, defines, fallbacks, onCompiled, onError, indexParameters);
        effect._key = name;
        this._compiledEffects[name] = effect;

        return effect;
    }

    protected static _ConcatenateShader(source: string, defines: Nullable<string>, shaderVersion: string = ""): string {
        return shaderVersion + (defines ? defines + "\n" : "") + source;
    }

    private _compileShader(source: string, type: string, defines: Nullable<string>, shaderVersion: string): WebGLShader {
        return this._compileRawShader(ThinEngine._ConcatenateShader(source, defines, shaderVersion), type);
    }

    private _compileRawShader(source: string, type: string): WebGLShader {
        var gl = this._gl;
        var shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);

        if (!shader) {
            throw new Error("Something went wrong while compile the shader.");
        }

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        return shader;
    }

    /** @hidden */
    public _getShaderSource(shader: WebGLShader): Nullable<string> {
        return this._gl.getShaderSource(shader);
    }

    /**
     * Directly creates a webGL program
     * @param pipelineContext  defines the pipeline context to attach to
     * @param vertexCode defines the vertex shader code to use
     * @param fragmentCode defines the fragment shader code to use
     * @param context defines the webGL context to use (if not set, the current one will be used)
     * @param transformFeedbackVaryings defines the list of transform feedback varyings to use
     * @returns the new webGL program
     */
    public createRawShaderProgram(pipelineContext: IPipelineContext, vertexCode: string, fragmentCode: string, context?: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): WebGLProgram {
        context = context || this._gl;

        var vertexShader = this._compileRawShader(vertexCode, "vertex");
        var fragmentShader = this._compileRawShader(fragmentCode, "fragment");

        return this._createShaderProgram(pipelineContext as WebGLPipelineContext, vertexShader, fragmentShader, context, transformFeedbackVaryings);
    }

    /**
     * Creates a webGL program
     * @param pipelineContext  defines the pipeline context to attach to
     * @param vertexCode  defines the vertex shader code to use
     * @param fragmentCode defines the fragment shader code to use
     * @param defines defines the string containing the defines to use to compile the shaders
     * @param context defines the webGL context to use (if not set, the current one will be used)
     * @param transformFeedbackVaryings defines the list of transform feedback varyings to use
     * @returns the new webGL program
     */
    public createShaderProgram(pipelineContext: IPipelineContext, vertexCode: string, fragmentCode: string, defines: Nullable<string>, context?: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): WebGLProgram {
        context = context || this._gl;

        var shaderVersion = (this._webGLVersion > 1) ? "#version 300 es\n#define WEBGL2 \n" : "";
        var vertexShader = this._compileShader(vertexCode, "vertex", defines, shaderVersion);
        var fragmentShader = this._compileShader(fragmentCode, "fragment", defines, shaderVersion);

        return this._createShaderProgram(pipelineContext as WebGLPipelineContext, vertexShader, fragmentShader, context, transformFeedbackVaryings);
    }

    /**
     * Creates a new pipeline context
     * @returns the new pipeline
     */
    public createPipelineContext(): IPipelineContext {
        var pipelineContext = new WebGLPipelineContext();
        pipelineContext.engine = this;

        if (this._caps.parallelShaderCompile) {
            pipelineContext.isParallelCompiled = true;
        }

        return pipelineContext;
    }

    protected _createShaderProgram(pipelineContext: WebGLPipelineContext, vertexShader: WebGLShader, fragmentShader: WebGLShader, context: WebGLRenderingContext, transformFeedbackVaryings: Nullable<string[]> = null): WebGLProgram {
        var shaderProgram = context.createProgram();
        pipelineContext.program = shaderProgram;

        if (!shaderProgram) {
            throw new Error("Unable to create program");
        }

        context.attachShader(shaderProgram, vertexShader);
        context.attachShader(shaderProgram, fragmentShader);

        context.linkProgram(shaderProgram);

        pipelineContext.context = context;
        pipelineContext.vertexShader = vertexShader;
        pipelineContext.fragmentShader = fragmentShader;

        if (!pipelineContext.isParallelCompiled) {
            this._finalizePipelineContext(pipelineContext);
        }

        return shaderProgram;
    }

    protected _finalizePipelineContext(pipelineContext: WebGLPipelineContext) {
        const context = pipelineContext.context!;
        const vertexShader = pipelineContext.vertexShader!;
        const fragmentShader = pipelineContext.fragmentShader!;
        const program = pipelineContext.program!;

        var linked = context.getProgramParameter(program, context.LINK_STATUS);
        if (!linked) { // Get more info
            // Vertex
            if (!this._gl.getShaderParameter(vertexShader, this._gl.COMPILE_STATUS)) {
                const log = this._gl.getShaderInfoLog(vertexShader);
                if (log) {
                    pipelineContext.vertexCompilationError = log;
                    throw new Error("VERTEX SHADER " + log);
                }
            }

            // Fragment
            if (!this._gl.getShaderParameter(fragmentShader, this._gl.COMPILE_STATUS)) {
                const log = this._gl.getShaderInfoLog(fragmentShader);
                if (log) {
                    pipelineContext.fragmentCompilationError = log;
                    throw new Error("FRAGMENT SHADER " + log);
                }
            }

            var error = context.getProgramInfoLog(program);
            if (error) {
                pipelineContext.programLinkError = error;
                throw new Error(error);
            }
        }

        if (this.validateShaderPrograms) {
            context.validateProgram(program);
            var validated = context.getProgramParameter(program, context.VALIDATE_STATUS);

            if (!validated) {
                var error = context.getProgramInfoLog(program);
                if (error) {
                    pipelineContext.programValidationError = error;
                    throw new Error(error);
                }
            }
        }

        context.deleteShader(vertexShader);
        context.deleteShader(fragmentShader);

        pipelineContext.vertexShader = undefined;
        pipelineContext.fragmentShader = undefined;

        if (pipelineContext.onCompiled) {
            pipelineContext.onCompiled();
            pipelineContext.onCompiled = undefined;
        }
    }

    /** @hidden */
    public _preparePipelineContext(pipelineContext: IPipelineContext, vertexSourceCode: string, fragmentSourceCode: string, createAsRaw: boolean,
        rebuildRebind: any,
        defines: Nullable<string>,
        transformFeedbackVaryings: Nullable<string[]>) {
        let webGLRenderingState = pipelineContext as WebGLPipelineContext;

        if (createAsRaw) {
            webGLRenderingState.program = this.createRawShaderProgram(webGLRenderingState, vertexSourceCode, fragmentSourceCode, undefined, transformFeedbackVaryings);
        }
        else {
            webGLRenderingState.program = this.createShaderProgram(webGLRenderingState, vertexSourceCode, fragmentSourceCode, defines, undefined, transformFeedbackVaryings);
        }
        webGLRenderingState.program.__SPECTOR_rebuildProgram = rebuildRebind;
    }

    /** @hidden */
    public _isRenderingStateCompiled(pipelineContext: IPipelineContext): boolean {
        let webGLPipelineContext = pipelineContext as WebGLPipelineContext;
        if (this._gl.getProgramParameter(webGLPipelineContext.program!, this._caps.parallelShaderCompile!.COMPLETION_STATUS_KHR)) {
            this._finalizePipelineContext(webGLPipelineContext);
            return true;
        }

        return false;
    }

    /** @hidden */
    public _executeWhenRenderingStateIsCompiled(pipelineContext: IPipelineContext, action: () => void) {
        let webGLPipelineContext = pipelineContext as WebGLPipelineContext;

        if (!webGLPipelineContext.isParallelCompiled) {
            action();
            return;
        }

        let oldHandler = webGLPipelineContext.onCompiled;

        if (oldHandler) {
            webGLPipelineContext.onCompiled = () => {
                oldHandler!();
                action();
            };
        } else {
            webGLPipelineContext.onCompiled = action;
        }
    }

    /**
     * Gets the list of webGL uniform locations associated with a specific program based on a list of uniform names
     * @param pipelineContext defines the pipeline context to use
     * @param uniformsNames defines the list of uniform names
     * @returns an array of webGL uniform locations
     */
    public getUniforms(pipelineContext: IPipelineContext, uniformsNames: string[]): Nullable<WebGLUniformLocation>[] {
        var results = new Array<Nullable<WebGLUniformLocation>>();
        let webGLPipelineContext = pipelineContext as WebGLPipelineContext;

        for (var index = 0; index < uniformsNames.length; index++) {
            results.push(this._gl.getUniformLocation(webGLPipelineContext.program!, uniformsNames[index]));
        }

        return results;
    }

    /**
     * Gets the lsit of active attributes for a given webGL program
     * @param pipelineContext defines the pipeline context to use
     * @param attributesNames defines the list of attribute names to get
     * @returns an array of indices indicating the offset of each attribute
     */
    public getAttributes(pipelineContext: IPipelineContext, attributesNames: string[]): number[] {
        var results = [];
        let webGLPipelineContext = pipelineContext as WebGLPipelineContext;

        for (var index = 0; index < attributesNames.length; index++) {
            try {
                results.push(this._gl.getAttribLocation(webGLPipelineContext.program!, attributesNames[index]));
            } catch (e) {
                results.push(-1);
            }
        }

        return results;
    }

    /**
     * Activates an effect, mkaing it the current one (ie. the one used for rendering)
     * @param effect defines the effect to activate
     */
    public enableEffect(effect: Nullable<Effect>): void {
        if (!effect || effect === this._currentEffect) {
            return;
        }

        // Use program
        this.bindSamplers(effect);

        this._currentEffect = effect;

        if (effect.onBind) {
            effect.onBind(effect);
        }
        if (effect._onBindObservable) {
            effect._onBindObservable.notifyObservers(effect);
        }
    }

    /**
     * Set the value of an uniform to a number (int)
     * @param uniform defines the webGL uniform location where to store the value
     * @param value defines the int number to store
     */
    public setInt(uniform: Nullable<WebGLUniformLocation>, value: number): void {
        if (!uniform) {
            return;
        }

        this._gl.uniform1i(uniform, value);
    }

    /**
     * Set the value of an uniform to an array of int32
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     */
    public setIntArray(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void {
        if (!uniform) {
            return;
        }

        this._gl.uniform1iv(uniform, array);
    }

    /**
     * Set the value of an uniform to an array of int32 (stored as vec2)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     */
    public setIntArray2(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void {
        if (!uniform || array.length % 2 !== 0) {
            return;
        }

        this._gl.uniform2iv(uniform, array);
    }

    /**
     * Set the value of an uniform to an array of int32 (stored as vec3)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     */
    public setIntArray3(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void {
        if (!uniform || array.length % 3 !== 0) {
            return;
        }

        this._gl.uniform3iv(uniform, array);
    }

    /**
     * Set the value of an uniform to an array of int32 (stored as vec4)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of int32 to store
     */
    public setIntArray4(uniform: Nullable<WebGLUniformLocation>, array: Int32Array): void {
        if (!uniform || array.length % 4 !== 0) {
            return;
        }

        this._gl.uniform4iv(uniform, array);
    }

    /**
     * Set the value of an uniform to an array of number
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     */
    public setArray(uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): void {
        if (!uniform) {
            return;
        }

        this._gl.uniform1fv(uniform, array);
    }

    /**
     * Set the value of an uniform to an array of number (stored as vec2)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     */
    public setArray2(uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): void {
        if (!uniform || array.length % 2 !== 0) {
            return;
        }

        this._gl.uniform2fv(uniform, <any>array);
    }

    /**
     * Set the value of an uniform to an array of number (stored as vec3)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     */
    public setArray3(uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): void {
        if (!uniform || array.length % 3 !== 0) {
            return;
        }

        this._gl.uniform3fv(uniform, <any>array);
    }

    /**
     * Set the value of an uniform to an array of number (stored as vec4)
     * @param uniform defines the webGL uniform location where to store the value
     * @param array defines the array of number to store
     */
    public setArray4(uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): void {
        if (!uniform || array.length % 4 !== 0) {
            return;
        }

        this._gl.uniform4fv(uniform, <any>array);
    }

    /**
     * Set the value of an uniform to an array of float32 (stored as matrices)
     * @param uniform defines the webGL uniform location where to store the value
     * @param matrices defines the array of float32 to store
     */
    public setMatrices(uniform: Nullable<WebGLUniformLocation>, matrices: Float32Array): void {
        if (!uniform) {
            return;
        }

        this._gl.uniformMatrix4fv(uniform, false, matrices);
    }

    /**
     * Set the value of an uniform to a matrix (3x3)
     * @param uniform defines the webGL uniform location where to store the value
     * @param matrix defines the Float32Array representing the 3x3 matrix to store
     */
    public setMatrix3x3(uniform: Nullable<WebGLUniformLocation>, matrix: Float32Array): void {
        if (!uniform) {
            return;
        }

        this._gl.uniformMatrix3fv(uniform, false, matrix);
    }

    /**
     * Set the value of an uniform to a matrix (2x2)
     * @param uniform defines the webGL uniform location where to store the value
     * @param matrix defines the Float32Array representing the 2x2 matrix to store
     */
    public setMatrix2x2(uniform: Nullable<WebGLUniformLocation>, matrix: Float32Array): void {
        if (!uniform) {
            return;
        }

        this._gl.uniformMatrix2fv(uniform, false, matrix);
    }

    /**
     * Set the value of an uniform to a number (float)
     * @param uniform defines the webGL uniform location where to store the value
     * @param value defines the float number to store
     */
    public setFloat(uniform: Nullable<WebGLUniformLocation>, value: number): void {
        if (!uniform) {
            return;
        }

        this._gl.uniform1f(uniform, value);
    }

    /**
     * Set the value of an uniform to a vec2
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     */
    public setFloat2(uniform: Nullable<WebGLUniformLocation>, x: number, y: number): void {
        if (!uniform) {
            return;
        }

        this._gl.uniform2f(uniform, x, y);
    }

    /**
     * Set the value of an uniform to a vec3
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @param z defines the 3rd component of the value
     */
    public setFloat3(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number): void {
        if (!uniform) {
            return;
        }

        this._gl.uniform3f(uniform, x, y, z);
    }

    /**
     * Set the value of an uniform to a vec4
     * @param uniform defines the webGL uniform location where to store the value
     * @param x defines the 1st component of the value
     * @param y defines the 2nd component of the value
     * @param z defines the 3rd component of the value
     * @param w defines the 4th component of the value
     */
    public setFloat4(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number, w: number): void {
        if (!uniform) {
            return;
        }

        this._gl.uniform4f(uniform, x, y, z, w);
    }

    // States

    /**
     * Apply all cached states (depth, culling, stencil and alpha)
     */
    public applyStates() {
        this._depthCullingState.apply(this._gl);
        this._stencilState.apply(this._gl);
        this._alphaState.apply(this._gl);

        if (this._colorWriteChanged) {
            this._colorWriteChanged = false;
            const enable = this._colorWrite;
            this._gl.colorMask(enable, enable, enable, enable);
        }
    }

    /**
     * Enable or disable color writing
     * @param enable defines the state to set
     */
    public setColorWrite(enable: boolean): void {
        if (enable !== this._colorWrite) {
            this._colorWriteChanged = true;
            this._colorWrite = enable;
        }
    }

    /**
     * Gets a boolean indicating if color writing is enabled
     * @returns the current color writing state
     */
    public getColorWrite(): boolean {
        return this._colorWrite;
    }

    /**
     * Gets the depth culling state manager
     */
    public get depthCullingState(): DepthCullingState {
        return this._depthCullingState;
    }

    /**
     * Gets the alpha state manager
     */
    public get alphaState(): AlphaState {
        return this._alphaState;
    }

    /**
     * Gets the stencil state manager
     */
    public get stencilState(): StencilState {
        return this._stencilState;
    }

    // Textures

    /**
     * Clears the list of texture accessible through engine.
     * This can help preventing texture load conflict due to name collision.
     */
    public clearInternalTexturesCache() {
        this._internalTexturesCache = [];
    }

    /**
     * Force the entire cache to be cleared
     * You should not have to use this function unless your engine needs to share the webGL context with another engine
     * @param bruteForce defines a boolean to force clearing ALL caches (including stencil, detoh and alpha states)
     */
    public wipeCaches(bruteForce?: boolean): void {
        if (this.preventCacheWipeBetweenFrames && !bruteForce) {
            return;
        }
        this._currentEffect = null;
        this._viewportCached.x = 0;
        this._viewportCached.y = 0;
        this._viewportCached.z = 0;
        this._viewportCached.w = 0;

        // Done before in case we clean the attributes
        this._unbindVertexArrayObject();

        if (bruteForce) {
            this._currentProgram = null;
            this.resetTextureCache();

            this._stencilState.reset();

            this._depthCullingState.reset();
            this._depthCullingState.depthFunc = this._gl.LEQUAL;

            this._alphaState.reset();
            this._alphaMode = Constants.ALPHA_ADD;
            this._alphaEquation = Constants.ALPHA_DISABLE;

            this._colorWrite = true;
            this._colorWriteChanged = true;

            this._unpackFlipYCached = null;

            this._gl.pixelStorei(this._gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this._gl.NONE);
            this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);

            this._mustWipeVertexAttributes = true;
            this.unbindAllAttributes();
        }

        this._resetVertexBufferBinding();
        this._cachedIndexBuffer = null;
        this._cachedEffectForVertexBuffers = null;
        this.bindIndexBuffer(null);
    }

    /** @hidden */
    public _getSamplingParameters(samplingMode: number, generateMipMaps: boolean): { min: number; mag: number } {
        var gl = this._gl;
        var magFilter = gl.NEAREST;
        var minFilter = gl.NEAREST;

        switch (samplingMode) {
            case Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST:
                magFilter = gl.LINEAR;
                if (generateMipMaps) {
                    minFilter = gl.LINEAR_MIPMAP_NEAREST;
                } else {
                    minFilter = gl.LINEAR;
                }
                break;
            case Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR:
                magFilter = gl.LINEAR;
                if (generateMipMaps) {
                    minFilter = gl.LINEAR_MIPMAP_LINEAR;
                } else {
                    minFilter = gl.LINEAR;
                }
                break;
            case Constants.TEXTURE_NEAREST_NEAREST_MIPLINEAR:
                magFilter = gl.NEAREST;
                if (generateMipMaps) {
                    minFilter = gl.NEAREST_MIPMAP_LINEAR;
                } else {
                    minFilter = gl.NEAREST;
                }
                break;
            case Constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST:
                magFilter = gl.NEAREST;
                if (generateMipMaps) {
                    minFilter = gl.NEAREST_MIPMAP_NEAREST;
                } else {
                    minFilter = gl.NEAREST;
                }
                break;
            case Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST:
                magFilter = gl.NEAREST;
                if (generateMipMaps) {
                    minFilter = gl.LINEAR_MIPMAP_NEAREST;
                } else {
                    minFilter = gl.LINEAR;
                }
                break;
            case Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR:
                magFilter = gl.NEAREST;
                if (generateMipMaps) {
                    minFilter = gl.LINEAR_MIPMAP_LINEAR;
                } else {
                    minFilter = gl.LINEAR;
                }
                break;
            case Constants.TEXTURE_NEAREST_LINEAR:
                magFilter = gl.NEAREST;
                minFilter = gl.LINEAR;
                break;
            case Constants.TEXTURE_NEAREST_NEAREST:
                magFilter = gl.NEAREST;
                minFilter = gl.NEAREST;
                break;
            case Constants.TEXTURE_LINEAR_NEAREST_MIPNEAREST:
                magFilter = gl.LINEAR;
                if (generateMipMaps) {
                    minFilter = gl.NEAREST_MIPMAP_NEAREST;
                } else {
                    minFilter = gl.NEAREST;
                }
                break;
            case Constants.TEXTURE_LINEAR_NEAREST_MIPLINEAR:
                magFilter = gl.LINEAR;
                if (generateMipMaps) {
                    minFilter = gl.NEAREST_MIPMAP_LINEAR;
                } else {
                    minFilter = gl.NEAREST;
                }
                break;
            case Constants.TEXTURE_LINEAR_LINEAR:
                magFilter = gl.LINEAR;
                minFilter = gl.LINEAR;
                break;
            case Constants.TEXTURE_LINEAR_NEAREST:
                magFilter = gl.LINEAR;
                minFilter = gl.NEAREST;
                break;
        }

        return {
            min: minFilter,
            mag: magFilter
        };
    }

    /** @hidden */
    public _createTexture(): WebGLTexture {
        let texture = this._gl.createTexture();

        if (!texture) {
            throw new Error("Unable to create texture");
        }

        return texture;
    }

    /**
     * Usually called from Texture.ts.
     * Passed information to create a WebGLTexture
     * @param url defines a value which contains one of the following:
     * * A conventional http URL, e.g. 'http://...' or 'file://...'
     * * A base64 string of in-line texture data, e.g. 'data:image/jpg;base64,/...'
     * * An indicator that data being passed using the buffer parameter, e.g. 'data:mytexture.jpg'
     * @param noMipmap defines a boolean indicating that no mipmaps shall be generated.  Ignored for compressed textures.  They must be in the file
     * @param invertY when true, image is flipped when loaded.  You probably want true. Certain compressed textures may invert this if their default is inverted (eg. ktx)
     * @param scene needed for loading to the correct scene
     * @param samplingMode mode with should be used sample / access the texture (Default: Texture.TRILINEAR_SAMPLINGMODE)
     * @param onLoad optional callback to be called upon successful completion
     * @param onError optional callback to be called upon failure
     * @param buffer a source of a file previously fetched as either a base64 string, an ArrayBuffer (compressed or image format), HTMLImageElement (image format), or a Blob
     * @param fallback an internal argument in case the function must be called again, due to etc1 not having alpha capabilities
     * @param format internal format.  Default: RGB when extension is '.jpg' else RGBA.  Ignored for compressed textures
     * @param forcedExtension defines the extension to use to pick the right loader
     * @param mimeType defines an optional mime type
     * @returns a InternalTexture for assignment back into BABYLON.Texture
     */
    public createTexture(url: Nullable<string>, noMipmap: boolean, invertY: boolean, scene: Nullable<ISceneLike>, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        onLoad: Nullable<() => void> = null, onError: Nullable<(message: string, exception: any) => void> = null,
        buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap> = null, fallback: Nullable<InternalTexture> = null, format: Nullable<number> = null,
        forcedExtension: Nullable<string> = null, mimeType?: string): InternalTexture {
        url = url || "";
        const fromData = url.substr(0, 5) === "data:";
        const fromBlob = url.substr(0, 5) === "blob:";
        const isBase64 = fromData && url.indexOf(";base64,") !== -1;

        let texture = fallback ? fallback : new InternalTexture(this, InternalTextureSource.Url);

        const originalUrl = url;
        if (this._transformTextureUrl && !isBase64 && !fallback && !buffer) {
            url = this._transformTextureUrl(url);
        }

        // establish the file extension, if possible
        const lastDot = url.lastIndexOf('.');
        const extension = forcedExtension ? forcedExtension : (lastDot > -1 ? url.substring(lastDot).toLowerCase() : "");
        let loader: Nullable<IInternalTextureLoader> = null;

        for (const availableLoader of ThinEngine._TextureLoaders) {
            if (availableLoader.canLoad(extension, mimeType)) {
                loader = availableLoader;
                break;
            }
        }

        if (scene) {
            scene._addPendingData(texture);
        }
        texture.url = url;
        texture.generateMipMaps = !noMipmap;
        texture.samplingMode = samplingMode;
        texture.invertY = invertY;

        if (!this._doNotHandleContextLost) {
            // Keep a link to the buffer only if we plan to handle context lost
            texture._buffer = buffer;
        }

        let onLoadObserver: Nullable<Observer<InternalTexture>> = null;
        if (onLoad && !fallback) {
            onLoadObserver = texture.onLoadedObservable.add(onLoad);
        }

        if (!fallback) { this._internalTexturesCache.push(texture); }

        const onInternalError = (message?: string, exception?: any) => {
            if (scene) {
                scene._removePendingData(texture);
            }

            if (url === originalUrl) {
                if (onLoadObserver) {
                    texture.onLoadedObservable.remove(onLoadObserver);
                }

                if (EngineStore.UseFallbackTexture) {
                    this.createTexture(EngineStore.FallbackTexture, noMipmap, texture.invertY, scene, samplingMode, null, onError, buffer, texture);
                }

                if (onError) {
                    onError((message || "Unknown error") + (EngineStore.UseFallbackTexture ? " - Fallback texture was used" : ""), exception);
                }
            }
            else {
                // fall back to the original url if the transformed url fails to load
                Logger.Warn(`Failed to load ${url}, falling back to ${originalUrl}`);
                this.createTexture(originalUrl, noMipmap, texture.invertY, scene, samplingMode, onLoad, onError, buffer, texture, format, forcedExtension, mimeType);
            }
        };

        // processing for non-image formats
        if (loader) {
            const callback = (data: ArrayBufferView) => {
                loader!.loadData(data, texture, (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void, loadFailed) => {
                    if (loadFailed) {
                        onInternalError("TextureLoader failed to load data");
                    } else {
                        this._prepareWebGLTexture(texture, scene, width, height, texture.invertY, !loadMipmap, isCompressed, () => {
                            done();
                            return false;
                        }, samplingMode);
                    }
                });
            };

            if (!buffer) {
                this._loadFile(url, (data) => callback(new Uint8Array(data as ArrayBuffer)), undefined, scene ? scene.offlineProvider : undefined, true, (request?: IWebRequest, exception?: any) => {
                    onInternalError("Unable to load " + (request ? request.responseURL : url, exception));
                });
            } else {
                if (buffer instanceof ArrayBuffer) {
                    callback(new Uint8Array(buffer));
                }
                else if (ArrayBuffer.isView(buffer)) {
                    callback(buffer);
                }
                else {
                    if (onError) {
                        onError("Unable to load: only ArrayBuffer or ArrayBufferView is supported", null);
                    }
                }
            }
        } else {
            const onload = (img: HTMLImageElement | ImageBitmap) => {
                if (fromBlob && !this._doNotHandleContextLost) {
                    // We need to store the image if we need to rebuild the texture
                    // in case of a webgl context lost
                    texture._buffer = img;
                }

                this._prepareWebGLTexture(texture, scene, img.width, img.height, texture.invertY, noMipmap, false, (potWidth, potHeight, continuationCallback) => {
                    let gl = this._gl;
                    var isPot = (img.width === potWidth && img.height === potHeight);
                    let internalFormat = format ? this._getInternalFormat(format) : ((extension === ".jpg") ? gl.RGB : gl.RGBA);

                    if (isPot) {
                        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, internalFormat, gl.UNSIGNED_BYTE, img);
                        return false;
                    }

                    let maxTextureSize = this._caps.maxTextureSize;

                    if (img.width > maxTextureSize || img.height > maxTextureSize || !this._supportsHardwareTextureRescaling) {
                        this._prepareWorkingCanvas();
                        if (!this._workingCanvas || !this._workingContext) {
                            return false;
                        }

                        this._workingCanvas.width = potWidth;
                        this._workingCanvas.height = potHeight;

                        this._workingContext.drawImage(img, 0, 0, img.width, img.height, 0, 0, potWidth, potHeight);
                        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, internalFormat, gl.UNSIGNED_BYTE, this._workingCanvas);

                        texture.width = potWidth;
                        texture.height = potHeight;

                        return false;
                    } else {
                        // Using shaders when possible to rescale because canvas.drawImage is lossy
                        let source = new InternalTexture(this, InternalTextureSource.Temp);
                        this._bindTextureDirectly(gl.TEXTURE_2D, source, true);
                        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, internalFormat, gl.UNSIGNED_BYTE, img);

                        this._rescaleTexture(source, texture, scene, internalFormat, () => {
                            this._releaseTexture(source);
                            this._bindTextureDirectly(gl.TEXTURE_2D, texture, true);

                            continuationCallback();
                        });
                    }

                    return true;
                }, samplingMode);
            };

            if (!fromData || isBase64) {
                if (buffer && ((<HTMLImageElement>buffer).decoding || (<ImageBitmap>buffer).close)) {
                    onload(<HTMLImageElement>buffer);
                } else {
                    ThinEngine._FileToolsLoadImage(url, onload, onInternalError, scene ? scene.offlineProvider : null, mimeType);
                }
            }
            else if (typeof buffer === "string" || buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer) || buffer instanceof Blob) {
                ThinEngine._FileToolsLoadImage(buffer, onload, onInternalError, scene ? scene.offlineProvider : null, mimeType);
            }
            else if (buffer) {
                onload(buffer);
            }
        }

        return texture;
    }

    /**
     * Loads an image as an HTMLImageElement.
     * @param input url string, ArrayBuffer, or Blob to load
     * @param onLoad callback called when the image successfully loads
     * @param onError callback called when the image fails to load
     * @param offlineProvider offline provider for caching
     * @param mimeType optional mime type
     * @returns the HTMLImageElement of the loaded image
     * @hidden
     */
    public static _FileToolsLoadImage(input: string | ArrayBuffer | ArrayBufferView | Blob, onLoad: (img: HTMLImageElement | ImageBitmap) => void, onError: (message?: string, exception?: any) => void, offlineProvider: Nullable<IOfflineProvider>, mimeType?: string): Nullable<HTMLImageElement> {
        throw _DevTools.WarnImport("FileTools");
    }

    /**
     * @hidden
     */
    public _rescaleTexture(source: InternalTexture, destination: InternalTexture, scene: Nullable<any>, internalFormat: number, onComplete: () => void): void {
    }

    /**
     * Creates a raw texture
     * @param data defines the data to store in the texture
     * @param width defines the width of the texture
     * @param height defines the height of the texture
     * @param format defines the format of the data
     * @param generateMipMaps defines if the engine should generate the mip levels
     * @param invertY defines if data must be stored with Y axis inverted
     * @param samplingMode defines the required sampling mode (Texture.NEAREST_SAMPLINGMODE by default)
     * @param compression defines the compression used (null by default)
     * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
     * @returns the raw texture inside an InternalTexture
     */
    public createRawTexture(data: Nullable<ArrayBufferView>, width: number, height: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: Nullable<string> = null, type: number = Constants.TEXTURETYPE_UNSIGNED_INT): InternalTexture {
        throw _DevTools.WarnImport("Engine.RawTexture");
    }

    /**
     * Creates a new raw cube texture
     * @param data defines the array of data to use to create each face
     * @param size defines the size of the textures
     * @param format defines the format of the data
     * @param type defines the type of the data (like Engine.TEXTURETYPE_UNSIGNED_INT)
     * @param generateMipMaps  defines if the engine should generate the mip levels
     * @param invertY defines if data must be stored with Y axis inverted
     * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
     * @param compression defines the compression used (null by default)
     * @returns the cube texture as an InternalTexture
     */
    public createRawCubeTexture(data: Nullable<ArrayBufferView[]>, size: number, format: number, type: number,
        generateMipMaps: boolean, invertY: boolean, samplingMode: number,
        compression: Nullable<string> = null): InternalTexture {
        throw _DevTools.WarnImport("Engine.RawTexture");
    }

    /**
     * Creates a new raw 3D texture
     * @param data defines the data used to create the texture
     * @param width defines the width of the texture
     * @param height defines the height of the texture
     * @param depth defines the depth of the texture
     * @param format defines the format of the texture
     * @param generateMipMaps defines if the engine must generate mip levels
     * @param invertY defines if data must be stored with Y axis inverted
     * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
     * @param compression defines the compressed used (can be null)
     * @param textureType defines the compressed used (can be null)
     * @returns a new raw 3D texture (stored in an InternalTexture)
     */
    public createRawTexture3D(data: Nullable<ArrayBufferView>, width: number, height: number, depth: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: Nullable<string> = null, textureType = Constants.TEXTURETYPE_UNSIGNED_INT): InternalTexture {
        throw _DevTools.WarnImport("Engine.RawTexture");
    }

    /**
     * Creates a new raw 2D array texture
     * @param data defines the data used to create the texture
     * @param width defines the width of the texture
     * @param height defines the height of the texture
     * @param depth defines the number of layers of the texture
     * @param format defines the format of the texture
     * @param generateMipMaps defines if the engine must generate mip levels
     * @param invertY defines if data must be stored with Y axis inverted
     * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
     * @param compression defines the compressed used (can be null)
     * @param textureType defines the compressed used (can be null)
     * @returns a new raw 2D array texture (stored in an InternalTexture)
     */
    public createRawTexture2DArray(data: Nullable<ArrayBufferView>, width: number, height: number, depth: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: Nullable<string> = null, textureType = Constants.TEXTURETYPE_UNSIGNED_INT): InternalTexture {
        throw _DevTools.WarnImport("Engine.RawTexture");
    }

    private _unpackFlipYCached: Nullable<boolean> = null;

    /**
     * In case you are sharing the context with other applications, it might
     * be interested to not cache the unpack flip y state to ensure a consistent
     * value would be set.
     */
    public enableUnpackFlipYCached = true;

    /** @hidden */
    public _unpackFlipY(value: boolean): void {
        if (this._unpackFlipYCached !== value) {
            this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, value ? 1 : 0);

            if (this.enableUnpackFlipYCached) {
                this._unpackFlipYCached = value;
            }
        }
    }

    /** @hidden */
    public _getUnpackAlignement(): number {
        return this._gl.getParameter(this._gl.UNPACK_ALIGNMENT);
    }

    private _getTextureTarget(texture: InternalTexture): number {
        if (texture.isCube) {
            return this._gl.TEXTURE_CUBE_MAP;
        } else if (texture.is3D) {
            return this._gl.TEXTURE_3D;
        } else if (texture.is2DArray || texture.isMultiview) {
            return this._gl.TEXTURE_2D_ARRAY;
        }
        return this._gl.TEXTURE_2D;
    }

    /**
     * Update the sampling mode of a given texture
     * @param samplingMode defines the required sampling mode
     * @param texture defines the texture to update
     * @param generateMipMaps defines whether to generate mipmaps for the texture
     */
    public updateTextureSamplingMode(samplingMode: number, texture: InternalTexture, generateMipMaps: boolean = false): void {
        const target = this._getTextureTarget(texture);
        var filters = this._getSamplingParameters(samplingMode, texture.generateMipMaps || generateMipMaps);

        this._setTextureParameterInteger(target, this._gl.TEXTURE_MAG_FILTER, filters.mag, texture);
        this._setTextureParameterInteger(target, this._gl.TEXTURE_MIN_FILTER, filters.min);

        if (generateMipMaps) {
            texture.generateMipMaps = true;
            this._gl.generateMipmap(target);
        }

        this._bindTextureDirectly(target, null);

        texture.samplingMode = samplingMode;
    }

    /**
     * Update the sampling mode of a given texture
     * @param texture defines the texture to update
     * @param wrapU defines the texture wrap mode of the u coordinates
     * @param wrapV defines the texture wrap mode of the v coordinates
     * @param wrapR defines the texture wrap mode of the r coordinates
     */
    public updateTextureWrappingMode(texture: InternalTexture, wrapU: Nullable<number>, wrapV: Nullable<number> = null, wrapR: Nullable<number> = null): void {
        const target = this._getTextureTarget(texture);

        if (wrapU !== null) {
            this._setTextureParameterInteger(target, this._gl.TEXTURE_WRAP_S, this._getTextureWrapMode(wrapU), texture);
            texture._cachedWrapU = wrapU;
        }
        if (wrapV !== null) {
            this._setTextureParameterInteger(target, this._gl.TEXTURE_WRAP_T, this._getTextureWrapMode(wrapV), texture);
            texture._cachedWrapV = wrapV;
        }
        if ((texture.is2DArray || texture.is3D) && (wrapR !== null)) {
            this._setTextureParameterInteger(target, this._gl.TEXTURE_WRAP_R, this._getTextureWrapMode(wrapR), texture);
            texture._cachedWrapR = wrapR;
        }

        this._bindTextureDirectly(target, null);
    }

    /** @hidden */
    public _setupDepthStencilTexture(internalTexture: InternalTexture, size: number | { width: number, height: number, layers?: number }, generateStencil: boolean, bilinearFiltering: boolean, comparisonFunction: number): void {
        const width = (<{ width: number, height: number, layers?: number }>size).width || <number>size;
        const height = (<{ width: number, height: number, layers?: number }>size).height || <number>size;
        const layers = (<{ width: number, height: number, layers?: number }>size).layers || 0;

        internalTexture.baseWidth = width;
        internalTexture.baseHeight = height;
        internalTexture.width = width;
        internalTexture.height = height;
        internalTexture.is2DArray = layers > 0;
        internalTexture.depth = layers;
        internalTexture.isReady = true;
        internalTexture.samples = 1;
        internalTexture.generateMipMaps = false;
        internalTexture._generateDepthBuffer = true;
        internalTexture._generateStencilBuffer = generateStencil;
        internalTexture.samplingMode = bilinearFiltering ? Constants.TEXTURE_BILINEAR_SAMPLINGMODE : Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        internalTexture.type = Constants.TEXTURETYPE_UNSIGNED_INT;
        internalTexture._comparisonFunction = comparisonFunction;

        const gl = this._gl;
        const target = this._getTextureTarget(internalTexture);
        const samplingParameters = this._getSamplingParameters(internalTexture.samplingMode, false);
        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, samplingParameters.mag);
        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, samplingParameters.min);
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        if (comparisonFunction === 0) {
            gl.texParameteri(target, gl.TEXTURE_COMPARE_FUNC, Constants.LEQUAL);
            gl.texParameteri(target, gl.TEXTURE_COMPARE_MODE, gl.NONE);
        }
        else {
            gl.texParameteri(target, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
            gl.texParameteri(target, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
        }
    }

    /** @hidden */
    public _uploadCompressedDataToTextureDirectly(texture: InternalTexture, internalFormat: number, width: number, height: number, data: ArrayBufferView, faceIndex: number = 0, lod: number = 0) {
        var gl = this._gl;

        var target = gl.TEXTURE_2D;
        if (texture.isCube) {
            target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
        }

        this._gl.compressedTexImage2D(target, lod, internalFormat, width, height, 0, <DataView>data);
    }

    /** @hidden */
    public _uploadDataToTextureDirectly(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0, babylonInternalFormat?: number, useTextureWidthAndHeight = false): void {
        var gl = this._gl;

        var textureType = this._getWebGLTextureType(texture.type);
        var format = this._getInternalFormat(texture.format);
        var internalFormat = babylonInternalFormat === undefined ? this._getRGBABufferInternalSizedFormat(texture.type, texture.format) : this._getInternalFormat(babylonInternalFormat);

        this._unpackFlipY(texture.invertY);

        var target = gl.TEXTURE_2D;
        if (texture.isCube) {
            target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
        }

        const lodMaxWidth = Math.round(Math.log(texture.width) * Math.LOG2E);
        const lodMaxHeight = Math.round(Math.log(texture.height) * Math.LOG2E);
        const width = useTextureWidthAndHeight ? texture.width : Math.pow(2, Math.max(lodMaxWidth - lod, 0));
        const height = useTextureWidthAndHeight ? texture.height : Math.pow(2, Math.max(lodMaxHeight - lod, 0));

        gl.texImage2D(target, lod, internalFormat, width, height, 0, format, textureType, imageData);
    }

    /**
     * Update a portion of an internal texture
     * @param texture defines the texture to update
     * @param imageData defines the data to store into the texture
     * @param xOffset defines the x coordinates of the update rectangle
     * @param yOffset defines the y coordinates of the update rectangle
     * @param width defines the width of the update rectangle
     * @param height defines the height of the update rectangle
     * @param faceIndex defines the face index if texture is a cube (0 by default)
     * @param lod defines the lod level to update (0 by default)
     */
    public updateTextureData(texture: InternalTexture, imageData: ArrayBufferView, xOffset: number, yOffset: number, width: number, height: number, faceIndex: number = 0, lod: number = 0): void {
        var gl = this._gl;

        var textureType = this._getWebGLTextureType(texture.type);
        var format = this._getInternalFormat(texture.format);

        this._unpackFlipY(texture.invertY);

        var target = gl.TEXTURE_2D;
        if (texture.isCube) {
            target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
        }

        gl.texSubImage2D(target, lod, xOffset, yOffset, width, height, format, textureType, imageData);
    }

    /** @hidden */
    public _uploadArrayBufferViewToTexture(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0): void {
        var gl = this._gl;
        var bindTarget = texture.isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;

        this._bindTextureDirectly(bindTarget, texture, true);

        this._uploadDataToTextureDirectly(texture, imageData, faceIndex, lod);

        this._bindTextureDirectly(bindTarget, null, true);
    }

    protected _prepareWebGLTextureContinuation(texture: InternalTexture, scene: Nullable<ISceneLike>, noMipmap: boolean, isCompressed: boolean, samplingMode: number): void {
        var gl = this._gl;
        if (!gl) {
            return;
        }

        var filters = this._getSamplingParameters(samplingMode, !noMipmap);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);

        if (!noMipmap && !isCompressed) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        this._bindTextureDirectly(gl.TEXTURE_2D, null);

        // this.resetTextureCache();
        if (scene) {
            scene._removePendingData(texture);
        }

        texture.onLoadedObservable.notifyObservers(texture);
        texture.onLoadedObservable.clear();
    }

    private _prepareWebGLTexture(texture: InternalTexture, scene: Nullable<ISceneLike>, width: number, height: number, invertY: boolean, noMipmap: boolean, isCompressed: boolean,
        processFunction: (width: number, height: number, continuationCallback: () => void) => boolean, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE): void {
        var maxTextureSize = this.getCaps().maxTextureSize;
        var potWidth = Math.min(maxTextureSize, this.needPOTTextures ? ThinEngine.GetExponentOfTwo(width, maxTextureSize) : width);
        var potHeight = Math.min(maxTextureSize, this.needPOTTextures ? ThinEngine.GetExponentOfTwo(height, maxTextureSize) : height);

        var gl = this._gl;
        if (!gl) {
            return;
        }

        if (!texture._webGLTexture) {
            //  this.resetTextureCache();
            if (scene) {
                scene._removePendingData(texture);
            }

            return;
        }

        this._bindTextureDirectly(gl.TEXTURE_2D, texture, true);
        this._unpackFlipY(invertY === undefined ? true : (invertY ? true : false));

        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = potWidth;
        texture.height = potHeight;
        texture.isReady = true;

        if (processFunction(potWidth, potHeight, () => {
            this._prepareWebGLTextureContinuation(texture, scene, noMipmap, isCompressed, samplingMode);
        })) {
            // Returning as texture needs extra async steps
            return;
        }

        this._prepareWebGLTextureContinuation(texture, scene, noMipmap, isCompressed, samplingMode);
    }

    /** @hidden */
    public _setupFramebufferDepthAttachments(generateStencilBuffer: boolean, generateDepthBuffer: boolean, width: number, height: number, samples = 1): Nullable<WebGLRenderbuffer> {
        var gl = this._gl;

        // Create the depth/stencil buffer
        if (generateStencilBuffer && generateDepthBuffer) {
            return this._getDepthStencilBuffer(width, height, samples, gl.DEPTH_STENCIL, gl.DEPTH24_STENCIL8, gl.DEPTH_STENCIL_ATTACHMENT);
        }
        if (generateDepthBuffer) {
            let depthFormat = gl.DEPTH_COMPONENT16;
            if (this._webGLVersion > 1) {
                depthFormat = gl.DEPTH_COMPONENT32F;
            }

            return this._getDepthStencilBuffer(width, height, samples, depthFormat, depthFormat, gl.DEPTH_ATTACHMENT);
        }
        if (generateStencilBuffer) {
            return this._getDepthStencilBuffer(width, height, samples, gl.STENCIL_INDEX8, gl.STENCIL_INDEX8, gl.STENCIL_ATTACHMENT);
        }

        return null;
    }

    private _getDepthStencilBuffer = (width: number, height: number, samples: number, internalFormat: number, msInternalFormat: number, attachment: number) => {
        var gl = this._gl;
        const depthStencilBuffer = gl.createRenderbuffer();

        gl.bindRenderbuffer(gl.RENDERBUFFER, depthStencilBuffer);

        if (samples > 1 && gl.renderbufferStorageMultisample) {
            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, msInternalFormat, width, height);
        } else {
            gl.renderbufferStorage(gl.RENDERBUFFER, internalFormat, width, height);
        }

        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, gl.RENDERBUFFER, depthStencilBuffer);

        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        return depthStencilBuffer;
    }

    /** @hidden */
    public _releaseFramebufferObjects(texture: InternalTexture): void {
        var gl = this._gl;

        if (texture._framebuffer) {
            gl.deleteFramebuffer(texture._framebuffer);
            texture._framebuffer = null;
        }

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
    }

    /** @hidden */
    public _releaseTexture(texture: InternalTexture): void {
        this._releaseFramebufferObjects(texture);

        this._deleteTexture(texture._webGLTexture);

        // Unbind channels
        this.unbindAllTextures();

        var index = this._internalTexturesCache.indexOf(texture);
        if (index !== -1) {
            this._internalTexturesCache.splice(index, 1);
        }

        // Integrated fixed lod samplers.
        if (texture._lodTextureHigh) {
            texture._lodTextureHigh.dispose();
        }
        if (texture._lodTextureMid) {
            texture._lodTextureMid.dispose();
        }
        if (texture._lodTextureLow) {
            texture._lodTextureLow.dispose();
        }

        // Integrated irradiance map.
        if (texture._irradianceTexture) {
            texture._irradianceTexture.dispose();
        }
    }

    protected _deleteTexture(texture: Nullable<WebGLTexture>): void {
        this._gl.deleteTexture(texture);
    }

    protected _setProgram(program: WebGLProgram): void {
        if (this._currentProgram !== program) {
            this._gl.useProgram(program);
            this._currentProgram = program;
        }
    }

    protected _boundUniforms: { [key: number]: WebGLUniformLocation } = {};

    /**
     * Binds an effect to the webGL context
     * @param effect defines the effect to bind
     */
    public bindSamplers(effect: Effect): void {
        let webGLPipelineContext = effect.getPipelineContext() as WebGLPipelineContext;
        this._setProgram(webGLPipelineContext.program!);
        var samplers = effect.getSamplers();
        for (var index = 0; index < samplers.length; index++) {
            var uniform = effect.getUniform(samplers[index]);

            if (uniform) {
                this._boundUniforms[index] = uniform;
            }
        }
        this._currentEffect = null;
    }

    private _activateCurrentTexture() {
        if (this._currentTextureChannel !== this._activeChannel) {
            this._gl.activeTexture(this._gl.TEXTURE0 + this._activeChannel);
            this._currentTextureChannel = this._activeChannel;
        }
    }

    /** @hidden */
    public _bindTextureDirectly(target: number, texture: Nullable<InternalTexture>, forTextureDataUpdate = false, force = false): boolean {
        var wasPreviouslyBound = false;
        let isTextureForRendering = texture && texture._associatedChannel > -1;
        if (forTextureDataUpdate && isTextureForRendering) {
            this._activeChannel = texture!._associatedChannel;
        }

        let currentTextureBound = this._boundTexturesCache[this._activeChannel];

        if (currentTextureBound !== texture || force) {
            this._activateCurrentTexture();

            if (texture && texture.isMultiview) {
                this._gl.bindTexture(target, texture ? texture._colorTextureArray : null);
            } else {
                this._gl.bindTexture(target, texture ? texture._webGLTexture : null);
            }

            this._boundTexturesCache[this._activeChannel] = texture;

            if (texture) {
                texture._associatedChannel = this._activeChannel;
            }
        } else if (forTextureDataUpdate) {
            wasPreviouslyBound = true;
            this._activateCurrentTexture();
        }

        if (isTextureForRendering && !forTextureDataUpdate) {
            this._bindSamplerUniformToChannel(texture!._associatedChannel, this._activeChannel);
        }

        return wasPreviouslyBound;
    }

    /** @hidden */
    public _bindTexture(channel: number, texture: Nullable<InternalTexture>): void {
        if (channel === undefined) {
            return;
        }

        if (texture) {
            texture._associatedChannel = channel;
        }

        this._activeChannel = channel;
        const target = texture ? this._getTextureTarget(texture) : this._gl.TEXTURE_2D;
        this._bindTextureDirectly(target, texture);
    }

    /**
     * Unbind all textures from the webGL context
     */
    public unbindAllTextures(): void {
        for (var channel = 0; channel < this._maxSimultaneousTextures; channel++) {
            this._activeChannel = channel;
            this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
            this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
            if (this.webGLVersion > 1) {
                this._bindTextureDirectly(this._gl.TEXTURE_3D, null);
                this._bindTextureDirectly(this._gl.TEXTURE_2D_ARRAY, null);
            }
        }
    }

    /**
     * Sets a texture to the according uniform.
     * @param channel The texture channel
     * @param uniform The uniform to set
     * @param texture The texture to apply
     */
    public setTexture(channel: number, uniform: Nullable<WebGLUniformLocation>, texture: Nullable<BaseTexture>): void {
        if (channel === undefined) {
            return;
        }

        if (uniform) {
            this._boundUniforms[channel] = uniform;
        }

        this._setTexture(channel, texture);
    }

    private _bindSamplerUniformToChannel(sourceSlot: number, destination: number) {
        let uniform = this._boundUniforms[sourceSlot];
        if (!uniform || uniform._currentState === destination) {
            return;
        }
        this._gl.uniform1i(uniform, destination);
        uniform._currentState = destination;
    }

    private _getTextureWrapMode(mode: number): number {
        switch (mode) {
            case Constants.TEXTURE_WRAP_ADDRESSMODE:
                return this._gl.REPEAT;
            case Constants.TEXTURE_CLAMP_ADDRESSMODE:
                return this._gl.CLAMP_TO_EDGE;
            case Constants.TEXTURE_MIRROR_ADDRESSMODE:
                return this._gl.MIRRORED_REPEAT;
        }
        return this._gl.REPEAT;
    }

    protected _setTexture(channel: number, texture: Nullable<BaseTexture>, isPartOfTextureArray = false, depthStencilTexture = false): boolean {
        // Not ready?
        if (!texture) {
            if (this._boundTexturesCache[channel] != null) {
                this._activeChannel = channel;
                this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
                this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
                if (this.webGLVersion > 1) {
                    this._bindTextureDirectly(this._gl.TEXTURE_3D, null);
                    this._bindTextureDirectly(this._gl.TEXTURE_2D_ARRAY, null);
                }
            }
            return false;
        }

        // Video
        if ((<VideoTexture>texture).video) {
            this._activeChannel = channel;
            (<VideoTexture>texture).update();
        } else if (texture.delayLoadState === Constants.DELAYLOADSTATE_NOTLOADED) { // Delay loading
            texture.delayLoad();
            return false;
        }

        let internalTexture: InternalTexture;
        if (depthStencilTexture) {
            internalTexture = (<RenderTargetTexture>texture).depthStencilTexture!;
        }
        else if (texture.isReady()) {
            internalTexture = <InternalTexture>texture.getInternalTexture();
        }
        else if (texture.isCube) {
            internalTexture = this.emptyCubeTexture;
        }
        else if (texture.is3D) {
            internalTexture = this.emptyTexture3D;
        }
        else if (texture.is2DArray) {
            internalTexture = this.emptyTexture2DArray;
        }
        else {
            internalTexture = this.emptyTexture;
        }

        if (!isPartOfTextureArray && internalTexture) {
            internalTexture._associatedChannel = channel;
        }

        let needToBind = true;
        if (this._boundTexturesCache[channel] === internalTexture) {
            if (!isPartOfTextureArray) {
                this._bindSamplerUniformToChannel(internalTexture._associatedChannel, channel);
            }

            needToBind = false;
        }

        this._activeChannel = channel;
        const target = this._getTextureTarget(internalTexture);
        if (needToBind) {
            this._bindTextureDirectly(target, internalTexture, isPartOfTextureArray);
        }

        if (internalTexture && !internalTexture.isMultiview) {
            // CUBIC_MODE and SKYBOX_MODE both require CLAMP_TO_EDGE.  All other modes use REPEAT.
            if (internalTexture.isCube && internalTexture._cachedCoordinatesMode !== texture.coordinatesMode) {
                internalTexture._cachedCoordinatesMode = texture.coordinatesMode;

                var textureWrapMode = (texture.coordinatesMode !== Constants.TEXTURE_CUBIC_MODE && texture.coordinatesMode !== Constants.TEXTURE_SKYBOX_MODE) ? Constants.TEXTURE_WRAP_ADDRESSMODE : Constants.TEXTURE_CLAMP_ADDRESSMODE;
                texture.wrapU = textureWrapMode;
                texture.wrapV = textureWrapMode;
            }

            if (internalTexture._cachedWrapU !== texture.wrapU) {
                internalTexture._cachedWrapU = texture.wrapU;
                this._setTextureParameterInteger(target, this._gl.TEXTURE_WRAP_S, this._getTextureWrapMode(texture.wrapU), internalTexture);
            }

            if (internalTexture._cachedWrapV !== texture.wrapV) {
                internalTexture._cachedWrapV = texture.wrapV;
                this._setTextureParameterInteger(target, this._gl.TEXTURE_WRAP_T, this._getTextureWrapMode(texture.wrapV), internalTexture);
            }

            if (internalTexture.is3D && internalTexture._cachedWrapR !== texture.wrapR) {
                internalTexture._cachedWrapR = texture.wrapR;
                this._setTextureParameterInteger(target, this._gl.TEXTURE_WRAP_R, this._getTextureWrapMode(texture.wrapR), internalTexture);
            }

            this._setAnisotropicLevel(target, internalTexture, texture.anisotropicFilteringLevel);
        }

        return true;
    }

    /**
     * Sets an array of texture to the webGL context
     * @param channel defines the channel where the texture array must be set
     * @param uniform defines the associated uniform location
     * @param textures defines the array of textures to bind
     */
    public setTextureArray(channel: number, uniform: Nullable<WebGLUniformLocation>, textures: BaseTexture[]): void {
        if (channel === undefined || !uniform) {
            return;
        }

        if (!this._textureUnits || this._textureUnits.length !== textures.length) {
            this._textureUnits = new Int32Array(textures.length);
        }
        for (let i = 0; i < textures.length; i++) {
            let texture = textures[i].getInternalTexture();

            if (texture) {
                this._textureUnits[i] = channel + i;
                texture._associatedChannel = channel + i;
            } else {
                this._textureUnits[i] = -1;
            }
        }
        this._gl.uniform1iv(uniform, this._textureUnits);

        for (var index = 0; index < textures.length; index++) {
            this._setTexture(this._textureUnits[index], textures[index], true);
        }
    }

    /** @hidden */
    public _setAnisotropicLevel(target: number, internalTexture: InternalTexture, anisotropicFilteringLevel: number) {
        var anisotropicFilterExtension = this._caps.textureAnisotropicFilterExtension;
        if (internalTexture.samplingMode !== Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST
            && internalTexture.samplingMode !== Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR
            && internalTexture.samplingMode !== Constants.TEXTURE_LINEAR_LINEAR) {
            anisotropicFilteringLevel = 1; // Forcing the anisotropic to 1 because else webgl will force filters to linear
        }

        if (anisotropicFilterExtension && internalTexture._cachedAnisotropicFilteringLevel !== anisotropicFilteringLevel) {
            this._setTextureParameterFloat(target, anisotropicFilterExtension.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(anisotropicFilteringLevel, this._caps.maxAnisotropy), internalTexture);
            internalTexture._cachedAnisotropicFilteringLevel = anisotropicFilteringLevel;
        }
    }

    private _setTextureParameterFloat(target: number, parameter: number, value: number, texture: InternalTexture): void {
        this._bindTextureDirectly(target, texture, true, true);
        this._gl.texParameterf(target, parameter, value);
    }

    private _setTextureParameterInteger(target: number, parameter: number, value: number, texture?: InternalTexture) {
        if (texture) {
            this._bindTextureDirectly(target, texture, true, true);
        }
        this._gl.texParameteri(target, parameter, value);
    }

    /**
     * Unbind all vertex attributes from the webGL context
     */
    public unbindAllAttributes() {
        if (this._mustWipeVertexAttributes) {
            this._mustWipeVertexAttributes = false;

            for (var i = 0; i < this._caps.maxVertexAttribs; i++) {
                this.disableAttributeByIndex(i);
            }
            return;
        }

        for (var i = 0, ul = this._vertexAttribArraysEnabled.length; i < ul; i++) {
            if (i >= this._caps.maxVertexAttribs || !this._vertexAttribArraysEnabled[i]) {
                continue;
            }

            this.disableAttributeByIndex(i);
        }
    }

    /**
     * Force the engine to release all cached effects. This means that next effect compilation will have to be done completely even if a similar effect was already compiled
     */
    public releaseEffects() {
        for (var name in this._compiledEffects) {
            let webGLPipelineContext = this._compiledEffects[name].getPipelineContext() as WebGLPipelineContext;
            this._deletePipelineContext(webGLPipelineContext);
        }

        this._compiledEffects = {};
    }

    /**
     * Dispose and release all associated resources
     */
    public dispose(): void {
        this.stopRenderLoop();

        // Clear observables
        if (this.onBeforeTextureInitObservable) {
            this.onBeforeTextureInitObservable.clear();
        }

        // Empty texture
        if (this._emptyTexture) {
            this._releaseTexture(this._emptyTexture);
            this._emptyTexture = null;
        }
        if (this._emptyCubeTexture) {
            this._releaseTexture(this._emptyCubeTexture);
            this._emptyCubeTexture = null;
        }

        if (this._dummyFramebuffer) {
            this._gl.deleteFramebuffer(this._dummyFramebuffer);
        }

        // Release effects
        this.releaseEffects();

        // Unbind
        this.unbindAllAttributes();
        this._boundUniforms = [];

        // Events
        if (DomManagement.IsWindowObjectExist()) {
            if (this._renderingCanvas) {
                if (!this._doNotHandleContextLost) {
                    this._renderingCanvas.removeEventListener("webglcontextlost", this._onContextLost);
                    this._renderingCanvas.removeEventListener("webglcontextrestored", this._onContextRestored);
                }
            }
        }

        this._workingCanvas = null;
        this._workingContext = null;
        this._currentBufferPointers = [];
        this._renderingCanvas = null;
        this._currentProgram = null;
        this._boundRenderFunction = null;

        Effect.ResetCache();

        // Abort active requests
        for (let request of this._activeRequests) {
            request.abort();
        }
    }

    /**
     * Attach a new callback raised when context lost event is fired
     * @param callback defines the callback to call
     */
    public attachContextLostEvent(callback: ((event: WebGLContextEvent) => void)): void {
        if (this._renderingCanvas) {
            this._renderingCanvas.addEventListener("webglcontextlost", <any>callback, false);
        }
    }

    /**
     * Attach a new callback raised when context restored event is fired
     * @param callback defines the callback to call
     */
    public attachContextRestoredEvent(callback: ((event: WebGLContextEvent) => void)): void {
        if (this._renderingCanvas) {
            this._renderingCanvas.addEventListener("webglcontextrestored", <any>callback, false);
        }
    }

    /**
     * Get the current error code of the webGL context
     * @returns the error code
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getError
     */
    public getError(): number {
        return this._gl.getError();
    }

    private _canRenderToFloatFramebuffer(): boolean {
        if (this._webGLVersion > 1) {
            return this._caps.colorBufferFloat;
        }
        return this._canRenderToFramebuffer(Constants.TEXTURETYPE_FLOAT);
    }

    private _canRenderToHalfFloatFramebuffer(): boolean {
        if (this._webGLVersion > 1) {
            return this._caps.colorBufferFloat;
        }
        return this._canRenderToFramebuffer(Constants.TEXTURETYPE_HALF_FLOAT);
    }

    // Thank you : http://stackoverflow.com/questions/28827511/webgl-ios-render-to-floating-point-texture
    private _canRenderToFramebuffer(type: number): boolean {
        let gl = this._gl;

        //clear existing errors
        while (gl.getError() !== gl.NO_ERROR) { }

        let successful = true;

        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, this._getRGBABufferInternalSizedFormat(type), 1, 1, 0, gl.RGBA, this._getWebGLTextureType(type), null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        let fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

        successful = successful && (status === gl.FRAMEBUFFER_COMPLETE);
        successful = successful && (gl.getError() === gl.NO_ERROR);

        //try render by clearing frame buffer's color buffer
        if (successful) {
            gl.clear(gl.COLOR_BUFFER_BIT);
            successful = successful && (gl.getError() === gl.NO_ERROR);
        }

        //try reading from frame to ensure render occurs (just creating the FBO is not sufficient to determine if rendering is supported)
        if (successful) {
            //in practice it's sufficient to just read from the backbuffer rather than handle potentially issues reading from the texture
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            let readFormat = gl.RGBA;
            let readType = gl.UNSIGNED_BYTE;
            let buffer = new Uint8Array(4);
            gl.readPixels(0, 0, 1, 1, readFormat, readType, buffer);
            successful = successful && (gl.getError() === gl.NO_ERROR);
        }

        //clean up
        gl.deleteTexture(texture);
        gl.deleteFramebuffer(fb);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        //clear accumulated errors
        while (!successful && (gl.getError() !== gl.NO_ERROR)) { }

        return successful;
    }

    /** @hidden */
    public _getWebGLTextureType(type: number): number {
        if (this._webGLVersion === 1) {
            switch (type) {
                case Constants.TEXTURETYPE_FLOAT:
                    return this._gl.FLOAT;
                case Constants.TEXTURETYPE_HALF_FLOAT:
                    return this._gl.HALF_FLOAT_OES;
                case Constants.TEXTURETYPE_UNSIGNED_BYTE:
                    return this._gl.UNSIGNED_BYTE;
                case Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
                    return this._gl.UNSIGNED_SHORT_4_4_4_4;
                case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
                    return this._gl.UNSIGNED_SHORT_5_5_5_1;
                case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
                    return this._gl.UNSIGNED_SHORT_5_6_5;
            }
            return this._gl.UNSIGNED_BYTE;
        }

        switch (type) {
            case Constants.TEXTURETYPE_BYTE:
                return this._gl.BYTE;
            case Constants.TEXTURETYPE_UNSIGNED_BYTE:
                return this._gl.UNSIGNED_BYTE;
            case Constants.TEXTURETYPE_SHORT:
                return this._gl.SHORT;
            case Constants.TEXTURETYPE_UNSIGNED_SHORT:
                return this._gl.UNSIGNED_SHORT;
            case Constants.TEXTURETYPE_INT:
                return this._gl.INT;
            case Constants.TEXTURETYPE_UNSIGNED_INTEGER: // Refers to UNSIGNED_INT
                return this._gl.UNSIGNED_INT;
            case Constants.TEXTURETYPE_FLOAT:
                return this._gl.FLOAT;
            case Constants.TEXTURETYPE_HALF_FLOAT:
                return this._gl.HALF_FLOAT;
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
                return this._gl.UNSIGNED_SHORT_4_4_4_4;
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
                return this._gl.UNSIGNED_SHORT_5_5_5_1;
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
                return this._gl.UNSIGNED_SHORT_5_6_5;
            case Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV:
                return this._gl.UNSIGNED_INT_2_10_10_10_REV;
            case Constants.TEXTURETYPE_UNSIGNED_INT_24_8:
                return this._gl.UNSIGNED_INT_24_8;
            case Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV:
                return this._gl.UNSIGNED_INT_10F_11F_11F_REV;
            case Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV:
                return this._gl.UNSIGNED_INT_5_9_9_9_REV;
            case Constants.TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV:
                return this._gl.FLOAT_32_UNSIGNED_INT_24_8_REV;
        }

        return this._gl.UNSIGNED_BYTE;
    }

    /** @hidden */
    public _getInternalFormat(format: number): number {
        var internalFormat = this._gl.RGBA;

        switch (format) {
            case Constants.TEXTUREFORMAT_ALPHA:
                internalFormat = this._gl.ALPHA;
                break;
            case Constants.TEXTUREFORMAT_LUMINANCE:
                internalFormat = this._gl.LUMINANCE;
                break;
            case Constants.TEXTUREFORMAT_LUMINANCE_ALPHA:
                internalFormat = this._gl.LUMINANCE_ALPHA;
                break;
            case Constants.TEXTUREFORMAT_RED:
                internalFormat = this._gl.RED;
                break;
            case Constants.TEXTUREFORMAT_RG:
                internalFormat = this._gl.RG;
                break;
            case Constants.TEXTUREFORMAT_RGB:
                internalFormat = this._gl.RGB;
                break;
            case Constants.TEXTUREFORMAT_RGBA:
                internalFormat = this._gl.RGBA;
                break;
        }

        if (this._webGLVersion > 1) {
            switch (format) {
                case Constants.TEXTUREFORMAT_RED_INTEGER:
                    internalFormat = this._gl.RED_INTEGER;
                    break;
                case Constants.TEXTUREFORMAT_RG_INTEGER:
                    internalFormat = this._gl.RG_INTEGER;
                    break;
                case Constants.TEXTUREFORMAT_RGB_INTEGER:
                    internalFormat = this._gl.RGB_INTEGER;
                    break;
                case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                    internalFormat = this._gl.RGBA_INTEGER;
                    break;
            }
        }

        return internalFormat;
    }

    /** @hidden */
    public _getRGBABufferInternalSizedFormat(type: number, format?: number): number {
        if (this._webGLVersion === 1) {
            if (format !== undefined) {
                switch (format) {
                    case Constants.TEXTUREFORMAT_ALPHA:
                        return this._gl.ALPHA;
                    case Constants.TEXTUREFORMAT_LUMINANCE:
                        return this._gl.LUMINANCE;
                    case Constants.TEXTUREFORMAT_LUMINANCE_ALPHA:
                        return this._gl.LUMINANCE_ALPHA;
                    case Constants.TEXTUREFORMAT_RGB:
                        return this._gl.RGB;
                }
            }
            return this._gl.RGBA;
        }

        switch (type) {
            case Constants.TEXTURETYPE_BYTE:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return this._gl.R8_SNORM;
                    case Constants.TEXTUREFORMAT_RG:
                        return this._gl.RG8_SNORM;
                    case Constants.TEXTUREFORMAT_RGB:
                        return this._gl.RGB8_SNORM;
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return this._gl.R8I;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return this._gl.RG8I;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        return this._gl.RGB8I;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return this._gl.RGBA8I;
                    default:
                        return this._gl.RGBA8_SNORM;
                }
            case Constants.TEXTURETYPE_UNSIGNED_BYTE:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return this._gl.R8;
                    case Constants.TEXTUREFORMAT_RG:
                        return this._gl.RG8;
                    case Constants.TEXTUREFORMAT_RGB:
                        return this._gl.RGB8; // By default. Other possibilities are RGB565, SRGB8.
                    case Constants.TEXTUREFORMAT_RGBA:
                        return this._gl.RGBA8; // By default. Other possibilities are RGB5_A1, RGBA4, SRGB8_ALPHA8.
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return this._gl.R8UI;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return this._gl.RG8UI;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        return this._gl.RGB8UI;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return this._gl.RGBA8UI;
                    case Constants.TEXTUREFORMAT_ALPHA:
                        return this._gl.ALPHA;
                    case Constants.TEXTUREFORMAT_LUMINANCE:
                        return this._gl.LUMINANCE;
                    case Constants.TEXTUREFORMAT_LUMINANCE_ALPHA:
                        return this._gl.LUMINANCE_ALPHA;
                    default:
                        return this._gl.RGBA8;
                }
            case Constants.TEXTURETYPE_SHORT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return this._gl.R16I;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return this._gl.RG16I;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        return this._gl.RGB16I;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return this._gl.RGBA16I;
                    default:
                        return this._gl.RGBA16I;
                }
            case Constants.TEXTURETYPE_UNSIGNED_SHORT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return this._gl.R16UI;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return this._gl.RG16UI;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        return this._gl.RGB16UI;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return this._gl.RGBA16UI;
                    default:
                        return this._gl.RGBA16UI;
                }
            case Constants.TEXTURETYPE_INT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return this._gl.R32I;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return this._gl.RG32I;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        return this._gl.RGB32I;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return this._gl.RGBA32I;
                    default:
                        return this._gl.RGBA32I;
                }
            case Constants.TEXTURETYPE_UNSIGNED_INTEGER: // Refers to UNSIGNED_INT
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED_INTEGER:
                        return this._gl.R32UI;
                    case Constants.TEXTUREFORMAT_RG_INTEGER:
                        return this._gl.RG32UI;
                    case Constants.TEXTUREFORMAT_RGB_INTEGER:
                        return this._gl.RGB32UI;
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return this._gl.RGBA32UI;
                    default:
                        return this._gl.RGBA32UI;
                }
            case Constants.TEXTURETYPE_FLOAT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return this._gl.R32F; // By default. Other possibility is R16F.
                    case Constants.TEXTUREFORMAT_RG:
                        return this._gl.RG32F; // By default. Other possibility is RG16F.
                    case Constants.TEXTUREFORMAT_RGB:
                        return this._gl.RGB32F; // By default. Other possibilities are RGB16F, R11F_G11F_B10F, RGB9_E5.
                    case Constants.TEXTUREFORMAT_RGBA:
                        return this._gl.RGBA32F; // By default. Other possibility is RGBA16F.
                    default:
                        return this._gl.RGBA32F;
                }
            case Constants.TEXTURETYPE_HALF_FLOAT:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RED:
                        return this._gl.R16F;
                    case Constants.TEXTUREFORMAT_RG:
                        return this._gl.RG16F;
                    case Constants.TEXTUREFORMAT_RGB:
                        return this._gl.RGB16F; // By default. Other possibilities are R11F_G11F_B10F, RGB9_E5.
                    case Constants.TEXTUREFORMAT_RGBA:
                        return this._gl.RGBA16F;
                    default:
                        return this._gl.RGBA16F;
                }
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
                return this._gl.RGB565;
            case Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV:
                return this._gl.R11F_G11F_B10F;
            case Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV:
                return this._gl.RGB9_E5;
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
                return this._gl.RGBA4;
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
                return this._gl.RGB5_A1;
            case Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV:
                switch (format) {
                    case Constants.TEXTUREFORMAT_RGBA:
                        return this._gl.RGB10_A2; // By default. Other possibility is RGB5_A1.
                    case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                        return this._gl.RGB10_A2UI;
                    default:
                        return this._gl.RGB10_A2;
                }
        }

        return this._gl.RGBA8;
    }

    /** @hidden */
    public _getRGBAMultiSampleBufferFormat(type: number): number {
        if (type === Constants.TEXTURETYPE_FLOAT) {
            return this._gl.RGBA32F;
        }
        else if (type === Constants.TEXTURETYPE_HALF_FLOAT) {
            return this._gl.RGBA16F;
        }

        return this._gl.RGBA8;
    }

    /** @hidden */
    public _loadFile(url: string, onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void, onProgress?: (data: any) => void,
        offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean, onError?: (request?: IWebRequest, exception?: any) => void): IFileRequest {
        let request = ThinEngine._FileToolsLoadFile(url, onSuccess, onProgress, offlineProvider, useArrayBuffer, onError);
        this._activeRequests.push(request);
        request.onCompleteObservable.add((request) => {
            this._activeRequests.splice(this._activeRequests.indexOf(request), 1);
        });
        return request;
    }

    /**
     * Loads a file from a url
     * @param url url to load
     * @param onSuccess callback called when the file successfully loads
     * @param onProgress callback called while file is loading (if the server supports this mode)
     * @param offlineProvider defines the offline provider for caching
     * @param useArrayBuffer defines a boolean indicating that date must be returned as ArrayBuffer
     * @param onError callback called when the file fails to load
     * @returns a file request object
     * @hidden
     */
    public static _FileToolsLoadFile(url: string, onSuccess: (data: string | ArrayBuffer, responseURL?: string) => void, onProgress?: (ev: ProgressEvent) => void, offlineProvider?: IOfflineProvider, useArrayBuffer?: boolean, onError?: (request?: WebRequest, exception?: LoadFileError) => void): IFileRequest {
        throw  _DevTools.WarnImport("FileTools");
    }

    /**
     * Reads pixels from the current frame buffer. Please note that this function can be slow
     * @param x defines the x coordinate of the rectangle where pixels must be read
     * @param y defines the y coordinate of the rectangle where pixels must be read
     * @param width defines the width of the rectangle where pixels must be read
     * @param height defines the height of the rectangle where pixels must be read
     * @param hasAlpha defines whether the output should have alpha or not (defaults to true)
     * @returns a Uint8Array containing RGBA colors
     */
    public readPixels(x: number, y: number, width: number, height: number, hasAlpha = true): Uint8Array {
        const numChannels = hasAlpha ? 4 : 3;
        const format = hasAlpha ? this._gl.RGBA : this._gl.RGB;
        const data = new Uint8Array(height * width * numChannels);
        this._gl.readPixels(x, y, width, height, format, this._gl.UNSIGNED_BYTE, data);
        return data;
    }

    // Statics

    private static _isSupported: Nullable<boolean> = null;
    /**
     * Gets a boolean indicating if the engine can be instanciated (ie. if a webGL context can be found)
     * @returns true if the engine can be created
     * @ignorenaming
     */
    public static isSupported(): boolean {
        if (this._isSupported === null) {
            try {
                var tempcanvas = CanvasGenerator.CreateCanvas(1, 1);
                var gl = tempcanvas.getContext("webgl") || (tempcanvas as any).getContext("experimental-webgl");

                this._isSupported = gl != null && !!window.WebGLRenderingContext;
            } catch (e) {
                this._isSupported = false;
            }
        }

        return this._isSupported;
    }

    /**
     * Find the next highest power of two.
     * @param x Number to start search from.
     * @return Next highest power of two.
     */
    public static CeilingPOT(x: number): number {
        x--;
        x |= x >> 1;
        x |= x >> 2;
        x |= x >> 4;
        x |= x >> 8;
        x |= x >> 16;
        x++;
        return x;
    }

    /**
     * Find the next lowest power of two.
     * @param x Number to start search from.
     * @return Next lowest power of two.
     */
    public static FloorPOT(x: number): number {
        x = x | (x >> 1);
        x = x | (x >> 2);
        x = x | (x >> 4);
        x = x | (x >> 8);
        x = x | (x >> 16);
        return x - (x >> 1);
    }

    /**
     * Find the nearest power of two.
     * @param x Number to start search from.
     * @return Next nearest power of two.
     */
    public static NearestPOT(x: number): number {
        var c = ThinEngine.CeilingPOT(x);
        var f = ThinEngine.FloorPOT(x);
        return (c - x) > (x - f) ? f : c;
    }

    /**
     * Get the closest exponent of two
     * @param value defines the value to approximate
     * @param max defines the maximum value to return
     * @param mode defines how to define the closest value
     * @returns closest exponent of two of the given value
     */
    public static GetExponentOfTwo(value: number, max: number, mode = Constants.SCALEMODE_NEAREST): number {
        let pot;

        switch (mode) {
            case Constants.SCALEMODE_FLOOR:
                pot = ThinEngine.FloorPOT(value);
                break;
            case Constants.SCALEMODE_NEAREST:
                pot = ThinEngine.NearestPOT(value);
                break;
            case Constants.SCALEMODE_CEILING:
            default:
                pot = ThinEngine.CeilingPOT(value);
                break;
        }

        return Math.min(pot, max);
    }

    /**
     * Queue a new function into the requested animation frame pool (ie. this function will be executed byt the browser for the next frame)
     * @param func - the function to be called
     * @param requester - the object that will request the next frame. Falls back to window.
     * @returns frame number
     */
    public static QueueNewFrame(func: () => void, requester?: any): number {
        if (!DomManagement.IsWindowObjectExist()) {
            if (typeof requestAnimationFrame !== "undefined") {
                return requestAnimationFrame(func);
            }

            return setTimeout(func, 16);
        }

        if (!requester) {
            requester = window;
        }

        if (requester.requestPostAnimationFrame) {
            return requester.requestPostAnimationFrame(func);
        }
        else if (requester.requestAnimationFrame) {
            return requester.requestAnimationFrame(func);
        }
        else if (requester.msRequestAnimationFrame) {
            return requester.msRequestAnimationFrame(func);
        }
        else if (requester.webkitRequestAnimationFrame) {
            return requester.webkitRequestAnimationFrame(func);
        }
        else if (requester.mozRequestAnimationFrame) {
            return requester.mozRequestAnimationFrame(func);
        }
        else if (requester.oRequestAnimationFrame) {
            return requester.oRequestAnimationFrame(func);
        }
        else {
            return window.setTimeout(func, 16);
        }
    }

    /**
     * Gets host document
     * @returns the host document object
     */
    public getHostDocument(): Nullable<Document> {
        if (this._renderingCanvas && this._renderingCanvas.ownerDocument) {
            return this._renderingCanvas.ownerDocument;
        }

        return document;
    }
}
