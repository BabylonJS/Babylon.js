import type { FrameGraphTextureHandle } from "core/FrameGraph/frameGraphTypes";
import type { AdvancedDynamicTexture } from "../advancedDynamicTexture";
import type { FrameGraph } from "core/FrameGraph/frameGraph";
import { FrameGraphTask } from "core/FrameGraph/frameGraphTask";

export class FrameGraphGUITask extends FrameGraphTask {
    public destinationTexture: FrameGraphTextureHandle;

    public readonly outputTexture: FrameGraphTextureHandle;

    public override get disabled() {
        return this._disabled;
    }

    public override set disabled(value: boolean) {
        this._disabled = value;
        this._adt.disablePicking = value;
    }

    public get gui() {
        return this._adt;
    }

    protected _adt: AdvancedDynamicTexture;

    constructor(name: string, frameGraph: FrameGraph, adt: AdvancedDynamicTexture) {
        super(name, frameGraph);

        if (!adt.useStandalone) {
            throw new Error(`AdvancedDynamicTexture "${name}": the texture must have been created with the useStandalone property set to true`);
        }
        this._adt = adt;

        this.outputTexture = this._frameGraph.createDanglingHandle();
    }

    public override isReady() {
        return this._adt.guiIsReady() && this._adt._layerToDispose!.isReady();
    }

    public record(): void {
        if (this.destinationTexture === undefined) {
            throw new Error("FrameGraphGUITask: destinationTexture is required");
        }

        this._frameGraph.resolveDanglingHandle(this.outputTexture, this.destinationTexture);

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            this._adt._checkUpdate(null);
            context.render(this._adt._layerToDispose!);
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((_context) => {});
    }

    public override dispose(): void {
        this._adt.dispose();
        super.dispose();
    }
}
