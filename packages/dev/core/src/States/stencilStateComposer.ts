import type { IStencilState } from "./IStencilState";

/**
 * @internal
 **/
export class StencilStateComposer {
    protected _isStencilTestDirty = false;
    protected _isStencilMaskDirty = false;
    protected _isStencilFuncDirty = false;
    protected _isStencilOpDirty = false;

    protected _enabled: boolean;

    protected _mask: number;

    protected _func: number;
    protected _funcRef: number;
    protected _funcMask: number;

    protected _opStencilFail: number;
    protected _opDepthFail: number;
    protected _opStencilDepthPass: number;

    protected _backFunc: number;
    protected _backOpStencilFail: number;
    protected _backOpDepthFail: number;
    protected _backOpStencilDepthPass: number;

    public stencilGlobal: IStencilState;
    public stencilMaterial: IStencilState | undefined;

    public useStencilGlobalOnly = false;

    public get isDirty(): boolean {
        return this._isStencilTestDirty || this._isStencilMaskDirty || this._isStencilFuncDirty || this._isStencilOpDirty;
    }

    public get func(): number {
        return this._func;
    }

    public set func(value: number) {
        if (this._func === value) {
            return;
        }

        this._func = value;
        this._isStencilFuncDirty = true;
    }

    public get backFunc(): number {
        return this._func;
    }

    public set backFunc(value: number) {
        if (this._backFunc === value) {
            return;
        }

        this._backFunc = value;
        this._isStencilFuncDirty = true;
    }

    public get funcRef(): number {
        return this._funcRef;
    }

    public set funcRef(value: number) {
        if (this._funcRef === value) {
            return;
        }

        this._funcRef = value;
        this._isStencilFuncDirty = true;
    }

    public get funcMask(): number {
        return this._funcMask;
    }

    public set funcMask(value: number) {
        if (this._funcMask === value) {
            return;
        }

        this._funcMask = value;
        this._isStencilFuncDirty = true;
    }

    public get opStencilFail(): number {
        return this._opStencilFail;
    }

    public set opStencilFail(value: number) {
        if (this._opStencilFail === value) {
            return;
        }

        this._opStencilFail = value;
        this._isStencilOpDirty = true;
    }

    public get opDepthFail(): number {
        return this._opDepthFail;
    }

    public set opDepthFail(value: number) {
        if (this._opDepthFail === value) {
            return;
        }

        this._opDepthFail = value;
        this._isStencilOpDirty = true;
    }

    public get opStencilDepthPass(): number {
        return this._opStencilDepthPass;
    }

    public set opStencilDepthPass(value: number) {
        if (this._opStencilDepthPass === value) {
            return;
        }

        this._opStencilDepthPass = value;
        this._isStencilOpDirty = true;
    }

    public get backOpStencilFail(): number {
        return this._backOpStencilFail;
    }

    public set backOpStencilFail(value: number) {
        if (this._backOpStencilFail === value) {
            return;
        }

        this._backOpStencilFail = value;
        this._isStencilOpDirty = true;
    }

    public get backOpDepthFail(): number {
        return this._backOpDepthFail;
    }

    public set backOpDepthFail(value: number) {
        if (this._backOpDepthFail === value) {
            return;
        }

        this._backOpDepthFail = value;
        this._isStencilOpDirty = true;
    }

    public get backOpStencilDepthPass(): number {
        return this._backOpStencilDepthPass;
    }

    public set backOpStencilDepthPass(value: number) {
        if (this._backOpStencilDepthPass === value) {
            return;
        }

        this._backOpStencilDepthPass = value;
        this._isStencilOpDirty = true;
    }

    public get mask(): number {
        return this._mask;
    }

    public set mask(value: number) {
        if (this._mask === value) {
            return;
        }

        this._mask = value;
        this._isStencilMaskDirty = true;
    }

    public get enabled(): boolean {
        return this._enabled;
    }

    public set enabled(value: boolean) {
        if (this._enabled === value) {
            return;
        }

        this._enabled = value;
        this._isStencilTestDirty = true;
    }

    public constructor(reset = true) {
        if (reset) {
            this.reset();
        }
    }

    public reset() {
        this.stencilMaterial = undefined;

        this.stencilGlobal?.reset();

        this._isStencilTestDirty = true;
        this._isStencilMaskDirty = true;
        this._isStencilFuncDirty = true;
        this._isStencilOpDirty = true;
    }

    public apply(gl?: WebGLRenderingContext) {
        if (!gl) {
            return;
        }

        const stencilMaterialEnabled = !this.useStencilGlobalOnly && !!this.stencilMaterial?.enabled;

        this.enabled = stencilMaterialEnabled ? this.stencilMaterial!.enabled : this.stencilGlobal.enabled;
        this.func = stencilMaterialEnabled ? this.stencilMaterial!.func : this.stencilGlobal.func;
        this.backFunc = stencilMaterialEnabled ? this.stencilMaterial!.backFunc : this.stencilGlobal.backFunc;
        this.funcRef = stencilMaterialEnabled ? this.stencilMaterial!.funcRef : this.stencilGlobal.funcRef;
        this.funcMask = stencilMaterialEnabled ? this.stencilMaterial!.funcMask : this.stencilGlobal.funcMask;
        this.opStencilFail = stencilMaterialEnabled ? this.stencilMaterial!.opStencilFail : this.stencilGlobal.opStencilFail;
        this.opDepthFail = stencilMaterialEnabled ? this.stencilMaterial!.opDepthFail : this.stencilGlobal.opDepthFail;
        this.opStencilDepthPass = stencilMaterialEnabled ? this.stencilMaterial!.opStencilDepthPass : this.stencilGlobal.opStencilDepthPass;
        this.backOpStencilFail = stencilMaterialEnabled ? this.stencilMaterial!.backOpStencilFail : this.stencilGlobal.backOpStencilFail;
        this.backOpDepthFail = stencilMaterialEnabled ? this.stencilMaterial!.backOpDepthFail : this.stencilGlobal.backOpDepthFail;
        this.backOpStencilDepthPass = stencilMaterialEnabled ? this.stencilMaterial!.backOpStencilDepthPass : this.stencilGlobal.backOpStencilDepthPass;
        this.mask = stencilMaterialEnabled ? this.stencilMaterial!.mask : this.stencilGlobal.mask;

        if (!this.isDirty) {
            return;
        }

        // Stencil test
        if (this._isStencilTestDirty) {
            if (this.enabled) {
                gl.enable(gl.STENCIL_TEST);
            } else {
                gl.disable(gl.STENCIL_TEST);
            }
            this._isStencilTestDirty = false;
        }

        // Stencil mask
        if (this._isStencilMaskDirty) {
            gl.stencilMask(this.mask);
            this._isStencilMaskDirty = false;
        }

        // Stencil func
        if (this._isStencilFuncDirty) {
            gl.stencilFuncSeparate(gl.FRONT, this.func, this.funcRef, this.funcMask);
            gl.stencilFuncSeparate(gl.BACK, this.backFunc, this.funcRef, this.funcMask);
            this._isStencilFuncDirty = false;
        }

        // Stencil op
        if (this._isStencilOpDirty) {
            gl.stencilOpSeparate(gl.FRONT, this.opStencilFail, this.opDepthFail, this.opStencilDepthPass);
            gl.stencilOpSeparate(gl.BACK, this.backOpStencilFail, this.backOpDepthFail, this.backOpStencilDepthPass);
            this._isStencilOpDirty = false;
        }
    }
}
