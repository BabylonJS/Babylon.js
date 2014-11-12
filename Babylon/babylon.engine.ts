module BABYLON {
    export class _DepthCullingState {
        private _isDepthTestDirty = false;
        private _isDepthMaskDirty = false;
        private _isDepthFuncDirty = false;
        private _isCullFaceDirty = false;
        private _isCullDirty = false;

        private _depthTest: boolean;
        private _depthMask: boolean;
        private _depthFunc: number;
        private _cull: boolean;
        private _cullFace: number;


        public get isDirty(): boolean {
            return this._isDepthFuncDirty || this._isDepthTestDirty || this._isDepthMaskDirty || this._isCullFaceDirty || this._isCullDirty;
        }

        public get cullFace(): number {
            return this._cullFace;
        }

        public set cullFace(value: number) {
            if (this._cullFace === value) {
                return;
            }

            this._cullFace = value;
            this._isCullFaceDirty = true;
        }

        public get cull() {
            return this._cull;
        }

        public set cull(value: boolean) {
            if (this._cull === value) {
                return;
            }

            this._cull = value;
            this._isCullDirty = true;
        }

        public get depthFunc(): number {
            return this._depthFunc;
        }

        public set depthFunc(value: number) {
            if (this._depthFunc === value) {
                return;
            }

            this._depthFunc = value;
            this._isDepthFuncDirty = true;
        }

        public get depthMask(): boolean {
            return this._depthMask;
        }

        public set depthMask(value: boolean) {
            if (this._depthMask === value) {
                return;
            }

            this._depthMask = value;
            this._isDepthMaskDirty = true;
        }

        public get depthTest(): boolean {
            return this._depthTest;
        }

        public set depthTest(value: boolean) {
            if (this._depthTest === value) {
                return;
            }

            this._depthTest = value;
            this._isDepthTestDirty = true;
        }

        public reset() {
            this._depthMask = true;
            this._depthTest = true;
            this._depthFunc = null;
            this._cull = null;
            this._cullFace = null;

            this._isDepthTestDirty = true;
            this._isDepthMaskDirty = true;
            this._isDepthFuncDirty = false;
            this._isCullFaceDirty = false;
            this._isCullDirty = false;
        }

        public apply(gl: WebGLRenderingContext) {

            if (!this.isDirty) {
                return;
            }

            // Cull
            if (this._isCullDirty) {
                if (this.cull === true) {
                    gl.enable(gl.CULL_FACE);
                } else if (this.cull === false) {
                    gl.disable(gl.CULL_FACE);
                }

                this._isCullDirty = false;
            }

            // Cull face
            if (this._isCullFaceDirty) {
                gl.cullFace(this.cullFace);
                this._isCullFaceDirty = false;
            }

            // Depth mask
            if (this._isDepthMaskDirty) {
                gl.depthMask(this.depthMask);
                this._isDepthMaskDirty = false;
            }

            // Depth test
            if (this._isDepthTestDirty) {
                if (this.depthTest === true) {
                    gl.enable(gl.DEPTH_TEST);
                } else if (this.depthTest === false) {
                    gl.disable(gl.DEPTH_TEST);
                }
                this._isDepthTestDirty = false;
            }

            // Depth func
            if (this._isDepthFuncDirty) {
                gl.depthFunc(this.depthFunc);
                this._isDepthFuncDirty = false;
            }
        }
    }

    export class _AlphaState {
        private _isAlphaBlendDirty = false;
        private _isBlendFunctionParametersDirty = false;
        private _alphaBlend = false;
        private _blendFunctionParameters = new Array<number>(4);

        public get isDirty(): boolean {
            return this._isAlphaBlendDirty || this._isBlendFunctionParametersDirty;
        }

        public get alphaBlend(): boolean {
            return this._alphaBlend;
        }

        public set alphaBlend(value: boolean) {
            if (this._alphaBlend === value) {
                return;
            }

            this._alphaBlend = value;
            this._isAlphaBlendDirty = true;
        }

        public setAlphaBlendFunctionParameters(value0: number, value1: number, value2: number, value3: number): void {
            if (
                this._blendFunctionParameters[0] === value0 &&
                this._blendFunctionParameters[1] === value1 &&
                this._blendFunctionParameters[2] === value2 &&
                this._blendFunctionParameters[3] === value3
                ) {
                return;
            }

            this._blendFunctionParameters[0] = value0;
            this._blendFunctionParameters[1] = value1;
            this._blendFunctionParameters[2] = value2;
            this._blendFunctionParameters[3] = value3;

            this._isBlendFunctionParametersDirty = true;
        }

        public reset() {
            this._alphaBlend = false;
            this._blendFunctionParameters[0] = null;
            this._blendFunctionParameters[1] = null;
            this._blendFunctionParameters[2] = null;
            this._blendFunctionParameters[3] = null;

            this._isAlphaBlendDirty = true;
            this._isBlendFunctionParametersDirty = false;
        }

        public apply(gl: WebGLRenderingContext) {

            if (!this.isDirty) {
                return;
            }

            // Alpha blend
            if (this._isAlphaBlendDirty) {
                if (this._alphaBlend === true) {
                    gl.enable(gl.BLEND);
                } else if (this._alphaBlend === false) {
                    gl.disable(gl.BLEND);
                }

                this._isAlphaBlendDirty = false;
            }

            // Alpha function
            if (this._isBlendFunctionParametersDirty) {
                gl.blendFuncSeparate(this._blendFunctionParameters[0], this._blendFunctionParameters[1], this._blendFunctionParameters[2], this._blendFunctionParameters[3]);
                this._isBlendFunctionParametersDirty = false;
            }
        }
    }

    var compileShader = (gl: WebGLRenderingContext, source: string, type: string, defines: string): WebGLShader => {
        var shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);

        gl.shaderSource(shader, (defines ? defines + "\n" : "") + source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
    };

    var getSamplingParameters = (samplingMode: number, generateMipMaps: boolean, gl: WebGLRenderingContext): { min: number; mag: number } => {
        var magFilter = gl.NEAREST;
        var minFilter = gl.NEAREST;
        if (samplingMode === BABYLON.Texture.BILINEAR_SAMPLINGMODE) {
            magFilter = gl.LINEAR;
            if (generateMipMaps) {
                minFilter = gl.LINEAR_MIPMAP_NEAREST;
            } else {
                minFilter = gl.LINEAR;
            }
        } else if (samplingMode === BABYLON.Texture.TRILINEAR_SAMPLINGMODE) {
            magFilter = gl.LINEAR;
            if (generateMipMaps) {
                minFilter = gl.LINEAR_MIPMAP_LINEAR;
            } else {
                minFilter = gl.LINEAR;
            }
        } else if (samplingMode === BABYLON.Texture.NEAREST_SAMPLINGMODE) {
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
        processFunction: (width: number, height: number) => void, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) => {
        var engine = scene.getEngine();
        var potWidth = Tools.GetExponantOfTwo(width, engine.getCaps().maxTextureSize);
        var potHeight = Tools.GetExponantOfTwo(height, engine.getCaps().maxTextureSize);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, invertY === undefined ? 1 : (invertY ? 1 : 0));

        processFunction(potWidth, potHeight);

        var filters = getSamplingParameters(samplingMode, !noMipmap, gl);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);

        if (!noMipmap && !isCompressed) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);

        engine._activeTexturesCache = [];
        texture._baseWidth = width;
        texture._baseHeight = height;
        texture._width = potWidth;
        texture._height = potHeight;
        texture.isReady = true;
        scene._removePendingData(texture);
    };

    var partialLoad = (url: string, index: number, loadedImages: any, scene,
        onfinish: (images: HTMLImageElement[]) => void) => {

        var img: HTMLImageElement;

        var onload = () => {
            loadedImages[index] = img;
            loadedImages._internalCount++;

            scene._removePendingData(img);

            if (loadedImages._internalCount == 6) {
                onfinish(loadedImages);
            }
        };

        var onerror = () => {
            scene._removePendingData(img);
        };

        img = BABYLON.Tools.LoadImage(url, onload, onerror, scene.database);
        scene._addPendingData(img);
    }

    var cascadeLoad = (rootUrl: string, scene,
        onfinish: (images: HTMLImageElement[]) => void, extensions: string[]) => {

        var loadedImages:any = [];
        loadedImages._internalCount = 0;

        for (var index = 0; index < 6; index++) {
            partialLoad(rootUrl + extensions[index], index, loadedImages, scene, onfinish);
        }
    };

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
    }

    export class Engine {
        // Const statics
        private static _ALPHA_DISABLE = 0;
        private static _ALPHA_ADD = 1;
        private static _ALPHA_COMBINE = 2;

        private static _DELAYLOADSTATE_NONE = 0;
        private static _DELAYLOADSTATE_LOADED = 1;
        private static _DELAYLOADSTATE_LOADING = 2;
        private static _DELAYLOADSTATE_NOTLOADED = 4;

        public static get ALPHA_DISABLE(): number {
            return Engine._ALPHA_DISABLE;
        }

        public static get ALPHA_ADD(): number {
            return Engine._ALPHA_ADD;
        }

        public static get ALPHA_COMBINE(): number {
            return Engine._ALPHA_COMBINE;
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

        public static get Version(): string {
            return "2.0.0";
        }

        // Updatable statics so stick with vars here
        public static Epsilon = 0.001;
        public static CollisionsEpsilon = 0.001;
        public static ShadersRepository = "Babylon/Shaders/";


        // Public members
        public isFullscreen = false;
        public isPointerLock = false;
        public forceWireframe = false;
        public cullBackFaces = true;
        public renderEvenInBackground = true;
        public scenes = new Array<Scene>();

        // Private Members
        private _gl: WebGLRenderingContext;
        private _renderingCanvas: HTMLCanvasElement;
        private _windowIsBackground = false;

        private _onBlur: () => void;
        private _onFocus: () => void;
        private _onFullscreenChange: () => void;
        private _onPointerLockChange: () => void;

        private _hardwareScalingLevel: number;
        private _caps: EngineCapabilities;
        private _pointerLockRequested: boolean;
        private _alphaTest: boolean;

        private _runningLoop = false;
        private _renderFunction: () => void;

        private _resizeLoadingUI: () => void;
        private _loadingDiv: HTMLDivElement;
        private _loadingTextDiv: HTMLDivElement;
        private _loadingDivBackgroundColor = "black";

        // States
        private _depthCullingState = new _DepthCullingState();
        private _alphaState = new _AlphaState();

        // Cache
        private _loadedTexturesCache = new Array<WebGLTexture>();
        public _activeTexturesCache = new Array<BaseTexture>();
        private _currentEffect: Effect;
        private _compiledEffects = {};
        private _vertexAttribArrays: boolean[];
        private _cachedViewport: Viewport;
        private _cachedVertexBuffers: any;
        private _cachedIndexBuffer: WebGLBuffer;
        private _cachedEffectForVertexBuffers: Effect;
        private _currentRenderTarget: WebGLTexture;
        private _canvasClientRect: ClientRect;

        private _workingCanvas: HTMLCanvasElement;
        private _workingContext: CanvasRenderingContext2D;

        constructor(canvas: HTMLCanvasElement, antialias?: boolean, options?) {
            this._renderingCanvas = canvas;
            this._canvasClientRect = this._renderingCanvas.getBoundingClientRect();

            options = options || {};
            options.antialias = antialias;

            // GL
            try {
                this._gl = canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options);
            } catch (e) {
                throw new Error("WebGL not supported");
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


            // Textures
            this._workingCanvas = document.createElement("canvas");
            this._workingContext = this._workingCanvas.getContext("2d");

            // Viewport
            this._hardwareScalingLevel = 1.0 / (window.devicePixelRatio || 1.0);
            this.resize();

            // Caps
            this._caps = new EngineCapabilities();
            this._caps.maxTexturesImageUnits = this._gl.getParameter(this._gl.MAX_TEXTURE_IMAGE_UNITS);
            this._caps.maxTextureSize = this._gl.getParameter(this._gl.MAX_TEXTURE_SIZE);
            this._caps.maxCubemapTextureSize = this._gl.getParameter(this._gl.MAX_CUBE_MAP_TEXTURE_SIZE);
            this._caps.maxRenderTextureSize = this._gl.getParameter(this._gl.MAX_RENDERBUFFER_SIZE);

            // Extensions
            this._caps.standardDerivatives = (this._gl.getExtension('OES_standard_derivatives') !== null);
            this._caps.s3tc = this._gl.getExtension('WEBGL_compressed_texture_s3tc');
            this._caps.textureFloat = (this._gl.getExtension('OES_texture_float') !== null);
            this._caps.textureAnisotropicFilterExtension = this._gl.getExtension('EXT_texture_filter_anisotropic') || this._gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') || this._gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
            this._caps.maxAnisotropy = this._caps.textureAnisotropicFilterExtension ? this._gl.getParameter(this._caps.textureAnisotropicFilterExtension.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;
            this._caps.instancedArrays = this._gl.getExtension('ANGLE_instanced_arrays');

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
        }

        public getAspectRatio(camera: Camera): number {
            var viewport = camera.viewport;
            return (this.getRenderWidth() * viewport.width) / (this.getRenderHeight() * viewport.height);
        }

        public getRenderWidth(): number {
            if (this._currentRenderTarget) {
                return this._currentRenderTarget._width;
            }

            return this._renderingCanvas.width;
        }

        public getRenderHeight(): number {
            if (this._currentRenderTarget) {
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

        // Methods
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

        public stopRenderLoop(): void {
            this._renderFunction = null;
            this._runningLoop = false;
        }

        public _renderLoop(): void {
            var shouldRender = true;
            if (!this.renderEvenInBackground && this._windowIsBackground) {
                shouldRender = false;
            }

            if (shouldRender) {
                // Start new frame
                this.beginFrame();

                if (this._renderFunction) {
                    this._renderFunction();
                }

                // Present
                this.endFrame();
            }

            if (this._runningLoop) {
                // Register new frame
                BABYLON.Tools.QueueNewFrame(() => {
                    this._renderLoop();
                });
            }
        }

        public runRenderLoop(renderFunction: () => void): void {
            this._runningLoop = true;

            this._renderFunction = renderFunction;

            BABYLON.Tools.QueueNewFrame(() => {
                this._renderLoop();
            });
        }

        public switchFullscreen(requestPointerLock: boolean): void {
            if (this.isFullscreen) {
                BABYLON.Tools.ExitFullscreen();
            } else {
                this._pointerLockRequested = requestPointerLock;
                BABYLON.Tools.RequestFullscreen(this._renderingCanvas);
            }
        }

        public clear(color: any, backBuffer: boolean, depthStencil: boolean): void {
            this.applyStates();

            this._gl.clearColor(color.r, color.g, color.b, color.a !== undefined ? color.a : 1.0);
            if (this._depthCullingState.depthMask) {
                this._gl.clearDepth(1.0);
            }
            var mode = 0;

            if (backBuffer)
                mode |= this._gl.COLOR_BUFFER_BIT;

            if (depthStencil && this._depthCullingState.depthMask)
                mode |= this._gl.DEPTH_BUFFER_BIT;

            this._gl.clear(mode);
        }

        public setViewport(viewport: Viewport, requiredWidth?: number, requiredHeight?: number): void {
            var width = requiredWidth || this._renderingCanvas.width;
            var height = requiredHeight || this._renderingCanvas.height;
            var x = viewport.x || 0;
            var y = viewport.y || 0;

            this._cachedViewport = viewport;

            this._gl.viewport(x * width, y * height, width * viewport.width, height * viewport.height);
        }

        public setDirectViewport(x: number, y: number, width: number, height: number): void {
            this._cachedViewport = null;

            this._gl.viewport(x, y, width, height);
        }

        public beginFrame(): void {
            BABYLON.Tools._MeasureFps();
        }

        public endFrame(): void {
            this.flushFramebuffer();
        }

        public resize(): void {
            this.setSize(this._renderingCanvas.clientWidth / this._hardwareScalingLevel, this._renderingCanvas.clientHeight / this._hardwareScalingLevel);
        }

        public setSize(width: number, height: number): void {
            this._renderingCanvas.width = width;
            this._renderingCanvas.height = height;

            this._canvasClientRect = this._renderingCanvas.getBoundingClientRect();
        }

        public bindFramebuffer(texture: WebGLTexture): void {
            this._currentRenderTarget = texture;

            var gl = this._gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, texture._framebuffer);
            this._gl.viewport(0, 0, texture._width, texture._height);

            this.wipeCaches();
        }

        public unBindFramebuffer(texture: WebGLTexture): void {
            this._currentRenderTarget = null;
            if (texture.generateMipMaps) {
                var gl = this._gl;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.bindTexture(gl.TEXTURE_2D, null);
            }

            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        }

        public flushFramebuffer(): void {
            this._gl.flush();
        }

        public restoreDefaultFramebuffer(): void {
            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);

            this.setViewport(this._cachedViewport);

            this.wipeCaches();
        }

        // VBOs
        private _resetVertexBufferBinding(): void {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
            this._cachedVertexBuffers = null;
        }

        public createVertexBuffer(vertices: number[]): WebGLBuffer {
            var vbo = this._gl.createBuffer();
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);
            this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(vertices), this._gl.STATIC_DRAW);
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

        public updateDynamicVertexBuffer(vertexBuffer: WebGLBuffer, vertices: any, length?: number): void {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer);
            //if (length && length != vertices.length) {
            //    this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, new Float32Array(vertices, 0, length));
            //} else {
            if (vertices instanceof Float32Array) {
                this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, vertices);
            } else {
                this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, new Float32Array(vertices));
            }
            //  }

            this._resetVertexBufferBinding();
        }

        private _resetIndexBufferBinding(): void {
            this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, null);
            this._cachedIndexBuffer = null;
        }

        public createIndexBuffer(indices: number[]): WebGLBuffer {
            var vbo = this._gl.createBuffer();
            this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, vbo);
            this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this._gl.STATIC_DRAW);
            this._resetIndexBufferBinding();
            vbo.references = 1;
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

            if (indexBuffer!= null && this._cachedIndexBuffer !== indexBuffer) {
                this._cachedIndexBuffer = indexBuffer;
                this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
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


        public updateAndBindInstancesBuffer(instancesBuffer: WebGLBuffer, data: Float32Array, offsetLocations: number[]): void {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, instancesBuffer);
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, data);

            for (var index = 0; index < 4; index++) {
                var offsetLocation = offsetLocations[index];
                this._gl.enableVertexAttribArray(offsetLocation);
                this._gl.vertexAttribPointer(offsetLocation, 4, this._gl.FLOAT, false, 64, index * 16);
                this._caps.instancedArrays.vertexAttribDivisorANGLE(offsetLocation, 1);
            }
        }

        public unBindInstancesBuffer(instancesBuffer: WebGLBuffer, offsetLocations: number[]): void {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, instancesBuffer);
            for (var index = 0; index < 4; index++) {
                var offsetLocation = offsetLocations[index];
                this._gl.disableVertexAttribArray(offsetLocation);
                this._caps.instancedArrays.vertexAttribDivisorANGLE(offsetLocation, 0);
            }
        }

        public applyStates() {
            this._depthCullingState.apply(this._gl);
            this._alphaState.apply(this._gl);
        }

        public draw(useTriangles: boolean, indexStart: number, indexCount: number, instancesCount?: number): void {
            // Apply states
            this.applyStates();

            // Render
            if (instancesCount) {
                this._caps.instancedArrays.drawElementsInstancedANGLE(useTriangles ? this._gl.TRIANGLES : this._gl.LINES, indexCount, this._gl.UNSIGNED_SHORT, indexStart * 2, instancesCount);
                return;
            }

            this._gl.drawElements(useTriangles ? this._gl.TRIANGLES : this._gl.LINES, indexCount, this._gl.UNSIGNED_SHORT, indexStart * 2);
        }

        public drawPointClouds(verticesStart: number, verticesCount: number, instancesCount?: number): void {
            // Apply states
            this.applyStates();

            if (instancesCount) {
                this._caps.instancedArrays.drawArraysInstancedANGLE(this._gl.POINTS, verticesStart, verticesCount, instancesCount);
                return;
            }

            this._gl.drawArrays(this._gl.POINTS, verticesStart, verticesCount);
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
            onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void): Effect {
            var vertex = baseName.vertexElement || baseName.vertex || baseName;
            var fragment = baseName.fragmentElement || baseName.fragment || baseName;

            var name = vertex + "+" + fragment + "@" + defines;
            if (this._compiledEffects[name]) {
                return this._compiledEffects[name];
            }

            var effect = new BABYLON.Effect(baseName, attributesNames, uniformsNames, samplers, this, defines, fallbacks, onCompiled, onError);
            effect._key = name;
            this._compiledEffects[name] = effect;

            return effect;
        }

        public createEffectForParticles(fragmentName: string, uniformsNames: string[]= [], samplers: string[]= [], defines = "", fallbacks?: EffectFallbacks,
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
                if (i > this._gl.VERTEX_ATTRIB_ARRAY_ENABLED || !this._vertexAttribArrays[i]) {
                    continue;
                }
                this._vertexAttribArrays[i] = false;
                this._gl.disableVertexAttribArray(i);
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

            this._gl.uniform1fv(uniform, array);
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
        public setState(culling: boolean, force?: boolean): void {
            // Culling        
            if (this._depthCullingState.cull !== culling || force) {
                if (culling) {
                    this._depthCullingState.cullFace = this.cullBackFaces ? this._gl.BACK : this._gl.FRONT;
                    this._depthCullingState.cull = true;
                } else {
                    this._depthCullingState.cull = false;
                }
            }
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

            switch (mode) {
                case BABYLON.Engine.ALPHA_DISABLE:
                    this.setDepthWrite(true);
                    this._alphaState.alphaBlend = false;
                    break;
                case BABYLON.Engine.ALPHA_COMBINE:
                    this.setDepthWrite(false);
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
                case BABYLON.Engine.ALPHA_ADD:
                    this.setDepthWrite(false);
                    this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE, this._gl.ZERO, this._gl.ONE);
                    this._alphaState.alphaBlend = true;
                    break;
            }
        }

        public setAlphaTesting(enable: boolean): void {
            this._alphaTest = enable;
        }

        public getAlphaTesting(): boolean {
            return this._alphaTest;
        }

        // Textures
        public wipeCaches(): void {
            this._activeTexturesCache = [];
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

            if (samplingMode === BABYLON.Texture.BILINEAR_SAMPLINGMODE) {
                magFilter = gl.LINEAR;
                minFilter = gl.LINEAR;
            } else if (samplingMode === BABYLON.Texture.TRILINEAR_SAMPLINGMODE) {
                magFilter = gl.LINEAR;
                minFilter = gl.LINEAR_MIPMAP_LINEAR;
            }

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);

            gl.bindTexture(gl.TEXTURE_2D, null);
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
            this._loadedTexturesCache.push(texture);

            var onerror = () => {
                scene._removePendingData(texture);

                if (onError) {
                    onError();
                }
            };

            if (isTGA) {
                var callback = (arrayBuffer) => {
                    var data = new Uint8Array(arrayBuffer);

                    var header = BABYLON.Internals.TGATools.GetTGAHeader(data);

                    prepareWebGLTexture(texture, this._gl, scene, header.width, header.height, invertY, noMipmap, false, () => {
                        Internals.TGATools.UploadContent(this._gl, data);

                        if (onLoad) {
                            onLoad();
                        }
                    }, samplingMode);
                };

                if (!(fromData instanceof Array))
                    BABYLON.Tools.LoadFile(url, arrayBuffer => {
                        callback(arrayBuffer);
                    }, onerror, scene.database, true);
                else
                    callback(buffer);

            } else if (isDDS) {
                 callback = (data) => {
                    var info = BABYLON.Internals.DDSTools.GetDDSInfo(data);

                    var loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && !noMipmap && ((info.width >> (info.mipmapCount - 1)) == 1);
                    prepareWebGLTexture(texture, this._gl, scene, info.width, info.height, invertY, !loadMipmap, info.isFourCC, () => {

                        Internals.DDSTools.UploadDDSLevels(this._gl, this.getCaps().s3tc, data, info, loadMipmap, 1);

                        if (onLoad) {
                            onLoad();
                        }
                    }, samplingMode);
                };

                if (!(fromData instanceof Array))
                    BABYLON.Tools.LoadFile(url, data => {
                        callback(data);
                    }, onerror, scene.database, true);
                else
                    callback(buffer);

            } else {
                var onload = (img) => {
                    prepareWebGLTexture(texture, this._gl, scene, img.width, img.height, invertY, noMipmap, false, (potWidth, potHeight) => {
                        var isPot = (img.width == potWidth && img.height == potHeight);
                        if (!isPot) {
                            this._workingCanvas.width = potWidth;
                            this._workingCanvas.height = potHeight;

                            this._workingContext.drawImage(img, 0, 0, img.width, img.height, 0, 0, potWidth, potHeight);
                        }

                        this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, isPot ? img : this._workingCanvas);

                        if (onLoad) {
                            onLoad();
                        }
                    }, samplingMode);
                };


                if (!(fromData instanceof Array))
                    BABYLON.Tools.LoadImage(url, onload, onerror, scene.database);
                else
                    BABYLON.Tools.LoadImage(buffer, onload, onerror, scene.database);
            }

            return texture;
        }

        public createDynamicTexture(width: number, height: number, generateMipMaps: boolean, samplingMode: number): WebGLTexture {
            var texture = this._gl.createTexture();

            width = Tools.GetExponantOfTwo(width, this._caps.maxTextureSize);
            height = Tools.GetExponantOfTwo(height, this._caps.maxTextureSize);

            this._gl.bindTexture(this._gl.TEXTURE_2D, texture);

            var filters = getSamplingParameters(samplingMode, generateMipMaps, this._gl);

            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, filters.mag);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, filters.min);
            this._gl.bindTexture(this._gl.TEXTURE_2D, null);

            this._activeTexturesCache = [];
            texture._baseWidth = width;
            texture._baseHeight = height;
            texture._width = width;
            texture._height = height;
            texture.isReady = false;
            texture.generateMipMaps = generateMipMaps;
            texture.references = 1;

            this._loadedTexturesCache.push(texture);

            return texture;
        }

        public updateDynamicTexture(texture: WebGLTexture, canvas: HTMLCanvasElement, invertY: boolean): void {
            this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
            this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, invertY ? 1 : 0);
            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, canvas);
            if (texture.generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_2D);
            }
            this._gl.bindTexture(this._gl.TEXTURE_2D, null);
            this._activeTexturesCache = [];
            texture.isReady = true;
        }

        public updateVideoTexture(texture: WebGLTexture, video: HTMLVideoElement, invertY: boolean): void {
            this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
            this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, invertY ? 0 : 1); // Video are upside down by default

            // Scale the video if it is a NPOT using the current working canvas
            if (video.videoWidth !== texture._width || video.videoHeight !== texture._height) {
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
            this._activeTexturesCache = [];
            texture.isReady = true;
        }

        public createRenderTargetTexture(size: any, options): WebGLTexture {
            // old version had a "generateMipMaps" arg instead of options.
            // if options.generateMipMaps is undefined, consider that options itself if the generateMipmaps value
            // in the same way, generateDepthBuffer is defaulted to true
            var generateMipMaps = false;
            var generateDepthBuffer = true;
            var samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE;
            if (options !== undefined) {
                generateMipMaps = options.generateMipMaps === undefined ? options : options.generateMipmaps;
                generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
                if (options.samplingMode !== undefined) {
                    samplingMode = options.samplingMode;
                }
            }
            var gl = this._gl;

            var texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);

            var width = size.width || size;
            var height = size.height || size;

            var filters = getSamplingParameters(samplingMode, generateMipMaps, gl);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

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
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            if (generateDepthBuffer) {
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
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
            this._activeTexturesCache = [];

            this._loadedTexturesCache.push(texture);

            return texture;
        }

        public createCubeTexture(rootUrl: string, scene: Scene, extensions: string[], noMipmap?: boolean): WebGLTexture {
            var gl = this._gl;

            var texture = gl.createTexture();
            texture.isCube = true;
            texture.url = rootUrl;
            texture.references = 1;
            this._loadedTexturesCache.push(texture);

            var extension = rootUrl.substr(rootUrl.length - 4, 4).toLowerCase();
            var isDDS = this.getCaps().s3tc && (extension === ".dds");

            if (isDDS) {
                BABYLON.Tools.LoadFile(rootUrl, data => {
                    var info = BABYLON.Internals.DDSTools.GetDDSInfo(data);

                    var loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && !noMipmap;

                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

                    Internals.DDSTools.UploadDDSLevels(this._gl, this.getCaps().s3tc, data, info, loadMipmap, 6);

                    if (!noMipmap && !info.isFourCC && info.mipmapCount == 1) {
                        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                    }

                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, loadMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

                    this._activeTexturesCache = [];

                    texture._width = info.width;
                    texture._height = info.height;
                    texture.isReady = true;
                }, null, null, true);
            } else {
                cascadeLoad(rootUrl, scene, imgs => {
                    var width = Tools.GetExponantOfTwo(imgs[0].width, this._caps.maxCubemapTextureSize);
                    var height = width;

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

                    this._activeTexturesCache = [];

                    texture._width = width;
                    texture._height = height;
                    texture.isReady = true;
                }, extensions);
            }

            return texture;
        }

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
            for (var channel = 0; channel < this._caps.maxTexturesImageUnits; channel++) {
                this._gl.activeTexture(this._gl["TEXTURE" + channel]);
                this._gl.bindTexture(this._gl.TEXTURE_2D, null);
                this._gl.bindTexture(this._gl.TEXTURE_CUBE_MAP, null);
                this._activeTexturesCache[channel] = null;
            }

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
            if (texture instanceof BABYLON.VideoTexture) {
                if ((<VideoTexture>texture).update()) {
                    this._activeTexturesCache[channel] = null;
                }
            } else if (texture.delayLoadState == BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) { // Delay loading
                texture.delayLoad();
                return;
            }

            if (this._activeTexturesCache[channel] == texture) {
                return;
            }
            this._activeTexturesCache[channel] = texture;

            var internalTexture = texture.getInternalTexture();
            this._gl.activeTexture(this._gl["TEXTURE" + channel]);

            if (internalTexture.isCube) {
                this._gl.bindTexture(this._gl.TEXTURE_CUBE_MAP, internalTexture);

                if (internalTexture._cachedCoordinatesMode !== texture.coordinatesMode) {
                    internalTexture._cachedCoordinatesMode = texture.coordinatesMode;
                    // CUBIC_MODE and SKYBOX_MODE both require CLAMP_TO_EDGE.  All other modes use REPEAT.
                    var textureWrapMode = (texture.coordinatesMode !== BABYLON.Texture.CUBIC_MODE && texture.coordinatesMode !== BABYLON.Texture.SKYBOX_MODE) ? this._gl.REPEAT : this._gl.CLAMP_TO_EDGE;
                    this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_WRAP_S, textureWrapMode);
                    this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_WRAP_T, textureWrapMode);
                }

                this._setAnisotropicLevel(this._gl.TEXTURE_CUBE_MAP, texture);
            } else {
                this._gl.bindTexture(this._gl.TEXTURE_2D, internalTexture);

                if (internalTexture._cachedWrapU !== texture.wrapU) {
                    internalTexture._cachedWrapU = texture.wrapU;

                    switch (texture.wrapU) {
                        case BABYLON.Texture.WRAP_ADDRESSMODE:
                            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.REPEAT);
                            break;
                        case BABYLON.Texture.CLAMP_ADDRESSMODE:
                            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
                            break;
                        case BABYLON.Texture.MIRROR_ADDRESSMODE:
                            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.MIRRORED_REPEAT);
                            break;
                    }
                }

                if (internalTexture._cachedWrapV !== texture.wrapV) {
                    internalTexture._cachedWrapV = texture.wrapV;
                    switch (texture.wrapV) {
                        case BABYLON.Texture.WRAP_ADDRESSMODE:
                            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.REPEAT);
                            break;
                        case BABYLON.Texture.CLAMP_ADDRESSMODE:
                            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
                            break;
                        case BABYLON.Texture.MIRROR_ADDRESSMODE:
                            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.MIRRORED_REPEAT);
                            break;
                    }
                }

                this._setAnisotropicLevel(this._gl.TEXTURE_2D, texture);
            }
        }

        public _setAnisotropicLevel(key: number, texture: BaseTexture) {
            var anisotropicFilterExtension = this._caps.textureAnisotropicFilterExtension;

            if (anisotropicFilterExtension && texture._cachedAnisotropicFilteringLevel !== texture.anisotropicFilteringLevel) {
                this._gl.texParameterf(key, anisotropicFilterExtension.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(texture.anisotropicFilteringLevel, this._caps.maxAnisotropy));
                texture._cachedAnisotropicFilteringLevel = texture.anisotropicFilteringLevel;
            }
        }

        public readPixels(x: number, y: number, width: number, height: number): Uint8Array {
            var data = new Uint8Array(height * width * 4);
            this._gl.readPixels(0, 0, width, height, this._gl.RGBA, this._gl.UNSIGNED_BYTE, data);
            return data;
        }

        // Dispose
        public dispose(): void {
            this.hideLoadingUI();

            this.stopRenderLoop();

            // Release scenes
            while (this.scenes.length) {
                this.scenes[0].dispose();
            }

            // Release effects
            for (var name in this._compiledEffects) {
                this._gl.deleteProgram(this._compiledEffects[name]._program);
            }

            // Unbind
            for (var i in this._vertexAttribArrays) {
                if (i > this._gl.VERTEX_ATTRIB_ARRAY_ENABLED || !this._vertexAttribArrays[i]) {
                    continue;
                }
                this._gl.disableVertexAttribArray(i);
            }

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
            this._loadingDiv = document.createElement("div");

            this._loadingDiv.style.opacity = "0";
            this._loadingDiv.style.transition = "opacity 1.5s ease";

            // Loading text
            this._loadingTextDiv = document.createElement("div");
            this._loadingTextDiv.style.position = "absolute";
            this._loadingTextDiv.style.left = "0";
            this._loadingTextDiv.style.top = "50%";
            this._loadingTextDiv.style.marginTop = "80px";
            this._loadingTextDiv.style.width = "100%";
            this._loadingTextDiv.style.height = "20px";
            this._loadingTextDiv.style.fontFamily = "Arial";
            this._loadingTextDiv.style.fontSize = "14px";
            this._loadingTextDiv.style.color = "white";
            this._loadingTextDiv.style.textAlign = "center";
            this._loadingTextDiv.innerHTML = "Loading";

            this._loadingDiv.appendChild(this._loadingTextDiv);

            // Loading img
            var imgBack = new Image();
            imgBack.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuM4zml1AAAARbSURBVHhe7Z09aFNRFMc716kuLrq4FdyLq4Wi4CAoRQcR0UJBUBdRiuLSIYMo6CA4FF2sgw6CFAdFUOpSQYcWO4hD26UQCfXrIQrx/JJzw1OSWq3NPeL/B4Fy+0jg/HO+7j3vpUcI8b/Q39+/49ihfWdPHT94Yf/e3Se3bd263f8lus218TPn6vV6Ya8Wi/MzNRNmj18iusX9W1evmP1/EKNEIVG6CMbG6E3bt+fT++pHha8NoHdT72bLE8NDg7tGU64gLLndV4Wc4m8j/pS+vr4tGB/DT16v3Fyr8dvBe/jbit8BL0AES9LX1iPAz+BR/hFiLVCynj95dPzNy6fv3IZ/k4L3948Sq7FzYGBg4vLFGxitabuOFCbWNKGrMnbiUuo18KaV6tIHv6YtvL9/nOgE31jCktmrY7k6+/zhE4yP4Vf7hiNqh/BWWEl8mzDol4p22Lf7cIdvdUMEvv0Y2S9fE5S1hLzpqTsPkiep//gFGPnR3Yl7GL5p/xYFBrTwM+iXio3GqpwDGL5p/xYNIX7XG8Q6IJRgdIzf1KBBgafII7oMidhyQtVFaMA2Bt7il4huQRhaXphbcR2g4RXqBzKAGHiCCwGFVUAj/m/RTRDj29cvn10I0PZ3LghH5f4CL1EFlQmqqXK3jDDKFxmhQ3Yt6oQseUZGKmMnTpsOqc8o1F9kBOMjQlOLeqEeIyOc6JV6jYLJD/+XyIFvnzdgl9aXRQ5I2qZDK1SpospMqaoqON/wZZGDciLnMMiXRS7IF4hhqMTNTdk7CFu+LHLhR7BQqBvPDJUUQqCGvCMATHUgBmhWNgApmdOda9YpM+VwRYfuyyIXDK8hBlilNerLIheMZCKGwlUAyru6GlwOgPUbRxADdJ9FAChxXY864viyyEXqPxhc0M2TAfAbatSdRyHtXymhByEdRnE3ky+JnHAIhSA0h74kckETmHoQbSgGwJrCIRMEPSRIBCRIMAhZaYhaggQhJXUJEoRU9mofKwh+F22dLRRfEjlJM7w6KQwCoQpBOKTyJZETjmwRxKqtGV8SOSkNOGjKPQppBEgDDkFgpxdBVGkFgaYQQXRIFQSObk0P5ZFIpAZRHXsQ0r0hCluBWKkuvVbYCkQaCdL5ehBScudJP4yY+rLISdps1NBDEJKXMMmoSfggWC4ZQRR17oFYXph7hSiquIKQ+hJGTX1J5MYSPD/GVdNzsgLBwZVCVyAQAkF0ohiI/c1fS6tNXq9UfEnkhudmIQolsS+J3Hh/UtNDzQLhj42VKJFInqLwFYiUU5ToA+HdfI0JevUpQUAIn+vSz2lHIuUV/dJOIHhOY/IWVWGBIHQtzs88s9zyWBuTgcBLzGOmeNnfF/QslSDgMeQW85i3DOQxuipxAkCyZ8SIm4Omp+7MMlCB59j6sKZcMoM4iIEoeI2J9AKxrFobZx0v4vYInuHFS4J1GQRCAGaLEYQXfyMML5XSQgghhBBCCCH+cXp6vgNhKpSKX/XdOAAAAABJRU5ErkJggg==";

            imgBack.style.position = "absolute";
            imgBack.style.left = "50%";
            imgBack.style.top = "50%";
            imgBack.style.marginLeft = "-50px";
            imgBack.style.marginTop = "-50px";
            imgBack.style.transition = "transform 1.0s ease";
            imgBack.style.webkitTransition = "-webkit-transform 1.0s ease";

            var deg = 360;

            var onTransitionEnd = () => {
                deg += 360;
                imgBack.style.transform = "rotateZ(" + deg + "deg)";
                imgBack.style.webkitTransform = "rotateZ(" + deg + "deg)";
            }

            imgBack.addEventListener("transitionend", onTransitionEnd);
            imgBack.addEventListener("webkitTransitionEnd", onTransitionEnd);

            this._loadingDiv.appendChild(imgBack);

            // front image
            var imgFront = new Image();
            imgFront.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuM4zml1AAAAYJSURBVHhe7Zy/qx1FFMff/2Av2Nvbi4WFiiAEY/OQ2IgQsbCJQoqkCAgpFLXyoZURLfwBIiIpgqZJoYQYlWelNsIrNOxDJcrzfHe+G97dnTl75u7euzv7zgcWHrlnZmfOmXPmzI/NjuM4juM4juM4juM4juM4juM4juM4juM45fPic08/uHf5/CvffH7lnT8PfrtxdHS0n3p+/fHGl5+89/prr5599iEWd8bg0rkXHoFyqehKnlxQpjYSDHTm9JMPsGrHylOPPXofvICKXMcIGtXdf/76AYbm6xyNW9e/eAtKC7rbKLXnvHHx5Sf4auc4Ek7OQkFU1Dap/vv37k/wSjblZANFiFIGzw98hhizwqBgs04mCBdQRNCHidoAEtY+lLIvtSdoGFeyql2ZH57HBH4sE7O+o/r9l+8/ZXUni68+2jsHBQQ9qNRGeP/tSxdSYQX/roUcpL4/f3vtM9TD+jTq92n1LQ7jxF1hhGPtwWL3gGccy8JuS1r8sVWBGXNVdSKMYjBGPUJjCzooiGuSpnwlnnOGP2dhHRSLNgpHp2oMKIriK8TmG4Qh/rwW8D6pps9b9im+LDDipXOqMVJrAngBfg9i98gevWKA+/nnCod3Dr5GfaHaDgidVym6HKRjGIkpqthcAVKGxNqBImbEo66kjCih8AOpNmkUmbMuUrR8kEqiU6FvHZLGAPJ71JCYSyhiBqmwFE2GoD6jLGIfDHtG6EzoU4dK21PCqIRMEF0FGRjFzGDtIkXVAdATvsqfT9CJ0JcOFdYiFIsiMlqYy1YOFpQo2OddqBtyEaq9y+efoVh5oPHoROjLKn0j3JIE5Ka8UqZRtGrMnneX6yVofOhDh94MSbznTcpqmDOt1vyQzOgaJAF4F3JBfIXesrNEGWWmjIX7UBZ6jRJbBMLg/DmJiKUGVHleIpnVNTa+jakzkAviJqLhi4MC9XQGBrZeKJZESSrKy7ik0VGFWhQBRDTHIACKQ5l9nAjy75gya4a2w+Jhs0FJdc0xX/GwUbAqFBkZi7QpJ2w16WUbjFyK9MJF3KaoEM74KhVtLrQOrsmRxkbdHEqmSC/c+EuGnIFkjW7Ih2Kr4CCMIvNG2hrrgLpCjiFloooYCjyYrzCRyvhyBthkIPuQtsZGdnbMTezyDiU71KTC5zr7aVsHbsz2tllrEkS5UHwU1tq1HbtPW4UbeB0O7xx8R5EsMJql+BheUmHjkNVmIRP7LutoM3+D4O4tG7vCkNO9ESZ4lL3J6rKRMPx4qKbD/A0icf8CG7tC7kTahnMTwleuYSrsS7GatRAvfZh1tTm5BmmQCdZ8a0Sefe28xUrRBkmFLKy8KTIKUDRX0Y1xagPgwbaIdeFnQULmKak3xvwNMkVGgok/N5XNoehJvejRlCDl9escI28dJU0tZ++nBTJE9mEF647x5Ehbo4s5hDOKFIU0PdofeA5F5k1q63zIWmQqNI/P3ZubjFTqKxQ3jyjHAOX0RdlgVO9hzRFpczRcjZ3Gbxxpc7Qj6+5pTYF2OFXawNI+yDGf1k2NcvOlzBQeDQ/t7zD7DsEDpJ2xATXaNtDWUS4IzP4DS2ljajAVu57SUkYw245ptxZxA5JiZaJ0DswudGn3kYUy54426EjoT4dZfYbccxC2nI92cDkZHQr96jD4AGkMDKeSy/COBsRe6VTSKFN6irLeaCh3IteQjt1E5+oudsG/b/2DfZ5AqsYo8vMDK9LB1HzSsLWvlGThdxXvC6+NsqyPPWP0pMINtbdsajfVeC6f/GZ+cdAofQoB1d+Hf9waY98I7+RXWab3Lt4zYkjHtTnlOLXHYMsCh1zWeQYehu1zfNPOOiys/d91LAKEBSgh6MJMbSA82AaHofDgAIwbgvVvlLNS11nModMm4UZergLHZBZrodmBuA3lBB1thdorSjkOmATMDwg/UBQVtglqQyx6fbEJ+H3IWIapjYAjAfeIgeCMHldueJvFaqDaAHhwf8qNsEEQ1iQbOoUUGIbCLRc8+Bvfp4jyd2FEijuO4ziO4ziO4ziO4ziO4ziO4ziO4ziOUzw7O/8D0P7rcZ/GEboAAAAASUVORK5CYII=";

            imgFront.style.position = "absolute";
            imgFront.style.left = "50%";
            imgFront.style.top = "50%";
            imgFront.style.marginLeft = "-50px";
            imgFront.style.marginTop = "-50px";

            this._loadingDiv.appendChild(imgFront);

            // Resize
            this._resizeLoadingUI = () => {
                var canvasRect = this.getRenderingCanvasClientRect();
                this._loadingDiv.style.position = "absolute";
                this._loadingDiv.style.left = canvasRect.left + "px";
                this._loadingDiv.style.top = canvasRect.top + "px";
                this._loadingDiv.style.width = canvasRect.width + "px";
                this._loadingDiv.style.height = canvasRect.height + "px";
            }
            this._resizeLoadingUI();

            window.addEventListener("resize", this._resizeLoadingUI);

            this._loadingDiv.style.backgroundColor = this._loadingDivBackgroundColor;
            document.body.appendChild(this._loadingDiv);

            setTimeout(() => {
                this._loadingDiv.style.opacity = "1";
                imgBack.style.transform = "rotateZ(360deg)";
                imgBack.style.webkitTransform = "rotateZ(360deg)";
            }, 0);
        }

        public set loadingUIText(text: string) {
            if (!this._loadingDiv) {
                return;
            }

            this._loadingTextDiv.innerHTML = text;
        }

        public get loadingUIBackgroundColor(): string {
            return this._loadingDivBackgroundColor;
        }

        public set loadingUIBackgroundColor(color: string) {
            this._loadingDivBackgroundColor = color;

            if (!this._loadingDiv) {
                return;
            }

            this._loadingDiv.style.backgroundColor = this._loadingDivBackgroundColor;
        }

        public hideLoadingUI(): void {
            if (!this._loadingDiv) {
                return;
            }

            var onTransitionEnd = () => {
                if (!this._loadingDiv) {
                    return;
                }
                document.body.removeChild(this._loadingDiv);
                window.removeEventListener("resize", this._resizeLoadingUI);

                this._loadingDiv = null;
            }

            this._loadingDiv.style.opacity = "0";
            this._loadingDiv.addEventListener("transitionend", onTransitionEnd);
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
