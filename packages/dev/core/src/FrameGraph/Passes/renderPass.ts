import type { Nullable } from "../../types";
import type { FrameGraphRenderContext } from "../frameGraphRenderContext";
import { FrameGraphPass } from "./pass";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import type { IFrameGraphPass, IFrameGraphTask, FrameGraphTextureHandle } from "../frameGraphTypes";

export class FrameGraphRenderPass extends FrameGraphPass<FrameGraphRenderContext> {
    protected _engine: AbstractEngine;
    protected _renderTarget: FrameGraphTextureHandle;
    protected _renderTargetDepth: FrameGraphTextureHandle | undefined;
    protected _usedTextures: FrameGraphTextureHandle[] = [];
    protected _outputTextures: { handle: FrameGraphTextureHandle; index: number; name: string }[] = [];
    protected _depthShared = false;

    public static IsRenderPass(pass: IFrameGraphPass): pass is FrameGraphRenderPass {
        return (pass as FrameGraphRenderPass).setRenderTarget !== undefined;
    }

    /** @internal */
    public get renderTarget(): FrameGraphTextureHandle {
        return this._renderTarget;
    }

    /** @internal */
    public get renderTargetDepth(): FrameGraphTextureHandle | undefined {
        return this._renderTargetDepth;
    }

    /** @internal */
    public get outputTextures() {
        return this._outputTextures;
    }

    /** @internal */
    constructor(name: string, parentTask: IFrameGraphTask, context: FrameGraphRenderContext, engine: AbstractEngine) {
        super(name, parentTask, context);
        this._engine = engine;
    }

    public useTexture(texture: FrameGraphTextureHandle) {
        this._usedTextures.push(texture);
    }

    public setRenderTarget(renderTargetHandle: FrameGraphTextureHandle) {
        this._renderTarget = renderTargetHandle;
    }

    public setOutputTexture(renderTargetHandle: FrameGraphTextureHandle, index: number, name: string) {
        this._outputTextures.push({ handle: renderTargetHandle, index, name });
    }

    public setRenderTargetDepth(renderTargetHandle?: FrameGraphTextureHandle) {
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

        this._context._flushDebugMessages();
    }

    /** @internal */
    public override _isValid(): Nullable<string> {
        const errMsg = super._isValid();
        return errMsg ? errMsg : this._renderTarget !== undefined ? null : "Render target is not set (call setRenderTarget to set it)";
    }
}
