declare module BABYLON {
    class VideoTexture extends Texture {
        public video: HTMLVideoElement;
        private _autoLaunch;
        private _lastUpdate;
        constructor(name: string, urls: string[], size: any, scene: Scene, generateMipMaps: boolean, invertY: boolean, samplingMode?: number);
        public update(): boolean;
    }
}
