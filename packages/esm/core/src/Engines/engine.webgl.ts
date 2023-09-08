import type { DataArray, IndicesArray, Nullable } from "core/types";
import type { IBaseEngineProtected, IBaseEnginePublic, IBaseEngineInternals } from "./engine.base";
import {
    initBaseEngineState,
    endFrame as endFrameBase,
    getRenderWidth as getRenderWidthBase,
    getRenderHeight as getRenderHeightBase,
    setViewport as setViewportBase,
    _viewport as _viewportBase,
} from "./engine.base";
import { WebGLShaderProcessor } from "core/Engines/WebGL/webGLShaderProcessors";
import type { DataBuffer } from "core/Buffers/dataBuffer";
import type { Effect } from "core/Materials/effect";
import type { IColor4Like, IViewportLike } from "core/Maths/math.like";
import {
    MATERIAL_LineListDrawMode,
    MATERIAL_LineLoopDrawMode,
    MATERIAL_LineStripDrawMode,
    MATERIAL_PointFillMode,
    MATERIAL_PointListDrawMode,
    MATERIAL_TriangleFanDrawMode,
    MATERIAL_TriangleFillMode,
    MATERIAL_TriangleStripDrawMode,
    MATERIAL_WireFrameFillMode,
    TEXTUREFORMAT_RED_INTEGER,
    TEXTUREFORMAT_RGBA_INTEGER,
    TEXTUREFORMAT_RGB_INTEGER,
    TEXTUREFORMAT_RG_INTEGER,
    TEXTURETYPE_UNSIGNED_INTEGER,
    TEXTURETYPE_UNSIGNED_SHORT,
} from "./engine.constants";
import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import type { WebGLRenderTargetWrapper } from "core/Engines/WebGL/webGLRenderTargetWrapper";
import * as _ from "lodash";
import { WebGLDataBuffer } from "core/Meshes/WebGL/webGLDataBuffer";
import type { WebGLPipelineContext } from "core/Engines/WebGL/webGLPipelineContext";
import type { IPipelineContext } from "core/Engines/IPipelineContext";
import type { VertexBuffer } from "core/Buffers/buffer";
import type { InstancingAttributeInfo } from "core/Engines/instancingAttributeInfo";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";

const _TempClearColorUint32 = new Uint32Array(4);
const _TempClearColorInt32 = new Int32Array(4);

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

/**
 * Gets an object containing information about the current webGL context
 * @param engineState defines the engine state
 * @returns an object containing the vendor, the renderer and the version of the current webGL context
 */
export function getGlInfo(engineState: IWebGLEnginePublic) {
    const gl = (engineState as WebGLEngineState)._gl;
    const glVersion = gl.getParameter(gl.VERSION);
    const glRenderer = gl.getParameter(gl.RENDERER);
    const glVendor = gl.getParameter(gl.VENDOR);
    return {
        glVersion,
        glRenderer,
        glVendor,
    };
}

/**
 * Gets the current render width
 * @param engineState defines the engine state
 * @param useScreen defines if screen size must be used (or the current render target if any)
 * @returns a number defining the current render width
 */
export function getRenderWidth(engineState: IWebGLEnginePublic, useScreen = false): number {
    return getRenderWidthBase(engineState, useScreen) || (engineState as WebGLEngineState)._gl.drawingBufferWidth;
}

/**
 * Gets the current render height
 * @param engineState defines the engine state
 * @param useScreen defines if screen size must be used (or the current render target if any)
 * @returns a number defining the current render height
 */
export function getRenderHeight(engineState: IWebGLEnginePublic, useScreen = false): number {
    return getRenderHeightBase(engineState, useScreen) || (engineState as WebGLEngineState)._gl.drawingBufferWidth;
}

/**
 * Begin a new frame
 */
export function beginFrame(engineState: IBaseEnginePublic): void {
    _measureFps(engineState);

    engineState.onBeginFrameObservable.notifyObservers(engineState);
}

/**
 * End the current frame
 * @param engineState defines the engine state
 */
export function endFrame(engineState: IBaseEnginePublic): void {
    endFrameBase(engineState);
    // Force a flush in case we are using a bad OS.
    if ((engineState as WebGLEngineState)._badOS) {
        flushFramebuffer(engineState as WebGLEngineState);
    }
    engineState.onEndFrameObservable.notifyObservers(engineState);
}

/**
 * Clear the current render buffer or the current render target (if any is set up)
 * @param color defines the color to use
 * @param backBuffer defines if the back buffer must be cleared
 * @param depth defines if the depth buffer must be cleared
 * @param stencil defines if the stencil buffer must be cleared
 */
