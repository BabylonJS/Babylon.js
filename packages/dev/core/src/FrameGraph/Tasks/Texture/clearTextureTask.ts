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
    public destinationTexture: FrameGraphTextureHandle;

    /**
     * The output texture (same as destinationTexture, but the handle may be different).
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    constructor(name: string, frameGraph: FrameGraph) {
        super(name, frameGraph);

        this.outputTexture = this._frameGraph.createDanglingHandle();
    }

    public record() {
        if (this.destinationTexture === undefined) {
            throw new Error(`FrameGraphClearTextureTask ${this.name}: destinationTexture is required`);
        }

        this._frameGraph.resolveDanglingHandle(this.outputTexture, this.destinationTexture);

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(this.destinationTexture);
        pass.setExecuteFunc((context) => {
            context.clear(this.color, !!this.clearColor, !!this.clearDepth, !!this.clearStencil);
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.destinationTexture);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
