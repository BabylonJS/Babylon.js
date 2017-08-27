module BABYLON {
    export class InternalTexture {
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

        // Private
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

        constructor(engine: Engine, texture?: WebGLTexture) {
            this._engine = engine;

            if (texture) {
                this._webGLTexture = texture;               
            } else {
                this._webGLTexture = engine._createTexture();
            }
        }

        public incrementReferences() {
            this._references++;
        }

        public updateSize(width: number, height: number) {
            this.width = width;
            this.height = height;
            this._size = width * height;
            this.baseWidth = width;
            this.baseHeight = height;
        }
        
        public dispose(): void {
            if (!this._webGLTexture) {
                return;
            }

            this._references--;
            if (this._references === 0) {
                var texturesCache = this._engine.getLoadedTexturesCache();
                var index = texturesCache.indexOf(this);

                if (index > -1) {
                    texturesCache.splice(index, 1);
                }

                this._engine._releaseTexture(this);
                this._webGLTexture = null;
            }
        }
    }
}