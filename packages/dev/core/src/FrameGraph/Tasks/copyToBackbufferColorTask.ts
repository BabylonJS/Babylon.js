import type { FrameGraph } from "../frameGraph";
import type { TextureHandle } from "../../Engines/textureHandleManager";
import { backbufferColorTextureHandle } from "../../Engines/textureHandleManager";
import type { FrameGraphTaskOutputReference, IFrameGraphTask } from "./IFrameGraphTask";

export class FrameGraphCopyToBackbufferColorTask implements IFrameGraphTask {
    public sourceTexture?: FrameGraphTaskOutputReference | TextureHandle;

    public disabled = false;

    constructor(public name: string) {}

    public isReadyFrameGraph() {
        return true;
    }

    public recordFrameGraph(frameGraph: FrameGraph) {
        if (this.sourceTexture === undefined) {
            throw new Error(`FrameGraphCopyToBackbufferColorTask "${this.name}": sourceTexture is required`);
        }

        const sourceTextureHandle = frameGraph.getTextureHandle(this.sourceTexture);

        const pass = frameGraph.addRenderPass("copy to backbuffer color");

        pass.setRenderTarget(backbufferColorTextureHandle);
        pass.setExecuteFunc((context) => {
            if (!context.isBackbuffer(sourceTextureHandle)) {
                context.copyTexture(sourceTextureHandle);
            }
        });

        const passDisabled = frameGraph.addRenderPass("copy to backbuffer color_disabled", true);

        passDisabled.setRenderTarget(backbufferColorTextureHandle);
        passDisabled.setExecuteFunc((_context) => {});
    }

    public disposeFrameGraph(): void {}
}
