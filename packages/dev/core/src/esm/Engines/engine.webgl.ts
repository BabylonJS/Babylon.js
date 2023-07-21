import type { IShaderProcessor } from "core/Engines/Processors/iShaderProcessor";
import type { Nullable } from "core/types";
import type { IBaseEngineProtected, IBaseEnginePublic, IBaseEngineInternals } from "./engine.base";
import { initBaseEngineState } from "./engine.base";
import { WebGLShaderProcessor } from "core/Engines/WebGL/webGLShaderProcessors";

interface IWebGLEnginePrivate {}

export interface IWebGLEngineProtected extends IBaseEngineProtected {}

export interface IWebGLEngineInternals extends IBaseEngineInternals {
    /** @internal */
    _webGLVersion: number;
    /** @internal */
    _gl: /* WebGLRenderingContext | */ WebGL2RenderingContext;
    /** @internal */
    _glSRGBExtensionValues: {
        SRGB: typeof WebGL2RenderingContext.SRGB;
        SRGB8: typeof WebGL2RenderingContext.SRGB8 | EXT_sRGB["SRGB_ALPHA_EXT"];
        SRGB8_ALPHA8: typeof WebGL2RenderingContext.SRGB8_ALPHA8 | EXT_sRGB["SRGB_ALPHA_EXT"];
    };
}

export interface IWebGLEnginePublic extends IBaseEnginePublic {
    // duplicate of "version" in IBaseEnginePublic
    webGLVersion: number;
}

export type WebGLEngineState = IWebGLEnginePublic & IWebGLEngineInternals & IWebGLEngineProtected;
export type WebGLEngineStateFull = WebGLEngineState & IWebGLEnginePrivate;

export function initWebGLEngineState(): WebGLEngineState {
    const baseEngineState = initBaseEngineState({
        name: "WebGL",
        description: "Babylon.js WebGL Engine",
        get version() {
            return (baseEngineState as WebGLEngineStateFull)._webGLVersion;
        },
        isNDCHalfZRange: true,
        hasOriginBottomLeft: false,
        get supportsUniformBuffers() {
            return (baseEngineState as WebGLEngineStateFull)._webGLVersion > 1 && !baseEngineState.disableUniformBuffers;
        }
    });
    // public and protected
    const fes = baseEngineState as WebGLEngineState;
    fes._shaderProcessor = new WebGLShaderProcessor();

    // private
    const ps = fes as WebGLEngineStateFull;

    return fes;
}
