import type { FrameGraph } from "../frameGraph";
import type { FrameGraphTaskTexture, IFrameGraphInputData, IFrameGraphTask } from "./IFrameGraphTask";

export interface IFrameGraphCopyToBackbufferInputData extends IFrameGraphInputData {
    sourceTexturePath: FrameGraphTaskTexture;
}

export class FrameGraphCopyToBackbufferColorTask implements IFrameGraphTask {
    constructor(public name: string) {}

    public addToFrameGraph(frameGraph: FrameGraph, inputData: IFrameGraphCopyToBackbufferInputData) {
        const copyPass = frameGraph.addRenderPass("copy to framebuffer");

        const sourceTextureHandle = frameGraph.getTextureHandleFromTask(inputData.sourceTexturePath);

        copyPass.setRenderTarget(frameGraph.backbufferColorTextureHandle);
        copyPass.setExecuteFunc((context) => {
            context.copyTexture(context.getTextureFromHandle(sourceTextureHandle)!.texture!);
        });
    }
}
