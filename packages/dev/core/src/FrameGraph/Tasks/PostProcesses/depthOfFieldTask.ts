import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureCreationOptions, FrameGraphTextureHandle } from "../../frameGraphTypes";
import { Constants } from "core/Engines/constants";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { FrameGraphTask } from "../../frameGraphTask";
import { DepthOfFieldEffectBlurLevel } from "core/PostProcesses/depthOfFieldEffect";
import { FrameGraphDepthOfFieldMergeTask } from "./depthOfFieldMergeTask";
import { FrameGraphCircleOfConfusionTask } from "./circleOfConfusionTask";
import { FrameGraphDepthOfFieldBlurTask } from "./depthOfFieldBlurTask";
import type { Camera } from "core/Cameras/camera";
import { DepthOfFieldEffectImpl } from "core/PostProcesses/depthOfFieldEffectImpl";
import { Vector2 } from "core/Maths/math.vector";

export class FrameGraphDepthOfFieldTask extends FrameGraphTask {
    public sourceTexture: FrameGraphTextureHandle;

    public sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    public depthTexture: FrameGraphTextureHandle; // should store camera space depth (Z coordinate)

    public depthSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    public camera: Camera;

    public destinationTexture?: FrameGraphTextureHandle;

    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * The focal the length of the camera used in the effect in scene units/1000 (eg. millimeter)
     */
    public set focalLength(value: number) {
        this._impl.focalLength = value;
    }
    public get focalLength() {
        return this._impl.focalLength;
    }
    /**
     * F-Stop of the effect's camera. The diameter of the resulting aperture can be computed by lensSize/fStop. (default: 1.4)
     */
    public set fStop(value: number) {
        this._impl.fStop = value;
    }
    public get fStop() {
        return this._impl.fStop;
    }
    /**
     * Distance away from the camera to focus on in scene units/1000 (eg. millimeter). (default: 2000)
     */
    public set focusDistance(value: number) {
        this._impl.focusDistance = value;
    }
    public get focusDistance() {
        return this._impl.focusDistance;
    }
    /**
     * Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. (default: 50) The diameter of the resulting aperture can be computed by lensSize/fStop.
     */
    public set lensSize(value: number) {
        this._impl.lensSize = value;
    }
    public get lensSize() {
        return this._impl.lensSize;
    }

    private _engine: AbstractEngine;
    private _circleOfConfusion: FrameGraphCircleOfConfusionTask;
    private _blurX: FrameGraphDepthOfFieldBlurTask[] = [];
    private _blurY: FrameGraphDepthOfFieldBlurTask[] = [];
    private _merge: FrameGraphDepthOfFieldMergeTask;
    private _defaultPipelineTextureType: number;

