import type { Nullable } from "../../types";
import type { TextureHandle } from "../frameGraphTextureManager";
import type { FrameGraphRenderContext } from "../frameGraphRenderContext";
import { FrameGraphPassBuilder } from "./passBuilder";
import type { IFrameGraphTask } from "../Tasks/IFrameGraphTask";
import type { FrameGraphTextureManager } from "../frameGraphTextureManager";
import type { IFrameGraphPass } from "./IFrameGraphPass";

export class FrameGraphRenderPassBuilder extends FrameGraphPassBuilder<FrameGraphRenderContext> {
    protected _renderTarget: TextureHandle;
    protected _usedTextures: TextureHandle[] = [];

    public static IsRenderPassBuilder(pass: IFrameGraphPass): pass is FrameGraphRenderPassBuilder {
        return (pass as FrameGraphRenderPassBuilder).setRenderTarget !== undefined;
    }

    /** @internal */
    public get renderTarget(): TextureHandle {
        return this._renderTarget;
    }

    /** @internal */
    constructor(name: string, textureManager: FrameGraphTextureManager, parentTask: IFrameGraphTask, context: FrameGraphRenderContext) {
        super(name, textureManager, parentTask, context);
    }

    public useTexture(texture: TextureHandle) {
        this._usedTextures.push(texture);
    }
    public setRenderTarget(renderTargetHandle: TextureHandle) {
        this._renderTarget = renderTargetHandle;
    }

    /** @internal */
    public override _execute() {
        this._context._bindRenderTarget(this._renderTarget);
        super._execute();
    }

    /** @internal */
    public override _isValid(): Nullable<string> {
        const errMsg = super._isValid();
        return errMsg ? errMsg : this._renderTarget !== undefined ? null : "Render target is not set (call setRenderTarget to set it)";
    }
}
