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

        public isReady: boolean;
        public isCube: boolean;
        public url: string;
        public samplingMode: number;
        public generateMipMaps: boolean;
        public samples: number;
        public type: number;
        public format: number;
        public onLoadedObservable = new Observable<InternalTexture>();
        public width: number;
        public height: number;
        public baseWidth: number;
        public baseHeight: number;
        public invertY: boolean;

        // Private
        public _dataSource = InternalTexture.DATASOURCE_UNKNOWN;
        public _buffer: ArrayBuffer | HTMLImageElement;
        public _size: number;
        public _extension: string;
        public _files: string[];
        public _workingCanvas: HTMLCanvasElement;
        public _workingContext: CanvasRenderingContext2D;
        public _framebuffer: WebGLFramebuffer;
        public _depthStencilBuffer: WebGLRenderbuffer;
        public _MSAAFramebuffer: WebGLFramebuffer;
        public _MSAARenderBuffer: WebGLRenderbuffer;
        public _cachedCoordinatesMode: number;
        public _cachedWrapU: number;
        public _cachedWrapV: number;
        public _cachedAnisotropicFilteringLevel: number;
        public _isDisabled: boolean;
        public _generateStencilBuffer: boolean;
        public _generateDepthBuffer: boolean;
        public _sphericalPolynomial: BABYLON.SphericalPolynomial;
        public _lodGenerationScale: number;
        public _lodGenerationOffset: number;
        // The following three fields helps sharing generated fixed LODs for texture filtering
        // In environment not supporting the textureLOD extension like EDGE. They are for internal use only.
        // They are at the level of the gl texture to benefit from the cache.
        public _lodTextureHigh: BABYLON.BaseTexture;
        public _lodTextureMid: BABYLON.BaseTexture;
        public _lodTextureLow: BABYLON.BaseTexture;

        public _webGLTexture: WebGLTexture;
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

        public updateSize(width: number, height: number): void {
            this.width = width;
            this.height = height;
            this._size = width * height;
            this.baseWidth = width;
            this.baseHeight = height;
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
                    }, null, this._buffer, null, this.format); 
                    proxy._swapAndDie(this);
                    return;
                
                case InternalTexture.DATASOURCE_DYNAMIC:
                    proxy = this._engine.createDynamicTexture(this.baseWidth, this.baseHeight, this.generateMipMaps, this.samplingMode); 
                    proxy._swapAndDie(this);

                    // The engine will make sure to update content so no need to flag it as isReady = true
                return;

                case InternalTexture.DATASOURCE_CUBE:
                    proxy = this._engine.createCubeTexture(this.url, null, this._files, !this.generateMipMaps, () => {
                        this.isReady = true;
                    }, null, this.format, this._extension);
                    proxy._swapAndDie(this);
                    return;

                case InternalTexture.DATASOURCE_CUBEPREFILTERED:
                    proxy = this._engine.createPrefilteredCubeTexture(this.url, null, this._lodGenerationScale, this._lodGenerationOffset, (proxy) => {
                        proxy._swapAndDie(this);
                        
                        this.isReady = true;
                    }, null, this.format, this._extension);
                    return;
            }
        }

        private _swapAndDie(target: InternalTexture): void {
            target._webGLTexture = this._webGLTexture;

            if (this._lodTextureHigh) {
                target._lodTextureHigh = this._lodTextureHigh;
            }

            if (this._lodTextureMid) {
                target._lodTextureMid = this._lodTextureMid;
            }

            if (this._lodTextureLow) {
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