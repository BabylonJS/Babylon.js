import type { Scene } from "core/scene";
import type { Nullable } from "core/types";

import { PostProcessRenderEffect } from "../postProcessRenderEffect";
import { PostProcessRenderPipeline } from "../postProcessRenderPipeline";
import { PostProcess } from "../../postProcess";
import { ThinFSR1UpscalePostProcess } from "../../thinFSR1UpscalePostProcess";
import { ThinFSR1SharpenPostProcess } from "../../thinFSR1SharpenPostProcess";

export class FSR1RenderingPipeline extends PostProcessRenderPipeline {
    public static readonly SCALE_ULTRA_QUALITY = 1.3;
    public static readonly SCALE_QUALITY = 1.5;
    public static readonly SCALE_BALANCED = 1.7;
    public static readonly SCALE_PERFORMANCE = 2;

    private readonly _scene: Scene;

    public override get isSupported(): boolean {
        return this.engine.isWebGPU;
    }

    private _samples = 4;
    public get samples(): number {
        return this._samples;
    }

    public set samples(samples: number) {
        if (this._samples === samples) {
            return;
        }
        this._samples = samples;
        if (this._upscalePostProcess) {
            this._upscalePostProcess.samples = this._samples;
        }
    }

    private _scaleFactor = FSR1RenderingPipeline.SCALE_QUALITY;
    public get scaleFactor(): number {
        return this._scaleFactor;
    }

    public set scaleFactor(factor: number) {
        if (this._scaleFactor === factor) {
            return;
        }
        this._scaleFactor = factor;
        this._buildPipeline();
    }

    private _sharpnessStops = 0.2;
    public get sharpnessStops(): number {
        return this._sharpnessStops;
    }

    public set sharpnessStops(stops: number) {
        if (this._sharpnessStops === stops) {
            return;
        }
        this._sharpnessStops = stops;
        this._thinSharpenPostProcess.updateConstants(this._sharpnessStops);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public FSR1UpscaleEffect = "FSR1UpscaleEffect";
    private readonly _thinUpscalePostProcess: ThinFSR1UpscalePostProcess;
    private _upscalePostProcess: Nullable<PostProcess>;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public FSR1SharpenEffect = "FSR1SharpenEffect";
    private readonly _thinSharpenPostProcess: ThinFSR1SharpenPostProcess;
    private _sharpenPostProcess: PostProcess;

    constructor(name: string, scene: Scene, cameras = scene.cameras) {
        super(scene.getEngine(), name);
        this._scene = scene;
        this._cameras = cameras;

        this._thinUpscalePostProcess = new ThinFSR1UpscalePostProcess(name + "Upscale", this.engine);
        this._thinSharpenPostProcess = new ThinFSR1SharpenPostProcess(name + "Sharpen", this.engine);
        this._createSharpenPostProcess();

        if (this.isSupported) {
            scene.postProcessRenderPipelineManager.addPipeline(this);
            this._buildPipeline();
        }
    }

    private _buildPipeline(): void {
        if (!this.isSupported) {
            return;
        }
        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._cameras);
        this._reset();

        this._disposeUpscalePostProcess();
        this._createUpscalePostProcess();

        this.addEffect(new PostProcessRenderEffect(this.engine, this.FSR1UpscaleEffect, () => this._upscalePostProcess));
        this.addEffect(new PostProcessRenderEffect(this.engine, this.FSR1SharpenEffect, () => this._sharpenPostProcess));

        this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this.name, this._cameras);
    }

    public override dispose(): void {
        this._disposeSharpenPostProcess();
        this._thinSharpenPostProcess.dispose();
        this._disposeUpscalePostProcess();
        this._thinUpscalePostProcess.dispose();
        super.dispose();
    }

    private _createUpscalePostProcess(): void {
        const postProcess = new PostProcess(this._thinUpscalePostProcess.name, ThinFSR1UpscalePostProcess.FragmentUrl, {
            uniformBuffers: ThinFSR1UpscalePostProcess.UniformBuffers,
            size: 1 / this._scaleFactor,
            engine: this.engine,
            effectWrapper: this._thinUpscalePostProcess,
        });
        postProcess.samples = this._samples;

        postProcess.onApplyObservable.add(() => {
            this._thinUpscalePostProcess.updateConstants(
                postProcess.width,
                postProcess.height,
                postProcess.width,
                postProcess.height,
                this.engine.getRenderWidth(),
                this.engine.getRenderHeight()
            );
        });

        this._upscalePostProcess = postProcess;
    }

    private _disposeUpscalePostProcess(): void {
        for (const camera of this._cameras) {
            this._upscalePostProcess?.dispose(camera);
        }
        this._upscalePostProcess = null;
    }

    private _createSharpenPostProcess(): void {
        this._thinSharpenPostProcess.updateConstants(this._sharpnessStops);
        this._sharpenPostProcess = new PostProcess(this._thinSharpenPostProcess.name, ThinFSR1SharpenPostProcess.FragmentUrl, {
            uniformBuffers: ThinFSR1SharpenPostProcess.UniformBuffers,
            engine: this.engine,
            effectWrapper: this._thinSharpenPostProcess,
        });
    }

    private _disposeSharpenPostProcess(): void {
        for (const camera of this._cameras) {
            this._sharpenPostProcess.dispose(camera);
        }
    }
}
