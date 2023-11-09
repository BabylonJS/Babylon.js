import { Constants } from "../../engine.constants.js";
import type { IWebGLEnginePublic, WebGLEngineStateFull } from "../../engine.webgl.js";
import type { IAlphaEngineExtension } from "./alpha.base.js";

export const setAlphaConstants: IAlphaEngineExtension["setAlphaConstants"] = (engineState: IWebGLEnginePublic, r: number, g: number, b: number, a: number) => {
    const fes = engineState as WebGLEngineStateFull;
    fes._alphaState.setAlphaBlendConstants(r, g, b, a);
};

export const setAlphaMode: IAlphaEngineExtension["setAlphaMode"] = (engineState: IWebGLEnginePublic, mode: number, noDepthWriteChange: boolean = false): void => {
    const fes = engineState as WebGLEngineStateFull;
    if (fes._alphaMode === mode) {
        if (!noDepthWriteChange) {
            // Make sure we still have the correct depth mask according to the alpha mode (a transparent material could have forced writting to the depth buffer, for instance)
            const depthMask = mode === Constants.ALPHA_DISABLE;
            if (fes._depthCullingState.depthMask !== depthMask) {
                fes._depthCullingState.depthMask = depthMask;
            }
        }
        return;
    }

    switch (mode) {
        case Constants.ALPHA_DISABLE:
            fes._alphaState.alphaBlend = false;
            break;
        case Constants.ALPHA_PREMULTIPLIED:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.ONE, fes._gl.ONE_MINUS_SRC_ALPHA, fes._gl.ONE, fes._gl.ONE);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_PREMULTIPLIED_PORTERDUFF:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.ONE, fes._gl.ONE_MINUS_SRC_ALPHA, fes._gl.ONE, fes._gl.ONE_MINUS_SRC_ALPHA);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_COMBINE:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.SRC_ALPHA, fes._gl.ONE_MINUS_SRC_ALPHA, fes._gl.ONE, fes._gl.ONE);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_ONEONE:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.ONE, fes._gl.ONE, fes._gl.ZERO, fes._gl.ONE);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_ADD:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.SRC_ALPHA, fes._gl.ONE, fes._gl.ZERO, fes._gl.ONE);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_SUBTRACT:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.ZERO, fes._gl.ONE_MINUS_SRC_COLOR, fes._gl.ONE, fes._gl.ONE);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_MULTIPLY:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.DST_COLOR, fes._gl.ZERO, fes._gl.ONE, fes._gl.ONE);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_MAXIMIZED:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.SRC_ALPHA, fes._gl.ONE_MINUS_SRC_COLOR, fes._gl.ONE, fes._gl.ONE);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_INTERPOLATE:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.CONSTANT_COLOR, fes._gl.ONE_MINUS_CONSTANT_COLOR, fes._gl.CONSTANT_ALPHA, fes._gl.ONE_MINUS_CONSTANT_ALPHA);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_SCREENMODE:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.ONE, fes._gl.ONE_MINUS_SRC_COLOR, fes._gl.ONE, fes._gl.ONE_MINUS_SRC_ALPHA);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_ONEONE_ONEONE:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.ONE, fes._gl.ONE, fes._gl.ONE, fes._gl.ONE);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_ALPHATOCOLOR:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.DST_ALPHA, fes._gl.ONE, fes._gl.ZERO, fes._gl.ZERO);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_REVERSEONEMINUS:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.ONE_MINUS_DST_COLOR, fes._gl.ONE_MINUS_SRC_COLOR, fes._gl.ONE_MINUS_DST_ALPHA, fes._gl.ONE_MINUS_SRC_ALPHA);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_SRC_DSTONEMINUSSRCALPHA:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.ONE, fes._gl.ONE_MINUS_SRC_ALPHA, fes._gl.ONE, fes._gl.ONE_MINUS_SRC_ALPHA);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_ONEONE_ONEZERO:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.ONE, fes._gl.ONE, fes._gl.ONE, fes._gl.ZERO);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_EXCLUSION:
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.ONE_MINUS_DST_COLOR, fes._gl.ONE_MINUS_SRC_COLOR, fes._gl.ZERO, fes._gl.ONE);
            fes._alphaState.alphaBlend = true;
            break;
        case Constants.ALPHA_LAYER_ACCUMULATE:
            // Same as ALPHA_COMBINE but accumulates (1 - alpha) values in the alpha channel for a later readout in order independant transparency
            fes._alphaState.setAlphaBlendFunctionParameters(fes._gl.SRC_ALPHA, fes._gl.ONE_MINUS_SRC_ALPHA, fes._gl.ONE, fes._gl.ONE_MINUS_SRC_ALPHA);
            fes._alphaState.alphaBlend = true;
            break;
    }
    if (!noDepthWriteChange) {
        fes._depthCullingState.depthMask = mode === Constants.ALPHA_DISABLE;
    }
    fes._alphaMode = mode;
};

export const getAlphaMode: IAlphaEngineExtension["getAlphaMode"] = (engineState: IWebGLEnginePublic): number => {
    return (engineState as WebGLEngineStateFull)._alphaMode;
};

export const setAlphaEquation: IAlphaEngineExtension["setAlphaEquation"] = (engineState: IWebGLEnginePublic, equation: number): void => {
    const fes = engineState as WebGLEngineStateFull;
    if (fes._alphaEquation === equation) {
        return;
    }

    switch (equation) {
        case Constants.ALPHA_EQUATION_ADD:
            fes._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD);
            break;
        case Constants.ALPHA_EQUATION_SUBSTRACT:
            fes._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_SUBTRACT, Constants.GL_ALPHA_EQUATION_SUBTRACT);
            break;
        case Constants.ALPHA_EQUATION_REVERSE_SUBTRACT:
            fes._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_REVERSE_SUBTRACT, Constants.GL_ALPHA_EQUATION_REVERSE_SUBTRACT);
            break;
        case Constants.ALPHA_EQUATION_MAX:
            fes._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_MAX, Constants.GL_ALPHA_EQUATION_MAX);
            break;
        case Constants.ALPHA_EQUATION_MIN:
            fes._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_MIN, Constants.GL_ALPHA_EQUATION_MIN);
            break;
        case Constants.ALPHA_EQUATION_DARKEN:
            fes._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_MIN, Constants.GL_ALPHA_EQUATION_ADD);
            break;
    }
    fes._alphaEquation = equation;
};

export const getAlphaEquation: IAlphaEngineExtension["getAlphaEquation"] = (engineState: IWebGLEnginePublic) => {
    return (engineState as WebGLEngineStateFull)._alphaEquation;
};

export const alphaWebGLExtension: IAlphaEngineExtension = {
    setAlphaConstants,
    setAlphaMode,
    getAlphaMode,
    setAlphaEquation,
    getAlphaEquation,
};

export default alphaWebGLExtension;