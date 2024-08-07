import { AbstractEngine } from "core/Engines/abstractEngine";
import {
    ALPHA_DISABLE,
    ALPHA_PREMULTIPLIED,
    GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA,
    ALPHA_PREMULTIPLIED_PORTERDUFF,
    ALPHA_COMBINE,
    GL_ALPHA_FUNCTION_SRC_ALPHA,
    ALPHA_ONEONE,
    ALPHA_ADD,
    ALPHA_SUBTRACT,
    GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR,
    ALPHA_MULTIPLY,
    GL_ALPHA_FUNCTION_DST_COLOR,
    ALPHA_MAXIMIZED,
    ALPHA_INTERPOLATE,
    GL_ALPHA_FUNCTION_CONSTANT_COLOR,
    GL_ALPHA_FUNCTION_ONE_MINUS_CONSTANT_COLOR,
    GL_ALPHA_FUNCTION_CONSTANT_ALPHA,
    GL_ALPHA_FUNCTION_ONE_MINUS_CONSTANT_ALPHA,
    ALPHA_SCREENMODE,
    ALPHA_ONEONE_ONEONE,
    ALPHA_ALPHATOCOLOR,
    GL_ALPHA_FUNCTION_DST_ALPHA,
    ALPHA_REVERSEONEMINUS,
    GL_ALPHA_FUNCTION_ONE_MINUS_DST_COLOR,
    GL_ALPHA_FUNCTION_ONE_MINUS_DST_ALPHA,
    ALPHA_SRC_DSTONEMINUSSRCALPHA,
    ALPHA_ONEONE_ONEZERO,
    ALPHA_EXCLUSION,
    ALPHA_LAYER_ACCUMULATE,
} from "../../constants";
import { WebGPUEngine } from "../../webgpuEngine";

import "../../AbstractEngine/abstractEngine.alpha";

declare module "../../abstractEngine" {
    export interface AbstractEngine {
        /**
         * Sets the current alpha mode
         * @param mode defines the mode to use (one of the Engine.ALPHA_XXX)
         * @param noDepthWriteChange defines if depth writing state should remains unchanged (false by default)
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering
         */
        setAlphaMode(mode: number, noDepthWriteChange?: boolean): void;
    }
}

WebGPUEngine.prototype.setAlphaMode = function (mode: number, noDepthWriteChange: boolean = false): void {
    if (this._alphaMode === mode && ((mode === ALPHA_DISABLE && !this._alphaState.alphaBlend) || (mode !== ALPHA_DISABLE && this._alphaState.alphaBlend))) {
        if (!noDepthWriteChange) {
            // Make sure we still have the correct depth mask according to the alpha mode (a transparent material could have forced writting to the depth buffer, for instance)
            const depthMask = mode === ALPHA_DISABLE;
            if (this.depthCullingState.depthMask !== depthMask) {
                this.setDepthWrite(depthMask);
                this._cacheRenderPipeline.setDepthWriteEnabled(depthMask);
            }
        }
        return;
    }

    switch (mode) {
        case ALPHA_DISABLE:
            this._alphaState.alphaBlend = false;
            break;
        case ALPHA_PREMULTIPLIED:
            this._alphaState.setAlphaBlendFunctionParameters(1, GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_PREMULTIPLIED_PORTERDUFF:
            this._alphaState.setAlphaBlendFunctionParameters(1, GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, 1, GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_COMBINE:
            this._alphaState.setAlphaBlendFunctionParameters(GL_ALPHA_FUNCTION_SRC_ALPHA, GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_ONEONE:
            this._alphaState.setAlphaBlendFunctionParameters(1, 1, 0, 1);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_ADD:
            this._alphaState.setAlphaBlendFunctionParameters(GL_ALPHA_FUNCTION_SRC_ALPHA, 1, 0, 1);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_SUBTRACT:
            this._alphaState.setAlphaBlendFunctionParameters(0, GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_MULTIPLY:
            this._alphaState.setAlphaBlendFunctionParameters(GL_ALPHA_FUNCTION_DST_COLOR, 0, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_MAXIMIZED:
            this._alphaState.setAlphaBlendFunctionParameters(GL_ALPHA_FUNCTION_SRC_ALPHA, GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_INTERPOLATE:
            this._alphaState.setAlphaBlendFunctionParameters(
                GL_ALPHA_FUNCTION_CONSTANT_COLOR,
                GL_ALPHA_FUNCTION_ONE_MINUS_CONSTANT_COLOR,
                GL_ALPHA_FUNCTION_CONSTANT_ALPHA,
                GL_ALPHA_FUNCTION_ONE_MINUS_CONSTANT_ALPHA
            );
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_SCREENMODE:
            this._alphaState.setAlphaBlendFunctionParameters(1, GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR, 1, GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_ONEONE_ONEONE:
            this._alphaState.setAlphaBlendFunctionParameters(1, 1, 1, 1);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_ALPHATOCOLOR:
            this._alphaState.setAlphaBlendFunctionParameters(GL_ALPHA_FUNCTION_DST_ALPHA, 1, 0, 0);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_REVERSEONEMINUS:
            this._alphaState.setAlphaBlendFunctionParameters(
                GL_ALPHA_FUNCTION_ONE_MINUS_DST_COLOR,
                GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR,
                GL_ALPHA_FUNCTION_ONE_MINUS_DST_ALPHA,
                GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA
            );
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_SRC_DSTONEMINUSSRCALPHA:
            this._alphaState.setAlphaBlendFunctionParameters(1, GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, 1, GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_ONEONE_ONEZERO:
            this._alphaState.setAlphaBlendFunctionParameters(1, 1, 1, 0);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_EXCLUSION:
            this._alphaState.setAlphaBlendFunctionParameters(GL_ALPHA_FUNCTION_ONE_MINUS_DST_COLOR, GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR, 0, 1);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_LAYER_ACCUMULATE:
            // Same as ALPHA_COMBINE but accumulates (1 - alpha) values in the alpha channel for a later readout in order independant transparency
            this._alphaState.setAlphaBlendFunctionParameters(GL_ALPHA_FUNCTION_SRC_ALPHA, GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, 1, GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
    }
    if (!noDepthWriteChange) {
        this.setDepthWrite(mode === ALPHA_DISABLE);
        this._cacheRenderPipeline.setDepthWriteEnabled(mode === ALPHA_DISABLE);
    }
    this._alphaMode = mode;
    this._cacheRenderPipeline.setAlphaBlendEnabled(this._alphaState.alphaBlend);
    this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters);
};

WebGPUEngine.prototype.setAlphaEquation = function (equation: number): void {
    AbstractEngine.prototype.setAlphaEquation.call(this, equation);

    this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters);
};
