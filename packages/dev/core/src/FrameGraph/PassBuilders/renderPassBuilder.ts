import type { TextureHandle } from "../textureHandle";
import type { FrameGraphRenderContext } from "../frameGraphRenderContext";
import { FrameGraphPassBuilder } from "./passBuilder";

export class FrameGraphRenderPassBuilder extends FrameGraphPassBuilder<FrameGraphRenderContext> {
    protected _renderTarget: TextureHandle;

    constructor(name: string, context: FrameGraphRenderContext) {
        super(name, context);
    }

    public setRenderTarget(renderTargetHandle: TextureHandle) {
        this._renderTarget = renderTargetHandle;
    }

    /** @internal */
    public override _execute() {
        this._context.bindRenderTarget(this._renderTarget);
        super._execute();
    }

    /** @internal */
    public override _isValid(): boolean {
        return super._isValid() && this._renderTarget !== undefined;
    }
}
