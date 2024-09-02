import type { PostProcess } from "core/PostProcesses/postProcess";
import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTaskOutputReference, IFrameGraphTask, FrameGraphTextureId } from "../../frameGraphTypes";
import type { DrawWrapper } from "core/Materials/drawWrapper";
import { Constants } from "core/Engines/constants";

export class FrameGraphPostProcessTask implements IFrameGraphTask {
    public sourceTexture: FrameGraphTextureId;

    public sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    public destinationTexture?: FrameGraphTextureId;

    public readonly outputTextureReference: FrameGraphTaskOutputReference = [this, "output"];

    public disabled = false;

    public getPostProcess<T extends PostProcess>() {
        return this._postProcess as T;
    }

    protected _postProcess: PostProcess;
    protected _postProcessDrawWrapper: DrawWrapper;

    constructor(
        public name: string,
        postProcess: PostProcess
    ) {
        if (!postProcess.useAsFrameGraphTask) {
            throw new Error(`PostProcess "${name}": the post-process must have been created with the useAsFrameGraphTask property set to true`);
        }
        this._postProcess = postProcess;
        this._postProcessDrawWrapper = postProcess.getDrawWrapper();
    }

    public isReadyFrameGraph() {
        return this._postProcess.isReady();
    }

    public recordFrameGraph(frameGraph: FrameGraph, skipCreationOfDisabledPasses = false): void {
        if (this.sourceTexture === undefined) {
            throw new Error(`PostProcess "${this.name}": sourceTexture is required`);
        }

        const sourceTextureCreationOptions = frameGraph.getTextureCreationOptions(this.sourceTexture, true);
        sourceTextureCreationOptions.options.generateDepthBuffer = false;
        sourceTextureCreationOptions.options.generateStencilBuffer = false;

        const sourceTextureHandle = frameGraph.getTextureHandle(this.sourceTexture);
        const outputTextureHandle = frameGraph.getTextureHandleOrCreateTexture(this.destinationTexture, this.name, sourceTextureCreationOptions);

        const outputTextureDescription = frameGraph.getTextureDescription(outputTextureHandle);

        this._postProcess.width = outputTextureDescription.size.width;
        this._postProcess.height = outputTextureDescription.size.height;

        const pass = frameGraph.addRenderPass(this.name);

        pass.useTexture(sourceTextureHandle);
        pass.setRenderTarget(outputTextureHandle);
        pass.setExecuteFunc((context) => {
            context.setTextureSamplingMode(sourceTextureHandle, this!.sourceSamplingMode!);
            context.applyFullScreenEffect(this._postProcessDrawWrapper, () => {
                this._postProcess._bind();
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "textureSampler", sourceTextureHandle);
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

    public disposeFrameGraph(): void {
        this._postProcess.dispose();
    }
}