    private _impl: DepthOfFieldEffectImpl;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, blurLevel: DepthOfFieldEffectBlurLevel = DepthOfFieldEffectBlurLevel.Low, hdr = false) {
        super(name, frameGraph);

        this._engine = engine;

        this._defaultPipelineTextureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        if (hdr) {
            const caps = engine.getCaps();
            if (caps.textureHalfFloatRender) {
                this._defaultPipelineTextureType = Constants.TEXTURETYPE_HALF_FLOAT;
            } else if (caps.textureFloatRender) {
                this._defaultPipelineTextureType = Constants.TEXTURETYPE_FLOAT;
            }
        }

        let blurCount = 1;
        let kernelSize = 15;
        switch (blurLevel) {
            case DepthOfFieldEffectBlurLevel.High: {
                blurCount = 3;
                kernelSize = 51;
                break;
            }
            case DepthOfFieldEffectBlurLevel.Medium: {
                blurCount = 2;
                kernelSize = 31;
                break;
            }
            default: {
                kernelSize = 15;
                blurCount = 1;
                break;
            }
        }

        this._impl = new DepthOfFieldEffectImpl(blurCount);

        this._circleOfConfusion = new FrameGraphCircleOfConfusionTask(`${name} Circle of Confusion`, this._frameGraph, engine, { implementation: this._impl.circleOfConfusion });

        for (let i = 0; i < blurCount; i++) {
            this._blurX.push(
                new FrameGraphDepthOfFieldBlurTask(`${name} Blur X`, this._frameGraph, engine, new Vector2(1, 0), kernelSize, {
                    implementation: this._impl.depthOfFieldBlurX[i],
                })
            );
            this._blurY.push(
                new FrameGraphDepthOfFieldBlurTask(`${name} Blur Y`, this._frameGraph, engine, new Vector2(0, 1), kernelSize, {
                    implementation: this._impl.depthOfFieldBlurY[i],
                })
            );
        }

        this._merge = new FrameGraphDepthOfFieldMergeTask(`${name} Merge`, this._frameGraph, engine, { implementation: this._impl.dofMerge });

        this.outputTexture = this._frameGraph.createDanglingHandle();
    }

    public override isReady() {
        return this._impl.isReady();
    }

    public override record(): void {
        if (this.sourceTexture === undefined || this.depthTexture === undefined || this.camera === undefined) {
            throw new Error("FrameGraphDepthOfFieldTask: sourceTexture, depthTexture and camera are required");
        }

        const sourceTextureDescription = this._frameGraph.getTextureDescription(this.sourceTexture);

        const textureSize = {
            width: sourceTextureDescription.size.width,
            height: sourceTextureDescription.size.height,
        };
        const circleOfConfusionTextureFormat = this._engine.isWebGPU || this._engine.version > 1 ? Constants.TEXTUREFORMAT_RED : Constants.TEXTUREFORMAT_RGBA;
        const textureCreationOptions: FrameGraphTextureCreationOptions = {
            size: textureSize,
            options: {
                createMipMaps: false,
                generateMipMaps: false,
                types: [this._defaultPipelineTextureType],
                formats: [circleOfConfusionTextureFormat],
                samples: 1,
                useSRGBBuffers: [false],
                generateDepthBuffer: false,
                generateStencilBuffer: false,
                label: "",
            },
            sizeIsPercentage: false,
        };

        const circleOfConfusionTextureHandle = this._frameGraph.createRenderTargetTexture(this._circleOfConfusion.name, textureCreationOptions);

        this._circleOfConfusion.sourceTexture = this.sourceTexture; // texture not used by the CoC shader
        this._circleOfConfusion.depthTexture = this.depthTexture;
        this._circleOfConfusion.depthSamplingMode = this.depthSamplingMode;
        this._circleOfConfusion.camera = this.camera;
        this._circleOfConfusion.destinationTexture = circleOfConfusionTextureHandle;
        this._circleOfConfusion.record(true);

        textureCreationOptions.options.formats = [Constants.TEXTUREFORMAT_RGBA];

        const blurSteps: FrameGraphTextureHandle[] = [];

        for (let i = 0; i < this._blurX.length; i++) {
            const ratio = 0.75 / (1 << i);

            textureSize.width = Math.floor(sourceTextureDescription.size.width * ratio);
            textureSize.height = Math.floor(sourceTextureDescription.size.height * ratio);

            const blurYTextureHandle = this._frameGraph.createRenderTargetTexture(this._blurY[i].name, textureCreationOptions);

            this._blurY[i].sourceTexture = i === 0 ? this.sourceTexture : this._blurX[i - 1].outputTexture;
            this._blurY[i].sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
            this._blurY[i].circleOfConfusionTexture = circleOfConfusionTextureHandle;
            this._blurY[i].destinationTexture = blurYTextureHandle;
            this._blurY[i].record(true);

            const blurXTextureHandle = this._frameGraph.createRenderTargetTexture(this._blurX[i].name, textureCreationOptions);

            this._blurX[i].sourceTexture = this._blurY[i].outputTexture;
            this._blurX[i].sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
            this._blurX[i].circleOfConfusionTexture = circleOfConfusionTextureHandle;
            this._blurX[i].destinationTexture = blurXTextureHandle;
            this._blurX[i].record(true);

            blurSteps.push(blurXTextureHandle);
        }

        const sourceTextureCreationOptions = this._frameGraph.getTextureCreationOptions(this.sourceTexture, true);
        sourceTextureCreationOptions.options.generateDepthBuffer = false;
        sourceTextureCreationOptions.options.generateStencilBuffer = false;
        sourceTextureCreationOptions.options.samples = 1;

        this._frameGraph.resolveDanglingHandle(this.outputTexture, this.destinationTexture, this._merge.name, sourceTextureCreationOptions);

        this._merge.sourceTexture = this.sourceTexture;
        this._merge.sourceSamplingMode = this.sourceSamplingMode;
        this._merge.circleOfConfusionTexture = circleOfConfusionTextureHandle;
        this._merge.blurSteps = blurSteps;
        this._merge.destinationTexture = this.outputTexture;
        this._merge.record(true);

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((context) => {
            context.copyTexture(this.sourceTexture);
        });
    }

    public override dispose(): void {
        this._circleOfConfusion.dispose();
        for (let i = 0; i < this._blurX.length; i++) {
            this._blurX[i].dispose();
            this._blurY[i].dispose();
        }
        this._merge.dispose();
        super.dispose();
    }
}
