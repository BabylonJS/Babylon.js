import type { IShaderProcessor } from "@babylonjs/core/Engines/Processors/iShaderProcessor.js";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage.js";
import type { Nullable } from "@babylonjs/core/types.js";
import { WebGPUShaderProcessorWGSL } from "@babylonjs/core/Engines/WebGPU/webgpuShaderProcessorsWGSL.js";
import { WebGPUShaderProcessorGLSL } from "@babylonjs/core/Engines/WebGPU/webgpuShaderProcessorsGLSL.js";
import type { IBaseEngineProtected, IBaseEnginePublic, IBaseEngineInternals } from "./engine.base.js";
import { initBaseEngineState } from "./engine.base.js";
import type { WebGPUSnapshotRendering } from "@babylonjs/core/Engines/WebGPU/webgpuSnapshotRendering.js";
import type { IDrawContext } from "@babylonjs/core/Engines/IDrawContext.js";
import type { IMaterialContext } from "@babylonjs/core/Engines/IMaterialContext.js";

interface IWebGPUEnginePrivate {
    _shaderProcessorWGSL: Nullable<IShaderProcessor>;
    _snapshotRendering: WebGPUSnapshotRendering;
}

export interface IWebGPUEngineProtected extends IBaseEngineProtected {}

export interface IWebGPUEngineInternals extends IBaseEngineInternals {
    _currentDrawContext: IDrawContext;
    _currentMaterialContext: IMaterialContext;
}

export interface IWebGPUEnginePublic extends IBaseEnginePublic {
    snapshotRendering: boolean;
    snapshotRenderingMode: number;
}

export type WebGPUEngineState = IWebGPUEnginePublic & IWebGPUEngineInternals & IWebGPUEngineProtected;
export type WebGPUEngineStateFull = WebGPUEngineState & IWebGPUEnginePrivate;

export function initWebGPUEngineState(): WebGPUEngineState {
    const baseEngineState = initBaseEngineState({
        name: "WebGPU",
        description: "Babylon.js WebGPU Engine",
        isNDCHalfZRange: true,
        hasOriginBottomLeft: false,
        needPOTTextures: false,
    });
    // public and protected
    const fes = baseEngineState as WebGPUEngineStateFull;
    fes._shaderProcessor = new WebGPUShaderProcessorGLSL();
    fes._shaderProcessorWGSL = new WebGPUShaderProcessorWGSL();
    // fes._snapshotRendering = new WebGPUSnapshotRendering(); // TODO

    // TODO - this is a hack to get the snapshotRendering property to work. Normalize it.
    Object.defineProperty(fes, "snapshotRendering", {
        get() {
            return (fes as WebGPUEngineStateFull)._snapshotRendering.enabled;
        },
        set(value) {
            (fes as WebGPUEngineStateFull)._snapshotRendering.enabled = value;
        },
    });
    Object.defineProperty(fes, "snapshotRenderingMode", {
        get() {
            return (fes as WebGPUEngineStateFull)._snapshotRendering.mode;
        },
        set(value) {
            (fes as WebGPUEngineStateFull)._snapshotRendering.mode = value;
        },
    });

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

export function isWebGPU(engineState: IBaseEnginePublic): engineState is WebGPUEngineState {
    return engineState.name === "WebGPU";
}

export function resetSnapshotRendering(engineState: IWebGPUEnginePublic) {
    (engineState as WebGPUEngineStateFull)._snapshotRendering.reset();
}

/**
 * @internal
 */
export function _getUseSRGBBuffer(engineState: IWebGPUEnginePublic, useSRGBBuffer: boolean, noMipmap: boolean): boolean {
    // Generating mipmaps for sRGB textures is not supported in WebGL1 so we must disable the support if mipmaps is enabled
    return useSRGBBuffer && (engineState as WebGPUEngineState)._caps.supportSRGBBuffers && (isWebGPU(engineState) || noMipmap);
}
