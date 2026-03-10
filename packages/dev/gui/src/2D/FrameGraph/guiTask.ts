import type { FrameGraphTextureHandle, FrameGraph } from "core/index";
import { AdvancedDynamicTexture } from "../advancedDynamicTexture";
import { FrameGraphTask } from "core/FrameGraph/frameGraphTask";

/**
 * Task that renders a GUI texture.
 */
export class FrameGraphGUITask extends FrameGraphTask {
    /**
     * The target texture to render the GUI to.
     */
    public targetTexture: FrameGraphTextureHandle;

    /**
     * The output texture of the task.
     * This is the same texture as the target texture, but the handles are different!
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    public override get disabled() {
        return this._disabled;
    }

    public override set disabled(value: boolean) {
        this._disabled = value;
        this._adt.disablePicking = value;
    }

    /**
     * Gets the underlying advanced dynamic texture.
     */
    public get gui() {
        return this._adt;
    }

    protected _adt: AdvancedDynamicTexture;

    /**
     * Constructs a new GUI task.
     * @param name Name of the task
     * @param frameGraph Frame graph the task belongs to
     * @param adt The GUI texture. If not provided, a new fullscreen GUI will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, adt?: AdvancedDynamicTexture) {
        super(name, frameGraph);

        if (adt) {
            if (!adt.useStandalone) {
                throw new Error(`AdvancedDynamicTexture "${name}": the texture must have been created with the useStandalone property set to true`);
            }
        } else {
            adt = AdvancedDynamicTexture.CreateFullscreenUI(name, undefined, { useStandalone: true, scene: frameGraph.scene });
        }
        this._adt = adt;

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public override isReady() {
        return this._adt.guiIsReady() && this._adt._layerToDispose!.isReady();
    }

    public override getClassName(): string {
        return "FrameGraphGUITask";
    }

    public record(): void {
        if (this.targetTexture === undefined) {
            throw new Error("FrameGraphGUITask: targetTexture is required");
        }

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.targetTexture);

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