export function clear(engineState: IWebGLEnginePublic, color: Nullable<IColor4Like>, backBuffer: boolean, depth: boolean, stencil: boolean = false): void {
    const fes = engineState as WebGLEngineStateFull;
    const useStencilGlobalOnly = engineState.stencilStateComposer.useStencilGlobalOnly;
    engineState.stencilStateComposer.useStencilGlobalOnly = true; // make sure the stencil mask is coming from the global stencil and not from a material (effect) which would currently be in effect

    applyStates(engineState);

    engineState.stencilStateComposer.useStencilGlobalOnly = useStencilGlobalOnly;

    let mode = 0;
    if (backBuffer && color) {
        let setBackBufferColor = true;
        if (fes._currentRenderTarget) {
            const textureFormat = fes._currentRenderTarget.texture?.format;
            if (
                textureFormat === TEXTUREFORMAT_RED_INTEGER ||
                textureFormat === TEXTUREFORMAT_RG_INTEGER ||
                textureFormat === TEXTUREFORMAT_RGB_INTEGER ||
                textureFormat === TEXTUREFORMAT_RGBA_INTEGER
            ) {
                const textureType = fes._currentRenderTarget.texture?.type;
                if (textureType === TEXTURETYPE_UNSIGNED_INTEGER || textureType === TEXTURETYPE_UNSIGNED_SHORT) {
                    _TempClearColorUint32[0] = color.r * 255;
                    _TempClearColorUint32[1] = color.g * 255;
                    _TempClearColorUint32[2] = color.b * 255;
                    _TempClearColorUint32[3] = color.a * 255;
                    fes._gl.clearBufferuiv(fes._gl.COLOR, 0, _TempClearColorUint32);
                    setBackBufferColor = false;
                } else {
                    _TempClearColorInt32[0] = color.r * 255;
                    _TempClearColorInt32[1] = color.g * 255;
                    _TempClearColorInt32[2] = color.b * 255;
                    _TempClearColorInt32[3] = color.a * 255;
                    fes._gl.clearBufferiv(fes._gl.COLOR, 0, _TempClearColorInt32);
                    setBackBufferColor = false;
                }
            }
        }

        if (setBackBufferColor) {
            fes._gl.clearColor(color.r, color.g, color.b, color.a !== undefined ? color.a : 1.0);
            mode |= fes._gl.COLOR_BUFFER_BIT;
        }
    }

    if (depth) {
        if (engineState.useReverseDepthBuffer) {
            fes._depthCullingState.depthFunc = fes._gl.GEQUAL;
            fes._gl.clearDepth(0.0);
        } else {
            fes._gl.clearDepth(1.0);
        }
        mode |= fes._gl.DEPTH_BUFFER_BIT;
    }
    if (stencil) {
        fes._gl.clearStencil(0);
        mode |= fes._gl.STENCIL_BUFFER_BIT;
    }
    fes._gl.clear(mode);
}

/**
 * Apply all cached states (depth, culling, stencil and alpha)
 */
export function applyStates(engineState: IWebGLEnginePublic): void {
    const fes = engineState as WebGLEngineStateFull;
    fes._depthCullingState.apply(fes._gl);
    fes._stencilStateComposer.apply(fes._gl);
    fes._alphaState.apply(fes._gl);

    if (fes._colorWriteChanged) {
        fes._colorWriteChanged = false;
        const enable = fes._colorWrite;
        fes._gl.colorMask(enable, enable, enable, enable);
    }
}

/**
 * Force a WebGPU flush (ie. a flush of all waiting commands)
 * @param reopenPass true to reopen at the end of the function the pass that was active when entering the function
 */
export function flushFramebuffer(engineState: IWebGLEnginePublic): void {
    const fes = engineState as WebGLEngineStateFull;
    fes._gl.flush();
}

// This can be solved using `bind`, but bind is not type-safe.
const setViewportInjectedMethods = {
    viewportChangedFunc: _viewport,
    getRenderHeightFunc: getRenderHeight,
    getRenderWidthFunc: getRenderWidth,
};
export const setViewport = (engineState: IWebGLEnginePublic, viewport: IViewportLike, requiredWidth?: number, requiredHeight?: number): void => {
    setViewportBase(setViewportInjectedMethods, engineState, viewport, requiredWidth, requiredHeight);
};

/**
 * Binds the frame buffer to the specified texture.
 * @param rtWrapper The render target wrapper to render to
 * @param faceIndex The face of the texture to render to in case of cube texture and if the render target wrapper is not a multi render target
 * @param requiredWidth The width of the target to render to
 * @param requiredHeight The height of the target to render to
 * @param forceFullscreenViewport Forces the viewport to be the entire texture/screen if true
 * @param lodLevel Defines the lod level to bind to the frame buffer
 * @param layer Defines the 2d array index to bind to the frame buffer if the render target wrapper is not a multi render target
 */
