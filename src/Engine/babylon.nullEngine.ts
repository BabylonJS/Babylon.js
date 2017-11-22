module BABYLON {

    export class NullEngineOptions {
        public renderWidth = 512;
        public renderHeight = 256;

        public textureSize = 512;
    }

    /**
     * The null engine class provides support for headless version of babylon.js.
     * This can be used in server side scenario or for testing purposes
     */
    export class NullEngine extends Engine {
        private _options: NullEngineOptions;

        public constructor(options: NullEngineOptions = new NullEngineOptions()) {
            super(null);

            this._options = options;

            // Init caps
            // We consider we are on a webgl1 capable device

            this._caps = new EngineCapabilities();
            this._caps.maxTexturesImageUnits = 16;
            this._caps.maxVertexTextureImageUnits = 16;
            this._caps.maxTextureSize = 512;
            this._caps.maxCubemapTextureSize = 512;
            this._caps.maxRenderTextureSize = 512;
            this._caps.maxVertexAttribs = 16;
            this._caps.maxVaryingVectors = 16;
            this._caps.maxFragmentUniformVectors = 16;
            this._caps.maxVertexUniformVectors = 16;

            // Extensions
            this._caps.standardDerivatives = false;

            this._caps.astc = null;
            this._caps.s3tc = null;
            this._caps.pvrtc = null;
            this._caps.etc1 = null;
            this._caps.etc2 = null;

            this._caps.textureAnisotropicFilterExtension = null;
            this._caps.maxAnisotropy = 0;
            this._caps.uintIndices = false;
            this._caps.fragmentDepthSupported = false;
            this._caps.highPrecisionShaderSupported = true;

            this._caps.colorBufferFloat = false;
            this._caps.textureFloat = false;
            this._caps.textureFloatLinearFiltering = false;
            this._caps.textureFloatRender = false;

            this._caps.textureHalfFloat = false;
            this._caps.textureHalfFloatLinearFiltering = false;
            this._caps.textureHalfFloatRender = false;

            this._caps.textureLOD = false;
            this._caps.drawBuffersExtension = false;

            this._caps.depthTextureExtension = false;
            this._caps.vertexArrayObject = false;
            this._caps.instancedArrays = false;

            Tools.Log("Babylon.js null engine (v" + Engine.Version + ") launched");

            // Wrappers
            if (typeof URL === "undefined") {
                (<any>URL) = {
                    createObjectURL: function () { },
                    revokeObjectURL: function () { }
                }
            }

            if (typeof Blob === "undefined") {
                (<any>Blob) = function () { };
            }
        }

        public createVertexBuffer(vertices: FloatArray): WebGLBuffer {
            return {
                capacity: 0,
                references: 1,
                is32Bits: false
            };
        }

        public createIndexBuffer(indices: IndicesArray): WebGLBuffer {
            return {
                capacity: 0,
                references: 1,
                is32Bits: false
            };
        }

        public clear(color: Color4, backBuffer: boolean, depth: boolean, stencil: boolean = false): void {
        }

        public getRenderWidth(useScreen = false): number {
            if (!useScreen && this._currentRenderTarget) {
                return this._currentRenderTarget.width;
            }

            return this._options.renderWidth;
        }

        public getRenderHeight(useScreen = false): number {
            if (!useScreen && this._currentRenderTarget) {
                return this._currentRenderTarget.height;
            }

            return this._options.renderHeight;
        }

        public setViewport(viewport: Viewport, requiredWidth?: number, requiredHeight?: number): void {
            this._cachedViewport = viewport;
        }

        public createShaderProgram(vertexCode: string, fragmentCode: string, defines: string, context?: WebGLRenderingContext): WebGLProgram {
            return {
                transformFeedback: null,
                __SPECTOR_rebuildProgram: null
            };
        }

        public getUniforms(shaderProgram: WebGLProgram, uniformsNames: string[]): WebGLUniformLocation[] {
            return [];
        }

        public getAttributes(shaderProgram: WebGLProgram, attributesNames: string[]): number[] {
            return [];
        }

        public bindSamplers(effect: Effect): void {
            this._currentEffect = null;
        }

        public enableEffect(effect: Effect): void {
            this._currentEffect = effect;

            if (effect.onBind) {
                effect.onBind(effect);
            }
            effect.onBindObservable.notifyObservers(effect);
        }

        public setState(culling: boolean, zOffset: number = 0, force?: boolean, reverseSide = false): void {
        }

        public setIntArray(uniform: WebGLUniformLocation, array: Int32Array): void {
        }

        public setIntArray2(uniform: WebGLUniformLocation, array: Int32Array): void {
        }

        public setIntArray3(uniform: WebGLUniformLocation, array: Int32Array): void {
        }

        public setIntArray4(uniform: WebGLUniformLocation, array: Int32Array): void {
        }

        public setFloatArray(uniform: WebGLUniformLocation, array: Float32Array): void {
        }

        public setFloatArray2(uniform: WebGLUniformLocation, array: Float32Array): void {
        }

        public setFloatArray3(uniform: WebGLUniformLocation, array: Float32Array): void {
        }

        public setFloatArray4(uniform: WebGLUniformLocation, array: Float32Array): void {
        }

        public setArray(uniform: WebGLUniformLocation, array: number[]): void {
        }

        public setArray2(uniform: WebGLUniformLocation, array: number[]): void {
        }

        public setArray3(uniform: WebGLUniformLocation, array: number[]): void {
        }

        public setArray4(uniform: WebGLUniformLocation, array: number[]): void {
        }

        public setMatrices(uniform: WebGLUniformLocation, matrices: Float32Array): void {
        }

        public setMatrix(uniform: WebGLUniformLocation, matrix: Matrix): void {
        }

        public setMatrix3x3(uniform: WebGLUniformLocation, matrix: Float32Array): void {
        }

        public setMatrix2x2(uniform: WebGLUniformLocation, matrix: Float32Array): void {
        }

        public setFloat(uniform: WebGLUniformLocation, value: number): void {
        }

        public setFloat2(uniform: WebGLUniformLocation, x: number, y: number): void {
        }

        public setFloat3(uniform: WebGLUniformLocation, x: number, y: number, z: number): void {
        }

        public setBool(uniform: WebGLUniformLocation, bool: number): void {
        }

        public setFloat4(uniform: WebGLUniformLocation, x: number, y: number, z: number, w: number): void {
        }

        public setColor3(uniform: WebGLUniformLocation, color3: Color3): void {
        }

        public setColor4(uniform: WebGLUniformLocation, color3: Color3, alpha: number): void {
        }

        public setAlphaMode(mode: number, noDepthWriteChange: boolean = false): void {
            if (this._alphaMode === mode) {
                return;
            }

            this._alphaState.alphaBlend = (mode !== Engine.ALPHA_DISABLE);

            if (!noDepthWriteChange) {
                this.setDepthWrite(mode === Engine.ALPHA_DISABLE);
            }
            this._alphaMode = mode;
        }

        public bindBuffers(vertexBuffers: { [key: string]: VertexBuffer; }, indexBuffer: WebGLBuffer, effect: Effect): void {
        }

        public wipeCaches(bruteForce?: boolean): void {
            if (this.preventCacheWipeBetweenFrames) {
                return;
            }
            this.resetTextureCache();
            this._currentEffect = null;

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
        }

        public draw(useTriangles: boolean, indexStart: number, indexCount: number, instancesCount?: number): void {
        }

        public _createTexture(): WebGLTexture {
            return {};
        }

        public createTexture(urlArg: string, noMipmap: boolean, invertY: boolean, scene: Scene, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, onLoad: Nullable<() => void> = null, onError: Nullable<(message: string, exception: any) => void> = null, buffer: Nullable<ArrayBuffer | HTMLImageElement> = null, fallBack?: InternalTexture, format?: number): InternalTexture {
            var texture = new InternalTexture(this, InternalTexture.DATASOURCE_URL);
            var url = String(urlArg);

            texture.url = url;
            texture.generateMipMaps = !noMipmap;
            texture.samplingMode = samplingMode;
            texture.invertY = invertY;
            texture.baseWidth = this._options.textureSize;
            texture.baseHeight = this._options.textureSize;
            texture.width = this._options.textureSize;
            texture.height = this._options.textureSize;
            if (format) {
                texture.format = format;
            }

            texture.isReady = true;

            if (onLoad) {
                onLoad();
            }

            return texture;
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
            var texture = new InternalTexture(this, InternalTexture.DATASOURCE_RENDERTARGET);

            var width = size.width || size;
            var height = size.height || size;

            texture._depthStencilBuffer = {};
            texture._framebuffer = {};
            texture.baseWidth = width;
            texture.baseHeight = height;
            texture.width = width;
            texture.height = height;
            texture.isReady = true;
            texture.samples = 1;
            texture.generateMipMaps = fullOptions.generateMipMaps ? true : false;
            texture.samplingMode = fullOptions.samplingMode;
            texture.type = fullOptions.type;
            texture._generateDepthBuffer = fullOptions.generateDepthBuffer;
            texture._generateStencilBuffer = fullOptions.generateStencilBuffer ? true : false;
            return texture;
        }

        public updateTextureSamplingMode(samplingMode: number, texture: InternalTexture): void {
            texture.samplingMode = samplingMode;
        }

        public bindFramebuffer(texture: InternalTexture, faceIndex?: number, requiredWidth?: number, requiredHeight?: number, forceFullscreenViewport?: boolean): void {
            if (this._currentRenderTarget) {
                this.unBindFramebuffer(this._currentRenderTarget);
            }
            this._currentRenderTarget = texture;
            this._currentFramebuffer = texture._MSAAFramebuffer ? texture._MSAAFramebuffer : texture._framebuffer;
            if (this._cachedViewport && !forceFullscreenViewport) {
                this.setViewport(this._cachedViewport, requiredWidth, requiredHeight);
            }
        }

        public unBindFramebuffer(texture: InternalTexture, disableGenerateMipMaps = false, onBeforeUnbind?: () => void): void {
            this._currentRenderTarget = null;

            if (onBeforeUnbind) {
                if (texture._MSAAFramebuffer) {
                    this._currentFramebuffer = texture._framebuffer;
                }
                onBeforeUnbind();
            }
            this._currentFramebuffer = null;
        }

        public createDynamicVertexBuffer(vertices: FloatArray): WebGLBuffer {
            var vbo = {
                capacity: 1,
                references: 1,
                is32Bits: false
            }

            return vbo;
        }

        public updateDynamicIndexBuffer(indexBuffer: WebGLBuffer, indices: IndicesArray, offset: number = 0): void {
        }

        public updateDynamicVertexBuffer(vertexBuffer: WebGLBuffer, vertices: FloatArray, offset?: number, count?: number): void {
        }

        public _bindTextureDirectly(target: number, texture: InternalTexture): void {
            if (this._boundTexturesCache[this._activeTextureChannel] !== texture) {
                this._boundTexturesCache[this._activeTextureChannel] = texture;
            }
        }

        public _bindTexture(channel: number, texture: InternalTexture): void {
            if (channel < 0) {
                return;
            }

            this._bindTextureDirectly(0, texture);
        }

        public _releaseBuffer(buffer: WebGLBuffer): boolean {
            buffer.references--;

            if (buffer.references === 0) {
                return true;
            }

            return false;
        }
    }
}
