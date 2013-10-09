/// <reference path="../../babylon.d.ts" />

declare module BABYLON {
    class BaseTexture {
        _scene: Scene;

        constructor(url: string, scene: Scene);

        delayLoadState: number;
        hasAlpha: boolean;
        level: number;
        onDispose: () => void;

        getInternalTexture(): BaseTexture;
        isReady(): boolean;
        getSize(): Size2D;
        getBaseSize(): Size2D;
        _getFromCache(url: string, noMipmap: boolean): BaseTexture;
        delayLoad(): void;
        releaseInternalTexture(): void;
        dispose(): void;
    }
}