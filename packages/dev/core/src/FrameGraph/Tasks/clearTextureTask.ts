import type { Color4 } from "core/Maths/math.color";
import type { FrameGraph } from "../frameGraph";
import type { TextureHandle } from "../frameGraphTextureManager";
import type { FrameGraphTaskOutputTexture, IFrameGraphInputData, IFrameGraphTask } from "./IFrameGraphTask";

export interface IFrameGraphClearTextureInputData extends IFrameGraphInputData {
    color: Color4;
    clearColor?: boolean;
    clearDepth?: boolean;
    clearStencil?: boolean;
    destinationTexture: FrameGraphTaskOutputTexture | TextureHandle;
}

export class FrameGraphClearTextureTask implements IFrameGraphTask {
    public disabledFromGraph = false;

    constructor(public name: string) {}

    public isReady() {
        return true;
    }

    public recordFrameGraph(frameGraph: FrameGraph, inputData: IFrameGraphClearTextureInputData) {
        const destinationTextureHandle = frameGraph.getTextureHandle(inputData.destinationTexture);

        const pass = frameGraph.addRenderPass("clear texture");

        pass.setRenderTarget(destinationTextureHandle);
        pass.setExecuteFunc((context) => {
            context.clear(inputData.color, !!inputData.clearColor, !!inputData.clearDepth, !!inputData.clearStencil);
        });

        const passDisabled = frameGraph.addRenderPass("clear texture_disabled", true);

        passDisabled.setRenderTarget(destinationTextureHandle);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
