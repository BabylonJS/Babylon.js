module BABYLON.Internals {
    export class _AlphaState {
        private _isAlphaBlendDirty = false;
        private _isBlendFunctionParametersDirty = false;
        private _alphaBlend = false;
        private _blendFunctionParameters = new Array<number>(4);

        /**
         * Initializes the state.
         */
        public constructor() {
            this.reset();
        }

        public get isDirty(): boolean {
            return this._isAlphaBlendDirty || this._isBlendFunctionParametersDirty;
        }

        public get alphaBlend(): boolean {
            return this._alphaBlend;
        }

        public set alphaBlend(value: boolean) {
            if (this._alphaBlend === value) {
                return;
            }

            this._alphaBlend = value;
            this._isAlphaBlendDirty = true;
        }

        public setAlphaBlendFunctionParameters(value0: number, value1: number, value2: number, value3: number): void {
            if (
                this._blendFunctionParameters[0] === value0 &&
                this._blendFunctionParameters[1] === value1 &&
                this._blendFunctionParameters[2] === value2 &&
                this._blendFunctionParameters[3] === value3
            ) {
                return;
            }

            this._blendFunctionParameters[0] = value0;
            this._blendFunctionParameters[1] = value1;
            this._blendFunctionParameters[2] = value2;
            this._blendFunctionParameters[3] = value3;

            this._isBlendFunctionParametersDirty = true;
        }

        public reset() {
            this._alphaBlend = false;
            this._blendFunctionParameters[0] = null;
            this._blendFunctionParameters[1] = null;
            this._blendFunctionParameters[2] = null;
            this._blendFunctionParameters[3] = null;

            this._isAlphaBlendDirty = true;
            this._isBlendFunctionParametersDirty = false;
        }

        public apply(gl: WebGLRenderingContext) {

            if (!this.isDirty) {
                return;
            }

            // Alpha blend
            if (this._isAlphaBlendDirty) {
                if (this._alphaBlend) {
                    gl.enable(gl.BLEND);
                } else {
                    gl.disable(gl.BLEND);
                }

                this._isAlphaBlendDirty = false;
            }

            // Alpha function
            if (this._isBlendFunctionParametersDirty) {
                gl.blendFuncSeparate(this._blendFunctionParameters[0], this._blendFunctionParameters[1], this._blendFunctionParameters[2], this._blendFunctionParameters[3]);
                this._isBlendFunctionParametersDirty = false;
            }
        }
    }
}