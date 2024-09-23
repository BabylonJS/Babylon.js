import { Color4 } from "../../../Maths/math.color";
import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTaskOutputReference, IFrameGraphTask, FrameGraphTextureId } from "../../frameGraphTypes";

export class FrameGraphClearTextureTask implements IFrameGraphTask {
    public color = new Color4(0.2, 0.2, 0.3, 1);

    public clearColor = true;

    public clearDepth = false;

    public clearStencil = false;

    public destinationTexture: FrameGraphTextureId;

    public readonly outputTextureReference: FrameGraphTaskOutputReference = [this, "output"];

    public disabled = false;

    constructor(public name: string) {}

    public isReady() {
        return true;
    }

    public record(frameGraph: FrameGraph) {
        if (this.destinationTexture === undefined) {
            throw new Error(`FrameGraphClearTextureTask ${this.name}: destinationTexture is required`);
        }

        const outputTextureHandle = frameGraph.getTextureHandle(this.destinationTexture);

        const pass = frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(outputTextureHandle);
        pass.setExecuteFunc((context) => {
            context.clear(this.color, !!this.clearColor, !!this.clearDepth, !!this.clearStencil);
        });

        const passDisabled = frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(outputTextureHandle);
        passDisabled.setExecuteFunc((_context) => {});
    }

    public dispose(): void {}
}
