import type { DataArray, IndicesArray, Nullable } from "core/types";
import type { IBaseEngineProtected, IBaseEnginePublic, IBaseEngineInternals } from "./engine.base";
import {
    initBaseEngineState,
    endFrame as endFrameBase,
    getRenderWidth as getRenderWidthBase,
    getRenderHeight as getRenderHeightBase,
    setViewport as setViewportBase,
    _viewport as _viewportBase,
    _createTextureBase,
    resetTextureCache,
    _prepareWorkingCanvas,
    getHostDocument,
} from "./engine.base";
import { WebGLShaderProcessor } from "core/Engines/WebGL/webGLShaderProcessors";
import type { DataBuffer } from "core/Buffers/dataBuffer";
import type { IEffectCreationOptions } from "core/Materials/effect";
import { Effect } from "core/Materials/effect";
import type { IColor4Like, IViewportLike } from "core/Maths/math.like";
import {
    ALPHA_ADD,
    ALPHA_DISABLE,
    DELAYLOADSTATE_NOTLOADED,
    LEQUAL,
    MATERIAL_LineListDrawMode,
    MATERIAL_LineLoopDrawMode,
    MATERIAL_LineStripDrawMode,
    MATERIAL_PointFillMode,
    MATERIAL_PointListDrawMode,
    MATERIAL_TriangleFanDrawMode,
    MATERIAL_TriangleFillMode,
    MATERIAL_TriangleStripDrawMode,
    MATERIAL_WireFrameFillMode,
    TEXTUREFORMAT_ALPHA,
    TEXTUREFORMAT_COMPRESSED_RGB8_ETC2,
    TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC,
    TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4,
    TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM,
    TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1,
    TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5,
    TEXTUREFORMAT_COMPRESSED_RGB_ETC1_WEBGL,
    TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1,
    TEXTUREFORMAT_LUMINANCE,
    TEXTUREFORMAT_LUMINANCE_ALPHA,
    TEXTUREFORMAT_R,
    TEXTUREFORMAT_RED,
    TEXTUREFORMAT_RED_INTEGER,
    TEXTUREFORMAT_RG,
    TEXTUREFORMAT_RGB,
    TEXTUREFORMAT_RGBA,
    TEXTUREFORMAT_RGBA_INTEGER,
    TEXTUREFORMAT_RGB_INTEGER,
    TEXTUREFORMAT_RG_INTEGER,
    TEXTURETYPE_BYTE,
    TEXTURETYPE_FLOAT,
    TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV,
    TEXTURETYPE_HALF_FLOAT,
    TEXTURETYPE_INT,
    TEXTURETYPE_SHORT,
    TEXTURETYPE_UNSIGNED_BYTE,
    TEXTURETYPE_UNSIGNED_INT,
    TEXTURETYPE_UNSIGNED_INTEGER,
    TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV,
    TEXTURETYPE_UNSIGNED_INT_24_8,
    TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV,
    TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV,
    TEXTURETYPE_UNSIGNED_SHORT,
    TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4,
    TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1,
    TEXTURETYPE_UNSIGNED_SHORT_5_6_5,
    TEXTURE_BILINEAR_SAMPLINGMODE,
    TEXTURE_CLAMP_ADDRESSMODE,
    TEXTURE_CUBIC_MODE,
    TEXTURE_LINEAR_LINEAR,
    TEXTURE_LINEAR_LINEAR_MIPLINEAR,
    TEXTURE_LINEAR_LINEAR_MIPNEAREST,
    TEXTURE_LINEAR_NEAREST,
    TEXTURE_LINEAR_NEAREST_MIPLINEAR,
    TEXTURE_LINEAR_NEAREST_MIPNEAREST,
    TEXTURE_MIRROR_ADDRESSMODE,
    TEXTURE_NEAREST_LINEAR,
    TEXTURE_NEAREST_LINEAR_MIPLINEAR,
    TEXTURE_NEAREST_LINEAR_MIPNEAREST,
    TEXTURE_NEAREST_NEAREST,
    TEXTURE_NEAREST_NEAREST_MIPLINEAR,
    TEXTURE_NEAREST_NEAREST_MIPNEAREST,
    TEXTURE_NEAREST_SAMPLINGMODE,
    TEXTURE_SKYBOX_MODE,
    TEXTURE_TRILINEAR_SAMPLINGMODE,
    TEXTURE_WRAP_ADDRESSMODE,
} from "./engine.constants";
import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import type { WebGLRenderTargetWrapper } from "core/Engines/WebGL/webGLRenderTargetWrapper";
import * as _ from "lodash";
import { WebGLDataBuffer } from "core/Meshes/WebGL/webGLDataBuffer";
import { WebGLPipelineContext } from "core/Engines/WebGL/webGLPipelineContext";
import type { IPipelineContext } from "core/Engines/IPipelineContext";
import type { VertexBuffer } from "core/Buffers/buffer";
import type { InstancingAttributeInfo } from "core/Engines/instancingAttributeInfo";
import { InternalTextureSource, InternalTexture } from "core/Materials/Textures/internalTexture";
import { _loadFile, _reportDrawCall } from "./engine.tools";
import type { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import type { ThinTexture } from "core/Materials/Textures/thinTexture";
import type { VideoTexture } from "core/Materials/Textures/videoTexture";
import type { ISceneLike } from "./engine.interfaces";
import { GetExponentOfTwo } from "./engine.static";
import type { Scene } from "core/scene";
import type { InternalTextureCreationOptions, TextureSize } from "core/Materials/Textures/textureCreationOptions";
import { Logger } from "core/Misc/logger";
import type { HardwareTextureWrapper } from "core/Materials/Textures/hardwareTextureWrapper";
import { WebGLHardwareTexture } from "core/Engines/WebGL/webGLHardwareTexture";
import { Engine } from "core/Engines/engine";
import { DrawWrapper } from "core/Materials/drawWrapper";
import type { IEffectFallbacks } from "core/Materials/iEffectFallbacks";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { getEngineAdapter } from "./engine.adapters";
import { StencilStateComposer } from "core/States/stencilStateComposer";
import { DepthCullingState } from "core/States/depthCullingState";
import { StencilState } from "core/States/stencilState";
import { ThinEngine } from "core/Engines/thinEngine";

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
    _boundUniforms: { [key: string]: WebGLUniformLocation };
    _unpackFlipYCached: Nullable<boolean>;
    _vertexAttribArraysEnabled: boolean[];
    _currentTextureChannel: number;
}

interface IWebGLEngineProtected extends IBaseEngineProtected {
    _currentProgram: Nullable<WebGLProgram>;
    _cachedVertexBuffers: any; // TODO find type and should it be protected?
    _cachedIndexBuffer: Nullable<DataBuffer>;
    _cachedEffectForVertexBuffers: Nullable<Effect>;
    _currentBoundBuffer: Array<Nullable<DataBuffer>>;
    // overrides from base
    _depthCullingState: DepthCullingState;
    _stencilStateComposer: StencilStateComposer;
    _stencilState: StencilState;
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
    enableUnpackFlipYCached: boolean;
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
    ps.enableUnpackFlipYCached = true;
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
    ps._boundUniforms = {};
    ps._unpackFlipYCached = null;
    ps._vertexAttribArraysEnabled = [];
    ps._currentTextureChannel = -1;
    ps._stencilStateComposer = new StencilStateComposer();
    ps._depthCullingState = new DepthCullingState();
    ps._stencilState = new StencilState();
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

function _measureFps(engineState: IWebGLEnginePublic): void {
    const fes = engineState as WebGLEngineStateFull;
    if (fes._performanceMonitor) {
        fes._performanceMonitor.sampleFrame();
        fes._fps = fes._performanceMonitor.averageFPS;
        fes._deltaTime = fes._performanceMonitor.instantaneousFrameTime || 0;
    }
}

/**
 * Begin a new frame
 */
export function beginFrame(engineState: IWebGLEnginePublic): void {
    _measureFps(engineState);

    engineState.onBeginFrameObservable.notifyObservers(engineState);
}

/**
 * End the current frame
 * @param engineState defines the engine state
 */
export function endFrame(engineState: IWebGLEnginePublic): void {
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
    const useStencilGlobalOnly = fes._stencilStateComposer!.useStencilGlobalOnly;
    fes._stencilStateComposer!.useStencilGlobalOnly = true; // make sure the stencil mask is coming from the global stencil and not from a material (effect) which would currently be in effect

    applyStates(engineState);

    fes._stencilStateComposer!.useStencilGlobalOnly = useStencilGlobalOnly;

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
            fes._depthCullingState!.depthFunc = fes._gl.GEQUAL;
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
export const setViewport: (engineState: IWebGLEnginePublic, viewport: IViewportLike, requiredWidth?: number, requiredHeight?: number) => void = setViewportBase.bind(
    null,
    setViewportInjectedMethods
);

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
            _bindUnboundFramebuffer(engineState, webglRTWrapper._framebuffer);
        }
        onBeforeUnbind();
    }

    _bindUnboundFramebuffer(engineState, null);
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
    const fes = engineState as WebGLEngineStateFull;
    if (!fes._vaoRecordInProgress) {
        _unbindVertexArrayObject(fes);
    }
    _bindBuffer(engineState, buffer, fes._gl.ARRAY_BUFFER);
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
    _bindIndexBuffer(engineState, null);
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

    _bindIndexBuffer(engineState, dataBuffer);

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
        _bindIndexBuffer(engineState, indexBuffer);
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

    _bindIndexBuffer(engineState, indexBuffer);

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
    disableInstanceAttribute(engineState, attributeLocation);
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

    const drawMode = _drawMode(fes._gl, fillMode);
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

    const drawMode = _drawMode(fes._gl, fillMode);
    if (instancesCount) {
        fes._gl.drawArraysInstanced(drawMode, verticesStart, verticesCount, instancesCount);
    } else {
        fes._gl.drawArrays(drawMode, verticesStart, verticesCount);
    }
}

function _drawMode(gl: IWebGLEngineInternals["_gl"], fillMode: number): number {
    switch (fillMode) {
        // Triangle views
        case MATERIAL_TriangleFillMode:
            return gl.TRIANGLES;
        case MATERIAL_PointFillMode:
            return gl.POINTS;
        case MATERIAL_WireFrameFillMode:
            return gl.LINES;
        // Draw modes
        case MATERIAL_PointListDrawMode:
            return gl.POINTS;
        case MATERIAL_LineListDrawMode:
            return gl.LINES;
        case MATERIAL_LineLoopDrawMode:
            return gl.LINE_LOOP;
        case MATERIAL_LineStripDrawMode:
            return gl.LINE_STRIP;
        case MATERIAL_TriangleStripDrawMode:
            return gl.TRIANGLE_STRIP;
        case MATERIAL_TriangleFanDrawMode:
            return gl.TRIANGLE_FAN;
        default:
            return gl.TRIANGLES;
    }
}

/** @internal */
export function _getGlobalDefines(engineState: IWebGLEnginePublic, defines?: { [key: string]: string }): string | undefined {
    if (defines) {
        if (engineState.isNDCHalfZRange) {
            defines["IS_NDC_HALF_ZRANGE"] = "";
        } else {
            delete defines["IS_NDC_HALF_ZRANGE"];
        }
        if (engineState.useReverseDepthBuffer) {
            defines["USE_REVERSE_DEPTHBUFFER"] = "";
        } else {
            delete defines["USE_REVERSE_DEPTHBUFFER"];
        }
        if (engineState.useExactSrgbConversions) {
            defines["USE_EXACT_SRGB_CONVERSIONS"] = "";
        } else {
            delete defines["USE_EXACT_SRGB_CONVERSIONS"];
        }
        return;
    } else {
        let s = "";
        if (engineState.isNDCHalfZRange) {
            s += "#define IS_NDC_HALF_ZRANGE";
        }
        if (engineState.useReverseDepthBuffer) {
            if (s) {
                s += "\n";
            }
            s += "#define USE_REVERSE_DEPTHBUFFER";
        }
        if (engineState.useExactSrgbConversions) {
            if (s) {
                s += "\n";
            }
            s += "#define USE_EXACT_SRGB_CONVERSIONS";
        }
        return s;
    }
}

