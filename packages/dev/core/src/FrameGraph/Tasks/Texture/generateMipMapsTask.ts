import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTaskOutputReference, IFrameGraphTask, FrameGraphTextureId } from "../../frameGraphTypes";

export class FrameGraphGenerateMipMapsTask implements IFrameGraphTask {
    public destinationTexture: FrameGraphTextureId;

    public readonly outputTextureReference: FrameGraphTaskOutputReference = [this, "output"];

    public disabled = false;

    constructor(public name: string) {}

    public isReady() {
        return true;
    }

    public record(frameGraph: FrameGraph) {
        if (this.destinationTexture === undefined) {
            throw new Error(`FrameGraphGenerateMipMapsTask ${this.name}: destinationTexture is required`);
        }

        const outputTextureHandle = frameGraph.getTextureHandle(this.destinationTexture);
        const outputTextureDescription = frameGraph.getTextureDescription(this.destinationTexture);

        if (!outputTextureDescription.options.createMipMaps) {
            throw new Error(`FrameGraphGenerateMipMapsTask ${this.name}: destinationTexture must have createMipMaps set to true`);
        }

        const pass = frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(outputTextureHandle);
        pass.setExecuteFunc((context) => {
            context.generateMipMaps();
        });

        const passDisabled = frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(outputTextureHandle);
        passDisabled.setExecuteFunc((_context) => {});
    }

    public dispose(): void {}
}