export function bindFramebuffer(
    engineState: IWebGLEnginePublic,
    rtWrapper: RenderTargetWrapper,
    faceIndex: number = 0,
    requiredWidth?: number,
    requiredHeight?: number,
    forceFullscreenViewport?: boolean,
    lodLevel = 0,
    layer = 0
): void {
    const webglRTWrapper = rtWrapper as WebGLRenderTargetWrapper;
    const fes = engineState as WebGLEngineStateFull;
    if (fes._currentRenderTarget) {
        unBindFramebuffer(engineState, fes._currentRenderTarget);
    }
    fes._currentRenderTarget = rtWrapper;
    _bindUnboundFramebuffer(engineState, webglRTWrapper._MSAAFramebuffer ? webglRTWrapper._MSAAFramebuffer : webglRTWrapper._framebuffer);

    const gl = fes._gl;
    if (!rtWrapper.isMulti) {
        if (rtWrapper.is2DArray) {
            gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, rtWrapper.texture!._hardwareTexture?.underlyingResource, lodLevel, layer);
        } else if (rtWrapper.isCube) {
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex,
                rtWrapper.texture!._hardwareTexture?.underlyingResource,
                lodLevel
            );
        }
    }

    const depthStencilTexture = rtWrapper._depthStencilTexture;
    if (depthStencilTexture) {
        const attachment = rtWrapper._depthStencilTextureWithStencil ? gl.DEPTH_STENCIL_ATTACHMENT : gl.DEPTH_ATTACHMENT;
        if (rtWrapper.is2DArray) {
            gl.framebufferTextureLayer(gl.FRAMEBUFFER, attachment, depthStencilTexture._hardwareTexture?.underlyingResource, lodLevel, layer);
        } else if (rtWrapper.isCube) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, depthStencilTexture._hardwareTexture?.underlyingResource, lodLevel);
        } else {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, depthStencilTexture._hardwareTexture?.underlyingResource, lodLevel);
        }
    }

    if (fes._cachedViewport && !forceFullscreenViewport) {
        setViewport(engineState, fes._cachedViewport, requiredWidth, requiredHeight);
    } else {
        if (!requiredWidth) {
            requiredWidth = rtWrapper.width;
            if (lodLevel) {
                requiredWidth = requiredWidth / Math.pow(2, lodLevel);
            }
        }
        if (!requiredHeight) {
            requiredHeight = rtWrapper.height;
            if (lodLevel) {
                requiredHeight = requiredHeight / Math.pow(2, lodLevel);
            }
        }

        _viewport(engineState, 0, 0, requiredWidth, requiredHeight);
    }

    wipeCaches(engineState);
}

/**
 * @internal
 */
export function _viewport(engineState: IWebGLEnginePublic, x: number, y: number, width: number, height: number): void {
    _viewportBase(engineState, x, y, width, height);
    const fes = engineState as WebGLEngineStateFull;
    if (x !== fes._viewportCached.x || y !== fes._viewportCached.y || width !== fes._viewportCached.z || height !== fes._viewportCached.w) {
        fes._gl.viewport(x, y, width, height);
    }
}

/**
 * @internal
 */
function _bindUnboundFramebuffer(engineState: IWebGLEnginePublic, framebuffer: Nullable<WebGLFramebuffer>) {
    const fes = engineState as WebGLEngineStateFull;
    if (fes._currentFramebuffer !== framebuffer) {
        fes._gl.bindFramebuffer(fes._gl.FRAMEBUFFER, framebuffer);
        fes._currentFramebuffer = framebuffer;
    }
}

/**
 * Unbind the current render target texture from the webGL context
 * @param texture defines the render target wrapper to unbind
 * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
 * @param onBeforeUnbind defines a function which will be called before the effective unbind
 */
export function unBindFramebuffer(engineState: IWebGLEnginePublic, texture: RenderTargetWrapper, disableGenerateMipMaps = false, onBeforeUnbind?: () => void): void {
    const fes = engineState as WebGLEngineStateFull;
    const webglRTWrapper = texture as WebGLRenderTargetWrapper;

    fes._currentRenderTarget = null;

    // If MSAA, we need to bitblt back to main texture
    const gl = fes._gl;
    if (webglRTWrapper._MSAAFramebuffer) {
        if (texture.isMulti) {
            // This texture is part of a MRT texture, we need to treat all attachments
            unBindMultiColorAttachmentFramebuffer(texture, disableGenerateMipMaps, onBeforeUnbind);
            return;
        }
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, webglRTWrapper._MSAAFramebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, webglRTWrapper._framebuffer);
        gl.blitFramebuffer(0, 0, texture.width, texture.height, 0, 0, texture.width, texture.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    }

    if (texture.texture?.generateMipMaps && !disableGenerateMipMaps && !texture.isCube) {
        generateMipmaps(engineState, texture.texture);
    }

    if (onBeforeUnbind) {
        if (webglRTWrapper._MSAAFramebuffer) {
            // Bind the correct framebuffer
            _bindUnboundFramebuffer(webglRTWrapper._framebuffer);
        }
        onBeforeUnbind();
    }

    _bindUnboundFramebuffer(null);
}

/**
 * Generates the mipmaps for a texture
 * @param texture texture to generate the mipmaps for
 */
export function generateMipmaps(engineState: IWebGLEnginePublic, texture: InternalTexture): void {
    const fes = engineState as WebGLEngineStateFull;
    _bindTextureDirectly(engineState, fes._gl.TEXTURE_2D, texture, true);
    fes._gl.generateMipmap(fes._gl.TEXTURE_2D);
    _bindTextureDirectly(engineState, fes._gl.TEXTURE_2D, null);
}

/**
 * Unbind the current render target and bind the default framebuffer
 */
export function restoreDefaultFramebuffer(engineState: IWebGLEnginePublic): void {
    const fes = engineState as WebGLEngineStateFull;
    if (fes._currentRenderTarget) {
        unBindFramebuffer(engineState, fes._currentRenderTarget);
    } else {
        _bindUnboundFramebuffer(engineState, null);
    }
    if (fes._cachedViewport) {
        setViewport(engineState, fes._cachedViewport);
    }

    wipeCaches(engineState);
}

/**
 * Bind a webGL buffer to the webGL context
 * @param buffer defines the buffer to bind
 */
