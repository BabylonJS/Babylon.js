import type { Nullable } from "../types";

/**
 * @internal
 **/
export class AlphaState {
    public _blendFunctionParameters = new Array<Nullable<number>>(4 * 8);
    public _blendEquationParameters = new Array<Nullable<number>>(2 * 8);
    public _blendConstants = new Array<Nullable<number>>(4);
    public _isBlendConstantsDirty = false;

    public _alphaBlend = Array(8).fill(false);
    public _numTargetEnabled = 0;

    private _isAlphaBlendDirty = false;
    private _isBlendFunctionParametersDirty = false;
    private _isBlendEquationParametersDirty = false;

    /**
     * Initializes the state.
     */
    public constructor() {
        this.reset();
    }

    public get isDirty(): boolean {
        return this._isAlphaBlendDirty || this._isBlendFunctionParametersDirty || this._isBlendEquationParametersDirty;
    }

    public get alphaBlend(): boolean {
        return this._numTargetEnabled > 0;
    }

    public setAlphaBlend(value: boolean, targetIndex: number = 0): void {
        if (this._alphaBlend[targetIndex] === value) {
            return;
        }

        if (value) {
            this._numTargetEnabled++;
        } else {
            this._numTargetEnabled--;
        }

        this._alphaBlend[targetIndex] = value;
        this._isAlphaBlendDirty = true;
    }

    public setAlphaBlendConstants(r: number, g: number, b: number, a: number): void {
        if (this._blendConstants[0] === r && this._blendConstants[1] === g && this._blendConstants[2] === b && this._blendConstants[3] === a) {
            return;
        }

        this._blendConstants[0] = r;
        this._blendConstants[1] = g;
        this._blendConstants[2] = b;
        this._blendConstants[3] = a;

        this._isBlendConstantsDirty = true;
    }

    public setAlphaBlendFunctionParameters(srcRGBFactor: number, dstRGBFactor: number, srcAlphaFactor: number, dstAlphaFactor: number, targetIndex: number): void {
        const offset = targetIndex * 4;

        if (
            this._blendFunctionParameters[offset + 0] === srcRGBFactor &&
            this._blendFunctionParameters[offset + 1] === dstRGBFactor &&
            this._blendFunctionParameters[offset + 2] === srcAlphaFactor &&
            this._blendFunctionParameters[offset + 3] === dstAlphaFactor
        ) {
            return;
        }

        this._blendFunctionParameters[offset + 0] = srcRGBFactor;
        this._blendFunctionParameters[offset + 1] = dstRGBFactor;
        this._blendFunctionParameters[offset + 2] = srcAlphaFactor;
        this._blendFunctionParameters[offset + 3] = dstAlphaFactor;

        this._isBlendFunctionParametersDirty = true;
    }

    public setAlphaEquationParameters(rgbEquation: number, alphaEquation: number, targetIndex: number): void {
        const offset = targetIndex * 2;

        if (this._blendEquationParameters[offset + 0] === rgbEquation && this._blendEquationParameters[offset + 1] === alphaEquation) {
            return;
        }

        this._blendEquationParameters[offset + 0] = rgbEquation;
        this._blendEquationParameters[offset + 1] = alphaEquation;

        this._isBlendEquationParametersDirty = true;
    }

    public reset() {
        this._alphaBlend.fill(false);
        this._numTargetEnabled = 0;
        this._blendFunctionParameters.fill(null);
        this._blendEquationParameters.fill(null);

        this._blendConstants[0] = null;
        this._blendConstants[1] = null;
        this._blendConstants[2] = null;
        this._blendConstants[3] = null;

        this._isAlphaBlendDirty = true;
        this._isBlendFunctionParametersDirty = false;
        this._isBlendEquationParametersDirty = false;
        this._isBlendConstantsDirty = false;
    }

    public apply(gl: WebGLRenderingContext, numTargets: number = 1): void {
        if (!this.isDirty) {
            return;
        }

        // Alpha blend
        if (this._isAlphaBlendDirty) {
            if (numTargets === 1) {
                if (this._alphaBlend[0]) {
                    gl.enable(gl.BLEND);
                } else {
                    gl.disable(gl.BLEND);
                }
            } else {
                const gl2 = gl as WebGL2RenderingContext;
                for (let i = 0; i < numTargets; i++) {
                    const index = i < this._numTargetEnabled ? i : 0;
                    if (this._alphaBlend[index]) {
                        gl2.enableIndexed(gl.BLEND, i);
                    } else {
                        gl2.disableIndexed(gl.BLEND, i);
                    }
                }
            }

            this._isAlphaBlendDirty = false;
        }

        // Alpha function
        if (this._isBlendFunctionParametersDirty) {
            if (numTargets === 1) {
                gl.blendFuncSeparate(
                    <number>this._blendFunctionParameters[0],
                    <number>this._blendFunctionParameters[1],
                    <number>this._blendFunctionParameters[2],
                    <number>this._blendFunctionParameters[3]
                );
            } else {
                const gl2 = gl as WebGL2RenderingContext;
                for (let i = 0; i < numTargets; i++) {
                    const offset = i < this._numTargetEnabled ? i * 4 : 0;
                    gl2.blendFuncSeparateIndexed(
                        i,
                        <number>this._blendFunctionParameters[offset + 0],
                        <number>this._blendFunctionParameters[offset + 1],
                        <number>this._blendFunctionParameters[offset + 2],
                        <number>this._blendFunctionParameters[offset + 3]
                    );
                }
            }
            this._isBlendFunctionParametersDirty = false;
        }

        // Alpha equation
        if (this._isBlendEquationParametersDirty) {
            if (numTargets === 1) {
                gl.blendEquationSeparate(<number>this._blendEquationParameters[0], <number>this._blendEquationParameters[1]);
            } else {
                const gl2 = gl as WebGL2RenderingContext;
                for (let i = 0; i < numTargets; i++) {
                    const offset = i < this._numTargetEnabled ? i * 2 : 0;
                    gl2.blendEquationSeparateIndexed(i, <number>this._blendEquationParameters[offset + 0], <number>this._blendEquationParameters[offset + 1]);
                }
            }
            this._isBlendEquationParametersDirty = false;
        }

        // Constants
        if (this._isBlendConstantsDirty) {
            gl.blendColor(<number>this._blendConstants[0], <number>this._blendConstants[1], <number>this._blendConstants[2], <number>this._blendConstants[3]);
            this._isBlendConstantsDirty = false;
        }
    }
}
