import type { Nullable } from "core/types";
import type { IBaseEngineProtected, IBaseEnginePublic, IBaseEngineInternals } from "./engine.base";
import { initBaseEngineState } from "./engine.base";
import { WebGLShaderProcessor } from "core/Engines/WebGL/webGLShaderProcessors";
import type { DataBuffer } from "core/Buffers/dataBuffer";
import type { Effect } from "core/Materials/effect";

/**
 * Keeps track of all the buffer info used in engine.
 */
class BufferPointer {
    public active: boolean;
    public index: number;
    public size: number;
    public type: number;
    public normalized: boolean;
    public stride: number;
    public offset: number;
    public buffer: WebGLBuffer;
}

interface IWebGLEnginePrivate {
    _glVersion: string;
    _glRenderer: string;
    _glVendor: string;
    _cachedVertexArrayObject: Nullable<WebGLVertexArrayObject>;
    _uintIndicesCurrentlySet: boolean;
    _currentBufferPointers: BufferPointer[];
    _currentInstanceLocations: number[];
    _currentInstanceBuffers: DataBuffer[];
    _textureUnits: Int32Array;
    _vaoRecordInProgress: boolean;
    _mustWipeVertexAttributes: boolean;
    _nextFreeTextureSlots: Array<number>;
    _maxSimultaneousTextures: number;
    _maxMSAASamplesOverride: Nullable<number>;
    _supportsHardwareTextureRescaling: boolean; // can probably be taken out of here!
}

export interface IWebGLEngineProtected extends IBaseEngineProtected {
    _currentProgram: Nullable<WebGLProgram>;
    _cachedVertexBuffers: any; // TODO find type and should it be protected?
    _cachedIndexBuffer: Nullable<DataBuffer>;
    _cachedEffectForVertexBuffers: Nullable<Effect>;
    _currentBoundBuffer: Array<Nullable<DataBuffer>>;
}

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
    _currentFramebuffer: Nullable<WebGLFramebuffer>;
    _dummyFramebuffer: Nullable<WebGLFramebuffer>;
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
        isNDCHalfZRange: true,
        hasOriginBottomLeft: false,
        get supportsUniformBuffers() {
            return (baseEngineState as WebGLEngineStateFull)._webGLVersion > 1 && !baseEngineState.disableUniformBuffers;
        },
        get needPOTTextures(): boolean {
            return (baseEngineState as WebGLEngineStateFull)._webGLVersion < 2 || baseEngineState.forcePOTTextures;
        },
    });
    // public and protected
    const fes = baseEngineState as WebGLEngineState;
    fes._shaderProcessor = new WebGLShaderProcessor();
    
    // private
    const ps = fes as WebGLEngineStateFull;
    ps._uintIndicesCurrentlySet = false;
    ps._currentBoundBuffer = [];
    ps._currentFramebuffer = null;
    ps._dummyFramebuffer = null;
    ps._vaoRecordInProgress = false;
    ps._mustWipeVertexAttributes = false;
    ps._nextFreeTextureSlots = [];
    ps._maxSimultaneousTextures = 0;
    ps._maxMSAASamplesOverride = null;
    ps._supportsHardwareTextureRescaling = false;
    ps._version = ps._webGLVersion;
    return fes;
}
