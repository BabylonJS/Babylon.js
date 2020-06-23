import { ThinEngine } from "../../Engines/thinEngine";
import { Constants } from '../constants';

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Sets alpha constants used by some alpha blending modes
         * @param r defines the red component
         * @param g defines the green component
         * @param b defines the blue component
         * @param a defines the alpha component
         */
        setAlphaConstants(r: number, g: number, b: number, a: number): void;

        /**
         * Sets the current alpha mode
         * @param mode defines the mode to use (one of the Engine.ALPHA_XXX)
         * @param noDepthWriteChange defines if depth writing state should remains unchanged (false by default)
         * @see https://doc.babylonjs.com/resources/transparency_and_how_meshes_are_rendered
         */
        setAlphaMode(mode: number, noDepthWriteChange?: boolean): void;

        /**
         * Gets the current alpha mode
         * @see https://doc.babylonjs.com/resources/transparency_and_how_meshes_are_rendered
         * @returns the current alpha mode
         */
        getAlphaMode(): number;

        /**
         * Sets the current alpha equation
         * @param equation defines the equation to use (one of the Engine.ALPHA_EQUATION_XXX)
         */
        setAlphaEquation(equation: number): void;

        /**
         * Gets the current alpha equation.
         * @returns the current alpha equation
         */
        getAlphaEquation(): number;
    }
}

ThinEngine.prototype.setAlphaConstants = function(r: number, g: number, b: number, a: number) {
    this._alphaState.setAlphaBlendConstants(r, g, b, a);
};

ThinEngine.prototype.setAlphaMode = function(mode: number, noDepthWriteChange: boolean = false): void {
    if (this._alphaMode === mode) {
        return;
    }

    switch (mode) {
        case Constants.ALPHA_DISABLE:
            this._alphaState.alphaBlend = false;
            break;
        case Constants.ALPHA_PREMULTIPLIED:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_PREMULTIPLIED_PORTERDUFF:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_COMBINE:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_ONEONE:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE, this._gl.ZERO, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_ADD:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE, this._gl.ZERO, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_SUBTRACT:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ZERO, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_MULTIPLY:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.DST_COLOR, this._gl.ZERO, this._gl.ONE, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_MAXIMIZED:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_INTERPOLATE:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.CONSTANT_COLOR, this._gl.ONE_MINUS_CONSTANT_COLOR, this._gl.CONSTANT_ALPHA, this._gl.ONE_MINUS_CONSTANT_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_SCREENMODE:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_ONEONE_ONEONE:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE, this._gl.ONE, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_ALPHATOCOLOR:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.DST_ALPHA, this._gl.ONE, this._gl.ZERO, this._gl.ZERO);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_REVERSEONEMINUS:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE_MINUS_DST_COLOR, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE_MINUS_DST_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_SRC_DSTONEMINUSSRCALPHA:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_ONEONE_ONEZERO:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE, this._gl.ONE, this._gl.ZERO);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_EXCLUSION:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE_MINUS_DST_COLOR, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ZERO, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
    }
    if (!noDepthWriteChange) {
        this.depthCullingState.depthMask = (mode === Constants.ALPHA_DISABLE);
    }
    this._alphaMode = mode;
};

ThinEngine.prototype.getAlphaMode = function(): number {
    return this._alphaMode;
};

ThinEngine.prototype.setAlphaEquation = function(equation: number): void {
    if (this._alphaEquation === equation) {
        return;
    }

    switch (equation) {
        case Constants.ALPHA_EQUATION_ADD:
            this._alphaState.setAlphaEquationParameters(this._gl.FUNC_ADD, this._gl.FUNC_ADD);
            break;
        case Constants.ALPHA_EQUATION_SUBSTRACT:
            this._alphaState.setAlphaEquationParameters(this._gl.FUNC_SUBTRACT, this._gl.FUNC_SUBTRACT);
            break;
        case Constants.ALPHA_EQUATION_REVERSE_SUBTRACT:
            this._alphaState.setAlphaEquationParameters(this._gl.FUNC_REVERSE_SUBTRACT, this._gl.FUNC_REVERSE_SUBTRACT);
            break;
        case Constants.ALPHA_EQUATION_MAX:
            this._alphaState.setAlphaEquationParameters(this._gl.MAX, this._gl.MAX);
            break;
        case Constants.ALPHA_EQUATION_MIN:
            this._alphaState.setAlphaEquationParameters(this._gl.MIN, this._gl.MIN);
            break;
        case Constants.ALPHA_EQUATION_DARKEN:
            this._alphaState.setAlphaEquationParameters(this._gl.MIN, this._gl.FUNC_ADD);
            break;
    }
    this._alphaEquation = equation;
};

ThinEngine.prototype.getAlphaEquation = function() {
    return this._alphaEquation;
};