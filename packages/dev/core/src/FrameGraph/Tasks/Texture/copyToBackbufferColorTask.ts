// eslint-disable-next-line import/no-internal-modules
import type { FrameGraphTextureHandle } from "core/index";
import { backbufferColorTextureHandle } from "../../frameGraphTypes";
import { FrameGraphTask } from "../../frameGraphTask";

/**
 * Task which copies a texture to the backbuffer color texture.
 */
export class FrameGraphCopyToBackbufferColorTask extends FrameGraphTask {
    /**
     * The source texture to copy to the backbuffer color texture.
     */
    public sourceTexture: FrameGraphTextureHandle;

    public record() {
        if (this.sourceTexture === undefined) {
            throw new Error(`FrameGraphCopyToBackbufferColorTask "${this.name}": sourceTexture is required`);
        }

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.addDependencies(this.sourceTexture);

        pass.setRenderTarget(backbufferColorTextureHandle);
        pass.setExecuteFunc((context) => {
            if (!context.isBackbuffer(this.sourceTexture)) {
                context.copyTexture(this.sourceTexture);
            }
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(backbufferColorTextureHandle);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
