// eslint-disable-next-line import/no-internal-modules
import type { Nullable, FrameGraphRenderContext, AbstractEngine, IFrameGraphPass, FrameGraphTextureHandle, FrameGraphTask, FrameGraphRenderTarget } from "core/index";
import { FrameGraphPass } from "./pass";

/**
 * Render pass used to render objects.
 */
export class FrameGraphRenderPass extends FrameGraphPass<FrameGraphRenderContext> {
    protected readonly _engine: AbstractEngine;
    protected _renderTarget: FrameGraphTextureHandle | FrameGraphTextureHandle[] | undefined;
    protected _renderTargetDepth: FrameGraphTextureHandle | undefined;
    protected readonly _usedTextures: FrameGraphTextureHandle[] = [];
    protected _frameGraphRenderTarget: FrameGraphRenderTarget | undefined;

    /**
     * Checks if a pass is a render pass.
     * @param pass The pass to check.
     * @returns True if the pass is a render pass, else false.
     */
    public static IsRenderPass(pass: IFrameGraphPass): pass is FrameGraphRenderPass {
        return (pass as FrameGraphRenderPass).setRenderTarget !== undefined;
    }

    /**
     * Gets the render target(s) used by the render pass.
     */
    public get renderTarget(): FrameGraphTextureHandle | FrameGraphTextureHandle[] | undefined {
        return this._renderTarget;
    }

    /**
     * Gets the render target depth used by the render pass.
     */
    public get renderTargetDepth(): FrameGraphTextureHandle | undefined {
        return this._renderTargetDepth;
    }

    /** @internal */
    constructor(name: string, parentTask: FrameGraphTask, context: FrameGraphRenderContext, engine: AbstractEngine) {
        super(name, parentTask, context);
        this._engine = engine;
    }

    /**
     * Indicates that the pass will use the given texture.
     * Use this method to indicate that the pass will use a texture so that the frame graph can handle the texture's lifecycle.
     * You don't have to call this method for the render target / render target depth textures.
     * @param texture The texture used.
     */
    public useTexture(texture: FrameGraphTextureHandle) {
        this._usedTextures.push(texture);
    }

    /**
     * Sets the render target(s) to use for rendering.
     * @param renderTargetHandle The render target to use for rendering, or an array of render targets to use for multi render target rendering.
     */
    public setRenderTarget(renderTargetHandle?: FrameGraphTextureHandle | FrameGraphTextureHandle[]) {
        this._renderTarget = renderTargetHandle;
    }

    /**
     * Sets the render target depth to use for rendering.
     * @param renderTargetHandle The render target depth to use for rendering.
     */
    public setRenderTargetDepth(renderTargetHandle?: FrameGraphTextureHandle) {
        this._renderTargetDepth = renderTargetHandle;
    }

    /** @internal */
    public override _execute() {
        this._frameGraphRenderTarget = this._frameGraphRenderTarget || this._context.createRenderTarget(this.name, this._renderTarget, this._renderTargetDepth);

        this._context.bindRenderTarget(this._frameGraphRenderTarget, `frame graph render pass - ${this.name}`);

        super._execute();

        this._context._flushDebugMessages();
    }

    /** @internal */
    public override _isValid(): Nullable<string> {
        const errMsg = super._isValid();
        return errMsg
            ? errMsg
            : this._renderTarget !== undefined || this.renderTargetDepth !== undefined
              ? null
              : "Render target and render target depth cannot both be undefined.";
    }
}
