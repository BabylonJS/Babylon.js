import type { FrameGraph } from "../frameGraph";
import type { TextureHandle } from "../frameGraphTextureManager";
import type { FrameGraphTaskOutputTexture, IFrameGraphInputData, IFrameGraphTask } from "./IFrameGraphTask";

export interface IFrameGraphCopyToTextureInputData extends IFrameGraphInputData {
    sourceTexture: FrameGraphTaskOutputTexture | TextureHandle;
    outputTexture: FrameGraphTaskOutputTexture | TextureHandle;
}

export class FrameGraphCopyToTextureTask implements IFrameGraphTask {
    public disabledFromGraph = false;

    constructor(public name: string) {}

    public isReady() {
        return true;
    }

    public recordFrameGraph(frameGraph: FrameGraph, inputData: IFrameGraphCopyToTextureInputData) {
        const pass = frameGraph.addRenderPass(this.name);

        const sourceTextureHandle = frameGraph.getTextureHandle(inputData.sourceTexture);
        const outputTextureHandle = frameGraph.getTextureHandle(inputData.outputTexture);

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
