import { Color4 } from "core/Maths/math.color";
import type { FrameGraph } from "../frameGraph";
import type { FrameGraphTaskOutputReference, IFrameGraphTask } from "./IFrameGraphTask";
import type { TextureHandle } from "../../Engines/textureHandlerManager";

export class FrameGraphClearTextureTask implements IFrameGraphTask {
    public color = new Color4(0.2, 0.2, 0.3, 1);

    public clearColor = true;

    public clearDepth = false;

    public clearStencil = false;

    public destinationTexture?: FrameGraphTaskOutputReference | TextureHandle;

    public readonly outputTextureReference: FrameGraphTaskOutputReference = [this, "output"];

    public disabled?: boolean;

    constructor(public name: string) {}

    public isReadyFrameGraph() {
        return true;
    }

    public recordFrameGraph(frameGraph: FrameGraph) {
        if (this.destinationTexture === undefined) {
            throw new Error(`FrameGraphClearTextureTask ${this.name}: destinationTexture is required`);
        }

        const outputTextureHandle = frameGraph.getTextureHandle(this.destinationTexture);

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