/**
 * Create a new effect (used to store vertex/fragment shaders)
 * @param baseName defines the base name of the effect (The name of file without .fragment.fx or .vertex.fx)
 * @param attributesNamesOrOptions defines either a list of attribute names or an IEffectCreationOptions object
 * @param uniformsNamesOrEngine defines either a list of uniform names or the engine to use
 * @param samplers defines an array of string used to represent textures
 * @param defines defines the string containing the defines to use to compile the shaders
 * @param fallbacks defines the list of potential fallbacks to use if shader compilation fails
 * @param onCompiled defines a function to call when the effect creation is successful
 * @param onError defines a function to call when the effect creation has failed
 * @param indexParameters defines an object containing the index values to use to compile shaders (like the maximum number of simultaneous lights)
 * @param shaderLanguage the language the shader is written in (default: GLSL)
 * @returns the new Effect
 */
export function createEffect(
    engineState: IWebGLEnginePublic,
    baseName: any,
    attributesNamesOrOptions: string[] | IEffectCreationOptions,
    uniformsNamesOrEngine: string[] | ThinEngine,
    samplers?: string[],
    defines?: string,
    fallbacks?: IEffectFallbacks,
    onCompiled?: Nullable<(effect: Effect) => void>,
    onError?: Nullable<(effect: Effect, errors: string) => void>,
    indexParameters?: any,
    shaderLanguage = ShaderLanguage.GLSL
): Effect {
    const fes = engineState as WebGLEngineStateFull;
    const vertex = baseName.vertexElement || baseName.vertex || baseName.vertexToken || baseName.vertexSource || baseName;
    const fragment = baseName.fragmentElement || baseName.fragment || baseName.fragmentToken || baseName.fragmentSource || baseName;
    const globalDefines = _getGlobalDefines(engineState)!;

    let fullDefines = defines ?? (<IEffectCreationOptions>attributesNamesOrOptions).defines ?? "";

    if (globalDefines) {
        fullDefines += globalDefines;
    }

    const name = vertex + "+" + fragment + "@" + fullDefines;
    if (fes._compiledEffects[name]) {
        const compiledEffect = <Effect>fes._compiledEffects[name];
        if (onCompiled && compiledEffect.isReady()) {
            onCompiled(compiledEffect);
        }

        return compiledEffect;
    }

    const engineAdapter = getEngineAdapter(engineState, {
        getHostDocument,
        _getShaderProcessor: (engineState: IWebGLEnginePublic) => (engineState as WebGLEngineState)._shaderProcessor,
        _loadFile,
        createPipelineContext
    });
    
    const effect = new Effect(
        baseName,
        attributesNamesOrOptions,
        uniformsNamesOrEngine,
        samplers,
        engineAdapter, // TODO
        defines,
        fallbacks,
        onCompiled,
        onError,
        indexParameters,
        name,
        shaderLanguage
    );
    fes._compiledEffects[name] = effect;

    return effect;
}

function _ConcatenateShader(source: string, defines: Nullable<string>, shaderVersion: string = ""): string {
    return shaderVersion + (defines ? defines + "\n" : "") + source;
}

function _compileShader(gl: IWebGLEngineInternals["_gl"], source: string, type: string, defines: Nullable<string>, shaderVersion: string): WebGLShader {
    return _compileRawShader(gl, _ConcatenateShader(source, defines, shaderVersion), type);
}

function _compileRawShader(gl: IWebGLEngineInternals["_gl"], source: string, type: string): WebGLShader {
    const shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);

    if (!shader) {
        let error: GLenum = gl.NO_ERROR;
        let tempError: GLenum = gl.NO_ERROR;
        while ((tempError = gl.getError()) !== gl.NO_ERROR) {
            error = tempError;
        }

        throw new Error(
            `Something went wrong while creating a gl ${type} shader object. gl error=${error}, gl isContextLost=${gl.isContextLost()}, _contextWasLost=${this._contextWasLost}`
        );
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    return shader;
}

/**
 * @internal
 */
export function _getShaderSource(gl: IWebGLEngineInternals["_gl"], shader: WebGLShader): Nullable<string> {
    return gl.getShaderSource(shader);
}

/**
 * Directly creates a webGL program
 * @param pipelineContext  defines the pipeline context to attach to
 * @param vertexCode defines the vertex shader code to use
 * @param fragmentCode defines the fragment shader code to use
 * @param context defines the webGL context to use (if not set, the current one will be used)
 * @param transformFeedbackVaryings defines the list of transform feedback varyings to use
 * @returns the new webGL program
 */
export function createRawShaderProgram(
    engineState: IWebGLEnginePublic,
    pipelineContext: IPipelineContext,
    vertexCode: string,
    fragmentCode: string,
    context?: WebGLRenderingContext,
    transformFeedbackVaryings: Nullable<string[]> = null
): WebGLProgram {
    const fes = engineState as WebGLEngineState;
    context = context || fes._gl;

    const vertexShader = _compileRawShader(fes._gl, vertexCode, "vertex");
    const fragmentShader = _compileRawShader(fes._gl, fragmentCode, "fragment");

    return _createShaderProgram(fes, pipelineContext as WebGLPipelineContext, vertexShader, fragmentShader, context, transformFeedbackVaryings);
}

/**
 * @internal
 */
export function _deletePipelineContext(engineState: IWebGLEnginePublic, pipelineContext: IPipelineContext): void {
    const fes = engineState as WebGLEngineState;
    const webGLPipelineContext = pipelineContext as WebGLPipelineContext;
    if (webGLPipelineContext && webGLPipelineContext.program) {
        if (webGLPipelineContext.transformFeedback) {
            deleteTransformFeedback(engineState, webGLPipelineContext.transformFeedback);
            webGLPipelineContext.transformFeedback = null;
        }
        webGLPipelineContext.program.__SPECTOR_rebuildProgram = null;

        fes._gl.deleteProgram(webGLPipelineContext.program);
    }
}

/**
 * Creates a webGL program
 * @param pipelineContext  defines the pipeline context to attach to
 * @param vertexCode  defines the vertex shader code to use
 * @param fragmentCode defines the fragment shader code to use
 * @param defines defines the string containing the defines to use to compile the shaders
 * @param context defines the webGL context to use (if not set, the current one will be used)
 * @param transformFeedbackVaryings defines the list of transform feedback varyings to use
 * @returns the new webGL program
 */
export function createThinShaderProgram(
    engineState: IWebGLEnginePublic,
    pipelineContext: IPipelineContext,
    vertexCode: string,
    fragmentCode: string,
    defines: Nullable<string>,
    context?: WebGLRenderingContext,
    transformFeedbackVaryings: Nullable<string[]> = null
): WebGLProgram {
    const fes = engineState as WebGLEngineState;
    context = context || fes._gl;

    const shaderVersion = fes._webGLVersion > 1 ? "#version 300 es\n#define WEBGL2 \n" : "";
    const vertexShader = _compileShader(fes._gl, vertexCode, "vertex", defines, shaderVersion);
    const fragmentShader = _compileShader(fes._gl, fragmentCode, "fragment", defines, shaderVersion);

    return _createShaderProgram(fes, pipelineContext as WebGLPipelineContext, vertexShader, fragmentShader, context, transformFeedbackVaryings);
}

export function createShaderProgram(
    engineState: IWebGLEnginePublic,
    pipelineContext: IPipelineContext,
    vertexCode: string,
    fragmentCode: string,
    defines: Nullable<string>,
    context?: WebGLRenderingContext,
    transformFeedbackVaryings: Nullable<string[]> = null
): WebGLProgram {
    const fes = engineState as WebGLEngineState;
    context = context || fes._gl;

    fes.onBeforeShaderCompilationObservable.notifyObservers(fes);

    const program = createThinShaderProgram(engineState, pipelineContext, vertexCode, fragmentCode, defines, context, transformFeedbackVaryings);
    fes.onAfterShaderCompilationObservable.notifyObservers(fes);

    return program;
}

/**
 * Creates a new pipeline context
 * @param shaderProcessingContext defines the shader processing context used during the processing if available
 * @returns the new pipeline
 */
export function createPipelineContext(engineState: IWebGLEnginePublic, shaderProcessingContext: Nullable<ShaderProcessingContext>): IPipelineContext {
    const fes = engineState as WebGLEngineState;
    const pipelineContext = new WebGLPipelineContext();
    // TODO applying engine to pipeline context
    const engineAdapter = getEngineAdapter(engineState, {
        // This needs to include all the functions that are used in the shader processing context
    });
    pipelineContext.engine = engineAdapter;

    if (fes._caps.parallelShaderCompile) {
        pipelineContext.isParallelCompiled = true;
    }

    return pipelineContext;
}

/**
 * @internal
 */
export function _getUseSRGBBuffer(engineState: IWebGLEnginePublic, useSRGBBuffer: boolean, noMipmap: boolean): boolean {
    // Generating mipmaps for sRGB textures is not supported in WebGL1 so we must disable the support if mipmaps is enabled
    return useSRGBBuffer && (engineState as WebGLEngineState)._caps.supportSRGBBuffers && (engineState.webGLVersion > 1 || noMipmap);
}

function _createShaderProgram(
    engineState: WebGLEngineState,
    pipelineContext: WebGLPipelineContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
    context: WebGLRenderingContext,
    transformFeedbackVaryings: Nullable<string[]> = null
): WebGLProgram {
    // This was in thin engine!

    // const shaderProgram = context.createProgram();
    // pipelineContext.program = shaderProgram;

    // if (!shaderProgram) {
    //     throw new Error("Unable to create program");
    // }

    // context.attachShader(shaderProgram, vertexShader);
    // context.attachShader(shaderProgram, fragmentShader);

    // context.linkProgram(shaderProgram);

    // pipelineContext.context = context;
    // pipelineContext.vertexShader = vertexShader;
    // pipelineContext.fragmentShader = fragmentShader;

    // if (!pipelineContext.isParallelCompiled) {
    //     _finalizePipelineContext(engineState, pipelineContext);
    // }

    // return shaderProgram;

    const shaderProgram = context.createProgram();
    pipelineContext.program = shaderProgram;

    if (!shaderProgram) {
        throw new Error("Unable to create program");
    }

    context.attachShader(shaderProgram, vertexShader);
    context.attachShader(shaderProgram, fragmentShader);

    if (engineState.webGLVersion > 1 && transformFeedbackVaryings) {
        const transformFeedback = createTransformFeedback(engineState);

        bindTransformFeedback(engineState, transformFeedback);
        setTranformFeedbackVaryings(engineState, shaderProgram, transformFeedbackVaryings);
        pipelineContext.transformFeedback = transformFeedback;
    }

    context.linkProgram(shaderProgram);

    if (engineState.webGLVersion > 1 && transformFeedbackVaryings) {
        bindTransformFeedback(engineState, null);
    }

    pipelineContext.context = context;
    pipelineContext.vertexShader = vertexShader;
    pipelineContext.fragmentShader = fragmentShader;

    if (!pipelineContext.isParallelCompiled) {
        _finalizePipelineContext(engineState, pipelineContext);
    }

    return shaderProgram;
}

function _finalizePipelineContext(engineState: WebGLEngineState, pipelineContext: WebGLPipelineContext) {
    const context = pipelineContext.context!;
    const vertexShader = pipelineContext.vertexShader!;
    const fragmentShader = pipelineContext.fragmentShader!;
    const program = pipelineContext.program!;

    const linked = context.getProgramParameter(program, context.LINK_STATUS);
    if (!linked) {
        // Get more info
        // Vertex
        if (!engineState._gl.getShaderParameter(vertexShader, engineState._gl.COMPILE_STATUS)) {
            const log = engineState._gl.getShaderInfoLog(vertexShader);
            if (log) {
                pipelineContext.vertexCompilationError = log;
                throw new Error("VERTEX SHADER " + log);
            }
        }

        // Fragment
        if (!engineState._gl.getShaderParameter(fragmentShader, engineState._gl.COMPILE_STATUS)) {
            const log = engineState._gl.getShaderInfoLog(fragmentShader);
            if (log) {
                pipelineContext.fragmentCompilationError = log;
                throw new Error("FRAGMENT SHADER " + log);
            }
        }

        const error = context.getProgramInfoLog(program);
        if (error) {
            pipelineContext.programLinkError = error;
            throw new Error(error);
        }
    }

    if (engineState.validateShaderPrograms) {
        context.validateProgram(program);
        const validated = context.getProgramParameter(program, context.VALIDATE_STATUS);

        if (!validated) {
            const error = context.getProgramInfoLog(program);
            if (error) {
                pipelineContext.programValidationError = error;
                throw new Error(error);
            }
        }
    }

    context.deleteShader(vertexShader);
    context.deleteShader(fragmentShader);

    pipelineContext.vertexShader = undefined;
    pipelineContext.fragmentShader = undefined;

    if (pipelineContext.onCompiled) {
        pipelineContext.onCompiled();
        pipelineContext.onCompiled = undefined;
    }
}

