import type { FrameGraph } from "../frameGraph";
import type { FrameGraphTextureCreationOptions } from "../frameGraphTextureManager";
import type { IFrameGraphInputData, IFrameGraphTask } from "./IFrameGraphTask";

export interface IFrameGraphCreateRenderTextureInputData extends IFrameGraphInputData {
    textureName: string;
}

export class FrameGraphCreateRenderTextureTask implements IFrameGraphTask {
    private _options: FrameGraphTextureCreationOptions;

    constructor(
        public name: string,
        options: FrameGraphTextureCreationOptions
    ) {
        this._options = options;
    }

    public recordFrameGraph(frameGraph: FrameGraph, inputData: IFrameGraphCreateRenderTextureInputData) {
        const pass = frameGraph.addPass("create " + inputData.textureName);

        frameGraph.createRenderTargetTexture(inputData.textureName, this._options);

        pass.setExecuteFunc((_context) => {});
    }
}
