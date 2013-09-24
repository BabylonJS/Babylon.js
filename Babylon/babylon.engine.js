var BABYLON = BABYLON || {};

(function () {
    BABYLON.Engine = function (canvas, antialias) {
        this._renderingCanvas = canvas;

        // GL
        try {
            this._gl = canvas.getContext("webgl", { antialias: antialias }) || canvas.getContext("experimental-webgl", { antialias: antialias });
        } catch (e) {
            throw new Error("WebGL not supported");
        }

        if (!this._gl) {
            throw new Error("WebGL not supported");
        }

        // Options
        this.forceWireframe = false;
        this.cullBackFaces = true;

        // Scenes
        this.scenes = [];

        // Textures
        this._workingCanvas = document.createElement("canvas");
        this._workingContext = this._workingCanvas.getContext("2d");

        // Viewport
        this._hardwareScalingLevel = 1.0 / (window.devicePixelRatio || 1.0);
        this.resize();

        // Caps
        this._caps = {};
        this._caps.maxTexturesImageUnits = this._gl.getParameter(this._gl.MAX_TEXTURE_IMAGE_UNITS);
        this._caps.maxTextureSize = this._gl.getParameter(this._gl.MAX_TEXTURE_SIZE);
        this._caps.maxCubemapTextureSize = this._gl.getParameter(this._gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        this._caps.maxRenderTextureSize = this._gl.getParameter(this._gl.MAX_RENDERBUFFER_SIZE);

        // Extensions
        var derivatives = this._gl.getExtension('OES_standard_derivatives');
        this._caps.standardDerivatives = (derivatives !== null);

        // Cache
        this._loadedTexturesCache = [];
        this._activeTexturesCache = [];
        this._currentEffect = null;
        this._currentState = {
            culling: null
        };

        this._compiledEffects = {};

        this._gl.enable(this._gl.DEPTH_TEST);
        this._gl.depthFunc(this._gl.LEQUAL);

        // Fullscreen
        this.isFullscreen = false;
        var that = this;

        var onFullscreenChange = function () {
            if (document.fullscreen !== undefined) {
                that.isFullscreen = document.fullscreen;
            } else if (document.mozFullScreen !== undefined) {
                that.isFullscreen = document.mozFullScreen;
            } else if (document.webkitIsFullScreen !== undefined) {
                that.isFullscreen = document.webkitIsFullScreen;
            } else if (document.msIsFullScreen !== undefined) {
                that.isFullscreen = document.msIsFullScreen;
            }

            // Pointer lock
            if (that.isFullscreen && that._pointerLockRequested) {
                canvas.requestPointerLock = canvas.requestPointerLock ||
                                            canvas.msRequestPointerLock ||
                                            canvas.mozRequestPointerLock ||
                                            canvas.webkitRequestPointerLock;

                if (canvas.requestPointerLock) {
                    canvas.requestPointerLock();
                }
            }
        };

        document.addEventListener("fullscreenchange", onFullscreenChange, false);
        document.addEventListener("mozfullscreenchange", onFullscreenChange, false);
        document.addEventListener("webkitfullscreenchange", onFullscreenChange, false);
        document.addEventListener("msfullscreenchange", onFullscreenChange, false);

        // Pointer lock
        this.isPointerLock = false;

        var onPointerLockChange = function () {
            that.isPointerLock = (document.mozPointerLockElement === canvas ||
                                  document.webkitPointerLockElement === canvas ||
                                  document.msPointerLockElement === canvas ||
                                  document.pointerLockElement === canvas
            );
        };

        document.addEventListener("pointerlockchange", onPointerLockChange, false);
        document.addEventListener("mspointerlockchange", onPointerLockChange, false);
        document.addEventListener("mozpointerlockchange", onPointerLockChange, false);
        document.addEventListener("webkitpointerlockchange", onPointerLockChange, false);
    };

    // Properties
    BABYLON.Engine.prototype.getAspectRatio = function () {
        return this._aspectRatio;
    };

    BABYLON.Engine.prototype.getRenderWidth = function () {
        return this._renderingCanvas.width;
    };

    BABYLON.Engine.prototype.getRenderHeight = function () {
        return this._renderingCanvas.height;
    };

    BABYLON.Engine.prototype.getRenderingCanvas = function () {
        return this._renderingCanvas;
    };

    BABYLON.Engine.prototype.setHardwareScalingLevel = function (level) {
        this._hardwareScalingLevel = level;
        this.resize();
    };

    BABYLON.Engine.prototype.getHardwareScalingLevel = function () {
        return this._hardwareScalingLevel;
    };

    BABYLON.Engine.prototype.getLoadedTexturesCache = function () {
        return this._loadedTexturesCache;
    };

    BABYLON.Engine.prototype.getCaps = function () {
        return this._caps;
    };

    // Methods
    BABYLON.Engine.prototype.stopRenderLoop = function () {
        this._renderFunction = null;
        this._runningLoop = false;
    };

    BABYLON.Engine.prototype._renderLoop = function () {
        // Start new frame
        this.beginFrame();

        if (this._renderFunction) {
            this._renderFunction();
        }

        // Present
        this.endFrame();

        if (this._runningLoop) {
            // Register new frame
            var that = this;
            BABYLON.Tools.QueueNewFrame(function () {
                that._renderLoop();
            });
        }
    };

    BABYLON.Engine.prototype.runRenderLoop = function (renderFunction) {
        this._runningLoop = true;

        this._renderFunction = renderFunction;

        var that = this;
        BABYLON.Tools.QueueNewFrame(function () {
            that._renderLoop();
        });
    };

    BABYLON.Engine.prototype.switchFullscreen = function (requestPointerLock) {
        if (this.isFullscreen) {
            BABYLON.Tools.ExitFullscreen();
        } else {
            this._pointerLockRequested = requestPointerLock;
            BABYLON.Tools.RequestFullscreen(this._renderingCanvas);
        }
    };

    BABYLON.Engine.prototype.clear = function (color, backBuffer, depthStencil) {
        this._gl.clearColor(color.r, color.g, color.b, 1.0);
        this._gl.clearDepth(1.0);
        var mode = 0;

        if (backBuffer || this.forceWireframe)
            mode |= this._gl.COLOR_BUFFER_BIT;

        if (depthStencil)
            mode |= this._gl.DEPTH_BUFFER_BIT;

        this._gl.clear(mode);
    };

    BABYLON.Engine.prototype.beginFrame = function () {
        BABYLON.Tools._MeasureFps();

        this._gl.viewport(0, 0, this._renderingCanvas.width, this._renderingCanvas.height);
    };

    BABYLON.Engine.prototype.endFrame = function () {
        this.flushFramebuffer();
    };

    BABYLON.Engine.prototype.resize = function () {
        this._renderingCanvas.width = this._renderingCanvas.clientWidth / this._hardwareScalingLevel;
        this._renderingCanvas.height = this._renderingCanvas.clientHeight / this._hardwareScalingLevel;
        this._aspectRatio = this._renderingCanvas.width / this._renderingCanvas.height;
    };

    BABYLON.Engine.prototype.bindFramebuffer = function (texture) {
        var gl = this._gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, texture._framebuffer);
        gl.viewport(0.0, 0.0, texture._size, texture._size);

        this.wipeCaches();
    };

    BABYLON.Engine.prototype.unBindFramebuffer = function (texture) {
        if (texture.generateMipMaps) {
            var gl = this._gl;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    };

    BABYLON.Engine.prototype.flushFramebuffer = function () {
        this._gl.flush();
    };

    BABYLON.Engine.prototype.restoreDefaultFramebuffer = function () {
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        this._gl.viewport(0, 0, this._renderingCanvas.width, this._renderingCanvas.height);

        this.wipeCaches();
    };

    // VBOs
    BABYLON.Engine.prototype.createVertexBuffer = function (vertices) {
        var vbo = this._gl.createBuffer();
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(vertices), this._gl.STATIC_DRAW);
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
        vbo.references = 1;
        return vbo;
    };

    BABYLON.Engine.prototype.createDynamicVertexBuffer = function (capacity) {
        var vbo = this._gl.createBuffer();
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vbo);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, capacity, this._gl.DYNAMIC_DRAW);
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
        vbo.references = 1;
        return vbo;
    };

    BABYLON.Engine.prototype.updateDynamicVertexBuffer = function (vertexBuffer, vertices, length) {
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer);
        // Should be (vertices instanceof Float32Array ? vertices : new Float32Array(vertices)) but Chrome raises an Exception in this case :(
        if (length) {
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, new Float32Array(vertices, 0, length));
        } else {
            this._gl.bufferSubData(this._gl.ARRAY_BUFFER, 0, new Float32Array(vertices));
        }
        
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
    };

    BABYLON.Engine.prototype.createIndexBuffer = function (indices) {
        var vbo = this._gl.createBuffer();
        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, vbo);
        this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this._gl.STATIC_DRAW);
        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, null);
        vbo.references = 1;
        return vbo;
    };

    BABYLON.Engine.prototype.bindBuffers = function (vertexBuffer, indexBuffer, vertexDeclaration, vertexStrideSize, effect) {
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

    BABYLON.Engine.prototype.bindMultiBuffers = function (vertexBuffers, indexBuffer, effect) {
        if (this._cachedVertexBuffers !== vertexBuffers || this._cachedEffectForVertexBuffers !== effect) {
            this._cachedVertexBuffers = vertexBuffers;
            this._cachedEffectForVertexBuffers = effect;

            var attributes = effect.getAttributesNames();

            for (var index = 0; index < attributes.length; index++) {
                var order = effect.getAttribute(index);

                if (order >= 0) {
                    var vertexBuffer = vertexBuffers[attributes[index]];
                    var stride = vertexBuffer.getStrideSize();
                    this._gl.bindBuffer(this._gl.ARRAY_BUFFER, vertexBuffer._buffer);
                    this._gl.vertexAttribPointer(order, stride, this._gl.FLOAT, false, stride * 4, 0);
                }
            }
        }

        if (this._cachedIndexBuffer !== indexBuffer) {
            this._cachedIndexBuffer = indexBuffer;
            this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        }
    };

    BABYLON.Engine.prototype._releaseBuffer = function (buffer) {
        buffer.references--;

        if (buffer.references === 0) {
            this._gl.deleteBuffer(buffer);
        }
    };

    BABYLON.Engine.prototype.draw = function (useTriangles, indexStart, indexCount) {
        this._gl.drawElements(useTriangles ? this._gl.TRIANGLES : this._gl.LINES, indexCount, this._gl.UNSIGNED_SHORT, indexStart * 2);
    };

    // Shaders
    BABYLON.Engine.prototype.createEffect = function (baseName, attributesNames, uniformsNames, samplers, defines) {
        var name = baseName + "@" + defines;
        if (this._compiledEffects[name]) {
            return this._compiledEffects[name];
        }

        var effect = new BABYLON.Effect(baseName, attributesNames, uniformsNames, samplers, this, defines);
        this._compiledEffects[name] = effect;

        return effect;
    };

    var compileShader = function (gl, source, type, defines) {
        var shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);

        gl.shaderSource(shader, (defines ? defines + "\n" : "") + source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
    };

    BABYLON.Engine.prototype.createShaderProgram = function (vertexCode, fragmentCode, defines) {
        var vertexShader = compileShader(this._gl, vertexCode, "vertex", defines);
        var fragmentShader = compileShader(this._gl, fragmentCode, "fragment", defines);

        var shaderProgram = this._gl.createProgram();
        this._gl.attachShader(shaderProgram, vertexShader);
        this._gl.attachShader(shaderProgram, fragmentShader);

        this._gl.linkProgram(shaderProgram);

        var error = this._gl.getProgramInfoLog(shaderProgram);
        if (error) {
            throw new Error(error);
        }

        this._gl.deleteShader(vertexShader);
        this._gl.deleteShader(fragmentShader);

        return shaderProgram;
    };

    BABYLON.Engine.prototype.getUniforms = function (shaderProgram, uniformsNames) {
        var results = [];

        for (var index = 0; index < uniformsNames.length; index++) {
            results.push(this._gl.getUniformLocation(shaderProgram, uniformsNames[index]));
        }

        return results;
    };

    BABYLON.Engine.prototype.getAttributes = function (shaderProgram, attributesNames) {
        var results = [];

        for (var index = 0; index < attributesNames.length; index++) {
            try {
                results.push(this._gl.getAttribLocation(shaderProgram, attributesNames[index]));
            } catch (e) {
                results.push(-1);
            }
        }

        return results;
    };

    BABYLON.Engine.prototype.enableEffect = function (effect) {
        if (!effect || !effect.getAttributesCount() || this._currentEffect === effect) {
            return;
        }
        // Use program
        this._gl.useProgram(effect.getProgram());

        for (var index = 0; index < effect.getAttributesCount() ; index++) {
            // Attributes
            var order = effect.getAttribute(index);

            if (order >= 0) {
                this._gl.enableVertexAttribArray(effect.getAttribute(index));
            }
        }

        this._currentEffect = effect;
    };

    BABYLON.Engine.prototype.setMatrices = function (uniform, matrices) {
        if (!uniform)
            return;

        this._gl.uniformMatrix4fv(uniform, false, matrices);
    };

    BABYLON.Engine.prototype.setMatrix = function (uniform, matrix) {
        if (!uniform)
            return;

        this._gl.uniformMatrix4fv(uniform, false, matrix.toArray());
    };

    BABYLON.Engine.prototype.setVector2 = function (uniform, x, y) {
        if (!uniform)
            return;

        this._gl.uniform2f(uniform, x, y);
    };

    BABYLON.Engine.prototype.setVector3 = function (uniform, vector3) {
        if (!uniform)
            return;

        this._gl.uniform3f(uniform, vector3.x, vector3.y, vector3.z);
    };

    BABYLON.Engine.prototype.setFloat2 = function (uniform, x, y) {
        if (!uniform)
            return;

        this._gl.uniform2f(uniform, x, y);
    };

    BABYLON.Engine.prototype.setFloat3 = function (uniform, x, y, z) {
        if (!uniform)
            return;

        this._gl.uniform3f(uniform, x, y, z);
    };

    BABYLON.Engine.prototype.setBool = function (uniform, bool) {
        if (!uniform)
            return;

        this._gl.uniform1i(uniform, bool);
    };

    BABYLON.Engine.prototype.setFloat4 = function (uniform, x, y, z, w) {
        if (!uniform)
            return;

        this._gl.uniform4f(uniform, x, y, z, w);
    };

    BABYLON.Engine.prototype.setColor3 = function (uniform, color3) {
        if (!uniform)
            return;

        this._gl.uniform3f(uniform, color3.r, color3.g, color3.b);
    };

    BABYLON.Engine.prototype.setColor4 = function (uniform, color3, alpha) {
        if (!uniform)
            return;

        this._gl.uniform4f(uniform, color3.r, color3.g, color3.b, alpha);
    };

    // States
    BABYLON.Engine.prototype.setState = function (culling) {
        // Culling        
        if (this._currentState.culling !== culling) {
            if (culling) {
                this._gl.cullFace(this.cullBackFaces ? this._gl.BACK : this._gl.FRONT);
                this._gl.enable(this._gl.CULL_FACE);
            } else {
                this._gl.disable(this._gl.CULL_FACE);
            }

            this._currentState.culling = culling;
        }
    };

    BABYLON.Engine.prototype.setDepthBuffer = function (enable) {
        if (enable) {
            this._gl.enable(this._gl.DEPTH_TEST);
        } else {
            this._gl.disable(this._gl.DEPTH_TEST);
        }
    };

    BABYLON.Engine.prototype.setDepthWrite = function (enable) {
        this._gl.depthMask(enable);
    };

    BABYLON.Engine.prototype.setColorWrite = function (enable) {
        this._gl.colorMask(enable, enable, enable, enable);
    };

    BABYLON.Engine.prototype.setAlphaMode = function (mode) {

        switch (mode) {
            case BABYLON.Engine.ALPHA_DISABLE:
                this.setDepthWrite(true);
                this._gl.disable(this._gl.BLEND);
                break;
            case BABYLON.Engine.ALPHA_COMBINE:
                this.setDepthWrite(false);
                this._gl.blendFuncSeparate(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ZERO, this._gl.ONE);
                this._gl.enable(this._gl.BLEND);
                break;
            case BABYLON.Engine.ALPHA_ADD:
                this.setDepthWrite(false);
                this._gl.blendFuncSeparate(this._gl.ONE, this._gl.ONE, this._gl.ZERO, this._gl.ONE);
                this._gl.enable(this._gl.BLEND);
                break;
        }
    };

    BABYLON.Engine.prototype.setAlphaTesting = function (enable) {
        this._alphaTest = enable;
    };

    BABYLON.Engine.prototype.getAlphaTesting = function () {
        return this._alphaTest;
    };

    // Textures
    BABYLON.Engine.prototype.wipeCaches = function () {
        this._activeTexturesCache = [];
        this._currentEffect = null;
        this._currentState = {
            culling: null
        };

        this._cachedVertexBuffers = null;
        this._cachedVertexBuffers = null;
        this._cachedEffectForVertexBuffers = null;
    };

    var getExponantOfTwo = function (value, max) {
        var count = 1;

        do {
            count *= 2;
        } while (count < value);

        if (count > max)
            count = max;

        return count;
    };

    BABYLON.Engine.prototype.createTexture = function (url, noMipmap, invertY, scene) {
        var texture = this._gl.createTexture();
        var that = this;
        
        var onload = function (img) {
            var potWidth = getExponantOfTwo(img.width, that._caps.maxTextureSize);
            var potHeight = getExponantOfTwo(img.height, that._caps.maxTextureSize);
            var isPot = (img.width == potWidth && img.height == potHeight);

            if (!isPot) {
                that._workingCanvas.width = potWidth;
                that._workingCanvas.height = potHeight;

                that._workingContext.drawImage(img, 0, 0, img.width, img.height, 0, 0, potWidth, potHeight);
            };
            
            that._gl.bindTexture(that._gl.TEXTURE_2D, texture);
            that._gl.pixelStorei(that._gl.UNPACK_FLIP_Y_WEBGL, invertY === undefined ? true : invertY);
            that._gl.texImage2D(that._gl.TEXTURE_2D, 0, that._gl.RGBA, that._gl.RGBA, that._gl.UNSIGNED_BYTE, isPot ? img : that._workingCanvas);
            that._gl.texParameteri(that._gl.TEXTURE_2D, that._gl.TEXTURE_MAG_FILTER, that._gl.LINEAR);

            if (noMipmap) {
                that._gl.texParameteri(that._gl.TEXTURE_2D, that._gl.TEXTURE_MIN_FILTER, that._gl.LINEAR);
            } else {
                that._gl.texParameteri(that._gl.TEXTURE_2D, that._gl.TEXTURE_MIN_FILTER, that._gl.LINEAR_MIPMAP_LINEAR);
                that._gl.generateMipmap(that._gl.TEXTURE_2D);
            }
            that._gl.bindTexture(that._gl.TEXTURE_2D, null);

            that._activeTexturesCache = [];
            texture._baseWidth = img.width;
            texture._baseHeight = img.height;
            texture._width = potWidth;
            texture._height = potHeight;
            texture.isReady = true;
            scene._removePendingData(texture);
        };

        var onerror = function () {
            scene._removePendingData(texture);
        };

        scene._addPendingData(texture);
        BABYLON.Tools.LoadImage(url, onload, onerror, scene.database);

        texture.url = url;
        texture.noMipmap = noMipmap;
        texture.references = 1;
        this._loadedTexturesCache.push(texture);

        return texture;
    };

    BABYLON.Engine.prototype.createDynamicTexture = function (size, generateMipMaps) {
        var texture = this._gl.createTexture();

        var width = getExponantOfTwo(size, this._caps.maxTextureSize);
        var height = width;

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

    BABYLON.Engine.prototype.updateDynamicTexture = function (texture, canvas, invertY) {
        this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
        this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, invertY);
        this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, canvas);
        if (texture.generateMipMaps) {
            this._gl.generateMipmap(this._gl.TEXTURE_2D);
        }
        this._gl.bindTexture(this._gl.TEXTURE_2D, null);
        this._activeTexturesCache = [];
        texture.isReady = true;
    };

    BABYLON.Engine.prototype.updateVideoTexture = function (texture, video) {
        this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
        this._gl.pixelStorei(this._gl.UNPACK_FLIP_Y_WEBGL, false);

        // Scale the video if it is a NPOT
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

    BABYLON.Engine.prototype.createRenderTargetTexture = function (size, generateMipMaps) {
        var gl = this._gl;

        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, generateMipMaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        // Create the depth buffer
        var depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size, size);

        // Create the framebuffer
        var framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

        // Unbind
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        texture._framebuffer = framebuffer;
        texture._depthBuffer = depthBuffer;
        texture._size = size;
        texture.isReady = true;
        texture.generateMipMaps = generateMipMaps;
        texture.references = 1;
        this._activeTexturesCache = [];

        this._loadedTexturesCache.push(texture);

        return texture;
    };

    var extensions = ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"];

    var cascadeLoad = function (rootUrl, index, loadedImages, scene, onfinish) {
        var img;
        
        var onload = function () {
            loadedImages.push(img);

            scene._removePendingData(img);

            if (index != extensions.length - 1) {
                cascadeLoad(rootUrl, index + 1, loadedImages, scene, onfinish);
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

    BABYLON.Engine.prototype.createCubeTexture = function (rootUrl, scene) {
        var gl = this._gl;

        var texture = gl.createTexture();
        texture.isCube = true;
        texture.url = rootUrl;
        texture.references = 1;
        this._loadedTexturesCache.push(texture);

        var that = this;
        cascadeLoad(rootUrl, 0, [], scene, function (imgs) {
            var width = getExponantOfTwo(imgs[0].width);
            var height = width;

            that._workingCanvas.width = width;
            that._workingCanvas.height = height;

            var faces = [
                gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                gl.TEXTURE_CUBE_MAP_NEGATIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
            ];

            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

            for (var index = 0; index < faces.length; index++) {
                that._workingContext.drawImage(imgs[index], 0, 0, imgs[index].width, imgs[index].height, 0, 0, width, height);
                gl.texImage2D(faces[index], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, that._workingCanvas);
            }

            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

            that._activeTexturesCache = [];

            texture._width = width;
            texture._height = height;
            texture.isReady = true;
        });

        return texture;
    };

    BABYLON.Engine.prototype._releaseTexture = function (texture) {
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
    };

    BABYLON.Engine.prototype.bindSamplers = function (effect) {
        this._gl.useProgram(effect.getProgram());
        var samplers = effect.getSamplers();
        for (var index = 0; index < samplers.length; index++) {
            var uniform = effect.getUniform(samplers[index]);
            this._gl.uniform1i(uniform, index);
        }
        this._currentEffect = null;
    };

    BABYLON.Engine.prototype.setTexture = function (channel, texture) {
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
            if (texture._update()) {
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
                this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_WRAP_S, texture.coordinatesMode !== BABYLON.CubeTexture.CUBIC_MODE ? this._gl.REPEAT : this._gl.CLAMP_TO_EDGE);
                this._gl.texParameteri(this._gl.TEXTURE_CUBE_MAP, this._gl.TEXTURE_WRAP_T, texture.coordinatesMode !== BABYLON.CubeTexture.CUBIC_MODE ? this._gl.REPEAT : this._gl.CLAMP_TO_EDGE);
            }
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
        }
    };

    // Dispose
    BABYLON.Engine.prototype.dispose = function () {
        // Release scenes
        while (this.scenes.length) {
            this.scenes[0].dispose();
        }

        // Release effects
        for (var name in this._compiledEffects.length) {
            this._gl.deleteProgram(this._compiledEffects[name]._program);
        }
    };

    // Statics
    BABYLON.Engine.ShadersRepository = "Babylon/Shaders/";

    BABYLON.Engine.ALPHA_DISABLE = 0;
    BABYLON.Engine.ALPHA_ADD = 1;
    BABYLON.Engine.ALPHA_COMBINE = 2;
    
    // Statics
    BABYLON.Engine.DELAYLOADSTATE_NONE = 0;
    BABYLON.Engine.DELAYLOADSTATE_LOADED = 1;
    BABYLON.Engine.DELAYLOADSTATE_LOADING = 2;
    BABYLON.Engine.DELAYLOADSTATE_NOTLOADED = 4;

    BABYLON.Engine.epsilon = 0.001;
    BABYLON.Engine.collisionsEpsilon = 0.001;

    BABYLON.Engine.isSupported = function () {
        try {
            var tempcanvas = document.createElement("canvas");
            var gl = tempcanvas.getContext("webgl") || tempcanvas.getContext("experimental-webgl");

            return gl != null && !!window.WebGLRenderingContext;
        } catch (e) {
            return false;
        }
    };
})();