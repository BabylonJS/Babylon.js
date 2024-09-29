import type { FrameGraph } from "core/FrameGraph/frameGraph";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import { FrameGraphTask } from "../../frameGraphTask";

export class FrameGraphCopyToTextureTask extends FrameGraphTask {
    public sourceTexture: FrameGraphTextureHandle;

    public destinationTexture: FrameGraphTextureHandle;

    public readonly outputTexture: FrameGraphTextureHandle;

    constructor(name: string, frameGraph: FrameGraph) {
        super(name, frameGraph);

        this.outputTexture = this._frameGraph.createDanglingHandle();
    }

    public override record() {
        if (this.sourceTexture === undefined || this.destinationTexture === undefined) {
            throw new Error(`FrameGraphCopyToTextureTask "${this.name}": sourceTexture and destinationTexture are required`);
        }

        this._frameGraph.resolveDanglingHandle(this.outputTexture, this.destinationTexture);

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.useTexture(this.sourceTexture);
        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            context.copyTexture(this.sourceTexture);
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
