// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphTextureHandle } from "core/index";
import { Color4 } from "../../../Maths/math.color";
import { FrameGraphTask } from "../../frameGraphTask";

/**
 * Task used to clear a texture.
 */
export class FrameGraphClearTextureTask extends FrameGraphTask {
    /**
     * The color to clear the texture with.
     */
    public color = new Color4(0.2, 0.2, 0.3, 1);

    /**
     * If the color should be cleared.
     */
    public clearColor = true;

    /**
     * If the depth should be cleared.
     */
    public clearDepth = false;

    /**
     * If the stencil should be cleared.
     */
    public clearStencil = false;

    /**
     * The texture to clear.
     */
    public destinationTexture?: FrameGraphTextureHandle;

    /**
     * The depth attachment texture to clear.
     */
    public depthTexture?: FrameGraphTextureHandle;

    /**
     * The output texture (same as destinationTexture, but the handle will be different).
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * The output depth texture (same as depthTexture, but the handle will be different).
     */
    public readonly outputDepthTexture: FrameGraphTextureHandle;

    /**
     * Constructs a new clear task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     */
    constructor(name: string, frameGraph: FrameGraph) {
        super(name, frameGraph);

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.outputDepthTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public record() {
        if (this.destinationTexture === undefined && this.depthTexture === undefined) {
            throw new Error(`FrameGraphClearTextureTask ${this.name}: destinationTexture and depthTexture can't both be undefined.`);
        }

        if (this.destinationTexture !== undefined) {
            this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.destinationTexture);
        }
        if (this.depthTexture !== undefined) {
            this._frameGraph.textureManager.resolveDanglingHandle(this.outputDepthTexture, this.depthTexture);
        }

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(this.destinationTexture);
        pass.setRenderTargetDepth(this.depthTexture);
        pass.setExecuteFunc((context) => {
            context.clear(this.color, !!this.clearColor, !!this.clearDepth, !!this.clearStencil);
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.destinationTexture);
        passDisabled.setRenderTargetDepth(this.depthTexture);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
