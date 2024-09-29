import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import { backbufferColorTextureHandle } from "../../frameGraphTypes";
import { FrameGraphTask } from "../../frameGraphTask";

export class FrameGraphCopyToBackbufferColorTask extends FrameGraphTask {
    public sourceTexture: FrameGraphTextureHandle;

    public override record() {
        if (this.sourceTexture === undefined) {
            throw new Error(`FrameGraphCopyToBackbufferColorTask "${this.name}": sourceTexture is required`);
        }

        const pass = this._frameGraph.addRenderPass(this.name);

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
