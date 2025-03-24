// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphTextureHandle, FrameGraphRenderPass } from "core/index";
import { Color4, TmpColors } from "../../../Maths/math.color";
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
     * If the color should be converted to linear space (default: false).
     */
    public convertColorToLinearSpace = false;

    /**
     * If the depth should be cleared.
     */
    public clearDepth = false;

    /**
     * If the stencil should be cleared.
     */
    public clearStencil = false;

    /**
     * The color texture to clear.
     */
    public targetTexture?: FrameGraphTextureHandle;

    /**
     * The depth attachment texture to clear.
     */
    public depthTexture?: FrameGraphTextureHandle;

    /**
     * The output texture (same as targetTexture, but the handle will be different).
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

    public record(): FrameGraphRenderPass {
        if (this.targetTexture === undefined && this.depthTexture === undefined) {
            throw new Error(`FrameGraphClearTextureTask ${this.name}: targetTexture and depthTexture can't both be undefined.`);
        }

        let textureSamples = 0;
        let depthSamples = 0;

        if (this.targetTexture !== undefined) {
            textureSamples = this._frameGraph.textureManager.getTextureDescription(this.targetTexture).options.samples || 1;
            this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.targetTexture);
        }
        if (this.depthTexture !== undefined) {
            depthSamples = this._frameGraph.textureManager.getTextureDescription(this.depthTexture).options.samples || 1;
            this._frameGraph.textureManager.resolveDanglingHandle(this.outputDepthTexture, this.depthTexture);
        }

        if (textureSamples !== depthSamples && textureSamples !== 0 && depthSamples !== 0) {
            throw new Error(`FrameGraphClearTextureTask ${this.name}: the depth texture and the target texture must have the same number of samples.`);
        }

        const color = TmpColors.Color4[0];

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(this.targetTexture);
        pass.setRenderTargetDepth(this.depthTexture);
        pass.setExecuteFunc((context) => {
            color.copyFrom(this.color);
            if (this.convertColorToLinearSpace) {
                color.toLinearSpaceToRef(color);
            }

            context.clear(color, !!this.clearColor, !!this.clearDepth, !!this.clearStencil);
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.targetTexture);
        passDisabled.setRenderTargetDepth(this.depthTexture);
        passDisabled.setExecuteFunc((_context) => {});

        return pass;
    }
}
