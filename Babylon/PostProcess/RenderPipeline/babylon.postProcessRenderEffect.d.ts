declare module BABYLON {
    class PostProcessRenderEffect {
        private _engine;
        private _postProcesses;
        private _getPostProcess;
        private _singleInstance;
        private _cameras;
        private _indicesForCamera;
        private _renderPasses;
        private _renderEffectAsPasses;
        public _name: string;
        public applyParameters: (postProcess: PostProcess) => void;
        constructor(engine: Engine, name: string, getPostProcess: () => PostProcess, singleInstance?: boolean);
        public _update(): void;
        public addPass(renderPass: PostProcessRenderPass): void;
        public removePass(renderPass: PostProcessRenderPass): void;
        public addRenderEffectAsPass(renderEffect: PostProcessRenderEffect): void;
        public getPass(passName: string): void;
        public emptyPasses(): void;
        public _attachCameras(cameras: Camera): any;
        public _attachCameras(cameras: Camera[]): any;
        public _detachCameras(cameras: Camera): any;
        public _detachCameras(cameras: Camera[]): any;
        public _enable(cameras: Camera): any;
        public _enable(cameras: Camera[]): any;
        public _disable(cameras: Camera): any;
        public _disable(cameras: Camera[]): any;
        public getPostProcess(camera?: Camera): PostProcess;
        private _linkParameters();
        private _linkTextures(effect);
    }
}
