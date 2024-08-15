import type { FrameGraph } from "../frameGraph";
import type { TextureHandle } from "../frameGraphTextureManager";
import { backbufferColorTextureHandle } from "../frameGraphTextureManager";
import type { FrameGraphTaskTexture, IFrameGraphInputData, IFrameGraphTask } from "./IFrameGraphTask";

export interface IFrameGraphCopyToBackbufferColorInputData extends IFrameGraphInputData {
    sourceTexture: FrameGraphTaskTexture | TextureHandle;
}

export class FrameGraphCopyToBackbufferColorTask implements IFrameGraphTask {
    public disabledFrameGraph = false;

    constructor(public name: string) {}

    public isReadyFrameGraph() {
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