/**
 * @internal
 */
export function _preparePipelineContext(
    engineState: IWebGLEnginePublic,
    pipelineContext: IPipelineContext,
    vertexSourceCode: string,
    fragmentSourceCode: string,
    createAsRaw: boolean,
    rawVertexSourceCode: string,
    rawFragmentSourceCode: string,
    rebuildRebind: any,
    defines: Nullable<string>,
    transformFeedbackVaryings: Nullable<string[]>,
    key: string
) {
    const webGLRenderingState = pipelineContext as WebGLPipelineContext;

    if (createAsRaw) {
        webGLRenderingState.program = createRawShaderProgram(engineState, webGLRenderingState, vertexSourceCode, fragmentSourceCode, undefined, transformFeedbackVaryings);
    } else {
        webGLRenderingState.program = createShaderProgram(engineState, webGLRenderingState, vertexSourceCode, fragmentSourceCode, defines, undefined, transformFeedbackVaryings);
    }

    // TODO _Spector integration
    webGLRenderingState.program.__SPECTOR_rebuildProgram = rebuildRebind;
}

/**
 * @internal
 */
export function _isRenderingStateCompiled(engineState: IWebGLEnginePublic, pipelineContext: IPipelineContext): boolean {
    const fes = engineState as WebGLEngineState;
    const webGLPipelineContext = pipelineContext as WebGLPipelineContext;
    if (fes._isDisposed || webGLPipelineContext._isDisposed) {
        return false;
    }
    if (fes._gl.getProgramParameter(webGLPipelineContext.program!, fes._caps.parallelShaderCompile!.COMPLETION_STATUS_KHR)) {
        _finalizePipelineContext(fes, webGLPipelineContext);
        return true;
    }

    return false;
}

// This is actually a static function
/**
 * @internal
 */
export function _executeWhenRenderingStateIsCompiled(pipelineContext: IPipelineContext, action: () => void) {
    const webGLPipelineContext = pipelineContext as WebGLPipelineContext;

    if (!webGLPipelineContext.isParallelCompiled) {
        action();
        return;
    }

    const oldHandler = webGLPipelineContext.onCompiled;

    if (oldHandler) {
        webGLPipelineContext.onCompiled = () => {
            oldHandler!();
            action();
        };
    } else {
        webGLPipelineContext.onCompiled = action;
    }
}

/**
 * Gets the list of webGL uniform locations associated with a specific program based on a list of uniform names
 * @param pipelineContext defines the pipeline context to use
 * @param uniformsNames defines the list of uniform names
 * @returns an array of webGL uniform locations
 */
export function getUniforms(engineState: IWebGLEnginePublic, pipelineContext: IPipelineContext, uniformsNames: string[]): Nullable<WebGLUniformLocation>[] {
    const fes = engineState as WebGLEngineState;
    const results = new Array<Nullable<WebGLUniformLocation>>();
    const webGLPipelineContext = pipelineContext as WebGLPipelineContext;

    for (let index = 0; index < uniformsNames.length; index++) {
        results.push(fes._gl.getUniformLocation(webGLPipelineContext.program!, uniformsNames[index]));
    }

    return results;
}

/**
 * Gets the list of active attributes for a given webGL program
 * @param pipelineContext defines the pipeline context to use
 * @param attributesNames defines the list of attribute names to get
 * @returns an array of indices indicating the offset of each attribute
 */
export function getAttributes(engineState: IWebGLEnginePublic, pipelineContext: IPipelineContext, attributesNames: string[]): number[] {
    const fes = engineState as WebGLEngineState;
    const results = [];
    const webGLPipelineContext = pipelineContext as WebGLPipelineContext;

    for (let index = 0; index < attributesNames.length; index++) {
        try {
            results.push(fes._gl.getAttribLocation(webGLPipelineContext.program!, attributesNames[index]));
        } catch (e) {
            results.push(-1);
        }
    }

    return results;
}

/**
 * Activates an effect, making it the current one (ie. the one used for rendering)
 * @param effect defines the effect to activate
 */
export function enableEffect(engineState: IWebGLEnginePublic, effect: Nullable<Effect | DrawWrapper>): void {
    const fes = engineState as WebGLEngineState;
    effect = effect !== null && DrawWrapper.IsWrapper(effect) ? effect.effect : effect; // get only the effect, we don't need a Wrapper in the WebGL engine

    if (!effect || effect === fes._currentEffect) {
        return;
    }

    fes._stencilStateComposer.stencilMaterial = undefined;

    effect = effect as Effect;

    // Use program
    bindSamplers(engineState, effect);

    fes._currentEffect = effect;

    if (effect.onBind) {
        effect.onBind(effect);
    }
    if (effect._onBindObservable) {
        effect._onBindObservable.notifyObservers(effect);
    }
}

/**
 * Force the entire cache to be cleared
 * You should not have to use this function unless your engine needs to share the webGL context with another engine
 * @param bruteForce defines a boolean to force clearing ALL caches (including stencil, detoh and alpha states)
 */
export function wipeCaches(engineState: IWebGLEnginePublic, bruteForce?: boolean): void {
    const fes = engineState as WebGLEngineStateFull;
    if (fes.preventCacheWipeBetweenFrames && !bruteForce) {
        return;
    }
    fes._currentEffect = null;
    fes._viewportCached.x = 0;
    fes._viewportCached.y = 0;
    fes._viewportCached.z = 0;
    fes._viewportCached.w = 0;

    // Done before in case we clean the attributes
    _unbindVertexArrayObject(engineState);

    if (bruteForce) {
        fes._currentProgram = null;
        resetTextureCache(engineState);

        fes._stencilStateComposer.reset();

        if (fes._depthCullingState) {
            fes._depthCullingState.reset();
            fes._depthCullingState.depthFunc = fes._gl.LEQUAL;
        }

        fes._alphaState.reset();
        fes._alphaMode = ALPHA_ADD;
        fes._alphaEquation = ALPHA_DISABLE;

        fes._colorWrite = true;
        fes._colorWriteChanged = true;

        fes._unpackFlipYCached = null;

        fes._gl.pixelStorei(fes._gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, fes._gl.NONE);
        fes._gl.pixelStorei(fes._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);

        fes._mustWipeVertexAttributes = true;
        unbindAllAttributes(engineState);
    }

    _resetVertexBufferBinding(engineState);
    fes._cachedIndexBuffer = null;
    fes._cachedEffectForVertexBuffers = null;
    _bindIndexBuffer(engineState, null);
}

/**
 * @internal
 */
export function _getSamplingParameters(engineState: WebGLEngineState, samplingMode: number, generateMipMaps: boolean): { min: number; mag: number } {
    const gl = engineState._gl;
    let magFilter: GLenum = gl.NEAREST;
    let minFilter: GLenum = gl.NEAREST;

    switch (samplingMode) {
        case TEXTURE_LINEAR_LINEAR_MIPNEAREST:
            magFilter = gl.LINEAR;
            if (generateMipMaps) {
                minFilter = gl.LINEAR_MIPMAP_NEAREST;
            } else {
                minFilter = gl.LINEAR;
            }
            break;
        case TEXTURE_LINEAR_LINEAR_MIPLINEAR:
            magFilter = gl.LINEAR;
            if (generateMipMaps) {
                minFilter = gl.LINEAR_MIPMAP_LINEAR;
            } else {
                minFilter = gl.LINEAR;
            }
            break;
        case TEXTURE_NEAREST_NEAREST_MIPLINEAR:
            magFilter = gl.NEAREST;
            if (generateMipMaps) {
                minFilter = gl.NEAREST_MIPMAP_LINEAR;
            } else {
                minFilter = gl.NEAREST;
            }
            break;
        case TEXTURE_NEAREST_NEAREST_MIPNEAREST:
            magFilter = gl.NEAREST;
            if (generateMipMaps) {
                minFilter = gl.NEAREST_MIPMAP_NEAREST;
            } else {
                minFilter = gl.NEAREST;
            }
            break;
        case TEXTURE_NEAREST_LINEAR_MIPNEAREST:
            magFilter = gl.NEAREST;
            if (generateMipMaps) {
                minFilter = gl.LINEAR_MIPMAP_NEAREST;
            } else {
                minFilter = gl.LINEAR;
            }
            break;
        case TEXTURE_NEAREST_LINEAR_MIPLINEAR:
            magFilter = gl.NEAREST;
            if (generateMipMaps) {
                minFilter = gl.LINEAR_MIPMAP_LINEAR;
            } else {
                minFilter = gl.LINEAR;
            }
            break;
        case TEXTURE_NEAREST_LINEAR:
            magFilter = gl.NEAREST;
            minFilter = gl.LINEAR;
            break;
        case TEXTURE_NEAREST_NEAREST:
            magFilter = gl.NEAREST;
            minFilter = gl.NEAREST;
            break;
        case TEXTURE_LINEAR_NEAREST_MIPNEAREST:
            magFilter = gl.LINEAR;
            if (generateMipMaps) {
                minFilter = gl.NEAREST_MIPMAP_NEAREST;
            } else {
                minFilter = gl.NEAREST;
            }
            break;
        case TEXTURE_LINEAR_NEAREST_MIPLINEAR:
            magFilter = gl.LINEAR;
            if (generateMipMaps) {
                minFilter = gl.NEAREST_MIPMAP_LINEAR;
            } else {
                minFilter = gl.NEAREST;
            }
            break;
        case TEXTURE_LINEAR_LINEAR:
            magFilter = gl.LINEAR;
            minFilter = gl.LINEAR;
            break;
        case TEXTURE_LINEAR_NEAREST:
            magFilter = gl.LINEAR;
            minFilter = gl.NEAREST;
            break;
    }

    return {
        min: minFilter,
        mag: magFilter,
    };
}

/** @internal */
function _createTexture(engineState: WebGLEngineState): WebGLTexture {
    const texture = engineState._gl.createTexture();

    if (!texture) {
        throw new Error("Unable to create texture");
    }

    return texture;
}

/** @internal */
export function _createHardwareTexture(engineState: WebGLEngineState): HardwareTextureWrapper {
    return new WebGLHardwareTexture(_createTexture(engineState), engineState._gl);
}

/**
 * Creates an internal texture without binding it to a framebuffer
 * @internal
 * @param size defines the size of the texture
 * @param options defines the options used to create the texture
 * @param _delayGPUTextureCreation true to delay the texture creation the first time it is really needed. false to create it right away
 * @param source source type of the texture
 * @returns a new internal texture
 */
