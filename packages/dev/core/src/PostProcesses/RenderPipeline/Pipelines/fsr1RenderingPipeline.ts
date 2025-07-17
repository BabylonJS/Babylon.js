import type { Scene } from "core/scene";

import { PostProcessRenderEffect } from "../postProcessRenderEffect";
import { PostProcessRenderPipeline } from "../postProcessRenderPipeline";
import { PostProcess } from "../../postProcess";
import { ThinFSR1UpscalePostProcess } from "../../thinFSR1UpscalePostProcess";

export class FSR1RenderingPipeline extends PostProcessRenderPipeline {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public FSR1UpscaleEffect = "FSR1UpscaleEffect";

    private _thinUpscalePostProcess: ThinFSR1UpscalePostProcess;
    private _upscalePostProcess: PostProcess;

    constructor(name: string, scene: Scene, cameras = scene.cameras) {
        const engine = scene.getEngine();
        super(engine, name);

        this._thinUpscalePostProcess = new ThinFSR1UpscalePostProcess("FSR1Upscale", engine);
        this._upscalePostProcess = new PostProcess(this._thinUpscalePostProcess.name, ThinFSR1UpscalePostProcess.FragmentUrl, {
            size: 0.5,
            engine,
            effectWrapper: this._thinUpscalePostProcess,
        });

        this.addEffect(new PostProcessRenderEffect(engine, this.FSR1UpscaleEffect, () => this._upscalePostProcess));

        scene.postProcessRenderPipelineManager.addPipeline(this);
        scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
    }
}
