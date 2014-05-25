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

    var getExponantOfTwo = function (value, max) {
        var count = 1;

        do {
            count *= 2;
        } while(count < value);

        if (count > max)
            count = max;

        return count;
    };

    var prepareWebGLTexture = function (texture, gl, scene, width, height, invertY, noMipmap, isCompressed, processFunction) {
        var engine = scene.getEngine();
        var potWidth = getExponantOfTwo(width, engine.getCaps().maxTextureSize);
        var potHeight = getExponantOfTwo(height, engine.getCaps().maxTextureSize);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, invertY === undefined ? 1 : (invertY ? 1 : 0));

        processFunction(potWidth, potHeight);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        if (noMipmap) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

            if (!isCompressed) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }
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

    // ANY
    var cascadeLoad = function (rootUrl, index, loadedImages, scene, onfinish, extensions) {
        var img;

        var onload = function () {
            loadedImages.push(img);

            scene._removePendingData(img);

            if (index != extensions.length - 1) {
                cascadeLoad(rootUrl, index + 1, loadedImages, scene, onfinish, extensions);
            } else {
                onfinish(loadedImages);
            }
        };

        var onerror = function () {
            scene._removePendingData(img);
        };

        img = BABYLON.Tools.LoadImage(rootUrl + extensions[index], onload, onerror, scene.database);
        scene._addPendingData(img);
    };

    var EngineCapabilities = (function () {
        function EngineCapabilities() {
        }
        return EngineCapabilities;
    })();
    BABYLON.EngineCapabilities = EngineCapabilities;

    var Engine = (function () {
        function Engine(canvas, antialias, options) {
            var _this = this;
            // Public members
            this.isFullscreen = false;
            this.isPointerLock = false;
            this.forceWireframe = false;
            this.cullBackFaces = true;
            this.renderEvenInBackground = true;
            this.scenes = new Array();
            this._windowIsBackground = false;
            this._runningLoop = false;
            // Cache
            this._loadedTexturesCache = new Array();
            this._activeTexturesCache = new Array();
            this._compiledEffects = {};
            this._depthMask = false;
            this._renderingCanvas = canvas;

            options = options || {};
            options.antialias = antialias;

            try  {
                this._gl = canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options);
            } catch (e) {
                throw new Error("WebGL not supported");
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

            // Depth buffer
            this.setDepthBuffer(true);
            this.setDepthFunctionToLessOrEqual();
            this.setDepthWrite(true);

            // Fullscreen
            this._onFullscreenChange = function () {
                if (document.fullscreen !== undefined) {
                    _this.isFullscreen = document.fullscreen;
                } else if (document.mozFullScreen !== undefined) {
                    _this.isFullscreen = document.mozFullScreen;
                } else if (document.webkitIsFullScreen !== undefined) {
                    _this.isFullscreen = document.webkitIsFullScreen;
                } else if (document.msIsFullScreen !== undefined) {
                    _this.isFullscreen = document.msIsFullScreen;
                }

                // Pointer lock
                if (_this.isFullscreen && _this._pointerLockRequested) {
                    canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;

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
                _this.isPointerLock = (document.mozPointerLockElement === canvas || document.webkitPointerLockElement === canvas || document.msPointerLockElement === canvas || document.pointerLockElement === canvas);
            };

            document.addEventListener("pointerlockchange", this._onPointerLockChange, false);
            document.addEventListener("mspointerlockchange", this._onPointerLockChange, false);
            document.addEventListener("mozpointerlockchange", this._onPointerLockChange, false);
            document.addEventListener("webkitpointerlockchange", this._onPointerLockChange, false);
        }
        Object.defineProperty(Engine, "ALPHA_DISABLE", {
            get: function () {
                return Engine._ALPHA_DISABLE;
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

        Engine.prototype.getAspectRatio = function (camera) {
            var viewport = camera.viewport;
            return (this.getRenderWidth() * viewport.width) / (this.getRenderHeight() * viewport.height);
        };

        Engine.prototype.getRenderWidth = function () {
            if (this._currentRenderTarget) {
                return this._currentRenderTarget._width;
            }

            return this._renderingCanvas.width;
        };

        Engine.prototype.getRenderHeight = function () {
            if (this._currentRenderTarget) {
                return this._currentRenderTarget._height;
            }

            return this._renderingCanvas.height;
        };

        Engine.prototype.getRenderingCanvas = function () {
            return this._renderingCanvas;
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

        // Methods
        Engine.prototype.setDepthFunctionToGreater = function () {
            this._gl.depthFunc(this._gl.GREATER);
        };

        Engine.prototype.setDepthFunctionToGreaterOrEqual = function () {
            this._gl.depthFunc(this._gl.GEQUAL);
        };

        Engine.prototype.setDepthFunctionToLess = function () {
            this._gl.depthFunc(this._gl.LESS);
        };

        Engine.prototype.setDepthFunctionToLessOrEqual = function () {
            this._gl.depthFunc(this._gl.LEQUAL);
        };

        Engine.prototype.stopRenderLoop = function () {
            this._renderFunction = null;
            this._runningLoop = false;
        };

        Engine.prototype._renderLoop = function () {
            var _this = this;
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
                BABYLON.Tools.QueueNewFrame(function () {
                    _this._renderLoop();
                });
            }
        };

        Engine.prototype.runRenderLoop = function (renderFunction) {
            var _this = this;
            this._runningLoop = true;

            this._renderFunction = renderFunction;

            BABYLON.Tools.QueueNewFrame(function () {
                _this._renderLoop();
            });
        };

        Engine.prototype.switchFullscreen = function (requestPointerLock) {
            if (this.isFullscreen) {
                BABYLON.Tools.ExitFullscreen();
            } else {
                this._pointerLockRequested = requestPointerLock;
                BABYLON.Tools.RequestFullscreen(this._renderingCanvas);
            }
        };

        Engine.prototype.clear = function (color, backBuffer, depthStencil) {
            this._gl.clearColor(color.r, color.g, color.b, color.a !== undefined ? color.a : 1.0);
            if (this._depthMask) {
                this._gl.clearDepth(1.0);
            }
            var mode = 0;

            if (backBuffer)
                mode |= this._gl.COLOR_BUFFER_BIT;

            if (depthStencil && this._depthMask)
                mode |= this._gl.DEPTH_BUFFER_BIT;

            this._gl.clear(mode);
        };

        Engine.prototype.setViewport = function (viewport, requiredWidth, requiredHeight) {
            var width = requiredWidth || this._renderingCanvas.width;
            var height = requiredHeight || this._renderingCanvas.height;
            var x = viewport.x || 0;
            var y = viewport.y || 0;

            this._cachedViewport = viewport;

            this._gl.viewport(x * width, y * height, width * viewport.width, height * viewport.height);
        };

        Engine.prototype.setDirectViewport = function (x, y, width, height) {
            this._cachedViewport = null;

            this._gl.viewport(x, y, width, height);
        };

        Engine.prototype.beginFrame = function () {
            BABYLON.Tools._MeasureFps();
        };

        Engine.prototype.endFrame = function () {
            this.flushFramebuffer();
        };

        Engine.prototype.resize = function () {
            this._renderingCanvas.width = this._renderingCanvas.clientWidth / this._hardwareScalingLevel;
            this._renderingCanvas.height = this._renderingCanvas.clientHeight / this._hardwareScalingLevel;
        };

        Engine.prototype.bindFramebuffer = function (texture) {
            this._currentRenderTarget = texture;

            var gl = this._gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, texture._framebuffer);
            this._gl.viewport(0, 0, texture._width, texture._height);

            this.wipeCaches();
        };

        Engine.prototype.unBindFramebuffer = function (texture) {
            this._currentRenderTarget = null;
            if (texture.generateMipMaps) {
                var gl = this._gl;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.bindTexture(gl.TEXTURE_2D, null);
            }

            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        };

        Engine.prototype.flushFramebuffer = function () {
            this._gl.flush();
        };

        Engine.prototype.restoreDefaultFramebuffer = function () {
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
            this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(vertices), this._gl.STATIC_DRAW);
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

        Engine.prototype.updateDynamicVertexBuffer = function (vertexBuffer, vertices, length) {
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer);
            if (length && length != vertices.length) {
                this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, new Float32Array(vertices, 0, length));
            } else {
                if (vertices instanceof Float32Array) {
                    this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, vertices);
                } else {
                    this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, new Float32Array(vertices));
                }
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
            this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this._gl.STATIC_DRAW);
            this._resetIndexBufferBinding();
            vbo.references = 1;
            return vbo;
        };

        Engine.prototype.bindBuffers = function (vertexBuffer, indexBuffer, vertexDeclaration, vertexStrideSize, effect) {
            if (this._cachedVertexBuffers !== vertexBuffer || this._cachedEffectForVertexBuffers !== effect) {
                this._cachedVertexBuffers = vertexBuffer;
                this._cachedEffectForVertexBuffers = effect;

                this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer);

                var offset = 0;
                for (var index = 0; index < vertexDeclaration.length; index++) {
                    var order = effect.getAttribute(index);

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
        };

        Engine.prototype.bindMultiBuffers = function (vertexBuffers, indexBuffer, effect) {
            if (this._cachedVertexBuffers !== vertexBuffers || this._cachedEffectForVertexBuffers !== effect) {
                this._cachedVertexBuffers = vertexBuffers;
                this._cachedEffectForVertexBuffers = effect;

                var attributes = effect.getAttributesNames();

                for (var index = 0; index < attributes.length; index++) {
                    var order = effect.getAttribute(index);

                    if (order >= 0) {
                        var vertexBuffer = vertexBuffers[attributes[index]];
                        var stride = vertexBuffer.getStrideSize();
                        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer.getBuffer());
                        this._gl.vertexAttribPointer(order, stride, this._gl.FLOAT, false, stride * 4, 0);
                    }
                }
            }

            if (this._cachedIndexBuffer !== indexBuffer) {
                this._cachedIndexBuffer = indexBuffer;
                this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
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

        Engine.prototype.draw = function (useTriangles, indexStart, indexCount) {
            this._gl.drawElements(useTriangles ? this._gl.TRIANGLES : this._gl.LINES, indexCount, this._gl.UNSIGNED_SHORT, indexStart * 2);
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

        Engine.prototype.createEffect = function (baseName, attributesNames, uniformsNames, samplers, defines, optionalDefines, onCompiled, onError) {
            var vertex = baseName.vertexElement || baseName.vertex || baseName;
            var fragment = baseName.fragmentElement || baseName.fragment || baseName;

            var name = vertex + "+" + fragment + "@" + defines;
            if (this._compiledEffects[name]) {
                return this._compiledEffects[name];
            }

            var effect = new BABYLON.Effect(baseName, attributesNames, uniformsNames, samplers, this, defines, optionalDefines, onCompiled, onError);
            effect._key = name;
            this._compiledEffects[name] = effect;

            return effect;
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
                try  {
                    results.push(this._gl.getAttribLocation(shaderProgram, attributesNames[index]));
                } catch (e) {
                    results.push(-1);
                }
            }

            return results;
        };

        Engine.prototype.enableEffect = function (effect) {
            if (!effect || !effect.getAttributesCount() || this._currentEffect === effect) {
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
                var order = effect.getAttribute(index);

                if (order >= 0) {
                    this._vertexAttribArrays[order] = true;
                    this._gl.enableVertexAttribArray(order);
                }
            }

            this._currentEffect = effect;
        };

        Engine.prototype.setArray = function (uniform, array) {
            if (!uniform)
                return;

            this._gl.uniform1fv(uniform, array);
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
        Engine.prototype.setState = function (culling) {
            // Culling
            if (this._cullingState !== culling) {
                if (culling) {
                    this._gl.cullFace(this.cullBackFaces ? this._gl.BACK : this._gl.FRONT);
                    this._gl.enable(this._gl.CULL_FACE);
                } else {
                    this._gl.disable(this._gl.CULL_FACE);
                }

                this._cullingState = culling;
            }
        };

        Engine.prototype.setDepthBuffer = function (enable) {
            if (enable) {
                this._gl.enable(this._gl.DEPTH_TEST);
            } else {
                this._gl.disable(this._gl.DEPTH_TEST);
            }
        };

        Engine.prototype.setDepthWrite = function (enable) {
            this._gl.depthMask(enable);
            this._depthMask = enable;
        };

        Engine.prototype.setColorWrite = function (enable) {
            this._gl.colorMask(enable, enable, enable, enable);
        };

        Engine.prototype.setAlphaMode = function (mode) {
            switch (mode) {
                case BABYLON.Engine.ALPHA_DISABLE:
                    this.setDepthWrite(true);
                    this._gl.disable(this._gl.BLEND);
                    break;
                case BABYLON.Engine.ALPHA_COMBINE:
                    this.setDepthWrite(false);
                    this._gl.blendFuncSeparate(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE);
                    this._gl.enable(this._gl.BLEND);
                    break;
                case BABYLON.Engine.ALPHA_ADD:
                    this.setDepthWrite(false);
                    this._gl.blendFuncSeparate(this._gl.ONE, this._gl.ONE, this._gl.ZERO, this._gl.ONE);
                    this._gl.enable(this._gl.BLEND);
                    break;
            }
        };

        Engine.prototype.setAlphaTesting = function (enable) {
            this._alphaTest = enable;
        };

        Engine.prototype.getAlphaTesting = function () {
            return this._alphaTest;
        };

        // Textures
        Engine.prototype.wipeCaches = function () {
            this._activeTexturesCache = [];
            this._currentEffect = null;
            this._cullingState = null;

            this._cachedVertexBuffers = null;
            this._cachedIndexBuffer = null;
            this._cachedEffectForVertexBuffers = null;
        };

        Engine.prototype.createTexture = function (url, noMipmap, invertY, scene) {
            var _this = this;
            var texture = this._gl.createTexture();

            var extension = url.substr(url.length - 4, 4).toLowerCase();
            var isDDS = this.getCaps().s3tc && (extension === ".dds");
            var isTGA = (extension === ".tga");

            scene._addPendingData(texture);
            texture.url = url;
            texture.noMipmap = noMipmap;
            texture.references = 1;
            this._loadedTexturesCache.push(texture);

            if (isTGA) {
                BABYLON.Tools.LoadFile(url, function (arrayBuffer) {
                    var data = new Uint8Array(arrayBuffer);

                    var header = BABYLON.Internals.TGATools.GetTGAHeader(data);

                    prepareWebGLTexture(texture, _this._gl, scene, header.width, header.height, invertY, noMipmap, false, function () {
                        BABYLON.Internals.TGATools.UploadContent(_this._gl, data);
                    });
                }, null, scene.database, true);
            } else if (isDDS) {
                BABYLON.Tools.LoadFile(url, function (data) {
                    var info = BABYLON.Internals.DDSTools.GetDDSInfo(data);

                    var loadMipmap = info.mipmapCount > 1 && !noMipmap;

                    prepareWebGLTexture(texture, _this._gl, scene, info.width, info.height, invertY, !loadMipmap, true, function () {
                        BABYLON.Internals.DDSTools.UploadDDSLevels(_this._gl, _this.getCaps().s3tc, data, loadMipmap);
                    });
                }, null, scene.database, true);
            } else {
                var onload = function (img) {
                    prepareWebGLTexture(texture, _this._gl, scene, img.width, img.height, invertY, noMipmap, false, function (potWidth, potHeight) {
                        var isPot = (img.width == potWidth && img.height == potHeight);
                        if (!isPot) {
                            _this._workingCanvas.width = potWidth;
                            _this._workingCanvas.height = potHeight;

                            _this._workingContext.drawImage(img, 0, 0, img.width, img.height, 0, 0, potWidth, potHeight);
                        }

                        _this._gl.texImage2D(_this._gl.TEXTURE_2D, 0, _this._gl.RGBA, _this._gl.RGBA, _this._gl.UNSIGNED_BYTE, isPot ? img : _this._workingCanvas);
                    });
                };

                var onerror = function () {
                    scene._removePendingData(texture);
                };

                BABYLON.Tools.LoadImage(url, onload, onerror, scene.database);
            }

            return texture;
        };

        Engine.prototype.createDynamicTexture = function (width, height, generateMipMaps) {
            var texture = this._gl.createTexture();

            width = getExponantOfTwo(width, this._caps.maxTextureSize);
            height = getExponantOfTwo(height, this._caps.maxTextureSize);

            this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.LINEAR);

            if (!generateMipMaps) {
                this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR);
            } else {
                this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR_MIPMAP_LINEAR);
            }
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
        };

        Engine.prototype.updateDynamicTexture = function (texture, canvas, invertY) {
            this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
            this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, invertY ? 1 : 0);
            this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, canvas);
            if (texture.generateMipMaps) {
                this._gl.generateMipmap(this._gl.TEXTURE_2D);
            }
            this._gl.bindTexture(this._gl.TEXTURE_2D, null);
            this._activeTexturesCache = [];
            texture.isReady = true;
        };

        Engine.prototype.updateVideoTexture = function (texture, video, invertY) {
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
        };

        Engine.prototype.createRenderTargetTexture = function (size, options) {
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
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

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
        };

        Engine.prototype.createCubeTexture = function (rootUrl, scene, extensions, noMipmap) {
            var _this = this;
            var gl = this._gl;

            var texture = gl.createTexture();
            texture.isCube = true;
            texture.url = rootUrl;
            texture.references = 1;
            this._loadedTexturesCache.push(texture);

            cascadeLoad(rootUrl, 0, [], scene, function (imgs) {
                var width = getExponantOfTwo(imgs[0].width, _this._caps.maxCubemapTextureSize);
                var height = width;

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

                _this._activeTexturesCache = [];

                texture._width = width;
                texture._height = height;
                texture.isReady = true;
            }, extensions);

            return texture;
        };

        Engine.prototype._releaseTexture = function (texture) {
            var gl = this._gl;

            if (texture._framebuffer) {
                gl.deleteFramebuffer(texture._framebuffer);
            }

            if (texture._depthBuffer) {
                gl.deleteRenderbuffer(texture._depthBuffer);
            }

            gl.deleteTexture(texture);

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
            if (texture instanceof BABYLON.VideoTexture) {
                if (texture.update()) {
                    this._activeTexturesCache[channel] = null;
                }
            } else if (texture.delayLoadState == BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
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
        };

        Engine.prototype._setAnisotropicLevel = function (key, texture) {
            var anisotropicFilterExtension = this._caps.textureAnisotropicFilterExtension;

            if (anisotropicFilterExtension && texture._cachedAnisotropicFilteringLevel !== texture.anisotropicFilteringLevel) {
                this._gl.texParameterf(key, anisotropicFilterExtension.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(texture.anisotropicFilteringLevel, this._caps.maxAnisotropy));
                texture._cachedAnisotropicFilteringLevel = texture.anisotropicFilteringLevel;
            }
        };

        Engine.prototype.readPixels = function (x, y, width, height) {
            var data = new Uint8Array(height * width * 4);
            this._gl.readPixels(0, 0, width, height, this._gl.RGBA, this._gl.UNSIGNED_BYTE, data);
            return data;
        };

        // Dispose
        Engine.prototype.dispose = function () {
            this.stopRenderLoop();

            while (this.scenes.length) {
                this.scenes[0].dispose();
            }

            for (var name in this._compiledEffects) {
                this._gl.deleteProgram(this._compiledEffects[name]._program);
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
        };

        // Statics
        Engine.isSupported = function () {
            try  {
                var tempcanvas = document.createElement("canvas");
                var gl = tempcanvas.getContext("webgl") || tempcanvas.getContext("experimental-webgl");

                return gl != null && !!window.WebGLRenderingContext;
            } catch (e) {
                return false;
            }
        };
        Engine._ALPHA_DISABLE = 0;
        Engine._ALPHA_ADD = 1;
        Engine._ALPHA_COMBINE = 2;

        Engine._DELAYLOADSTATE_NONE = 0;
        Engine._DELAYLOADSTATE_LOADED = 1;
        Engine._DELAYLOADSTATE_LOADING = 2;
        Engine._DELAYLOADSTATE_NOTLOADED = 4;

        Engine.Epsilon = 0.001;
        Engine.CollisionsEpsilon = 0.001;
        Engine.ShadersRepository = "Babylon/Shaders/";
        return Engine;
    })();
    BABYLON.Engine = Engine;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.engine.js.map