export function _createInternalTexture(
    engineState: IWebGLEnginePublic,
    size: TextureSize,
    options: boolean | InternalTextureCreationOptions,
    _delayGPUTextureCreation = true,
    source = InternalTextureSource.Unknown
): InternalTexture {
    const fes = engineState as WebGLEngineStateFull;
    let generateMipMaps = false;
    let type = TEXTURETYPE_UNSIGNED_INT;
    let samplingMode = TEXTURE_TRILINEAR_SAMPLINGMODE;
    let format = TEXTUREFORMAT_RGBA;
    let useSRGBBuffer = false;
    let samples = 1;
    let label: string | undefined;
    if (options !== undefined && typeof options === "object") {
        generateMipMaps = !!options.generateMipMaps;
        type = options.type === undefined ? TEXTURETYPE_UNSIGNED_INT : options.type;
        samplingMode = options.samplingMode === undefined ? TEXTURE_TRILINEAR_SAMPLINGMODE : options.samplingMode;
        format = options.format === undefined ? TEXTUREFORMAT_RGBA : options.format;
        useSRGBBuffer = options.useSRGBBuffer === undefined ? false : options.useSRGBBuffer;
        samples = options.samples ?? 1;
        label = options.label;
    } else {
        generateMipMaps = !!options;
    }

    useSRGBBuffer &&= fes._caps.supportSRGBBuffers && fes.webGLVersion > 1;

    if (type === TEXTURETYPE_FLOAT && !fes._caps.textureFloatLinearFiltering) {
        // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
        samplingMode = TEXTURE_NEAREST_SAMPLINGMODE;
    } else if (type === TEXTURETYPE_HALF_FLOAT && !fes._caps.textureHalfFloatLinearFiltering) {
        // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
        samplingMode = TEXTURE_NEAREST_SAMPLINGMODE;
    }
    if (type === TEXTURETYPE_FLOAT && !fes._caps.textureFloat) {
        type = TEXTURETYPE_UNSIGNED_INT;
        Logger.Warn("Float textures are not supported. Type forced to TEXTURETYPE_UNSIGNED_BYTE");
    }

    const gl = fes._gl;
    const engineAdapter = getEngineAdapter(engineState, {
        _releaseTexture,
        getLoadedTexturesCache: (_engineState: IWebGLEnginePublic) => {
            return (_engineState as WebGLEngineState)._internalTexturesCache;
        },
        createTexture,
    });
    const texture = new InternalTexture(engineAdapter, source);
    const width = (<{ width: number; height: number; layers?: number }>size).width || <number>size;
    const height = (<{ width: number; height: number; layers?: number }>size).height || <number>size;
    const layers = (<{ width: number; height: number; layers?: number }>size).layers || 0;
    const filters = _getSamplingParameters(fes, samplingMode, generateMipMaps);
    const target = layers !== 0 ? gl.TEXTURE_2D_ARRAY : gl.TEXTURE_2D;
    const sizedFormat = _getRGBABufferInternalSizedFormat(fes, type, format, useSRGBBuffer);
    const internalFormat = _getInternalFormat(fes, format);
    const textureType = _getWebGLTextureType(fes, type);

    // Bind
    _bindTextureDirectly(fes, target, texture);

    if (layers !== 0) {
        texture.is2DArray = true;
        gl.texImage3D(target, 0, sizedFormat, width, height, layers, 0, internalFormat, textureType, null);
    } else {
        gl.texImage2D(target, 0, sizedFormat, width, height, 0, internalFormat, textureType, null);
    }

    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filters.mag);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, filters.min);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // MipMaps
    if (generateMipMaps) {
        gl.generateMipmap(target);
    }

    _bindTextureDirectly(fes, target, null);

    texture._useSRGBBuffer = useSRGBBuffer;
    texture.baseWidth = width;
    texture.baseHeight = height;
    texture.width = width;
    texture.height = height;
    texture.depth = layers;
    texture.isReady = true;
    texture.samples = samples;
    texture.generateMipMaps = generateMipMaps;
    texture.samplingMode = samplingMode;
    texture.type = type;
    texture.format = format;
    texture.label = label;

    fes._internalTexturesCache.push(texture);

    return texture;
}

/**
 * Usually called from Texture.ts.
 * Passed information to create a WebGLTexture
 * @param url defines a value which contains one of the following:
 * * A conventional http URL, e.g. 'http://...' or 'file://...'
 * * A base64 string of in-line texture data, e.g. 'data:image/jpg;base64,/...'
 * * An indicator that data being passed using the buffer parameter, e.g. 'data:mytexture.jpg'
 * @param noMipmap defines a boolean indicating that no mipmaps shall be generated.  Ignored for compressed textures.  They must be in the file
 * @param invertY when true, image is flipped when loaded.  You probably want true. Certain compressed textures may invert this if their default is inverted (eg. ktx)
 * @param scene needed for loading to the correct scene
 * @param samplingMode mode with should be used sample / access the texture (Default: Texture.TRILINEAR_SAMPLINGMODE)
 * @param onLoad optional callback to be called upon successful completion
 * @param onError optional callback to be called upon failure
 * @param buffer a source of a file previously fetched as either a base64 string, an ArrayBuffer (compressed or image format), HTMLImageElement (image format), or a Blob
 * @param fallback an internal argument in case the function must be called again, due to etc1 not having alpha capabilities
 * @param format internal format.  Default: RGB when extension is '.jpg' else RGBA.  Ignored for compressed textures
 * @param forcedExtension defines the extension to use to pick the right loader
 * @param mimeType defines an optional mime type
 * @param loaderOptions options to be passed to the loader
 * @param creationFlags specific flags to use when creating the texture (TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
 * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
 * @returns a InternalTexture for assignment back into BABYLON.Texture
 */
export function createTexture(
    engineState: IWebGLEnginePublic,
    url: Nullable<string>,
    noMipmap: boolean,
    invertY: boolean,
    scene: Nullable<ISceneLike>,
    samplingMode: number = TEXTURE_TRILINEAR_SAMPLINGMODE,
    onLoad: Nullable<(texture: InternalTexture) => void> = null,
    onError: Nullable<(message: string, exception: any) => void> = null,
    buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap> = null,
    fallback: Nullable<InternalTexture> = null,
    format: Nullable<number> = null,
    forcedExtension: Nullable<string> = null,
    mimeType?: string,
    loaderOptions?: any,
    creationFlags?: number,
    useSRGBBuffer?: boolean
): InternalTexture {
    const fes = engineState as WebGLEngineState;
    const engineAdapter = getEngineAdapter(engineState, {
        _releaseTexture,
        getLoadedTexturesCache: (_engineState: IWebGLEnginePublic) => {
            return (_engineState as WebGLEngineState)._internalTexturesCache;
        },
        createTexture,
    });
    return _createTextureBase(
        {
            getUseSRGBBuffer: _getUseSRGBBuffer,
            engineAdapter,
        },
        fes,
        url,
        noMipmap,
        invertY,
        scene,
        samplingMode,
        onLoad,
        onError,
        _prepareWebGLTexture.bind(null, fes), // TODO
        (potWidth, potHeight, img, extension, texture, continuationCallback) => {
            const gl = fes._gl;
            const isPot = img.width === potWidth && img.height === potHeight;

            const internalFormat = format
                ? _getInternalFormat(engineState, format, texture._useSRGBBuffer)
                : extension === ".jpg" && !texture._useSRGBBuffer
                ? gl.RGB
                : texture._useSRGBBuffer
                ? fes._glSRGBExtensionValues.SRGB8_ALPHA8
                : gl.RGBA;
            let texelFormat = format ? _getInternalFormat(engineState, format) : extension === ".jpg" && !texture._useSRGBBuffer ? gl.RGB : gl.RGBA;

            if (texture._useSRGBBuffer && fes.webGLVersion === 1) {
                texelFormat = internalFormat;
            }

            if (isPot) {
                gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, texelFormat, gl.UNSIGNED_BYTE, img as any);
                return false;
            }

            const maxTextureSize = fes._caps.maxTextureSize;

            if (img.width > maxTextureSize || img.height > maxTextureSize || !this._supportsHardwareTextureRescaling) {
                _prepareWorkingCanvas(fes);
                if (!fes._workingCanvas || !fes._workingContext) {
                    return false;
                }

                fes._workingCanvas.width = potWidth;
                fes._workingCanvas.height = potHeight;

                fes._workingContext.drawImage(img as any, 0, 0, img.width, img.height, 0, 0, potWidth, potHeight);
                gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, texelFormat, gl.UNSIGNED_BYTE, this._workingCanvas as TexImageSource);

                texture.width = potWidth;
                texture.height = potHeight;

                return false;
            } else {
                // Using shaders when possible to rescale because canvas.drawImage is lossy
                const source = new InternalTexture(engineAdapter, InternalTextureSource.Temp);
                _bindTextureDirectly(engineState, gl.TEXTURE_2D, source, true);
                gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, texelFormat, gl.UNSIGNED_BYTE, img as any);

                _rescaleTexture(fes, source, texture, scene, internalFormat, () => {
                    _releaseTexture(fes, source);
                    _bindTextureDirectly(engineState, gl.TEXTURE_2D, texture, true);

                    continuationCallback();
                });
            }

            return true;
        },
        buffer,
        fallback,
        format,
        forcedExtension,
        mimeType,
        loaderOptions,
        useSRGBBuffer
    );
}

/**
 * @internal
 * Rescales a texture
 * @param source input texture
 * @param destination destination texture
 * @param scene scene to use to render the resize
 * @param internalFormat format to use when resizing
 * @param onComplete callback to be called when resize has completed
 */
export function _rescaleTexture(
    engineState: WebGLEngineState,
    source: InternalTexture,
    destination: InternalTexture,
    scene: Nullable<any>,
    internalFormat: number,
    onComplete: () => void
): void {
    engineState._gl.texParameteri(engineState._gl.TEXTURE_2D, engineState._gl.TEXTURE_MAG_FILTER, engineState._gl.LINEAR);
    engineState._gl.texParameteri(engineState._gl.TEXTURE_2D, engineState._gl.TEXTURE_MIN_FILTER, engineState._gl.LINEAR);
    engineState._gl.texParameteri(engineState._gl.TEXTURE_2D, engineState._gl.TEXTURE_WRAP_S, engineState._gl.CLAMP_TO_EDGE);
    engineState._gl.texParameteri(engineState._gl.TEXTURE_2D, engineState._gl.TEXTURE_WRAP_T, engineState._gl.CLAMP_TO_EDGE);

    const rtt = createRenderTargetTexture(
        engineState,
        {
            width: destination.width,
            height: destination.height,
        },
        {
            generateMipMaps: false,
            type: TEXTURETYPE_UNSIGNED_INT,
            samplingMode: TEXTURE_BILINEAR_SAMPLINGMODE,
            generateDepthBuffer: false,
            generateStencilBuffer: false,
        }
    );

    if (!engineState._rescalePostProcess && Engine._RescalePostProcessFactory) {
        engineState._rescalePostProcess = Engine._RescalePostProcessFactory(this);
    }

    if (engineState._rescalePostProcess) {
        engineState._rescalePostProcess.externalTextureSamplerBinding = true;
        engineState._rescalePostProcess.getEffect().executeWhenCompiled(() => {
            engineState._rescalePostProcess!.onApply = function (effect) {
                effect._bindTexture("textureSampler", source);
            };

            let hostingScene: Scene = scene;

            if (!hostingScene) {
                hostingScene = engineState.scenes[engineState.scenes.length - 1];
            }
            hostingScene.postProcessManager.directRender([engineState._rescalePostProcess!], rtt, true);

            _bindTextureDirectly(engineState, engineState._gl.TEXTURE_2D, destination, true);
            engineState._gl.copyTexImage2D(engineState._gl.TEXTURE_2D, 0, internalFormat, 0, 0, destination.width, destination.height, 0);

            unBindFramebuffer(engineState, rtt);
            rtt.dispose();

            if (onComplete) {
                onComplete();
            }
        });
    }
}

/**
 * @internal
 */
export function _unpackFlipY(engineState: WebGLEngineStateFull, value: boolean): void {
    if (engineState._unpackFlipYCached !== value) {
        engineState._gl.pixelStorei(engineState._gl.UNPACK_FLIP_Y_WEBGL, value ? 1 : 0);

        if (engineState.enableUnpackFlipYCached) {
            engineState._unpackFlipYCached = value;
        }
    }
}

/** @internal */
export function _getUnpackAlignement(engineState: WebGLEngineState): number {
    return engineState._gl.getParameter(engineState._gl.UNPACK_ALIGNMENT);
}

function _getTextureTarget(engineState: WebGLEngineState, texture: InternalTexture): number {
    if (texture.isCube) {
        return engineState._gl.TEXTURE_CUBE_MAP;
    } else if (texture.is3D) {
        return engineState._gl.TEXTURE_3D;
    } else if (texture.is2DArray || texture.isMultiview) {
        return engineState._gl.TEXTURE_2D_ARRAY;
    }
    return engineState._gl.TEXTURE_2D;
}

