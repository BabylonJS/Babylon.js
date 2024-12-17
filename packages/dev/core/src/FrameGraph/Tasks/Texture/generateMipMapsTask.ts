// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphTextureHandle } from "core/index";
import { FrameGraphTask } from "../../frameGraphTask";

/**
 * Task which generates mipmaps for a texture.
 */
export class FrameGraphGenerateMipMapsTask extends FrameGraphTask {
    /**
     * The texture to generate mipmaps for.
     */
    public destinationTexture: FrameGraphTextureHandle;

    /**
     * The output texture (same as destinationTexture, but the handle may be different).
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * Constructs a new FrameGraphGenerateMipMapsTask.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     */
    constructor(name: string, frameGraph: FrameGraph) {
        super(name, frameGraph);

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public record() {
        if (this.destinationTexture === undefined) {
            throw new Error(`FrameGraphGenerateMipMapsTask ${this.name}: destinationTexture is required`);
        }

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.destinationTexture);

        const outputTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.destinationTexture);

        if (!outputTextureDescription.options.createMipMaps) {
            throw new Error(`FrameGraphGenerateMipMapsTask ${this.name}: destinationTexture must have createMipMaps set to true`);
        }

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            context.generateMipMaps();
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
