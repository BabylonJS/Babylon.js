/// <reference path="../../babylon.d.ts" />

declare module BABYLON {
    class VideoTexture extends Texture {
        constructor(name: string, urls: string[], size: Size2D, scene: Scene, generateMipMaps: boolean);

        video: HTMLVideoElement;
        _autoLaunch: boolean;
        textureSize: Size2D;

        _update(): boolean;
    }
}