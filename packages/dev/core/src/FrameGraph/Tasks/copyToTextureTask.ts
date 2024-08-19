import type { FrameGraph } from "../frameGraph";
import type { TextureHandle } from "../frameGraphTextureManager";
import type { FrameGraphTaskOutputReference, IFrameGraphTask } from "./IFrameGraphTask";

export class FrameGraphCopyToTextureTask implements IFrameGraphTask {
    public disabled = false;

    public sourceTexture?: FrameGraphTaskOutputReference | TextureHandle;

    public destinationTexture?: FrameGraphTaskOutputReference | TextureHandle;

    public readonly outputTextureReference: FrameGraphTaskOutputReference = [this, "output"];

    constructor(public name: string) {}

    public isReadyFrameGraph() {
        return true;
    }

    public recordFrameGraph(frameGraph: FrameGraph) {
        if (this.sourceTexture === undefined || this.destinationTexture === undefined) {
            throw new Error("FrameGraphCopyToTextureTask: sourceTexture and destinationTexture are required");
        }

        const pass = frameGraph.addRenderPass(this.name);

        const sourceTextureHandle = frameGraph.getTextureHandle(this.sourceTexture);
        const outputTextureHandle = frameGraph.getTextureHandle(this.destinationTexture);

        pass.useTexture(sourceTextureHandle);
        pass.setRenderTarget(outputTextureHandle);
        pass.setExecuteFunc((context) => {
            context.copyTexture(context.getTextureFromHandle(sourceTextureHandle)!.texture!);
        });

        const passDisabled = frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(sourceTextureHandle);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
