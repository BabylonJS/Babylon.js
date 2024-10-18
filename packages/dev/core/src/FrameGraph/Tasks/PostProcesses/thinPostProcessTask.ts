import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import type { DrawWrapper } from "core/Materials/drawWrapper";
import { Constants } from "core/Engines/constants";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";
import type { FrameGraphRenderContext } from "core/FrameGraph/frameGraphRenderContext";
import { FrameGraphTask } from "../../frameGraphTask";
import type { ThinPostProcess } from "core/PostProcesses/thinPostProcess";

export class FrameGraphThinPostProcessTask extends FrameGraphTask {
    public sourceTexture: FrameGraphTextureHandle;

    public sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    public destinationTexture?: FrameGraphTextureHandle;

    public readonly outputTexture: FrameGraphTextureHandle;

    public readonly postProcess: ThinPostProcess;

    protected readonly _postProcessDrawWrapper: DrawWrapper;
    protected _outputWidth: number;
    protected _outputHeight: number;

    constructor(name: string, frameGraph: FrameGraph, postProcess: ThinPostProcess) {
        super(name, frameGraph);

        this.postProcess = postProcess;
        this._postProcessDrawWrapper = this.postProcess.drawWrapper;

        this.outputTexture = this._frameGraph.createDanglingHandle();
    }

    public override isReady() {
        return this.postProcess.isReady();
    }

    public override record(
        skipCreationOfDisabledPasses = false,
        additionalExecute?: (context: FrameGraphRenderContext) => void,
        additionalBindings?: (context: FrameGraphRenderContext) => void
    ): FrameGraphRenderPass {
        if (this.sourceTexture === undefined) {
            throw new Error(`FrameGraphPostProcessTask "${this.name}": sourceTexture is required`);
        }

        const sourceTextureCreationOptions = this._frameGraph.getTextureCreationOptions(this.sourceTexture, true);
        sourceTextureCreationOptions.options.generateDepthBuffer = false;
        sourceTextureCreationOptions.options.generateStencilBuffer = false;
        sourceTextureCreationOptions.options.samples = 1;

        this._frameGraph.resolveDanglingHandle(this.outputTexture, this.destinationTexture, this.name, sourceTextureCreationOptions);

        const outputTextureDescription = this._frameGraph.getTextureDescription(this.outputTexture);

        this._outputWidth = outputTextureDescription.size.width;
        this._outputHeight = outputTextureDescription.size.height;

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.useTexture(this.sourceTexture);
        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            context.setTextureSamplingMode(this.sourceTexture, this.sourceSamplingMode);
            additionalExecute?.(context);
            context.applyFullScreenEffect(this._postProcessDrawWrapper, () => {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "textureSampler", this.sourceTexture);
                additionalBindings?.(context);
                this.postProcess.bind();
            });
        });

        if (!skipCreationOfDisabledPasses) {
            const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

            passDisabled.setRenderTarget(this.outputTexture);
            passDisabled.setExecuteFunc((context) => {
                context.copyTexture(this.sourceTexture);
            });
        }

        return pass;
    }

    public override dispose(): void {
        this.postProcess.dispose();
        super.dispose();
    }
}