export function bindArrayBuffer(engineState: IWebGLEnginePublic, buffer: Nullable<DataBuffer>): void {
    const fes = engineState as WebGLEngineState;
    if (!fes._vaoRecordInProgress) {
        _unbindVertexArrayObject();
    }
    _bindBuffer(buffer, fes._gl.ARRAY_BUFFER);
}

/** @internal */
function _resetVertexBufferBinding(engineState: IWebGLEnginePublic): void {
    const fes = engineState as WebGLEngineState;
    bindArrayBuffer(engineState, null);
    fes._cachedVertexBuffers = null;
}

/**
 * Creates a dynamic vertex buffer
 * @param data the data for the dynamic vertex buffer
 * @returns the new WebGL dynamic buffer
 */
export function createDynamicVertexBuffer(engineState: IWebGLEnginePublic, data: DataArray): DataBuffer {
    const fes = engineState as WebGLEngineState;
    return _createVertexBuffer(engineState, data, fes._gl.DYNAMIC_DRAW);
}

/**
 * Creates a vertex buffer
 * @param data the data for the vertex buffer
 * @returns the new WebGL static buffer
 */
export function createVertexBuffer(engineState: IWebGLEnginePublic, data: DataArray): DataBuffer {
    const fes = engineState as WebGLEngineState;
    return _createVertexBuffer(engineState, data, fes._gl.STATIC_DRAW);
}

function _createVertexBuffer(engineState: IWebGLEnginePublic, data: DataArray, usage: number): DataBuffer {
    const fes = engineState as WebGLEngineState;
    const vbo = fes._gl.createBuffer();

    if (!vbo) {
        throw new Error("Unable to create vertex buffer");
    }

    const dataBuffer = new WebGLDataBuffer(vbo);
    bindArrayBuffer(engineState, dataBuffer);

    if (data instanceof Array) {
        fes._gl.bufferData(fes._gl.ARRAY_BUFFER, new Float32Array(data), usage);
    } else {
        fes._gl.bufferData(fes._gl.ARRAY_BUFFER, <ArrayBuffer>data, usage);
    }

    _resetVertexBufferBinding(engineState);

    dataBuffer.references = 1;
    return dataBuffer;
}

/**
 * @internal
 */
export function _resetIndexBufferBinding(engineState: IWebGLEnginePublic): void {
    bindIndexBuffer(engineState, null);
    (engineState as WebGLEngineState)._cachedIndexBuffer = null;
}

/**
 * Creates a new index buffer
 * @param indices defines the content of the index buffer
 * @param updatable defines if the index buffer must be updatable
 * @returns a new webGL buffer
 */
export function createIndexBuffer(engineState: IWebGLEnginePublic, indices: IndicesArray, updatable?: boolean): DataBuffer {
    const fes = engineState as WebGLEngineState;
    const vbo = fes._gl.createBuffer();
    const dataBuffer = new WebGLDataBuffer(vbo!);

    if (!vbo) {
        throw new Error("Unable to create index buffer");
    }

    bindIndexBuffer(engineState, dataBuffer);

    const data = _normalizeIndexData(engineState, indices);
    fes._gl.bufferData(fes._gl.ELEMENT_ARRAY_BUFFER, data, updatable ? fes._gl.DYNAMIC_DRAW : fes._gl.STATIC_DRAW);
    _resetIndexBufferBinding(engineState);
    dataBuffer.references = 1;
    dataBuffer.is32Bits = data.BYTES_PER_ELEMENT === 4;
    return dataBuffer;
}

/**
 * @internal
 */
export function _normalizeIndexData(engineState: IWebGLEnginePublic, indices: IndicesArray): Uint16Array | Uint32Array {
    const bytesPerElement = (indices as Exclude<IndicesArray, number[]>).BYTES_PER_ELEMENT;
    if (bytesPerElement === 2) {
        return indices as Uint16Array;
    }

    // Check 32 bit support
    if ((engineState as WebGLEngineState)._caps.uintIndices) {
        if (indices instanceof Uint32Array) {
            return indices;
        } else {
            // number[] or Int32Array, check if 32 bit is necessary
            for (let index = 0; index < indices.length; index++) {
                if (indices[index] >= 65535) {
                    return new Uint32Array(indices);
                }
            }

            return new Uint16Array(indices);
        }
    }

    // No 32 bit support, force conversion to 16 bit (values greater 16 bit are lost)
    return new Uint16Array(indices);
}

/**
 * Bind a specific block at a given index in a specific shader program
 * @param pipelineContext defines the pipeline context to use
 * @param blockName defines the block name
 * @param index defines the index where to bind the block
 */
export function bindUniformBlock(engineState: IWebGLEnginePublic, pipelineContext: IPipelineContext, blockName: string, index: number): void {
    const fes = engineState as WebGLEngineStateFull;
    const program = (pipelineContext as WebGLPipelineContext).program!;

    const uniformLocation = fes._gl.getUniformBlockIndex(program, blockName);

    fes._gl.uniformBlockBinding(program, uniformLocation, index);
}

/**
 * was bindIndexBuffer
 * @internal
 */
