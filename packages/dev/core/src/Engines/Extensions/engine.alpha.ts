import { ThinEngine } from "../../Engines/thinEngine";
import {
    ALPHA_DISABLE,
    ALPHA_PREMULTIPLIED,
    ALPHA_PREMULTIPLIED_PORTERDUFF,
    ALPHA_COMBINE,
    ALPHA_ONEONE,
    ALPHA_ADD,
    ALPHA_SUBTRACT,
    ALPHA_MULTIPLY,
    ALPHA_MAXIMIZED,
    ALPHA_INTERPOLATE,
    ALPHA_SCREENMODE,
    ALPHA_ONEONE_ONEONE,
    ALPHA_ALPHATOCOLOR,
    ALPHA_REVERSEONEMINUS,
    ALPHA_SRC_DSTONEMINUSSRCALPHA,
    ALPHA_ONEONE_ONEZERO,
    ALPHA_EXCLUSION,
    ALPHA_LAYER_ACCUMULATE,
} from "../constants";

declare module "../abstractEngine" {
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

ThinEngine.prototype.setAlphaMode = function (mode: number, noDepthWriteChange: boolean = false): void {
    if (this._alphaMode === mode) {
        if (!noDepthWriteChange) {
            // Make sure we still have the correct depth mask according to the alpha mode (a transparent material could have forced writting to the depth buffer, for instance)
            const depthMask = mode === ALPHA_DISABLE;
            if (this.depthCullingState.depthMask !== depthMask) {
                this.depthCullingState.depthMask = depthMask;
            }
        }
        return;
    }

    switch (mode) {
        case ALPHA_DISABLE:
            this._alphaState.alphaBlend = false;
            break;
        case ALPHA_PREMULTIPLIED:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_PREMULTIPLIED_PORTERDUFF:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_COMBINE:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_ONEONE:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE, this._gl.ZERO, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_ADD:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE, this._gl.ZERO, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_SUBTRACT:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ZERO, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_MULTIPLY:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.DST_COLOR, this._gl.ZERO, this._gl.ONE, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_MAXIMIZED:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_INTERPOLATE:
            this._alphaState.setAlphaBlendFunctionParameters(
                this._gl.CONSTANT_COLOR,
                this._gl.ONE_MINUS_CONSTANT_COLOR,
                this._gl.CONSTANT_ALPHA,
                this._gl.ONE_MINUS_CONSTANT_ALPHA
            );
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_SCREENMODE:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_ONEONE_ONEONE:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE, this._gl.ONE, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_ALPHATOCOLOR:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.DST_ALPHA, this._gl.ONE, this._gl.ZERO, this._gl.ZERO);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_REVERSEONEMINUS:
            this._alphaState.setAlphaBlendFunctionParameters(
                this._gl.ONE_MINUS_DST_COLOR,
                this._gl.ONE_MINUS_SRC_COLOR,
                this._gl.ONE_MINUS_DST_ALPHA,
                this._gl.ONE_MINUS_SRC_ALPHA
            );
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_SRC_DSTONEMINUSSRCALPHA:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_ONEONE_ONEZERO:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE, this._gl.ONE, this._gl.ONE, this._gl.ZERO);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_EXCLUSION:
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.ONE_MINUS_DST_COLOR, this._gl.ONE_MINUS_SRC_COLOR, this._gl.ZERO, this._gl.ONE);
            this._alphaState.alphaBlend = true;
            break;
        case ALPHA_LAYER_ACCUMULATE:
            // Same as ALPHA_COMBINE but accumulates (1 - alpha) values in the alpha channel for a later readout in order independant transparency
            this._alphaState.setAlphaBlendFunctionParameters(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA, this._gl.ONE, this._gl.ONE_MINUS_SRC_ALPHA);
            this._alphaState.alphaBlend = true;
            break;
    }
    if (!noDepthWriteChange) {
        this.depthCullingState.depthMask = mode === ALPHA_DISABLE;
    }
    this._alphaMode = mode;
};
