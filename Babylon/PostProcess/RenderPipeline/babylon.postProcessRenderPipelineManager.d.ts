declare module BABYLON {
    class PostProcessRenderPipelineManager {
        private _renderPipelines;
        constructor();
        public addPipeline(renderPipeline: PostProcessRenderPipeline): void;
        public attachCamerasToRenderPipeline(renderPipelineName: string, cameras: Camera, unique?: boolean): any;
        public attachCamerasToRenderPipeline(renderPipelineName: string, cameras: Camera[], unique?: boolean): any;
        public detachCamerasFromRenderPipeline(renderPipelineName: string, cameras: Camera): any;
        public detachCamerasFromRenderPipeline(renderPipelineName: string, cameras: Camera[]): any;
        public enableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera): any;
        public enableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera[]): any;
        public disableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera): any;
        public disableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera[]): any;
        public enableDisplayOnlyPassInPipeline(renderPipelineName: string, passName: string, cameras: Camera): any;
        public enableDisplayOnlyPassInPipeline(renderPipelineName: string, passName: string, cameras: Camera[]): any;
        public disableDisplayOnlyPassInPipeline(renderPipelineName: string, cameras: Camera): any;
        public disableDisplayOnlyPassInPipeline(renderPipelineName: string, cameras: Camera[]): any;
        public update(): void;
    }
}
