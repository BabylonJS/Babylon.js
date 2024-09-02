import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTaskOutputReference, IFrameGraphTask, FrameGraphTextureId } from "../../frameGraphTypes";
import { Constants } from "core/Engines/constants";
import type { BloomEffect } from "../../../PostProcesses/bloomEffect";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import { FrameGraphBloomMergeTask } from "./bloomMergeTask";

export class FrameGraphBloomTask implements IFrameGraphTask {
    public sourceTexture: FrameGraphTextureId;

    public sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    public destinationTexture?: FrameGraphTextureId;

    public readonly outputTextureReference: FrameGraphTaskOutputReference = [this, "output"];

    public disabled = false;

    public get bloom() {
        return this._bloomEffect;
    }

    private _bloomEffect: BloomEffect;
    private _downscale: FrameGraphPostProcessTask;
    private _blurX: FrameGraphPostProcessTask;
    private _blurY: FrameGraphPostProcessTask;
    private _merge: FrameGraphBloomMergeTask;

    constructor(
        public name: string,
        bloomEffect: BloomEffect
    ) {
        if (!bloomEffect.useAsFrameGraphTask) {
            throw new Error(`BloomEffect "${name}": the bloom effect must have been created with the useAsFrameGraphTask property set to true`);
        }
        this._bloomEffect = bloomEffect;

        this._downscale = new FrameGraphPostProcessTask(`${name} Downscale`, bloomEffect._effects[0]);
        this._blurX = new FrameGraphPostProcessTask(`${name} Blur X`, bloomEffect._effects[1]);
        this._blurY = new FrameGraphPostProcessTask(`${name} Blur Y`, bloomEffect._effects[2]);
        this._merge = new FrameGraphBloomMergeTask(`${name} Merge`, bloomEffect._effects[3]);
    }

    public isReadyFrameGraph() {
        return this._downscale.isReadyFrameGraph() && this._blurX.isReadyFrameGraph() && this._blurY.isReadyFrameGraph() && this._merge.isReadyFrameGraph();
    }

    public recordFrameGraph(frameGraph: FrameGraph): void {
        if (this.sourceTexture === undefined) {
            throw new Error("FrameGraphBloomTask: sourceTexture is required");
        }

        const sourceTextureDescription = frameGraph.getTextureDescription(this.sourceTexture);

        const textureCreationOptions = {
            size: {
                width: Math.floor(sourceTextureDescription.size.width * this._bloomEffect.bloomScale),
                height: Math.floor(sourceTextureDescription.size.height * this._bloomEffect.bloomScale),
            },
            options: {
                createMipMaps: false,
                generateMipMaps: false,
                type: this._bloomEffect._pipelineTextureType,
                samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
                format: sourceTextureDescription.options.format,
                samples: 1,
                useSRGBBuffer: false,
                generateDepthBuffer: false,
                generateStencilBuffer: false,
                label: "",
            },
            sizeIsPercentage: false,
        };

        // We need to set the texture size so that texel size is calculated correctly
        this._blurX.getPostProcess().width = textureCreationOptions.size.width;
        this._blurX.getPostProcess().height = textureCreationOptions.size.height;
        this._blurY.getPostProcess().width = textureCreationOptions.size.width;
        this._blurY.getPostProcess().height = textureCreationOptions.size.height;

        const downscaleTextureHandle = frameGraph.createRenderTargetTexture(this._downscale.name, textureCreationOptions);

        this._downscale.sourceTexture = this.sourceTexture;
        this._downscale.destinationTexture = downscaleTextureHandle;
        this._downscale.recordFrameGraph(frameGraph, true);

        const blurXTextureHandle = frameGraph.createRenderTargetTexture(this._blurX.name, textureCreationOptions);

        this._blurX.sourceTexture = downscaleTextureHandle;
        this._blurX.destinationTexture = blurXTextureHandle;
        this._blurX.recordFrameGraph(frameGraph, true);

        const blurYTextureHandle = frameGraph.createRenderTargetTexture(this._blurY.name, textureCreationOptions);

        this._blurY.sourceTexture = blurXTextureHandle;
        this._blurY.destinationTexture = blurYTextureHandle;
        this._blurY.recordFrameGraph(frameGraph, true);

        const sourceTextureCreationOptions = frameGraph.getTextureCreationOptions(this.sourceTexture, true);
        sourceTextureCreationOptions.options.generateDepthBuffer = false;
        sourceTextureCreationOptions.options.generateStencilBuffer = false;

        const sourceTextureHandle = frameGraph.getTextureHandle(this.sourceTexture);
        const outputTextureHandle = frameGraph.getTextureHandleOrCreateTexture(this.destinationTexture, this._merge.name, sourceTextureCreationOptions);

        this._merge.sourceTexture = this.sourceTexture;
        this._merge.sourceSamplingMode = this.sourceSamplingMode;
        this._merge.sourceBlurTexture = blurYTextureHandle;
        this._merge.destinationTexture = outputTextureHandle;
        this._merge.recordFrameGraph(frameGraph, true);

        const passDisabled = frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(outputTextureHandle);
        passDisabled.setExecuteFunc((context) => {
            context.copyTexture(sourceTextureHandle);
        });
    }

    public disposeFrameGraph(): void {
        this._downscale.disposeFrameGraph();
        this._blurX.disposeFrameGraph();
        this._blurY.disposeFrameGraph();
        this._merge.disposeFrameGraph();
    }
}
