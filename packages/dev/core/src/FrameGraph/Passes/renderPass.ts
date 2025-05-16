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
    protected _frameGraphRenderTarget: FrameGraphRenderTarget | undefined;
    protected _dependencies: Set<FrameGraphTextureHandle> = new Set();

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

    /**
     * Adds dependencies to the render pass.
     * @param dependencies The dependencies to add.
     */
    public addDependencies(dependencies?: FrameGraphTextureHandle | FrameGraphTextureHandle[]) {
        if (!dependencies) {
            return;
        }

        if (Array.isArray(dependencies)) {
            for (const dependency of dependencies) {
                this._dependencies.add(dependency);
            }
        } else {
            this._dependencies.add(dependencies);
        }
    }

    /**
     * Collects the dependencies of the render pass.
     * @param dependencies The set of dependencies to update.
     */
    public collectDependencies(dependencies: Set<FrameGraphTextureHandle>): void {
        const iterator = this._dependencies.keys();
        for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
            dependencies.add(key.value);
        }

        if (this._renderTarget) {
            if (Array.isArray(this._renderTarget)) {
                for (const handle of this._renderTarget) {
                    if (handle !== undefined) {
                        dependencies.add(handle);
                    }
                }
            } else {
                dependencies.add(this._renderTarget);
            }
        }

        if (this._renderTargetDepth) {
            dependencies.add(this._renderTargetDepth);
        }
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