/**
 * Update the sampling mode of a given texture
 * @param samplingMode defines the required sampling mode
 * @param texture defines the texture to update
 * @param generateMipMaps defines whether to generate mipmaps for the texture
 */
export function updateTextureSamplingMode(engineState: IWebGLEnginePublic, samplingMode: number, texture: InternalTexture, generateMipMaps: boolean = false): void {
    const fes = engineState as WebGLEngineState;
    const target = _getTextureTarget(fes, texture);
    const filters = _getSamplingParameters(fes, samplingMode, texture.useMipMaps || generateMipMaps);

    _setTextureParameterInteger(fes, target, fes._gl.TEXTURE_MAG_FILTER, filters.mag, texture);
    _setTextureParameterInteger(fes, target, fes._gl.TEXTURE_MIN_FILTER, filters.min);

    if (generateMipMaps) {
        texture.generateMipMaps = true;
        fes._gl.generateMipmap(target);
    }

    _bindTextureDirectly(engineState, target, null);

    texture.samplingMode = samplingMode;
}

/**
 * Update the sampling mode of a given texture
 * @param texture defines the texture to update
 * @param wrapU defines the texture wrap mode of the u coordinates
 * @param wrapV defines the texture wrap mode of the v coordinates
 * @param wrapR defines the texture wrap mode of the r coordinates
 */
export function updateTextureWrappingMode(
    engineState: IWebGLEnginePublic,
    texture: InternalTexture,
    wrapU: Nullable<number>,
    wrapV: Nullable<number> = null,
    wrapR: Nullable<number> = null
): void {
    const fes = engineState as WebGLEngineState;
    const target = _getTextureTarget(engineState as WebGLEngineState, texture);

    if (wrapU !== null) {
        _setTextureParameterInteger(fes, target, fes._gl.TEXTURE_WRAP_S, _getTextureWrapMode(fes, wrapU), texture);
        texture._cachedWrapU = wrapU;
    }
    if (wrapV !== null) {
        _setTextureParameterInteger(fes, target, fes._gl.TEXTURE_WRAP_T, _getTextureWrapMode(fes, wrapV), texture);
        texture._cachedWrapV = wrapV;
    }
    if ((texture.is2DArray || texture.is3D) && wrapR !== null) {
        _setTextureParameterInteger(fes, target, fes._gl.TEXTURE_WRAP_R, _getTextureWrapMode(fes, wrapR), texture);
        texture._cachedWrapR = wrapR;
    }

    _bindTextureDirectly(engineState, target, null);
}

/**
 * @internal
 */
export function _setupDepthStencilTexture(
    engineState: IWebGLEnginePublic,
    internalTexture: InternalTexture,
    size: number | { width: number; height: number; layers?: number },
    generateStencil: boolean,
    bilinearFiltering: boolean,
    comparisonFunction: number,
    samples = 1
): void {
    const fes = engineState as WebGLEngineState;
    const width = (<{ width: number; height: number; layers?: number }>size).width || <number>size;
    const height = (<{ width: number; height: number; layers?: number }>size).height || <number>size;
    const layers = (<{ width: number; height: number; layers?: number }>size).layers || 0;

    internalTexture.baseWidth = width;
    internalTexture.baseHeight = height;
    internalTexture.width = width;
    internalTexture.height = height;
    internalTexture.is2DArray = layers > 0;
    internalTexture.depth = layers;
    internalTexture.isReady = true;
    internalTexture.samples = samples;
    internalTexture.generateMipMaps = false;
    internalTexture.samplingMode = bilinearFiltering ? TEXTURE_BILINEAR_SAMPLINGMODE : TEXTURE_NEAREST_SAMPLINGMODE;
    internalTexture.type = TEXTURETYPE_UNSIGNED_INT;
    internalTexture._comparisonFunction = comparisonFunction;

    const gl = fes._gl;
    const target = _getTextureTarget(fes, internalTexture);
    const samplingParameters = _getSamplingParameters(fes, internalTexture.samplingMode, false);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, samplingParameters.mag);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, samplingParameters.min);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // TEXTURE_COMPARE_FUNC/MODE are only availble in WebGL2.
    if (engineState.webGLVersion > 1) {
        if (comparisonFunction === 0) {
            gl.texParameteri(target, gl.TEXTURE_COMPARE_FUNC, LEQUAL);
            gl.texParameteri(target, gl.TEXTURE_COMPARE_MODE, gl.NONE);
        } else {
            gl.texParameteri(target, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
            gl.texParameteri(target, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
        }
    }
}

/**
 * @internal
 */
export function _uploadCompressedDataToTextureDirectly(
    engineState: IWebGLEnginePublic,
    texture: InternalTexture,
    internalFormat: number,
    width: number,
    height: number,
    data: ArrayBufferView,
    faceIndex: number = 0,
    lod: number = 0
) {
    const fes = engineState as WebGLEngineState;
    const gl = fes._gl;

    let target: GLenum = gl.TEXTURE_2D;
    if (texture.isCube) {
        target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
    }

    if (texture._useSRGBBuffer) {
        switch (internalFormat) {
            case TEXTUREFORMAT_COMPRESSED_RGB8_ETC2:
            case TEXTUREFORMAT_COMPRESSED_RGB_ETC1_WEBGL:
                // Note, if using ETC1 and sRGB is requested, this will use ETC2 if available.
                if (fes._caps.etc2) {
                    internalFormat = gl.COMPRESSED_SRGB8_ETC2;
                } else {
                    texture._useSRGBBuffer = false;
                }
                break;
            case TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC:
                if (fes._caps.etc2) {
                    internalFormat = gl.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC;
                } else {
                    texture._useSRGBBuffer = false;
                }
                break;
            case TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM:
                internalFormat = gl.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT;
                break;
            case TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4:
                internalFormat = gl.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR;
                break;
            case TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1:
                if (fes._caps.s3tc_srgb) {
                    internalFormat = gl.COMPRESSED_SRGB_S3TC_DXT1_EXT;
                } else {
                    // S3TC sRGB extension not supported
                    texture._useSRGBBuffer = false;
                }
                break;
            case TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1:
                if (fes._caps.s3tc_srgb) {
                    internalFormat = gl.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;
                } else {
                    // S3TC sRGB extension not supported
                    texture._useSRGBBuffer = false;
                }
                break;
            case TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5:
                if (fes._caps.s3tc_srgb) {
                    internalFormat = gl.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT;
                } else {
                    // S3TC sRGB extension not supported
                    texture._useSRGBBuffer = false;
                }
                break;
            default:
                // We don't support a sRGB format corresponding to internalFormat, so revert to non sRGB format
                texture._useSRGBBuffer = false;
                break;
        }
    }

    gl.compressedTexImage2D(target, lod, internalFormat, width, height, 0, <DataView>data);
}

/**
 * @internal
 */
export function _uploadDataToTextureDirectly(
    engineState: IWebGLEnginePublic,
    texture: InternalTexture,
    imageData: ArrayBufferView,
    faceIndex: number = 0,
    lod: number = 0,
    babylonInternalFormat?: number,
    useTextureWidthAndHeight = false
): void {
    const fes = engineState as WebGLEngineStateFull;
    const gl = fes._gl;

    const textureType = _getWebGLTextureType(engineState, texture.type);
    const format = _getInternalFormat(engineState, texture.format);
    const internalFormat =
        babylonInternalFormat === undefined
            ? _getRGBABufferInternalSizedFormat(engineState, texture.type, texture.format, texture._useSRGBBuffer)
            : _getInternalFormat(engineState, babylonInternalFormat, texture._useSRGBBuffer);

    _unpackFlipY(fes, texture.invertY);

    let target: GLenum = gl.TEXTURE_2D;
    if (texture.isCube) {
        target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
    }

    const lodMaxWidth = Math.round(Math.log(texture.width) * Math.LOG2E);
    const lodMaxHeight = Math.round(Math.log(texture.height) * Math.LOG2E);
    const width = useTextureWidthAndHeight ? texture.width : Math.pow(2, Math.max(lodMaxWidth - lod, 0));
    const height = useTextureWidthAndHeight ? texture.height : Math.pow(2, Math.max(lodMaxHeight - lod, 0));

    gl.texImage2D(target, lod, internalFormat, width, height, 0, format, textureType, imageData);
}

/**
 * Update a portion of an internal texture
 * @param texture defines the texture to update
 * @param imageData defines the data to store into the texture
 * @param xOffset defines the x coordinates of the update rectangle
 * @param yOffset defines the y coordinates of the update rectangle
 * @param width defines the width of the update rectangle
 * @param height defines the height of the update rectangle
 * @param faceIndex defines the face index if texture is a cube (0 by default)
 * @param lod defines the lod level to update (0 by default)
 * @param generateMipMaps defines whether to generate mipmaps or not
 */
export function updateTextureData(
    engineState: IWebGLEnginePublic,
    texture: InternalTexture,
    imageData: ArrayBufferView,
    xOffset: number,
    yOffset: number,
    width: number,
    height: number,
    faceIndex: number = 0,
    lod: number = 0,
    generateMipMaps = false
): void {
    const fes = engineState as WebGLEngineStateFull;
    const gl = fes._gl;

    const textureType = _getWebGLTextureType(engineState, texture.type);
    const format = _getInternalFormat(engineState, texture.format);

    _unpackFlipY(fes, texture.invertY);

    let targetForBinding: GLenum = gl.TEXTURE_2D;
    let target: GLenum = gl.TEXTURE_2D;
    if (texture.isCube) {
        target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
        targetForBinding = gl.TEXTURE_CUBE_MAP;
    }

    _bindTextureDirectly(engineState, targetForBinding, texture, true);

    gl.texSubImage2D(target, lod, xOffset, yOffset, width, height, format, textureType, imageData);

    if (generateMipMaps) {
        gl.generateMipmap(target);
    }

    _bindTextureDirectly(engineState, targetForBinding, null);
}

/**
 * @internal
 */
export function _uploadArrayBufferViewToTexture(
    engineState: IWebGLEnginePublic,
    texture: InternalTexture,
    imageData: ArrayBufferView,
    faceIndex: number = 0,
    lod: number = 0
): void {
    const fes = engineState as WebGLEngineState;
    const gl = fes._gl;
    const bindTarget = texture.isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;

    _bindTextureDirectly(engineState, bindTarget, texture, true);

    _uploadDataToTextureDirectly(engineState, texture, imageData, faceIndex, lod);

    _bindTextureDirectly(engineState, bindTarget, null, true);
}

function _prepareWebGLTextureContinuation(
    engineState: WebGLEngineState,
    texture: InternalTexture,
    scene: Nullable<ISceneLike>,
    noMipmap: boolean,
    isCompressed: boolean,
    samplingMode: number
): void {
    const gl = engineState._gl;
    if (!gl) {
        return;
    }

    const filters = _getSamplingParameters(engineState, samplingMode, !noMipmap);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);

    if (!noMipmap && !isCompressed) {
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    _bindTextureDirectly(engineState, gl.TEXTURE_2D, null);

    // this.resetTextureCache();
    if (scene) {
        scene.removePendingData(texture);
    }

    texture.onLoadedObservable.notifyObservers(texture);
    texture.onLoadedObservable.clear();
}

function _prepareWebGLTexture(
    engineState: WebGLEngineStateFull,
    texture: InternalTexture,
    extension: string,
    scene: Nullable<ISceneLike>,
    img: HTMLImageElement | ImageBitmap | { width: number; height: number },
    invertY: boolean,
    noMipmap: boolean,
    isCompressed: boolean,
    processFunction: (
        width: number,
        height: number,
        img: HTMLImageElement | ImageBitmap | { width: number; height: number },
        extension: string,
        texture: InternalTexture,
        continuationCallback: () => void
    ) => boolean,
    samplingMode: number = TEXTURE_TRILINEAR_SAMPLINGMODE
): void {
    const maxTextureSize = engineState._caps.maxTextureSize;
    const potWidth = Math.min(maxTextureSize, engineState.needPOTTextures ? GetExponentOfTwo(img.width, maxTextureSize) : img.width);
    const potHeight = Math.min(maxTextureSize, engineState.needPOTTextures ? GetExponentOfTwo(img.height, maxTextureSize) : img.height);

    const gl = engineState._gl;
    if (!gl) {
        return;
    }

    if (!texture._hardwareTexture) {
        //  this.resetTextureCache();
        if (scene) {
            scene.removePendingData(texture);
        }

        return;
    }

    _bindTextureDirectly(engineState, gl.TEXTURE_2D, texture, true);
    _unpackFlipY(engineState, invertY === undefined ? true : invertY ? true : false);

    texture.baseWidth = img.width;
    texture.baseHeight = img.height;
    texture.width = potWidth;
    texture.height = potHeight;
    texture.isReady = true;

    if (
        processFunction(potWidth, potHeight, img, extension, texture, () => {
            _prepareWebGLTextureContinuation(engineState, texture, scene, noMipmap, isCompressed, samplingMode);
        })
    ) {
        // Returning as texture needs extra async steps
        return;
    }

    _prepareWebGLTextureContinuation(engineState, texture, scene, noMipmap, isCompressed, samplingMode);
}

/**
 * @internal
 */
export function _setupFramebufferDepthAttachments(
    engineState: IWebGLEnginePublic,
    generateStencilBuffer: boolean,
    generateDepthBuffer: boolean,
    width: number,
    height: number,
    samples = 1
): Nullable<WebGLRenderbuffer> {
    const fes = engineState as WebGLEngineState;
    const gl = fes._gl;

    // Create the depth/stencil buffer
    if (generateStencilBuffer && generateDepthBuffer) {
        return _createRenderBuffer(engineState, width, height, samples, gl.DEPTH_STENCIL, gl.DEPTH24_STENCIL8, gl.DEPTH_STENCIL_ATTACHMENT);
    }
    if (generateDepthBuffer) {
        let depthFormat: GLenum = gl.DEPTH_COMPONENT16;
        if (fes._webGLVersion > 1) {
            depthFormat = gl.DEPTH_COMPONENT32F;
        }

        return _createRenderBuffer(engineState, width, height, samples, depthFormat, depthFormat, gl.DEPTH_ATTACHMENT);
    }
    if (generateStencilBuffer) {
        return _createRenderBuffer(engineState, width, height, samples, gl.STENCIL_INDEX8, gl.STENCIL_INDEX8, gl.STENCIL_ATTACHMENT);
    }

    return null;
}

/**
 * @internal
 */
export function _createRenderBuffer(
    engineState: IWebGLEnginePublic,
    width: number,
    height: number,
    samples: number,
    internalFormat: number,
    msInternalFormat: number,
    attachment: number,
    unbindBuffer = true
): Nullable<WebGLRenderbuffer> {
    const gl = (engineState as WebGLEngineState)._gl;
    const renderBuffer = gl.createRenderbuffer();
    return _updateRenderBuffer(engineState, renderBuffer, width, height, samples, internalFormat, msInternalFormat, attachment, unbindBuffer);
}

/**
 * @internal
 */
export function _updateRenderBuffer(
    engineState: IWebGLEnginePublic,
    renderBuffer: Nullable<WebGLRenderbuffer>,
    width: number,
    height: number,
    samples: number,
    internalFormat: number,
    msInternalFormat: number,
    attachment: number,
    unbindBuffer = true
): Nullable<WebGLRenderbuffer> {
    const gl = (engineState as WebGLEngineState)._gl;

    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);

    if (samples > 1 && gl.renderbufferStorageMultisample) {
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, msInternalFormat, width, height);
    } else {
        gl.renderbufferStorage(gl.RENDERBUFFER, internalFormat, width, height);
    }

    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, gl.RENDERBUFFER, renderBuffer);

    if (unbindBuffer) {
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }

    return renderBuffer;
}

