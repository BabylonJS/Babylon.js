import type { FrameGraph } from "../../frameGraph";
import type { IFrameGraphTask, FrameGraphTextureId } from "../../frameGraphTypes";
import { backbufferColorTextureHandle } from "../../frameGraphTypes";

export class FrameGraphCopyToBackbufferColorTask implements IFrameGraphTask {
    public sourceTexture: FrameGraphTextureId;

    public disabled = false;

    constructor(public name: string) {}

    public isReady() {
        return true;
    }

    public record(frameGraph: FrameGraph) {
        if (this.sourceTexture === undefined) {
            throw new Error(`FrameGraphCopyToBackbufferColorTask "${this.name}": sourceTexture is required`);
        }

        const sourceTextureHandle = frameGraph.getTextureHandle(this.sourceTexture);

        const pass = frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(backbufferColorTextureHandle);
        pass.setExecuteFunc((context) => {
            if (!context.isBackbuffer(sourceTextureHandle)) {
                context.copyTexture(sourceTextureHandle);
            }
        });

        const passDisabled = frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(backbufferColorTextureHandle);
        passDisabled.setExecuteFunc((_context) => {});
    }

    public dispose(): void {}
}
