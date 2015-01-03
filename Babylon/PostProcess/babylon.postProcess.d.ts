declare module BABYLON {
    class PostProcess {
        public name: string;
        public onApply: (Effect: any) => void;
        public onBeforeRender: (Effect: any) => void;
        public onSizeChanged: () => void;
        public onActivate: (Camera: any) => void;
        public width: number;
        public height: number;
        public renderTargetSamplingMode: number;
        private _camera;
        private _scene;
        private _engine;
        private _renderRatio;
        private _reusable;
        public _textures: SmartArray<WebGLTexture>;
        public _currentRenderTextureInd: number;
        private _effect;
        constructor(name: string, fragmentUrl: string, parameters: string[], samplers: string[], ratio: number, camera: Camera, samplingMode: number, engine?: Engine, reusable?: boolean);
        public isReusable(): boolean;
        public activate(camera: Camera, sourceTexture?: WebGLTexture): void;
        public apply(): Effect;
        public dispose(camera: Camera): void;
    }
}
