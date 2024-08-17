import { Color4 } from "core/Maths/math.color";
import type { FrameGraph } from "../frameGraph";
import type { TextureHandle } from "../frameGraphTextureManager";
import type { FrameGraphTaskOutputReference, IFrameGraphTask } from "./IFrameGraphTask";

export class FrameGraphClearTextureTask implements IFrameGraphTask {
    public disabled = false;

    public color = new Color4(0.2, 0.2, 0.3, 1);

    public clearColor = true;

    public clearDepth = false;

    public clearStencil = false;

    public outputTexture?: FrameGraphTaskOutputReference | TextureHandle;

    public readonly outputTextureReference: FrameGraphTaskOutputReference = [this, "output"];

    constructor(public name: string) {}

    public isReadyFrameGraph() {
        return true;
    }

    public recordFrameGraph(frameGraph: FrameGraph) {
        if (this.outputTexture === undefined) {
            throw new Error("outputTexture is required");
        }

        const outputTextureHandle = frameGraph.getTextureHandle(this.outputTexture);

        const pass = frameGraph.addRenderPass("clear texture");

        pass.setRenderTarget(outputTextureHandle);
        pass.setExecuteFunc((context) => {
            context.clear(this.color, !!this.clearColor, !!this.clearDepth, !!this.clearStencil);
        });

        const passDisabled = frameGraph.addRenderPass("clear texture_disabled", true);

        passDisabled.setRenderTarget(outputTextureHandle);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
