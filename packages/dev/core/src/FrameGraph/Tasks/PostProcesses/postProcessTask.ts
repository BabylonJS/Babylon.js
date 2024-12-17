// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphTextureHandle, DrawWrapper, FrameGraphRenderPass, FrameGraphRenderContext, EffectWrapper } from "core/index";
import { Constants } from "core/Engines/constants";
import { FrameGraphTask } from "../../frameGraphTask";

/**
 * Task which applies a post process.
 */
export class FrameGraphPostProcessTask extends FrameGraphTask {
    /**
     * The source texture to apply the post process on.
     */
    public sourceTexture: FrameGraphTextureHandle;

    /**
     * The sampling mode to use for the source texture.
     */
    public sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    /**
     * The destination texture to render the post process to.
     * If not supplied, a texture with the same configuration as the source texture will be created.
     */
    public destinationTexture?: FrameGraphTextureHandle;

    /**
     * The output texture of the post process.
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * The post process to apply.
     */
    public readonly postProcess: EffectWrapper;

    protected readonly _postProcessDrawWrapper: DrawWrapper;
    protected _outputWidth: number;
    protected _outputHeight: number;

    /**
     * Constructs a new post process task.
     * @param name Name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param postProcess The post process to apply.
     */
    constructor(name: string, frameGraph: FrameGraph, postProcess: EffectWrapper) {
        super(name, frameGraph);

        this.postProcess = postProcess;
        this._postProcessDrawWrapper = this.postProcess.drawWrapper;

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public override isReady() {
        return this.postProcess.isReady();
    }

    public record(
        skipCreationOfDisabledPasses = false,
        additionalExecute?: (context: FrameGraphRenderContext) => void,
        additionalBindings?: (context: FrameGraphRenderContext) => void
    ): FrameGraphRenderPass {
        if (this.sourceTexture === undefined) {
            throw new Error(`FrameGraphPostProcessTask "${this.name}": sourceTexture is required`);
        }

        const sourceTextureCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.sourceTexture);
        sourceTextureCreationOptions.options.samples = 1;

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.destinationTexture, this.name, sourceTextureCreationOptions);

        const outputTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.outputTexture);

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
