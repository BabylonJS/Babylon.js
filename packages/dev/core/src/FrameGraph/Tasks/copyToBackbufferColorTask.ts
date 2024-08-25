import type { FrameGraph } from "../frameGraph";
import type { TextureHandle } from "../../Engines/textureHandlerManager";
import type { FrameGraphTaskOutputReference, IFrameGraphTask } from "./IFrameGraphTask";
import type { AbstractEngine } from "../../Engines/abstractEngine";

export class FrameGraphCopyToBackbufferColorTask implements IFrameGraphTask {
    public sourceTexture?: FrameGraphTaskOutputReference | TextureHandle;

    public disabled = false;

    constructor(
        public name: string,
        private _engine: AbstractEngine
    ) {}

    public isReadyFrameGraph() {
        return true;
    }

    public recordFrameGraph(frameGraph: FrameGraph) {
        if (this.sourceTexture === undefined) {
            throw new Error(`FrameGraphCopyToBackbufferColorTask "${this.name}": sourceTexture is required`);
        }

        const sourceTextureHandle = frameGraph.getTextureHandle(this.sourceTexture);

        const pass = frameGraph.addRenderPass("copy to backbuffer color");

        pass.setRenderTarget(this._engine.textureHandleManager.backbufferColorTextureHandle);
        pass.setExecuteFunc((context) => {
            if (!context.isBackbufferColor(sourceTextureHandle)) {
                context.copyTexture(sourceTextureHandle);
            }
        });

        const passDisabled = frameGraph.addRenderPass("copy to backbuffer color_disabled");

        passDisabled.setRenderTarget(this._engine.textureHandleManager.backbufferColorTextureHandle);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
