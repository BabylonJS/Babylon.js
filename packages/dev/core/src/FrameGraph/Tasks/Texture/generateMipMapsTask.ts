import type { FrameGraph } from "core/FrameGraph/frameGraph";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import { FrameGraphTask } from "../../frameGraphTask";

export class FrameGraphGenerateMipMapsTask extends FrameGraphTask {
    public destinationTexture: FrameGraphTextureHandle;

    public readonly outputTexture: FrameGraphTextureHandle;

    constructor(name: string, frameGraph: FrameGraph) {
        super(name, frameGraph);

        this.outputTexture = this._frameGraph.createDanglingHandle();
    }

    public override record() {
        if (this.destinationTexture === undefined) {
            throw new Error(`FrameGraphGenerateMipMapsTask ${this.name}: destinationTexture is required`);
        }

        this._frameGraph.resolveDanglingHandle(this.outputTexture, this.destinationTexture);

        const outputTextureDescription = this._frameGraph.getTextureDescription(this.destinationTexture);

        if (!outputTextureDescription.options.createMipMaps) {
            throw new Error(`FrameGraphGenerateMipMapsTask ${this.name}: destinationTexture must have createMipMaps set to true`);
        }

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            context.generateMipMaps();
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
