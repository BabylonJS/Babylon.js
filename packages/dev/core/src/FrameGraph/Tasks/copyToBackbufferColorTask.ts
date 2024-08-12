import type { FrameGraph } from "../frameGraph";
import type { TextureHandle } from "../frameGraphTextureManager";
import { backbufferColorTextureHandle } from "../frameGraphTextureManager";
import type { FrameGraphTaskTexture, IFrameGraphInputData, IFrameGraphTask } from "./IFrameGraphTask";

export interface IFrameGraphCopyToBackbufferColorInputData extends IFrameGraphInputData {
    sourceTexture: FrameGraphTaskTexture | TextureHandle;
}

export class FrameGraphCopyToBackbufferColorTask implements IFrameGraphTask {
    public disabledFromGraph = false;

    constructor(public name: string) {}

    public isReady() {
        return true;
    }

    public recordFrameGraph(frameGraph: FrameGraph, inputData: IFrameGraphCopyToBackbufferColorInputData) {
        const copyPass = frameGraph.addRenderPass("copy to framebuffer");

        const sourceTextureHandle = frameGraph.getTextureHandle(inputData.sourceTexture);

        copyPass.setRenderTarget(backbufferColorTextureHandle);
        copyPass.setExecuteFunc((context) => {
            context.copyTexture(context.getTextureFromHandle(sourceTextureHandle)!.texture!);
        });
    }
}
