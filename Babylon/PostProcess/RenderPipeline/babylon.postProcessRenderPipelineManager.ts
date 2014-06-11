module BABYLON {
    export class PostProcessRenderPipelineManager {
        private _renderPipelines: PostProcessRenderPipeline[];

        constructor() {
            this._renderPipelines = [];
        }

        public addPipeline(renderPipeline: PostProcessRenderPipeline): void {
            this._renderPipelines[renderPipeline._name] = renderPipeline;
        }

        public attachCamerasToRenderPipeline(renderPipelineName: string, cameras: Camera, unique?: boolean);
        public attachCamerasToRenderPipeline(renderPipelineName: string, cameras: Camera[], unique?: boolean);
        public attachCamerasToRenderPipeline(renderPipelineName: string, cameras: any, unique?: boolean): void {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.attachCameras(cameras, unique);
        }

        public detachCamerasFromRenderPipeline(renderPipelineName: string, cameras: Camera);
        public detachCamerasFromRenderPipeline(renderPipelineName: string, cameras: Camera[]);
        public detachCamerasFromRenderPipeline(renderPipelineName: string, cameras: any): void {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.detachCameras(cameras);
        }

        public enableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera);
        public enableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera[]);
        public enableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: any): void {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.enableEffect(renderEffectName, cameras);
        }

        public disableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera);
        public disableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera[]);
        public disableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: any): void {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.disableEffect(renderEffectName, cameras);
        }

        public enableDisplayOnlyPassInPipeline(renderPipelineName: string, passName: string, cameras: Camera);
        public enableDisplayOnlyPassInPipeline(renderPipelineName: string, passName: string, cameras: Camera[]);
        public enableDisplayOnlyPassInPipeline(renderPipelineName: string, passName: string, cameras: any): void {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.enableDisplayOnlyPass(passName, cameras);
        }

        public disableDisplayOnlyPassInPipeline(renderPipelineName: string, cameras: Camera);
        public disableDisplayOnlyPassInPipeline(renderPipelineName: string, cameras: Camera[]);
        public disableDisplayOnlyPassInPipeline(renderPipelineName: string, cameras: any): void {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.disableDisplayOnlyPass(cameras);
        }

        public update(): void {
            for (var renderPipelineName in this._renderPipelines) {
                this._renderPipelines[renderPipelineName]._update();
            }
        }
    }
}