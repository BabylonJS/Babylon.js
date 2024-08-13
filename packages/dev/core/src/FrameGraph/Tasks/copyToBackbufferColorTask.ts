import type { FrameGraph } from "../frameGraph";
import type { TextureHandle } from "../frameGraphTextureManager";
import { backbufferColorTextureHandle } from "../frameGraphTextureManager";
import type { FrameGraphTaskOutputTexture, IFrameGraphInputData, IFrameGraphTask } from "./IFrameGraphTask";

export interface IFrameGraphCopyToBackbufferColorInputData extends IFrameGraphInputData {
    sourceTexture: FrameGraphTaskOutputTexture | TextureHandle;
}

export class FrameGraphCopyToBackbufferColorTask implements IFrameGraphTask {
    public disabledFromGraph = false;

    constructor(public name: string) {}

    public isReady() {
        return true;
    }

    public recordFrameGraph(frameGraph: FrameGraph, inputData: IFrameGraphCopyToBackbufferColorInputData) {
        const sourceTextureHandle = frameGraph.getTextureHandle(inputData.sourceTexture);

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