/**
 * @internal
 */
export function _releaseTexture(engineState: IWebGLEnginePublic, texture: InternalTexture): void {
    const fes = engineState as WebGLEngineState;
    _deleteTexture(fes, texture._hardwareTexture?.underlyingResource);

    // Unbind channels
    unbindAllTextures(engineState);

    const index = fes._internalTexturesCache.indexOf(texture);
    if (index !== -1) {
        fes._internalTexturesCache.splice(index, 1);
    }

    // Integrated fixed lod samplers.
    if (texture._lodTextureHigh) {
        texture._lodTextureHigh.dispose();
    }
    if (texture._lodTextureMid) {
        texture._lodTextureMid.dispose();
    }
    if (texture._lodTextureLow) {
        texture._lodTextureLow.dispose();
    }

    // Integrated irradiance map.
    if (texture._irradianceTexture) {
        texture._irradianceTexture.dispose();
    }
}

/**
 * @internal
 */
export function _releaseRenderTargetWrapper(engineState: IWebGLEnginePublic, rtWrapper: RenderTargetWrapper): void {
    const fes = engineState as WebGLEngineState;
    const index = fes._renderTargetWrapperCache.indexOf(rtWrapper);
    if (index !== -1) {
        fes._renderTargetWrapperCache.splice(index, 1);
    }
}

function _deleteTexture(engineState: WebGLEngineState, texture: Nullable<WebGLTexture>): void {
    if (texture) {
        engineState._gl.deleteTexture(texture);
    }
}

function _setProgram(engineState: WebGLEngineState, program: WebGLProgram): void {
    if (engineState._currentProgram !== program) {
        engineState._gl.useProgram(program);
        engineState._currentProgram = program;
    }
}

/**
 * Binds an effect to the webGL context
 * @param effect defines the effect to bind
 */
export function bindSamplers(engineState: IWebGLEnginePublic, effect: Effect): void {
    const fes = engineState as WebGLEngineStateFull;
    const webGLPipelineContext = effect.getPipelineContext() as WebGLPipelineContext;
    _setProgram(fes, webGLPipelineContext.program!);
    const samplers = effect.getSamplers();
    for (let index = 0; index < samplers.length; index++) {
        const uniform = effect.getUniform(samplers[index]);

        if (uniform) {
            fes._boundUniforms[index] = uniform;
        }
    }
    fes._currentEffect = null;
}

function _activateCurrentTexture(engineState: WebGLEngineStateFull) {
    if (engineState._currentTextureChannel !== engineState._activeChannel) {
        engineState._gl.activeTexture(engineState._gl.TEXTURE0 + engineState._activeChannel);
        engineState._currentTextureChannel = engineState._activeChannel;
    }
}

/**
 * @internal
 */
export function _bindTextureDirectly(engineState: IWebGLEnginePublic, target: number, texture: Nullable<InternalTexture>, forTextureDataUpdate = false, force = false): boolean {
    const fes = engineState as WebGLEngineStateFull;
    let wasPreviouslyBound = false;
    const isTextureForRendering = texture && texture._associatedChannel > -1;
    if (forTextureDataUpdate && isTextureForRendering) {
        fes._activeChannel = texture!._associatedChannel;
    }

    const currentTextureBound = fes._boundTexturesCache[fes._activeChannel];

    if (currentTextureBound !== texture || force) {
        _activateCurrentTexture(fes);

        if (texture && texture.isMultiview) {
            //this._gl.bindTexture(target, texture ? texture._colorTextureArray : null);
            console.error(target, texture);
            throw "_bindTextureDirectly called with a multiview texture!";
        } else {
            fes._gl.bindTexture(target, texture?._hardwareTexture?.underlyingResource ?? null);
        }

        fes._boundTexturesCache[fes._activeChannel] = texture;

        if (texture) {
            texture._associatedChannel = fes._activeChannel;
        }
    } else if (forTextureDataUpdate) {
        wasPreviouslyBound = true;
        _activateCurrentTexture(fes);
    }

    if (isTextureForRendering && !forTextureDataUpdate) {
        _bindSamplerUniformToChannel(fes, texture!._associatedChannel, fes._activeChannel);
    }

    return wasPreviouslyBound;
}

/**
 * @internal
 */
export function _bindTexture(engineState: IWebGLEnginePublic, channel: number, texture: Nullable<InternalTexture>, name: string): void {
    const fes = engineState as WebGLEngineStateFull;
    if (channel === undefined) {
        return;
    }

    if (texture) {
        texture._associatedChannel = channel;
    }

    fes._activeChannel = channel;
    const target = texture ? _getTextureTarget(fes, texture) : fes._gl.TEXTURE_2D;
    _bindTextureDirectly(fes, target, texture);
}

/**
 * Unbind all textures from the webGL context
 */
export function unbindAllTextures(engineState: IWebGLEnginePublic): void {
    const fes = engineState as WebGLEngineStateFull;
    for (let channel = 0; channel < fes._maxSimultaneousTextures; channel++) {
        fes._activeChannel = channel;
        _bindTextureDirectly(fes, fes._gl.TEXTURE_2D, null);
        _bindTextureDirectly(fes, fes._gl.TEXTURE_CUBE_MAP, null);
        if (fes._webGLVersion > 1) {
            _bindTextureDirectly(fes, fes._gl.TEXTURE_3D, null);
            _bindTextureDirectly(fes, fes._gl.TEXTURE_2D_ARRAY, null);
        }
    }
}

/**
 * Sets a texture to the according uniform.
 * @param channel The texture channel
 * @param uniform The uniform to set
 * @param texture The texture to apply
 * @param name The name of the uniform in the effect
 */
export function setTexture(engineState: IWebGLEnginePublic, channel: number, uniform: Nullable<WebGLUniformLocation>, texture: Nullable<ThinTexture>, name: string): void {
    const fes = engineState as WebGLEngineStateFull;
    if (channel === undefined) {
        return;
    }

    if (uniform) {
        fes._boundUniforms[channel] = uniform;
    }

    _setTexture(fes, channel, texture);
}

function _bindSamplerUniformToChannel(engineState: WebGLEngineStateFull, sourceSlot: number, destination: number) {
    const uniform = engineState._boundUniforms[sourceSlot];
    if (!uniform || uniform._currentState === destination) {
        return;
    }
    engineState._gl.uniform1i(uniform, destination);
    uniform._currentState = destination;
}

function _getTextureWrapMode(engineState: WebGLEngineState, mode: number): number {
    switch (mode) {
        case TEXTURE_WRAP_ADDRESSMODE:
            return engineState._gl.REPEAT;
        case TEXTURE_CLAMP_ADDRESSMODE:
            return engineState._gl.CLAMP_TO_EDGE;
        case TEXTURE_MIRROR_ADDRESSMODE:
            return engineState._gl.MIRRORED_REPEAT;
    }
    return engineState._gl.REPEAT;
}

