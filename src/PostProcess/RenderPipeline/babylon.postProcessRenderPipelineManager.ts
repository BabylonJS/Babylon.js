module BABYLON {
    export class PostProcessRenderPipelineManager {
        private _renderPipelines: any;

        constructor() {
            this._renderPipelines = {};
        }

        public addPipeline(renderPipeline: PostProcessRenderPipeline): void {
            this._renderPipelines[renderPipeline._name] = renderPipeline;
        }

        public attachCamerasToRenderPipeline(renderPipelineName: string, cameras: Camera, unique?: boolean): void;
        public attachCamerasToRenderPipeline(renderPipelineName: string, cameras: Camera[], unique?: boolean): void;
        public attachCamerasToRenderPipeline(renderPipelineName: string, cameras: any, unique: boolean = false): void {
            var renderPipeline: PostProcessRenderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline._attachCameras(cameras, unique);
        }

        public detachCamerasFromRenderPipeline(renderPipelineName: string, cameras: Camera): void;
        public detachCamerasFromRenderPipeline(renderPipelineName: string, cameras: Camera[]): void;
        public detachCamerasFromRenderPipeline(renderPipelineName: string, cameras: any): void {
            var renderPipeline: PostProcessRenderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline._detachCameras(cameras);
        }

        public enableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera): void;
        public enableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera[]): void;
        public enableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: any): void {
            var renderPipeline: PostProcessRenderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline._enableEffect(renderEffectName, cameras);
        }

        public disableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera): void;
        public disableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera[]): void;
        public disableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: any): void {
            var renderPipeline: PostProcessRenderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline._disableEffect(renderEffectName, cameras);
        }

        public enableDisplayOnlyPassInPipeline(renderPipelineName: string, passName: string, cameras: Camera): void;
        public enableDisplayOnlyPassInPipeline(renderPipelineName: string, passName: string, cameras: Camera[]): void;
        public enableDisplayOnlyPassInPipeline(renderPipelineName: string, passName: string, cameras: any): void {
            var renderPipeline: PostProcessRenderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline._enableDisplayOnlyPass(passName, cameras);
        }

        public disableDisplayOnlyPassInPipeline(renderPipelineName: string, cameras: Camera): void;
        public disableDisplayOnlyPassInPipeline(renderPipelineName: string, cameras: Camera[]): void;
        public disableDisplayOnlyPassInPipeline(renderPipelineName: string, cameras: any): void {
            var renderPipeline: PostProcessRenderPipeline = this._renderPipelines[renderPipelineName];

            if (!renderPipeline) {
                return;
            }

            renderPipeline._disableDisplayOnlyPass(cameras);
        }

        public update(): void {
            for (var renderPipelineName in this._renderPipelines) {
                if (this._renderPipelines.hasOwnProperty(renderPipelineName)) {
                    var pipeline = this._renderPipelines[renderPipelineName];
                    if (!pipeline.isSupported) {
                        pipeline.dispose();
                        delete this._renderPipelines[renderPipelineName];
                    } else {
                        pipeline._update();
                    }
                }
            }
        }

        public _rebuild(): void {
            for (var renderPipelineName in this._renderPipelines) {
                if (this._renderPipelines.hasOwnProperty(renderPipelineName)) {
                    var pipeline = this._renderPipelines[renderPipelineName];
                    pipeline._rebuild();
                }
            }
        }

        public dispose(): void {
            for (var renderPipelineName in this._renderPipelines) {
                if (this._renderPipelines.hasOwnProperty(renderPipelineName)) {
                    var pipeline = this._renderPipelines[renderPipelineName];
                    pipeline.dispose();
                }
            }
        }
    }
}