export function _bindIndexBuffer(engineState: IWebGLEnginePublic, buffer: Nullable<DataBuffer>): void {
    const fes = engineState as WebGLEngineStateFull;
    if (!fes._vaoRecordInProgress) {
        _unbindVertexArrayObject(engineState);
    }
    _bindBuffer(engineState, buffer, fes._gl.ELEMENT_ARRAY_BUFFER);
}

function _bindBuffer(engineState: IWebGLEnginePublic, buffer: Nullable<DataBuffer>, target: number): void {
    const fes = engineState as WebGLEngineStateFull;
    if (fes._vaoRecordInProgress || fes._currentBoundBuffer[target] !== buffer) {
        fes._gl.bindBuffer(target, buffer ? buffer.underlyingResource : null);
        fes._currentBoundBuffer[target] = buffer;
    }
}

/**
 * update the bound buffer with the given data
 * @param data defines the data to update
 */
export function updateArrayBuffer(engineState: IWebGLEnginePublic, data: Float32Array): void {
    const fes = engineState as WebGLEngineStateFull;
    fes._gl.bufferSubData(fes._gl.ARRAY_BUFFER, 0, data);
}

function _vertexAttribPointer(
    engineState: IWebGLEnginePublic,
    buffer: DataBuffer,
    indx: number,
    size: number,
    type: number,
    normalized: boolean,
    stride: number,
    offset: number
): void {
    const fes = engineState as WebGLEngineStateFull;
    const pointer = fes._currentBufferPointers[indx];
    if (!pointer) {
        return;
    }

    let changed = false;
    if (!pointer.active) {
        changed = true;
        pointer.active = true;
        pointer.index = indx;
        pointer.size = size;
        pointer.type = type;
        pointer.normalized = normalized;
        pointer.stride = stride;
        pointer.offset = offset;
        pointer.buffer = buffer;
    } else {
        if (pointer.buffer !== buffer) {
            pointer.buffer = buffer;
            changed = true;
        }
        if (pointer.size !== size) {
            pointer.size = size;
            changed = true;
        }
        if (pointer.type !== type) {
            pointer.type = type;
            changed = true;
        }
        if (pointer.normalized !== normalized) {
            pointer.normalized = normalized;
            changed = true;
        }
        if (pointer.stride !== stride) {
            pointer.stride = stride;
            changed = true;
        }
        if (pointer.offset !== offset) {
            pointer.offset = offset;
            changed = true;
        }
    }

    if (changed || fes._vaoRecordInProgress) {
        bindArrayBuffer(engineState, buffer);
        if (type === fes._gl.UNSIGNED_INT || type === fes._gl.INT) {
            fes._gl.vertexAttribIPointer(indx, size, type, stride, offset);
        } else {
            fes._gl.vertexAttribPointer(indx, size, type, normalized, stride, offset);
        }
    }
}

/**
 * @internal
 */
export function _bindIndexBufferWithCache(engineState: IWebGLEnginePublic, indexBuffer: Nullable<DataBuffer>): void {
    const fes = engineState as WebGLEngineStateFull;
    if (indexBuffer == null) {
        return;
    }
    if (fes._cachedIndexBuffer !== indexBuffer) {
        fes._cachedIndexBuffer = indexBuffer;
        bindIndexBuffer(engineState, indexBuffer);
        fes._uintIndicesCurrentlySet = indexBuffer.is32Bits;
    }
}

function _bindVertexBuffersAttributes(
    engineState: IWebGLEnginePublic,
    vertexBuffers: { [key: string]: Nullable<VertexBuffer> },
    effect: Effect,
    overrideVertexBuffers?: { [kind: string]: Nullable<VertexBuffer> }
): void {
    const fes = engineState as WebGLEngineStateFull;
    const attributes = effect.getAttributesNames();

    if (!fes._vaoRecordInProgress) {
        _unbindVertexArrayObject(engineState);
    }

    unbindAllAttributes(engineState);

    for (let index = 0; index < attributes.length; index++) {
        const order = effect.getAttributeLocation(index);

        if (order >= 0) {
            const ai = attributes[index];
            let vertexBuffer: Nullable<VertexBuffer> = null;

            if (overrideVertexBuffers) {
                vertexBuffer = overrideVertexBuffers[ai];
            }

            if (!vertexBuffer) {
                vertexBuffer = vertexBuffers[ai];
            }

            if (!vertexBuffer) {
                continue;
            }

            fes._gl.enableVertexAttribArray(order);
            if (!fes._vaoRecordInProgress) {
                fes._vertexAttribArraysEnabled[order] = true;
            }

            const buffer = vertexBuffer.getBuffer();
            if (buffer) {
                _vertexAttribPointer(
                    engineState,
                    buffer,
                    order,
                    vertexBuffer.getSize(),
                    vertexBuffer.type,
                    vertexBuffer.normalized,
                    vertexBuffer.byteStride,
                    vertexBuffer.byteOffset
                );

                if (vertexBuffer.getIsInstanced()) {
                    fes._gl.vertexAttribDivisor(order, vertexBuffer.getInstanceDivisor());
                    if (!fes._vaoRecordInProgress) {
                        fes._currentInstanceLocations.push(order);
                        fes._currentInstanceBuffers.push(buffer);
                    }
                }
            }
        }
    }
}

