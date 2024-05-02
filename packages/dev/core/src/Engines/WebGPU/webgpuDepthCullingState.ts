import type { Nullable } from "../../types";
import type { WebGPUCacheRenderPipeline } from "./webgpuCacheRenderPipeline";
import { DepthCullingState } from "../../States/depthCullingState";

/**
 * @internal
 **/
export class WebGPUDepthCullingState extends DepthCullingState {
    private _cache: WebGPUCacheRenderPipeline;

    /**
     * Initializes the state.
     * @param cache
     */
    public constructor(cache: WebGPUCacheRenderPipeline) {
        super(false);
        this._cache = cache;
        this.reset();
    }

    public override get zOffset(): number {
        return this._zOffset;
    }

    public override set zOffset(value: number) {
        if (this._zOffset === value) {
            return;
        }

        this._zOffset = value;
        this._isZOffsetDirty = true;
        this._cache.setDepthBiasSlopeScale(value);
    }

    public override get zOffsetUnits(): number {
        return this._zOffsetUnits;
    }

    public override set zOffsetUnits(value: number) {
        if (this._zOffsetUnits === value) {
            return;
        }

        this._zOffsetUnits = value;
        this._isZOffsetDirty = true;
        this._cache.setDepthBias(value);
    }

    public override get cullFace(): Nullable<number> {
        return this._cullFace;
    }

    public override set cullFace(value: Nullable<number>) {
        if (this._cullFace === value) {
            return;
        }

        this._cullFace = value;
        this._isCullFaceDirty = true;
        this._cache.setCullFace(value ?? 1);
    }

    public override get cull(): Nullable<boolean> {
        return this._cull;
    }

    public override set cull(value: Nullable<boolean>) {
        if (this._cull === value) {
            return;
        }

        this._cull = value;
        this._isCullDirty = true;
        this._cache.setCullEnabled(!!value);
    }

    public override get depthFunc(): Nullable<number> {
        return this._depthFunc;
    }

    public override set depthFunc(value: Nullable<number>) {
        if (this._depthFunc === value) {
            return;
        }

        this._depthFunc = value;
        this._isDepthFuncDirty = true;
        this._cache.setDepthCompare(value);
    }

    public override get depthMask(): boolean {
        return this._depthMask;
    }

    public override set depthMask(value: boolean) {
        if (this._depthMask === value) {
            return;
        }

        this._depthMask = value;
        this._isDepthMaskDirty = true;
        this._cache.setDepthWriteEnabled(value);
    }

    public override get depthTest(): boolean {
        return this._depthTest;
    }

    public override set depthTest(value: boolean) {
        if (this._depthTest === value) {
            return;
        }

        this._depthTest = value;
        this._isDepthTestDirty = true;
        this._cache.setDepthTestEnabled(value);
    }

    public override get frontFace(): Nullable<number> {
        return this._frontFace;
    }

    public override set frontFace(value: Nullable<number>) {
        if (this._frontFace === value) {
            return;
        }

        this._frontFace = value;
        this._isFrontFaceDirty = true;
        this._cache.setFrontFace(value ?? 2);
    }

    public override reset() {
        super.reset();
        this._cache.resetDepthCullingState();
    }

    public override apply() {
        // nothing to do
    }
}
