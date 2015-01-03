declare module BABYLON {
    class PostProcessRenderPipeline {
        private _engine;
        private _renderEffects;
        private _renderEffectsForIsolatedPass;
        private _cameras;
        public _name: string;
        private static PASS_EFFECT_NAME;
        private static PASS_SAMPLER_NAME;
        constructor(engine: Engine, name: string);
        public addEffect(renderEffect: PostProcessRenderEffect): void;
        public _enableEffect(renderEffectName: string, cameras: Camera): any;
        public _enableEffect(renderEffectName: string, cameras: Camera[]): any;
        public _disableEffect(renderEffectName: string, cameras: Camera): any;
        public _disableEffect(renderEffectName: string, cameras: Camera[]): any;
        public _attachCameras(cameras: Camera, unique: boolean): any;
        public _attachCameras(cameras: Camera[], unique: boolean): any;
        public _detachCameras(cameras: Camera): any;
        public _detachCameras(cameras: Camera[]): any;
        public _enableDisplayOnlyPass(passName: any, cameras: Camera): any;
        public _enableDisplayOnlyPass(passName: any, cameras: Camera[]): any;
        public _disableDisplayOnlyPass(cameras: Camera): any;
        public _disableDisplayOnlyPass(cameras: Camera[]): any;
        public _update(): void;
    }
}
