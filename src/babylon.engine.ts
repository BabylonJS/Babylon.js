module BABYLON {
    var compileShader = (gl: WebGLRenderingContext, source: string, type: string, defines: string): WebGLShader => {
        var shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);

        gl.shaderSource(shader, (defines ? defines + "\n" : "") + source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
    };

    var getWebGLTextureType = (gl: WebGLRenderingContext, type: number): number => {
        var textureType = gl.UNSIGNED_BYTE;

        if (type === Engine.TEXTURETYPE_FLOAT)
            textureType = gl.FLOAT;

        return textureType;
    };

    var getSamplingParameters = (samplingMode: number, generateMipMaps: boolean, gl: WebGLRenderingContext): { min: number; mag: number } => {
        var magFilter = gl.NEAREST;
        var minFilter = gl.NEAREST;
        if (samplingMode === Texture.BILINEAR_SAMPLINGMODE) {
            magFilter = gl.LINEAR;
            if (generateMipMaps) {
                minFilter = gl.LINEAR_MIPMAP_NEAREST;
            } else {
                minFilter = gl.LINEAR;
            }
        } else if (samplingMode === Texture.TRILINEAR_SAMPLINGMODE) {
            magFilter = gl.LINEAR;
            if (generateMipMaps) {
                minFilter = gl.LINEAR_MIPMAP_LINEAR;
            } else {
                minFilter = gl.LINEAR;
            }
        } else if (samplingMode === Texture.NEAREST_SAMPLINGMODE) {
            magFilter = gl.NEAREST;
            if (generateMipMaps) {
                minFilter = gl.NEAREST_MIPMAP_LINEAR;
            } else {
                minFilter = gl.NEAREST;
            }
        }

        return {
            min: minFilter,
            mag: magFilter
        }
    }

    var prepareWebGLTexture = (texture: WebGLTexture, gl: WebGLRenderingContext, scene: Scene, width: number, height: number, invertY: boolean, noMipmap: boolean, isCompressed: boolean,
        processFunction: (width: number, height: number) => void, onLoad: () => void, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) => {
        var engine = scene.getEngine();
        var potWidth = Tools.GetExponentOfTwo(width, engine.getCaps().maxTextureSize);
        var potHeight = Tools.GetExponentOfTwo(height, engine.getCaps().maxTextureSize);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, invertY === undefined ? 1 : (invertY ? 1 : 0));

        texture._baseWidth = width;
        texture._baseHeight = height;
        texture._width = potWidth;
        texture._height = potHeight;
        texture.isReady = true;

        processFunction(potWidth, potHeight);

        var filters = getSamplingParameters(samplingMode, !noMipmap, gl);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);

        if (!noMipmap && !isCompressed) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);

        engine.resetTextureCache();
        scene._removePendingData(texture);

        if (onLoad) {
            onLoad();
        }
    };

    var partialLoad = (url: string, index: number, loadedImages: any, scene,
        onfinish: (images: HTMLImageElement[]) => void) => {

        var img: HTMLImageElement;

        var onload = () => {
            loadedImages[index] = img;
            loadedImages._internalCount++;

            scene._removePendingData(img);

            if (loadedImages._internalCount === 6) {
                onfinish(loadedImages);
            }
        };

        var onerror = () => {
            scene._removePendingData(img);
        };

        img = Tools.LoadImage(url, onload, onerror, scene.database);
        scene._addPendingData(img);
    }

    var cascadeLoad = (rootUrl: string, scene,
        onfinish: (images: HTMLImageElement[]) => void, files: string[]) => {

        var loadedImages: any = [];
        loadedImages._internalCount = 0;

        for (var index = 0; index < 6; index++) {
            partialLoad(files[index], index, loadedImages, scene, onfinish);
        }
    };

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

    export class EngineCapabilities {
        public maxTexturesImageUnits: number;
        public maxTextureSize: number;
        public maxCubemapTextureSize: number;
        public maxRenderTextureSize: number;
        public standardDerivatives: boolean;
        public s3tc;
        public textureFloat: boolean;
        public textureAnisotropicFilterExtension;
        public maxAnisotropy: number;
        public instancedArrays;
        public uintIndices: boolean;
        public highPrecisionShaderSupported: boolean;
        public fragmentDepthSupported: boolean;
        public textureFloatLinearFiltering: boolean;
        public textureLOD: boolean;
        public drawBuffersExtension;
    }

    /**
     * The engine class is responsible for interfacing with all lower-level APIs such as WebGL and Audio.
     */
    export class Engine {
        // Const statics
        private static _ALPHA_DISABLE = 0;
        private static _ALPHA_ADD = 1;
        private static _ALPHA_COMBINE = 2;
        private static _ALPHA_SUBTRACT = 3;
        private static _ALPHA_MULTIPLY = 4;
        private static _ALPHA_MAXIMIZED = 5;
        private static _ALPHA_ONEONE = 6;

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

        public static get Version(): string {
            return "2.4.0-alpha";
        }

        // Updatable statics so stick with vars here
        public static CollisionsEpsilon = 0.001;
        public static CodeRepository = "src/";
        public static ShadersRepository = "src/Shaders/";

        // Public members
        public isFullscreen = false;
        public isPointerLock = false;
        public cullBackFaces = true;
        public renderEvenInBackground = true;
        // To enable/disable IDB support and avoid XHR on .manifest
        public enableOfflineSupport = true;
        public scenes = new Array<Scene>();

        // Private Members
        public _gl: WebGLRenderingContext;
        private _renderingCanvas: HTMLCanvasElement;
        private _windowIsBackground = false;
        private _webGLVersion = "1.0";

        public static audioEngine: AudioEngine;

        private _onBlur: () => void;
        private _onFocus: () => void;
        private _onFullscreenChange: () => void;
        private _onPointerLockChange: () => void;

        private _hardwareScalingLevel: number;
        private _caps: EngineCapabilities;
        private _pointerLockRequested: boolean;
        private _alphaTest: boolean;

        private _loadingScreen: ILoadingScreen;

        private _drawCalls = 0;

        private _glVersion: string;
        private _glRenderer: string;
        private _glVendor: string;

        private _videoTextureSupported: boolean;

        private _renderingQueueLaunched = false;
        private _activeRenderLoops = [];

        // FPS
        private fpsRange = 60;
        private previousFramesDuration = [];
        private fps = 60;
        private deltaTime = 0;

        // States
        private _depthCullingState = new Internals._DepthCullingState();
        private _alphaState = new Internals._AlphaState();
        private _alphaMode = Engine.ALPHA_DISABLE;

        // Cache
        private _loadedTexturesCache = new Array<WebGLTexture>();
        private _maxTextureChannels = 16;
        private _activeTexturesCache = new Array<BaseTexture>(this._maxTextureChannels);
        private _currentEffect: Effect;
        private _compiledEffects = {};
        private _vertexAttribArrays: boolean[];
        private _cachedViewport: Viewport;
        private _cachedVertexBuffers: any;
        private _cachedIndexBuffer: WebGLBuffer;
        private _cachedEffectForVertexBuffers: Effect;
        private _currentRenderTarget: WebGLTexture;
        private _uintIndicesCurrentlySet = false;

        private _workingCanvas: HTMLCanvasElement;
        private _workingContext: CanvasRenderingContext2D;

        private _externalData: StringDictionary<Object>;
        private _bindedRenderFunction: any;

        /**
         * @constructor
         * @param {HTMLCanvasElement} canvas - the canvas to be used for rendering
         * @param {boolean} [antialias] - enable antialias
         * @param options - further options to be sent to the getContext function
         */
        constructor(canvas: HTMLCanvasElement, antialias?: boolean, options?: { antialias?: boolean, preserveDrawingBuffer?: boolean, limitDeviceRatio?: number }, adaptToDeviceRatio = true) {
            this._renderingCanvas = canvas;

            this._externalData = new StringDictionary<Object>();

            options = options || {};
            options.antialias = antialias;


            if (options.preserveDrawingBuffer === undefined) {
                options.preserveDrawingBuffer = false;
            }

            // GL
            //try {
            //    this._gl = <WebGLRenderingContext>(canvas.getContext("webgl2", options) || canvas.getContext("experimental-webgl2", options));
            //    if (this._gl) {
            //        this._webGLVersion = "2.0";
            //    }
            //} catch (e) {
            //    // Do nothing
            //}

            if (!this._gl) {
                try {
                    this._gl = <WebGLRenderingContext>(canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options));
                } catch (e) {
                    throw new Error("WebGL not supported");
                }
            }

            if (!this._gl) {
                throw new Error("WebGL not supported");
            }

            this._onBlur = () => {
                this._windowIsBackground = true;
            };

            this._onFocus = () => {
                this._windowIsBackground = false;
            };

            window.addEventListener("blur", this._onBlur);
            window.addEventListener("focus", this._onFocus);

            // Viewport
            var limitDeviceRatio = options.limitDeviceRatio || window.devicePixelRatio || 1.0;
            this._hardwareScalingLevel = adaptToDeviceRatio ? 1.0 / Math.min(limitDeviceRatio, window.devicePixelRatio || 1.0) : 1.0;
            this.resize();

            // Caps
            this._caps = new EngineCapabilities();
            this._caps.maxTexturesImageUnits = this._gl.getParameter(this._gl.MAX_TEXTURE_IMAGE_UNITS);
            this._caps.maxTextureSize = this._gl.getParameter(this._gl.MAX_TEXTURE_SIZE);
            this._caps.maxCubemapTextureSize = this._gl.getParameter(this._gl.MAX_CUBE_MAP_TEXTURE_SIZE);
            this._caps.maxRenderTextureSize = this._gl.getParameter(this._gl.MAX_RENDERBUFFER_SIZE);

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

            // Extensions
            this._caps.standardDerivatives = (this._gl.getExtension('OES_standard_derivatives') !== null);
            this._caps.s3tc = this._gl.getExtension('WEBGL_compressed_texture_s3tc');
            this._caps.textureFloat = (this._gl.getExtension('OES_texture_float') !== null);
            this._caps.textureAnisotropicFilterExtension = this._gl.getExtension('EXT_texture_filter_anisotropic') || this._gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') || this._gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
            this._caps.maxAnisotropy = this._caps.textureAnisotropicFilterExtension ? this._gl.getParameter(this._caps.textureAnisotropicFilterExtension.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;
            this._caps.instancedArrays = this._gl.getExtension('ANGLE_instanced_arrays');
            this._caps.uintIndices = this._gl.getExtension('OES_element_index_uint') !== null;
            this._caps.fragmentDepthSupported = this._gl.getExtension('EXT_frag_depth') !== null;
            this._caps.highPrecisionShaderSupported = true;
            this._caps.drawBuffersExtension = this._gl.getExtension('WEBGL_draw_buffers');
            this._caps.textureFloatLinearFiltering = this._gl.getExtension('OES_texture_float_linear');
            this._caps.textureLOD = this._gl.getExtension('EXT_shader_texture_lod');

            if (this._gl.getShaderPrecisionFormat) {
                var highp = this._gl.getShaderPrecisionFormat(this._gl.FRAGMENT_SHADER, this._gl.HIGH_FLOAT);
                this._caps.highPrecisionShaderSupported = highp.precision !== 0;
            }

            // Depth buffer
            this.setDepthBuffer(true);
            this.setDepthFunctionToLessOrEqual();
            this.setDepthWrite(true);

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

            if (AudioEngine && !Engine.audioEngine) {
                Engine.audioEngine = new AudioEngine();
            }

            //default loading screen
            this._loadingScreen = new DefaultLoadingScreen(this._renderingCanvas);

            Tools.Log("Babylon.js engine (v" + Engine.Version + ") launched");
        }

        public get webGLVersion(): string {
            return this._webGLVersion;
        }

        private _prepareWorkingCanvas(): void {
            if (this._workingCanvas) {
                return;
            }

            this._workingCanvas = document.createElement("canvas");
            this._workingContext = this._workingCanvas.getContext("2d");
        }

        public resetTextureCache() {
            for (var index = 0; index < this._maxTextureChannels; index++) {
                this._activeTexturesCache[index] = null;
            }
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
                return this._currentRenderTarget._width;
            }

            return this._renderingCanvas.width;
        }

        public getRenderHeight(useScreen = false): number {
            if (!useScreen && this._currentRenderTarget) {
                return this._currentRenderTarget._height;
            }

            return this._renderingCanvas.height;
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

        public getLoadedTexturesCache(): WebGLTexture[] {
            return this._loadedTexturesCache;
        }

        public getCaps(): EngineCapabilities {
            return this._caps;
        }

        public get drawCalls(): number {
            return this._drawCalls;
        }

        // Methods
        public resetDrawCalls(): void {
            this._drawCalls = 0;
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

            if (this._activeRenderLoops.length > 0) {
                // Register new frame
                Tools.QueueNewFrame(this._bindedRenderFunction);
            } else {
                this._renderingQueueLaunched = false;
            }
        }

        /**
         * Register and execute a render loop. The engine can have more than one render function.
         * @param {Function} renderFunction - the function to continuesly execute starting the next render loop.
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
                Tools.QueueNewFrame(this._bindedRenderFunction);
            }
        }

        /**
         * Toggle full screen mode.
         * @param {boolean} requestPointerLock - should a pointer lock be requested from the user
         */
        public switchFullscreen(requestPointerLock: boolean): void {
            if (this.isFullscreen) {
                Tools.ExitFullscreen();
            } else {
                this._pointerLockRequested = requestPointerLock;
                Tools.RequestFullscreen(this._renderingCanvas);
            }
        }

        public clear(color: any, backBuffer: boolean, depthStencil: boolean): void {
            this.applyStates();

            if (backBuffer) {
                this._gl.clearColor(color.r, color.g, color.b, color.a !== undefined ? color.a : 1.0);
            }

            if (depthStencil && this._depthCullingState.depthMask) {
                this._gl.clearDepth(1.0);
            }
            var mode = 0;

            if (backBuffer) {
                mode |= this._gl.COLOR_BUFFER_BIT;
            }

            if (depthStencil && this._depthCullingState.depthMask) {
                mode |= this._gl.DEPTH_BUFFER_BIT;
            }

            this._gl.clear(mode);
        }

        /**
         * Set the WebGL's viewport
         * @param {BABYLON.Viewport} viewport - the viewport element to be used.
         * @param {number} [requiredWidth] - the width required for rendering. If not provided the rendering canvas' width is used.
         * @param {number} [requiredHeight] - the height required for rendering. If not provided the rendering canvas' height is used.
         */
        public setViewport(viewport: Viewport, requiredWidth?: number, requiredHeight?: number): void {
            var width = requiredWidth || (navigator.isCocoonJS ? window.innerWidth : this._renderingCanvas.width);
            var height = requiredHeight || (navigator.isCocoonJS ? window.innerHeight : this._renderingCanvas.height);
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
            //this.flushFramebuffer();
        }

        /**
         * resize the view according to the canvas' size.
         * @example
         *   window.addEventListener("resize", function () {
         *      engine.resize();
         *   });
         */
        public resize(): void {
            var width = navigator.isCocoonJS ? window.innerWidth : this._renderingCanvas.clientWidth;
            var height = navigator.isCocoonJS ? window.innerHeight : this._renderingCanvas.clientHeight;

            this.setSize(width / this._hardwareScalingLevel, height / this._hardwareScalingLevel);

            for (var index = 0; index < this.scenes.length; index++) {
                var scene = this.scenes[index];
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer._syncPositions();
                }
            }
        }

        /**
         * force a specific size of the canvas
         * @param {number} width - the new canvas' width
         * @param {number} height - the new canvas' height
         */
        public setSize(width: number, height: number): void {
            this._renderingCanvas.width = width;
            this._renderingCanvas.height = height;

            for (var index = 0; index < this.scenes.length; index++) {
                var scene = this.scenes[index];

                for (var camIndex = 0; camIndex < scene.cameras.length; camIndex++) {
                    var cam = scene.cameras[camIndex];

                    cam._currentRenderId = 0;
                }
            }
        }

        public bindFramebuffer(texture: WebGLTexture, faceIndex?: number, requiredWidth?: number, requiredHeight?: number): void {
            this._currentRenderTarget = texture;

            var gl = this._gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, texture._framebuffer);

            if (texture.isCube) {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, texture, 0);
            } else {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            }

            this._gl.viewport(0, 0, requiredWidth || texture._width, requiredHeight || texture._height);

            this.wipeCaches();
        }

        public unBindFramebuffer(texture: WebGLTexture, disableGenerateMipMaps = false): void {
            this._currentRenderTarget = null;
            if (texture.generateMipMaps && !disableGenerateMipMaps) {
                var gl = this._gl;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.bindTexture(gl.TEXTURE_2D, null);
            }

            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        }

        public generateMipMapsForCubemap(texture: WebGLTexture) {
            if (texture.generateMipMaps) {
                var gl = this._gl;
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
            }
        }

        public flushFramebuffer(): void {
            this._gl.flush();
        }

        public restoreDefaultFramebuffer(): void {
            this._currentRenderTarget = null;
            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);

            this.setViewport(this._cachedViewport);

            this.wipeCaches();
        }

        // VBOs
        private _resetVertexBufferBinding(): void {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
            this._cachedVertexBuffers = null;
        }

        public createVertexBuffer(vertices: number[] | Float32Array): WebGLBuffer {
            var vbo = this._gl.createBuffer();
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);

            if (vertices instanceof Float32Array) {
                this._gl.bufferData(this._gl.ARRAY_BUFFER, <Float32Array>vertices, this._gl.STATIC_DRAW);
            } else {
                this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(<number[]>vertices), this._gl.STATIC_DRAW);
            }

            this._resetVertexBufferBinding();
            vbo.references = 1;
            return vbo;
        }

        public createDynamicVertexBuffer(capacity: number): WebGLBuffer {
            var vbo = this._gl.createBuffer();
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);
            this._gl.bufferData(this._gl.ARRAY_BUFFER, capacity, this._gl.DYNAMIC_DRAW);
            this._resetVertexBufferBinding();
            vbo.references = 1;
            return vbo;
        }

        public updateDynamicVertexBuffer(vertexBuffer: WebGLBuffer, vertices: number[] | Float32Array, offset?: number): void {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer);

            if (offset === undefined) {
                offset = 0;
            }

            if (vertices instanceof Float32Array) {
                this._gl.bufferSubData(this._gl.ARRAY_BUFFER, offset, <Float32Array>vertices);
            } else {
                this._gl.bufferSubData(this._gl.ARRAY_BUFFER, offset, new Float32Array(<number[]>vertices));
            }

            this._resetVertexBufferBinding();
        }

        private _resetIndexBufferBinding(): void {
            this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, null);
            this._cachedIndexBuffer = null;
        }

        public createIndexBuffer(indices: number[] | Int32Array): WebGLBuffer {
            var vbo = this._gl.createBuffer();
            this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, vbo);

            // Check for 32 bits indices
            var arrayBuffer;
            var need32Bits = false;

            if (this._caps.uintIndices) {

                for (var index = 0; index < indices.length; index++) {
                    if (indices[index] > 65535) {
                        need32Bits = true;
                        break;
                    }
                }

                arrayBuffer = need32Bits ? new Uint32Array(indices) : new Uint16Array(indices);
            } else {
                arrayBuffer = new Uint16Array(indices);
            }

            this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, arrayBuffer, this._gl.STATIC_DRAW);
            this._resetIndexBufferBinding();
            vbo.references = 1;
            vbo.is32Bits = need32Bits;
            return vbo;
        }

        public bindBuffers(vertexBuffer: WebGLBuffer, indexBuffer: WebGLBuffer, vertexDeclaration: number[], vertexStrideSize: number, effect: Effect): void {
            if (this._cachedVertexBuffers !== vertexBuffer || this._cachedEffectForVertexBuffers !== effect) {
                this._cachedVertexBuffers = vertexBuffer;
                this._cachedEffectForVertexBuffers = effect;

                this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer);

                var offset = 0;
                for (var index = 0; index < vertexDeclaration.length; index++) {
                    var order = effect.getAttributeLocation(index);

                    if (order >= 0) {
                        this._gl.vertexAttribPointer(order, vertexDeclaration[index], this._gl.FLOAT, false, vertexStrideSize, offset);
                    }
                    offset += vertexDeclaration[index] * 4;
                }
            }

            if (this._cachedIndexBuffer !== indexBuffer) {
                this._cachedIndexBuffer = indexBuffer;
                this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                this._uintIndicesCurrentlySet = indexBuffer.is32Bits;
            }
        }

        public bindMultiBuffers(vertexBuffers: VertexBuffer[], indexBuffer: WebGLBuffer, effect: Effect): void {
            if (this._cachedVertexBuffers !== vertexBuffers || this._cachedEffectForVertexBuffers !== effect) {
                this._cachedVertexBuffers = vertexBuffers;
                this._cachedEffectForVertexBuffers = effect;

                var attributes = effect.getAttributesNames();

                for (var index = 0; index < attributes.length; index++) {
                    var order = effect.getAttributeLocation(index);

                    if (order >= 0) {
                        var vertexBuffer = vertexBuffers[attributes[index]];
                        if (!vertexBuffer) {
                            continue;
                        }
                        var stride = vertexBuffer.getStrideSize();
                        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer.getBuffer());
                        this._gl.vertexAttribPointer(order, stride, this._gl.FLOAT, false, stride * 4, 0);
                    }
                }
            }

            if (indexBuffer != null && this._cachedIndexBuffer !== indexBuffer) {
                this._cachedIndexBuffer = indexBuffer;
                this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                this._uintIndicesCurrentlySet = indexBuffer.is32Bits;
            }
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

            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buffer);
            this._gl.bufferData(this._gl.ARRAY_BUFFER, capacity, this._gl.DYNAMIC_DRAW);
            return buffer;
        }

        public deleteInstancesBuffer(buffer: WebGLBuffer): void {
            this._gl.deleteBuffer(buffer);
        }

        public updateAndBindInstancesBuffer(instancesBuffer: WebGLBuffer, data: Float32Array, offsetLocations: number[] | InstancingAttributeInfo[]): void {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, instancesBuffer);
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
                    this._gl.enableVertexAttribArray(ai.index);
                    this._gl.vertexAttribPointer(ai.index, ai.attributeSize, ai.attribyteType || this._gl.FLOAT, ai.normalized || false, stride, ai.offset);
                    this._caps.instancedArrays.vertexAttribDivisorANGLE(ai.index, 1);
                }
            } else {
                for (let index = 0; index < 4; index++) {
                    let offsetLocation = <number>offsetLocations[index];
                    this._gl.enableVertexAttribArray(offsetLocation);
                    this._gl.vertexAttribPointer(offsetLocation, 4, this._gl.FLOAT, false, 64, index * 16);
                    this._caps.instancedArrays.vertexAttribDivisorANGLE(offsetLocation, 1);
                }
            }
        }

        public unBindInstancesBuffer(instancesBuffer: WebGLBuffer, offsetLocations: number[] | InstancingAttributeInfo[]): void {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, instancesBuffer);
            if ((<any>offsetLocations[0]).index !== undefined) {
                for (let i = 0; i < offsetLocations.length; i++) {
                    let ai = <InstancingAttributeInfo>offsetLocations[i];
                    this._gl.disableVertexAttribArray(ai.index);
                    this._caps.instancedArrays.vertexAttribDivisorANGLE(ai.index, 0);
                }
            } else {
                for (let index = 0; index < 4; index++) {
                    let offsetLocation = <number>offsetLocations[index];
                    this._gl.disableVertexAttribArray(offsetLocation);
                    this._caps.instancedArrays.vertexAttribDivisorANGLE(offsetLocation, 0);
                }
            }
        }

        public applyStates() {
            this._depthCullingState.apply(this._gl);
            this._alphaState.apply(this._gl);
        }

        public draw(useTriangles: boolean, indexStart: number, indexCount: number, instancesCount?: number): void {
            // Apply states
            this.applyStates();

            this._drawCalls++;
            // Render
            var indexFormat = this._uintIndicesCurrentlySet ? this._gl.UNSIGNED_INT : this._gl.UNSIGNED_SHORT;
            var mult = this._uintIndicesCurrentlySet ? 4 : 2;
            if (instancesCount) {
                this._caps.instancedArrays.drawElementsInstancedANGLE(useTriangles ? this._gl.TRIANGLES : this._gl.LINES, indexCount, indexFormat, indexStart * mult, instancesCount);
                return;
            }

            this._gl.drawElements(useTriangles ? this._gl.TRIANGLES : this._gl.LINES, indexCount, indexFormat, indexStart * mult);
        }

        public drawPointClouds(verticesStart: number, verticesCount: number, instancesCount?: number): void {
            // Apply states
            this.applyStates();
            this._drawCalls++;

            if (instancesCount) {
                this._caps.instancedArrays.drawArraysInstancedANGLE(this._gl.POINTS, verticesStart, verticesCount, instancesCount);
                return;
            }

            this._gl.drawArrays(this._gl.POINTS, verticesStart, verticesCount);
        }

        public drawUnIndexed(useTriangles: boolean, verticesStart: number, verticesCount: number, instancesCount?: number): void {
            // Apply states
            this.applyStates();
            this._drawCalls++;

            if (instancesCount) {
                this._caps.instancedArrays.drawArraysInstancedANGLE(useTriangles ? this._gl.TRIANGLES : this._gl.LINES, verticesStart, verticesCount, instancesCount);
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

        public createEffect(baseName: any, attributesNames: string[], uniformsNames: string[], samplers: string[], defines: string, fallbacks?: EffectFallbacks,
            onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void, indexParameters?: any): Effect {
            var vertex = baseName.vertexElement || baseName.vertex || baseName;
            var fragment = baseName.fragmentElement || baseName.fragment || baseName;

            var name = vertex + "+" + fragment + "@" + defines;
            if (this._compiledEffects[name]) {
                return this._compiledEffects[name];
            }

            var effect = new Effect(baseName, attributesNames, uniformsNames, samplers, this, defines, fallbacks, onCompiled, onError, indexParameters);
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

        public createShaderProgram(vertexCode: string, fragmentCode: string, defines: string): WebGLProgram {
            var vertexShader = compileShader(this._gl, vertexCode, "vertex", defines);
            var fragmentShader = compileShader(this._gl, fragmentCode, "fragment", defines);

            var shaderProgram = this._gl.createProgram();
            this._gl.attachShader(shaderProgram, vertexShader);
            this._gl.attachShader(shaderProgram, fragmentShader);

            this._gl.linkProgram(shaderProgram);

            var linked = this._gl.getProgramParameter(shaderProgram, this._gl.LINK_STATUS);

            if (!linked) {
                var error = this._gl.getProgramInfoLog(shaderProgram);
                if (error) {
                    throw new Error(error);
                }
            }

            this._gl.deleteShader(vertexShader);
            this._gl.deleteShader(fragmentShader);

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
            if (!effect || !effect.getAttributesCount() || this._currentEffect === effect) {

                if (effect && effect.onBind) {
                    effect.onBind(effect);
                }
                return;
            }

            this._vertexAttribArrays = this._vertexAttribArrays || [];

            // Use program
            this._gl.useProgram(effect.getProgram());

            for (var i in this._vertexAttribArrays) {
                //make sure this is a number)
                var iAsNumber = +i;
                if (iAsNumber > this._gl.VERTEX_ATTRIB_ARRAY_ENABLED || !this._vertexAttribArrays[iAsNumber]) {
                    continue;
                }
                this._vertexAttribArrays[iAsNumber] = false;
                this._gl.disableVertexAttribArray(iAsNumber);
            }

            var attributesCount = effect.getAttributesCount();
            for (var index = 0; index < attributesCount; index++) {
                // Attributes
                var order = effect.getAttributeLocation(index);

                if (order >= 0) {
                    this._vertexAttribArrays[order] = true;
                    this._gl.enableVertexAttribArray(order);
                }
            }

            this._currentEffect = effect;

            if (effect.onBind) {
                effect.onBind(effect);
            }
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
            this._depthCullingState.zOffset = zOffset;
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
        }

        public setAlphaMode(mode: number): void {
            if (this._alphaMode === mode) {
                return;
            }

            switch (mode) {
                case Engine.ALPHA_DISABLE:
                    this.setDepthWrite(true);
                    this._alphaState.alphaBlend = false;
                    break;
                case Engine.ALPHA_COMBINE:
                    this.setDepthWrite(false);
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_ONEONE:
                    this.setDepthWrite(false);
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE, this._gl.ZERO, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_ADD:
                    this.setDepthWrite(false);
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE, this._gl.ZERO, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_SUBTRACT:
                    this.setDepthWrite(false);
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.ZERO, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_MULTIPLY:
                    this.setDepthWrite(false);
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.DST_COLOR, this._gl.ZERO, this._gl.ONE, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case Engine.ALPHA_MAXIMIZED:
                    this.setDepthWrite(false);
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
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
            return this._alphaTest;
        }

        // Textures
        public wipeCaches(): void {
            this.resetTextureCache();
            this._currentEffect = null;

            this._depthCullingState.reset();
            this._alphaState.reset();

            this._cachedVertexBuffers = null;
            this._cachedIndexBuffer = null;
            this._cachedEffectForVertexBuffers = null;
        }

        public setSamplingMode(texture: WebGLTexture, samplingMode: number): void {
            var gl = this._gl;

            gl.bindTexture(gl.TEXTURE_2D, texture);

            var magFilter = gl.NEAREST;
            var minFilter = gl.NEAREST;

            if (samplingMode === Texture.BILINEAR_SAMPLINGMODE) {
                magFilter = gl.LINEAR;
                minFilter = gl.LINEAR;
            } else if (samplingMode === Texture.TRILINEAR_SAMPLINGMODE) {
                magFilter = gl.LINEAR;
                minFilter = gl.LINEAR_MIPMAP_LINEAR;
            }

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);

            gl.bindTexture(gl.TEXTURE_2D, null);

            texture.samplingMode = samplingMode;
        }

        public createTexture(url: string, noMipmap: boolean, invertY: boolean, scene: Scene, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, onLoad: () => void = null, onError: () => void = null, buffer: any = null): WebGLTexture {
            var texture = this._gl.createTexture();

            var extension: string;
            var fromData: any = false;
            if (url.substr(0, 5) === "data:") {
                fromData = true;
            }

            if (!fromData)
                extension = url.substr(url.length - 4, 4).toLowerCase();
            else {
                var oldUrl = url;
                fromData = oldUrl.split(':');
                url = oldUrl;
                extension = fromData[1].substr(fromData[1].length - 4, 4).toLowerCase();
            }

            var isDDS = this.getCaps().s3tc && (extension === ".dds");
            var isTGA = (extension === ".tga");

            scene._addPendingData(texture);
            texture.url = url;
            texture.noMipmap = noMipmap;
            texture.references = 1;
            texture.samplingMode = samplingMode;
            this._loadedTexturesCache.push(texture);

            var onerror = () => {
                scene._removePendingData(texture);

                if (onError) {
                    onError();
                }
            };
            var callback: (arrayBuffer: any) => void;
            if (isTGA) {
                callback = (arrayBuffer) => {
                    var data = new Uint8Array(arrayBuffer);

                    var header = Internals.TGATools.GetTGAHeader(data);

                    prepareWebGLTexture(texture, this._gl, scene, header.width, header.height, invertY, noMipmap, false, () => {
                        Internals.TGATools.UploadContent(this._gl, data);
                    }, onLoad, samplingMode);
                };
                if (!(fromData instanceof Array))
                    Tools.LoadFile(url, arrayBuffer => {
                        callback(arrayBuffer);
                    }, onerror, scene.database, true);
                else
                    callback(buffer);

            } else if (isDDS) {
                callback = (data) => {
                    var info = Internals.DDSTools.GetDDSInfo(data);

                    var loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && !noMipmap && ((info.width >> (info.mipmapCount - 1)) === 1);
                    prepareWebGLTexture(texture, this._gl, scene, info.width, info.height, invertY, !loadMipmap, info.isFourCC, () => {

                        Internals.DDSTools.UploadDDSLevels(this._gl, this.getCaps().s3tc, data, info, loadMipmap, 1);
                    }, onLoad, samplingMode);
                };

                if (!(fromData instanceof Array))
                    Tools.LoadFile(url, data => {
                        callback(data);
                    }, onerror, scene.database, true);
                else
                    callback(buffer);

            } else {
                var onload = (img) => {
                    prepareWebGLTexture(texture, this._gl, scene, img.width, img.height, invertY, noMipmap, false, (potWidth, potHeight) => {
                        var isPot = (img.width === potWidth && img.height === potHeight);
                        if (!isPot) {
                            this._prepareWorkingCanvas();
                            this._workingCanvas.width = potWidth;
                            this._workingCanvas.height = potHeight;

                            if (samplingMode === Texture.NEAREST_SAMPLINGMODE) {
                                this._workingContext.imageSmoothingEnabled = false;
                                this._workingContext.mozImageSmoothingEnabled = false;
                                this._workingContext.oImageSmoothingEnabled = false;
                                this._workingContext.webkitImageSmoothingEnabled = false;
                                this._workingContext.msImageSmoothingEnabled = false;
                            }

                            this._workingContext.drawImage(img, 0, 0, img.width, img.height, 0, 0, potWidth, potHeight);

                            if (samplingMode === Texture.NEAREST_SAMPLINGMODE) {
                                this._workingContext.imageSmoothingEnabled = true;
                                this._workingContext.mozImageSmoothingEnabled = true;
                                this._workingContext.oImageSmoothingEnabled = true;
                                this._workingContext.webkitImageSmoothingEnabled = true;
                                this._workingContext.msImageSmoothingEnabled = true;
                            }
                        }

                        this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, isPot ? img : this._workingCanvas);
                    }, onLoad, samplingMode);
                };


                if (!(fromData instanceof Array))
                    Tools.LoadImage(url, onload, onerror, scene.database);
                else
                    Tools.LoadImage(buffer, onload, onerror, scene.database);
            }

            return texture;
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

        public updateRawTexture(texture: WebGLTexture, data: ArrayBufferView, format: number, invertY: boolean, compression: string = null): void {
            var internalFormat = this._getInternalFormat(format);
            this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
            this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, invertY === undefined ? 1 : (invertY ? 1 : 0));            

            if (compression) {
                this._gl.compressedTexImage2D(this._gl.TEXTURE_2D, 0, this.getCaps().s3tc[compression], texture._width, texture._height, 0, data);
            } else {
                this._gl.texImage2D(this._gl.TEXTURE_2D, 0, internalFormat, texture._width, texture._height, 0, internalFormat, this._gl.UNSIGNED_BYTE, data);
            }

            if (texture.generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_2D);
            }
            this._gl.bindTexture(this._gl.TEXTURE_2D, null);
            this.resetTextureCache();
            texture.isReady = true;
        }

        public createRawTexture(data: ArrayBufferView, width: number, height: number, format: number, generateMipMaps: boolean, invertY: boolean, samplingMode: number, compression: string = null): WebGLTexture {
            var texture = this._gl.createTexture();
            texture._baseWidth = width;
            texture._baseHeight = height;
            texture._width = width;
            texture._height = height;
            texture.references = 1;

            this.updateRawTexture(texture, data, format, invertY, compression);
            this._gl.bindTexture(this._gl.TEXTURE_2D, texture);

            // Filters
            var filters = getSamplingParameters(samplingMode, generateMipMaps, this._gl);

            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, filters.mag);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, filters.min);
            this._gl.bindTexture(this._gl.TEXTURE_2D, null);

            texture.samplingMode = samplingMode;

            this._loadedTexturesCache.push(texture);

            return texture;
        }

        public createDynamicTexture(width: number, height: number, generateMipMaps: boolean, samplingMode: number, forceExponantOfTwo = true): WebGLTexture {
            var texture = this._gl.createTexture();
            texture._baseWidth = width;
            texture._baseHeight = height;

            if (forceExponantOfTwo) {
                width = Tools.GetExponentOfTwo(width, this._caps.maxTextureSize);
                height = Tools.GetExponentOfTwo(height, this._caps.maxTextureSize);
            }

            this.resetTextureCache();
            texture._width = width;
            texture._height = height;
            texture.isReady = false;
            texture.generateMipMaps = generateMipMaps;
            texture.references = 1;
            texture.samplingMode = samplingMode;

            this.updateTextureSamplingMode(samplingMode, texture);

            this._loadedTexturesCache.push(texture);

            return texture;
        }

        public updateTextureSamplingMode(samplingMode: number, texture: WebGLTexture): void {
            var filters = getSamplingParameters(samplingMode, texture.generateMipMaps, this._gl);

            if (texture.isCube) {
                this._gl.bindTexture(this._gl.TEXTURE_CUBE_MAP, texture);

                this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_MAG_FILTER, filters.mag);
                this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_MIN_FILTER, filters.min);
                this._gl.bindTexture(this._gl.TEXTURE_CUBE_MAP, null);
            } else {
                this._gl.bindTexture(this._gl.TEXTURE_2D, texture);

                this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, filters.mag);
                this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, filters.min);
                this._gl.bindTexture(this._gl.TEXTURE_2D, null);
            }
        }

        public updateDynamicTexture(texture: WebGLTexture, canvas: HTMLCanvasElement, invertY: boolean, premulAlpha: boolean = false): void {
            this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
            this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, invertY ? 1 : 0);
            if (premulAlpha) {
                this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
            }
            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, canvas);
            if (texture.generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_2D);
            }
            this._gl.bindTexture(this._gl.TEXTURE_2D, null);
            this.resetTextureCache();
            texture.isReady = true;
        }

        public updateVideoTexture(texture: WebGLTexture, video: HTMLVideoElement, invertY: boolean): void {
            if (texture._isDisabled) {
                return;
            }

            this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
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
                        texture._workingCanvas.width = texture._width;
                        texture._workingCanvas.height = texture._height;
                    }

                    texture._workingContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, texture._width, texture._height);

                    this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, texture._workingCanvas);
                } else {
                    this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, video);
                }

                if (texture.generateMipMaps) {
                    this._gl.generateMipmap(this._gl.TEXTURE_2D);
                }

                this._gl.bindTexture(this._gl.TEXTURE_2D, null);
                this.resetTextureCache();
                texture.isReady = true;

            } catch (ex) {
                // Something unexpected
                // Let's disable the texture
                texture._isDisabled = true;
            }
        }

        public createRenderTargetTexture(size: any, options): WebGLTexture {
            // old version had a "generateMipMaps" arg instead of options.
            // if options.generateMipMaps is undefined, consider that options itself if the generateMipmaps value
            // in the same way, generateDepthBuffer is defaulted to true
            var generateMipMaps = false;
            var generateDepthBuffer = true;
            var type = Engine.TEXTURETYPE_UNSIGNED_INT;
            var samplingMode = Texture.TRILINEAR_SAMPLINGMODE;
            if (options !== undefined) {
                generateMipMaps = options.generateMipMaps === undefined ? options : options.generateMipMaps;
                generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
                type = options.type === undefined ? type : options.type;
                if (options.samplingMode !== undefined) {
                    samplingMode = options.samplingMode;
                }
                if (type === Engine.TEXTURETYPE_FLOAT) {
                    // if floating point (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
                    samplingMode = Texture.NEAREST_SAMPLINGMODE;
                }
            }
            var gl = this._gl;

            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            var width = size.width || size;
            var height = size.height || size;

            var filters = getSamplingParameters(samplingMode, generateMipMaps, gl);

            if (type === Engine.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
                type = Engine.TEXTURETYPE_UNSIGNED_INT;
                Tools.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
            }

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, getWebGLTextureType(gl, type), null);

            var depthBuffer: WebGLRenderbuffer;
            // Create the depth buffer
            if (generateDepthBuffer) {
                depthBuffer = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
            }
            // Create the framebuffer
            var framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            if (generateDepthBuffer) {
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
            }

            if (generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_2D);
            }

            // Unbind
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            texture._framebuffer = framebuffer;
            if (generateDepthBuffer) {
                texture._depthBuffer = depthBuffer;
            }
            texture._width = width;
            texture._height = height;
            texture.isReady = true;
            texture.generateMipMaps = generateMipMaps;
            texture.references = 1;
            texture.samplingMode = samplingMode;
            this.resetTextureCache();

            this._loadedTexturesCache.push(texture);

            return texture;
        }

        public createRenderTargetCubeTexture(size: number, options?: any): WebGLTexture {
            var gl = this._gl;

            var texture = gl.createTexture();

            var generateMipMaps = true;
            var samplingMode = Texture.TRILINEAR_SAMPLINGMODE;
            if (options !== undefined) {
                generateMipMaps = options.generateMipMaps === undefined ? options : options.generateMipMaps;
                if (options.samplingMode !== undefined) {
                    samplingMode = options.samplingMode;
                }
            }

            texture.isCube = true;
            texture.references = 1;
            texture.generateMipMaps = generateMipMaps;
            texture.references = 1;
            texture.samplingMode = samplingMode;

            var filters = getSamplingParameters(samplingMode, generateMipMaps, gl);

            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

            for (var face = 0; face < 6; face++) {
                gl.texImage2D((gl.TEXTURE_CUBE_MAP_POSITIVE_X + face), 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            }

            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, filters.mag);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, filters.min);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            // Create the depth buffer
            var depthBuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size, size);

            // Create the framebuffer
            var framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

            // Mipmaps
            if (texture.generateMipMaps) {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            }

            // Unbind
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            texture._framebuffer = framebuffer;
            texture._depthBuffer = depthBuffer;

            this.resetTextureCache();

            texture._width = size;
            texture._height = size;
            texture.isReady = true;

            return texture;
        }

        public createCubeTexture(rootUrl: string, scene: Scene, files: string[], noMipmap?: boolean): WebGLTexture {
            var gl = this._gl;

            var texture = gl.createTexture();
            texture.isCube = true;
            texture.url = rootUrl;
            texture.references = 1;

            var extension = rootUrl.substr(rootUrl.length - 4, 4).toLowerCase();
            var isDDS = this.getCaps().s3tc && (extension === ".dds");

            if (isDDS) {
                Tools.LoadFile(rootUrl, data => {
                    var info = Internals.DDSTools.GetDDSInfo(data);

                    var loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && !noMipmap;

                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

                    Internals.DDSTools.UploadDDSLevels(this._gl, this.getCaps().s3tc, data, info, loadMipmap, 6);

                    if (!noMipmap && !info.isFourCC && info.mipmapCount === 1) {
                        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                    }

                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, loadMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

                    this.resetTextureCache();

                    texture._width = info.width;
                    texture._height = info.height;
                    texture.isReady = true;
                }, null, null, true);
            } else {
                cascadeLoad(rootUrl, scene, imgs => {
                    var width = Tools.GetExponentOfTwo(imgs[0].width, this._caps.maxCubemapTextureSize);
                    var height = width;

                    this._prepareWorkingCanvas();
                    this._workingCanvas.width = width;
                    this._workingCanvas.height = height;

                    var faces = [
                        gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                    ];

                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

                    for (var index = 0; index < faces.length; index++) {
                        this._workingContext.drawImage(imgs[index], 0, 0, imgs[index].width, imgs[index].height, 0, 0, width, height);
                        gl.texImage2D(faces[index], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._workingCanvas);
                    }

                    if (!noMipmap) {
                        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                    }

                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, noMipmap ? gl.LINEAR : gl.LINEAR_MIPMAP_LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

                    this.resetTextureCache();

                    texture._width = width;
                    texture._height = height;
                    texture.isReady = true;
                }, files);
            }

            return texture;
        }

        public updateTextureSize(texture: WebGLTexture, width: number, height: number) {
            texture._width = width;
            texture._height = height;
            texture._size = width * height;
            texture._baseWidth = width;
            texture._baseHeight = height;
        }

        public createRawCubeTexture(url: string, scene: Scene, size: number, format: number, type: number, noMipmap: boolean,
            callback: (ArrayBuffer) => ArrayBufferView[],
            mipmmapGenerator: ((faces: ArrayBufferView[]) => ArrayBufferView[][])): WebGLTexture {
            var gl = this._gl;
            var texture = gl.createTexture();
            scene._addPendingData(texture);
            texture.isCube = true;
            texture.references = 1;
            texture.url = url;

            var internalFormat = this._getInternalFormat(format);

            var textureType = gl.UNSIGNED_BYTE;
            if (type === Engine.TEXTURETYPE_FLOAT) {
                textureType = gl.FLOAT;
            }

            var width = size;
            var height = width;
            var isPot = (Tools.IsExponentOfTwo(width) && Tools.IsExponentOfTwo(height));

            texture._width = width;
            texture._height = height;

            var onerror = () => {
                scene._removePendingData(texture);
            };

            var internalCallback = (data) => {
                var rgbeDataArrays = callback(data);

                var facesIndex = [
                    gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                    gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                ];

                width = texture._width;
                height = texture._height;
                isPot = (Tools.IsExponentOfTwo(width) && Tools.IsExponentOfTwo(height));

                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

                if (!noMipmap && isPot) {
                    if (mipmmapGenerator) {

                        var arrayTemp: ArrayBufferView[] = [];
                        // Data are known to be in +X +Y +Z -X -Y -Z
                        // mipmmapGenerator data is expected to be order in +X -X +Y -Y +Z -Z
                        arrayTemp.push(rgbeDataArrays[0]); // +X
                        arrayTemp.push(rgbeDataArrays[3]); // -X
                        arrayTemp.push(rgbeDataArrays[1]); // +Y
                        arrayTemp.push(rgbeDataArrays[4]); // -Y
                        arrayTemp.push(rgbeDataArrays[2]); // +Z
                        arrayTemp.push(rgbeDataArrays[5]); // -Z

                        var mipData = mipmmapGenerator(arrayTemp);
                        for (var level = 0; level < mipData.length; level++) {
                            var mipSize = width >> level;

                            // mipData is order in +X -X +Y -Y +Z -Z
                            gl.texImage2D(facesIndex[0], level, internalFormat, mipSize, mipSize, 0, internalFormat, textureType, mipData[level][0]);
                            gl.texImage2D(facesIndex[1], level, internalFormat, mipSize, mipSize, 0, internalFormat, textureType, mipData[level][2]);
                            gl.texImage2D(facesIndex[2], level, internalFormat, mipSize, mipSize, 0, internalFormat, textureType, mipData[level][4]);
                            gl.texImage2D(facesIndex[3], level, internalFormat, mipSize, mipSize, 0, internalFormat, textureType, mipData[level][1]);
                            gl.texImage2D(facesIndex[4], level, internalFormat, mipSize, mipSize, 0, internalFormat, textureType, mipData[level][3]);
                            gl.texImage2D(facesIndex[5], level, internalFormat, mipSize, mipSize, 0, internalFormat, textureType, mipData[level][5]);
                        }
                    }
                    else {
                        // Data are known to be in +X +Y +Z -X -Y -Z
                        for (var index = 0; index < facesIndex.length; index++) {
                            var faceData = rgbeDataArrays[index];
                            gl.texImage2D(facesIndex[index], 0, internalFormat, width, height, 0, internalFormat, textureType, faceData);
                        }

                        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                    }
                }
                else {
                    noMipmap = true;
                }

                if (textureType == gl.FLOAT && !this._caps.textureFloatLinearFiltering) {
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                }
                else {
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, noMipmap ? gl.LINEAR : gl.LINEAR_MIPMAP_LINEAR);
                }

                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

                texture.isReady = true;

                this.resetTextureCache();
                scene._removePendingData(texture);
            };

            Tools.LoadFile(url, data => {
                internalCallback(data);
            }, onerror, scene.database, true);

            return texture;
        };

        public _releaseTexture(texture: WebGLTexture): void {
            var gl = this._gl;

            if (texture._framebuffer) {
                gl.deleteFramebuffer(texture._framebuffer);
            }

            if (texture._depthBuffer) {
                gl.deleteRenderbuffer(texture._depthBuffer);
            }

            gl.deleteTexture(texture);

            // Unbind channels
            this.unbindAllTextures();

            var index = this._loadedTexturesCache.indexOf(texture);
            if (index !== -1) {
                this._loadedTexturesCache.splice(index, 1);
            }
        }

        public bindSamplers(effect: Effect): void {
            this._gl.useProgram(effect.getProgram());
            var samplers = effect.getSamplers();
            for (var index = 0; index < samplers.length; index++) {
                var uniform = effect.getUniform(samplers[index]);
                this._gl.uniform1i(uniform, index);
            }
            this._currentEffect = null;
        }


        public _bindTexture(channel: number, texture: WebGLTexture): void {
            this._gl.activeTexture(this._gl["TEXTURE" + channel]);
            this._gl.bindTexture(this._gl.TEXTURE_2D, texture);

            this._activeTexturesCache[channel] = null;
        }

        public setTextureFromPostProcess(channel: number, postProcess: PostProcess): void {
            this._bindTexture(channel, postProcess._textures.data[postProcess._currentRenderTextureInd]);
        }

        public unbindAllTextures(): void {
            for (var channel = 0; channel < this._caps.maxTexturesImageUnits; channel++) {
                this._gl.activeTexture(this._gl["TEXTURE" + channel]);
                this._gl.bindTexture(this._gl.TEXTURE_2D, null);
                this._gl.bindTexture(this._gl.TEXTURE_CUBE_MAP, null);
                this._activeTexturesCache[channel] = null;
            }
        }

        public setTexture(channel: number, texture: BaseTexture): void {
            if (channel < 0) {
                return;
            }
            // Not ready?
            if (!texture || !texture.isReady()) {
                if (this._activeTexturesCache[channel] != null) {
                    this._gl.activeTexture(this._gl["TEXTURE" + channel]);
                    this._gl.bindTexture(this._gl.TEXTURE_2D, null);
                    this._gl.bindTexture(this._gl.TEXTURE_CUBE_MAP, null);
                    this._activeTexturesCache[channel] = null;
                }
                return;
            }

            // Video
            var alreadyActivated = false;
            if (texture instanceof VideoTexture) {
                this._gl.activeTexture(this._gl["TEXTURE" + channel]);
                alreadyActivated = true;
                texture.update();
            } else if (texture.delayLoadState === Engine.DELAYLOADSTATE_NOTLOADED) { // Delay loading
                texture.delayLoad();
                return;
            }

            if (this._activeTexturesCache[channel] === texture) {
                return;
            }
            this._activeTexturesCache[channel] = texture;

            var internalTexture = texture.getInternalTexture();

            if (!alreadyActivated) {
                this._gl.activeTexture(this._gl["TEXTURE" + channel]);
            }

            if (internalTexture.isCube) {
                this._gl.bindTexture(this._gl.TEXTURE_CUBE_MAP, internalTexture);

                if (internalTexture._cachedCoordinatesMode !== texture.coordinatesMode) {
                    internalTexture._cachedCoordinatesMode = texture.coordinatesMode;
                    // CUBIC_MODE and SKYBOX_MODE both require CLAMP_TO_EDGE.  All other modes use REPEAT.
                    var textureWrapMode = (texture.coordinatesMode !== Texture.CUBIC_MODE && texture.coordinatesMode !== Texture.SKYBOX_MODE) ? this._gl.REPEAT : this._gl.CLAMP_TO_EDGE;
                    this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_WRAP_S, textureWrapMode);
                    this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_WRAP_T, textureWrapMode);
                }

                this._setAnisotropicLevel(this._gl.TEXTURE_CUBE_MAP, texture);
            } else {
                this._gl.bindTexture(this._gl.TEXTURE_2D, internalTexture);

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

        public _setAnisotropicLevel(key: number, texture: BaseTexture) {
            var anisotropicFilterExtension = this._caps.textureAnisotropicFilterExtension;
            var value = texture.anisotropicFilteringLevel;

            if (texture.getInternalTexture().samplingMode === Texture.NEAREST_SAMPLINGMODE) {
                value = 1;
            }

            if (anisotropicFilterExtension && texture._cachedAnisotropicFilteringLevel !== value) {
                this._gl.texParameterf(key, anisotropicFilterExtension.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(value, this._caps.maxAnisotropy));
                texture._cachedAnisotropicFilteringLevel = value;
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
            return this._externalData.add(key, data);
        }

        /**
         * Get an externaly attached data from its key
         * @param key the unique key that identifies the data
         * @return the associated data, if present (can be null), or undefined if not present
         */
        public getExternalData<T>(key: string): T {
            return <T>this._externalData.get(key);
        }

        /**
         * Get an externaly attached data from its key, create it using a factory if it's not already present
         * @param key the unique key that identifies the data
         * @param factory the factory that will be called to create the instance if and only if it doesn't exists
         * @return the associated data, can be null if the factory returned null.
         */
        public getOrAddExternalDataWithFactory<T>(key: string, factory: (k: string) => T): T {
            return <T>this._externalData.getOrAddWithFactory(key, factory);
        }

        /**
         * Remove an externaly attached data from the Engine instance
         * @param key the unique key that identifies the data
         * @return true if the data was successfully removed, false if it doesn't exist
         */
        public removeExternalData(key): boolean {
            return this._externalData.remove(key);
        }

        public releaseInternalTexture(texture: WebGLTexture): void {
            if (!texture) {
                return;
            }

            texture.references--;

            // Final reference ?
            if (texture.references === 0) {
                var texturesCache = this.getLoadedTexturesCache();
                var index = texturesCache.indexOf(texture);

                if (index > -1) {
                    texturesCache.splice(index, 1);
                }

                this._releaseTexture(texture);
            }
        }

        // Dispose
        public dispose(): void {
            this.hideLoadingUI();

            this.stopRenderLoop();

            // Release scenes
            while (this.scenes.length) {
                this.scenes[0].dispose();
            }

            // Release audio engine
            Engine.audioEngine.dispose();

            // Release effects
            for (var name in this._compiledEffects) {
                this._gl.deleteProgram(this._compiledEffects[name]._program);
            }

            // Unbind
            for (var i in this._vertexAttribArrays) {
                //making sure this is a string
                var iAsNumber = +i;
                if (iAsNumber > this._gl.VERTEX_ATTRIB_ARRAY_ENABLED || !this._vertexAttribArrays[iAsNumber]) {
                    continue;
                }
                this._gl.disableVertexAttribArray(iAsNumber);
            }

            this._gl = null;

            // Events
            window.removeEventListener("blur", this._onBlur);
            window.removeEventListener("focus", this._onFocus);
            document.removeEventListener("fullscreenchange", this._onFullscreenChange);
            document.removeEventListener("mozfullscreenchange", this._onFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", this._onFullscreenChange);
            document.removeEventListener("msfullscreenchange", this._onFullscreenChange);
            document.removeEventListener("pointerlockchange", this._onPointerLockChange);
            document.removeEventListener("mspointerlockchange", this._onPointerLockChange);
            document.removeEventListener("mozpointerlockchange", this._onPointerLockChange);
            document.removeEventListener("webkitpointerlockchange", this._onPointerLockChange);
        }

        // Loading screen

        public displayLoadingUI(): void {
            this._loadingScreen.displayLoadingUI();
        }

        public hideLoadingUI(): void {
            this._loadingScreen.hideLoadingUI();
        }

        public get loadingScreen(): ILoadingScreen {
            return this._loadingScreen;
        }

        public set loadingScreen(loadingScreen: ILoadingScreen) {
            this._loadingScreen = loadingScreen;
        }

        public set loadingUIText(text: string) {
            this._loadingScreen.loadingUIText = text;
        }

        public set loadingUIBackgroundColor(color: string) {
            this._loadingScreen.loadingUIBackgroundColor = color;
        }

        // FPS
        public getFps(): number {
            return this.fps;
        }

        public getDeltaTime(): number {
            return this.deltaTime;
        }

        private _measureFps(): void {
            this.previousFramesDuration.push(Tools.Now);
            var length = this.previousFramesDuration.length;

            if (length >= 2) {
                this.deltaTime = this.previousFramesDuration[length - 1] - this.previousFramesDuration[length - 2];
            }

            if (length >= this.fpsRange) {

                if (length > this.fpsRange) {
                    this.previousFramesDuration.splice(0, 1);
                    length = this.previousFramesDuration.length;
                }

                var sum = 0;
                for (var id = 0; id < length - 1; id++) {
                    sum += this.previousFramesDuration[id + 1] - this.previousFramesDuration[id];
                }

                this.fps = 1000.0 / (sum / (length - 1));
            }
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