/**
 * Records a vertex array object
 * @see https://doc.babylonjs.com/setup/support/webGL2#vertex-array-objects
 * @param vertexBuffers defines the list of vertex buffers to store
 * @param indexBuffer defines the index buffer to store
 * @param effect defines the effect to store
 * @param overrideVertexBuffers defines optional list of avertex buffers that overrides the entries in vertexBuffers
 * @returns the new vertex array object
 */
export function recordVertexArrayObject(
    engineState: IWebGLEnginePublic,
    vertexBuffers: { [key: string]: VertexBuffer },
    indexBuffer: Nullable<DataBuffer>,
    effect: Effect,
    overrideVertexBuffers?: { [kind: string]: Nullable<VertexBuffer> }
): WebGLVertexArrayObject {
    const fes = engineState as WebGLEngineStateFull;
    const vao = fes._gl.createVertexArray();

    if (!vao) {
        throw new Error("Unable to create VAO");
    }

    fes._vaoRecordInProgress = true;

    fes._gl.bindVertexArray(vao);

    fes._mustWipeVertexAttributes = true;
    _bindVertexBuffersAttributes(engineState, vertexBuffers, effect, overrideVertexBuffers);

    bindIndexBuffer(engineState, indexBuffer);

    fes._vaoRecordInProgress = false;
    fes._gl.bindVertexArray(null);

    return vao;
}

/**
 * Bind a specific vertex array object
 * @see https://doc.babylonjs.com/setup/support/webGL2#vertex-array-objects
 * @param vertexArrayObject defines the vertex array object to bind
 * @param indexBuffer defines the index buffer to bind
 */
export function bindVertexArrayObject(engineState: IWebGLEnginePublic, vertexArrayObject: WebGLVertexArrayObject, indexBuffer: Nullable<DataBuffer>): void {
    const fes = engineState as WebGLEngineStateFull;
    if (fes._cachedVertexArrayObject !== vertexArrayObject) {
        fes._cachedVertexArrayObject = vertexArrayObject;

        fes._gl.bindVertexArray(vertexArrayObject);
        fes._cachedVertexBuffers = null;
        fes._cachedIndexBuffer = null;

        fes._uintIndicesCurrentlySet = indexBuffer != null && indexBuffer.is32Bits;
        fes._mustWipeVertexAttributes = true;
    }
}

/**
 * Bind webGl buffers directly to the webGL context
 * @param vertexBuffer defines the vertex buffer to bind
 * @param indexBuffer defines the index buffer to bind
 * @param vertexDeclaration defines the vertex declaration to use with the vertex buffer
 * @param vertexStrideSize defines the vertex stride of the vertex buffer
 * @param effect defines the effect associated with the vertex buffer
 */
export function bindBuffersDirectly(
    engineState: IWebGLEnginePublic,
    vertexBuffer: DataBuffer,
    indexBuffer: DataBuffer,
    vertexDeclaration: number[],
    vertexStrideSize: number,
    effect: Effect
): void {
    const fes = engineState as WebGLEngineStateFull;
    if (fes._cachedVertexBuffers !== vertexBuffer || fes._cachedEffectForVertexBuffers !== effect) {
        fes._cachedVertexBuffers = vertexBuffer;
        fes._cachedEffectForVertexBuffers = effect;

        const attributesCount = effect.getAttributesCount();

        _unbindVertexArrayObject(engineState);
        unbindAllAttributes(engineState);

        let offset = 0;
        for (let index = 0; index < attributesCount; index++) {
            if (index < vertexDeclaration.length) {
                const order = effect.getAttributeLocation(index);

                if (order >= 0) {
                    fes._gl.enableVertexAttribArray(order);
                    fes._vertexAttribArraysEnabled[order] = true;
                    _vertexAttribPointer(engineState, vertexBuffer, order, vertexDeclaration[index], fes._gl.FLOAT, false, vertexStrideSize, offset);
                }

                offset += vertexDeclaration[index] * 4;
            }
        }
    }

    _bindIndexBufferWithCache(engineState, indexBuffer);
}

function _unbindVertexArrayObject(engineState: IWebGLEnginePublic): void {
    const fes = engineState as WebGLEngineStateFull;
    if (!fes._cachedVertexArrayObject) {
        return;
    }

    fes._cachedVertexArrayObject = null;
    fes._gl.bindVertexArray(null);
}

/**
 * Bind a list of vertex buffers to the webGL context
 * @param vertexBuffers defines the list of vertex buffers to bind
 * @param indexBuffer defines the index buffer to bind
 * @param effect defines the effect associated with the vertex buffers
 * @param overrideVertexBuffers defines optional list of avertex buffers that overrides the entries in vertexBuffers
 */
export function bindBuffers(
    engineState: IWebGLEnginePublic,
    vertexBuffers: { [key: string]: Nullable<VertexBuffer> },
    indexBuffer: Nullable<DataBuffer>,
    effect: Effect,
    overrideVertexBuffers?: { [kind: string]: Nullable<VertexBuffer> }
): void {
    const fes = engineState as WebGLEngineStateFull;
    if (fes._cachedVertexBuffers !== vertexBuffers || fes._cachedEffectForVertexBuffers !== effect) {
        fes._cachedVertexBuffers = vertexBuffers;
        fes._cachedEffectForVertexBuffers = effect;

        _bindVertexBuffersAttributes(engineState, vertexBuffers, effect, overrideVertexBuffers);
    }

    _bindIndexBufferWithCache(engineState, indexBuffer);
}

