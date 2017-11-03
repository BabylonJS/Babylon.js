module BABYLON {
    export class InternalTexture {

        public static DATASOURCE_UNKNOWN = 0;
        public static DATASOURCE_URL = 1;
        public static DATASOURCE_TEMP = 2;
        public static DATASOURCE_RAW = 3;
        public static DATASOURCE_DYNAMIC = 4;
        public static DATASOURCE_RENDERTARGET = 5;
        public static DATASOURCE_MULTIRENDERTARGET = 6;
        public static DATASOURCE_CUBE = 7;
        public static DATASOURCE_CUBERAW = 8;
        public static DATASOURCE_CUBEPREFILTERED = 9;
        public static DATASOURCE_RAW3D = 10;

        public isReady: boolean;
        public isCube: boolean;
        public is3D: boolean;
        public url: string;
        public samplingMode: number;
        public generateMipMaps: boolean;
        public samples: number;
        public type: number;
        public format: number;
        public onLoadedObservable = new Observable<InternalTexture>();
        public width: number;
        public height: number;
        public depth: number;
        public baseWidth: number;
        public baseHeight: number;
        public baseDepth: number;
        public invertY: boolean;

        // Private
        public _dataSource = InternalTexture.DATASOURCE_UNKNOWN;
        public _buffer: Nullable<ArrayBuffer | HTMLImageElement>;
        public _bufferView: Nullable<ArrayBufferView>;
        public _bufferViewArray: Nullable<ArrayBufferView[]>;
        public _size: number;
        public _extension: string;
        public _files: Nullable<string[]>;
        public _workingCanvas: HTMLCanvasElement;
        public _workingContext: CanvasRenderingContext2D;
        public _framebuffer: Nullable<WebGLFramebuffer>;
        public _depthStencilBuffer: Nullable<WebGLRenderbuffer>;
        public _MSAAFramebuffer: Nullable<WebGLFramebuffer>;
        public _MSAARenderBuffer: Nullable<WebGLRenderbuffer>;
        public _cachedCoordinatesMode: Nullable<number>;
        public _cachedWrapU: Nullable<number>;
        public _cachedWrapV: Nullable<number>;
        public _cachedWrapR: Nullable<number>;
        public _cachedAnisotropicFilteringLevel: Nullable<number>;
        public _isDisabled: boolean;
        public _compression: Nullable<string>;
        public _generateStencilBuffer: boolean;
        public _generateDepthBuffer: boolean;
        public _sphericalPolynomial: Nullable<SphericalPolynomial>;
        public _lodGenerationScale: number;
        public _lodGenerationOffset: number;
        // The following three fields helps sharing generated fixed LODs for texture filtering
        // In environment not supporting the textureLOD extension like EDGE. They are for internal use only.
        // They are at the level of the gl texture to benefit from the cache.
        public _lodTextureHigh: BaseTexture;
        public _lodTextureMid: BaseTexture;
        public _lodTextureLow: BaseTexture;

        public _webGLTexture: Nullable<WebGLTexture>;
        public _references: number = 1;
        private _engine: Engine;

        public get dataSource(): number {
            return this._dataSource;
        }

        constructor(engine: Engine, dataSource: number) {
            this._engine = engine;
            this._dataSource = dataSource;
            
            this._webGLTexture = engine._createTexture();
        }

        public incrementReferences(): void {
            this._references++;
        }

        public updateSize(width: int, height: int, depth: int = 1): void {
            this.width = width;
            this.height = height;
            this.depth = depth;

            this.baseWidth = width;
            this.baseHeight = height;
            this.baseDepth = depth;

            this._size = width * height * depth;
        }

        public _rebuild(): void {
            var proxy: InternalTexture;
            this.isReady = false;
            this._cachedCoordinatesMode = null;
            this._cachedWrapU = null;
            this._cachedWrapV = null;
            this._cachedAnisotropicFilteringLevel = null;

            switch (this._dataSource) {
                case InternalTexture.DATASOURCE_TEMP:
                    return;

                case InternalTexture.DATASOURCE_URL:
                    proxy = this._engine.createTexture(this.url, !this.generateMipMaps, this.invertY, null, this.samplingMode, () => {
                        this.isReady = true;
                    }, null, this._buffer, undefined, this.format); 
                    proxy._swapAndDie(this);
                    return;

                case InternalTexture.DATASOURCE_RAW:
                    proxy = this._engine.createRawTexture(this._bufferView, this.baseWidth, this.baseHeight, this.format, this.generateMipMaps, 
                                                            this.invertY, this.samplingMode, this._compression); 
                    proxy._swapAndDie(this);

                    this.isReady = true;
                return;

                case InternalTexture.DATASOURCE_RAW3D:
                    proxy = this._engine.createRawTexture3D(this._bufferView, this.baseWidth, this.baseHeight, this.baseDepth, this.format, this.generateMipMaps, 
                        this.invertY, this.samplingMode, this._compression); 
                    proxy._swapAndDie(this);

                    this.isReady = true;
                return;
                
                case InternalTexture.DATASOURCE_DYNAMIC:
                    proxy = this._engine.createDynamicTexture(this.baseWidth, this.baseHeight, this.generateMipMaps, this.samplingMode); 
                    proxy._swapAndDie(this);

                    // The engine will make sure to update content so no need to flag it as isReady = true
                return;

                case InternalTexture.DATASOURCE_RENDERTARGET:
                    let options = new RenderTargetCreationOptions();
                    options.generateDepthBuffer = this._generateDepthBuffer;
                    options.generateMipMaps = this.generateMipMaps;
                    options.generateStencilBuffer = this._generateStencilBuffer;
                    options.samplingMode = this.samplingMode;
                    options.type = this.type;

                    if (this.isCube) {
                        proxy = this._engine.createRenderTargetCubeTexture(this.width, options); 
                    } else {
                        let size = {
                            width: this.width,
                            height: this.height
                        }

                        proxy = this._engine.createRenderTargetTexture(size, options); 
                    }
                    proxy._swapAndDie(this);

                    this.isReady = true;
                return;                                      

                case InternalTexture.DATASOURCE_CUBE:
                    proxy = this._engine.createCubeTexture(this.url, null, this._files, !this.generateMipMaps, () => {
                        this.isReady = true;
                    }, null, this.format, this._extension);
                    proxy._swapAndDie(this);
                    return;

                case InternalTexture.DATASOURCE_CUBERAW:
                    proxy = this._engine.createRawCubeTexture(this._bufferViewArray, this.width, this.format, this.type, this.generateMipMaps, this.invertY, this.samplingMode, this._compression);
                    proxy._swapAndDie(this);

                    this.isReady = true;
                    return;                    

                case InternalTexture.DATASOURCE_CUBEPREFILTERED:
                    proxy = this._engine.createPrefilteredCubeTexture(this.url, null, this._lodGenerationScale, this._lodGenerationOffset, (proxy) => {
                        if (proxy) {
                            proxy._swapAndDie(this);
                        }
                        
                        this.isReady = true;
                    }, null, this.format, this._extension);
                    return;
            }
        }

        private _swapAndDie(target: InternalTexture): void {
            target._webGLTexture = this._webGLTexture;

            if (this._framebuffer) {
                target._framebuffer = this._framebuffer;
            }

            if (this._depthStencilBuffer) {
                target._depthStencilBuffer = this._depthStencilBuffer;
            }

            if (this._lodTextureHigh) {
                if (target._lodTextureHigh) {
                    target._lodTextureHigh.dispose();
                }
                target._lodTextureHigh = this._lodTextureHigh;
            }

            if (this._lodTextureMid) {
                if (target._lodTextureMid) {
                    target._lodTextureMid.dispose();
                }                
                target._lodTextureMid = this._lodTextureMid;
            }

            if (this._lodTextureLow) {
                if (target._lodTextureLow) {
                    target._lodTextureLow.dispose();
                }                     
                target._lodTextureLow = this._lodTextureLow;
            }

            let cache = this._engine.getLoadedTexturesCache();
            var index = cache.indexOf(this);
            if (index !== -1) {
                cache.splice(index, 1);
            }
        }
        
        public dispose(): void {
            if (!this._webGLTexture) {
                return;
            }

            this._references--;
            if (this._references === 0) {
                this._engine._releaseTexture(this);
                this._webGLTexture = null;
            }
        }
    }
}