function _setTexture(
    engineState: WebGLEngineStateFull,
    channel: number,
    texture: Nullable<ThinTexture>,
    isPartOfTextureArray = false,
    depthStencilTexture = false,
    name = ""
): boolean {
    // Not ready?
    if (!texture) {
        if (engineState._boundTexturesCache[channel] != null) {
            engineState._activeChannel = channel;
            _bindTextureDirectly(engineState, engineState._gl.TEXTURE_2D, null);
            _bindTextureDirectly(engineState, engineState._gl.TEXTURE_CUBE_MAP, null);
            if (engineState.webGLVersion > 1) {
                _bindTextureDirectly(engineState, engineState._gl.TEXTURE_3D, null);
                _bindTextureDirectly(engineState, engineState._gl.TEXTURE_2D_ARRAY, null);
            }
        }
        return false;
    }

    // Video
    if ((<VideoTexture>texture).video) {
        engineState._activeChannel = channel;
        const videoInternalTexture = (<VideoTexture>texture).getInternalTexture();
        if (videoInternalTexture) {
            videoInternalTexture._associatedChannel = channel;
        }
        (<VideoTexture>texture).update();
    } else if (texture.delayLoadState === DELAYLOADSTATE_NOTLOADED) {
        // Delay loading
        texture.delayLoad();
        return false;
    }

    let internalTexture: InternalTexture;
    if (depthStencilTexture) {
        internalTexture = (<RenderTargetTexture>texture).depthStencilTexture!;
    } else if (texture.isReady()) {
        internalTexture = <InternalTexture>texture.getInternalTexture();
    } else if (texture.isCube) {
        internalTexture = engineState._emptyCubeTexture as InternalTexture;
    } else if (texture.is3D) {
        internalTexture = engineState._emptyTexture3D as InternalTexture;
    } else if (texture.is2DArray) {
        internalTexture = engineState._emptyTexture2DArray as InternalTexture;
    } else {
        internalTexture = engineState._emptyTexture as InternalTexture;
    }

    if (!isPartOfTextureArray && internalTexture) {
        internalTexture._associatedChannel = channel;
    }

    let needToBind = true;
    if (engineState._boundTexturesCache[channel] === internalTexture) {
        if (!isPartOfTextureArray) {
            _bindSamplerUniformToChannel(engineState, internalTexture._associatedChannel, channel);
        }

        needToBind = false;
    }

    engineState._activeChannel = channel;
    const target = _getTextureTarget(engineState, internalTexture);
    if (needToBind) {
        _bindTextureDirectly(engineState, target, internalTexture, isPartOfTextureArray);
    }

    if (internalTexture && !internalTexture.isMultiview) {
        // CUBIC_MODE and SKYBOX_MODE both require CLAMP_TO_EDGE.  All other modes use REPEAT.
        if (internalTexture.isCube && internalTexture._cachedCoordinatesMode !== texture.coordinatesMode) {
            internalTexture._cachedCoordinatesMode = texture.coordinatesMode;

            const textureWrapMode =
                texture.coordinatesMode !== TEXTURE_CUBIC_MODE && texture.coordinatesMode !== TEXTURE_SKYBOX_MODE ? TEXTURE_WRAP_ADDRESSMODE : TEXTURE_CLAMP_ADDRESSMODE;
            texture.wrapU = textureWrapMode;
            texture.wrapV = textureWrapMode;
        }

        if (internalTexture._cachedWrapU !== texture.wrapU) {
            internalTexture._cachedWrapU = texture.wrapU;
            _setTextureParameterInteger(engineState, target, engineState._gl.TEXTURE_WRAP_S, _getTextureWrapMode(engineState, texture.wrapU), internalTexture);
        }

        if (internalTexture._cachedWrapV !== texture.wrapV) {
            internalTexture._cachedWrapV = texture.wrapV;
            _setTextureParameterInteger(engineState, target, engineState._gl.TEXTURE_WRAP_T, _getTextureWrapMode(engineState, texture.wrapV), internalTexture);
        }

        if (internalTexture.is3D && internalTexture._cachedWrapR !== texture.wrapR) {
            internalTexture._cachedWrapR = texture.wrapR;
            _setTextureParameterInteger(engineState, target, engineState._gl.TEXTURE_WRAP_R, _getTextureWrapMode(engineState, texture.wrapR), internalTexture);
        }

        _setAnisotropicLevel(engineState, target, internalTexture, texture.anisotropicFilteringLevel);
    }

    return true;
}

/**
 * Sets an array of texture to the webGL context
 * @param channel defines the channel where the texture array must be set
 * @param uniform defines the associated uniform location
 * @param textures defines the array of textures to bind
 * @param name name of the channel
 */
export function setTextureArray(engineState: IWebGLEnginePublic, channel: number, uniform: Nullable<WebGLUniformLocation>, textures: ThinTexture[], name: string): void {
    const fes = engineState as WebGLEngineStateFull;
    if (channel === undefined || !uniform) {
        return;
    }

    if (!fes._textureUnits || fes._textureUnits.length !== textures.length) {
        fes._textureUnits = new Int32Array(textures.length);
    }
    for (let i = 0; i < textures.length; i++) {
        const texture = textures[i].getInternalTexture();

        if (texture) {
            fes._textureUnits[i] = channel + i;
            texture._associatedChannel = channel + i;
        } else {
            fes._textureUnits[i] = -1;
        }
    }
    fes._gl.uniform1iv(uniform, fes._textureUnits);

    for (let index = 0; index < textures.length; index++) {
        _setTexture(fes, fes._textureUnits[index], textures[index], true);
    }
}

/**
 * @internal
 */
export function _setAnisotropicLevel(engineState: IWebGLEnginePublic, target: number, internalTexture: InternalTexture, anisotropicFilteringLevel: number) {
    const fes = engineState as WebGLEngineState;
    const anisotropicFilterExtension = fes._caps.textureAnisotropicFilterExtension;
    if (
        internalTexture.samplingMode !== TEXTURE_LINEAR_LINEAR_MIPNEAREST &&
        internalTexture.samplingMode !== TEXTURE_LINEAR_LINEAR_MIPLINEAR &&
        internalTexture.samplingMode !== TEXTURE_LINEAR_LINEAR
    ) {
        anisotropicFilteringLevel = 1; // Forcing the anisotropic to 1 because else webgl will force filters to linear
    }

    if (anisotropicFilterExtension && internalTexture._cachedAnisotropicFilteringLevel !== anisotropicFilteringLevel) {
        _setTextureParameterFloat(
            fes,
            target,
            anisotropicFilterExtension.TEXTURE_MAX_ANISOTROPY_EXT,
            Math.min(anisotropicFilteringLevel, fes._caps.maxAnisotropy),
            internalTexture
        );
        internalTexture._cachedAnisotropicFilteringLevel = anisotropicFilteringLevel;
    }
}

export function _setTextureParameterFloat(engineState: WebGLEngineState, target: number, parameter: number, value: number, texture: InternalTexture): void {
    _bindTextureDirectly(engineState, target, texture, true, true);
    engineState._gl.texParameterf(target, parameter, value);
}

export function _setTextureParameterInteger(engineState: WebGLEngineState, target: number, parameter: number, value: number, texture?: InternalTexture) {
    if (texture) {
        _bindTextureDirectly(engineState, target, texture, true, true);
    }
    engineState._gl.texParameteri(target, parameter, value);
}

/**
 * Unbind all vertex attributes from the webGL context
 */
export function unbindAllAttributes(engineState: IWebGLEnginePublic) {
    const fes = engineState as WebGLEngineStateFull;
    if (fes._mustWipeVertexAttributes) {
        fes._mustWipeVertexAttributes = false;

        for (let i = 0; i < fes._caps.maxVertexAttribs; i++) {
            disableAttributeByIndex(engineState, i);
        }
        return;
    }

    for (let i = 0, ul = fes._vertexAttribArraysEnabled.length; i < ul; i++) {
        if (i >= fes._caps.maxVertexAttribs || !fes._vertexAttribArraysEnabled[i]) {
            continue;
        }

        disableAttributeByIndex(engineState, i);
    }
}

/**
 * Force the engine to release all cached effects. This means that next effect compilation will have to be done completely even if a similar effect was already compiled
 */
export function releaseEffects(engineState: IWebGLEnginePublic) {
    const fes = engineState as WebGLEngineState;
    for (const name in fes._compiledEffects) {
        const webGLPipelineContext = fes._compiledEffects[name].getPipelineContext() as WebGLPipelineContext;
        _deletePipelineContext(engineState, webGLPipelineContext);
    }

    fes._compiledEffects = {};
}

/**
 * Attach a new callback raised when context lost event is fired
 * @param callback defines the callback to call
 */
export function attachContextLostEvent(engineState: IWebGLEnginePublic, callback: (event: WebGLContextEvent) => void): void {
    const fes = engineState as WebGLEngineState;
    if (fes._renderingCanvas) {
        fes._renderingCanvas.addEventListener("webglcontextlost", <any>callback, false);
    }
}

/**
 * Attach a new callback raised when context restored event is fired
 * @param callback defines the callback to call
 */
export function attachContextRestoredEvent(engineState: IWebGLEnginePublic, callback: (event: WebGLContextEvent) => void): void {
    const fes = engineState as WebGLEngineState;
    if (fes._renderingCanvas) {
        fes._renderingCanvas.addEventListener("webglcontextrestored", <any>callback, false);
    }
}

/**
 * Get the current error code of the webGL context
 * @returns the error code
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getError
 */
export function getError(engineState: IWebGLEnginePublic): number {
    return (engineState as WebGLEngineState)._gl.getError();
}

function _canRenderToFloatFramebuffer(engineState: IWebGLEnginePublic): boolean {
    const fes = engineState as WebGLEngineState;
    if (fes._webGLVersion > 1) {
        return fes._caps.colorBufferFloat;
    }
    return _canRenderToFramebuffer(engineState, TEXTURETYPE_FLOAT);
}

function _canRenderToHalfFloatFramebuffer(engineState: IWebGLEnginePublic): boolean {
    const fes = engineState as WebGLEngineState;
    if (fes._webGLVersion > 1) {
        return fes._caps.colorBufferFloat;
    }
    return _canRenderToFramebuffer(engineState, TEXTURETYPE_HALF_FLOAT);
}

// Thank you : http://stackoverflow.com/questions/28827511/webgl-ios-render-to-floating-point-texture
function _canRenderToFramebuffer(engineState: IWebGLEnginePublic, type: number): boolean {
    const fes = engineState as WebGLEngineState;
    const gl = fes._gl;

    //clear existing errors
    // eslint-disable-next-line no-empty
    while (gl.getError() !== gl.NO_ERROR) {}

    let successful = true;

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, _getRGBABufferInternalSizedFormat(engineState, type), 1, 1, 0, gl.RGBA, _getWebGLTextureType(engineState, type), null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

    successful = successful && status === gl.FRAMEBUFFER_COMPLETE;
    successful = successful && gl.getError() === gl.NO_ERROR;

    //try render by clearing frame buffer's color buffer
    if (successful) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        successful = successful && gl.getError() === gl.NO_ERROR;
    }

    //try reading from frame to ensure render occurs (just creating the FBO is not sufficient to determine if rendering is supported)
    if (successful) {
        //in practice it's sufficient to just read from the backbuffer rather than handle potentially issues reading from the texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        const readFormat = gl.RGBA;
        const readType = gl.UNSIGNED_BYTE;
        const buffer = new Uint8Array(4);
        gl.readPixels(0, 0, 1, 1, readFormat, readType, buffer);
        successful = successful && gl.getError() === gl.NO_ERROR;
    }

    //clean up
    gl.deleteTexture(texture);
    gl.deleteFramebuffer(fb);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    //clear accumulated errors
    // eslint-disable-next-line no-empty
    while (!successful && gl.getError() !== gl.NO_ERROR) {}

    return successful;
}

/**
 * @internal
 */
export function _getWebGLTextureType(engineState: IWebGLEnginePublic, type: number): number {
    const fes = engineState as WebGLEngineState;
    if (fes._webGLVersion === 1) {
        switch (type) {
            case TEXTURETYPE_FLOAT:
                return fes._gl.FLOAT;
            case TEXTURETYPE_HALF_FLOAT:
                return fes._gl.HALF_FLOAT_OES;
            case TEXTURETYPE_UNSIGNED_BYTE:
                return fes._gl.UNSIGNED_BYTE;
            case TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
                return fes._gl.UNSIGNED_SHORT_4_4_4_4;
            case TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
                return fes._gl.UNSIGNED_SHORT_5_5_5_1;
            case TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
                return fes._gl.UNSIGNED_SHORT_5_6_5;
        }
        return fes._gl.UNSIGNED_BYTE;
    }

    switch (type) {
        case TEXTURETYPE_BYTE:
            return fes._gl.BYTE;
        case TEXTURETYPE_UNSIGNED_BYTE:
            return fes._gl.UNSIGNED_BYTE;
        case TEXTURETYPE_SHORT:
            return fes._gl.SHORT;
        case TEXTURETYPE_UNSIGNED_SHORT:
            return fes._gl.UNSIGNED_SHORT;
        case TEXTURETYPE_INT:
            return fes._gl.INT;
        case TEXTURETYPE_UNSIGNED_INTEGER: // Refers to UNSIGNED_INT
            return fes._gl.UNSIGNED_INT;
        case TEXTURETYPE_FLOAT:
            return fes._gl.FLOAT;
        case TEXTURETYPE_HALF_FLOAT:
            return fes._gl.HALF_FLOAT;
        case TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
            return fes._gl.UNSIGNED_SHORT_4_4_4_4;
        case TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
            return fes._gl.UNSIGNED_SHORT_5_5_5_1;
        case TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
            return fes._gl.UNSIGNED_SHORT_5_6_5;
        case TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV:
            return fes._gl.UNSIGNED_INT_2_10_10_10_REV;
        case TEXTURETYPE_UNSIGNED_INT_24_8:
            return fes._gl.UNSIGNED_INT_24_8;
        case TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV:
            return fes._gl.UNSIGNED_INT_10F_11F_11F_REV;
        case TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV:
            return fes._gl.UNSIGNED_INT_5_9_9_9_REV;
        case TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV:
            return fes._gl.FLOAT_32_UNSIGNED_INT_24_8_REV;
    }

    return fes._gl.UNSIGNED_BYTE;
}

