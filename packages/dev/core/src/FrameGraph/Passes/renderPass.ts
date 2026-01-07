import type { Nullable, FrameGraphRenderContext, AbstractEngine, IFrameGraphPass, FrameGraphTextureHandle, FrameGraphTask, FrameGraphRenderTarget } from "core/index";
import { FrameGraphPass } from "./pass";

/**
 * Type used to define layer and face indices for multi-render target rendering scenarios.
 */
export type LayerAndFaceIndex = {
    /** Index of the texture to update */
    targetIndex: number;

    /** Index of the layer to set (optional - not used if the texture is not an array or a 3D texture) */
    layerIndex?: number;

    /** Index of the cube face to set (optional - not used if the texture is not a cube texture) */
    faceIndex?: number;
};

/**
 * Render pass used to render objects.
 */
export class FrameGraphRenderPass extends FrameGraphPass<FrameGraphRenderContext> {
    protected readonly _engine: AbstractEngine;
    protected _renderTarget: FrameGraphTextureHandle | FrameGraphTextureHandle[] | undefined;
    protected _renderTargetDepth: FrameGraphTextureHandle | undefined;
    protected _frameGraphRenderTarget: FrameGraphRenderTarget;
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
     * Gets the handle(s) of the render target(s) used by the render pass.
     */
    public get renderTarget(): FrameGraphTextureHandle | FrameGraphTextureHandle[] | undefined {
        return this._renderTarget;
    }

    /**
     * Gets the handle of the render target depth used by the render pass.
     */
    public get renderTargetDepth(): FrameGraphTextureHandle | undefined {
        return this._renderTargetDepth;
    }

    /**
     * Gets the frame graph render target used by the render pass.
     */
    public get frameGraphRenderTarget(): FrameGraphRenderTarget {
        return this._frameGraphRenderTarget;
    }

    /**
     * If true, the depth attachment will be read-only (may allow some optimizations in WebGPU)
     */
    public depthReadOnly = false;

    /**
     * If true, the stencil attachment will be read-only (may allow some optimizations in WebGPU)
     */
    public stencilReadOnly = false;

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
        if (dependencies === undefined) {
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

        if (this._renderTarget !== undefined) {
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

        if (this._renderTargetDepth !== undefined) {
            dependencies.add(this._renderTargetDepth);
        }
    }

    /**
     * Sets the output layer and face indices for multi-render target rendering.
     * @param indices The array of layer and face indices.
     */
    public setOutputLayerAndFaceIndices(indices: LayerAndFaceIndex[]): void {
        const renderTargetWrapper = this.frameGraphRenderTarget.renderTargetWrapper;
        if (renderTargetWrapper) {
            for (const index of indices) {
                renderTargetWrapper.setLayerAndFaceIndex(index.targetIndex, index.layerIndex, index.faceIndex);
            }
        }
    }

    /** @internal */
    public override _initialize() {
        this._frameGraphRenderTarget = this._context.createRenderTarget(this.name, this._renderTarget, this._renderTargetDepth, this.depthReadOnly, this.stencilReadOnly);
        super._initialize();
    }

    /** @internal */
    public override _execute() {
        const currentDebugMarkers = this._context.enableDebugMarkers;

        this._context.enableDebugMarkers = !this._parentTask._disableDebugMarkers;
        this._context.bindRenderTarget(this._frameGraphRenderTarget);

        super._execute();

        this._context.restoreDefaultFramebuffer();
        this._context.enableDebugMarkers = currentDebugMarkers;
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

    /** @internal */
    public override _dispose() {
        this._frameGraphRenderTarget?.dispose();
    }
}
