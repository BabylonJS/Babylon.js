import { Camera } from "../../Cameras/camera";
import { PostProcessRenderPipeline } from "./postProcessRenderPipeline";
/**
 * PostProcessRenderPipelineManager class
 * @see https://doc.babylonjs.com/how_to/how_to_use_postprocessrenderpipeline
 */
export class PostProcessRenderPipelineManager {
    private _renderPipelines: { [Key: string]: PostProcessRenderPipeline };

    /**
     * Initializes a PostProcessRenderPipelineManager
     * @see https://doc.babylonjs.com/how_to/how_to_use_postprocessrenderpipeline
     */
    constructor() {
        this._renderPipelines = {};
    }

    /**
     * Gets the list of supported render pipelines
     */
    public get supportedPipelines(): PostProcessRenderPipeline[] {
        let result = [];

        for (var renderPipelineName in this._renderPipelines) {
            if (this._renderPipelines.hasOwnProperty(renderPipelineName)) {
                var pipeline = this._renderPipelines[renderPipelineName];
                if (pipeline.isSupported) {
                    result.push(pipeline);
                }
            }
        }

        return result;
    }

    /**
     * Adds a pipeline to the manager
     * @param renderPipeline The pipeline to add
     */
    public addPipeline(renderPipeline: PostProcessRenderPipeline): void {
        this._renderPipelines[renderPipeline._name] = renderPipeline;
    }

    /**
     * Attaches a camera to the pipeline
     * @param renderPipelineName The name of the pipeline to attach to
     * @param cameras the camera to attach
     * @param unique if the camera can be attached multiple times to the pipeline
     */
    public attachCamerasToRenderPipeline(renderPipelineName: string, cameras: any | Camera[] | Camera, unique: boolean = false): void {
        var renderPipeline: PostProcessRenderPipeline = this._renderPipelines[renderPipelineName];

        if (!renderPipeline) {
            return;
        }

        renderPipeline._attachCameras(cameras, unique);
    }

    /**
     * Detaches a camera from the pipeline
     * @param renderPipelineName The name of the pipeline to detach from
     * @param cameras the camera to detach
     */
    public detachCamerasFromRenderPipeline(renderPipelineName: string, cameras: any | Camera[] | Camera): void {
        var renderPipeline: PostProcessRenderPipeline = this._renderPipelines[renderPipelineName];

        if (!renderPipeline) {
            return;
        }

        renderPipeline._detachCameras(cameras);
    }

    /**
     * Enables an effect by name on a pipeline
     * @param renderPipelineName the name of the pipeline to enable the effect in
     * @param renderEffectName the name of the effect to enable
     * @param cameras the cameras that the effect should be enabled on
     */
    public enableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: any | Camera[] | Camera): void {
        var renderPipeline: PostProcessRenderPipeline = this._renderPipelines[renderPipelineName];

        if (!renderPipeline) {
            return;
        }

        renderPipeline._enableEffect(renderEffectName, cameras);
    }

    /**
     * Disables an effect by name on a pipeline
     * @param renderPipelineName the name of the pipeline to disable the effect in
     * @param renderEffectName the name of the effect to disable
     * @param cameras the cameras that the effect should be disabled on
     */
    public disableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: any | Camera[] | Camera): void {
        var renderPipeline: PostProcessRenderPipeline = this._renderPipelines[renderPipelineName];

        if (!renderPipeline) {
            return;
        }

        renderPipeline._disableEffect(renderEffectName, cameras);
    }

    /**
     * Updates the state of all contained render pipelines and disposes of any non supported pipelines
     */
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

    /** @hidden */
    public _rebuild(): void {
        for (var renderPipelineName in this._renderPipelines) {
            if (this._renderPipelines.hasOwnProperty(renderPipelineName)) {
                var pipeline = this._renderPipelines[renderPipelineName];
                pipeline._rebuild();
            }
        }
    }

    /**
     * Disposes of the manager and pipelines
     */
    public dispose(): void {
        for (var renderPipelineName in this._renderPipelines) {
            if (this._renderPipelines.hasOwnProperty(renderPipelineName)) {
                var pipeline = this._renderPipelines[renderPipelineName];
                pipeline.dispose();
            }
        }
    }
}
