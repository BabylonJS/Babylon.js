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
        public static DATASOURCE_CUBELOD = 8;
        public static DATASOURCE_CUBERAW = 9;

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
        private _dataSource = InternalTexture.DATASOURCE_UNKNOWN;
        public _size: number;
        public _workingCanvas: HTMLCanvasElement;
        public _workingContext: CanvasRenderingContext2D;
        public _framebuffer: WebGLFramebuffer;
        public _depthStencilBuffer: WebGLRenderbuffer;
        public _MSAAFramebuffer: WebGLFramebuffer;
        public _MSAARenderBuffer: WebGLRenderbuffer;
        public _cachedCoordinatesMode: number;
        public _cachedWrapU: number;
        public _cachedWrapV: number;
        public _isDisabled: boolean;
        public _generateStencilBuffer: boolean;
        public _generateDepthBuffer: boolean;
        public _sphericalPolynomial: BABYLON.SphericalPolynomial;
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
           // this._engine.createTexture(this.url, !this.generateMipMaps, this.invertY, scene, this.samplingMode, null, null, this._buffer, null, this._format);
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