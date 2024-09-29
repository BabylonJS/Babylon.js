import type { PostProcess } from "core/PostProcesses/postProcess";
import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import type { DrawWrapper } from "core/Materials/drawWrapper";
import { Constants } from "core/Engines/constants";
import type { FrameGraphRenderPass } from "core/FrameGraph/Passes/renderPass";
import type { FrameGraphRenderContext } from "core/FrameGraph/frameGraphRenderContext";
import { FrameGraphTask } from "../../frameGraphTask";

export class FrameGraphPostProcessTask extends FrameGraphTask {
    public sourceTexture: FrameGraphTextureHandle;

    public sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    public destinationTexture?: FrameGraphTextureHandle;

    public readonly outputTextureReference: FrameGraphTextureHandle;

    public getPostProcess<T extends PostProcess>() {
        return this._postProcess as T;
    }

    protected _postProcess: PostProcess;
    protected _postProcessDrawWrapper: DrawWrapper;

    constructor(name: string, frameGraph: FrameGraph, postProcess: PostProcess) {
        if (!postProcess.useAsFrameGraphTask) {
            throw new Error(`PostProcess "${name}": the post-process must have been created with the useAsFrameGraphTask property set to true`);
        }
        super(name, frameGraph);

        this._postProcess = postProcess;
        this._postProcessDrawWrapper = postProcess.getDrawWrapper();

        this.outputTextureReference = this._frameGraph.createDanglingHandle();
    }

    public override isReady() {
        return this._postProcess.isReady();
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

        this._frameGraph.resolveDanglingHandle(this.outputTextureReference, this.destinationTexture, this.name, sourceTextureCreationOptions);

        const outputTextureDescription = this._frameGraph.getTextureDescription(this.outputTextureReference);

        this._postProcess.width = outputTextureDescription.size.width;
        this._postProcess.height = outputTextureDescription.size.height;

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.useTexture(this.sourceTexture);
        pass.setRenderTarget(this.outputTextureReference);
        pass.setExecuteFunc((context) => {
            context.setTextureSamplingMode(this.sourceTexture, this.sourceSamplingMode);
            additionalExecute?.(context);
            context.applyFullScreenEffect(this._postProcessDrawWrapper, () => {
                this._postProcess._bind();
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "textureSampler", this.sourceTexture);
                additionalBindings?.(context);
            });
        });

        if (!skipCreationOfDisabledPasses) {
            const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

            passDisabled.setRenderTarget(this.outputTextureReference);
            passDisabled.setExecuteFunc((context) => {
                context.copyTexture(this.sourceTexture);
            });
        }

        return pass;
    }

    public override dispose(): void {
        this._postProcess.dispose();
        super.dispose();
    }
}
