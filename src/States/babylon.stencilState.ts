module BABYLON.Internals {
    export class _StencilState {
        private _isStencilTestDirty = false;
        private _isStencilMaskDirty = false;
        private _isStencilFuncDirty = false;
        private _isStencilOpDirty = false;

        private _stencilTest: boolean;

        private _stencilMask: number;

        private _stencilFunc: number;
        private _stencilFuncRef: number;
        private _stencilFuncMask: number;

        private _stencilOpStencilFail: number;
        private _stencilOpDepthFail: number;
        private _stencilOpStencilDepthPass: number;

        public get isDirty(): boolean {
            return this._isStencilTestDirty || this._isStencilMaskDirty || this._isStencilFuncDirty;
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
        }

        public reset() {
            this._stencilMask = 0xFF;
            this._stencilTest = false;

            this._stencilFunc = null;
            this._stencilFuncRef = 1;
            this._stencilFuncMask = 0xFF;

            this._stencilOpStencilFail = 0x1E00; // KEEP
            this._stencilOpDepthFail = 0x1E00; // KEEP
            this._stencilOpStencilDepthPass = 0x1E01; // REPLACE

            this._isStencilTestDirty = true;
            this._isStencilMaskDirty = true;
            this._isStencilFuncDirty = false;
            this._isStencilOpDirty = false;
        }

        public apply(gl: WebGLRenderingContext) {
            if (!this.isDirty) {
                return;
            }

            // Stencil test
            if (this._isStencilTestDirty) {
                if (this.stencilTest) {
                    gl.enable(gl.STENCIL_TEST);
                } else {
                    gl.disable(gl.STENCIL_TEST);
                }
                this._isStencilTestDirty = false;
            }

            // Stencil mask
            if (this._isStencilMaskDirty) {
                gl.stencilMask(this.stencilMask);
                this._isStencilMaskDirty = false;
            }

            // Stencil func
            if (this._isStencilFuncDirty) {
                gl.stencilFunc(this.stencilFunc, this.stencilFuncRef, this.stencilFuncMask);
                this._isStencilFuncDirty = false;
            }

            // Stencil op
            if (this._isStencilOpDirty) {
                gl.stencilOp(this.stencilOpStencilFail, this.stencilOpDepthFail, this.stencilOpStencilDepthPass);
                this._isStencilOpDirty = false;
            }
        }
    }
}