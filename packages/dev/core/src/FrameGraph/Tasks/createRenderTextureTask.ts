import type { FrameGraph } from "../frameGraph";
import type { FrameGraphTextureCreationOptions } from "../frameGraphTextureManager";
import type { IFrameGraphInputData, IFrameGraphTask } from "./IFrameGraphTask";

export interface IFrameGraphCreateRenderTextureInputData extends IFrameGraphInputData {
    textureName: string;
}

export class FrameGraphCreateRenderTextureTask implements IFrameGraphTask {
    private _options: FrameGraphTextureCreationOptions;

    public disabledFromGraph = false;

    constructor(
        public name: string,
        options: FrameGraphTextureCreationOptions
    ) {
        this._options = options;
    }

    public isReady() {
        return true;
    }

    public recordFrameGraph(frameGraph: FrameGraph, inputData: IFrameGraphCreateRenderTextureInputData) {
        const pass = frameGraph.addPass(this.name);

        frameGraph.createRenderTargetTexture(inputData.textureName, this._options);

        pass.setExecuteFunc((_context) => {});
    }
}
