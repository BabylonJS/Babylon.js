import { WebGPUCacheRenderPipeline } from "./webgpuCacheRenderPipeline";
import { StencilStateComposer } from "../../States/stencilStateComposer";

/**
 * @hidden
 **/
export class WebGPUStencilStateComposer extends StencilStateComposer {

    private _cache: WebGPUCacheRenderPipeline;

    public constructor(cache: WebGPUCacheRenderPipeline) {
        super(false);
        this._cache = cache;
        this.reset();
    }

    public get func(): number {
        return this._func;
    }

    public set func(value: number) {
        if (this._func === value) {
            return;
        }

        this._func = value;
        this._cache.setStencilCompare(value);
    }

    public get funcMask(): number {
        return this._funcMask;
    }

    public set funcMask(value: number) {
        if (this._funcMask === value) {
            return;
        }

        this._funcMask = value;
        this._cache.setStencilReadMask(value);
    }

    public get opStencilFail(): number {
        return this._opStencilFail;
    }

    public set opStencilFail(value: number) {
        if (this._opStencilFail === value) {
            return;
        }

        this._opStencilFail = value;
        this._cache.setStencilFailOp(value);
    }

    public get opDepthFail(): number {
        return this._opDepthFail;
    }

    public set opDepthFail(value: number) {
        if (this._opDepthFail === value) {
            return;
        }

        this._opDepthFail = value;
        this._cache.setStencilDepthFailOp(value);
    }

    public get opStencilDepthPass(): number {
        return this._opStencilDepthPass;
    }

    public set opStencilDepthPass(value: number) {
        if (this._opStencilDepthPass === value) {
            return;
        }

        this._opStencilDepthPass = value;
        this._cache.setStencilPassOp(value);
    }

    public get mask(): number {
        return this._mask;
    }

    public set mask(value: number) {
        if (this._mask === value) {
            return;
        }

        this._mask = value;
        this._cache.setStencilWriteMask(value);
    }

    public get enabled(): boolean {
        return this._enabled;
    }

    public set enabled(value: boolean) {
        if (this._enabled === value) {
            return;
        }

        this._enabled = value;
        this._cache.setStencilEnabled(value);
    }

    public reset() {
        super.reset();
        this._cache.resetStencilState();
    }

    public apply(gl?: WebGLRenderingContext) {
        const stencilMaterialEnabled = this.stencilMaterial?.enabled;

        this.enabled = stencilMaterialEnabled ? this.stencilMaterial!.enabled : this.stencilGlobal.enabled;
        if (!this.enabled) {
            return;
        }

        this.func = stencilMaterialEnabled ? this.stencilMaterial!.func : this.stencilGlobal.func;
        this.funcRef = stencilMaterialEnabled ? this.stencilMaterial!.funcRef : this.stencilGlobal.funcRef;
        this.funcMask = stencilMaterialEnabled ? this.stencilMaterial!.funcMask : this.stencilGlobal.funcMask;
        this.opStencilFail = stencilMaterialEnabled ? this.stencilMaterial!.opStencilFail : this.stencilGlobal.opStencilFail;
        this.opDepthFail = stencilMaterialEnabled ? this.stencilMaterial!.opDepthFail : this.stencilGlobal.opDepthFail;
        this.opStencilDepthPass = stencilMaterialEnabled ? this.stencilMaterial!.opStencilDepthPass : this.stencilGlobal.opStencilDepthPass;
        this.mask = stencilMaterialEnabled ? this.stencilMaterial!.mask : this.stencilGlobal.mask;
    }
}
