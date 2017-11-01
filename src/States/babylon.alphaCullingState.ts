module BABYLON.Internals {
    export class _AlphaState {
        private _isAlphaBlendDirty = false;
        private _isBlendFunctionParametersDirty = false;
        private _isBlendEquationParametersDirty = false;
        private _isBlendConstantsDirty = false;
        private _alphaBlend = false;
        private _blendFunctionParameters = new Array<Nullable<number>>(4);
        private _blendEquationParameters = new Array<Nullable<number>>(2);
        private _blendConstants = new Array<Nullable<number>>(4);

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

        public setAlphaBlendConstants(r: number, g: number, b: number, a: number): void {
            if (
                this._blendConstants[0] === r &&
                this._blendConstants[1] === g &&
                this._blendConstants[2] === b &&
                this._blendConstants[3] === a
            ) {
                return;
            }

            this._blendConstants[0] = r;
            this._blendConstants[1] = g;
            this._blendConstants[2] = b;
            this._blendConstants[3] = a;

            this._isBlendConstantsDirty = true;
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

        public setAlphaEquationParameters(rgb: number, alpha: number): void {
            if (
                this._blendEquationParameters[0] === rgb &&
                this._blendEquationParameters[1] === alpha
            ) {
                return;
            }

            this._blendEquationParameters[0] = rgb;
            this._blendEquationParameters[1] = alpha;

            this._isBlendEquationParametersDirty = true;
        }        

        public reset() {
            this._alphaBlend = false;
            this._blendFunctionParameters[0] = null;
            this._blendFunctionParameters[1] = null;
            this._blendFunctionParameters[2] = null;
            this._blendFunctionParameters[3] = null;

            this._blendEquationParameters[0] = null;
            this._blendEquationParameters[1] = null; 

            this._blendConstants[0] = null;
            this._blendConstants[1] = null;
            this._blendConstants[2] = null;
            this._blendConstants[3] = null;                       

            this._isAlphaBlendDirty = true;
            this._isBlendFunctionParametersDirty = false;
            this._isBlendEquationParametersDirty = false;
            this._isBlendConstantsDirty = false;
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
                gl.blendFuncSeparate(<number>this._blendFunctionParameters[0], <number>this._blendFunctionParameters[1], <number>this._blendFunctionParameters[2], <number>this._blendFunctionParameters[3]);
                this._isBlendFunctionParametersDirty = false;
            }

            // Alpha equation
            if (this._isBlendEquationParametersDirty) {
                gl.blendEquationSeparate((<any>this._isBlendEquationParametersDirty)[0], (<any>this._isBlendEquationParametersDirty)[1]);
                this._isBlendEquationParametersDirty = false;
            }        

            // Constants
            if (this._isBlendConstantsDirty) {
                gl.blendColor(<number>this._blendConstants[0], <number>this._blendConstants[1], <number>this._blendConstants[2], <number>this._blendConstants[3]);
                this._isBlendConstantsDirty = false;
            }                    
        }
    }
}