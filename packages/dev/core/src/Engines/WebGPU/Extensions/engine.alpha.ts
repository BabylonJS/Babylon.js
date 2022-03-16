import { Constants } from "../../constants";
import { Engine } from "../../engine";
import { WebGPUEngine } from "../../webgpuEngine";

WebGPUEngine.prototype.setAlphaMode = function (mode: number, noDepthWriteChange: boolean = false): void {
    if (this._alphaMode === mode && ((mode === Constants.ALPHA_DISABLE && !this._alphaState.alphaBlend) || (mode !== Constants.ALPHA_DISABLE && this._alphaState.alphaBlend))) {
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
        this.setDepthWrite(mode === Engine.ALPHA_DISABLE);
        this._cacheRenderPipeline.setDepthWriteEnabled(mode === Engine.ALPHA_DISABLE);
    }
    this._alphaMode = mode;
    this._cacheRenderPipeline.setAlphaBlendEnabled(this._alphaState.alphaBlend);
    this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters);
};

WebGPUEngine.prototype.setAlphaEquation = function (equation: number): void {
    Engine.prototype.setAlphaEquation.call(this, equation);

    this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters);
};
