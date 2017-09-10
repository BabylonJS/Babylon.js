﻿module BABYLON {
    var compileShader = (gl: WebGLRenderingContext, source: string, type: string, defines: string, shaderVersion: string): WebGLShader => {
        var shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);

        gl.shaderSource(shader, shaderVersion + (defines ? defines + "\n" : "") + source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
    };

    var getSamplingParameters = (samplingMode: number, generateMipMaps: boolean, gl: WebGLRenderingContext): { min: number; mag: number } => {
        var magFilter = gl.NEAREST;
        var minFilter = gl.NEAREST;

        switch (samplingMode) {
            case Texture.BILINEAR_SAMPLINGMODE:
                magFilter = gl.LINEAR;
                if (generateMipMaps) {
                    minFilter = gl.LINEAR_MIPMAP_NEAREST;
                } else {
                    minFilter = gl.LINEAR;
                }
                break;
            case Texture.TRILINEAR_SAMPLINGMODE:
                magFilter = gl.LINEAR;
                if (generateMipMaps) {
                    minFilter = gl.LINEAR_MIPMAP_LINEAR;
                } else {
                    minFilter = gl.LINEAR;
                }
                break;
            case Texture.NEAREST_SAMPLINGMODE:
                magFilter = gl.NEAREST;
                if (generateMipMaps) {
                    minFilter = gl.NEAREST_MIPMAP_LINEAR;
                } else {
                    minFilter = gl.NEAREST;
                }
                break;
            case Texture.NEAREST_NEAREST_MIPNEAREST:
                magFilter = gl.NEAREST;
                if (generateMipMaps) {
                    minFilter = gl.NEAREST_MIPMAP_NEAREST;
                } else {
                    minFilter = gl.NEAREST;
                }
                break;
            case Texture.NEAREST_LINEAR_MIPNEAREST:
                magFilter = gl.NEAREST;
                if (generateMipMaps) {
                    minFilter = gl.LINEAR_MIPMAP_NEAREST;
                } else {
                    minFilter = gl.LINEAR;
                }
                break;
            case Texture.NEAREST_LINEAR_MIPLINEAR:
                magFilter = gl.NEAREST;
                if (generateMipMaps) {
                    minFilter = gl.LINEAR_MIPMAP_LINEAR;
                } else {
                    minFilter = gl.LINEAR;
                }
                break;
            case Texture.NEAREST_LINEAR:
                magFilter = gl.NEAREST;
                minFilter = gl.LINEAR;
                break;
            case Texture.NEAREST_NEAREST:
                magFilter = gl.NEAREST;
                minFilter = gl.NEAREST;
                break;
            case Texture.LINEAR_NEAREST_MIPNEAREST:
                magFilter = gl.LINEAR;
                if (generateMipMaps) {
                    minFilter = gl.NEAREST_MIPMAP_NEAREST;
                } else {
                    minFilter = gl.NEAREST;
                }
                break;
            case Texture.LINEAR_NEAREST_MIPLINEAR:
                magFilter = gl.LINEAR;
                if (generateMipMaps) {
                    minFilter = gl.NEAREST_MIPMAP_LINEAR;
                } else {
                    minFilter = gl.NEAREST;
                }
                break;
            case Texture.LINEAR_LINEAR:
                magFilter = gl.LINEAR;
                minFilter = gl.LINEAR;
                break;
            case Texture.LINEAR_NEAREST:
                magFilter = gl.LINEAR;
                minFilter = gl.NEAREST;
                break;
        }

        return {
            min: minFilter,
            mag: magFilter
        }
    }

    var partialLoad = (url: string, index: number, loadedImages: any, scene,
        onfinish: (images: HTMLImageElement[]) => void, onErrorCallBack: () => void = null) => {

        var img: HTMLImageElement;

        var onload = () => {
            loadedImages[index] = img;
            loadedImages._internalCount++;

            if (scene) {
                scene._removePendingData(img);
            }

            if (loadedImages._internalCount === 6) {
                onfinish(loadedImages);
            }
        };

        var onerror = () => {
            if (scene) {
                scene._removePendingData(img);
            }

            if (onErrorCallBack) {
                onErrorCallBack();
            }
        };

        img = Tools.LoadImage(url, onload, onerror, scene ? scene.database : null);
        if (scene) {
            scene._addPendingData(img);
        }
    }

    var cascadeLoad = (rootUrl: string, scene,
        onfinish: (images: HTMLImageElement[]) => void, files: string[], onError: () => void = null) => {

        var loadedImages: any = [];
        loadedImages._internalCount = 0;

        for (var index = 0; index < 6; index++) {
            partialLoad(files[index], index, loadedImages, scene, onfinish, onError);
        }
    };

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

    export class InstancingAttributeInfo {
        /**
         * Index/offset of the attribute in the vertex shader
         */
        index: number;

        /**
         * size of the attribute, 1, 2, 3 or 4
         */
        attributeSize: number;

        /**
         * type of the attribute, gl.BYTE, gl.UNSIGNED_BYTE, gl.SHORT, gl.UNSIGNED_SHORT, gl.FIXED, gl.FLOAT.
         * default is FLOAT
         */
        attribyteType: number;

        /**
         * normalization of fixed-point data. behavior unclear, use FALSE, default is FALSE
         */
        normalized: boolean;

        /**
         * Offset of the data in the Vertex Buffer acting as the instancing buffer
         */
        offset: number;

        /**
         * Name of the GLSL attribute, for debugging purpose only
         */
        attributeName: string;
    }

    /**
     * Define options used to create a render target texture
     */
    export class RenderTargetCreationOptions {
        generateMipMaps?: boolean;
        generateDepthBuffer?: boolean;
        generateStencilBuffer?: boolean;
        type?: number;
        samplingMode?: number;
    }

    /**
     * Regroup several parameters relative to the browser in use
     */
    export class EngineCapabilities {
        /** The maximum textures image */
        public maxTexturesImageUnits: number;
        public maxVertexTextureImageUnits: number;
        /** The maximum texture size */
        public maxTextureSize: number;
        public maxCubemapTextureSize: number;
        public maxRenderTextureSize: number;
        public maxVertexAttribs: number;
        public maxVaryingVectors: number;
        public maxVertexUniformVectors: number;
        public maxFragmentUniformVectors: number;
        public standardDerivatives: boolean;
        public s3tc: WEBGL_compressed_texture_s3tc;
        public pvrtc: any; //WEBGL_compressed_texture_pvrtc;
        public etc1: any; //WEBGL_compressed_texture_etc1;
        public etc2: any; //WEBGL_compressed_texture_etc;
        public astc: any; //WEBGL_compressed_texture_astc;
        public textureFloat: boolean;
        public vertexArrayObject: boolean;
        public textureAnisotropicFilterExtension: EXT_texture_filter_anisotropic;
        public maxAnisotropy: number;
        public instancedArrays: boolean;
        public uintIndices: boolean;
        public highPrecisionShaderSupported: boolean;
        public fragmentDepthSupported: boolean;
        public textureFloatLinearFiltering: boolean;
        public textureFloatRender: boolean;
        public textureHalfFloat: boolean;
        public textureHalfFloatLinearFiltering: boolean;
        public textureHalfFloatRender: boolean;
        public textureLOD: boolean;
        public drawBuffersExtension: boolean;
        public depthTextureExtension: boolean;
        public colorBufferFloat: boolean;
    }

    export interface EngineOptions extends WebGLContextAttributes {
        limitDeviceRatio?: number;
        autoEnableWebVR?: boolean;
        disableWebGL2Support?: boolean;
        audioEngine?: boolean;
        deterministicLockstep?: boolean;
        lockstepMaxSteps?: number;
        doNotHandleContextLost?: boolean;
    }

    /**
     * The engine class is responsible for interfacing with all lower-level APIs such as WebGL and Audio.
     */
    export class Engine {
        public static Instances = new Array<Engine>();

        public static get LastCreatedEngine(): Engine {
            if (Engine.Instances.length === 0) {
                return null;
            }

            return Engine.Instances[Engine.Instances.length - 1];
        }

        public static get LastCreatedScene(): Scene {
            var lastCreatedEngine = Engine.LastCreatedEngine;
            if (!lastCreatedEngine) {
                return null;
            }

            if (lastCreatedEngine.scenes.length === 0) {
                return null;
            }

            return lastCreatedEngine.scenes[lastCreatedEngine.scenes.length - 1];
        }

        /**
         * Will flag all materials in all scenes in all engines as dirty to trigger new shader compilation
         */
        public static MarkAllMaterialsAsDirty(flag: number, predicate?: (mat: Material) => boolean): void {
            for (var engineIndex = 0; engineIndex < Engine.Instances.length; engineIndex++) {
                var engine = Engine.Instances[engineIndex];

                for (var sceneIndex = 0; sceneIndex < engine.scenes.length; sceneIndex++) {
                    engine.scenes[sceneIndex].markAllMaterialsAsDirty(flag, predicate);
                }
            }
        }

        // Const statics
        private static _ALPHA_DISABLE = 0;
        private static _ALPHA_ADD = 1;
        private static _ALPHA_COMBINE = 2;
        private static _ALPHA_SUBTRACT = 3;
        private static _ALPHA_MULTIPLY = 4;
        private static _ALPHA_MAXIMIZED = 5;
        private static _ALPHA_ONEONE = 6;
        private static _ALPHA_PREMULTIPLIED = 7;
        private static _ALPHA_PREMULTIPLIED_PORTERDUFF = 8;
        private static _ALPHA_INTERPOLATE = 9;
        private static _ALPHA_SCREENMODE = 10;

        private static _DELAYLOADSTATE_NONE = 0;
        private static _DELAYLOADSTATE_LOADED = 1;
        private static _DELAYLOADSTATE_LOADING = 2;
        private static _DELAYLOADSTATE_NOTLOADED = 4;

        private static _TEXTUREFORMAT_ALPHA = 0;
        private static _TEXTUREFORMAT_LUMINANCE = 1;
        private static _TEXTUREFORMAT_LUMINANCE_ALPHA = 2;
        private static _TEXTUREFORMAT_RGB = 4;
        private static _TEXTUREFORMAT_RGBA = 5;

        private static _TEXTURETYPE_UNSIGNED_INT = 0;
        private static _TEXTURETYPE_FLOAT = 1;
        private static _TEXTURETYPE_HALF_FLOAT = 2;

        // Depht or Stencil test Constants.
        private static _NEVER = 0x0200; //	Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn.
        private static _ALWAYS = 0x0207; //	Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn.
        private static _LESS = 0x0201; //	Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value.
        private static _EQUAL = 0x0202; //	Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value.
        private static _LEQUAL = 0x0203; //	Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value.
        private static _GREATER = 0x0204; //	Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value.
        private static _GEQUAL = 0x0206; //	Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value.
        private static _NOTEQUAL = 0x0205; //  Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value.

        public static get NEVER(): number {
            return Engine._NEVER;
        }

        public static get ALWAYS(): number {
            return Engine._ALWAYS;
        }

        public static get LESS(): number {
            return Engine._LESS;
        }

        public static get EQUAL(): number {
            return Engine._EQUAL;
        }

        public static get LEQUAL(): number {
            return Engine._LEQUAL;
        }

        public static get GREATER(): number {
            return Engine._GREATER;
        }

        public static get GEQUAL(): number {
            return Engine._GEQUAL;
        }

        public static get NOTEQUAL(): number {
            return Engine._NOTEQUAL;
        }

        // Stencil Actions Constants.
        private static _KEEP = 0x1E00;
        private static _REPLACE = 0x1E01;
        private static _INCR = 0x1E02;
        private static _DECR = 0x1E03;
        private static _INVERT = 0x150A;
        private static _INCR_WRAP = 0x8507;
        private static _DECR_WRAP = 0x8508;

        public static get KEEP(): number {
            return Engine._KEEP;
        }

        public static get REPLACE(): number {
            return Engine._REPLACE;
        }

        public static get INCR(): number {
            return Engine._INCR;
        }

        public static get DECR(): number {
            return Engine._DECR;
        }

        public static get INVERT(): number {
            return Engine._INVERT;
        }

        public static get INCR_WRAP(): number {
            return Engine._INCR_WRAP;
        }

        public static get DECR_WRAP(): number {
            return Engine._DECR_WRAP;
        }

        public static get ALPHA_DISABLE(): number {
            return Engine._ALPHA_DISABLE;
        }

        public static get ALPHA_ONEONE(): number {
            return Engine._ALPHA_ONEONE;
        }

        public static get ALPHA_ADD(): number {
            return Engine._ALPHA_ADD;
        }

        public static get ALPHA_COMBINE(): number {
            return Engine._ALPHA_COMBINE;
        }

        public static get ALPHA_SUBTRACT(): number {
            return Engine._ALPHA_SUBTRACT;
        }

        public static get ALPHA_MULTIPLY(): number {
            return Engine._ALPHA_MULTIPLY;
        }

        public static get ALPHA_MAXIMIZED(): number {
            return Engine._ALPHA_MAXIMIZED;
        }

        public static get ALPHA_PREMULTIPLIED(): number {
            return Engine._ALPHA_PREMULTIPLIED;
        }

        public static get ALPHA_PREMULTIPLIED_PORTERDUFF(): number {
            return Engine._ALPHA_PREMULTIPLIED_PORTERDUFF;
        }

        public static get ALPHA_INTERPOLATE(): number {
            return Engine._ALPHA_INTERPOLATE;
        }

        public static get ALPHA_SCREENMODE(): number {
            return Engine._ALPHA_SCREENMODE;
        }

        public static get DELAYLOADSTATE_NONE(): number {
            return Engine._DELAYLOADSTATE_NONE;
        }

        public static get DELAYLOADSTATE_LOADED(): number {
            return Engine._DELAYLOADSTATE_LOADED;
        }

        public static get DELAYLOADSTATE_LOADING(): number {
            return Engine._DELAYLOADSTATE_LOADING;
        }

        public static get DELAYLOADSTATE_NOTLOADED(): number {
            return Engine._DELAYLOADSTATE_NOTLOADED;
        }

        public static get TEXTUREFORMAT_ALPHA(): number {
            return Engine._TEXTUREFORMAT_ALPHA;
        }

        public static get TEXTUREFORMAT_LUMINANCE(): number {
            return Engine._TEXTUREFORMAT_LUMINANCE;
        }

        public static get TEXTUREFORMAT_LUMINANCE_ALPHA(): number {
            return Engine._TEXTUREFORMAT_LUMINANCE_ALPHA;
        }

        public static get TEXTUREFORMAT_RGB(): number {
            return Engine._TEXTUREFORMAT_RGB;
        }

        public static get TEXTUREFORMAT_RGBA(): number {
            return Engine._TEXTUREFORMAT_RGBA;
        }

        public static get TEXTURETYPE_UNSIGNED_INT(): number {
            return Engine._TEXTURETYPE_UNSIGNED_INT;
        }

        public static get TEXTURETYPE_FLOAT(): number {
            return Engine._TEXTURETYPE_FLOAT;
        }

        public static get TEXTURETYPE_HALF_FLOAT(): number {
            return Engine._TEXTURETYPE_HALF_FLOAT;
        }


        // Texture rescaling mode
        private static _SCALEMODE_FLOOR = 1;
        private static _SCALEMODE_NEAREST = 2;
        private static _SCALEMODE_CEILING = 3;

        public static get SCALEMODE_FLOOR(): number {
            return Engine._SCALEMODE_FLOOR;
        }

        public static get SCALEMODE_NEAREST(): number {
            return Engine._SCALEMODE_NEAREST;
        }

        public static get SCALEMODE_CEILING(): number {
            return Engine._SCALEMODE_CEILING;
        }

        public static get Version(): string {
            return "3.1-alpha";
        }

        // Updatable statics so stick with vars here
        public static CollisionsEpsilon = 0.001;
        public static CodeRepository = "src/";
        public static ShadersRepository = "src/Shaders/";

        // Public members
        public forcePOTTextures = false;
        public isFullscreen = false;
        public isPointerLock = false;
        public cullBackFaces = true;
        public renderEvenInBackground = true;
        public preventCacheWipeBetweenFrames = false;
        // To enable/disable IDB support and avoid XHR on .manifest
        public enableOfflineSupport = false;
        public scenes = new Array<Scene>();
        public postProcesses = new Array<PostProcess>();

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
        public onCanvasPointerOutObservable = new Observable<Engine>();

        //WebVR

        //The new WebVR uses promises.
        //this promise resolves with the current devices available.
        public vrDisplaysPromise;

        private _vrDisplays;
        private _vrDisplayEnabled;
        private _oldSize: BABYLON.Size;
        private _oldHardwareScaleFactor: number;

        // Uniform buffers list
        public disableUniformBuffers = false;
        public _uniformBuffers = new Array<UniformBuffer>();
        public get supportsUniformBuffers(): boolean {
            return this.webGLVersion > 1 && !this.disableUniformBuffers;
        }

        // Private Members
        private _gl: WebGLRenderingContext;
        private _renderingCanvas: HTMLCanvasElement;
        private _windowIsBackground = false;
        private _webGLVersion = 1.0;

        public get needPOTTextures(): boolean {
            return this._webGLVersion < 2 || this.forcePOTTextures;
        }

        private _badOS = false;
        public get badOS(): boolean {
            return this._badOS;
        }

        private _badDesktopOS = false;
        public get badDesktopOS(): boolean {
            return this._badDesktopOS;
        }

        public static audioEngine: AudioEngine;

        
        // Focus
        private _onFocus: () => void;
        private _onBlur: () => void;       
        private _onCanvasPointerOut: () => void;
        private _onCanvasBlur: () => void;
        private _onCanvasFocus: () => void;
        
        private _onFullscreenChange: () => void;
        private _onPointerLockChange: () => void;

        private _onVRDisplayPointerRestricted: () => void;
        private _onVRDisplayPointerUnrestricted: () => void;

        private _hardwareScalingLevel: number;
        private _caps: EngineCapabilities;
        private _pointerLockRequested: boolean;
        private _alphaTest: boolean;
        private _isStencilEnable: boolean;
        private _colorWrite = true;

        private _loadingScreen: ILoadingScreen;

        public _drawCalls = new PerfCounter();

        private _glVersion: string;
        private _glRenderer: string;
        private _glVendor: string;

        private _videoTextureSupported: boolean;

        private _renderingQueueLaunched = false;
        private _activeRenderLoops = [];

        // Deterministic lockstepMaxSteps
        private _deterministicLockstep: boolean = false;
        private _lockstepMaxSteps: number = 4;

        // Lost context
        public onContextLostObservable = new Observable<Engine>();
        public onContextRestoredObservable = new Observable<Engine>();
        private _onContextLost: (evt: Event) => void;
        private _onContextRestored: (evt: Event) => void;
        private _contextWasLost = false;
        private _doNotHandleContextLost = false;

        // FPS
        private _performanceMonitor = new PerformanceMonitor();
        private _fps = 60;
        private _deltaTime = 0;
        /**
         * Turn this value on if you want to pause FPS computation when in background
         */
        public disablePerformanceMonitorInBackground = false;

        public get performanceMonitor(): PerformanceMonitor {
            return this._performanceMonitor;
        }

        // States
        private _depthCullingState = new Internals._DepthCullingState();
        private _stencilState = new Internals._StencilState();
        private _alphaState = new Internals._AlphaState();
        private _alphaMode = Engine.ALPHA_DISABLE;

        // Cache
        private _internalTexturesCache = new Array<InternalTexture>();
        private _maxTextureChannels = 16;
        private _activeTexture: number;
        private _activeTexturesCache: { [key: string]: WebGLTexture } = {};
        private _currentEffect: Effect;
        private _currentProgram: WebGLProgram;
        private _compiledEffects = {};
        private _vertexAttribArraysEnabled: boolean[] = [];
        private _cachedViewport: Viewport;
        private _cachedVertexArrayObject: WebGLVertexArrayObject;
        private _cachedVertexBuffers: any;
        private _cachedIndexBuffer: WebGLBuffer;
        private _cachedEffectForVertexBuffers: Effect;
        private _currentRenderTarget: InternalTexture;
        private _uintIndicesCurrentlySet = false;
        private _currentBoundBuffer = new Array<WebGLBuffer>();
        private _currentFramebuffer: WebGLFramebuffer;
        private _currentBufferPointers = new Array<BufferPointer>();
        private _currentInstanceLocations = new Array<number>();
        private _currentInstanceBuffers = new Array<WebGLBuffer>();
        private _textureUnits: Int32Array;

        private _workingCanvas: HTMLCanvasElement;
        private _workingContext: CanvasRenderingContext2D;
        private _rescalePostProcess: PassPostProcess;

        private _dummyFramebuffer: WebGLFramebuffer;

        private _externalData: StringDictionary<Object>;
        private _bindedRenderFunction: any;

        private _vaoRecordInProgress = false;
        private _mustWipeVertexAttributes = false;

        private _emptyTexture: InternalTexture;
        private _emptyCubeTexture: InternalTexture;

        private _frameHandler: number;

        // Hardware supported Compressed Textures
        private _texturesSupported = new Array<string>();
        private _textureFormatInUse: string;

        public get texturesSupported(): Array<string> {
            return this._texturesSupported;
        }

        public get textureFormatInUse(): string {
            return this._textureFormatInUse;
        }

        public get currentViewport(): Viewport {
            return this._cachedViewport;
        }

        // Empty texture
        public get emptyTexture(): InternalTexture {
            if (!this._emptyTexture) {
                this._emptyTexture = this.createRawTexture(new Uint8Array(4), 1, 1, BABYLON.Engine.TEXTUREFORMAT_RGBA, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
            }

            return this._emptyTexture;
        }
        public get emptyCubeTexture(): InternalTexture {
            if (!this._emptyCubeTexture) {
                var faceData = new Uint8Array(4);
                var cubeData = [faceData, faceData, faceData, faceData, faceData, faceData];
                this._emptyCubeTexture = this.createRawCubeTexture(cubeData, 1, BABYLON.Engine.TEXTUREFORMAT_RGBA, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
            }

            return this._emptyCubeTexture;
        }

        /**
         * @constructor
         * @param {HTMLCanvasElement | WebGLRenderingContext} canvasOrContext - the canvas or the webgl context to be used for rendering
         * @param {boolean} [antialias] - enable antialias
         * @param options - further options to be sent to the getContext function
         */
        constructor(canvasOrContext: HTMLCanvasElement | WebGLRenderingContext, antialias?: boolean, options?: EngineOptions, adaptToDeviceRatio = false) {
            var canvas: HTMLCanvasElement;
            Engine.Instances.push(this);
            options = options || {};

            if ((<HTMLCanvasElement>canvasOrContext).getContext) {
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

                if (options.preserveDrawingBuffer === undefined) {
                    options.preserveDrawingBuffer = false;
                }

                if (options.audioEngine === undefined) {
                    options.audioEngine = true;
                }

                if (options.stencil === undefined) {
                    options.stencil = true;
                }

                this._deterministicLockstep = options.deterministicLockstep;
                this._lockstepMaxSteps = options.lockstepMaxSteps;
                this._doNotHandleContextLost = options.doNotHandleContextLost;

                // GL
                if (!options.disableWebGL2Support) {
                    try {
                        this._gl = <any>(canvas.getContext("webgl2", options) || canvas.getContext("experimental-webgl2", options));
                        if (this._gl) {
                            this._webGLVersion = 2.0;
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
    
                this._onCanvasFocus = () => {
                    this.onCanvasFocusObservable.notifyObservers(this);
                }
    
                this._onCanvasBlur = () => {
                    this.onCanvasBlurObservable.notifyObservers(this);
                }
    
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

                this._onCanvasPointerOut = () => {
                    this.onCanvasPointerOutObservable.notifyObservers(this);
                };

                window.addEventListener("blur", this._onBlur);
                window.addEventListener("focus", this._onFocus);

                canvas.addEventListener("pointerout", this._onCanvasPointerOut);

                // Context lost
                if (!this._doNotHandleContextLost) {
                    this._onContextLost = (evt: Event) => {
                        evt.preventDefault();
                        this._contextWasLost = true;
                        Tools.Warn("WebGL context lost.");

                        this.onContextLostObservable.notifyObservers(this);
                    };

                    this._onContextRestored = (evt: Event) => {
                        // Adding a timeout to avoid race condition at browser level
                        setTimeout(()=> {
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

                            Tools.Warn("WebGL context successfully restored.");

                            this.onContextRestoredObservable.notifyObservers(this);

                            this._contextWasLost = false;
                        }, 0);
                    };

                    canvas.addEventListener("webglcontextlost", this._onContextLost, false);
                    canvas.addEventListener("webglcontextrestored", this._onContextRestored, false);
                }                
            } else {
                this._gl = <WebGLRenderingContext>canvasOrContext;
                this._renderingCanvas = this._gl.canvas

                if (this._gl.renderbufferStorageMultisample) {
                    this._webGLVersion = 2.0;
                }

                options.stencil = this._gl.getContextAttributes().stencil;
            }

            // Viewport
            var limitDeviceRatio = options.limitDeviceRatio || window.devicePixelRatio || 1.0;
            this._hardwareScalingLevel = adaptToDeviceRatio ? 1.0 / Math.min(limitDeviceRatio, window.devicePixelRatio || 1.0) : 1.0;
            this.resize();

            this._isStencilEnable = options.stencil;
            this._initGLContext();

            if (canvas) {
                // Fullscreen
                this._onFullscreenChange = () => {
                    if (document.fullscreen !== undefined) {
                        this.isFullscreen = document.fullscreen;
                    } else if (document.mozFullScreen !== undefined) {
                        this.isFullscreen = document.mozFullScreen;
                    } else if (document.webkitIsFullScreen !== undefined) {
                        this.isFullscreen = document.webkitIsFullScreen;
                    } else if (document.msIsFullScreen !== undefined) {
                        this.isFullscreen = document.msIsFullScreen;
                    }

                    // Pointer lock
                    if (this.isFullscreen && this._pointerLockRequested) {
                        canvas.requestPointerLock = canvas.requestPointerLock ||
                            canvas.msRequestPointerLock ||
                            canvas.mozRequestPointerLock ||
                            canvas.webkitRequestPointerLock;

                        if (canvas.requestPointerLock) {
                            canvas.requestPointerLock();
                        }
                    }
                };

                document.addEventListener("fullscreenchange", this._onFullscreenChange, false);
                document.addEventListener("mozfullscreenchange", this._onFullscreenChange, false);
                document.addEventListener("webkitfullscreenchange", this._onFullscreenChange, false);
                document.addEventListener("msfullscreenchange", this._onFullscreenChange, false);

                // Pointer lock
                this._onPointerLockChange = () => {
                    this.isPointerLock = (document.mozPointerLockElement === canvas ||
                        document.webkitPointerLockElement === canvas ||
                        document.msPointerLockElement === canvas ||
                        document.pointerLockElement === canvas
                    );
                };

                document.addEventListener("pointerlockchange", this._onPointerLockChange, false);
                document.addEventListener("mspointerlockchange", this._onPointerLockChange, false);
                document.addEventListener("mozpointerlockchange", this._onPointerLockChange, false);
                document.addEventListener("webkitpointerlockchange", this._onPointerLockChange, false);

                this._onVRDisplayPointerRestricted = () => {
                    canvas.requestPointerLock();
                }

                this._onVRDisplayPointerUnrestricted = () => {
                    document.exitPointerLock();
                }

                window.addEventListener('vrdisplaypointerrestricted', this._onVRDisplayPointerRestricted, false);
                window.addEventListener('vrdisplaypointerunrestricted', this._onVRDisplayPointerUnrestricted, false);
            }

            if (options.audioEngine && AudioEngine && !Engine.audioEngine) {
                Engine.audioEngine = new AudioEngine();
            }

            // Prepare buffer pointers
            for (var i = 0; i < this._caps.maxVertexAttribs; i++) {
                this._currentBufferPointers[i] = new BufferPointer();
            }

            // Load WebVR Devices
            if (options.autoEnableWebVR) {
                this.initWebVR();
            }

            // Detect if we are running on a faulty buggy OS.
            this._badOS = /iPad/i.test(navigator.userAgent) || /iPhone/i.test(navigator.userAgent);

            // Detect if we are running on a faulty buggy desktop OS.
            this._badDesktopOS = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

            Tools.Log("Babylon.js engine (v" + Engine.Version + ") launched");

            this.enableOfflineSupport = (BABYLON.Database !== undefined);
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

        private _rebuildBuffers(): void {
            // Index / Vertex
            for (var scene of this.scenes) {
                scene.resetCachedMaterial();
                scene._rebuildGeometries();
                scene._rebuildTextures();
            }

            // Uniforms
            for (var uniformBuffer of this._uniformBuffers) {
                uniformBuffer._rebuild();
            }
        }

        private _initGLContext(): void {
            // Caps
            this._caps = new EngineCapabilities();
            this._caps.maxTexturesImageUnits = this._gl.getParameter(this._gl.MAX_TEXTURE_IMAGE_UNITS);
            this._caps.maxVertexTextureImageUnits = this._gl.getParameter(this._gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
            this._caps.maxTextureSize = this._gl.getParameter(this._gl.MAX_TEXTURE_SIZE);
            this._caps.maxCubemapTextureSize = this._gl.getParameter(this._gl.MAX_CUBE_MAP_TEXTURE_SIZE);
            this._caps.maxRenderTextureSize = this._gl.getParameter(this._gl.MAX_RENDERBUFFER_SIZE);
            this._caps.maxVertexAttribs = this._gl.getParameter(this._gl.MAX_VERTEX_ATTRIBS);
            this._caps.maxVaryingVectors = this._gl.getParameter(this._gl.MAX_VARYING_VECTORS);
            this._caps.maxFragmentUniformVectors = this._gl.getParameter(this._gl.MAX_FRAGMENT_UNIFORM_VECTORS);
            this._caps.maxVertexUniformVectors = this._gl.getParameter(this._gl.MAX_VERTEX_UNIFORM_VECTORS);

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
            this._gl.HALF_FLOAT_OES = 0x8D61; // Half floating-point type (16-bit).
            this._gl.RGBA16F = 0x881A; // RGBA 16-bit floating-point color-renderable internal sized format.
            this._gl.RGBA32F = 0x8814; // RGBA 32-bit floating-point color-renderable internal sized format.
            this._gl.DEPTH24_STENCIL8 = 35056;

            // Extensions
            this._caps.standardDerivatives = this._webGLVersion > 1 || (this._gl.getExtension('OES_standard_derivatives') !== null);

            this._caps.astc = this._gl.getExtension('WEBGL_compressed_texture_astc') || this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_astc');
            this._caps.s3tc = this._gl.getExtension('WEBGL_compressed_texture_s3tc') || this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc');
            this._caps.pvrtc = this._gl.getExtension('WEBGL_compressed_texture_pvrtc') || this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc');
            this._caps.etc1 = this._gl.getExtension('WEBGL_compressed_texture_etc1') || this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_etc1');
            this._caps.etc2 = this._gl.getExtension('WEBGL_compressed_texture_etc') || this._gl.getExtension('WEBKIT_WEBGL_compressed_texture_etc') ||
                this._gl.getExtension('WEBGL_compressed_texture_es3_0'); // also a requirement of OpenGL ES 3

            this._caps.textureAnisotropicFilterExtension = this._gl.getExtension('EXT_texture_filter_anisotropic') || this._gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') || this._gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
            this._caps.maxAnisotropy = this._caps.textureAnisotropicFilterExtension ? this._gl.getParameter(this._caps.textureAnisotropicFilterExtension.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;
            this._caps.uintIndices = this._webGLVersion > 1 || this._gl.getExtension('OES_element_index_uint') !== null;
            this._caps.fragmentDepthSupported = this._webGLVersion > 1 || this._gl.getExtension('EXT_frag_depth') !== null;
            this._caps.highPrecisionShaderSupported = true;

            // Checks if some of the format renders first to allow the use of webgl inspector.
            this._caps.colorBufferFloat = this._webGLVersion > 1 && this._gl.getExtension('EXT_color_buffer_float');

            this._caps.textureFloat = this._webGLVersion > 1 || this._gl.getExtension('OES_texture_float');
            this._caps.textureFloatLinearFiltering = this._caps.textureFloat && this._gl.getExtension('OES_texture_float_linear');
            this._caps.textureFloatRender = this._caps.textureFloat && this._canRenderToFloatFramebuffer();

            this._caps.textureHalfFloat = this._webGLVersion > 1 || this._gl.getExtension('OES_texture_half_float');
            this._caps.textureHalfFloatLinearFiltering = this._webGLVersion > 1 || (this._caps.textureHalfFloat && this._gl.getExtension('OES_texture_half_float_linear'));
            if (this._webGLVersion > 1) {
                this._gl.HALF_FLOAT_OES = 0x140B;
            }
            this._caps.textureHalfFloatRender = this._caps.textureHalfFloat && this._canRenderToHalfFloatFramebuffer();

            this._caps.textureLOD = this._webGLVersion > 1 || this._gl.getExtension('EXT_shader_texture_lod');

            // Draw buffers
            if (this._webGLVersion > 1) {
                this._caps.drawBuffersExtension = true;
            } else {
                var drawBuffersExtension = this._gl.getExtension('WEBGL_draw_buffers');

                if (drawBuffersExtension !== null) {
                    this._caps.drawBuffersExtension = true;
                    this._gl.drawBuffers = drawBuffersExtension.drawBuffersWEBGL.bind(drawBuffersExtension);
                    this._gl.DRAW_FRAMEBUFFER = this._gl.FRAMEBUFFER;
                    
                    for (var i = 0; i < 16; i++) {
                        this._gl["COLOR_ATTACHMENT" + i + "_WEBGL"] = drawBuffersExtension["COLOR_ATTACHMENT" + i + "_WEBGL"];
                    }
                } else {
                    this._caps.drawBuffersExtension = false;
                }
            }

            // Depth Texture
            if (this._webGLVersion > 1) {
                this._caps.depthTextureExtension = true;
            } else {
                var depthTextureExtension = this._gl.getExtension('WEBGL_depth_texture');

                if (depthTextureExtension != null) {
                    this._caps.depthTextureExtension = true;
                }
            }

            // Vertex array object
            if (this._webGLVersion > 1) {
                this._caps.vertexArrayObject = true;
            } else {
                var vertexArrayObjectExtension = this._gl.getExtension('OES_vertex_array_object');

                if (vertexArrayObjectExtension != null) {
                    this._caps.vertexArrayObject = true;
                    this._gl.createVertexArray = vertexArrayObjectExtension.createVertexArrayOES.bind(vertexArrayObjectExtension);
                    this._gl.bindVertexArray = vertexArrayObjectExtension.bindVertexArrayOES.bind(vertexArrayObjectExtension);
                    this._gl.deleteVertexArray = vertexArrayObjectExtension.deleteVertexArrayOES.bind(vertexArrayObjectExtension);
                } else {
                    this._caps.vertexArrayObject = false;
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

            // Intelligently add supported compressed formats in order to check for.
            // Check for ASTC support first as it is most powerful and to be very cross platform.
            // Next PVRTC & DXT, which are probably superior to ETC1/2.
            // Likely no hardware which supports both PVR & DXT, so order matters little.
            // ETC2 is newer and handles ETC1 (no alpha capability), so check for first.
            if (this._caps.astc) this.texturesSupported.push('-astc.ktx');
            if (this._caps.s3tc) this.texturesSupported.push('-dxt.ktx');
            if (this._caps.pvrtc) this.texturesSupported.push('-pvrtc.ktx');
            if (this._caps.etc2) this.texturesSupported.push('-etc2.ktx');
            if (this._caps.etc1) this.texturesSupported.push('-etc1.ktx');

            if (this._gl.getShaderPrecisionFormat) {
                var highp = this._gl.getShaderPrecisionFormat(this._gl.FRAGMENT_SHADER, this._gl.HIGH_FLOAT);
                this._caps.highPrecisionShaderSupported = highp.precision !== 0;
            }

            // Depth buffer
            this.setDepthBuffer(true);
            this.setDepthFunctionToLessOrEqual();
            this.setDepthWrite(true);
        }

        public get webGLVersion(): number {
            return this._webGLVersion;
        }

        /**
         * Returns true if the stencil buffer has been enabled through the creation option of the context.
         */
        public get isStencilEnable(): boolean {
            return this._isStencilEnable;
        }

        private _prepareWorkingCanvas(): void {
            if (this._workingCanvas) {
                return;
            }

            this._workingCanvas = document.createElement("canvas");
            this._workingContext = this._workingCanvas.getContext("2d");
        }

        public resetTextureCache() {
            for (var key in this._activeTexturesCache) {
                this._activeTexturesCache[key] = null;
            }
        }

        public isDeterministicLockStep(): boolean {
            return this._deterministicLockstep;
        }

        public getLockstepMaxSteps(): number {
            return this._lockstepMaxSteps;
        }

        public getGlInfo() {
            return {
                vendor: this._glVendor,
                renderer: this._glRenderer,
                version: this._glVersion
            }
        }

        public getAspectRatio(camera: Camera, useScreen = false): number {
            var viewport = camera.viewport;
            return (this.getRenderWidth(useScreen) * viewport.width) / (this.getRenderHeight(useScreen) * viewport.height);
        }

        public getRenderWidth(useScreen = false): number {
            if (!useScreen && this._currentRenderTarget) {
                return this._currentRenderTarget.width;
            }

            return this._gl.drawingBufferWidth;
        }

        public getRenderHeight(useScreen = false): number {
            if (!useScreen && this._currentRenderTarget) {
                return this._currentRenderTarget.height;
            }

            return this._gl.drawingBufferHeight;
        }

        public getRenderingCanvas(): HTMLCanvasElement {
            return this._renderingCanvas;
        }

        public getRenderingCanvasClientRect(): ClientRect {
            return this._renderingCanvas.getBoundingClientRect();
        }

        public setHardwareScalingLevel(level: number): void {
            this._hardwareScalingLevel = level;
            this.resize();
        }

        public getHardwareScalingLevel(): number {
            return this._hardwareScalingLevel;
        }

        public getLoadedTexturesCache(): InternalTexture[] {
            return this._internalTexturesCache;
        }

        public getCaps(): EngineCapabilities {
            return this._caps;
        }

        /** The number of draw calls submitted last frame */
        public get drawCalls(): number {
            return this._drawCalls.current;
        }

        public get drawCallsPerfCounter(): PerfCounter {
            return this._drawCalls;
        }

        public getDepthFunction(): number {
            return this._depthCullingState.depthFunc;
        }

        public setDepthFunction(depthFunc: number) {
            this._depthCullingState.depthFunc = depthFunc;
        }

        public setDepthFunctionToGreater(): void {
            this._depthCullingState.depthFunc = this._gl.GREATER;
        }

        public setDepthFunctionToGreaterOrEqual(): void {
            this._depthCullingState.depthFunc = this._gl.GEQUAL;
        }

        public setDepthFunctionToLess(): void {
            this._depthCullingState.depthFunc = this._gl.LESS;
        }

        public setDepthFunctionToLessOrEqual(): void {
            this._depthCullingState.depthFunc = this._gl.LEQUAL;
        }

        public getStencilBuffer(): boolean {
            return this._stencilState.stencilTest;
        }

        public setStencilBuffer(enable: boolean): void {
            this._stencilState.stencilTest = enable;
        }

        public getStencilMask(): number {
            return this._stencilState.stencilMask;
        }

        public setStencilMask(mask: number): void {
            this._stencilState.stencilMask = mask;
        }

        public getStencilFunction(): number {
            return this._stencilState.stencilFunc;
        }

        public getStencilFunctionReference(): number {
            return this._stencilState.stencilFuncRef;
        }

        public getStencilFunctionMask(): number {
            return this._stencilState.stencilFuncMask;
        }

        public setStencilFunction(stencilFunc: number) {
            this._stencilState.stencilFunc = stencilFunc;
        }

        public setStencilFunctionReference(reference: number) {
            this._stencilState.stencilFuncRef = reference;
        }

        public setStencilFunctionMask(mask: number) {
            this._stencilState.stencilFuncMask = mask;
        }

        public getStencilOperationFail(): number {
            return this._stencilState.stencilOpStencilFail;
        }

        public getStencilOperationDepthFail(): number {
            return this._stencilState.stencilOpDepthFail;
        }

        public getStencilOperationPass(): number {
            return this._stencilState.stencilOpStencilDepthPass;
        }

        public setStencilOperationFail(operation: number): void {
            this._stencilState.stencilOpStencilFail = operation;
        }

        public setStencilOperationDepthFail(operation: number): void {
            this._stencilState.stencilOpDepthFail = operation;
        }

        public setStencilOperationPass(operation: number): void {
            this._stencilState.stencilOpStencilDepthPass = operation;
        }

        public setDitheringState(value: boolean): void {
            if (value) {
                this._gl.enable(this._gl.DITHER);
            } else {
                this._gl.disable(this._gl.DITHER);
            }
        }

        /**
         * stop executing a render loop function and remove it from the execution array
         * @param {Function} [renderFunction] the function to be removed. If not provided all functions will be removed.
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
                // Register new frame
                this._frameHandler = Tools.QueueNewFrame(this._bindedRenderFunction, this._vrDisplayEnabled);
            } else {
                this._renderingQueueLaunched = false;
            }
        }

        /**
         * Register and execute a render loop. The engine can have more than one render function.
         * @param {Function} renderFunction - the function to continuously execute starting the next render loop.
         * @example
         * engine.runRenderLoop(function () {
         *      scene.render()
         * })
         */
        public runRenderLoop(renderFunction: () => void): void {
            if (this._activeRenderLoops.indexOf(renderFunction) !== -1) {
                return;
            }

            this._activeRenderLoops.push(renderFunction);

            if (!this._renderingQueueLaunched) {
                this._renderingQueueLaunched = true;
                this._bindedRenderFunction = this._renderLoop.bind(this);
                this._frameHandler = Tools.QueueNewFrame(this._bindedRenderFunction);
            }
        }

        /**
         * Toggle full screen mode.
         * @param {boolean} requestPointerLock - should a pointer lock be requested from the user
         * @param {any} options - an options object to be sent to the requestFullscreen function
         */
        public switchFullscreen(requestPointerLock: boolean): void {
            if (this.isFullscreen) {
                Tools.ExitFullscreen();
            } else {
                this._pointerLockRequested = requestPointerLock;
                Tools.RequestFullscreen(this._renderingCanvas);
            }
        }

        public clear(color: Color4, backBuffer: boolean, depth: boolean, stencil: boolean = false): void {
            this.applyStates();

            var mode = 0;
            if (backBuffer && color) {
                this._gl.clearColor(color.r, color.g, color.b, color.a !== undefined ? color.a : 1.0);
                mode |= this._gl.COLOR_BUFFER_BIT;
            }
            if (depth) {
                this._gl.clearDepth(1.0);
                mode |= this._gl.DEPTH_BUFFER_BIT;
            }
            if (stencil) {
                this._gl.clearStencil(0);
                mode |= this._gl.STENCIL_BUFFER_BIT;
            }
            this._gl.clear(mode);
        }

        public scissorClear(x: number, y: number, width: number, height: number, clearColor: Color4): void {
            let gl = this._gl;

            // Save state
            var curScissor = gl.getParameter(gl.SCISSOR_TEST);
            var curScissorBox = gl.getParameter(gl.SCISSOR_BOX);

            // Change state
            gl.enable(gl.SCISSOR_TEST);
            gl.scissor(x, y, width, height);

            // Clear
            this.clear(clearColor, true, true, true);

            // Restore state
            gl.scissor(curScissorBox[0], curScissorBox[1], curScissorBox[2], curScissorBox[3]);

            if (curScissor === true) {
                gl.enable(gl.SCISSOR_TEST);
            } else {
                gl.disable(gl.SCISSOR_TEST);
            }
        }

        /**
         * Set the WebGL's viewport
         * @param {BABYLON.Viewport} viewport - the viewport element to be used.
         * @param {number} [requiredWidth] - the width required for rendering. If not provided the rendering canvas' width is used.
         * @param {number} [requiredHeight] - the height required for rendering. If not provided the rendering canvas' height is used.
         */
        public setViewport(viewport: Viewport, requiredWidth?: number, requiredHeight?: number): void {
            var width = requiredWidth || this.getRenderWidth();
            var height = requiredHeight || this.getRenderHeight();
            var x = viewport.x || 0;
            var y = viewport.y || 0;

            this._cachedViewport = viewport;

            this._gl.viewport(x * width, y * height, width * viewport.width, height * viewport.height);
        }

        /**
         * Directly set the WebGL Viewport
         * The x, y, width & height are directly passed to the WebGL call
         * @return the current viewport Object (if any) that is being replaced by this call. You can restore this viewport later on to go back to the original state.
         */
        public setDirectViewport(x: number, y: number, width: number, height: number): Viewport {
            let currentViewport = this._cachedViewport;
            this._cachedViewport = null;

            this._gl.viewport(x, y, width, height);

            return currentViewport;
        }

        public beginFrame(): void {
            this._measureFps();
        }

        public endFrame(): void {
            //force a flush in case we are using a bad OS.
            if (this._badOS) {
                this.flushFramebuffer();
            }

            //submit frame to the vr device, if enabled
            if (this._vrDisplayEnabled && this._vrDisplayEnabled.isPresenting) {
                this._vrDisplayEnabled.submitFrame()
            }
        }

        /**
         * resize the view according to the canvas' size.
         * @example
         *   window.addEventListener("resize", function () {
         *      engine.resize();
         *   });
         */
        public resize(): void {
            // We're not resizing the size of the canvas while in VR mode & presenting
            if (!(this._vrDisplayEnabled && this._vrDisplayEnabled.isPresenting)) {
                var width = navigator.isCocoonJS ? window.innerWidth : this._renderingCanvas.clientWidth;
                var height = navigator.isCocoonJS ? window.innerHeight : this._renderingCanvas.clientHeight;

                this.setSize(width / this._hardwareScalingLevel, height / this._hardwareScalingLevel);
            }
        }

        /**
         * force a specific size of the canvas
         * @param {number} width - the new canvas' width
         * @param {number} height - the new canvas' height
         */
        public setSize(width: number, height: number): void {
            if (this._renderingCanvas.width === width && this._renderingCanvas.height === height) {
                return;
            }

            this._renderingCanvas.width = width;
            this._renderingCanvas.height = height;

            for (var index = 0; index < this.scenes.length; index++) {
                var scene = this.scenes[index];

                for (var camIndex = 0; camIndex < scene.cameras.length; camIndex++) {
                    var cam = scene.cameras[camIndex];

                    cam._currentRenderId = 0;
                }
            }

            if (this.onResizeObservable.hasObservers) {
                this.onResizeObservable.notifyObservers(this);
            }
        }


        //WebVR functions
        public isVRDevicePresent(callback: (result: boolean) => void) {
            this.getVRDevice(null, (device) => {
                callback(device !== null);
            });
        }

        public getVRDevice(name: string, callback: (device: any) => void) {
            if (!this.vrDisplaysPromise) {
                callback(null);
                return;
            }

            this.vrDisplaysPromise.then((devices) => {
                if (devices.length > 0) {
                    if (name) {
                        var found = devices.some(device => {
                            if (device.displayName === name) {
                                callback(device);
                                return true;
                            } else {
                                return false;
                            }
                        });
                        if (!found) {
                            Tools.Warn("Display " + name + " was not found. Using " + devices[0].displayName);
                            callback(devices[0]);
                        }
                    } else {
                        //choose the first one
                        callback(devices[0]);
                    }
                } else {
                    Tools.Error("No WebVR devices found!");
                    callback(null);
                }
            });
        }

        public initWebVR(): void {
            if (!this.vrDisplaysPromise) {
                this._getVRDisplays();
            }
        }

        public enableVR(vrDevice) {
            this._vrDisplayEnabled = vrDevice;
            this._vrDisplayEnabled.requestPresent([{ source: this.getRenderingCanvas() }]).then(this._onVRFullScreenTriggered);
        }

        public disableVR() {
            if (this._vrDisplayEnabled) {
                this._vrDisplayEnabled.exitPresent().then(this._onVRFullScreenTriggered);
            }
        }

        private _onVRFullScreenTriggered = () => {
            if (this._vrDisplayEnabled && this._vrDisplayEnabled.isPresenting) {
                //get the old size before we change
                this._oldSize = new BABYLON.Size(this.getRenderWidth(), this.getRenderHeight());
                this._oldHardwareScaleFactor = this.getHardwareScalingLevel();

                //get the width and height, change the render size
                var leftEye = this._vrDisplayEnabled.getEyeParameters('left');
                var width, height;
                this.setHardwareScalingLevel(1);
                this.setSize(leftEye.renderWidth * 2, leftEye.renderHeight);
            } else {
                //When the specs are implemented, need to uncomment this.
                this.setHardwareScalingLevel(this._oldHardwareScaleFactor);
                this.setSize(this._oldSize.width, this._oldSize.height);
                this._vrDisplayEnabled = undefined;
            }
        }

        private _getVRDisplays() {
            var getWebVRDevices = (devices: Array<any>) => {

                this._vrDisplays = devices.filter(function (device) {
                    return device instanceof VRDisplay;
                });

                return this._vrDisplays;
            }

            if (navigator.getVRDisplays) {
                this.vrDisplaysPromise = navigator.getVRDisplays().then(getWebVRDevices);
            }
        }

        public bindFramebuffer(texture: InternalTexture, faceIndex?: number, requiredWidth?: number, requiredHeight?: number, forceFullscreenViewport?: boolean): void {
            if (this._currentRenderTarget) {
                this.unBindFramebuffer(this._currentRenderTarget);
            }
            this._currentRenderTarget = texture;
            this.bindUnboundFramebuffer(texture._MSAAFramebuffer ? texture._MSAAFramebuffer : texture._framebuffer);
            var gl = this._gl;
            if (texture.isCube) {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, texture._webGLTexture, 0);
            }

            if (this._cachedViewport && !forceFullscreenViewport) {
                this.setViewport(this._cachedViewport, requiredWidth, requiredHeight);
            } else {
                gl.viewport(0, 0, requiredWidth || texture.width, requiredHeight || texture.height);
            }

            this.wipeCaches();
        }

        private bindUnboundFramebuffer(framebuffer: WebGLFramebuffer) {
            if (this._currentFramebuffer !== framebuffer) {
                this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, framebuffer);
                this._currentFramebuffer = framebuffer;
            }
        }

        public unBindFramebuffer(texture: InternalTexture, disableGenerateMipMaps = false, onBeforeUnbind?: () => void): void {
            this._currentRenderTarget = null;

            // If MSAA, we need to bitblt back to main texture
            var gl = this._gl;

            if (texture._MSAAFramebuffer) {
                gl.bindFramebuffer(gl.READ_FRAMEBUFFER, texture._MSAAFramebuffer);
                gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, texture._framebuffer);
                gl.blitFramebuffer(0, 0, texture.width, texture.height,
                    0, 0, texture.width, texture.height,
                    gl.COLOR_BUFFER_BIT, gl.NEAREST);
            }

            if (texture.generateMipMaps && !disableGenerateMipMaps && !texture.isCube) {
                this._bindTextureDirectly(gl.TEXTURE_2D, texture);
                gl.generateMipmap(gl.TEXTURE_2D);
                this._bindTextureDirectly(gl.TEXTURE_2D, null);
            }

            if (onBeforeUnbind) {
                if (texture._MSAAFramebuffer) {
                    // Bind the correct framebuffer
                    this.bindUnboundFramebuffer(texture._framebuffer);
                }
                onBeforeUnbind();
            }

            this.bindUnboundFramebuffer(null);
        }

        public generateMipMapsForCubemap(texture: InternalTexture) {
            if (texture.generateMipMaps) {
                var gl = this._gl;
                this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);
            }
        }

        public flushFramebuffer(): void {
            this._gl.flush();
        }

        public restoreDefaultFramebuffer(): void {
            if (this._currentRenderTarget) {
                this.unBindFramebuffer(this._currentRenderTarget);
            } else {
                this.bindUnboundFramebuffer(null);
            }
            if (this._cachedViewport) {
                this.setViewport(this._cachedViewport);
            }

            this.wipeCaches();
        }

        // UBOs
        public createUniformBuffer(elements: number[] | Float32Array): WebGLBuffer {
            var ubo = this._gl.createBuffer();
            this.bindUniformBuffer(ubo);

            if (elements instanceof Float32Array) {
                this._gl.bufferData(this._gl.UNIFORM_BUFFER, <Float32Array>elements, this._gl.STATIC_DRAW);
            } else {
                this._gl.bufferData(this._gl.UNIFORM_BUFFER, new Float32Array(<number[]>elements), this._gl.STATIC_DRAW);
            }

            this.bindUniformBuffer(null);

            ubo.references = 1;
            return ubo;
        }

        public createDynamicUniformBuffer(elements: number[] | Float32Array): WebGLBuffer {
            var ubo = this._gl.createBuffer();
            this.bindUniformBuffer(ubo);

            if (elements instanceof Float32Array) {
                this._gl.bufferData(this._gl.UNIFORM_BUFFER, <Float32Array>elements, this._gl.DYNAMIC_DRAW);
            } else {
                this._gl.bufferData(this._gl.UNIFORM_BUFFER, new Float32Array(<number[]>elements), this._gl.DYNAMIC_DRAW);
            }

            this.bindUniformBuffer(null);

            ubo.references = 1;
            return ubo;
        }

        public updateUniformBuffer(uniformBuffer: WebGLBuffer, elements: number[] | Float32Array, offset?: number, count?: number): void {
            this.bindUniformBuffer(uniformBuffer);

            if (offset === undefined) {
                offset = 0;
            }

            if (count === undefined) {
                if (elements instanceof Float32Array) {
                    this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, offset, <Float32Array>elements);
                } else {
                    this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, offset, new Float32Array(<number[]>elements));
                }
            } else {
                if (elements instanceof Float32Array) {
                    this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, 0, <Float32Array>elements.subarray(offset, offset + count));
                } else {
                    this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, 0, new Float32Array(<number[]>elements).subarray(offset, offset + count));
                }
            }

            this.bindUniformBuffer(null);
        }


        // VBOs
        private _resetVertexBufferBinding(): void {
            this.bindArrayBuffer(null);
            this._cachedVertexBuffers = null;
        }

        public createVertexBuffer(vertices: number[] | Float32Array): WebGLBuffer {
            var vbo = this._gl.createBuffer();
            this.bindArrayBuffer(vbo);

            if (vertices instanceof Float32Array) {
                this._gl.bufferData(this._gl.ARRAY_BUFFER, <Float32Array>vertices, this._gl.STATIC_DRAW);
            } else {
                this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(<number[]>vertices), this._gl.STATIC_DRAW);
            }

            this._resetVertexBufferBinding();
            vbo.references = 1;
            return vbo;
        }

        public createDynamicVertexBuffer(vertices: number[] | Float32Array): WebGLBuffer {
            var vbo = this._gl.createBuffer();
            this.bindArrayBuffer(vbo);

            if (vertices instanceof Float32Array) {
                this._gl.bufferData(this._gl.ARRAY_BUFFER, <Float32Array>vertices, this._gl.DYNAMIC_DRAW);
            } else {
                this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(<number[]>vertices), this._gl.DYNAMIC_DRAW);
            }
            this._resetVertexBufferBinding();
            vbo.references = 1;
            return vbo;
        }

        public updateDynamicVertexBuffer(vertexBuffer: WebGLBuffer, vertices: number[] | Float32Array, offset?: number, count?: number): void {
            this.bindArrayBuffer(vertexBuffer);

            if (offset === undefined) {
                offset = 0;
            }

            if (count === undefined) {
                if (vertices instanceof Float32Array) {
                    this._gl.bufferSubData(this._gl.ARRAY_BUFFER, offset, <Float32Array>vertices);
                } else {
                    this._gl.bufferSubData(this._gl.ARRAY_BUFFER, offset, new Float32Array(<number[]>vertices));
                }
            } else {
                if (vertices instanceof Float32Array) {
                    this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, <Float32Array>vertices.subarray(offset, offset + count));
                } else {
                    this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, new Float32Array(<number[]>vertices).subarray(offset, offset + count));
                }
            }

            this._resetVertexBufferBinding();
        }

        private _resetIndexBufferBinding(): void {
            this.bindIndexBuffer(null);
            this._cachedIndexBuffer = null;
        }

        public createIndexBuffer(indices: IndicesArray): WebGLBuffer {
            var vbo = this._gl.createBuffer();
            this.bindIndexBuffer(vbo);

            // Check for 32 bits indices
            var arrayBuffer;
            var need32Bits = false;

            if (indices instanceof Uint16Array) {
                arrayBuffer = indices;
            } else {
                //check 32 bit support
                if (this._caps.uintIndices) {
                    if (indices instanceof Uint32Array) {
                        arrayBuffer = indices;
                        need32Bits = true;
                    } else {
                        //number[] or Int32Array, check if 32 bit is necessary
                        for (var index = 0; index < indices.length; index++) {
                            if (indices[index] > 65535) {
                                need32Bits = true;
                                break;
                            }
                        }

                        arrayBuffer = need32Bits ? new Uint32Array(indices) : new Uint16Array(indices);
                    }
                } else {
                    //no 32 bit support, force conversion to 16 bit (values greater 16 bit are lost)
                    arrayBuffer = new Uint16Array(indices);
                }
            }

            this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, arrayBuffer, this._gl.STATIC_DRAW);
            this._resetIndexBufferBinding();
            vbo.references = 1;
            vbo.is32Bits = need32Bits;
            return vbo;
        }

        public bindArrayBuffer(buffer: WebGLBuffer): void {
            if (!this._vaoRecordInProgress) {
                this._unbindVertexArrayObject();
            }
            this.bindBuffer(buffer, this._gl.ARRAY_BUFFER);
        }

        public bindUniformBuffer(buffer?: WebGLBuffer): void {
            this._gl.bindBuffer(this._gl.UNIFORM_BUFFER, buffer);
        }

        public bindUniformBufferBase(buffer: WebGLBuffer, location: number): void {
            this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER, location, buffer);
        }

        public bindUniformBlock(shaderProgram: WebGLProgram, blockName: string, index: number): void {
            var uniformLocation = this._gl.getUniformBlockIndex(shaderProgram, blockName);

            this._gl.uniformBlockBinding(shaderProgram, uniformLocation, index);
        };

        private bindIndexBuffer(buffer: WebGLBuffer): void {
            if (!this._vaoRecordInProgress) {
                this._unbindVertexArrayObject();
            }
            this.bindBuffer(buffer, this._gl.ELEMENT_ARRAY_BUFFER);
        }

        private bindBuffer(buffer: WebGLBuffer, target: number): void {
            if (this._vaoRecordInProgress || this._currentBoundBuffer[target] !== buffer) {
                this._gl.bindBuffer(target, buffer);
                this._currentBoundBuffer[target] = buffer;
            }
        }

        public updateArrayBuffer(data: Float32Array): void {
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, data);
        }

        private vertexAttribPointer(buffer: WebGLBuffer, indx: number, size: number, type: number, normalized: boolean, stride: number, offset: number): void {
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

        private _bindIndexBufferWithCache(indexBuffer: WebGLBuffer): void {
            if (indexBuffer == null) {
                return;
            }
            if (this._cachedIndexBuffer !== indexBuffer) {
                this._cachedIndexBuffer = indexBuffer;
                this.bindIndexBuffer(indexBuffer);
                this._uintIndicesCurrentlySet = indexBuffer.is32Bits;
            }
        }

        private _bindVertexBuffersAttributes(vertexBuffers: { [key: string]: VertexBuffer; }, effect: Effect) {
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
                    this.vertexAttribPointer(buffer, order, vertexBuffer.getSize(), this._gl.FLOAT, false, vertexBuffer.getStrideSize() * 4, vertexBuffer.getOffset() * 4);

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

        public recordVertexArrayObject(vertexBuffers: { [key: string]: VertexBuffer; }, indexBuffer: WebGLBuffer, effect: Effect): WebGLVertexArrayObject {
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

        public bindVertexArrayObject(vertexArrayObject: WebGLVertexArrayObject, indexBuffer: WebGLBuffer): void {
            if (this._cachedVertexArrayObject !== vertexArrayObject) {
                this._cachedVertexArrayObject = vertexArrayObject;

                this._gl.bindVertexArray(vertexArrayObject);
                this._cachedVertexBuffers = null;
                this._cachedIndexBuffer = null;

                this._uintIndicesCurrentlySet = indexBuffer != null && indexBuffer.is32Bits;
                this._mustWipeVertexAttributes = true;
            }
        }

        public bindBuffersDirectly(vertexBuffer: WebGLBuffer, indexBuffer: WebGLBuffer, vertexDeclaration: number[], vertexStrideSize: number, effect: Effect): void {
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
                            this.vertexAttribPointer(vertexBuffer, order, vertexDeclaration[index], this._gl.FLOAT, false, vertexStrideSize, offset);
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

        public bindBuffers(vertexBuffers: { [key: string]: VertexBuffer; }, indexBuffer: WebGLBuffer, effect: Effect): void {
            if (this._cachedVertexBuffers !== vertexBuffers || this._cachedEffectForVertexBuffers !== effect) {
                this._cachedVertexBuffers = vertexBuffers;
                this._cachedEffectForVertexBuffers = effect;

                this._bindVertexBuffersAttributes(vertexBuffers, effect);
            }

            this._bindIndexBufferWithCache(indexBuffer);
        }

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

        public releaseVertexArrayObject(vao: WebGLVertexArrayObject) {
            this._gl.deleteVertexArray(vao);
        }

        public _releaseBuffer(buffer: WebGLBuffer): boolean {
            buffer.references--;

            if (buffer.references === 0) {
                this._gl.deleteBuffer(buffer);
                return true;
            }

            return false;
        }

        public createInstancesBuffer(capacity: number): WebGLBuffer {
            var buffer = this._gl.createBuffer();

            buffer.capacity = capacity;

            this.bindArrayBuffer(buffer);
            this._gl.bufferData(this._gl.ARRAY_BUFFER, capacity, this._gl.DYNAMIC_DRAW);
            return buffer;
        }

        public deleteInstancesBuffer(buffer: WebGLBuffer): void {
            this._gl.deleteBuffer(buffer);
        }

        public updateAndBindInstancesBuffer(instancesBuffer: WebGLBuffer, data: Float32Array, offsetLocations: number[] | InstancingAttributeInfo[]): void {
            this.bindArrayBuffer(instancesBuffer);
            if (data) {
                this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, data);
            }

            if ((<any>offsetLocations[0]).index !== undefined) {
                let stride = 0;
                for (let i = 0; i < offsetLocations.length; i++) {
                    let ai = <InstancingAttributeInfo>offsetLocations[i];
                    stride += ai.attributeSize * 4;
                }
                for (let i = 0; i < offsetLocations.length; i++) {
                    let ai = <InstancingAttributeInfo>offsetLocations[i];

                    if (!this._vertexAttribArraysEnabled[ai.index]) {
                        this._gl.enableVertexAttribArray(ai.index);
                        this._vertexAttribArraysEnabled[ai.index] = true;
                    }

                    this.vertexAttribPointer(instancesBuffer, ai.index, ai.attributeSize, ai.attribyteType || this._gl.FLOAT, ai.normalized || false, stride, ai.offset);
                    this._gl.vertexAttribDivisor(ai.index, 1);
                    this._currentInstanceLocations.push(ai.index);
                    this._currentInstanceBuffers.push(instancesBuffer);
                }
            } else {
                for (let index = 0; index < 4; index++) {
                    let offsetLocation = <number>offsetLocations[index];

                    if (!this._vertexAttribArraysEnabled[offsetLocation]) {
                        this._gl.enableVertexAttribArray(offsetLocation);
                        this._vertexAttribArraysEnabled[offsetLocation] = true;
                    }

                    this.vertexAttribPointer(instancesBuffer, offsetLocation, 4, this._gl.FLOAT, false, 64, index * 16);
                    this._gl.vertexAttribDivisor(offsetLocation, 1);
                    this._currentInstanceLocations.push(offsetLocation);
                    this._currentInstanceBuffers.push(instancesBuffer);
                }
            }
        }

        public applyStates() {
            this._depthCullingState.apply(this._gl);
            this._stencilState.apply(this._gl);
            this._alphaState.apply(this._gl);
        }

        public draw(useTriangles: boolean, indexStart: number, indexCount: number, instancesCount?: number): void {
            // Apply states
            this.applyStates();

            this._drawCalls.addCount(1, false);
            // Render
            var indexFormat = this._uintIndicesCurrentlySet ? this._gl.UNSIGNED_INT : this._gl.UNSIGNED_SHORT;
            var mult = this._uintIndicesCurrentlySet ? 4 : 2;
            if (instancesCount) {
                this._gl.drawElementsInstanced(useTriangles ? this._gl.TRIANGLES : this._gl.LINES, indexCount, indexFormat, indexStart * mult, instancesCount);
                return;
            }

            this._gl.drawElements(useTriangles ? this._gl.TRIANGLES : this._gl.LINES, indexCount, indexFormat, indexStart * mult);
        }

        public drawPointClouds(verticesStart: number, verticesCount: number, instancesCount?: number): void {
            // Apply states
            this.applyStates();
            this._drawCalls.addCount(1, false);

            if (instancesCount) {
                this._gl.drawArraysInstanced(this._gl.POINTS, verticesStart, verticesCount, instancesCount);
                return;
            }

            this._gl.drawArrays(this._gl.POINTS, verticesStart, verticesCount);
        }

        public drawUnIndexed(useTriangles: boolean, verticesStart: number, verticesCount: number, instancesCount?: number): void {
            // Apply states
            this.applyStates();
            this._drawCalls.addCount(1, false);

            if (instancesCount) {
                this._gl.drawArraysInstanced(useTriangles ? this._gl.TRIANGLES : this._gl.LINES, verticesStart, verticesCount, instancesCount);
                return;
            }

            this._gl.drawArrays(useTriangles ? this._gl.TRIANGLES : this._gl.LINES, verticesStart, verticesCount);
        }

        // Shaders
        public _releaseEffect(effect: Effect): void {
            if (this._compiledEffects[effect._key]) {
                delete this._compiledEffects[effect._key];
                if (effect.getProgram()) {
                    this._gl.deleteProgram(effect.getProgram());
                }
            }
        }


        /**
         * @param baseName The base name of the effect (The name of file without .fragment.fx or .vertex.fx)
         * @param samplers An array of string used to represent textures
         */
        public createEffect(baseName: any, attributesNamesOrOptions: string[] | EffectCreationOptions, uniformsNamesOrEngine: string[] | Engine, samplers?: string[], defines?: string, fallbacks?: EffectFallbacks,
            onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void, indexParameters?: any): Effect {
            var vertex = baseName.vertexElement || baseName.vertex || baseName;
            var fragment = baseName.fragmentElement || baseName.fragment || baseName;

            var name = vertex + "+" + fragment + "@" + (defines ? defines : (<EffectCreationOptions>attributesNamesOrOptions).defines);
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

        public createEffectForParticles(fragmentName: string, uniformsNames: string[] = [], samplers: string[] = [], defines = "", fallbacks?: EffectFallbacks,
            onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void): Effect {

            return this.createEffect(
                {
                    vertex: "particles",
                    fragmentElement: fragmentName
                },
                ["position", "color", "options"],
                ["view", "projection"].concat(uniformsNames),
                ["diffuseSampler"].concat(samplers), defines, fallbacks, onCompiled, onError);
        }

        public createShaderProgram(vertexCode: string, fragmentCode: string, defines: string, context?: WebGLRenderingContext): WebGLProgram {
            context = context || this._gl;

            var shaderVersion = (this._webGLVersion > 1) ? "#version 300 es\n" : "";
            var vertexShader = compileShader(context, vertexCode, "vertex", defines, shaderVersion);
            var fragmentShader = compileShader(context, fragmentCode, "fragment", defines, shaderVersion);

            var shaderProgram = context.createProgram();
            context.attachShader(shaderProgram, vertexShader);
            context.attachShader(shaderProgram, fragmentShader);

            context.linkProgram(shaderProgram);

            var linked = context.getProgramParameter(shaderProgram, context.LINK_STATUS);

            if (!linked) {
                context.validateProgram(shaderProgram);
                var error = context.getProgramInfoLog(shaderProgram);
                if (error) {
                    throw new Error(error);
                }
            }

            context.deleteShader(vertexShader);
            context.deleteShader(fragmentShader);

            return shaderProgram;
        }

        public getUniforms(shaderProgram: WebGLProgram, uniformsNames: string[]): WebGLUniformLocation[] {
            var results = [];

            for (var index = 0; index < uniformsNames.length; index++) {
                results.push(this._gl.getUniformLocation(shaderProgram, uniformsNames[index]));
            }

            return results;
        }

        public getAttributes(shaderProgram: WebGLProgram, attributesNames: string[]): number[] {
            var results = [];

            for (var index = 0; index < attributesNames.length; index++) {
                try {
                    results.push(this._gl.getAttribLocation(shaderProgram, attributesNames[index]));
                } catch (e) {
                    results.push(-1);
                }
            }

            return results;
        }

        public enableEffect(effect: Effect): void {
            // Use program
            this.setProgram(effect.getProgram());

            this._currentEffect = effect;

            if (effect.onBind) {
                effect.onBind(effect);
            }
            effect.onBindObservable.notifyObservers(effect);
        }

        public setIntArray(uniform: WebGLUniformLocation, array: Int32Array): void {
            if (!uniform)
                return;

            this._gl.uniform1iv(uniform, array);
        }

        public setIntArray2(uniform: WebGLUniformLocation, array: Int32Array): void {
            if (!uniform || array.length % 2 !== 0)
                return;

            this._gl.uniform2iv(uniform, array);
        }

        public setIntArray3(uniform: WebGLUniformLocation, array: Int32Array): void {
            if (!uniform || array.length % 3 !== 0)
                return;

            this._gl.uniform3iv(uniform, array);
        }

        public setIntArray4(uniform: WebGLUniformLocation, array: Int32Array): void {
            if (!uniform || array.length % 4 !== 0)
                return;

            this._gl.uniform4iv(uniform, array);
        }

        public setFloatArray(uniform: WebGLUniformLocation, array: Float32Array): void {
            if (!uniform)
                return;

            this._gl.uniform1fv(uniform, array);
        }

        public setFloatArray2(uniform: WebGLUniformLocation, array: Float32Array): void {
            if (!uniform || array.length % 2 !== 0)
                return;

            this._gl.uniform2fv(uniform, array);
        }

        public setFloatArray3(uniform: WebGLUniformLocation, array: Float32Array): void {
            if (!uniform || array.length % 3 !== 0)
                return;

            this._gl.uniform3fv(uniform, array);
        }

        public setFloatArray4(uniform: WebGLUniformLocation, array: Float32Array): void {
            if (!uniform || array.length % 4 !== 0)
                return;

            this._gl.uniform4fv(uniform, array);
        }

        public setArray(uniform: WebGLUniformLocation, array: number[]): void {
            if (!uniform)
                return;

            this._gl.uniform1fv(uniform, <any>array);
        }

        public setArray2(uniform: WebGLUniformLocation, array: number[]): void {
            if (!uniform || array.length % 2 !== 0)
                return;

            this._gl.uniform2fv(uniform, <any>array);
        }

        public setArray3(uniform: WebGLUniformLocation, array: number[]): void {
            if (!uniform || array.length % 3 !== 0)
                return;

            this._gl.uniform3fv(uniform, <any>array);
        }

        public setArray4(uniform: WebGLUniformLocation, array: number[]): void {
            if (!uniform || array.length % 4 !== 0)
                return;

            this._gl.uniform4fv(uniform, <any>array);
        }

        public setMatrices(uniform: WebGLUniformLocation, matrices: Float32Array): void {
            if (!uniform)
                return;

            this._gl.uniformMatrix4fv(uniform, false, matrices);
        }

        public setMatrix(uniform: WebGLUniformLocation, matrix: Matrix): void {
            if (!uniform)
                return;

            this._gl.uniformMatrix4fv(uniform, false, matrix.toArray());
        }

        public setMatrix3x3(uniform: WebGLUniformLocation, matrix: Float32Array): void {
            if (!uniform)
                return;

            this._gl.uniformMatrix3fv(uniform, false, matrix);
        }

        public setMatrix2x2(uniform: WebGLUniformLocation, matrix: Float32Array): void {
            if (!uniform)
                return;

            this._gl.uniformMatrix2fv(uniform, false, matrix);
        }

        public setFloat(uniform: WebGLUniformLocation, value: number): void {
            if (!uniform)
                return;

            this._gl.uniform1f(uniform, value);
        }

        public setFloat2(uniform: WebGLUniformLocation, x: number, y: number): void {
            if (!uniform)
                return;

            this._gl.uniform2f(uniform, x, y);
        }

        public setFloat3(uniform: WebGLUniformLocation, x: number, y: number, z: number): void {
            if (!uniform)
                return;

            this._gl.uniform3f(uniform, x, y, z);
        }

        public setBool(uniform: WebGLUniformLocation, bool: number): void {
            if (!uniform)
                return;

            this._gl.uniform1i(uniform, bool);
        }

        public setFloat4(uniform: WebGLUniformLocation, x: number, y: number, z: number, w: number): void {
            if (!uniform)
                return;

            this._gl.uniform4f(uniform, x, y, z, w);
        }

        public setColor3(uniform: WebGLUniformLocation, color3: Color3): void {
            if (!uniform)
                return;

            this._gl.uniform3f(uniform, color3.r, color3.g, color3.b);
        }

        public setColor4(uniform: WebGLUniformLocation, color3: Color3, alpha: number): void {
            if (!uniform)
                return;

            this._gl.uniform4f(uniform, color3.r, color3.g, color3.b, alpha);
        }

        // States
        public setState(culling: boolean, zOffset: number = 0, force?: boolean, reverseSide = false): void {
            // Culling
            var showSide = reverseSide ? this._gl.FRONT : this._gl.BACK;
            var hideSide = reverseSide ? this._gl.BACK : this._gl.FRONT;
            var cullFace = this.cullBackFaces ? showSide : hideSide;

            if (this._depthCullingState.cull !== culling || force || this._depthCullingState.cullFace !== cullFace) {
                if (culling) {
                    this._depthCullingState.cullFace = cullFace;
                    this._depthCullingState.cull = true;
                } else {
                    this._depthCullingState.cull = false;
                }
            }

            // Z offset
            this.setZOffset(zOffset);
        }

        public setZOffset(value: number): void {
            this._depthCullingState.zOffset = value;
        }

        public getZOffset(): number {
            return this._depthCullingState.zOffset;
        }

        public setDepthBuffer(enable: boolean): void {
            this._depthCullingState.depthTest = enable;
        }

        public getDepthWrite(): boolean {
            return this._depthCullingState.depthMask;
        }

        public setDepthWrite(enable: boolean): void {
            this._depthCullingState.depthMask = enable;
        }

        public setColorWrite(enable: boolean): void {
            this._gl.colorMask(enable, enable, enable, enable);
            this._colorWrite = enable;
        }

        public getColorWrite(): boolean {
            return this._colorWrite;
        }

        public setAlphaConstants(r: number, g: number, b: number, a: number) {
            this._alphaState.setAlphaBlendConstants(r, g, b, a);
        }

        public setAlphaMode(mode: number, noDepthWriteChange: boolean = false): void {
            if (this._alphaMode === mode) {
                return;
            }

            switch (mode) {
                case Engine.ALPHA_DISABLE:
                    this._alphaState.alphaBlend = false;
                    break;
                case Engine.ALPHA_PREMULTIPLIED:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_PREMULTIPLIED_PORTERDUFF:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_COMBINE:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_ONEONE:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE, this._gl.ZERO, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_ADD:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE, this._gl.ZERO, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_SUBTRACT:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.ZERO, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_MULTIPLY:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.DST_COLOR, this._gl.ZERO, this._gl.ONE, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_MAXIMIZED:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_INTERPOLATE:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.CONSTANT_COLOR, this._gl.ONE_MINUS_CONSTANT_COLOR, this._gl.CONSTANT_ALPHA, this._gl.ONE_MINUS_CONSTANT_ALPHA);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_SCREENMODE:
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
                    this._alphaState.alphaBlend = true;
                    break;
            }
            if (!noDepthWriteChange) {
                this.setDepthWrite(mode === Engine.ALPHA_DISABLE);
            }
            this._alphaMode = mode;
        }

        public getAlphaMode(): number {
            return this._alphaMode;
        }

        public setAlphaTesting(enable: boolean): void {
            this._alphaTest = enable;
        }

        public getAlphaTesting(): boolean {
            return !!this._alphaTest;
        }

        // Textures
        public wipeCaches(bruteForce?: boolean): void {
            if (this.preventCacheWipeBetweenFrames) {
                return;
            }
            this.resetTextureCache();
            this._currentEffect = null;

            // 6/8/2017: deltakosh: Should not be required anymore.
            // This message is then mostly for the future myself which will scream out loud when seeing that actually it was required :)
            if (bruteForce) {
                this._currentProgram = null;

                this._stencilState.reset();
                this._depthCullingState.reset();
                this.setDepthFunctionToLessOrEqual();
                this._alphaState.reset();
            }

            this._cachedVertexBuffers = null;
            this._cachedIndexBuffer = null;
            this._cachedEffectForVertexBuffers = null;
            this._unbindVertexArrayObject();
            this.bindIndexBuffer(null);
            this.bindArrayBuffer(null);
        }

        /**
         * Set the compressed texture format to use, based on the formats you have, and the formats
         * supported by the hardware / browser.
         *
         * Khronos Texture Container (.ktx) files are used to support this.  This format has the
         * advantage of being specifically designed for OpenGL.  Header elements directly correspond
         * to API arguments needed to compressed textures.  This puts the burden on the container
         * generator to house the arcane code for determining these for current & future formats.
         *
         * for description see https://www.khronos.org/opengles/sdk/tools/KTX/
         * for file layout see https://www.khronos.org/opengles/sdk/tools/KTX/file_format_spec/
         *
         * Note: The result of this call is not taken into account when a texture is base64.
         *
         * @param {Array<string>} formatsAvailable- The list of those format families you have created
         * on your server.  Syntax: '-' + format family + '.ktx'.  (Case and order do not matter.)
         *
         * Current families are astc, dxt, pvrtc, etc2, & etc1.
         * @returns The extension selected.
         */
        public setTextureFormatToUse(formatsAvailable: Array<string>): string {
            for (var i = 0, len1 = this.texturesSupported.length; i < len1; i++) {
                for (var j = 0, len2 = formatsAvailable.length; j < len2; j++) {
                    if (this._texturesSupported[i] === formatsAvailable[j].toLowerCase()) {
                        return this._textureFormatInUse = this._texturesSupported[i];
                    }
                }
            }
            // actively set format to nothing, to allow this to be called more than once
            // and possibly fail the 2nd time
            return this._textureFormatInUse = null;
        }

        public _createTexture(): WebGLTexture {
            return this._gl.createTexture();
        }

        /**
         * Usually called from BABYLON.Texture.ts.  Passed information to create a WebGLTexture.
         * @param {string} urlArg- This contains one of the following:
         *                         1. A conventional http URL, e.g. 'http://...' or 'file://...'
         *                         2. A base64 string of in-line texture data, e.g. 'data:image/jpg;base64,/...'
         *                         3. An indicator that data being passed using the buffer parameter, e.g. 'data:mytexture.jpg'
         *
         * @param {boolean} noMipmap- When true, no mipmaps shall be generated.  Ignored for compressed textures.  They must be in the file.
         * @param {boolean} invertY- When true, image is flipped when loaded.  You probably want true. Ignored for compressed textures.  Must be flipped in the file.
         * @param {Scene} scene- Needed for loading to the correct scene.
         * @param {number} samplingMode- Mode with should be used sample / access the texture.  Default: TRILINEAR
         * @param {callback} onLoad- Optional callback to be called upon successful completion.
         * @param {callback} onError- Optional callback to be called upon failure.
         * @param {ArrayBuffer | HTMLImageElement} buffer- A source of a file previously fetched as either an ArrayBuffer (compressed or image format) or HTMLImageElement (image format)
         * @param {WebGLTexture} fallback- An internal argument in case the function must be called again, due to etc1 not having alpha capabilities.
         * @param {number} format-  Internal format.  Default: RGB when extension is '.jpg' else RGBA.  Ignored for compressed textures.
         *
         * @returns {WebGLTexture} for assignment back into BABYLON.Texture
         */
        public createTexture(urlArg: string, noMipmap: boolean, invertY: boolean, scene: Scene, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, onLoad: () => void = null, onError: () => void = null, buffer: ArrayBuffer | HTMLImageElement = null, fallBack?: InternalTexture, format?: number): InternalTexture {
            var url = String(urlArg); // assign a new string, so that the original is still available in case of fallback
            var fromData = url.substr(0, 5) === "data:";
            var fromBlob = url.substr(0, 5) === "blob:";
            var isBase64 = fromData && url.indexOf("base64") !== -1;

            let texture = fallBack ? fallBack : new InternalTexture(this, InternalTexture.DATASOURCE_URL);

            // establish the file extension, if possible
            var lastDot = url.lastIndexOf('.');
            var extension = (lastDot > 0) ? url.substring(lastDot).toLowerCase() : "";
            var isDDS = this.getCaps().s3tc && (extension === ".dds");
            var isTGA = (extension === ".tga");

            // determine if a ktx file should be substituted
            var isKTX = false;
            if (this._textureFormatInUse && !isBase64 && !fallBack) {
                url = url.substring(0, lastDot) + this._textureFormatInUse;
                isKTX = true;
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

            if (onLoad) {
                texture.onLoadedObservable.add(onLoad);
            }
            if (!fallBack) this._internalTexturesCache.push(texture);

            var onerror = () => {
                if (scene) {
                    scene._removePendingData(texture);
                }

                // fallback for when compressed file not found to try again.  For instance, etc1 does not have an alpha capable type
                if (isKTX) {
                    this.createTexture(urlArg, noMipmap, invertY, scene, samplingMode, null, onError, buffer, texture);
                } else if (onError) {
                    onError();
                }
            };

            var callback: (arrayBuffer: any) => void;

            // processing for non-image formats
            if (isKTX || isTGA || isDDS) {
                if (isKTX) {
                    callback = (data) => {
                        var ktx = new Internals.KhronosTextureContainer(data, 1);

                        this._prepareWebGLTexture(texture, scene, ktx.pixelWidth, ktx.pixelHeight, invertY, false, true, () => {
                            ktx.uploadLevels(this._gl, !noMipmap);
                            return false;
                        }, samplingMode);
                    };
                } else if (isTGA) {
                    callback = (arrayBuffer) => {
                        var data = new Uint8Array(arrayBuffer);

                        var header = Internals.TGATools.GetTGAHeader(data);

                        this._prepareWebGLTexture(texture, scene, header.width, header.height, invertY, noMipmap, false, () => {
                            Internals.TGATools.UploadContent(this._gl, data);
                            return false;
                        }, samplingMode);
                    };

                } else if (isDDS) {
                    callback = (data) => {
                        var info = Internals.DDSTools.GetDDSInfo(data);

                        var loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && !noMipmap && ((info.width >> (info.mipmapCount - 1)) === 1);
                        this._prepareWebGLTexture(texture, scene, info.width, info.height, invertY, !loadMipmap, info.isFourCC, () => {
                            Internals.DDSTools.UploadDDSLevels(this, this._gl, data, info, loadMipmap, 1);
                            return false;
                        }, samplingMode);
                    };
                }

                if (!buffer) {
                    Tools.LoadFile(url, data => {
                        callback(data);
                    }, null, scene ? scene.database : null, true, onerror);
                } else {
                    callback(buffer);
                }
                // image format processing
            } else {
                var onload = (img) => {
                    if (fromBlob && !this._doNotHandleContextLost) {
                        // We need to store the image if we need to rebuild the texture
                        // in case of a webgl context lost
                        texture._buffer = img;
                    }

                    this._prepareWebGLTexture(texture, scene, img.width, img.height, invertY, noMipmap, false, (potWidth, potHeight, continuationCallback) => {
                        let gl = this._gl;
                        var isPot = (img.width === potWidth && img.height === potHeight);
                        let internalFormat = format ? this._getInternalFormat(format) : ((extension === ".jpg") ? gl.RGB : gl.RGBA);

                        if (isPot) {
                            gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, internalFormat, gl.UNSIGNED_BYTE, img);
                            return false;
                        }

                        // Using shaders to rescale because canvas.drawImage is lossy
                        let source = new InternalTexture(this, InternalTexture.DATASOURCE_TEMP);
                        this._bindTextureDirectly(gl.TEXTURE_2D, source);
                        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, internalFormat, gl.UNSIGNED_BYTE, img);

                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                        this._rescaleTexture(source, texture, scene, internalFormat, () => {
                            this._releaseTexture(source);
                            this._bindTextureDirectly(gl.TEXTURE_2D, texture);

                            continuationCallback();
                        });

                        return true;
                    }, samplingMode);
                };

                if (!fromData || isBase64)
                    if (buffer instanceof HTMLImageElement) {
                        onload(buffer);
                    } else {
                        Tools.LoadImage(url, onload, onerror, scene ? scene.database : null);
                    }
                else if (buffer instanceof Array || typeof buffer === "string")
                    Tools.LoadImage(buffer, onload, onerror, scene ? scene.database : null);
                else
                    onload(buffer);
            }

            return texture;
        }

        private _rescaleTexture(source: InternalTexture, destination: InternalTexture, scene: Scene, internalFormat: number, onComplete: () => void): void {
            let rtt = this.createRenderTargetTexture({
                width: destination.width,
                height: destination.height,
            }, {
                    generateMipMaps: false,
                    type: Engine.TEXTURETYPE_UNSIGNED_INT,
                    samplingMode: Texture.BILINEAR_SAMPLINGMODE,
                    generateDepthBuffer: false,
                    generateStencilBuffer: false
                }
            );

            if (!this._rescalePostProcess) {
                this._rescalePostProcess = new BABYLON.PassPostProcess("rescale", 1, null, Texture.BILINEAR_SAMPLINGMODE, this, false, Engine.TEXTURETYPE_UNSIGNED_INT);
            }

            this._rescalePostProcess.getEffect().executeWhenCompiled(() => {
                this._rescalePostProcess.onApply = function (effect) {
                    effect._bindTexture("textureSampler", source);
                }

                let hostingScene = scene;

                if (!hostingScene) {
                    hostingScene = this.scenes[this.scenes.length - 1];
                }
                hostingScene.postProcessManager.directRender([this._rescalePostProcess], rtt);

                this._bindTextureDirectly(this._gl.TEXTURE_2D, destination);
                this._gl.copyTexImage2D(this._gl.TEXTURE_2D, 0, internalFormat, 0, 0, destination.width, destination.height, 0);

                this.unBindFramebuffer(rtt);
                this._releaseTexture(rtt);

                if (onComplete) {
                    onComplete();
                }
            });
        }

        private _getInternalFormat(format: number): number {
            var internalFormat = this._gl.RGBA;
            switch (format) {
                case Engine.TEXTUREFORMAT_ALPHA:
                    internalFormat = this._gl.ALPHA;
                    break;
                case Engine.TEXTUREFORMAT_LUMINANCE:
                    internalFormat = this._gl.LUMINANCE;
                    break;
                case Engine.TEXTUREFORMAT_LUMINANCE_ALPHA:
                    internalFormat = this._gl.LUMINANCE_ALPHA;
                    break;
                case Engine.TEXTUREFORMAT_RGB:
                    internalFormat = this._gl.RGB;
                    break;
                case Engine.TEXTUREFORMAT_RGBA:
                    internalFormat = this._gl.RGBA;
                    break;
            }

            return internalFormat;
        }

        public updateRawTexture(texture: InternalTexture, data: ArrayBufferView, format: number, invertY: boolean, compression: string = null): void {
            var internalFormat = this._getInternalFormat(format);
            this._bindTextureDirectly(this._gl.TEXTURE_2D, texture);
            this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, invertY === undefined ? 1 : (invertY ? 1 : 0));

            if (!this._doNotHandleContextLost) {
                texture._bufferView = data;
                texture.format = format;
                texture.invertY = invertY;
                texture._compression = compression;
            }

            if (texture.width % 4 !== 0) {
                this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, 1);
            }

            if (compression) {
                this._gl.compressedTexImage2D(this._gl.TEXTURE_2D, 0, this.getCaps().s3tc[compression], texture.width, texture.height, 0, data);
            } else {
                this._gl.texImage2D(this._gl.TEXTURE_2D, 0, internalFormat, texture.width, texture.height, 0, internalFormat, this._gl.UNSIGNED_BYTE, data);
            }

            if (texture.generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_2D);
            }
            this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
            this.resetTextureCache();
            texture.isReady = true;
        }

        public createRawTexture(data: ArrayBufferView, width: number, height: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: string = null): InternalTexture {
            var texture = new InternalTexture(this, InternalTexture.DATASOURCE_RAW);
            texture.baseWidth = width;
            texture.baseHeight = height;
            texture.width = width;
            texture.height = height;
            texture.format = format;
            texture.generateMipMaps = generateMipMaps;
            texture.samplingMode = samplingMode;
            texture.invertY = invertY;
            texture._compression = compression;

            if (!this._doNotHandleContextLost) {
                texture._bufferView = data;
            }

            this.updateRawTexture(texture, data, format, invertY, compression);
            this._bindTextureDirectly(this._gl.TEXTURE_2D, texture);

            // Filters
            var filters = getSamplingParameters(samplingMode, generateMipMaps, this._gl);

            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, filters.mag);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, filters.min);

            if (generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_2D);
            }

            this._bindTextureDirectly(this._gl.TEXTURE_2D, null);


            this._internalTexturesCache.push(texture);

            return texture;
        }

        public createDynamicTexture(width: number, height: number, generateMipMaps: boolean, samplingMode: number): InternalTexture {
            var texture = new InternalTexture(this, InternalTexture.DATASOURCE_DYNAMIC)
            texture.baseWidth = width;
            texture.baseHeight = height;

            if (generateMipMaps) {
                width = this.needPOTTextures ? Tools.GetExponentOfTwo(width, this._caps.maxTextureSize) : width;
                height = this.needPOTTextures ? Tools.GetExponentOfTwo(height, this._caps.maxTextureSize) : height;
            }

            this.resetTextureCache();
            texture.width = width;
            texture.height = height;
            texture.isReady = false;
            texture.generateMipMaps = generateMipMaps;
            texture.samplingMode = samplingMode;

            this.updateTextureSamplingMode(samplingMode, texture);

            this._internalTexturesCache.push(texture);

            return texture;
        }

        public updateTextureSamplingMode(samplingMode: number, texture: InternalTexture): void {
            var filters = getSamplingParameters(samplingMode, texture.generateMipMaps, this._gl);

            if (texture.isCube) {
                this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, texture);

                this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_MAG_FILTER, filters.mag);
                this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_MIN_FILTER, filters.min);
                this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
            } else {
                this._bindTextureDirectly(this._gl.TEXTURE_2D, texture);

                this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, filters.mag);
                this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, filters.min);
                this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
            }

            texture.samplingMode = samplingMode;
        }

        public updateDynamicTexture(texture: InternalTexture, canvas: HTMLCanvasElement, invertY: boolean, premulAlpha: boolean = false, format?: number): void {
            this._bindTextureDirectly(this._gl.TEXTURE_2D, texture);
            this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, invertY ? 1 : 0);
            if (premulAlpha) {
                this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
            }
            let internalFormat = format ? this._getInternalFormat(format) : this._gl.RGBA;
            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, internalFormat, internalFormat, this._gl.UNSIGNED_BYTE, canvas);
            if (texture.generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_2D);
            }
            this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
            if (premulAlpha) {
                this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
            }
            this.resetTextureCache();
            texture.isReady = true;
        }

        public updateVideoTexture(texture: InternalTexture, video: HTMLVideoElement, invertY: boolean): void {
            if (texture._isDisabled) {
                return;
            }

            this._bindTextureDirectly(this._gl.TEXTURE_2D, texture);
            this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, invertY ? 0 : 1); // Video are upside down by default

            try {
                // Testing video texture support
                if (this._videoTextureSupported === undefined) {
                    this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, video);

                    if (this._gl.getError() !== 0) {
                        this._videoTextureSupported = false;
                    } else {
                        this._videoTextureSupported = true;
                    }
                }

                // Copy video through the current working canvas if video texture is not supported
                if (!this._videoTextureSupported) {
                    if (!texture._workingCanvas) {
                        texture._workingCanvas = document.createElement("canvas");
                        texture._workingContext = texture._workingCanvas.getContext("2d");
                        texture._workingCanvas.width = texture.width;
                        texture._workingCanvas.height = texture.height;
                    }

                    texture._workingContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, texture.width, texture.height);

                    this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, texture._workingCanvas);
                } else {
                    this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, video);
                }

                if (texture.generateMipMaps) {
                    this._gl.generateMipmap(this._gl.TEXTURE_2D);
                }

                this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
                this.resetTextureCache();
                texture.isReady = true;

            } catch (ex) {
                // Something unexpected
                // Let's disable the texture
                texture._isDisabled = true;
            }
        }

        public createRenderTargetTexture(size: any, options: boolean | RenderTargetCreationOptions): InternalTexture {
            let fullOptions = new RenderTargetCreationOptions();

            if (options !== undefined && typeof options === "object") {
                fullOptions.generateMipMaps = options.generateMipMaps;
                fullOptions.generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
                fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && options.generateStencilBuffer;
                fullOptions.type = options.type === undefined ? Engine.TEXTURETYPE_UNSIGNED_INT : options.type;
                fullOptions.samplingMode = options.samplingMode === undefined ? Texture.TRILINEAR_SAMPLINGMODE : options.samplingMode;
            } else {
                fullOptions.generateMipMaps = <boolean>options;
                fullOptions.generateDepthBuffer = true;
                fullOptions.generateStencilBuffer = false;
                fullOptions.type = Engine.TEXTURETYPE_UNSIGNED_INT;
                fullOptions.samplingMode = Texture.TRILINEAR_SAMPLINGMODE;
            }

            if (fullOptions.type === Engine.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
                // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
                fullOptions.samplingMode = Texture.NEAREST_SAMPLINGMODE;
            }
            else if (fullOptions.type === Engine.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
                // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
                fullOptions.samplingMode = Texture.NEAREST_SAMPLINGMODE;
            }
            var gl = this._gl;

            var texture = new InternalTexture(this, InternalTexture.DATASOURCE_RENDERTARGET);
            this._bindTextureDirectly(gl.TEXTURE_2D, texture);

            var width = size.width || size;
            var height = size.height || size;

            var filters = getSamplingParameters(fullOptions.samplingMode, fullOptions.generateMipMaps, gl);

            if (fullOptions.type === Engine.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
                fullOptions.type = Engine.TEXTURETYPE_UNSIGNED_INT;
                Tools.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
            }

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            gl.texImage2D(gl.TEXTURE_2D, 0, this._getRGBABufferInternalSizedFormat(fullOptions.type), width, height, 0, gl.RGBA, this._getWebGLTextureType(fullOptions.type), null);

            // Create the framebuffer
            var framebuffer = gl.createFramebuffer();
            this.bindUnboundFramebuffer(framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._webGLTexture, 0);

            texture._depthStencilBuffer = this._setupFramebufferDepthAttachments(fullOptions.generateStencilBuffer, fullOptions.generateDepthBuffer, width, height);

            if (fullOptions.generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_2D);
            }

            // Unbind
            this._bindTextureDirectly(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            this.bindUnboundFramebuffer(null);

            texture._framebuffer = framebuffer;
            texture.baseWidth = width;
            texture.baseHeight = height;
            texture.width = width;
            texture.height = height;
            texture.isReady = true;
            texture.samples = 1;
            texture.generateMipMaps = fullOptions.generateMipMaps;
            texture.samplingMode = fullOptions.samplingMode;
            texture.type = fullOptions.type;
            texture._generateDepthBuffer = fullOptions.generateDepthBuffer;
            texture._generateStencilBuffer = fullOptions.generateStencilBuffer;

            this.resetTextureCache();

            this._internalTexturesCache.push(texture);

            return texture;
        }

        public createMultipleRenderTarget(size: any, options): InternalTexture[] {
            var generateMipMaps = false;
            var generateDepthBuffer = true;
            var generateStencilBuffer = false;
            var generateDepthTexture = false;
            var textureCount = 1;

            var defaultType = Engine.TEXTURETYPE_UNSIGNED_INT;
            var defaultSamplingMode = Texture.TRILINEAR_SAMPLINGMODE;

            var types = [], samplingModes = [];

            if (options !== undefined) {
                generateMipMaps = options.generateMipMaps;
                generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
                generateStencilBuffer = options.generateStencilBuffer;
                generateDepthTexture = options.generateDepthTexture;
                textureCount = options.textureCount || 1;

                if (options.types) {
                    types = options.types;
                }
                if (options.samplingModes) {
                    samplingModes = options.samplingModes;
                }

            }
            var gl = this._gl;
            // Create the framebuffer
            var framebuffer = gl.createFramebuffer();
            this.bindUnboundFramebuffer(framebuffer);

            var width = size.width || size;
            var height = size.height || size;
            
            var textures = [];
            var attachments = []

            var depthStencilBuffer = this._setupFramebufferDepthAttachments(generateStencilBuffer, generateDepthBuffer, width, height);

            for (var i = 0; i < textureCount; i++) {
                var samplingMode = samplingModes[i] || defaultSamplingMode;
                var type = types[i] || defaultType;

                if (type === Engine.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
                    // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
                    samplingMode = Texture.NEAREST_SAMPLINGMODE;
                }
                else if (type === Engine.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
                    // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
                    samplingMode = Texture.NEAREST_SAMPLINGMODE;
                }

                var filters = getSamplingParameters(samplingMode, generateMipMaps, gl);
                if (type === Engine.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
                    type = Engine.TEXTURETYPE_UNSIGNED_INT;
                    Tools.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
                }

                var texture = new InternalTexture(this, InternalTexture.DATASOURCE_MULTIRENDERTARGET);
                var attachment = gl[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];
                
                textures.push(texture);
                attachments.push(attachment);

                gl.activeTexture(gl["TEXTURE" + i]);
                gl.bindTexture(gl.TEXTURE_2D, texture._webGLTexture);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                gl.texImage2D(gl.TEXTURE_2D, 0, this._getRGBABufferInternalSizedFormat(type), width, height, 0, gl.RGBA, this._getWebGLTextureType(type), null);

                gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture._webGLTexture, 0);

                if (generateMipMaps) {
                    this._gl.generateMipmap(this._gl.TEXTURE_2D);
                }

                // Unbind
                this._bindTextureDirectly(gl.TEXTURE_2D, null);

                texture._framebuffer = framebuffer;
                texture._depthStencilBuffer = depthStencilBuffer;
                texture.baseWidth = width;
                texture.baseHeight = height;
                texture.width = width;
                texture.height = height;
                texture.isReady = true;
                texture.samples = 1;
                texture.generateMipMaps = generateMipMaps;
                texture.samplingMode = samplingMode;
                texture.type = type;
                texture._generateDepthBuffer = generateDepthBuffer;
                texture._generateStencilBuffer = generateStencilBuffer;

                this._internalTexturesCache.push(texture);
            }

            if (generateDepthTexture && this._caps.depthTextureExtension) {
                // Depth texture
                var depthTexture = new InternalTexture(this, InternalTexture.DATASOURCE_MULTIRENDERTARGET);

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, depthTexture._webGLTexture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    this.webGLVersion < 2 ? gl.DEPTH_COMPONENT : gl.DEPTH_COMPONENT16,
                    width,
                    height,
                    0,
                    gl.DEPTH_COMPONENT,
                    gl.UNSIGNED_SHORT,
                    null
                );

                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER,
                    gl.DEPTH_ATTACHMENT,
                    gl.TEXTURE_2D,
                    depthTexture._webGLTexture,
                    0
                );

                depthTexture._framebuffer = framebuffer;
                depthTexture.baseWidth = width;
                depthTexture.baseHeight = height;
                depthTexture.width = width;
                depthTexture.height = height;
                depthTexture.isReady = true;
                depthTexture.samples = 1;
                depthTexture.generateMipMaps = generateMipMaps;
                depthTexture.samplingMode = gl.NEAREST;
                depthTexture._generateDepthBuffer = generateDepthBuffer;
                depthTexture._generateStencilBuffer = generateStencilBuffer;

                textures.push(depthTexture)
                this._internalTexturesCache.push(depthTexture);
            }

            gl.drawBuffers(attachments);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            this.bindUnboundFramebuffer(null);

            this.resetTextureCache();

            return textures;
        }

        private _setupFramebufferDepthAttachments(generateStencilBuffer: boolean, generateDepthBuffer: boolean, width: number, height: number, samples = 1): WebGLRenderbuffer {
            var depthStencilBuffer: WebGLRenderbuffer = null;
            var gl = this._gl;

            // Create the depth/stencil buffer
            if (generateStencilBuffer) {
                depthStencilBuffer = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, depthStencilBuffer);

                if (samples > 1) {
                    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH24_STENCIL8, width, height);
                } else {
                    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, width, height);
                }

                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depthStencilBuffer);
            }
            else if (generateDepthBuffer) {
                depthStencilBuffer = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, depthStencilBuffer);

                if (samples > 1) {
                    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT16, width, height);
                } else {
                    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
                }

                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthStencilBuffer);
            }

            return depthStencilBuffer;
        }

        public updateRenderTargetTextureSampleCount(texture: InternalTexture, samples: number): number {
            if (this.webGLVersion < 2) {
                return 1;
            }

            if (texture.samples === samples) {
                return samples;
            }

            var gl = this._gl;

            samples = Math.min(samples, gl.getParameter(gl.MAX_SAMPLES));

            // Dispose previous render buffers
            if (texture._depthStencilBuffer) {
                gl.deleteRenderbuffer(texture._depthStencilBuffer);
            }

            if (texture._MSAAFramebuffer) {
                gl.deleteFramebuffer(texture._MSAAFramebuffer);
            }

            if (texture._MSAARenderBuffer) {
                gl.deleteRenderbuffer(texture._MSAARenderBuffer);
            }

            if (samples > 1) {
                texture._MSAAFramebuffer = gl.createFramebuffer();
                this.bindUnboundFramebuffer(texture._MSAAFramebuffer);

                var colorRenderbuffer = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, colorRenderbuffer);
                gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, texture.width, texture.height);

                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colorRenderbuffer);

                texture._MSAARenderBuffer = colorRenderbuffer;
            } else {
                this.bindUnboundFramebuffer(texture._framebuffer);
            }

            texture.samples = samples;
            texture._depthStencilBuffer = this._setupFramebufferDepthAttachments(texture._generateStencilBuffer, texture._generateDepthBuffer, texture.width, texture.height, samples);

            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            this.bindUnboundFramebuffer(null);

            return samples;
        }

        public _uploadDataToTexture(target: number, lod: number, internalFormat: number, width: number, height: number, format: number, type: number, data: ArrayBufferView) {
            this._gl.texImage2D(target, lod, internalFormat, width, height, 0, format, type, data);
        }

        public _uploadCompressedDataToTexture(target: number, lod: number, internalFormat: number, width: number, height: number, data: ArrayBufferView) {
            this._gl.compressedTexImage2D(target, lod, internalFormat, width, height, 0, data);
        }

        public createRenderTargetCubeTexture(size: number, options?: RenderTargetCreationOptions): InternalTexture {
            var gl = this._gl;

            var texture = new InternalTexture(this, InternalTexture.DATASOURCE_RENDERTARGET);

            var generateMipMaps = true;
            var generateDepthBuffer = true;
            var generateStencilBuffer = false;

            var samplingMode = Texture.TRILINEAR_SAMPLINGMODE;
            if (options !== undefined) {
                generateMipMaps = options.generateMipMaps === undefined ? true : options.generateMipMaps;
                generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
                generateStencilBuffer = generateDepthBuffer && options.generateStencilBuffer;

                if (options.samplingMode !== undefined) {
                    samplingMode = options.samplingMode;
                }
            }

            texture.isCube = true;
            texture.generateMipMaps = generateMipMaps;
            texture.samples = 1;
            texture.samplingMode = samplingMode;

            var filters = getSamplingParameters(samplingMode, generateMipMaps, gl);

            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture);

            for (var face = 0; face < 6; face++) {
                gl.texImage2D((gl.TEXTURE_CUBE_MAP_POSITIVE_X + face), 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            }

            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, filters.mag);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, filters.min);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            // Create the framebuffer
            var framebuffer = gl.createFramebuffer();
            this.bindUnboundFramebuffer(framebuffer);

            texture._depthStencilBuffer = this._setupFramebufferDepthAttachments(generateStencilBuffer, generateDepthBuffer, size, size);

            // Mipmaps
            if (texture.generateMipMaps) {
                this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            }

            // Unbind
            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            this.bindUnboundFramebuffer(null);

            texture._framebuffer = framebuffer;
            texture.width = size;
            texture.height = size;
            texture.isReady = true;

            this.resetTextureCache();

            this._internalTexturesCache.push(texture);

            return texture;
        }

        public createPrefilteredCubeTexture(rootUrl: string, scene: Scene, scale: number, offset: number, onLoad: (internalTexture: InternalTexture) => void, onError: () => void = null, format?: number, forcedExtension = null): InternalTexture {
            var callback = (loadData) => {
                if (!loadData) {
                    if (onLoad) {
                        onLoad(null);
                    }
                    return;
                }

                let texture = loadData.texture as InternalTexture;
                texture._dataSource = InternalTexture.DATASOURCE_CUBEPREFILTERED;
                texture._lodGenerationScale = scale;
                texture._lodGenerationOffset = offset;

                if (this._caps.textureLOD) {
                    // Do not add extra process if texture lod is supported.
                    if (onLoad) {
                        onLoad(texture);
                    }
                    return;
                }

                const mipSlices = 3;

                var gl = this._gl;
                const width = loadData.width;
                if (!width) {
                    return;
                }

                const textures: BaseTexture[] = [];
                for (let i = 0; i < mipSlices; i++) {
                    //compute LOD from even spacing in smoothness (matching shader calculation)
                    let smoothness = i / (mipSlices - 1);
                    let roughness = 1 - smoothness;

                    let minLODIndex = offset; // roughness = 0
                    let maxLODIndex = Scalar.Log2(width) * scale + offset; // roughness = 1

                    let lodIndex = minLODIndex + (maxLODIndex - minLODIndex) * roughness;
                    let mipmapIndex = Math.round(Math.min(Math.max(lodIndex, 0), maxLODIndex));

                    var glTextureFromLod = new InternalTexture(this, InternalTexture.DATASOURCE_TEMP);
                    glTextureFromLod.isCube = true;
                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, glTextureFromLod);

                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    if (loadData.isDDS) {
                        var info: Internals.DDSInfo = loadData.info;
                        var data: any = loadData.data;
                        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, info.isCompressed ? 1 : 0);

                        Internals.DDSTools.UploadDDSLevels(this, this._gl, data, info, true, 6, mipmapIndex);
                    }
                    else {
                        Tools.Warn("DDS is the only prefiltered cube map supported so far.")
                    }

                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);

                    // Wrap in a base texture for easy binding.
                    const lodTexture = new BaseTexture(scene);
                    lodTexture.isCube = true;
                    lodTexture._texture = glTextureFromLod;

                    glTextureFromLod.isReady = true;
                    textures.push(lodTexture);
                }

                texture._lodTextureHigh = textures[2];
                texture._lodTextureMid = textures[1];
                texture._lodTextureLow = textures[0];

                if (onLoad) {
                    onLoad(texture);
                }
            };

            return this.createCubeTexture(rootUrl, scene, null, false, callback, onError, format, forcedExtension);
        }

        public createCubeTexture(rootUrl: string, scene: Scene, files: string[], noMipmap?: boolean, onLoad: (data?: any) => void = null, onError: () => void = null, format?: number, forcedExtension = null): InternalTexture {
            var gl = this._gl;

            var texture = new InternalTexture(this, InternalTexture.DATASOURCE_CUBE);
            texture.isCube = true;
            texture.url = rootUrl;
            texture.generateMipMaps = !noMipmap;

            if (!this._doNotHandleContextLost) {
                texture._extension = forcedExtension;
                texture._files = files;
            }

            var isKTX = false;
            var isDDS = false;
            var lastDot = rootUrl.lastIndexOf('.');
            var extension = forcedExtension ? forcedExtension : rootUrl.substring(lastDot).toLowerCase();
            if (this._textureFormatInUse) {
                extension = this._textureFormatInUse;
                rootUrl = rootUrl.substring(0, lastDot) + this._textureFormatInUse;
                isKTX = true;
            } else {
                isDDS = (extension === ".dds");
            }

            if (isKTX) {
                Tools.LoadFile(rootUrl, data => {
                    var ktx = new Internals.KhronosTextureContainer(data, 6);

                    var loadMipmap = ktx.numberOfMipmapLevels > 1 && !noMipmap;

                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

                    ktx.uploadLevels(this._gl, !noMipmap);

                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, loadMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);

                    this.resetTextureCache();

                    texture.width = ktx.pixelWidth;
                    texture.height = ktx.pixelHeight;
                    texture.isReady = true;
                }, null, null, true, onError);
            } else if (isDDS) {
                Tools.LoadFile(rootUrl, data => {
                    var info = Internals.DDSTools.GetDDSInfo(data);

                    var loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && !noMipmap;

                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, info.isCompressed ? 1 : 0);

                    Internals.DDSTools.UploadDDSLevels(this, this._gl, data, info, loadMipmap, 6);

                    if (!noMipmap && !info.isFourCC && info.mipmapCount === 1) {
                        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                    }

                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, loadMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);

                    this.resetTextureCache();

                    texture.width = info.width;
                    texture.height = info.height;
                    texture.isReady = true;
                    texture.type = info.textureType;

                    if (onLoad) {
                        onLoad({ isDDS: true, width: info.width, info, data, texture });
                    }
                }, null, null, true, onError);
            } else {
                cascadeLoad(rootUrl, scene, imgs => {
                    var width = this.needPOTTextures ? Tools.GetExponentOfTwo(imgs[0].width, this._caps.maxCubemapTextureSize) : imgs[0].width;
                    var height = width;

                    this._prepareWorkingCanvas();
                    this._workingCanvas.width = width;
                    this._workingCanvas.height = height;

                    var faces = [
                        gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                    ];

                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

                    let internalFormat = format ? this._getInternalFormat(format) : this._gl.RGBA;
                    for (var index = 0; index < faces.length; index++) {
                        this._workingContext.drawImage(imgs[index], 0, 0, imgs[index].width, imgs[index].height, 0, 0, width, height);
                        gl.texImage2D(faces[index], 0, internalFormat, internalFormat, gl.UNSIGNED_BYTE, this._workingCanvas);
                    }

                    if (!noMipmap) {
                        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                    }

                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, noMipmap ? gl.LINEAR : gl.LINEAR_MIPMAP_LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);

                    this.resetTextureCache();

                    texture.width = width;
                    texture.height = height;
                    texture.isReady = true;
                    texture.format = format;

                    texture.onLoadedObservable.notifyObservers(texture);
                    texture.onLoadedObservable.clear();

                    if (onLoad) {
                        onLoad();
                    }
                }, files, onError);
            }

            this._internalTexturesCache.push(texture);

            return texture;
        }

        public updateRawCubeTexture(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean, compression: string = null, level = 0): void {
            texture._bufferViewArray = data;
            texture.format = format;
            texture.type = type;
            texture.invertY = invertY;
            texture._compression = compression;

            var gl = this._gl;
            var textureType = this._getWebGLTextureType(type);
            var internalFormat = this._getInternalFormat(format);
            var internalSizedFomat = this._getRGBABufferInternalSizedFormat(type);

            var needConversion = false;
            if (internalFormat === gl.RGB) {
                internalFormat = gl.RGBA;
                needConversion = true;
            }

            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, invertY === undefined ? 1 : (invertY ? 1 : 0));

            if (texture.width % 4 !== 0) {
                gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
            }

            // Data are known to be in +X +Y +Z -X -Y -Z
            for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
                let faceData = data[faceIndex];

                if (compression) {
                    gl.compressedTexImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, level, this.getCaps().s3tc[compression], texture.width, texture.height, 0, faceData);
                } else {
                    if (needConversion) {
                        faceData = this._convertRGBtoRGBATextureData(faceData, texture.width, texture.height, type);
                    }
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, level, internalSizedFomat, texture.width, texture.height, 0, internalFormat, textureType, faceData);
                }
            }

            var isPot = !this.needPOTTextures || (Tools.IsExponentOfTwo(texture.width) && Tools.IsExponentOfTwo(texture.height));
            if (isPot && texture.generateMipMaps && level === 0) {
                this._gl.generateMipmap(this._gl.TEXTURE_CUBE_MAP);
            }
            this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);

            this.resetTextureCache();
            texture.isReady = true;
        }

        public createRawCubeTexture(data: ArrayBufferView[], size: number, format: number, type: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: string = null): InternalTexture {
            var gl = this._gl;
            var texture = new InternalTexture(this, InternalTexture.DATASOURCE_CUBERAW);
            texture.isCube = true;
            texture.generateMipMaps = generateMipMaps;
            texture.format = format;
            texture.type = type;
            if (!this._doNotHandleContextLost) {
                texture._bufferViewArray = data;
            }

            var textureType = this._getWebGLTextureType(type);
            var internalFormat = this._getInternalFormat(format);
            var internalSizedFomat = this._getRGBABufferInternalSizedFormat(type);

            var needConversion = false;
            if (internalFormat === gl.RGB) {
                internalFormat = gl.RGBA;
                needConversion = true;
            }

            var width = size;
            var height = width;

            texture.width = width;
            texture.height = height;

            // Double check on POT to generate Mips.
            var isPot = !this.needPOTTextures || (Tools.IsExponentOfTwo(texture.width) && Tools.IsExponentOfTwo(texture.height));
            if (!isPot) {
                generateMipMaps = false;
            }

            // Upload data if needed. The texture won't be ready until then.
            if (data) {
                this.updateRawCubeTexture(texture, data, format, type, invertY, compression);
            }

            this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, texture);

            // Filters
            if (data && generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_CUBE_MAP);
            }

            if (textureType === gl.FLOAT && !this._caps.textureFloatLinearFiltering) {
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            }
            else if (textureType === this._gl.HALF_FLOAT_OES && !this._caps.textureHalfFloatLinearFiltering) {
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            }
            else {
                var filters = getSamplingParameters(samplingMode, generateMipMaps, gl);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, filters.mag);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, filters.min);
            }

            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);

            return texture;
        }

        public createRawCubeTextureFromUrl(url: string, scene: Scene, size: number, format: number, type: number, noMipmap: boolean,
            callback: (ArrayBuffer: ArrayBuffer) => ArrayBufferView[],
            mipmmapGenerator: ((faces: ArrayBufferView[]) => ArrayBufferView[][]),
            onLoad: () => void = null,
            onError: () => void = null,
            samplingMode = Texture.TRILINEAR_SAMPLINGMODE,
            invertY = false): InternalTexture {

            var gl = this._gl;
            var texture = this.createRawCubeTexture(null, size, format, type, !noMipmap, invertY, samplingMode);
            scene._addPendingData(texture);
            texture.url = url;
            this._internalTexturesCache.push(texture);

            var onerror = () => {
                scene._removePendingData(texture);
                if (onError) {
                    onError();
                }
            };

            var internalCallback = (data) => {
                var width = texture.width;
                var height = texture.height;
                var faceDataArrays = callback(data);

                if (mipmmapGenerator) {
                    var textureType = this._getWebGLTextureType(type);
                    var internalFormat = this._getInternalFormat(format);
                    var internalSizedFomat = this._getRGBABufferInternalSizedFormat(type);

                    var needConversion = false;
                    if (internalFormat === gl.RGB) {
                        internalFormat = gl.RGBA;
                        needConversion = true;
                    }

                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, texture);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

                    var mipData = mipmmapGenerator(faceDataArrays);
                    for (var level = 0; level < mipData.length; level++) {
                        var mipSize = width >> level;

                        for (var faceIndex = 0; faceIndex < 6; faceIndex++) {
                            let mipFaceData = mipData[level][faceIndex];
                            if (needConversion) {
                                mipFaceData = this._convertRGBtoRGBATextureData(mipFaceData, mipSize, mipSize, type);
                            }
                            gl.texImage2D(faceIndex, level, internalSizedFomat, mipSize, mipSize, 0, internalFormat, textureType, mipFaceData);
                        }
                    }

                    this._bindTextureDirectly(gl.TEXTURE_CUBE_MAP, null);
                }
                else {
                    texture.generateMipMaps = !noMipmap;
                    this.updateRawCubeTexture(texture, faceDataArrays, format, type, invertY);
                }

                texture.isReady = true;
                this.resetTextureCache();
                scene._removePendingData(texture);

                if (onLoad) {
                    onLoad();
                }
            };

            Tools.LoadFile(url, data => {
                internalCallback(data);
            }, onerror, scene.database, true);

            return texture;
        };

        private _prepareWebGLTextureContinuation(texture: InternalTexture, scene: Scene, noMipmap: boolean, isCompressed: boolean, samplingMode: number): void {
            var gl = this._gl;
            if (!gl) {
                return;
            }

            var filters = getSamplingParameters(samplingMode, !noMipmap, gl);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);

            if (!noMipmap && !isCompressed) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }

            this._bindTextureDirectly(gl.TEXTURE_2D, null);

            this.resetTextureCache();
            if (scene) {
                scene._removePendingData(texture);
            }

            texture.onLoadedObservable.notifyObservers(texture);
            texture.onLoadedObservable.clear();
        }

        private _prepareWebGLTexture(texture: InternalTexture, scene: Scene, width: number, height: number, invertY: boolean, noMipmap: boolean, isCompressed: boolean,
            processFunction: (width: number, height: number, continuationCallback: () => void) => boolean, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE): void {
            var potWidth = this.needPOTTextures ? Tools.GetExponentOfTwo(width, this.getCaps().maxTextureSize) : width;
            var potHeight = this.needPOTTextures ? Tools.GetExponentOfTwo(height, this.getCaps().maxTextureSize) : height;

            var gl = this._gl;
            if (!gl) {
                return;
            }

            this._bindTextureDirectly(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, invertY === undefined ? 1 : (invertY ? 1 : 0));

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

        private _convertRGBtoRGBATextureData(rgbData: ArrayBufferView, width: number, height: number, textureType: number): ArrayBufferView {
            // Create new RGBA data container.
            var rgbaData: ArrayBufferView;
            if (textureType === Engine.TEXTURETYPE_FLOAT) {
                rgbaData = new Float32Array(width * height * 4);
            }
            else {
                rgbaData = new Uint32Array(width * height * 4);
            }

            // Convert each pixel.
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    let index = (y * width + x) * 3;
                    let newIndex = (y * width + x) * 4;

                    // Map Old Value to new value.
                    rgbaData[newIndex + 0] = rgbData[index + 0];
                    rgbaData[newIndex + 1] = rgbData[index + 1];
                    rgbaData[newIndex + 2] = rgbData[index + 2];

                    // Add fully opaque alpha channel.
                    rgbaData[newIndex + 3] = 1;
                }
            }

            return rgbaData;
        }

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

        public _releaseTexture(texture: InternalTexture): void {
            var gl = this._gl;

            this._releaseFramebufferObjects(texture);

            gl.deleteTexture(texture._webGLTexture);

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
        }

        private setProgram(program: WebGLProgram): void {
            if (this._currentProgram !== program) {
                this._gl.useProgram(program);
                this._currentProgram = program;
            }
        }

        public bindSamplers(effect: Effect): void {
            this.setProgram(effect.getProgram());

            var samplers = effect.getSamplers();
            for (var index = 0; index < samplers.length; index++) {
                var uniform = effect.getUniform(samplers[index]);
                this._gl.uniform1i(uniform, index);
            }
            this._currentEffect = null;
        }

        private activateTexture(texture: number): void {
            if (this._activeTexture !== texture) {
                this._gl.activeTexture(texture);
                this._activeTexture = texture;
            }
        }

        public _bindTextureDirectly(target: number, texture: InternalTexture): void {
            if (this._activeTexturesCache[this._activeTexture] !== texture) {
                this._gl.bindTexture(target, texture ? texture._webGLTexture : null);
                this._activeTexturesCache[this._activeTexture] = texture;
            }
        }

        public _bindTexture(channel: number, texture: InternalTexture): void {
            if (channel < 0) {
                return;
            }

            this.activateTexture(this._gl.TEXTURE0 + channel);
            this._bindTextureDirectly(this._gl.TEXTURE_2D, texture);
        }

        public setTextureFromPostProcess(channel: number, postProcess: PostProcess): void {
            this._bindTexture(channel, postProcess._textures.data[postProcess._currentRenderTextureInd]);
        }

        public unbindAllTextures(): void {
            for (var channel = 0; channel < this._caps.maxTexturesImageUnits; channel++) {
                this.activateTexture(this._gl["TEXTURE" + channel]);
                this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
                this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
            }
        }

        public setTexture(channel: number, uniform: WebGLUniformLocation, texture: BaseTexture): void {
            if (channel < 0) {
                return;
            }

            this._gl.uniform1i(uniform, channel);
            this._setTexture(channel, texture);
        }

        private _setTexture(channel: number, texture: BaseTexture): void {
            // Not ready?
            if (!texture) {
                if (this._activeTexturesCache[channel] != null) {
                    this.activateTexture(this._gl["TEXTURE" + channel]);
                    this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
                    this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, null);
                }
                return;
            }

            // Video
            var alreadyActivated = false;
            if ((<VideoTexture>texture).video) {
                this.activateTexture(this._gl["TEXTURE" + channel]);
                alreadyActivated = true;
                (<VideoTexture>texture).update();
            } else if (texture.delayLoadState === Engine.DELAYLOADSTATE_NOTLOADED) { // Delay loading
                texture.delayLoad();
                return;
            }

            var internalTexture = texture.isReady() ? texture.getInternalTexture() :
                (texture.isCube ? this.emptyCubeTexture : this.emptyTexture);

            if (this._activeTexturesCache[channel] === internalTexture) {
                return;
            }

            if (!alreadyActivated) {
                this.activateTexture(this._gl["TEXTURE" + channel]);
            }

            if (internalTexture.isCube) {
                this._bindTextureDirectly(this._gl.TEXTURE_CUBE_MAP, internalTexture);

                if (internalTexture._cachedCoordinatesMode !== texture.coordinatesMode) {
                    internalTexture._cachedCoordinatesMode = texture.coordinatesMode;
                    // CUBIC_MODE and SKYBOX_MODE both require CLAMP_TO_EDGE.  All other modes use REPEAT.
                    var textureWrapMode = (texture.coordinatesMode !== Texture.CUBIC_MODE && texture.coordinatesMode !== Texture.SKYBOX_MODE) ? this._gl.REPEAT : this._gl.CLAMP_TO_EDGE;
                    this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_WRAP_S, textureWrapMode);
                    this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_WRAP_T, textureWrapMode);
                }

                this._setAnisotropicLevel(this._gl.TEXTURE_CUBE_MAP, texture);
            } else {
                this._bindTextureDirectly(this._gl.TEXTURE_2D, internalTexture);

                if (internalTexture._cachedWrapU !== texture.wrapU) {
                    internalTexture._cachedWrapU = texture.wrapU;
                    
                    switch (texture.wrapU) {
                        case Texture.WRAP_ADDRESSMODE:
                            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.REPEAT);
                            break;
                        case Texture.CLAMP_ADDRESSMODE:
                            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
                            break;
                        case Texture.MIRROR_ADDRESSMODE:
                            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.MIRRORED_REPEAT);
                            break;
                    }
                }

                if (internalTexture._cachedWrapV !== texture.wrapV) {
                    internalTexture._cachedWrapV = texture.wrapV;
                    switch (texture.wrapV) {
                        case Texture.WRAP_ADDRESSMODE:
                            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.REPEAT);
                            break;
                        case Texture.CLAMP_ADDRESSMODE:
                            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
                            break;
                        case Texture.MIRROR_ADDRESSMODE:
                            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.MIRRORED_REPEAT);
                            break;
                    }
                }

                this._setAnisotropicLevel(this._gl.TEXTURE_2D, texture);
            }
        }

        public setTextureArray(channel: number, uniform: WebGLUniformLocation, textures: BaseTexture[]): void {
            if (channel < 0) {
                return;
            }

            if (!this._textureUnits || this._textureUnits.length !== textures.length) {
                this._textureUnits = new Int32Array(textures.length);
            }
            for (let i = 0; i < textures.length; i++) {
                this._textureUnits[i] = channel + i;
            }
            this._gl.uniform1iv(uniform, this._textureUnits);

            for (var index = 0; index < textures.length; index++) {
                this._setTexture(channel + index, textures[index]);
            }
        }

        public _setAnisotropicLevel(key: number, texture: BaseTexture) {
            var internalTexture = texture.getInternalTexture();

            if (!internalTexture) {
                return;
            }

            var anisotropicFilterExtension = this._caps.textureAnisotropicFilterExtension;
            var value = texture.anisotropicFilteringLevel;


            if (internalTexture.samplingMode === Texture.NEAREST_SAMPLINGMODE) {
                value = 1;
            }

            if (anisotropicFilterExtension && internalTexture._cachedAnisotropicFilteringLevel !== value) {
                this._gl.texParameterf(key, anisotropicFilterExtension.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(value, this._caps.maxAnisotropy));
                internalTexture._cachedAnisotropicFilteringLevel = value;
            }
        }

        public readPixels(x: number, y: number, width: number, height: number): Uint8Array {
            var data = new Uint8Array(height * width * 4);
            this._gl.readPixels(x, y, width, height, this._gl.RGBA, this._gl.UNSIGNED_BYTE, data);
            return data;
        }

        /**
         * Add an externaly attached data from its key.
         * This method call will fail and return false, if such key already exists.
         * If you don't care and just want to get the data no matter what, use the more convenient getOrAddExternalDataWithFactory() method.
         * @param key the unique key that identifies the data
         * @param data the data object to associate to the key for this Engine instance
         * @return true if no such key were already present and the data was added successfully, false otherwise
         */
        public addExternalData<T>(key: string, data: T): boolean {
            if (!this._externalData) {
                this._externalData = new StringDictionary<Object>();
            }
            return this._externalData.add(key, data);
        }

        /**
         * Get an externaly attached data from its key
         * @param key the unique key that identifies the data
         * @return the associated data, if present (can be null), or undefined if not present
         */
        public getExternalData<T>(key: string): T {
            if (!this._externalData) {
                this._externalData = new StringDictionary<Object>();
            }
            return <T>this._externalData.get(key);
        }

        /**
         * Get an externaly attached data from its key, create it using a factory if it's not already present
         * @param key the unique key that identifies the data
         * @param factory the factory that will be called to create the instance if and only if it doesn't exists
         * @return the associated data, can be null if the factory returned null.
         */
        public getOrAddExternalDataWithFactory<T>(key: string, factory: (k: string) => T): T {
            if (!this._externalData) {
                this._externalData = new StringDictionary<Object>();
            }
            return <T>this._externalData.getOrAddWithFactory(key, factory);
        }

        /**
         * Remove an externaly attached data from the Engine instance
         * @param key the unique key that identifies the data
         * @return true if the data was successfully removed, false if it doesn't exist
         */
        public removeExternalData(key): boolean {
            if (!this._externalData) {
                this._externalData = new StringDictionary<Object>();
            }

            return this._externalData.remove(key);
        }

        public unbindAllAttributes() {
            if (this._mustWipeVertexAttributes) {
                this._mustWipeVertexAttributes = false;

                for (var i = 0; i < this._caps.maxVertexAttribs; i++) {
                    this._gl.disableVertexAttribArray(i);
                    this._vertexAttribArraysEnabled[i] = false;
                    this._currentBufferPointers[i].active = false;
                }
                return;
            }

            for (var i = 0, ul = this._vertexAttribArraysEnabled.length; i < ul; i++) {
                if (i >= this._caps.maxVertexAttribs || !this._vertexAttribArraysEnabled[i]) {
                    continue;
                }

                this._gl.disableVertexAttribArray(i);
                this._vertexAttribArraysEnabled[i] = false;
                this._currentBufferPointers[i].active = false;
            }
        }

        public releaseEffects() {
            for (var name in this._compiledEffects) {
                this._gl.deleteProgram(this._compiledEffects[name]._program);
            }

            this._compiledEffects = {};
        }

        // Dispose
        public dispose(): void {
            this.hideLoadingUI();

            this.stopRenderLoop();

            // Release postProcesses
            while (this.postProcesses.length) {
                this.postProcesses[0].dispose();
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

            // Rescale PP
            if (this._rescalePostProcess) {
                this._rescalePostProcess.dispose();
            }

            // Release scenes
            while (this.scenes.length) {
                this.scenes[0].dispose();
            }

            // Release audio engine
            if (Engine.audioEngine) {
                Engine.audioEngine.dispose();
            }

            // Release effects
            this.releaseEffects();

            // Unbind
            this.unbindAllAttributes();

            if (this._dummyFramebuffer) {
                this._gl.deleteFramebuffer(this._dummyFramebuffer);
            }

            this._gl = null;

            //WebVR
            this.disableVR();

            // Events
            window.removeEventListener("blur", this._onBlur);
            window.removeEventListener("focus", this._onFocus);
            window.removeEventListener('vrdisplaypointerrestricted', this._onVRDisplayPointerRestricted);
            window.removeEventListener('vrdisplaypointerunrestricted', this._onVRDisplayPointerUnrestricted);
            this._renderingCanvas.removeEventListener("focus", this._onCanvasFocus);
            this._renderingCanvas.removeEventListener("blur", this._onCanvasBlur);            
            this._renderingCanvas.removeEventListener("pointerout", this._onCanvasBlur);

            if (!this._doNotHandleContextLost) {
                this._renderingCanvas.removeEventListener("webglcontextlost", this._onContextLost);
                this._renderingCanvas.removeEventListener("webglcontextrestored", this._onContextRestored);
            }
            document.removeEventListener("fullscreenchange", this._onFullscreenChange);
            document.removeEventListener("mozfullscreenchange", this._onFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", this._onFullscreenChange);
            document.removeEventListener("msfullscreenchange", this._onFullscreenChange);
            document.removeEventListener("pointerlockchange", this._onPointerLockChange);
            document.removeEventListener("mspointerlockchange", this._onPointerLockChange);
            document.removeEventListener("mozpointerlockchange", this._onPointerLockChange);
            document.removeEventListener("webkitpointerlockchange", this._onPointerLockChange);

            // Remove from Instances
            var index = Engine.Instances.indexOf(this);

            if (index >= 0) {
                Engine.Instances.splice(index, 1);
            }

            this._workingCanvas = null;
            this._workingContext = null;
            this._currentBufferPointers = null;
            this._renderingCanvas = null;
            this._currentProgram = null;

            this.onResizeObservable.clear();
            this.onCanvasBlurObservable.clear();
            this.onCanvasFocusObservable.clear();
            this.onCanvasPointerOutObservable.clear();

            BABYLON.Effect.ResetCache();
        }

        // Loading screen
        public displayLoadingUI(): void {
            const loadingScreen = this.loadingScreen;
            if (loadingScreen) {
                loadingScreen.displayLoadingUI();
            }
        }

        public hideLoadingUI(): void {
            const loadingScreen = this.loadingScreen;
            if (loadingScreen) {
                loadingScreen.hideLoadingUI();
            }
        }

        public get loadingScreen(): ILoadingScreen {
            if (!this._loadingScreen && DefaultLoadingScreen)
                this._loadingScreen = new DefaultLoadingScreen(this._renderingCanvas)
            return this._loadingScreen;
        }

        public set loadingScreen(loadingScreen: ILoadingScreen) {
            this._loadingScreen = loadingScreen;
        }

        public set loadingUIText(text: string) {
            this.loadingScreen.loadingUIText = text;
        }

        public set loadingUIBackgroundColor(color: string) {
            this.loadingScreen.loadingUIBackgroundColor = color;
        }

        public attachContextLostEvent(callback: ((event: WebGLContextEvent) => void)): void {
            this._renderingCanvas.addEventListener("webglcontextlost", callback, false);
        }

        public attachContextRestoredEvent(callback: ((event: WebGLContextEvent) => void)): void {
            this._renderingCanvas.addEventListener("webglcontextrestored", callback, false);
        }

        public getVertexShaderSource(program: WebGLProgram): string {
            var shaders = this._gl.getAttachedShaders(program);

            return this._gl.getShaderSource(shaders[0]);
        }

        public getFragmentShaderSource(program: WebGLProgram): string {
            var shaders = this._gl.getAttachedShaders(program);

            return this._gl.getShaderSource(shaders[1]);
        }

        public getError(): number {
            return this._gl.getError();
        }

        // FPS
        public getFps(): number {
            return this._fps;
        }

        public getDeltaTime(): number {
            return this._deltaTime;
        }

        private _measureFps(): void {
            this._performanceMonitor.sampleFrame();
            this._fps = this._performanceMonitor.averageFPS;
            this._deltaTime = this._performanceMonitor.instantaneousFrameTime || 0;
        }

        public _readTexturePixels(texture: InternalTexture, width: number, height: number, faceIndex = -1): ArrayBufferView {
            let gl = this._gl;
            if (!this._dummyFramebuffer) {
                this._dummyFramebuffer = gl.createFramebuffer();
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._dummyFramebuffer);

            if (faceIndex > -1) {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, texture._webGLTexture, 0);
            } else {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._webGLTexture, 0);
            }

            let readType = (texture.type !== undefined) ? this._getWebGLTextureType(texture.type) : gl.UNSIGNED_BYTE;
            let buffer: ArrayBufferView;

            switch (readType) {
                case gl.UNSIGNED_BYTE:
                    buffer = new Uint8Array(4 * width * height);
                    readType = gl.UNSIGNED_BYTE;
                    break;
                default:
                    buffer = new Float32Array(4 * width * height);
                    readType = gl.FLOAT;
                    break;
            }

            gl.readPixels(0, 0, width, height, gl.RGBA, readType, buffer);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._currentFramebuffer);

            return buffer;
        }

        private _canRenderToFloatFramebuffer(): boolean {
            if (this._webGLVersion > 1) {
                return this._caps.colorBufferFloat;
            }
            return this._canRenderToFramebuffer(BABYLON.Engine.TEXTURETYPE_FLOAT);
        }

        private _canRenderToHalfFloatFramebuffer(): boolean {
            if (this._webGLVersion > 1) {
                return this._caps.colorBufferFloat;
            }
            return this._canRenderToFramebuffer(BABYLON.Engine.TEXTURETYPE_HALF_FLOAT);
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

        public _getWebGLTextureType(type: number): number {
            if (type === Engine.TEXTURETYPE_FLOAT) {
                return this._gl.FLOAT;
            }
            else if (type === Engine.TEXTURETYPE_HALF_FLOAT) {
                // Add Half Float Constant.
                return this._gl.HALF_FLOAT_OES;
            }

            return this._gl.UNSIGNED_BYTE;
        };

        public _getRGBABufferInternalSizedFormat(type: number): number {
            if (this._webGLVersion === 1) {
                return this._gl.RGBA;
            }

            if (type === Engine.TEXTURETYPE_FLOAT) {
                return this._gl.RGBA32F;
            }
            else if (type === Engine.TEXTURETYPE_HALF_FLOAT) {
                return this._gl.RGBA16F;
            }

            return this._gl.RGBA;
        };

        public createQuery(): WebGLQuery {
            return this._gl.createQuery();
        }

        public deleteQuery(query: WebGLQuery): Engine {
            this._gl.deleteQuery(query);

            return this;
        }

        public isQueryResultAvailable(query: WebGLQuery): boolean {
            return this._gl.getQueryParameter(query, this._gl.QUERY_RESULT_AVAILABLE) as boolean;
        }

        public getQueryResult(query: WebGLQuery): number {
            return this._gl.getQueryParameter(query, this._gl.QUERY_RESULT) as number;
        }

        public beginQuery(algorithmType: number, query: WebGLQuery) {
            var glAlgorithm = this.getGlAlgorithmType(algorithmType);
            this._gl.beginQuery(glAlgorithm, query);
        }

        public endQuery(algorithmType: number): Engine {
            var glAlgorithm = this.getGlAlgorithmType(algorithmType);
            this._gl.endQuery(glAlgorithm);

            return this;
        }

        private getGlAlgorithmType(algorithmType: number): number {
            return algorithmType === AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE ? this._gl.ANY_SAMPLES_PASSED_CONSERVATIVE : this._gl.ANY_SAMPLES_PASSED;
        }

        // Statics
        public static isSupported(): boolean {
            try {
                // Avoid creating an unsized context for CocoonJS, since size determined on first creation.  Is not resizable
                if (navigator.isCocoonJS) {
                    return true;
                }
                var tempcanvas = document.createElement("canvas");
                var gl = tempcanvas.getContext("webgl") || tempcanvas.getContext("experimental-webgl");

                return gl != null && !!window.WebGLRenderingContext;
            } catch (e) {
                return false;
            }
        }
    }
}
