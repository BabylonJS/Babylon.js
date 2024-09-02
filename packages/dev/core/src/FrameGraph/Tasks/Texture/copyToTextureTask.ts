import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTaskOutputReference, FrameGraphTextureId, IFrameGraphTask } from "../../frameGraphTypes";

export class FrameGraphCopyToTextureTask implements IFrameGraphTask {
    public sourceTexture: FrameGraphTextureId;

    public destinationTexture: FrameGraphTextureId;

    public readonly outputTextureReference: FrameGraphTaskOutputReference = [this, "output"];

    public disabled = false;

    constructor(public name: string) {}

    public isReadyFrameGraph() {
        return true;
    }

    public recordFrameGraph(frameGraph: FrameGraph) {
        if (this.sourceTexture === undefined || this.destinationTexture === undefined) {
            throw new Error(`FrameGraphCopyToTextureTask "${this.name}": sourceTexture and destinationTexture are required`);
        }

        const pass = frameGraph.addRenderPass(this.name);

        const sourceTextureHandle = frameGraph.getTextureHandle(this.sourceTexture);
        const outputTextureHandle = frameGraph.getTextureHandle(this.destinationTexture);

        pass.useTexture(sourceTextureHandle);
        pass.setRenderTarget(outputTextureHandle);
        pass.setExecuteFunc((context) => {
            context.copyTexture(sourceTextureHandle);
        });

        const passDisabled = frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(outputTextureHandle);
        passDisabled.setExecuteFunc((_context) => {});
    }

    public disposeFrameGraph(): void {}
}
