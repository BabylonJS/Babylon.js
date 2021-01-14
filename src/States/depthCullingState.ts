import { Nullable } from "../types";

/**
 * @hidden
 **/
export class DepthCullingState {
    protected _isDepthTestDirty = false;
    protected _isDepthMaskDirty = false;
    protected _isDepthFuncDirty = false;
    protected _isCullFaceDirty = false;
    protected _isCullDirty = false;
    protected _isZOffsetDirty = false;
    protected _isFrontFaceDirty = false;

    protected _depthTest: boolean;
    protected _depthMask: boolean;
    protected _depthFunc: Nullable<number>;
    protected _cull: Nullable<boolean>;
    protected _cullFace: Nullable<number>;
    protected _zOffset: number;
    protected _frontFace: Nullable<number>;

    /**
     * Initializes the state.
     */
    public constructor(reset = true) {
        if (reset) {
            this.reset();
        }
    }

    public get isDirty(): boolean {
        return this._isDepthFuncDirty || this._isDepthTestDirty || this._isDepthMaskDirty || this._isCullFaceDirty || this._isCullDirty || this._isZOffsetDirty || this._isFrontFaceDirty;
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
    }

    public reset() {
        this._depthMask = true;
        this._depthTest = true;
        this._depthFunc = null;
        this._cullFace = null;
        this._cull = null;
        this._zOffset = 0;
        this._frontFace = null;

        this._isDepthTestDirty = true;
        this._isDepthMaskDirty = true;
        this._isDepthFuncDirty = false;
        this._isCullFaceDirty = false;
        this._isCullDirty = false;
        this._isZOffsetDirty = true;
        this._isFrontFaceDirty = false;
    }

    public apply(gl: WebGLRenderingContext) {

        if (!this.isDirty) {
            return;
        }

        // Cull
        if (this._isCullDirty) {
            if (this.cull) {
                gl.enable(gl.CULL_FACE);
            } else {
                gl.disable(gl.CULL_FACE);
            }

            this._isCullDirty = false;
        }

        // Cull face
        if (this._isCullFaceDirty) {
            gl.cullFace(<number>this.cullFace);
            this._isCullFaceDirty = false;
        }

        // Depth mask
        if (this._isDepthMaskDirty) {
            gl.depthMask(this.depthMask);
            this._isDepthMaskDirty = false;
        }

        // Depth test
        if (this._isDepthTestDirty) {
            if (this.depthTest) {
                gl.enable(gl.DEPTH_TEST);
            } else {
                gl.disable(gl.DEPTH_TEST);
            }
            this._isDepthTestDirty = false;
        }

        // Depth func
        if (this._isDepthFuncDirty) {
            gl.depthFunc(<number>this.depthFunc);
            this._isDepthFuncDirty = false;
        }

        // zOffset
        if (this._isZOffsetDirty) {
            if (this.zOffset) {
                gl.enable(gl.POLYGON_OFFSET_FILL);
                gl.polygonOffset(this.zOffset, 0);
            } else {
                gl.disable(gl.POLYGON_OFFSET_FILL);
            }

            this._isZOffsetDirty = false;
        }

        // Front face
        if (this._isFrontFaceDirty) {
            gl.frontFace(<number>this.frontFace);
            this._isFrontFaceDirty = false;
        }
    }
}