/**
 * Unbind all instance attributes
 */
export function unbindInstanceAttributes(engineState: IWebGLEnginePublic) {
    let boundBuffer;
    const fes = engineState as WebGLEngineStateFull;
    for (let i = 0, ul = fes._currentInstanceLocations.length; i < ul; i++) {
        const instancesBuffer = fes._currentInstanceBuffers[i];
        if (boundBuffer != instancesBuffer && instancesBuffer.references) {
            boundBuffer = instancesBuffer;
            bindArrayBuffer(engineState, instancesBuffer);
        }
        const offsetLocation = fes._currentInstanceLocations[i];
        fes._gl.vertexAttribDivisor(offsetLocation, 0);
    }
    fes._currentInstanceBuffers.length = 0;
    fes._currentInstanceLocations.length = 0;
}

/**
 * Release and free the memory of a vertex array object
 * @param vao defines the vertex array object to delete
 */
export function releaseVertexArrayObject(engineState: IWebGLEnginePublic, vao: WebGLVertexArrayObject) {
    (engineState as WebGLEngineStateFull)._gl.deleteVertexArray(vao);
}

/**
 * @internal
 */
export function _releaseBuffer(engineState: IWebGLEnginePublic, buffer: DataBuffer): boolean {
    buffer.references--;

    if (buffer.references === 0) {
        _deleteBuffer(engineState, buffer);
        return true;
    }

    return false;
}

// was protected
function _deleteBuffer(engineState: IWebGLEnginePublic, buffer: DataBuffer): void {
    (engineState as WebGLEngineStateFull)._gl.deleteBuffer(buffer.underlyingResource);
}

/**
 * Update the content of a webGL buffer used with instantiation and bind it to the webGL context
 * @param instancesBuffer defines the webGL buffer to update and bind
 * @param data defines the data to store in the buffer
 * @param offsetLocations defines the offsets or attributes information used to determine where data must be stored in the buffer
 */
export function updateAndBindInstancesBuffer(
    engineState: IWebGLEnginePublic,
    instancesBuffer: DataBuffer,
    data: Float32Array,
    offsetLocations: number[] | InstancingAttributeInfo[]
): void {
    const fes = engineState as WebGLEngineStateFull;
    bindArrayBuffer(engineState, instancesBuffer);
    if (data) {
        fes._gl.bufferSubData(fes._gl.ARRAY_BUFFER, 0, data);
    }

    if ((<any>offsetLocations[0]).index !== undefined) {
        bindInstancesBuffer(engineState, instancesBuffer, offsetLocations as any, true);
    } else {
        for (let index = 0; index < 4; index++) {
            const offsetLocation = <number>offsetLocations[index];

            if (!fes._vertexAttribArraysEnabled[offsetLocation]) {
                fes._gl.enableVertexAttribArray(offsetLocation);
                fes._vertexAttribArraysEnabled[offsetLocation] = true;
            }

            _vertexAttribPointer(engineState, instancesBuffer, offsetLocation, 4, fes._gl.FLOAT, false, 64, index * 16);
            fes._gl.vertexAttribDivisor(offsetLocation, 1);
            fes._currentInstanceLocations.push(offsetLocation);
            fes._currentInstanceBuffers.push(instancesBuffer);
        }
    }
}

/**
 * Bind the content of a webGL buffer used with instantiation
 * @param instancesBuffer defines the webGL buffer to bind
 * @param attributesInfo defines the offsets or attributes information used to determine where data must be stored in the buffer
 * @param computeStride defines Whether to compute the strides from the info or use the default 0
 */
export function bindInstancesBuffer(engineState: IWebGLEnginePublic, instancesBuffer: DataBuffer, attributesInfo: InstancingAttributeInfo[], computeStride = true): void {
    const fes = engineState as WebGLEngineStateFull;
    bindArrayBuffer(engineState, instancesBuffer);

    let stride = 0;
    if (computeStride) {
        for (let i = 0; i < attributesInfo.length; i++) {
            const ai = attributesInfo[i];
            stride += ai.attributeSize * 4;
        }
    }

    for (let i = 0; i < attributesInfo.length; i++) {
        const ai = attributesInfo[i];
        if (ai.index === undefined) {
            ai.index = fes._currentEffect!.getAttributeLocationByName(ai.attributeName);
        }

        if (ai.index < 0) {
            continue;
        }

        if (!fes._vertexAttribArraysEnabled[ai.index]) {
            fes._gl.enableVertexAttribArray(ai.index);
            fes._vertexAttribArraysEnabled[ai.index] = true;
        }

        _vertexAttribPointer(engineState, instancesBuffer, ai.index, ai.attributeSize, ai.attributeType || fes._gl.FLOAT, ai.normalized || false, stride, ai.offset);
        fes._gl.vertexAttribDivisor(ai.index, ai.divisor === undefined ? 1 : ai.divisor);
        fes._currentInstanceLocations.push(ai.index);
        fes._currentInstanceBuffers.push(instancesBuffer);
    }
}

/**
 * Disable the instance attribute corresponding to the name in parameter
 * @param name defines the name of the attribute to disable
 */
