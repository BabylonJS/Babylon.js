import type { FrameGraph, FrameGraphTextureCreationOptions } from "../frameGraph";
import type { IFrameGraphInputData, IFrameGraphTask } from "./IFrameGraphTask";

export interface IFrameGraphCreateRenderTextureInputData extends IFrameGraphInputData {
    outputTextureName: string;
}

export class FrameGraphCreateRenderTextureTask implements IFrameGraphTask {
    private _options: FrameGraphTextureCreationOptions;

    constructor(
        public name: string,
        options: FrameGraphTextureCreationOptions
    ) {
        this._options = options;
    }

    public addToFrameGraph(frameGraph: FrameGraph, inputData: IFrameGraphCreateRenderTextureInputData) {
        const pass = frameGraph.addPass("create " + this.name);

        frameGraph.createRenderTargetTexture(inputData.outputTextureName, this._options);

        pass.setExecuteFunc((_context) => {});
    }
}
