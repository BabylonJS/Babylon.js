// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphTextureHandle } from "core/index";
import { FrameGraphTask } from "../../frameGraphTask";

/**
 * Task used to copy a texture to another texture.
 */
export class FrameGraphCopyToTextureTask extends FrameGraphTask {
    /**
     * The source texture to copy from.
     */
    public sourceTexture: FrameGraphTextureHandle;

    /**
     * The destination texture to copy to.
     */
    public destinationTexture: FrameGraphTextureHandle;

    /**
     * The output texture (same as destinationTexture, but the handle may be different).
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * Constructs a new FrameGraphCopyToTextureTask.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     */
    constructor(name: string, frameGraph: FrameGraph) {
        super(name, frameGraph);

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public record() {
        if (this.sourceTexture === undefined || this.destinationTexture === undefined) {
            throw new Error(`FrameGraphCopyToTextureTask "${this.name}": sourceTexture and destinationTexture are required`);
        }

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.destinationTexture);

        this._addInternalDependencies(this.sourceTexture);

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            context.copyTexture(this.sourceTexture);
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
