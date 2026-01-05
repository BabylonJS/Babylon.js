import type { WebGPUCacheRenderPipeline } from "./webgpuCacheRenderPipeline";
import { StencilStateComposer } from "../../States/stencilStateComposer";

/**
 * @internal
 **/
export class WebGPUStencilStateComposer extends StencilStateComposer {
    private _cache: WebGPUCacheRenderPipeline;

    public constructor(cache: WebGPUCacheRenderPipeline) {
        super(false);
        this._cache = cache;
        this.reset();
    }

    public override get func(): number {
        return this._func;
    }

    public override set func(value: number) {
        if (this._func === value) {
            return;
        }

        this._func = value;
        this._cache.setStencilCompare(value);
    }

    public override get backFunc(): number {
        return this._backFunc;
    }

    public override set backFunc(value: number) {
        if (this._backFunc === value) {
            return;
        }

        this._backFunc = value;
        this._cache.setStencilBackCompare(value);
    }

    public override get funcMask(): number {
        return this._funcMask;
    }

    public override set funcMask(value: number) {
        if (this._funcMask === value) {
            return;
        }

        this._funcMask = value;
        this._cache.setStencilReadMask(value);
    }

    public override get opStencilFail(): number {
        return this._opStencilFail;
    }

    public override set opStencilFail(value: number) {
        if (this._opStencilFail === value) {
            return;
        }

        this._opStencilFail = value;
        this._cache.setStencilFailOp(value);
    }

    public override get opDepthFail(): number {
        return this._opDepthFail;
    }

    public override set opDepthFail(value: number) {
        if (this._opDepthFail === value) {
            return;
        }

        this._opDepthFail = value;
        this._cache.setStencilDepthFailOp(value);
    }

    public override get opStencilDepthPass(): number {
        return this._opStencilDepthPass;
    }

    public override set opStencilDepthPass(value: number) {
        if (this._opStencilDepthPass === value) {
            return;
        }

        this._opStencilDepthPass = value;
        this._cache.setStencilPassOp(value);
    }

    public override get backOpStencilFail(): number {
        return this._backOpStencilFail;
    }

    public override set backOpStencilFail(value: number) {
        if (this._backOpStencilFail === value) {
            return;
        }

        this._backOpStencilFail = value;
        this._cache.setStencilBackFailOp(value);
    }

    public override get backOpDepthFail(): number {
        return this._backOpDepthFail;
    }

    public override set backOpDepthFail(value: number) {
        if (this._backOpDepthFail === value) {
            return;
        }

        this._backOpDepthFail = value;
        this._cache.setStencilBackDepthFailOp(value);
    }

    public override get backOpStencilDepthPass(): number {
        return this._backOpStencilDepthPass;
    }

    public override set backOpStencilDepthPass(value: number) {
        if (this._backOpStencilDepthPass === value) {
            return;
        }

        this._backOpStencilDepthPass = value;
        this._cache.setStencilBackPassOp(value);
    }

    public override get mask(): number {
        return this._mask;
    }

    public override set mask(value: number) {
        if (this._mask === value) {
            return;
        }

        this._mask = value;
        this._cache.setStencilWriteMask(value);
    }

    public override get enabled(): boolean {
        return this._enabled;
    }

    public override set enabled(value: boolean) {
        if (this._enabled === value) {
            return;
        }

        this._enabled = value;
        this._cache.setStencilEnabled(value);
    }

    public override reset() {
        super.reset();
        this._cache.resetStencilState();
    }

    public override apply() {
        const stencilMaterialEnabled = !this.useStencilGlobalOnly && !!this.stencilMaterial?.enabled;

        this.enabled = stencilMaterialEnabled ? this.stencilMaterial!.enabled : this.stencilGlobal.enabled;
        if (!this.enabled) {
            return;
        }

        this.mask = stencilMaterialEnabled ? this.stencilMaterial!.mask : this.stencilGlobal.mask;
        this.funcRef = stencilMaterialEnabled ? this.stencilMaterial!.funcRef : this.stencilGlobal.funcRef;
        this.funcMask = stencilMaterialEnabled ? this.stencilMaterial!.funcMask : this.stencilGlobal.funcMask;
        this.func = stencilMaterialEnabled ? this.stencilMaterial!.func : this.stencilGlobal.func;
        this.opStencilFail = stencilMaterialEnabled ? this.stencilMaterial!.opStencilFail : this.stencilGlobal.opStencilFail;
        this.opDepthFail = stencilMaterialEnabled ? this.stencilMaterial!.opDepthFail : this.stencilGlobal.opDepthFail;
        this.opStencilDepthPass = stencilMaterialEnabled ? this.stencilMaterial!.opStencilDepthPass : this.stencilGlobal.opStencilDepthPass;
        this.backFunc = stencilMaterialEnabled ? this.stencilMaterial!.backFunc : this.stencilGlobal.backFunc;
        this.backOpStencilFail = stencilMaterialEnabled ? this.stencilMaterial!.backOpStencilFail : this.stencilGlobal.backOpStencilFail;
        this.backOpDepthFail = stencilMaterialEnabled ? this.stencilMaterial!.backOpDepthFail : this.stencilGlobal.backOpDepthFail;
        this.backOpStencilDepthPass = stencilMaterialEnabled ? this.stencilMaterial!.backOpStencilDepthPass : this.stencilGlobal.backOpStencilDepthPass;
    }
}
