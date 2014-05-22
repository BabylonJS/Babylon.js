module BABYLON {
    export class PostProcessRenderPipelineManager {
        private _renderPipelines: PostProcessRenderPipeline[];

        constructor() {
            this._renderPipelines = [];
        }

        public addPipeline(renderPipeline: PostProcessRenderPipeline): void {
            this._renderPipelines[renderPipeline.name] = renderPipeline;
        }

        public attachCamerasToRenderPipeline(renderPipelineName: string, cameras, unique): void {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.attachCameras(cameras, unique);
        }

        public detachCamerasFromRenderPipeline(renderPipelineName: string, cameras): void {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.detachCameras(cameras);
        }

        public enableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras): void {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.enableEffect(renderEffectName, cameras);
        }

        public disableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras): void {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.disableEffect(renderEffectName, cameras);
        }

        public enableDisplayOnlyPassInPipeline(renderPipelineName: string, passName: string, cameras): void {
            var renderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline.enableDisplayOnlyPass(passName, cameras);
        }

        public disableDisplayOnlyPassInPipeline(renderPipelineName, cameras): void {
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