import type { PostProcess } from "core/PostProcesses/postProcess";
import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureId } from "../../frameGraphTypes";
import { FrameGraphPostProcessTask } from "./postProcessTask";
import type { BloomMergePostProcess } from "../../../PostProcesses/bloomMergePostProcess";

export class FrameGraphBloomMergeTask extends FrameGraphPostProcessTask {
    public sourceBlurTexture: FrameGraphTextureId;

    protected override _postProcess: BloomMergePostProcess;

    constructor(name: string, bloomMergePostProcess: PostProcess) {
        super(name, bloomMergePostProcess);
    }

    public override recordFrameGraph(frameGraph: FrameGraph, skipCreationOfDisabledPasses = false): void {
        if (this.sourceTexture === undefined || this.sourceBlurTexture === undefined) {
            throw new Error(`BloomMergePostProcess "${this.name}": sourceTexture and sourceBlurTexture are required`);
        }

        const sourceTextureCreationOptions = frameGraph.getTextureCreationOptions(this.sourceTexture, true);
        sourceTextureCreationOptions.options.generateDepthBuffer = false;
        sourceTextureCreationOptions.options.generateStencilBuffer = false;

        const sourceTextureHandle = frameGraph.getTextureHandle(this.sourceTexture);
        const sourceBlurTextureHandle = frameGraph.getTextureHandle(this.sourceBlurTexture);
        const outputTextureHandle = frameGraph.getTextureHandleOrCreateTexture(this.destinationTexture, this.name, sourceTextureCreationOptions);

        const pass = frameGraph.addRenderPass(this.name);

        pass.useTexture(sourceTextureHandle);
        pass.useTexture(sourceBlurTextureHandle);
        pass.setRenderTarget(outputTextureHandle);
        pass.setExecuteFunc((context) => {
            context.applyFullScreenEffect(this._postProcessDrawWrapper, () => {
                this._postProcess._bind();
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "textureSampler", sourceTextureHandle);
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "bloomBlur", sourceBlurTextureHandle);
                this._postProcessDrawWrapper.effect!.setFloat("bloomWeight", this._postProcess.weight);
            });
        });

        if (!skipCreationOfDisabledPasses) {
            const passDisabled = frameGraph.addRenderPass(this.name + "_disabled", true);

            passDisabled.setRenderTarget(outputTextureHandle);
            passDisabled.setExecuteFunc((context) => {
                context.copyTexture(sourceTextureHandle);
            });
        }
    }
}
