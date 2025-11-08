import type { FrameGraph, FrameGraphTextureHandle, IViewportLike, Nullable } from "core/index";
import { FrameGraphTask } from "../../frameGraphTask";
import { Constants } from "core/Engines/constants";

/**
 * Task used to copy a texture to another texture.
 */
export class FrameGraphCopyToTextureTask extends FrameGraphTask {
    /**
     * The source texture to copy from.
     */
    public sourceTexture: FrameGraphTextureHandle;

    /**
     * The target texture to copy to.
     */
    public targetTexture: FrameGraphTextureHandle;

    /**
     * The viewport to use when doing the copy.
     * If set to null, the currently active viewport is used.
     * If undefined (default), the viewport is reset to a full screen viewport before performing the copy.
     */
    public viewport?: Nullable<IViewportLike>;

    /**
     * The LOD level to copy from the source texture (default: 0).
     */
    public lodLevel: number = 0;

    /**
     * The output texture (same as targetTexture, but the handle may be different).
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
        if (this.sourceTexture === undefined || this.targetTexture === undefined) {
            throw new Error(`FrameGraphCopyToTextureTask "${this.name}": sourceTexture and targetTexture are required`);
        }

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.targetTexture);

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.addDependencies(this.sourceTexture);

        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            if (this.viewport) {
                context.setViewport(this.viewport);
            }
            context.setTextureSamplingMode(this.sourceTexture, this.lodLevel > 0 ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
            context.copyTexture(this.sourceTexture, undefined, this.viewport !== undefined, this.lodLevel);
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
