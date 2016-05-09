var BABYLON;
(function (BABYLON) {
    var compileShader = function (gl, source, type, defines) {
        var shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
        gl.shaderSource(shader, (defines ? defines + "\n" : "") + source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
    };
    var getWebGLTextureType = function (gl, type) {
        var textureType = gl.UNSIGNED_BYTE;
        if (type === Engine.TEXTURETYPE_FLOAT)
            textureType = gl.FLOAT;
        return textureType;
    };
    var getSamplingParameters = function (samplingMode, generateMipMaps, gl) {
        var magFilter = gl.NEAREST;
        var minFilter = gl.NEAREST;
        if (samplingMode === BABYLON.Texture.BILINEAR_SAMPLINGMODE) {
            magFilter = gl.LINEAR;
            if (generateMipMaps) {
                minFilter = gl.LINEAR_MIPMAP_NEAREST;
            }
            else {
                minFilter = gl.LINEAR;
            }
        }
        else if (samplingMode === BABYLON.Texture.TRILINEAR_SAMPLINGMODE) {
            magFilter = gl.LINEAR;
            if (generateMipMaps) {
                minFilter = gl.LINEAR_MIPMAP_LINEAR;
            }
            else {
                minFilter = gl.LINEAR;
            }
        }
        else if (samplingMode === BABYLON.Texture.NEAREST_SAMPLINGMODE) {
            magFilter = gl.NEAREST;
            if (generateMipMaps) {
                minFilter = gl.NEAREST_MIPMAP_LINEAR;
            }
            else {
                minFilter = gl.NEAREST;
            }
        }
        return {
            min: minFilter,
            mag: magFilter
        };
    };
    var prepareWebGLTexture = function (texture, gl, scene, width, height, invertY, noMipmap, isCompressed, processFunction, onLoad, samplingMode) {
        if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
        var engine = scene.getEngine();
        var potWidth = BABYLON.Tools.GetExponentOfTwo(width, engine.getCaps().maxTextureSize);
        var potHeight = BABYLON.Tools.GetExponentOfTwo(height, engine.getCaps().maxTextureSize);
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
    var partialLoad = function (url, index, loadedImages, scene, onfinish) {
        var img;
        var onload = function () {
            loadedImages[index] = img;
            loadedImages._internalCount++;
            scene._removePendingData(img);
            if (loadedImages._internalCount === 6) {
                onfinish(loadedImages);
            }
        };
        var onerror = function () {
            scene._removePendingData(img);
        };
        img = BABYLON.Tools.LoadImage(url, onload, onerror, scene.database);
        scene._addPendingData(img);
    };
    var cascadeLoad = function (rootUrl, scene, onfinish, files) {
        var loadedImages = [];
        loadedImages._internalCount = 0;
        for (var index = 0; index < 6; index++) {
            partialLoad(files[index], index, loadedImages, scene, onfinish);
        }
    };
    var InstancingAttributeInfo = (function () {
        function InstancingAttributeInfo() {
        }
        return InstancingAttributeInfo;
    })();
    BABYLON.InstancingAttributeInfo = InstancingAttributeInfo;
    var EngineCapabilities = (function () {
        function EngineCapabilities() {
        }
        return EngineCapabilities;
    })();
    BABYLON.EngineCapabilities = EngineCapabilities;
    /**
     * The engine class is responsible for interfacing with all lower-level APIs such as WebGL and Audio.
     */
    var Engine = (function () {
        /**
         * @constructor
         * @param {HTMLCanvasElement} canvas - the canvas to be used for rendering
         * @param {boolean} [antialias] - enable antialias
         * @param options - further options to be sent to the getContext function
         */
        function Engine(canvas, antialias, options, adaptToDeviceRatio) {
            var _this = this;
            if (adaptToDeviceRatio === void 0) { adaptToDeviceRatio = true; }
            // Public members
            this.isFullscreen = false;
            this.isPointerLock = false;
            this.cullBackFaces = true;
            this.renderEvenInBackground = true;
            // To enable/disable IDB support and avoid XHR on .manifest
            this.enableOfflineSupport = true;
            this.scenes = new Array();
            this._windowIsBackground = false;
            this._webGLVersion = "1.0";
            this._drawCalls = 0;
            this._renderingQueueLaunched = false;
            this._activeRenderLoops = [];
            // FPS
            this.fpsRange = 60;
            this.previousFramesDuration = [];
            this.fps = 60;
            this.deltaTime = 0;
            // States
            this._depthCullingState = new BABYLON.Internals._DepthCullingState();
            this._alphaState = new BABYLON.Internals._AlphaState();
            this._alphaMode = Engine.ALPHA_DISABLE;
            // Cache
            this._loadedTexturesCache = new Array();
            this._maxTextureChannels = 16;
            this._activeTexturesCache = new Array(this._maxTextureChannels);
            this._compiledEffects = {};
            this._uintIndicesCurrentlySet = false;
            this._renderingCanvas = canvas;
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
                    this._gl = (canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options));
                }
                catch (e) {
                    throw new Error("WebGL not supported");
                }
            }
            if (!this._gl) {
                throw new Error("WebGL not supported");
            }
            this._onBlur = function () {
                _this._windowIsBackground = true;
            };
            this._onFocus = function () {
                _this._windowIsBackground = false;
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
            var rendererInfo = this._gl.getExtension("WEBGL_debug_renderer_info");
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
            this._onFullscreenChange = function () {
                if (document.fullscreen !== undefined) {
                    _this.isFullscreen = document.fullscreen;
                }
                else if (document.mozFullScreen !== undefined) {
                    _this.isFullscreen = document.mozFullScreen;
                }
                else if (document.webkitIsFullScreen !== undefined) {
                    _this.isFullscreen = document.webkitIsFullScreen;
                }
                else if (document.msIsFullScreen !== undefined) {
                    _this.isFullscreen = document.msIsFullScreen;
                }
                // Pointer lock
                if (_this.isFullscreen && _this._pointerLockRequested) {
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
            this._onPointerLockChange = function () {
                _this.isPointerLock = (document.mozPointerLockElement === canvas ||
                    document.webkitPointerLockElement === canvas ||
                    document.msPointerLockElement === canvas ||
                    document.pointerLockElement === canvas);
            };
            document.addEventListener("pointerlockchange", this._onPointerLockChange, false);
            document.addEventListener("mspointerlockchange", this._onPointerLockChange, false);
            document.addEventListener("mozpointerlockchange", this._onPointerLockChange, false);
            document.addEventListener("webkitpointerlockchange", this._onPointerLockChange, false);
            if (BABYLON.AudioEngine && !Engine.audioEngine) {
                Engine.audioEngine = new BABYLON.AudioEngine();
            }
            //default loading screen
            this._loadingScreen = new BABYLON.DefaultLoadingScreen(this._renderingCanvas);
            BABYLON.Tools.Log("Babylon.js engine (v" + Engine.Version + ") launched");
        }
        Object.defineProperty(Engine, "ALPHA_DISABLE", {
            get: function () {
                return Engine._ALPHA_DISABLE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "ALPHA_ONEONE", {
            get: function () {
                return Engine._ALPHA_ONEONE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "ALPHA_ADD", {
            get: function () {
                return Engine._ALPHA_ADD;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "ALPHA_COMBINE", {
            get: function () {
                return Engine._ALPHA_COMBINE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "ALPHA_SUBTRACT", {
            get: function () {
                return Engine._ALPHA_SUBTRACT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "ALPHA_MULTIPLY", {
            get: function () {
                return Engine._ALPHA_MULTIPLY;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "ALPHA_MAXIMIZED", {
            get: function () {
                return Engine._ALPHA_MAXIMIZED;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "DELAYLOADSTATE_NONE", {
            get: function () {
                return Engine._DELAYLOADSTATE_NONE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "DELAYLOADSTATE_LOADED", {
            get: function () {
                return Engine._DELAYLOADSTATE_LOADED;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "DELAYLOADSTATE_LOADING", {
            get: function () {
                return Engine._DELAYLOADSTATE_LOADING;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "DELAYLOADSTATE_NOTLOADED", {
            get: function () {
                return Engine._DELAYLOADSTATE_NOTLOADED;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "TEXTUREFORMAT_ALPHA", {
            get: function () {
                return Engine._TEXTUREFORMAT_ALPHA;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "TEXTUREFORMAT_LUMINANCE", {
            get: function () {
                return Engine._TEXTUREFORMAT_LUMINANCE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "TEXTUREFORMAT_LUMINANCE_ALPHA", {
            get: function () {
                return Engine._TEXTUREFORMAT_LUMINANCE_ALPHA;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "TEXTUREFORMAT_RGB", {
            get: function () {
                return Engine._TEXTUREFORMAT_RGB;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "TEXTUREFORMAT_RGBA", {
            get: function () {
                return Engine._TEXTUREFORMAT_RGBA;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "TEXTURETYPE_UNSIGNED_INT", {
            get: function () {
                return Engine._TEXTURETYPE_UNSIGNED_INT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "TEXTURETYPE_FLOAT", {
            get: function () {
                return Engine._TEXTURETYPE_FLOAT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine, "Version", {
            get: function () {
                return "2.4.0-alpha";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine.prototype, "webGLVersion", {
            get: function () {
                return this._webGLVersion;
            },
            enumerable: true,
            configurable: true
        });
        Engine.prototype._prepareWorkingCanvas = function () {
            if (this._workingCanvas) {
                return;
            }
            this._workingCanvas = document.createElement("canvas");
            this._workingContext = this._workingCanvas.getContext("2d");
        };
        Engine.prototype.resetTextureCache = function () {
            for (var index = 0; index < this._maxTextureChannels; index++) {
                this._activeTexturesCache[index] = null;
            }
        };
        Engine.prototype.getGlInfo = function () {
            return {
                vendor: this._glVendor,
                renderer: this._glRenderer,
                version: this._glVersion
            };
        };
        Engine.prototype.getAspectRatio = function (camera, useScreen) {
            if (useScreen === void 0) { useScreen = false; }
            var viewport = camera.viewport;
            return (this.getRenderWidth(useScreen) * viewport.width) / (this.getRenderHeight(useScreen) * viewport.height);
        };
        Engine.prototype.getRenderWidth = function (useScreen) {
            if (useScreen === void 0) { useScreen = false; }
            if (!useScreen && this._currentRenderTarget) {
                return this._currentRenderTarget._width;
            }
            return this._renderingCanvas.width;
        };
        Engine.prototype.getRenderHeight = function (useScreen) {
            if (useScreen === void 0) { useScreen = false; }
            if (!useScreen && this._currentRenderTarget) {
                return this._currentRenderTarget._height;
            }
            return this._renderingCanvas.height;
        };
        Engine.prototype.getRenderingCanvas = function () {
            return this._renderingCanvas;
        };
        Engine.prototype.getRenderingCanvasClientRect = function () {
            return this._renderingCanvas.getBoundingClientRect();
        };
        Engine.prototype.setHardwareScalingLevel = function (level) {
            this._hardwareScalingLevel = level;
            this.resize();
        };
        Engine.prototype.getHardwareScalingLevel = function () {
            return this._hardwareScalingLevel;
        };
        Engine.prototype.getLoadedTexturesCache = function () {
            return this._loadedTexturesCache;
        };
        Engine.prototype.getCaps = function () {
            return this._caps;
        };
        Object.defineProperty(Engine.prototype, "drawCalls", {
            get: function () {
                return this._drawCalls;
            },
            enumerable: true,
            configurable: true
        });
        // Methods
        Engine.prototype.resetDrawCalls = function () {
            this._drawCalls = 0;
        };
        Engine.prototype.getDepthFunction = function () {
            return this._depthCullingState.depthFunc;
        };
        Engine.prototype.setDepthFunction = function (depthFunc) {
            this._depthCullingState.depthFunc = depthFunc;
        };
        Engine.prototype.setDepthFunctionToGreater = function () {
            this._depthCullingState.depthFunc = this._gl.GREATER;
        };
        Engine.prototype.setDepthFunctionToGreaterOrEqual = function () {
            this._depthCullingState.depthFunc = this._gl.GEQUAL;
        };
        Engine.prototype.setDepthFunctionToLess = function () {
            this._depthCullingState.depthFunc = this._gl.LESS;
        };
        Engine.prototype.setDepthFunctionToLessOrEqual = function () {
            this._depthCullingState.depthFunc = this._gl.LEQUAL;
        };
        /**
         * stop executing a render loop function and remove it from the execution array
         * @param {Function} [renderFunction] the function to be removed. If not provided all functions will be removed.
         */
        Engine.prototype.stopRenderLoop = function (renderFunction) {
            if (!renderFunction) {
                this._activeRenderLoops = [];
                return;
            }
            var index = this._activeRenderLoops.indexOf(renderFunction);
            if (index >= 0) {
                this._activeRenderLoops.splice(index, 1);
            }
        };
        Engine.prototype._renderLoop = function () {
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
                BABYLON.Tools.QueueNewFrame(this._bindedRenderFunction);
            }
            else {
                this._renderingQueueLaunched = false;
            }
        };
        /**
         * Register and execute a render loop. The engine can have more than one render function.
         * @param {Function} renderFunction - the function to continuesly execute starting the next render loop.
         * @example
         * engine.runRenderLoop(function () {
         *      scene.render()
         * })
         */
        Engine.prototype.runRenderLoop = function (renderFunction) {
            if (this._activeRenderLoops.indexOf(renderFunction) !== -1) {
                return;
            }
            this._activeRenderLoops.push(renderFunction);
            if (!this._renderingQueueLaunched) {
                this._renderingQueueLaunched = true;
                this._bindedRenderFunction = this._renderLoop.bind(this);
                BABYLON.Tools.QueueNewFrame(this._bindedRenderFunction);
            }
        };
        /**
         * Toggle full screen mode.
         * @param {boolean} requestPointerLock - should a pointer lock be requested from the user
         */
        Engine.prototype.switchFullscreen = function (requestPointerLock) {
            if (this.isFullscreen) {
                BABYLON.Tools.ExitFullscreen();
            }
            else {
                this._pointerLockRequested = requestPointerLock;
                BABYLON.Tools.RequestFullscreen(this._renderingCanvas);
            }
        };
        Engine.prototype.clear = function (color, backBuffer, depthStencil) {
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
        };
        /**
         * Set the WebGL's viewport
         * @param {BABYLON.Viewport} viewport - the viewport element to be used.
         * @param {number} [requiredWidth] - the width required for rendering. If not provided the rendering canvas' width is used.
         * @param {number} [requiredHeight] - the height required for rendering. If not provided the rendering canvas' height is used.
         */
        Engine.prototype.setViewport = function (viewport, requiredWidth, requiredHeight) {
            var width = requiredWidth || (navigator.isCocoonJS ? window.innerWidth : this._renderingCanvas.width);
            var height = requiredHeight || (navigator.isCocoonJS ? window.innerHeight : this._renderingCanvas.height);
            var x = viewport.x || 0;
            var y = viewport.y || 0;
            this._cachedViewport = viewport;
            this._gl.viewport(x * width, y * height, width * viewport.width, height * viewport.height);
        };
        /**
         * Directly set the WebGL Viewport
         * The x, y, width & height are directly passed to the WebGL call
         * @return the current viewport Object (if any) that is being replaced by this call. You can restore this viewport later on to go back to the original state.
         */
        Engine.prototype.setDirectViewport = function (x, y, width, height) {
            var currentViewport = this._cachedViewport;
            this._cachedViewport = null;
            this._gl.viewport(x, y, width, height);
            return currentViewport;
        };
        Engine.prototype.beginFrame = function () {
            this._measureFps();
        };
        Engine.prototype.endFrame = function () {
            //this.flushFramebuffer();
        };
        /**
         * resize the view according to the canvas' size.
         * @example
         *   window.addEventListener("resize", function () {
         *      engine.resize();
         *   });
         */
        Engine.prototype.resize = function () {
            var width = navigator.isCocoonJS ? window.innerWidth : this._renderingCanvas.clientWidth;
            var height = navigator.isCocoonJS ? window.innerHeight : this._renderingCanvas.clientHeight;
            this.setSize(width / this._hardwareScalingLevel, height / this._hardwareScalingLevel);
            for (var index = 0; index < this.scenes.length; index++) {
                var scene = this.scenes[index];
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer._syncPositions();
                }
            }
        };
        /**
         * force a specific size of the canvas
         * @param {number} width - the new canvas' width
         * @param {number} height - the new canvas' height
         */
        Engine.prototype.setSize = function (width, height) {
            this._renderingCanvas.width = width;
            this._renderingCanvas.height = height;
            for (var index = 0; index < this.scenes.length; index++) {
                var scene = this.scenes[index];
                for (var camIndex = 0; camIndex < scene.cameras.length; camIndex++) {
                    var cam = scene.cameras[camIndex];
                    cam._currentRenderId = 0;
                }
            }
        };
        Engine.prototype.bindFramebuffer = function (texture, faceIndex, requiredWidth, requiredHeight) {
            this._currentRenderTarget = texture;
            var gl = this._gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, texture._framebuffer);
            if (texture.isCube) {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, texture, 0);
            }
            else {
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
            }
            this._gl.viewport(0, 0, requiredWidth || texture._width, requiredHeight || texture._height);
            this.wipeCaches();
        };
        Engine.prototype.unBindFramebuffer = function (texture, disableGenerateMipMaps) {
            if (disableGenerateMipMaps === void 0) { disableGenerateMipMaps = false; }
            this._currentRenderTarget = null;
            if (texture.generateMipMaps && !disableGenerateMipMaps) {
                var gl = this._gl;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.bindTexture(gl.TEXTURE_2D, null);
            }
            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        };
        Engine.prototype.generateMipMapsForCubemap = function (texture) {
            if (texture.generateMipMaps) {
                var gl = this._gl;
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
            }
        };
        Engine.prototype.flushFramebuffer = function () {
            this._gl.flush();
        };
        Engine.prototype.restoreDefaultFramebuffer = function () {
            this._currentRenderTarget = null;
            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
            this.setViewport(this._cachedViewport);
            this.wipeCaches();
        };
        // VBOs
        Engine.prototype._resetVertexBufferBinding = function () {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
            this._cachedVertexBuffers = null;
        };
        Engine.prototype.createVertexBuffer = function (vertices) {
            var vbo = this._gl.createBuffer();
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);
            if (vertices instanceof Float32Array) {
                this._gl.bufferData(this._gl.ARRAY_BUFFER, vertices, this._gl.STATIC_DRAW);
            }
            else {
                this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(vertices), this._gl.STATIC_DRAW);
            }
            this._resetVertexBufferBinding();
            vbo.references = 1;
            return vbo;
        };
        Engine.prototype.createDynamicVertexBuffer = function (capacity) {
            var vbo = this._gl.createBuffer();
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);
            this._gl.bufferData(this._gl.ARRAY_BUFFER, capacity, this._gl.DYNAMIC_DRAW);
            this._resetVertexBufferBinding();
            vbo.references = 1;
            return vbo;
        };
        Engine.prototype.updateDynamicVertexBuffer = function (vertexBuffer, vertices, offset) {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer);
            if (offset === undefined) {
                offset = 0;
            }
            if (vertices instanceof Float32Array) {
                this._gl.bufferSubData(this._gl.ARRAY_BUFFER, offset, vertices);
            }
            else {
                this._gl.bufferSubData(this._gl.ARRAY_BUFFER, offset, new Float32Array(vertices));
            }
            this._resetVertexBufferBinding();
        };
        Engine.prototype._resetIndexBufferBinding = function () {
            this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, null);
            this._cachedIndexBuffer = null;
        };
        Engine.prototype.createIndexBuffer = function (indices) {
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
            }
            else {
                arrayBuffer = new Uint16Array(indices);
            }
            this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, arrayBuffer, this._gl.STATIC_DRAW);
            this._resetIndexBufferBinding();
            vbo.references = 1;
            vbo.is32Bits = need32Bits;
            return vbo;
        };
        Engine.prototype.bindBuffers = function (vertexBuffer, indexBuffer, vertexDeclaration, vertexStrideSize, effect) {
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
        };
        Engine.prototype.bindMultiBuffers = function (vertexBuffers, indexBuffer, effect) {
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
        };
        Engine.prototype._releaseBuffer = function (buffer) {
            buffer.references--;
            if (buffer.references === 0) {
                this._gl.deleteBuffer(buffer);
                return true;
            }
            return false;
        };
        Engine.prototype.createInstancesBuffer = function (capacity) {
            var buffer = this._gl.createBuffer();
            buffer.capacity = capacity;
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buffer);
            this._gl.bufferData(this._gl.ARRAY_BUFFER, capacity, this._gl.DYNAMIC_DRAW);
            return buffer;
        };
        Engine.prototype.deleteInstancesBuffer = function (buffer) {
            this._gl.deleteBuffer(buffer);
        };
        Engine.prototype.updateAndBindInstancesBuffer = function (instancesBuffer, data, offsetLocations) {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, instancesBuffer);
            if (data) {
                this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, data);
            }
            if (offsetLocations[0].index !== undefined) {
                var stride = 0;
                for (var i = 0; i < offsetLocations.length; i++) {
                    var ai = offsetLocations[i];
                    stride += ai.attributeSize * 4;
                }
                for (var i = 0; i < offsetLocations.length; i++) {
                    var ai = offsetLocations[i];
                    this._gl.enableVertexAttribArray(ai.index);
                    this._gl.vertexAttribPointer(ai.index, ai.attributeSize, ai.attribyteType || this._gl.FLOAT, ai.normalized || false, stride, ai.offset);
                    this._caps.instancedArrays.vertexAttribDivisorANGLE(ai.index, 1);
                }
            }
            else {
                for (var index = 0; index < 4; index++) {
                    var offsetLocation = offsetLocations[index];
                    this._gl.enableVertexAttribArray(offsetLocation);
                    this._gl.vertexAttribPointer(offsetLocation, 4, this._gl.FLOAT, false, 64, index * 16);
                    this._caps.instancedArrays.vertexAttribDivisorANGLE(offsetLocation, 1);
                }
            }
        };
        Engine.prototype.unBindInstancesBuffer = function (instancesBuffer, offsetLocations) {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, instancesBuffer);
            if (offsetLocations[0].index !== undefined) {
                for (var i = 0; i < offsetLocations.length; i++) {
                    var ai = offsetLocations[i];
                    this._gl.disableVertexAttribArray(ai.index);
                    this._caps.instancedArrays.vertexAttribDivisorANGLE(ai.index, 0);
                }
            }
            else {
                for (var index = 0; index < 4; index++) {
                    var offsetLocation = offsetLocations[index];
                    this._gl.disableVertexAttribArray(offsetLocation);
                    this._caps.instancedArrays.vertexAttribDivisorANGLE(offsetLocation, 0);
                }
            }
        };
        Engine.prototype.applyStates = function () {
            this._depthCullingState.apply(this._gl);
            this._alphaState.apply(this._gl);
        };
        Engine.prototype.draw = function (useTriangles, indexStart, indexCount, instancesCount) {
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
        };
        Engine.prototype.drawPointClouds = function (verticesStart, verticesCount, instancesCount) {
            // Apply states
            this.applyStates();
            this._drawCalls++;
            if (instancesCount) {
                this._caps.instancedArrays.drawArraysInstancedANGLE(this._gl.POINTS, verticesStart, verticesCount, instancesCount);
                return;
            }
            this._gl.drawArrays(this._gl.POINTS, verticesStart, verticesCount);
        };
        Engine.prototype.drawUnIndexed = function (useTriangles, verticesStart, verticesCount, instancesCount) {
            // Apply states
            this.applyStates();
            this._drawCalls++;
            if (instancesCount) {
                this._caps.instancedArrays.drawArraysInstancedANGLE(useTriangles ? this._gl.TRIANGLES : this._gl.LINES, verticesStart, verticesCount, instancesCount);
                return;
            }
            this._gl.drawArrays(useTriangles ? this._gl.TRIANGLES : this._gl.LINES, verticesStart, verticesCount);
        };
        // Shaders
        Engine.prototype._releaseEffect = function (effect) {
            if (this._compiledEffects[effect._key]) {
                delete this._compiledEffects[effect._key];
                if (effect.getProgram()) {
                    this._gl.deleteProgram(effect.getProgram());
                }
            }
        };
        Engine.prototype.createEffect = function (baseName, attributesNames, uniformsNames, samplers, defines, fallbacks, onCompiled, onError, indexParameters) {
            var vertex = baseName.vertexElement || baseName.vertex || baseName;
            var fragment = baseName.fragmentElement || baseName.fragment || baseName;
            var name = vertex + "+" + fragment + "@" + defines;
            if (this._compiledEffects[name]) {
                return this._compiledEffects[name];
            }
            var effect = new BABYLON.Effect(baseName, attributesNames, uniformsNames, samplers, this, defines, fallbacks, onCompiled, onError, indexParameters);
            effect._key = name;
            this._compiledEffects[name] = effect;
            return effect;
        };
        Engine.prototype.createEffectForParticles = function (fragmentName, uniformsNames, samplers, defines, fallbacks, onCompiled, onError) {
            if (uniformsNames === void 0) { uniformsNames = []; }
            if (samplers === void 0) { samplers = []; }
            if (defines === void 0) { defines = ""; }
            return this.createEffect({
                vertex: "particles",
                fragmentElement: fragmentName
            }, ["position", "color", "options"], ["view", "projection"].concat(uniformsNames), ["diffuseSampler"].concat(samplers), defines, fallbacks, onCompiled, onError);
        };
        Engine.prototype.createShaderProgram = function (vertexCode, fragmentCode, defines) {
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
        };
        Engine.prototype.getUniforms = function (shaderProgram, uniformsNames) {
            var results = [];
            for (var index = 0; index < uniformsNames.length; index++) {
                results.push(this._gl.getUniformLocation(shaderProgram, uniformsNames[index]));
            }
            return results;
        };
        Engine.prototype.getAttributes = function (shaderProgram, attributesNames) {
            var results = [];
            for (var index = 0; index < attributesNames.length; index++) {
                try {
                    results.push(this._gl.getAttribLocation(shaderProgram, attributesNames[index]));
                }
                catch (e) {
                    results.push(-1);
                }
            }
            return results;
        };
        Engine.prototype.enableEffect = function (effect) {
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
        };
        Engine.prototype.setArray = function (uniform, array) {
            if (!uniform)
                return;
            this._gl.uniform1fv(uniform, array);
        };
        Engine.prototype.setArray2 = function (uniform, array) {
            if (!uniform || array.length % 2 !== 0)
                return;
            this._gl.uniform2fv(uniform, array);
        };
        Engine.prototype.setArray3 = function (uniform, array) {
            if (!uniform || array.length % 3 !== 0)
                return;
            this._gl.uniform3fv(uniform, array);
        };
        Engine.prototype.setArray4 = function (uniform, array) {
            if (!uniform || array.length % 4 !== 0)
                return;
            this._gl.uniform4fv(uniform, array);
        };
        Engine.prototype.setMatrices = function (uniform, matrices) {
            if (!uniform)
                return;
            this._gl.uniformMatrix4fv(uniform, false, matrices);
        };
        Engine.prototype.setMatrix = function (uniform, matrix) {
            if (!uniform)
                return;
            this._gl.uniformMatrix4fv(uniform, false, matrix.toArray());
        };
        Engine.prototype.setMatrix3x3 = function (uniform, matrix) {
            if (!uniform)
                return;
            this._gl.uniformMatrix3fv(uniform, false, matrix);
        };
        Engine.prototype.setMatrix2x2 = function (uniform, matrix) {
            if (!uniform)
                return;
            this._gl.uniformMatrix2fv(uniform, false, matrix);
        };
        Engine.prototype.setFloat = function (uniform, value) {
            if (!uniform)
                return;
            this._gl.uniform1f(uniform, value);
        };
        Engine.prototype.setFloat2 = function (uniform, x, y) {
            if (!uniform)
                return;
            this._gl.uniform2f(uniform, x, y);
        };
        Engine.prototype.setFloat3 = function (uniform, x, y, z) {
            if (!uniform)
                return;
            this._gl.uniform3f(uniform, x, y, z);
        };
        Engine.prototype.setBool = function (uniform, bool) {
            if (!uniform)
                return;
            this._gl.uniform1i(uniform, bool);
        };
        Engine.prototype.setFloat4 = function (uniform, x, y, z, w) {
            if (!uniform)
                return;
            this._gl.uniform4f(uniform, x, y, z, w);
        };
        Engine.prototype.setColor3 = function (uniform, color3) {
            if (!uniform)
                return;
            this._gl.uniform3f(uniform, color3.r, color3.g, color3.b);
        };
        Engine.prototype.setColor4 = function (uniform, color3, alpha) {
            if (!uniform)
                return;
            this._gl.uniform4f(uniform, color3.r, color3.g, color3.b, alpha);
        };
        // States
        Engine.prototype.setState = function (culling, zOffset, force, reverseSide) {
            if (zOffset === void 0) { zOffset = 0; }
            if (reverseSide === void 0) { reverseSide = false; }
            // Culling        
            var showSide = reverseSide ? this._gl.FRONT : this._gl.BACK;
            var hideSide = reverseSide ? this._gl.BACK : this._gl.FRONT;
            var cullFace = this.cullBackFaces ? showSide : hideSide;
            if (this._depthCullingState.cull !== culling || force || this._depthCullingState.cullFace !== cullFace) {
                if (culling) {
                    this._depthCullingState.cullFace = cullFace;
                    this._depthCullingState.cull = true;
                }
                else {
                    this._depthCullingState.cull = false;
                }
            }
            // Z offset
            this._depthCullingState.zOffset = zOffset;
        };
        Engine.prototype.setDepthBuffer = function (enable) {
            this._depthCullingState.depthTest = enable;
        };
        Engine.prototype.getDepthWrite = function () {
            return this._depthCullingState.depthMask;
        };
        Engine.prototype.setDepthWrite = function (enable) {
            this._depthCullingState.depthMask = enable;
        };
        Engine.prototype.setColorWrite = function (enable) {
            this._gl.colorMask(enable, enable, enable, enable);
        };
        Engine.prototype.setAlphaMode = function (mode) {
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
        };
        Engine.prototype.getAlphaMode = function () {
            return this._alphaMode;
        };
        Engine.prototype.setAlphaTesting = function (enable) {
            this._alphaTest = enable;
        };
        Engine.prototype.getAlphaTesting = function () {
            return this._alphaTest;
        };
        // Textures
        Engine.prototype.wipeCaches = function () {
            this.resetTextureCache();
            this._currentEffect = null;
            this._depthCullingState.reset();
            this._alphaState.reset();
            this._cachedVertexBuffers = null;
            this._cachedIndexBuffer = null;
            this._cachedEffectForVertexBuffers = null;
        };
        Engine.prototype.setSamplingMode = function (texture, samplingMode) {
            var gl = this._gl;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            var magFilter = gl.NEAREST;
            var minFilter = gl.NEAREST;
            if (samplingMode === BABYLON.Texture.BILINEAR_SAMPLINGMODE) {
                magFilter = gl.LINEAR;
                minFilter = gl.LINEAR;
            }
            else if (samplingMode === BABYLON.Texture.TRILINEAR_SAMPLINGMODE) {
                magFilter = gl.LINEAR;
                minFilter = gl.LINEAR_MIPMAP_LINEAR;
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
            gl.bindTexture(gl.TEXTURE_2D, null);
            texture.samplingMode = samplingMode;
        };
        Engine.prototype.createTexture = function (url, noMipmap, invertY, scene, samplingMode, onLoad, onError, buffer) {
            var _this = this;
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            if (onLoad === void 0) { onLoad = null; }
            if (onError === void 0) { onError = null; }
            if (buffer === void 0) { buffer = null; }
            var texture = this._gl.createTexture();
            var extension;
            var fromData = false;
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
            var onerror = function () {
                scene._removePendingData(texture);
                if (onError) {
                    onError();
                }
            };
            var callback;
            if (isTGA) {
                callback = function (arrayBuffer) {
                    var data = new Uint8Array(arrayBuffer);
                    var header = BABYLON.Internals.TGATools.GetTGAHeader(data);
                    prepareWebGLTexture(texture, _this._gl, scene, header.width, header.height, invertY, noMipmap, false, function () {
                        BABYLON.Internals.TGATools.UploadContent(_this._gl, data);
                    }, onLoad, samplingMode);
                };
                if (!(fromData instanceof Array))
                    BABYLON.Tools.LoadFile(url, function (arrayBuffer) {
                        callback(arrayBuffer);
                    }, onerror, scene.database, true);
                else
                    callback(buffer);
            }
            else if (isDDS) {
                callback = function (data) {
                    var info = BABYLON.Internals.DDSTools.GetDDSInfo(data);
                    var loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && !noMipmap && ((info.width >> (info.mipmapCount - 1)) === 1);
                    prepareWebGLTexture(texture, _this._gl, scene, info.width, info.height, invertY, !loadMipmap, info.isFourCC, function () {
                        BABYLON.Internals.DDSTools.UploadDDSLevels(_this._gl, _this.getCaps().s3tc, data, info, loadMipmap, 1);
                    }, onLoad, samplingMode);
                };
                if (!(fromData instanceof Array))
                    BABYLON.Tools.LoadFile(url, function (data) {
                        callback(data);
                    }, onerror, scene.database, true);
                else
                    callback(buffer);
            }
            else {
                var onload = function (img) {
                    prepareWebGLTexture(texture, _this._gl, scene, img.width, img.height, invertY, noMipmap, false, function (potWidth, potHeight) {
                        var isPot = (img.width === potWidth && img.height === potHeight);
                        if (!isPot) {
                            _this._prepareWorkingCanvas();
                            _this._workingCanvas.width = potWidth;
                            _this._workingCanvas.height = potHeight;
                            if (samplingMode === BABYLON.Texture.NEAREST_SAMPLINGMODE) {
                                _this._workingContext.imageSmoothingEnabled = false;
                                _this._workingContext.mozImageSmoothingEnabled = false;
                                _this._workingContext.oImageSmoothingEnabled = false;
                                _this._workingContext.webkitImageSmoothingEnabled = false;
                                _this._workingContext.msImageSmoothingEnabled = false;
                            }
                            _this._workingContext.drawImage(img, 0, 0, img.width, img.height, 0, 0, potWidth, potHeight);
                            if (samplingMode === BABYLON.Texture.NEAREST_SAMPLINGMODE) {
                                _this._workingContext.imageSmoothingEnabled = true;
                                _this._workingContext.mozImageSmoothingEnabled = true;
                                _this._workingContext.oImageSmoothingEnabled = true;
                                _this._workingContext.webkitImageSmoothingEnabled = true;
                                _this._workingContext.msImageSmoothingEnabled = true;
                            }
                        }
                        _this._gl.texImage2D(_this._gl.TEXTURE_2D, 0, _this._gl.RGBA, _this._gl.RGBA, _this._gl.UNSIGNED_BYTE, isPot ? img : _this._workingCanvas);
                    }, onLoad, samplingMode);
                };
                if (!(fromData instanceof Array))
                    BABYLON.Tools.LoadImage(url, onload, onerror, scene.database);
                else
                    BABYLON.Tools.LoadImage(buffer, onload, onerror, scene.database);
            }
            return texture;
        };
        Engine.prototype._getInternalFormat = function (format) {
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
        };
        Engine.prototype.updateRawTexture = function (texture, data, format, invertY, compression) {
            if (compression === void 0) { compression = null; }
            var internalFormat = this._getInternalFormat(format);
            this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
            this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, invertY === undefined ? 1 : (invertY ? 1 : 0));
            if (compression) {
                this._gl.compressedTexImage2D(this._gl.TEXTURE_2D, 0, this.getCaps().s3tc[compression], texture._width, texture._height, 0, data);
            }
            else {
                this._gl.texImage2D(this._gl.TEXTURE_2D, 0, internalFormat, texture._width, texture._height, 0, internalFormat, this._gl.UNSIGNED_BYTE, data);
            }
            if (texture.generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_2D);
            }
            this._gl.bindTexture(this._gl.TEXTURE_2D, null);
            this.resetTextureCache();
            texture.isReady = true;
        };
        Engine.prototype.createRawTexture = function (data, width, height, format, generateMipMaps, invertY, samplingMode, compression) {
            if (compression === void 0) { compression = null; }
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
        };
        Engine.prototype.createDynamicTexture = function (width, height, generateMipMaps, samplingMode, forceExponantOfTwo) {
            if (forceExponantOfTwo === void 0) { forceExponantOfTwo = true; }
            var texture = this._gl.createTexture();
            texture._baseWidth = width;
            texture._baseHeight = height;
            if (forceExponantOfTwo) {
                width = BABYLON.Tools.GetExponentOfTwo(width, this._caps.maxTextureSize);
                height = BABYLON.Tools.GetExponentOfTwo(height, this._caps.maxTextureSize);
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
        };
        Engine.prototype.updateTextureSamplingMode = function (samplingMode, texture) {
            var filters = getSamplingParameters(samplingMode, texture.generateMipMaps, this._gl);
            if (texture.isCube) {
                this._gl.bindTexture(this._gl.TEXTURE_CUBE_MAP, texture);
                this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_MAG_FILTER, filters.mag);
                this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_MIN_FILTER, filters.min);
                this._gl.bindTexture(this._gl.TEXTURE_CUBE_MAP, null);
            }
            else {
                this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
                this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, filters.mag);
                this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, filters.min);
                this._gl.bindTexture(this._gl.TEXTURE_2D, null);
            }
        };
        Engine.prototype.updateDynamicTexture = function (texture, canvas, invertY, premulAlpha) {
            if (premulAlpha === void 0) { premulAlpha = false; }
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
        };
        Engine.prototype.updateVideoTexture = function (texture, video, invertY) {
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
                    }
                    else {
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
                }
                else {
                    this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, video);
                }
                if (texture.generateMipMaps) {
                    this._gl.generateMipmap(this._gl.TEXTURE_2D);
                }
                this._gl.bindTexture(this._gl.TEXTURE_2D, null);
                this.resetTextureCache();
                texture.isReady = true;
            }
            catch (ex) {
                // Something unexpected
                // Let's disable the texture
                texture._isDisabled = true;
            }
        };
        Engine.prototype.createRenderTargetTexture = function (size, options) {
            // old version had a "generateMipMaps" arg instead of options.
            // if options.generateMipMaps is undefined, consider that options itself if the generateMipmaps value
            // in the same way, generateDepthBuffer is defaulted to true
            var generateMipMaps = false;
            var generateDepthBuffer = true;
            var type = Engine.TEXTURETYPE_UNSIGNED_INT;
            var samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE;
            if (options !== undefined) {
                generateMipMaps = options.generateMipMaps === undefined ? options : options.generateMipMaps;
                generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
                type = options.type === undefined ? type : options.type;
                if (options.samplingMode !== undefined) {
                    samplingMode = options.samplingMode;
                }
                if (type === Engine.TEXTURETYPE_FLOAT) {
                    // if floating point (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
                    samplingMode = BABYLON.Texture.NEAREST_SAMPLINGMODE;
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
                BABYLON.Tools.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, getWebGLTextureType(gl, type), null);
            var depthBuffer;
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
        };
        Engine.prototype.createRenderTargetCubeTexture = function (size, options) {
            var gl = this._gl;
            var texture = gl.createTexture();
            var generateMipMaps = true;
            var samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE;
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
        };
        Engine.prototype.createCubeTexture = function (rootUrl, scene, files, noMipmap) {
            var _this = this;
            var gl = this._gl;
            var texture = gl.createTexture();
            texture.isCube = true;
            texture.url = rootUrl;
            texture.references = 1;
            var extension = rootUrl.substr(rootUrl.length - 4, 4).toLowerCase();
            var isDDS = this.getCaps().s3tc && (extension === ".dds");
            if (isDDS) {
                BABYLON.Tools.LoadFile(rootUrl, function (data) {
                    var info = BABYLON.Internals.DDSTools.GetDDSInfo(data);
                    var loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && !noMipmap;
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
                    BABYLON.Internals.DDSTools.UploadDDSLevels(_this._gl, _this.getCaps().s3tc, data, info, loadMipmap, 6);
                    if (!noMipmap && !info.isFourCC && info.mipmapCount === 1) {
                        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                    }
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, loadMipmap ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                    _this.resetTextureCache();
                    texture._width = info.width;
                    texture._height = info.height;
                    texture.isReady = true;
                }, null, null, true);
            }
            else {
                cascadeLoad(rootUrl, scene, function (imgs) {
                    var width = BABYLON.Tools.GetExponentOfTwo(imgs[0].width, _this._caps.maxCubemapTextureSize);
                    var height = width;
                    _this._prepareWorkingCanvas();
                    _this._workingCanvas.width = width;
                    _this._workingCanvas.height = height;
                    var faces = [
                        gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                    ];
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
                    for (var index = 0; index < faces.length; index++) {
                        _this._workingContext.drawImage(imgs[index], 0, 0, imgs[index].width, imgs[index].height, 0, 0, width, height);
                        gl.texImage2D(faces[index], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, _this._workingCanvas);
                    }
                    if (!noMipmap) {
                        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                    }
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, noMipmap ? gl.LINEAR : gl.LINEAR_MIPMAP_LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                    _this.resetTextureCache();
                    texture._width = width;
                    texture._height = height;
                    texture.isReady = true;
                }, files);
            }
            return texture;
        };
        Engine.prototype.updateTextureSize = function (texture, width, height) {
            texture._width = width;
            texture._height = height;
            texture._size = width * height;
            texture._baseWidth = width;
            texture._baseHeight = height;
        };
        Engine.prototype.createRawCubeTexture = function (url, scene, size, format, type, noMipmap, callback, mipmmapGenerator) {
            var _this = this;
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
            var isPot = (BABYLON.Tools.IsExponentOfTwo(width) && BABYLON.Tools.IsExponentOfTwo(height));
            texture._width = width;
            texture._height = height;
            var onerror = function () {
                scene._removePendingData(texture);
            };
            var internalCallback = function (data) {
                var rgbeDataArrays = callback(data);
                var facesIndex = [
                    gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                    gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                ];
                width = texture._width;
                height = texture._height;
                isPot = (BABYLON.Tools.IsExponentOfTwo(width) && BABYLON.Tools.IsExponentOfTwo(height));
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
                if (!noMipmap && isPot) {
                    if (mipmmapGenerator) {
                        var arrayTemp = [];
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
                if (textureType == gl.FLOAT && !_this._caps.textureFloatLinearFiltering) {
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
                _this.resetTextureCache();
                scene._removePendingData(texture);
            };
            BABYLON.Tools.LoadFile(url, function (data) {
                internalCallback(data);
            }, onerror, scene.database, true);
            return texture;
        };
        ;
        Engine.prototype._releaseTexture = function (texture) {
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
        };
        Engine.prototype.bindSamplers = function (effect) {
            this._gl.useProgram(effect.getProgram());
            var samplers = effect.getSamplers();
            for (var index = 0; index < samplers.length; index++) {
                var uniform = effect.getUniform(samplers[index]);
                this._gl.uniform1i(uniform, index);
            }
            this._currentEffect = null;
        };
        Engine.prototype._bindTexture = function (channel, texture) {
            this._gl.activeTexture(this._gl["TEXTURE" + channel]);
            this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
            this._activeTexturesCache[channel] = null;
        };
        Engine.prototype.setTextureFromPostProcess = function (channel, postProcess) {
            this._bindTexture(channel, postProcess._textures.data[postProcess._currentRenderTextureInd]);
        };
        Engine.prototype.unbindAllTextures = function () {
            for (var channel = 0; channel < this._caps.maxTexturesImageUnits; channel++) {
                this._gl.activeTexture(this._gl["TEXTURE" + channel]);
                this._gl.bindTexture(this._gl.TEXTURE_2D, null);
                this._gl.bindTexture(this._gl.TEXTURE_CUBE_MAP, null);
                this._activeTexturesCache[channel] = null;
            }
        };
        Engine.prototype.setTexture = function (channel, texture) {
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
            if (texture instanceof BABYLON.VideoTexture) {
                this._gl.activeTexture(this._gl["TEXTURE" + channel]);
                alreadyActivated = true;
                texture.update();
            }
            else if (texture.delayLoadState === Engine.DELAYLOADSTATE_NOTLOADED) {
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
                    var textureWrapMode = (texture.coordinatesMode !== BABYLON.Texture.CUBIC_MODE && texture.coordinatesMode !== BABYLON.Texture.SKYBOX_MODE) ? this._gl.REPEAT : this._gl.CLAMP_TO_EDGE;
                    this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_WRAP_S, textureWrapMode);
                    this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_WRAP_T, textureWrapMode);
                }
                this._setAnisotropicLevel(this._gl.TEXTURE_CUBE_MAP, texture);
            }
            else {
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
        };
        Engine.prototype._setAnisotropicLevel = function (key, texture) {
            var anisotropicFilterExtension = this._caps.textureAnisotropicFilterExtension;
            var value = texture.anisotropicFilteringLevel;
            if (texture.getInternalTexture().samplingMode === BABYLON.Texture.NEAREST_SAMPLINGMODE) {
                value = 1;
            }
            if (anisotropicFilterExtension && texture._cachedAnisotropicFilteringLevel !== value) {
                this._gl.texParameterf(key, anisotropicFilterExtension.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(value, this._caps.maxAnisotropy));
                texture._cachedAnisotropicFilteringLevel = value;
            }
        };
        Engine.prototype.readPixels = function (x, y, width, height) {
            var data = new Uint8Array(height * width * 4);
            this._gl.readPixels(x, y, width, height, this._gl.RGBA, this._gl.UNSIGNED_BYTE, data);
            return data;
        };
        Engine.prototype.releaseInternalTexture = function (texture) {
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
        };
        // Dispose
        Engine.prototype.dispose = function () {
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
        };
        // Loading screen
        Engine.prototype.displayLoadingUI = function () {
            this._loadingScreen.displayLoadingUI();
        };
        Engine.prototype.hideLoadingUI = function () {
            this._loadingScreen.hideLoadingUI();
        };
        Object.defineProperty(Engine.prototype, "loadingScreen", {
            get: function () {
                return this._loadingScreen;
            },
            set: function (loadingScreen) {
                this._loadingScreen = loadingScreen;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine.prototype, "loadingUIText", {
            set: function (text) {
                this._loadingScreen.loadingUIText = text;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Engine.prototype, "loadingUIBackgroundColor", {
            set: function (color) {
                this._loadingScreen.loadingUIBackgroundColor = color;
            },
            enumerable: true,
            configurable: true
        });
        // FPS
        Engine.prototype.getFps = function () {
            return this.fps;
        };
        Engine.prototype.getDeltaTime = function () {
            return this.deltaTime;
        };
        Engine.prototype._measureFps = function () {
            this.previousFramesDuration.push(BABYLON.Tools.Now);
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
        };
        // Statics
        Engine.isSupported = function () {
            try {
                // Avoid creating an unsized context for CocoonJS, since size determined on first creation.  Is not resizable
                if (navigator.isCocoonJS) {
                    return true;
                }
                var tempcanvas = document.createElement("canvas");
                var gl = tempcanvas.getContext("webgl") || tempcanvas.getContext("experimental-webgl");
                return gl != null && !!window.WebGLRenderingContext;
            }
            catch (e) {
                return false;
            }
        };
        // Const statics
        Engine._ALPHA_DISABLE = 0;
        Engine._ALPHA_ADD = 1;
        Engine._ALPHA_COMBINE = 2;
        Engine._ALPHA_SUBTRACT = 3;
        Engine._ALPHA_MULTIPLY = 4;
        Engine._ALPHA_MAXIMIZED = 5;
        Engine._ALPHA_ONEONE = 6;
        Engine._DELAYLOADSTATE_NONE = 0;
        Engine._DELAYLOADSTATE_LOADED = 1;
        Engine._DELAYLOADSTATE_LOADING = 2;
        Engine._DELAYLOADSTATE_NOTLOADED = 4;
        Engine._TEXTUREFORMAT_ALPHA = 0;
        Engine._TEXTUREFORMAT_LUMINANCE = 1;
        Engine._TEXTUREFORMAT_LUMINANCE_ALPHA = 2;
        Engine._TEXTUREFORMAT_RGB = 4;
        Engine._TEXTUREFORMAT_RGBA = 5;
        Engine._TEXTURETYPE_UNSIGNED_INT = 0;
        Engine._TEXTURETYPE_FLOAT = 1;
        // Updatable statics so stick with vars here
        Engine.CollisionsEpsilon = 0.001;
        Engine.CodeRepository = "src/";
        Engine.ShadersRepository = "src/Shaders/";
        return Engine;
    })();
    BABYLON.Engine = Engine;
})(BABYLON || (BABYLON = {}));
