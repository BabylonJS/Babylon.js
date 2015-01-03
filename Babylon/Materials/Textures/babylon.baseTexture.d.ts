declare module BABYLON {
    class BaseTexture {
        public name: string;
        public delayLoadState: number;
        public hasAlpha: boolean;
        public getAlphaFromRGB: boolean;
        public level: number;
        public isCube: boolean;
        public isRenderTarget: boolean;
        public animations: Animation[];
        public onDispose: () => void;
        public coordinatesIndex: number;
        public coordinatesMode: number;
        public wrapU: number;
        public wrapV: number;
        public anisotropicFilteringLevel: number;
        public _cachedAnisotropicFilteringLevel: number;
        private _scene;
        public _texture: WebGLTexture;
        constructor(scene: Scene);
        public getScene(): Scene;
        public getTextureMatrix(): Matrix;
        public getReflectionTextureMatrix(): Matrix;
        public getInternalTexture(): WebGLTexture;
        public isReady(): boolean;
        public getSize(): ISize;
        public getBaseSize(): ISize;
        public scale(ratio: number): void;
        public canRescale : boolean;
        public _removeFromCache(url: string, noMipmap: boolean): void;
        public _getFromCache(url: string, noMipmap: boolean): WebGLTexture;
        public delayLoad(): void;
        public releaseInternalTexture(): void;
        public clone(): BaseTexture;
        public dispose(): void;
    }
}