/**
 * @internal
 */
export function _getInternalFormat(engineState: IWebGLEnginePublic, format: number, useSRGBBuffer = false): number {
    const fes = engineState as WebGLEngineState;
    let internalFormat: GLenum = useSRGBBuffer ? fes._glSRGBExtensionValues.SRGB8_ALPHA8 : fes._gl.RGBA;

    switch (format) {
        case TEXTUREFORMAT_ALPHA:
            internalFormat = fes._gl.ALPHA;
            break;
        case TEXTUREFORMAT_LUMINANCE:
            internalFormat = fes._gl.LUMINANCE;
            break;
        case TEXTUREFORMAT_LUMINANCE_ALPHA:
            internalFormat = fes._gl.LUMINANCE_ALPHA;
            break;
        case TEXTUREFORMAT_RED:
            internalFormat = fes._gl.RED;
            break;
        case TEXTUREFORMAT_RG:
            internalFormat = fes._gl.RG;
            break;
        case TEXTUREFORMAT_RGB:
            internalFormat = useSRGBBuffer ? fes._glSRGBExtensionValues.SRGB : fes._gl.RGB;
            break;
        case TEXTUREFORMAT_RGBA:
            internalFormat = useSRGBBuffer ? fes._glSRGBExtensionValues.SRGB8_ALPHA8 : fes._gl.RGBA;
            break;
    }

    if (fes._webGLVersion > 1) {
        switch (format) {
            case TEXTUREFORMAT_RED_INTEGER:
                internalFormat = fes._gl.RED_INTEGER;
                break;
            case TEXTUREFORMAT_RG_INTEGER:
                internalFormat = fes._gl.RG_INTEGER;
                break;
            case TEXTUREFORMAT_RGB_INTEGER:
                internalFormat = fes._gl.RGB_INTEGER;
                break;
            case TEXTUREFORMAT_RGBA_INTEGER:
                internalFormat = fes._gl.RGBA_INTEGER;
                break;
        }
    }

    return internalFormat;
}

/**
 * @internal
 */
export function _getRGBABufferInternalSizedFormat(engineState: IWebGLEnginePublic, type: number, format?: number, useSRGBBuffer = false): number {
    const fes = engineState as WebGLEngineState;
    if (fes._webGLVersion === 1) {
        if (format !== undefined) {
            switch (format) {
                case TEXTUREFORMAT_ALPHA:
                    return fes._gl.ALPHA;
                case TEXTUREFORMAT_LUMINANCE:
                    return fes._gl.LUMINANCE;
                case TEXTUREFORMAT_LUMINANCE_ALPHA:
                    return fes._gl.LUMINANCE_ALPHA;
                case TEXTUREFORMAT_RGB:
                    return useSRGBBuffer ? fes._glSRGBExtensionValues.SRGB : fes._gl.RGB;
            }
        }
        return fes._gl.RGBA;
    }

    switch (type) {
        case TEXTURETYPE_BYTE:
            switch (format) {
                case TEXTUREFORMAT_RED:
                    return fes._gl.R8_SNORM;
                case TEXTUREFORMAT_RG:
                    return fes._gl.RG8_SNORM;
                case TEXTUREFORMAT_RGB:
                    return fes._gl.RGB8_SNORM;
                case TEXTUREFORMAT_RED_INTEGER:
                    return fes._gl.R8I;
                case TEXTUREFORMAT_RG_INTEGER:
                    return fes._gl.RG8I;
                case TEXTUREFORMAT_RGB_INTEGER:
                    return fes._gl.RGB8I;
                case TEXTUREFORMAT_RGBA_INTEGER:
                    return fes._gl.RGBA8I;
                default:
                    return fes._gl.RGBA8_SNORM;
            }
        case TEXTURETYPE_UNSIGNED_BYTE:
            switch (format) {
                case TEXTUREFORMAT_RED:
                    return fes._gl.R8;
                case TEXTUREFORMAT_RG:
                    return fes._gl.RG8;
                case TEXTUREFORMAT_RGB:
                    return useSRGBBuffer ? fes._glSRGBExtensionValues.SRGB8 : fes._gl.RGB8; // By default. Other possibilities are RGB565, SRGB8.
                case TEXTUREFORMAT_RGBA:
                    return useSRGBBuffer ? fes._glSRGBExtensionValues.SRGB8_ALPHA8 : fes._gl.RGBA8; // By default. Other possibilities are RGB5_A1, RGBA4, SRGB8_ALPHA8.
                case TEXTUREFORMAT_RED_INTEGER:
                    return fes._gl.R8UI;
                case TEXTUREFORMAT_RG_INTEGER:
                    return fes._gl.RG8UI;
                case TEXTUREFORMAT_RGB_INTEGER:
                    return fes._gl.RGB8UI;
                case TEXTUREFORMAT_RGBA_INTEGER:
                    return fes._gl.RGBA8UI;
                case TEXTUREFORMAT_ALPHA:
                    return fes._gl.ALPHA;
                case TEXTUREFORMAT_LUMINANCE:
                    return fes._gl.LUMINANCE;
                case TEXTUREFORMAT_LUMINANCE_ALPHA:
                    return fes._gl.LUMINANCE_ALPHA;
                default:
                    return fes._gl.RGBA8;
            }
        case TEXTURETYPE_SHORT:
            switch (format) {
                case TEXTUREFORMAT_RED_INTEGER:
                    return fes._gl.R16I;
                case TEXTUREFORMAT_RG_INTEGER:
                    return fes._gl.RG16I;
                case TEXTUREFORMAT_RGB_INTEGER:
                    return fes._gl.RGB16I;
                case TEXTUREFORMAT_RGBA_INTEGER:
                    return fes._gl.RGBA16I;
                default:
                    return fes._gl.RGBA16I;
            }
        case TEXTURETYPE_UNSIGNED_SHORT:
            switch (format) {
                case TEXTUREFORMAT_RED_INTEGER:
                    return fes._gl.R16UI;
                case TEXTUREFORMAT_RG_INTEGER:
                    return fes._gl.RG16UI;
                case TEXTUREFORMAT_RGB_INTEGER:
                    return fes._gl.RGB16UI;
                case TEXTUREFORMAT_RGBA_INTEGER:
                    return fes._gl.RGBA16UI;
                default:
                    return fes._gl.RGBA16UI;
            }
        case TEXTURETYPE_INT:
            switch (format) {
                case TEXTUREFORMAT_RED_INTEGER:
                    return fes._gl.R32I;
                case TEXTUREFORMAT_RG_INTEGER:
                    return fes._gl.RG32I;
                case TEXTUREFORMAT_RGB_INTEGER:
                    return fes._gl.RGB32I;
                case TEXTUREFORMAT_RGBA_INTEGER:
                    return fes._gl.RGBA32I;
                default:
                    return fes._gl.RGBA32I;
            }
        case TEXTURETYPE_UNSIGNED_INTEGER: // Refers to UNSIGNED_INT
            switch (format) {
                case TEXTUREFORMAT_RED_INTEGER:
                    return fes._gl.R32UI;
                case TEXTUREFORMAT_RG_INTEGER:
                    return fes._gl.RG32UI;
                case TEXTUREFORMAT_RGB_INTEGER:
                    return fes._gl.RGB32UI;
                case TEXTUREFORMAT_RGBA_INTEGER:
                    return fes._gl.RGBA32UI;
                default:
                    return fes._gl.RGBA32UI;
            }
        case TEXTURETYPE_FLOAT:
            switch (format) {
                case TEXTUREFORMAT_RED:
                    return fes._gl.R32F; // By default. Other possibility is R16F.
                case TEXTUREFORMAT_RG:
                    return fes._gl.RG32F; // By default. Other possibility is RG16F.
                case TEXTUREFORMAT_RGB:
                    return fes._gl.RGB32F; // By default. Other possibilities are RGB16F, R11F_G11F_B10F, RGB9_E5.
                case TEXTUREFORMAT_RGBA:
                    return fes._gl.RGBA32F; // By default. Other possibility is RGBA16F.
                default:
                    return fes._gl.RGBA32F;
            }
        case TEXTURETYPE_HALF_FLOAT:
            switch (format) {
                case TEXTUREFORMAT_RED:
                    return fes._gl.R16F;
                case TEXTUREFORMAT_RG:
                    return fes._gl.RG16F;
                case TEXTUREFORMAT_RGB:
                    return fes._gl.RGB16F; // By default. Other possibilities are R11F_G11F_B10F, RGB9_E5.
                case TEXTUREFORMAT_RGBA:
                    return fes._gl.RGBA16F;
                default:
                    return fes._gl.RGBA16F;
            }
        case TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
            return fes._gl.RGB565;
        case TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV:
            return fes._gl.R11F_G11F_B10F;
        case TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV:
            return fes._gl.RGB9_E5;
        case TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
            return fes._gl.RGBA4;
        case TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
            return fes._gl.RGB5_A1;
        case TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV:
            switch (format) {
                case TEXTUREFORMAT_RGBA:
                    return fes._gl.RGB10_A2; // By default. Other possibility is RGB5_A1.
                case TEXTUREFORMAT_RGBA_INTEGER:
                    return fes._gl.RGB10_A2UI;
                default:
                    return fes._gl.RGB10_A2;
            }
    }

    return useSRGBBuffer ? fes._glSRGBExtensionValues.SRGB8_ALPHA8 : fes._gl.RGBA8;
}

/**
 * @internal
 */
export function _getRGBAMultiSampleBufferFormat(engineState: IWebGLEnginePublic, type: number, format = TEXTUREFORMAT_RGBA): number {
    const fes = engineState as WebGLEngineState;
    switch (type) {
        case TEXTURETYPE_FLOAT:
            switch (format) {
                case TEXTUREFORMAT_R:
                    return fes._gl.R32F;
                default:
                    return fes._gl.RGBA32F;
            }
        case TEXTURETYPE_HALF_FLOAT:
            switch (format) {
                case TEXTUREFORMAT_R:
                    return fes._gl.R16F;
                default:
                    return fes._gl.RGBA16F;
            }
    }

    return fes._gl.RGBA8;
}

/**
 * Reads pixels from the current frame buffer. Please note that this function can be slow
 * @param x defines the x coordinate of the rectangle where pixels must be read
 * @param y defines the y coordinate of the rectangle where pixels must be read
 * @param width defines the width of the rectangle where pixels must be read
 * @param height defines the height of the rectangle where pixels must be read
 * @param hasAlpha defines whether the output should have alpha or not (defaults to true)
 * @param flushRenderer true to flush the renderer from the pending commands before reading the pixels
 * @returns a ArrayBufferView promise (Uint8Array) containing RGBA colors
 */
export function readPixels(engineState: IWebGLEnginePublic, x: number, y: number, width: number, height: number, hasAlpha = true, flushRenderer = true): Promise<ArrayBufferView> {
    const fes = engineState as WebGLEngineStateFull;
    const numChannels = hasAlpha ? 4 : 3;
    const format = hasAlpha ? fes._gl.RGBA : fes._gl.RGB;
    const data = new Uint8Array(height * width * numChannels);
    if (flushRenderer) {
        flushFramebuffer(engineState);
    }
    fes._gl.readPixels(x, y, width, height, format, fes._gl.UNSIGNED_BYTE, data);
    return Promise.resolve(data);
}
