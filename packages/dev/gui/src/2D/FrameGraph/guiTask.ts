import type { FrameGraphTaskOutputReference, FrameGraphTextureId, IFrameGraphTask } from "core/FrameGraph/frameGraphTypes";
import type { AdvancedDynamicTexture } from "../advancedDynamicTexture";
import type { FrameGraph } from "core/FrameGraph/frameGraph";

export class FrameGraphGUITask implements IFrameGraphTask {
    public destinationTexture?: FrameGraphTextureId;

    public readonly outputTextureReference: FrameGraphTaskOutputReference = [this, "output"];

    public disabled = false;

    public get gui() {
        return this._adt;
    }

    protected _adt: AdvancedDynamicTexture;

    constructor(
        public name: string,
        adt: AdvancedDynamicTexture
    ) {
        if (!adt.useAsFrameGraphTask) {
            throw new Error(`AdvancedDynamicTexture "${name}": the texture must have been created with the useAsFrameGraphTask property set to true`);
        }
        this._adt = adt;
    }

    public isReadyFrameGraph() {
        return this._adt.guiIsReady() && this._adt._layerToDispose!.isReady();
    }

    public recordFrameGraph(frameGraph: FrameGraph): void {
        if (this.destinationTexture === undefined) {
            throw new Error("FrameGraphGUITask: destinationTexture is required");
        }

        const outputTextureHandle = frameGraph.getTextureHandle(this.destinationTexture);

        const pass = frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(outputTextureHandle);
        pass.setExecuteFunc((context) => {
            this._adt._checkUpdate(null);
            context.renderLayer(this._adt._layerToDispose!);
        });

        const passDisabled = frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(outputTextureHandle);
        passDisabled.setExecuteFunc((_context) => {});
    }

    public disposeFrameGraph(): void {
        this._adt.dispose();
    }
}
