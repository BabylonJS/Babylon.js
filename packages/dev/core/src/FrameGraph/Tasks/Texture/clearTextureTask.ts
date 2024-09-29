import type { FrameGraph } from "core/FrameGraph/frameGraph";
import { Color4 } from "../../../Maths/math.color";
import type { FrameGraphTextureHandle } from "../../frameGraphTypes";
import { FrameGraphTask } from "../../frameGraphTask";

export class FrameGraphClearTextureTask extends FrameGraphTask {
    public color = new Color4(0.2, 0.2, 0.3, 1);

    public clearColor = true;

    public clearDepth = false;

    public clearStencil = false;

    public destinationTexture: FrameGraphTextureHandle;

    public readonly outputTexture: FrameGraphTextureHandle;

    constructor(name: string, frameGraph: FrameGraph) {
        super(name, frameGraph);

        this.outputTexture = this._frameGraph.createDanglingHandle();
    }

    public override record() {
        if (this.destinationTexture === undefined) {
            throw new Error(`FrameGraphClearTextureTask ${this.name}: destinationTexture is required`);
        }

        this._frameGraph.resolveDanglingHandle(this.outputTexture, this.destinationTexture);

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(this.destinationTexture);
        pass.setExecuteFunc((context) => {
            context.clear(this.color, !!this.clearColor, !!this.clearDepth, !!this.clearStencil);
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.destinationTexture);
        passDisabled.setExecuteFunc((_context) => {});
    }
}
