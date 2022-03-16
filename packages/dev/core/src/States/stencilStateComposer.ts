import { IStencilState } from "./IStencilState";

/**
 * @hidden
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
        this.funcRef = stencilMaterialEnabled ? this.stencilMaterial!.funcRef : this.stencilGlobal.funcRef;
        this.funcMask = stencilMaterialEnabled ? this.stencilMaterial!.funcMask : this.stencilGlobal.funcMask;
        this.opStencilFail = stencilMaterialEnabled ? this.stencilMaterial!.opStencilFail : this.stencilGlobal.opStencilFail;
        this.opDepthFail = stencilMaterialEnabled ? this.stencilMaterial!.opDepthFail : this.stencilGlobal.opDepthFail;
        this.opStencilDepthPass = stencilMaterialEnabled ? this.stencilMaterial!.opStencilDepthPass : this.stencilGlobal.opStencilDepthPass;
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
            gl.stencilFunc(this.func, this.funcRef, this.funcMask);
            this._isStencilFuncDirty = false;
        }

        // Stencil op
        if (this._isStencilOpDirty) {
            gl.stencilOp(this.opStencilFail, this.opDepthFail, this.opStencilDepthPass);
            this._isStencilOpDirty = false;
        }
    }
}
