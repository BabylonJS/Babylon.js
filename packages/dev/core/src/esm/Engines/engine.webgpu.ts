import type { IShaderProcessor } from "core/Engines/Processors/iShaderProcessor";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { Nullable } from "core/types";
import { WebGPUShaderProcessorWGSL } from "core/Engines/WebGPU/webgpuShaderProcessorsWGSL";
import { WebGPUShaderProcessorGLSL } from "core/Engines/WebGPU/webgpuShaderProcessorsGLSL";
import type { IBaseEngineProtected, IBaseEnginePublic, IBaseEngineInternals } from "./engine.base";
import { initBaseEngineState } from "./engine.base";

interface IWebGPUEnginePrivate {
    _shaderProcessorWGSL: Nullable<IShaderProcessor>;
}

export interface IWebGPUEngineProtected extends IBaseEngineProtected {}

export interface IWebGPUEngineInternals extends IBaseEngineInternals {}

export interface IWebGPUEnginePublic extends IBaseEnginePublic {}

export type WebGPUEngineState = IWebGPUEnginePublic & IWebGPUEngineInternals & IWebGPUEngineProtected;
export type WebGPUEngineStateFull = WebGPUEngineState & IWebGPUEnginePrivate;

export function initWebGPUEngineState(): WebGPUEngineState {
    const baseEngineState = initBaseEngineState({
        name: "WebGPU",
        description: "Babylon.js WebGPU Engine",
        isNDCHalfZRange: true,
        hasOriginBottomLeft: false,
        needPOTTextures: false,
        get isWebGPU(): boolean {
            return true;
        },
    });
    // public and protected
    const fes = baseEngineState as WebGPUEngineState;
    fes._shaderProcessor = new WebGPUShaderProcessorGLSL();

    // private
    const ps = fes as WebGPUEngineStateFull;
    ps._shaderProcessorWGSL = new WebGPUShaderProcessorWGSL();

    return fes;
}

export function _getShaderProcessor(engineState: IWebGPUEnginePublic, shaderLanguage: ShaderLanguage): Nullable<IShaderProcessor> {
    // private member(s) of webgpu
    const { _shaderProcessorWGSL: shaderProcessorWGSL, _shaderProcessor } = engineState as WebGPUEngineStateFull;
    if (shaderLanguage === ShaderLanguage.WGSL) {
        return shaderProcessorWGSL;
    }
    return _shaderProcessor;
}