export function disableInstanceAttributeByName(engineState: IWebGLEnginePublic, name: string) {
    const fes = engineState as WebGLEngineState;
    if (!fes._currentEffect) {
        return;
    }

    const attributeLocation = fes._currentEffect.getAttributeLocationByName(name);
    disableInstanceAttribute(attributeLocation);
}

/**
 * Disable the instance attribute corresponding to the location in parameter
 * @param attributeLocation defines the attribute location of the attribute to disable
 */
export function disableInstanceAttribute(engineState: IWebGLEnginePublic, attributeLocation: number) {
    let shouldClean = false;
    let index: number;
    const fes = engineState as WebGLEngineStateFull;
    while ((index = fes._currentInstanceLocations.indexOf(attributeLocation)) !== -1) {
        fes._currentInstanceLocations.splice(index, 1);
        fes._currentInstanceBuffers.splice(index, 1);

        shouldClean = true;
        index = fes._currentInstanceLocations.indexOf(attributeLocation);
    }

    if (shouldClean) {
        fes._gl.vertexAttribDivisor(attributeLocation, 0);
        disableAttributeByIndex(engineState, attributeLocation);
    }
}

/**
 * Disable the attribute corresponding to the location in parameter
 * @param attributeLocation defines the attribute location of the attribute to disable
 */
export function disableAttributeByIndex(engineState: IWebGLEnginePublic, attributeLocation: number) {
    const fes = engineState as WebGLEngineStateFull;
    fes._gl.disableVertexAttribArray(attributeLocation);
    fes._vertexAttribArraysEnabled[attributeLocation] = false;
    fes._currentBufferPointers[attributeLocation].active = false;
}

/**
 * Draw a list of indexed primitives
 * @param fillMode defines the primitive to use
 * @param indexStart defines the starting index
 * @param indexCount defines the number of index to draw
 * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
 */
export function drawElementsType(engineState: IWebGLEnginePublic, fillMode: number, indexStart: number, indexCount: number, instancesCount?: number): void {
    const fes = engineState as WebGLEngineStateFull;
    // Apply states
    applyStates(engineState);

    _reportDrawCall(engineState);

    // Render

    const drawMode = _drawMode(engineState, fillMode);
    const indexFormat = fes._uintIndicesCurrentlySet ? fes._gl.UNSIGNED_INT : fes._gl.UNSIGNED_SHORT;
    const mult = fes._uintIndicesCurrentlySet ? 4 : 2;
    if (instancesCount) {
        fes._gl.drawElementsInstanced(drawMode, indexCount, indexFormat, indexStart * mult, instancesCount);
    } else {
        fes._gl.drawElements(drawMode, indexCount, indexFormat, indexStart * mult);
    }
}

/**
 * Draw a list of unindexed primitives
 * @param fillMode defines the primitive to use
 * @param verticesStart defines the index of first vertex to draw
 * @param verticesCount defines the count of vertices to draw
 * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
 */
export function drawArraysType(engineState: IWebGLEnginePublic, fillMode: number, verticesStart: number, verticesCount: number, instancesCount?: number): void {
    const fes = engineState as WebGLEngineStateFull;
    // Apply states
    applyStates(engineState);

    _reportDrawCall(engineState);

    const drawMode = _drawMode(engineState, fillMode);
    if (instancesCount) {
        fes._gl.drawArraysInstanced(drawMode, verticesStart, verticesCount, instancesCount);
    } else {
        fes._gl.drawArrays(drawMode, verticesStart, verticesCount);
    }
}

function _drawMode(engineState: IWebGLEnginePublic, fillMode: number): number {
    const fes = engineState as WebGLEngineStateFull;
    switch (fillMode) {
        // Triangle views
        case MATERIAL_TriangleFillMode:
            return fes._gl.TRIANGLES;
        case MATERIAL_PointFillMode:
            return fes._gl.POINTS;
        case MATERIAL_WireFrameFillMode:
            return fes._gl.LINES;
        // Draw modes
        case MATERIAL_PointListDrawMode:
            return fes._gl.POINTS;
        case MATERIAL_LineListDrawMode:
            return fes._gl.LINES;
        case MATERIAL_LineLoopDrawMode:
            return fes._gl.LINE_LOOP;
        case MATERIAL_LineStripDrawMode:
            return fes._gl.LINE_STRIP;
        case MATERIAL_TriangleStripDrawMode:
            return fes._gl.TRIANGLE_STRIP;
        case MATERIAL_TriangleFanDrawMode:
            return fes._gl.TRIANGLE_FAN;
        default:
            return fes._gl.TRIANGLES;
    }
}

/**
 * @internal
 */
export function _deletePipelineContext(engineState: IWebGLEnginePublic,pipelineContext: IPipelineContext): void {
    const fes = engineState as WebGLEngineStateFull;
    const webGLPipelineContext = pipelineContext as WebGLPipelineContext;
    if (webGLPipelineContext && webGLPipelineContext.program) {
        if (webGLPipelineContext.transformFeedback) {
            deleteTransformFeedback(webGLPipelineContext.transformFeedback);
            webGLPipelineContext.transformFeedback = null;
        }
        webGLPipelineContext.program.__SPECTOR_rebuildProgram = null;

        fes._gl.deleteProgram(webGLPipelineContext.program);
    }
}
