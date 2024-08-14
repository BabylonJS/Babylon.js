import type { Color4 } from "core/Maths/math.color";
import type { FrameGraph } from "../frameGraph";
import type { TextureHandle } from "../frameGraphTextureManager";
import type { FrameGraphTaskOutputTexture, IFrameGraphInputData, IFrameGraphTask } from "./IFrameGraphTask";

export interface IFrameGraphClearTextureInputData extends IFrameGraphInputData {
    color: Color4;
    clearColor?: boolean;
    clearDepth?: boolean;
    clearStencil?: boolean;
    outputTexture: FrameGraphTaskOutputTexture | TextureHandle;
}

export class FrameGraphClearTextureTask implements IFrameGraphTask {
    public disabledFromGraph = false;

    constructor(public name: string) {}

    public isReady() {
        return true;
    }

    public recordFrameGraph(frameGraph: FrameGraph, inputData: IFrameGraphClearTextureInputData) {
        const outputTextureHandle = frameGraph.getTextureHandle(inputData.outputTexture);

        const pass = frameGraph.addRenderPass("clear texture");

        pass.setRenderTarget(outputTextureHandle);
        pass.setExecuteFunc((context) => {
            context.clear(inputData.color, !!inputData.clearColor, !!inputData.clearDepth, !!inputData.clearStencil);
        });

        const passDisabled = frameGraph.addRenderPass("clear texture_disabled", true);

        passDisabled.setRenderTarget(outputTextureHandle);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
