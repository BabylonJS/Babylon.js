import { WebGPUCacheRenderPipeline } from "./webgpuCacheRenderPipeline";
import { StencilState } from "../../States/stencilState";

/**
 * @hidden
 **/
export class WebGPUStencilState extends StencilState {

    private _cache: WebGPUCacheRenderPipeline;

    public constructor(cache: WebGPUCacheRenderPipeline) {
        super(false);
        this._cache = cache;
        this.reset();
    }

    public get stencilFunc(): number {
        return this._stencilFunc;
    }

    public set stencilFunc(value: number) {
        if (this._stencilFunc === value) {
            return;
        }

        this._stencilFunc = value;
        this._isStencilFuncDirty = true;
        this._cache.setStencilCompare(value);
    }

    public get stencilFuncRef(): number {
        return this._stencilFuncRef;
    }

    public set stencilFuncRef(value: number) {
        if (this._stencilFuncRef === value) {
            return;
        }

        this._stencilFuncRef = value;
        this._isStencilFuncDirty = true;
    }

    public get stencilFuncMask(): number {
        return this._stencilFuncMask;
    }

    public set stencilFuncMask(value: number) {
        if (this._stencilFuncMask === value) {
            return;
        }

        this._stencilFuncMask = value;
        this._isStencilFuncDirty = true;
        this._cache.setStencilReadMask(value);
    }

    public get stencilOpStencilFail(): number {
        return this._stencilOpStencilFail;
    }

    public set stencilOpStencilFail(value: number) {
        if (this._stencilOpStencilFail === value) {
            return;
        }

        this._stencilOpStencilFail = value;
        this._isStencilOpDirty = true;
        this._cache.setStencilFailOp(value);
    }

    public get stencilOpDepthFail(): number {
        return this._stencilOpDepthFail;
    }

    public set stencilOpDepthFail(value: number) {
        if (this._stencilOpDepthFail === value) {
            return;
        }

        this._stencilOpDepthFail = value;
        this._isStencilOpDirty = true;
        this._cache.setStencilDepthFailOp(value);
    }

    public get stencilOpStencilDepthPass(): number {
        return this._stencilOpStencilDepthPass;
    }

    public set stencilOpStencilDepthPass(value: number) {
        if (this._stencilOpStencilDepthPass === value) {
            return;
        }

        this._stencilOpStencilDepthPass = value;
        this._isStencilOpDirty = true;
        this._cache.setStencilPassOp(value);
    }

    public get stencilMask(): number {
        return this._stencilMask;
    }

    public set stencilMask(value: number) {
        if (this._stencilMask === value) {
            return;
        }

        this._stencilMask = value;
        this._isStencilMaskDirty = true;
        this._cache.setStencilWriteMask(value);
    }

    public get stencilTest(): boolean {
        return this._stencilTest;
    }

    public set stencilTest(value: boolean) {
        if (this._stencilTest === value) {
            return;
        }

        this._stencilTest = value;
        this._isStencilTestDirty = true;
        this._cache.setStencilEnabled(value);
    }

    public reset() {
        super.reset();
        this._cache.resetStencilState();
    }

    public apply(gl: WebGLRenderingContext) {
        // nothing to do
    }
}
