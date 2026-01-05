import type { Camera, IReadonlyObservable, PostProcessRenderPipeline } from "core/index";

import { Observable } from "../../Misc/observable";

/**
 * PostProcessRenderPipelineManager class
 * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/postProcessRenderPipeline
 */
export class PostProcessRenderPipelineManager {
    private readonly _renderPipelines: { [Key: string]: PostProcessRenderPipeline } = {};
    private readonly _onNewPipelineAddedObservable = new Observable<PostProcessRenderPipeline>();
    private readonly _onPipelineRemovedObservable = new Observable<PostProcessRenderPipeline>();

    /**
     * Initializes a PostProcessRenderPipelineManager
     * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/postProcessRenderPipeline
     */
    constructor() {}

    /**
     * An event triggered when a pipeline is added to the manager
     */
    public get onNewPipelineAddedObservable(): IReadonlyObservable<PostProcessRenderPipeline> {
        return this._onNewPipelineAddedObservable;
    }

    /**
     * An event triggered when a pipeline is removed from the manager
     */
    public get onPipelineRemovedObservable(): IReadonlyObservable<PostProcessRenderPipeline> {
        return this._onPipelineRemovedObservable;
    }

    /**
     * Gets the list of supported render pipelines
     */
    public get supportedPipelines(): PostProcessRenderPipeline[] {
        const result = [];

        for (const renderPipelineName in this._renderPipelines) {
            if (Object.prototype.hasOwnProperty.call(this._renderPipelines, renderPipelineName)) {
                const pipeline = this._renderPipelines[renderPipelineName];
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
        this.removePipeline(renderPipeline._name);
        this._renderPipelines[renderPipeline._name] = renderPipeline;
        this._onNewPipelineAddedObservable.notifyObservers(renderPipeline);
    }

    /**
     * Remove the pipeline from the manager
     * @param renderPipelineName the name of the pipeline to remove
     */
    public removePipeline(renderPipelineName: string): void {
        const pipeline = this._renderPipelines[renderPipelineName];
        if (pipeline) {
            this._onPipelineRemovedObservable.notifyObservers(pipeline);
            delete this._renderPipelines[renderPipelineName];
        }
    }

    /**
     * Attaches a camera to the pipeline
     * @param renderPipelineName The name of the pipeline to attach to
     * @param cameras the camera to attach
     * @param unique if the camera can be attached multiple times to the pipeline
     */
    public attachCamerasToRenderPipeline(renderPipelineName: string, cameras: Camera[] | Camera, unique: boolean = false): void {
        const renderPipeline: PostProcessRenderPipeline = this._renderPipelines[renderPipelineName];

        if (!renderPipeline) {
            return;
        }

        renderPipeline._attachCameras(cameras as Camera[], unique);
    }

    /**
     * Detaches a camera from the pipeline
     * @param renderPipelineName The name of the pipeline to detach from
     * @param cameras the camera to detach
     */
    public detachCamerasFromRenderPipeline(renderPipelineName: string, cameras: Camera[] | Camera): void {
        const renderPipeline: PostProcessRenderPipeline = this._renderPipelines[renderPipelineName];

        if (!renderPipeline) {
            return;
        }

        renderPipeline._detachCameras(cameras as Camera[]);
    }

    /**
     * Enables an effect by name on a pipeline
     * @param renderPipelineName the name of the pipeline to enable the effect in
     * @param renderEffectName the name of the effect to enable
     * @param cameras the cameras that the effect should be enabled on
     */
    public enableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera[] | Camera): void {
        const renderPipeline: PostProcessRenderPipeline = this._renderPipelines[renderPipelineName];

        if (!renderPipeline) {
            return;
        }

        renderPipeline._enableEffect(renderEffectName, cameras as Camera[]);
    }

    /**
     * Disables an effect by name on a pipeline
     * @param renderPipelineName the name of the pipeline to disable the effect in
     * @param renderEffectName the name of the effect to disable
     * @param cameras the cameras that the effect should be disabled on
     */
    public disableEffectInPipeline(renderPipelineName: string, renderEffectName: string, cameras: Camera[] | Camera): void {
        const renderPipeline: PostProcessRenderPipeline = this._renderPipelines[renderPipelineName];

        if (!renderPipeline) {
            return;
        }

        renderPipeline._disableEffect(renderEffectName, cameras as Camera[]);
    }

    /**
     * Updates the state of all contained render pipelines and disposes of any non supported pipelines
     */
    public update(): void {
        for (const renderPipelineName in this._renderPipelines) {
            if (Object.prototype.hasOwnProperty.call(this._renderPipelines, renderPipelineName)) {
                const pipeline = this._renderPipelines[renderPipelineName];
                if (!pipeline.isSupported) {
                    pipeline.dispose();
                    delete this._renderPipelines[renderPipelineName];
                } else {
                    pipeline._update();
                }
            }
        }
    }

    /** @internal */
    public _rebuild(): void {
        for (const renderPipelineName in this._renderPipelines) {
            if (Object.prototype.hasOwnProperty.call(this._renderPipelines, renderPipelineName)) {
                const pipeline = this._renderPipelines[renderPipelineName];
                pipeline._rebuild();
            }
        }
    }

    /**
     * Disposes of the manager and pipelines
     */
    public dispose(): void {
        for (const renderPipelineName in this._renderPipelines) {
            if (Object.prototype.hasOwnProperty.call(this._renderPipelines, renderPipelineName)) {
                const pipeline = this._renderPipelines[renderPipelineName];
                pipeline.dispose();
            }
        }
    }
}
