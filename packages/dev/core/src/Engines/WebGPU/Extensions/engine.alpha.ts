import { AbstractEngine } from "core/Engines/abstractEngine";
import { Constants } from "../../constants";

import "../../AbstractEngine/abstractEngine.alpha";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";

declare module "../../abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Sets the current alpha mode
         * @param mode defines the mode to use (one of the Engine.ALPHA_XXX)
         * @param noDepthWriteChange defines if depth writing state should remains unchanged (false by default)
         * @param targetIndex defines the index of the target to set the alpha mode for (default is 0)
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering
         */
        setAlphaMode(mode: number, noDepthWriteChange?: boolean, targetIndex?: number): void;
    }
}

ThinWebGPUEngine.prototype.setAlphaMode = function (mode: number, noDepthWriteChange: boolean = false, targetIndex: number = 0): void {
    const alphaBlend = this._alphaState._alphaBlend[targetIndex];

    if (this._alphaMode[targetIndex] === mode && ((mode === Constants.ALPHA_DISABLE && !alphaBlend) || (mode !== Constants.ALPHA_DISABLE && alphaBlend))) {
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

    const alphaBlendDisabled = mode === Constants.ALPHA_DISABLE;

    this._alphaState.setAlphaBlend(!alphaBlendDisabled, targetIndex);

    switch (mode) {
        case Constants.ALPHA_DISABLE:
            break;
        case Constants.ALPHA_PREMULTIPLIED:
            this._alphaState.setAlphaBlendFunctionParameters(1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, 1, 1, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_PREMULTIPLIED_PORTERDUFF:
            this._alphaState.setAlphaBlendFunctionParameters(1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, 1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_COMBINE:
            this._alphaState.setAlphaBlendFunctionParameters(Constants.GL_ALPHA_FUNCTION_SRC_ALPHA, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, 1, 1, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_ONEONE:
            this._alphaState.setAlphaBlendFunctionParameters(1, 1, 0, 1, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_ADD:
            this._alphaState.setAlphaBlendFunctionParameters(Constants.GL_ALPHA_FUNCTION_SRC_ALPHA, 1, 0, 1, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_SUBTRACT:
            this._alphaState.setAlphaBlendFunctionParameters(0, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR, 1, 1, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_SUBTRACT, Constants.GL_ALPHA_EQUATION_SUBTRACT, targetIndex);
            break;
        case Constants.ALPHA_MULTIPLY:
            this._alphaState.setAlphaBlendFunctionParameters(Constants.GL_ALPHA_FUNCTION_DST_COLOR, 0, 1, 1, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_MAXIMIZED:
            this._alphaState.setAlphaBlendFunctionParameters(Constants.GL_ALPHA_FUNCTION_SRC_ALPHA, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR, 1, 1, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_INTERPOLATE:
            this._alphaState.setAlphaBlendFunctionParameters(
                Constants.GL_ALPHA_FUNCTION_CONSTANT_COLOR,
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_CONSTANT_COLOR,
                Constants.GL_ALPHA_FUNCTION_CONSTANT_ALPHA,
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_CONSTANT_ALPHA,
                targetIndex
            );
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_SCREENMODE:
            this._alphaState.setAlphaBlendFunctionParameters(1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR, 1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_ONEONE_ONEONE:
            this._alphaState.setAlphaBlendFunctionParameters(1, 1, 1, 1, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_ALPHATOCOLOR:
            this._alphaState.setAlphaBlendFunctionParameters(Constants.GL_ALPHA_FUNCTION_DST_ALPHA, 1, 0, 0, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_REVERSEONEMINUS:
            this._alphaState.setAlphaBlendFunctionParameters(
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_DST_COLOR,
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR,
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_DST_ALPHA,
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA,
                targetIndex
            );
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_SRC_DSTONEMINUSSRCALPHA:
            this._alphaState.setAlphaBlendFunctionParameters(1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, 1, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_ONEONE_ONEZERO:
            this._alphaState.setAlphaBlendFunctionParameters(1, 1, 1, 0, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_EXCLUSION:
            this._alphaState.setAlphaBlendFunctionParameters(Constants.GL_ALPHA_FUNCTION_ONE_MINUS_DST_COLOR, Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_COLOR, 0, 1, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_LAYER_ACCUMULATE:
            // Same as ALPHA_COMBINE but accumulates (1 - alpha) values in the alpha channel for a later readout in order independant transparency
            this._alphaState.setAlphaBlendFunctionParameters(
                Constants.GL_ALPHA_FUNCTION_SRC_ALPHA,
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA,
                1,
                Constants.GL_ALPHA_FUNCTION_ONE_MINUS_SRC_ALPHA,
                targetIndex
            );
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
        case Constants.ALPHA_MIN:
            this._alphaState.setAlphaBlendFunctionParameters(1, 1, 1, 1, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_MIN, Constants.GL_ALPHA_EQUATION_MIN, targetIndex);
            break;
        case Constants.ALPHA_MAX:
            this._alphaState.setAlphaBlendFunctionParameters(1, 1, 1, 1, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_MAX, Constants.GL_ALPHA_EQUATION_MAX, targetIndex);
            break;
        case Constants.ALPHA_DUAL_SRC0_ADD_SRC1xDST:
            this._alphaState.setAlphaBlendFunctionParameters(1, Constants.GL_ALPHA_FUNCTION_SRC1_COLOR, 0, 1, targetIndex);
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
            break;
    }
    if (!noDepthWriteChange) {
        this.setDepthWrite(alphaBlendDisabled);
        this._cacheRenderPipeline.setDepthWriteEnabled(alphaBlendDisabled);
    }
    this._alphaMode[targetIndex] = mode;
    this._cacheRenderPipeline.setAlphaBlendEnabled(this._alphaState._alphaBlend, this._alphaState._numTargetEnabled);
    this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters);
};

ThinWebGPUEngine.prototype.setAlphaEquation = function (equation: number, targetIndex: number = 0): void {
    AbstractEngine.prototype.setAlphaEquation.call(this, equation, targetIndex);

    this._cacheRenderPipeline.setAlphaBlendFactors(this._alphaState._blendFunctionParameters, this._alphaState._blendEquationParameters);
};
