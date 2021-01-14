import { Nullable } from "../../types";
import { WebGPUCacheRenderPipeline } from "./webgpuCacheRenderPipeline";
import { DepthCullingState } from "../../States/depthCullingState";

/**
 * @hidden
 **/
export class WebGPUDepthCullingState extends DepthCullingState {

    private _cache: WebGPUCacheRenderPipeline;

    /**
     * Initializes the state.
     */
    public constructor(cache: WebGPUCacheRenderPipeline) {
        super(false);
        this._cache = cache;
        this.reset();
    }

    public get zOffset(): number {
        return this._zOffset;
    }

    public set zOffset(value: number) {
        if (this._zOffset === value) {
            return;
        }

        this._zOffset = value;
        this._isZOffsetDirty = true;
        this._cache.setDepthBiasSlopeScale(value);
    }

    public get cullFace(): Nullable<number> {
        return this._cullFace;
    }

    public set cullFace(value: Nullable<number>) {
        if (this._cullFace === value) {
            return;
        }

        this._cullFace = value;
        this._isCullFaceDirty = true;
        this._cache.setCullFace(value ?? 1);
    }

    public get cull(): Nullable<boolean> {
        return this._cull;
    }

    public set cull(value: Nullable<boolean>) {
        if (this._cull === value) {
            return;
        }

        this._cull = value;
        this._isCullDirty = true;
        this._cache.setCullEnabled(!!value);
    }

    public get depthFunc(): Nullable<number> {
        return this._depthFunc;
    }

    public set depthFunc(value: Nullable<number>) {
        if (this._depthFunc === value) {
            return;
        }

        this._depthFunc = value;
        this._isDepthFuncDirty = true;
        this._cache.setDepthCompare(value);
    }

    public get depthMask(): boolean {
        return this._depthMask;
    }

    public set depthMask(value: boolean) {
        if (this._depthMask === value) {
            return;
        }

        this._depthMask = value;
        this._isDepthMaskDirty = true;
        this._cache.setDepthWriteEnabled(value);
    }

    public get depthTest(): boolean {
        return this._depthTest;
    }

    public set depthTest(value: boolean) {
        if (this._depthTest === value) {
            return;
        }

        this._depthTest = value;
        this._isDepthTestDirty = true;
        this._cache.setDepthTestEnabled(value);
    }

    public get frontFace(): Nullable<number> {
        return this._frontFace;
    }

    public set frontFace(value: Nullable<number>) {
        if (this._frontFace === value) {
            return;
        }

        this._frontFace = value;
        this._isFrontFaceDirty = true;
        this._cache.setFrontFace(value ?? 2);
    }

    public reset() {
        super.reset();
        this._cache.resetDepthCullingState();
    }

    public apply(gl: WebGLRenderingContext) {
        // nothing to do
    }
}
