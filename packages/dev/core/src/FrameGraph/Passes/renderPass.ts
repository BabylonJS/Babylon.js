import type { Nullable } from "../../types";
import type { FrameGraphRenderContext } from "../frameGraphRenderContext";
import { FrameGraphPass } from "./pass";
import type { IFrameGraphTask } from "../Tasks/IFrameGraphTask";
import type { IFrameGraphPass } from "./IFrameGraphPass";
import type { TextureHandle } from "../frameGraphTextureManager";
import type { AbstractEngine } from "../../Engines/abstractEngine";

export class FrameGraphRenderPass extends FrameGraphPass<FrameGraphRenderContext> {
    protected _engine: AbstractEngine;
    protected _renderTarget: TextureHandle;
    protected _renderTargetDepth: TextureHandle | undefined;
    protected _usedTextures: TextureHandle[] = [];
    protected _depthShared = false;

    public static IsRenderPass(pass: IFrameGraphPass): pass is FrameGraphRenderPass {
        return (pass as FrameGraphRenderPass).setRenderTarget !== undefined;
    }

    /** @internal */
    public get renderTarget(): TextureHandle {
        return this._renderTarget;
    }

    /** @internal */
    constructor(name: string, parentTask: IFrameGraphTask, context: FrameGraphRenderContext, engine: AbstractEngine) {
        super(name, parentTask, context);
        this._engine = engine;
    }

    public useTexture(texture: TextureHandle) {
        this._usedTextures.push(texture);
    }

    public setRenderTarget(renderTargetHandle: TextureHandle) {
        this._renderTarget = renderTargetHandle;
    }

    public setRenderTargetDepth(renderTargetHandle?: TextureHandle) {
        this._renderTargetDepth = renderTargetHandle;
    }

    /** @internal */
    public override _execute() {
        if (this._renderTargetDepth && !this._depthShared) {
            this._context._shareDepth(this._renderTargetDepth, this._renderTarget);
            this._depthShared = true;
        }
        this._context._bindRenderTarget(this._renderTarget, `frame graph - render pass '${this.name}'`);
        super._execute();
        this._context._unbindRenderTarget();
    }

    /** @internal */
    public override _isValid(): Nullable<string> {
        const errMsg = super._isValid();
        return errMsg ? errMsg : this._renderTarget !== undefined ? null : "Render target is not set (call setRenderTarget to set it)";
    }
}
