import type { FrameGraph } from "../frameGraph";
import type { TextureHandle } from "../frameGraphTextureManager";
import { backbufferColorTextureHandle } from "../frameGraphTextureManager";
import type { FrameGraphTaskOutputReference, IFrameGraphTask } from "./IFrameGraphTask";

export class FrameGraphCopyToBackbufferColorTask implements IFrameGraphTask {
    public disabled = false;

    public sourceTexture?: FrameGraphTaskOutputReference | TextureHandle;

    constructor(public name: string) {}

    public isReadyFrameGraph() {
        return true;
    }

    public recordFrameGraph(frameGraph: FrameGraph) {
        if (this.sourceTexture === undefined) {
            throw new Error("FrameGraphCopyToBackbufferColorTask: sourceTexture is required");
        }

        const sourceTextureHandle = frameGraph.getTextureHandle(this.sourceTexture);

        const pass = frameGraph.addRenderPass("copy to backbuffer color");

        pass.setRenderTarget(backbufferColorTextureHandle);
        pass.setExecuteFunc((context) => {
            if (!context.isBackbufferColor(sourceTextureHandle)) {
                context.copyTexture(context.getTextureFromHandle(sourceTextureHandle)!.texture!);
            }
        });

        const passDisabled = frameGraph.addRenderPass("copy to backbuffer color_disabled");

        passDisabled.setRenderTarget(backbufferColorTextureHandle);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
