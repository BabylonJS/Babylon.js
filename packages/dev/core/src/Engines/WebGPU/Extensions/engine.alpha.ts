import { AbstractEngine } from "core/Engines/abstractEngine";
import { Constants } from "../../constants";
import { WebGPUEngine } from "../../webgpuEngine";

declare module "../../webgpuEngine" {
    export interface WebGPUEngine {
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
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering
         */
        setAlphaMode(mode: number, noDepthWriteChange?: boolean): void;

        /**
         * Gets the current alpha mode
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering
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

WebGPUEngine.prototype.setAlphaMode = function (mode: number, noDepthWriteChange: boolean = false): void {
    if (this._alphaMode === mode && ((mode === Constants.ALPHA_DISABLE && !this._alphaState.alphaBlend) || (mode !== Constants.ALPHA_DISABLE && this._alphaState.alphaBlend))) {
        if (!noDepthWriteChange) {
            // Make sure we still have the correct depth mask according to the alpha mode (a transparent material could have forced writting to the depth buffer, for instance)
            const depthMask = mode === Constants.ALPHA_DISABLE;
            if (this.depthCullingState.depthMask !== depthMask) {
                this.setDepthWrite(depthMask);
                this._cacheRenderPipeline.setDepthWriteEnabled(depthMask);
            }
        }
        return;
    }

    switch (mode) {
        case Constants.ALPHA_DISABLE:
            this._alphaState.alphaBlend = false;
            break;
        case Constants.ALPHA_PREMULTIPLIED:
            this._alphaState.setAlphaBlendFunctionParameters(1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_PREMULTIPLIED_PORTERDUFF:
            this._alphaState.setAlphaBlendFunctionParameters(1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, 1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_COMBINE:
            this._alphaState.setAlphaBlendFunctionParameters(Constants.GL_ALPHA_FUNCTION_SRC_ALPHA, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_ONEONE:
            this._alphaState.setAlphaBlendFunctionParameters(1, 1, 0, 1);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_ADD:
            this._alphaState.setAlphaBlendFunctionParameters(Constants.GL_ALPHA_FUNCTION_SRC_ALPHA, 1, 0, 1);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_SUBTRACT:
            this._alphaState.setAlphaBlendFunctionParameters(0, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_MULTIPLY:
            this._alphaState.setAlphaBlendFunctionParameters(Constants.GL_ALPHA_FUNCTION_DST_COLOR, 0, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_MAXIMIZED:
            this._alphaState.setAlphaBlendFunctionParameters(Constants.GL_ALPHA_FUNCTION_SRC_ALPHA, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_INTERPOLATE:
            this._alphaState.setAlphaBlendFunctionParameters(
                Constants.GL_ALPHA_FUNCTION_CONSTANT_COLOR,
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_CONSTANT_COLOR,
                Constants.GL_ALPHA_FUNCTION_CONSTANT_ALPHA,
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_CONSTANT_ALPHA
            );
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_SCREENMODE:
            this._alphaState.setAlphaBlendFunctionParameters(1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR, 1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_ONEONE_ONEONE:
            this._alphaState.setAlphaBlendFunctionParameters(1, 1, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_ALPHATOCOLOR:
            this._alphaState.setAlphaBlendFunctionParameters(Constants.GL_ALPHA_FUNCTION_DST_ALPHA, 1, 0, 0);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_REVERSEONEMINUS:
            this._alphaState.setAlphaBlendFunctionParameters(
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_DST_COLOR,
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR,
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_DST_ALPHA,
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA
            );
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_SRC_DSTONEMINUSSRCALPHA:
            this._alphaState.setAlphaBlendFunctionParameters(1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, 1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_ONEONE_ONEZERO:
            this._alphaState.setAlphaBlendFunctionParameters(1, 1, 1, 0);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_EXCLUSION:
            this._alphaState.setAlphaBlendFunctionParameters(Constants.GL_ALPHA_FUNCTION_ONE_MINUS_DST_COLOR, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR, 0, 1);
            this._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_LAYER_ACCUMULATE:
            // Same as ALPHA_COMBINE but accumulates (1 - alpha) values in the alpha channel for a later readout in order independant transparency
            this._alphaState.setAlphaBlendFunctionParameters(
                Constants.GL_ALPHA_FUNCTION_SRC_ALPHA,
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA,
                1,
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA
            );
            this._alphaState.alphaBlend = true;
            break;
    }
    if (!noDepthWriteChange) {
        this.setDepthWrite(mode === Constants.ALPHA_DISABLE);
        this._cacheRenderPipeline.setDepthWriteEnabled(mode === Constants.ALPHA_DISABLE);
    }
    this._alphaMode = mode;
    this._cacheRenderPipeline.setAlphaBlendEnabled(this._alphaState.alphaBlend);
    this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters);
};

WebGPUEngine.prototype.setAlphaEquation = function (equation: number): void {
    AbstractEngine.prototype.setAlphaEquation.call(this, equation);

    this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters);
};
