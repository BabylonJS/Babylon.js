import type { IShaderProcessor } from "core/Engines/Processors/iShaderProcessor";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { Nullable } from "core/types";
import { WebGPUShaderProcessorWGSL } from "core/Engines/WebGPU/webgpuShaderProcessorsWGSL";
import { WebGPUShaderProcessorGLSL } from "core/Engines/WebGPU/webgpuShaderProcessorsGLSL";
import type { IBaseEngineProtected, IBaseEnginePublic, IBaseEngineInternals } from "./engine.base";
import { initBaseEngineState } from "./engine.base";
import type { WebGPUSnapshotRendering } from "core/Engines/WebGPU/webgpuSnapshotRendering";
import type { IDrawContext } from "core/Engines/IDrawContext";
import type { IMaterialContext } from "core/Engines/IMaterialContext";

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
