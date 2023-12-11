/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable babylonjs/available */
import type { DataArray, IndicesArray, Nullable } from "core/types";
import type { IBaseEngineProtected, IBaseEnginePublic, IBaseEngineInternals, IBaseEngineOptions } from "../engine.base";
import {
    initBaseEngineState,
    endFrame as endFrameBase,
    getRenderWidth as getRenderWidthBase,
    getRenderHeight as getRenderHeightBase,
    setSizeBase,
    _viewport as _viewportBase,
    dispose as disposeBase,
    resetTextureCache,
    _prepareWorkingCanvas,
    getHostDocument,
    _setupMobileChecks,
    _getGlobalDefines,
    getCaps,
    getLoadedTexturesCache,
} from "../engine.base";
import { WebGLShaderProcessor } from "core/Engines/WebGL/webGLShaderProcessors";
import type { DataBuffer } from "core/Buffers/dataBuffer";
import type { IEffectCreationOptions } from "core/Materials/effect";
import { Effect } from "core/Materials/effect";
import type { IColor4Like, IViewportLike } from "core/Maths/math.like";
import { Constants } from "../engine.constants";
import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import type { WebGLRenderTargetWrapper } from "core/Engines/WebGL/webGLRenderTargetWrapper";
import * as _ from "lodash";
import { WebGLDataBuffer } from "core/Meshes/WebGL/webGLDataBuffer";
import { WebGLPipelineContext } from "core/Engines/WebGL/webGLPipelineContext";
import type { IPipelineContext } from "core/Engines/IPipelineContext";
import type { VertexBuffer } from "core/Buffers/buffer";
import type { InstancingAttributeInfo } from "core/Engines/instancingAttributeInfo";
import { InternalTextureSource, InternalTexture } from "core/Materials/Textures/internalTexture";
import { _loadFile, _reportDrawCall } from "../engine.tools";
import type { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import type { ThinTexture } from "core/Materials/Textures/thinTexture";
import type { VideoTexture } from "core/Materials/Textures/videoTexture";
import type { ISceneLike } from "../engine.interfaces";
import { EngineStore, ExceptionList, GetExponentOfTwo, Version } from "../engine.static";
import type { Scene } from "core/scene";
import type { InternalTextureCreationOptions, TextureSize } from "core/Materials/Textures/textureCreationOptions";
import { Logger } from "core/Misc/logger";
import type { HardwareTextureWrapper } from "core/Materials/Textures/hardwareTextureWrapper";
import { WebGLHardwareTexture } from "core/Engines/WebGL/webGLHardwareTexture";
import { DrawWrapper } from "core/Materials/drawWrapper";
import type { IEffectFallbacks } from "core/Materials/iEffectFallbacks";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { augmentEngineState } from "../engine.adapters";
import { StencilStateComposer } from "core/States/stencilStateComposer";
import { DepthCullingState } from "core/States/depthCullingState";
import type { ThinEngine } from "core/Engines/thinEngine";
import { EngineExtensions, getEngineExtension } from "../Extensions/engine.extensions";
import type { ShaderProcessingContext } from "core/Engines/Processors/shaderProcessingOptions";
import type { PostProcess } from "core/PostProcesses/postProcess";
import type { IShaderProcessor } from "core/Engines/Processors/iShaderProcessor";
import { IsWindowObjectExist } from "../runtimeEnvironment";
import { PerfCounter } from "core/Misc/perfCounter";
import {
    _createTextureBase,
    _restoreEngineAfterContextLost,
    resizeBase,
    setDepthStencilTextureBase,
    setDirectViewportBase,
    setTextureFromPostProcessBase,
    setTextureFromPostProcessOutputBase,
    setViewportBase,
    setHardwareScalingLevelBase,
} from "../engine.extendable";
import type { Engine } from "core/Engines/engine";
import type { IStencilState } from "core/States/IStencilState";
import { WebGL2ShaderProcessor } from "core/Engines/WebGL/webGL2ShaderProcessors";

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
    _rescalePostProcess: Nullable<PostProcess>;
    _onContextLost?: (evt: Event) => void;
    _onContextRestored?: (evt: Event) => void;
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
    _creationOptions: IWebGLEngineOptions;
}

interface TexImageParameters {
    internalFormat: number;
    format: number;
    type: number;
}

const internalTextureWebGLAdapter: { [key: string]: Function } = {
    _createHardwareTexture,
    updateTextureDimensions: () => {},
    getLoadedTexturesCache,
    _releaseTexture,
    getCaps,
};

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
    _drawCalls: PerfCounter;
}

export interface IWebGLEnginePublic extends IBaseEnginePublic {
    // duplicate of "version" in IBaseEnginePublic
    webGLVersion: number;
    enableUnpackFlipYCached: boolean;
}

export interface IWebGLEngineOptions extends IBaseEngineOptions, WebGLContextAttributes {
    /**
     * If sRGB Buffer support is not set during construction, use this value to force a specific state
     * This is added due to an issue when processing textures in chrome/edge/firefox
     * This will not influence NativeEngine and WebGPUEngine which set the behavior to true during construction.
     */
    forceSRGBBufferSupportState?: boolean;
    /**
     * Defines that engine should compile shaders with high precision floats (if supported). True by default
     */
    useHighPrecisionFloats?: boolean;

    /**
     * Defines if webgl2 should be turned off even if supported
     * @see https://doc.babylonjs.com/setup/support/webGL2
     */
    disableWebGL2Support?: boolean;

    /**
     * Defines if the gl context should be released.
     * It's false by default for backward compatibility, but you should probably pass true (see https://registry.khronos.org/webgl/extensions/WEBGL_lose_context/)
     */
    loseContextOnDispose?: boolean;
}

export type WebGLEngineState = IWebGLEnginePublic & IWebGLEngineInternals & IWebGLEngineProtected;
type WebGLEngineStateFull = WebGLEngineState & IWebGLEnginePrivate;

export function initWebGLEngineState(
    canvasOrContext: Nullable<HTMLCanvasElement | OffscreenCanvas | WebGLRenderingContext | WebGL2RenderingContext>,
    options: IWebGLEngineOptions = {}
): WebGLEngineState {
    const baseEngineState = initBaseEngineState(
        {
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
        },
        options
    );

    // private
    const ps = baseEngineState as WebGLEngineStateFull;
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
    ps._rescalePostProcess = null;
    ps._currentBufferPointers = [];
    ps._drawCalls = new PerfCounter();
    ps._currentInstanceLocations = [];
    ps._currentInstanceBuffers = [];

    ps._stencilStateComposer.stencilGlobal = ps._stencilState;

    let canvas: Nullable<HTMLCanvasElement> = null;

    if ((canvasOrContext as any).getContext) {
        canvas = <HTMLCanvasElement>canvasOrContext;
        ps._renderingCanvas = canvas;

        if (options.preserveDrawingBuffer === undefined) {
            options.preserveDrawingBuffer = false;
        }

        // Exceptions
        if (navigator && navigator.userAgent) {
            _setupMobileChecks(ps);

            const ua = navigator.userAgent;
            for (const exception of ExceptionList.webgl) {
                const key = exception.key;
                const targets = exception.targets;
                const check = new RegExp(key);

                if (check.test(ua)) {
                    if (exception.capture && exception.captureConstraint) {
                        const capture = exception.capture;
                        const constraint = exception.captureConstraint;

                        const regex = new RegExp(capture);
                        const matches = regex.exec(ua);

                        if (matches && matches.length > 0) {
                            const capturedValue = parseInt(matches[matches.length - 1]);
                            if (capturedValue >= constraint) {
                                continue;
                            }
                        }
                    }

                    for (const target of targets) {
                        switch (target) {
                            case "uniformBuffer":
                                ps.disableUniformBuffers = true;
                                break;
                            case "vao":
                                ps.disableVertexArrayObjects = true;
                                break;
                            case "antialias":
                                options.antialias = false;
                                break;
                            case "maxMSAASamples":
                                ps._maxMSAASamplesOverride = 1;
                                break;
                        }
                    }
                }
            }
        }

        // Context lost
        if (!ps.doNotHandleContextLost) {
            ps._onContextLost = (evt: Event) => {
                evt.preventDefault();
                ps._contextWasLost = true;
                Logger.Warn("WebGL context lost.");

                ps.onContextLostObservable.notifyObservers(ps);
            };

            ps._onContextRestored = () => {
                _restoreEngineAfterContextLost({ wipeCaches }, ps, () => _initGLContext(ps));
            };

            canvas.addEventListener("webglcontextlost", ps._onContextLost, false);
            canvas.addEventListener("webglcontextrestored", ps._onContextRestored, false);

            options.powerPreference = options.powerPreference || "high-performance";
        }

        // Detect if we are running on a faulty buggy desktop OS.
        ps._badDesktopOS = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        // if (ps._badDesktopOS) {
        //     options.xrCompatible = false;
        // }

        // GL
        if (!options.disableWebGL2Support) {
            try {
                ps._gl = <any>(canvas.getContext("webgl2", options) || canvas.getContext("experimental-webgl2", options));
                if (ps._gl) {
                    ps._webGLVersion = 2.0;
                    ps._shaderPlatformName = "WEBGL2";

                    // Prevent weird browsers to lie (yeah that happens!)
                    if (!ps._gl.deleteQuery) {
                        ps._webGLVersion = 1.0;
                        ps._shaderPlatformName = "WEBGL1";
                    }
                }
            } catch (e) {
                // Do nothing
            }
        }

        if (!ps._gl) {
            if (!canvas) {
                throw new Error("The provided canvas is null or undefined.");
            }
            try {
                ps._gl = <WebGL2RenderingContext>(canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options));
            } catch (e) {
                throw new Error("WebGL not supported");
            }
        }

        if (!ps._gl) {
            throw new Error("WebGL not supported");
        }
    } else {
        ps._gl = <WebGL2RenderingContext>canvasOrContext;
        ps._renderingCanvas = ps._gl.canvas as HTMLCanvasElement;

        if ((ps._gl as any).renderbufferStorageMultisample) {
            ps._webGLVersion = 2.0;
            ps._shaderPlatformName = "WEBGL2";
        } else {
            ps._webGLVersion = 1.0;
            ps._shaderPlatformName = "WEBGL1";
        }

        const attributes = ps._gl.getContextAttributes();
        if (attributes) {
            options.stencil = attributes.stencil;
        }
    }

    ps._shaderProcessor = ps._webGLVersion > 1 ? new WebGL2ShaderProcessor() : new WebGLShaderProcessor();

    // Ensures a consistent color space unpacking of textures cross browser.
    ps._gl.pixelStorei(ps._gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, ps._gl.NONE);

    if (options.useHighPrecisionFloats !== undefined) {
        ps._highPrecisionShadersAllowed = options.useHighPrecisionFloats;
    }

    resize(ps);

    _initGLContext(ps);
    _initFeatures(ps);

    // Prepare buffer pointers
    for (let i = 0; i < ps._caps.maxVertexAttribs; i++) {
        ps._currentBufferPointers[i] = new BufferPointer();
    }

    // Detect if we are running on a faulty buggy OS.
    ps._badOS = /iPad/i.test(navigator.userAgent) || /iPhone/i.test(navigator.userAgent);

    // Starting with iOS 14, we can trust the browser
    // let matches = navigator.userAgent.match(/Version\/(\d+)/);

    // if (matches && matches.length === 2) {
    //     if (parseInt(matches[1]) >= 14) {
    //         this._badOS = false;
    //     }
    // }

    const versionToLog = `Babylon.js v${Version}`;
    Logger.Log(versionToLog + ` - ${ps.description}`);

    // Check setAttribute in case of workers
    if (ps._renderingCanvas && ps._renderingCanvas.setAttribute) {
        ps._renderingCanvas.setAttribute("data-engine", versionToLog);
    }

    return ps;
}

export function _getShaderProcessor(engineState: IWebGLEnginePublic, _shaderLanguage: ShaderLanguage): Nullable<IShaderProcessor> {
    const fes = engineState as WebGLEngineState;
    return fes._shaderProcessor;
}

/**
 * Gets an object containing information about the current webGL context
 * @param engineState defines the engine state
 * @returns an object containing the vendor, the renderer and the version of the current webGL context
 */
export function getGlInfo(engineState: IWebGLEnginePublic) {
    const fes = engineState as WebGLEngineStateFull;
    return {
        glVersion: fes._glVersion,
        glRenderer: fes._glRenderer,
        glVendor: fes._glVendor,
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
    return getRenderHeightBase(engineState, useScreen) || (engineState as WebGLEngineState)._gl.drawingBufferHeight;
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
 * @param engineState defines the engine state
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
                textureFormat === Constants.TEXTUREFORMAT_RED_INTEGER ||
                textureFormat === Constants.TEXTUREFORMAT_RG_INTEGER ||
                textureFormat === Constants.TEXTUREFORMAT_RGB_INTEGER ||
                textureFormat === Constants.TEXTUREFORMAT_RGBA_INTEGER
            ) {
                const textureType = fes._currentRenderTarget.texture?.type;
                if (textureType === Constants.TEXTURETYPE_UNSIGNED_INTEGER || textureType === Constants.TEXTURETYPE_UNSIGNED_SHORT) {
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

const setViewportInjectedMethods = {
    viewportChangedFunc: _viewport,
    getRenderHeightFunc: getRenderHeight,
    getRenderWidthFunc: getRenderWidth,
};
export const setViewport: (engineState: IWebGLEnginePublic, viewport: IViewportLike, requiredWidth?: number, requiredHeight?: number) => void = (
    engineState: IWebGLEnginePublic,
    viewport: IViewportLike,
    requiredWidth?: number,
    requiredHeight?: number
) => {
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
        } else if (webglRTWrapper._currentLOD !== lodLevel) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rtWrapper.texture!._hardwareTexture?.underlyingResource, lodLevel);
            webglRTWrapper._currentLOD = lodLevel;
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
    const fes = engineState as WebGLEngineStateFull;
    if (x !== fes._viewportCached.x || y !== fes._viewportCached.y || width !== fes._viewportCached.z || height !== fes._viewportCached.w) {
        fes._gl.viewport(x, y, width, height);
    }
    _viewportBase(engineState, x, y, width, height);
}

/**
 * @internal
 */
export function _bindUnboundFramebuffer(engineState: IWebGLEnginePublic, framebuffer: Nullable<WebGLFramebuffer>) {
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
            const extension = getEngineExtension(engineState, EngineExtensions.MULTI_RENDER);
            // This texture is part of a MRT texture, we need to treat all attachments
            extension.unBindMultiColorAttachmentFramebuffer(engineState, texture, disableGenerateMipMaps, onBeforeUnbind);
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
export function _resetVertexBufferBinding(engineState: IWebGLEnginePublic): void {
    const fes = engineState as WebGLEngineState;
    bindArrayBuffer(engineState, null);
    fes._cachedVertexBuffers = null;
}

/**
 * Creates a dynamic vertex buffer
 * @param data the data for the dynamic vertex buffer
 * @param _label defines the label of the buffer (for debug purpose)
 * @returns the new WebGL dynamic buffer
 */
export function createDynamicVertexBuffer(engineState: IWebGLEnginePublic, data: DataArray, _label?: string): DataBuffer {
    const fes = engineState as WebGLEngineState;
    return _createVertexBuffer(engineState, data, fes._gl.DYNAMIC_DRAW);
}

/**
 * Creates a vertex buffer
 * @param data the data for the vertex buffer
 * @param _updatable whether the buffer should be created as updatable
 * @param _label defines the label of the buffer (for debug purpose)
 * @returns the new WebGL static buffer
 */
export function createVertexBuffer(engineState: IWebGLEnginePublic, data: DataArray, _updatable?: boolean, _label?: string): DataBuffer {
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
 * @param _label defines the label of the buffer (for debug purpose)
 * @returns a new webGL buffer
 */
export function createIndexBuffer(engineState: IWebGLEnginePublic, indices: IndicesArray, updatable?: boolean, _label?: string): DataBuffer {
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
export function _deleteBuffer(engineState: IWebGLEnginePublic, buffer: DataBuffer): void {
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
        case Constants.MATERIAL_TriangleFillMode:
            return gl.TRIANGLES;
        case Constants.MATERIAL_PointFillMode:
            return gl.POINTS;
        case Constants.MATERIAL_WireFrameFillMode:
            return gl.LINES;
        // Draw modes
        case Constants.MATERIAL_PointListDrawMode:
            return gl.POINTS;
        case Constants.MATERIAL_LineListDrawMode:
            return gl.LINES;
        case Constants.MATERIAL_LineLoopDrawMode:
            return gl.LINE_LOOP;
        case Constants.MATERIAL_LineStripDrawMode:
            return gl.LINE_STRIP;
        case Constants.MATERIAL_TriangleStripDrawMode:
            return gl.TRIANGLE_STRIP;
        case Constants.MATERIAL_TriangleFanDrawMode:
            return gl.TRIANGLE_FAN;
        default:
            return gl.TRIANGLES;
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

    const engineAdapter = augmentEngineState<Engine>(engineState, {
        getHostDocument,
        _getShaderProcessor: (engineState: IWebGLEnginePublic) => (engineState as WebGLEngineState)._shaderProcessor,
        _loadFile,
        createPipelineContext,
        _getShaderSource,
        _isRenderingStateCompiled,
        _getGlobalDefines,
        getCaps,
        _preparePipelineContext,
        _executeWhenRenderingStateIsCompiled,
        getUniforms,
        getAttributes,
        bindSamplers,
        setMatrices,
        setInt,
        setIntArray,
        setIntArray2,
        setIntArray3,
        setIntArray4,
        setFloat,
        setFloat2,
        setFloat3,
        setFloat4,
        setTexture,
        setTextureArray,
        setUInt,
        setUInt2,
        setUInt3,
        setUInt4,
        setArray,
        setArray2,
        setArray3,
        setArray4,
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

function _compileShader(engineState: WebGLEngineStateFull, source: string, type: string, defines: Nullable<string>, shaderVersion: string): WebGLShader {
    return _compileRawShader(engineState, _ConcatenateShader(source, defines, shaderVersion), type);
}

function _compileRawShader(engineState: WebGLEngineStateFull, source: string, type: string): WebGLShader {
    const gl = engineState._gl;
    const shader = gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);

    if (!shader) {
        let error: GLenum = gl.NO_ERROR;
        let tempError: GLenum = gl.NO_ERROR;
        while ((tempError = gl.getError()) !== gl.NO_ERROR) {
            error = tempError;
        }

        throw new Error(
            `Something went wrong while creating a gl ${type} shader object. gl error=${error}, gl isContextLost=${gl.isContextLost()}, _contextWasLost=${
                engineState._contextWasLost
            }`
        );
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    return shader;
}

/**
 * @internal
 */
export function _getShaderSource(engineState: IWebGLEnginePublic, shader: WebGLShader): Nullable<string> {
    return (engineState as WebGLEngineStateFull)._gl.getShaderSource(shader);
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
    const fes = engineState as WebGLEngineStateFull;
    context = context || fes._gl;

    const vertexShader = _compileRawShader(fes, vertexCode, "vertex");
    const fragmentShader = _compileRawShader(fes, fragmentCode, "fragment");

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
            const extension = getEngineExtension(engineState, EngineExtensions.TRANSFORM_FEEDBACK);
            extension.deleteTransformFeedback(engineState, webGLPipelineContext.transformFeedback);
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
    const fes = engineState as WebGLEngineStateFull;
    context = context || fes._gl;

    const shaderVersion = fes._webGLVersion > 1 ? "#version 300 es\n#define WEBGL2 \n" : "";
    const vertexShader = _compileShader(fes, vertexCode, "vertex", defines, shaderVersion);
    const fragmentShader = _compileShader(fes, fragmentCode, "fragment", defines, shaderVersion);

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
    const engineAdapter = augmentEngineState<ThinEngine>(engineState, {
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

export function _createShaderProgramThin(
    engineState: WebGLEngineState,
    pipelineContext: WebGLPipelineContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
    context: WebGLRenderingContext,
    _transformFeedbackVaryings: Nullable<string[]> = null
): WebGLProgram {
    // This was in thin engine!

    const shaderProgram = context.createProgram();
    pipelineContext.program = shaderProgram;

    if (!shaderProgram) {
        throw new Error("Unable to create program");
    }

    context.attachShader(shaderProgram, vertexShader);
    context.attachShader(shaderProgram, fragmentShader);

    context.linkProgram(shaderProgram);

    pipelineContext.context = context;
    pipelineContext.vertexShader = vertexShader;
    pipelineContext.fragmentShader = fragmentShader;

    if (!pipelineContext.isParallelCompiled) {
        _finalizePipelineContext(engineState, pipelineContext);
    }

    return shaderProgram;
}

export function _createShaderProgram(
    engineState: WebGLEngineState,
    pipelineContext: WebGLPipelineContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
    context: WebGLRenderingContext,
    transformFeedbackVaryings: Nullable<string[]> = null
): WebGLProgram {
    const shaderProgram = context.createProgram();
    pipelineContext.program = shaderProgram;

    if (!shaderProgram) {
        throw new Error("Unable to create program");
    }

    context.attachShader(shaderProgram, vertexShader);
    context.attachShader(shaderProgram, fragmentShader);

    if (engineState.webGLVersion > 1 && transformFeedbackVaryings) {
        const extension = getEngineExtension(engineState, EngineExtensions.TRANSFORM_FEEDBACK);
        const transformFeedback = extension.createTransformFeedback(engineState);

        extension.bindTransformFeedback(engineState, transformFeedback);
        extension.setTransformFeedbackVaryings(engineState, shaderProgram, transformFeedbackVaryings);
        pipelineContext.transformFeedback = transformFeedback;
    }

    context.linkProgram(shaderProgram);

    if (engineState.webGLVersion > 1 && transformFeedbackVaryings) {
        const extension = getEngineExtension(engineState, EngineExtensions.TRANSFORM_FEEDBACK);
        extension.bindTransformFeedback(engineState, null);
    }

    pipelineContext.context = context;
    pipelineContext.vertexShader = vertexShader;
    pipelineContext.fragmentShader = fragmentShader;

    if (!pipelineContext.isParallelCompiled) {
        _finalizePipelineContext(engineState, pipelineContext);
    }

    return shaderProgram;
}

export function _finalizePipelineContext(engineState: WebGLEngineState, pipelineContext: WebGLPipelineContext) {
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
    _rawVertexSourceCode: string,
    _rawFragmentSourceCode: string,
    rebuildRebind: any,
    defines: Nullable<string>,
    transformFeedbackVaryings: Nullable<string[]>,
    _key: string
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
export function _executeWhenRenderingStateIsCompiled(_engineState: IWebGLEnginePublic, pipelineContext: IPipelineContext, action: () => void) {
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
    const results = [] as Array<Nullable<WebGLUniformLocation>>;
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
        fes._alphaMode = Constants.ALPHA_ADD;
        fes._alphaEquation = Constants.ALPHA_DISABLE;

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
        case Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST:
            magFilter = gl.LINEAR;
            if (generateMipMaps) {
                minFilter = gl.LINEAR_MIPMAP_NEAREST;
            } else {
                minFilter = gl.LINEAR;
            }
            break;
        case Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR:
            magFilter = gl.LINEAR;
            if (generateMipMaps) {
                minFilter = gl.LINEAR_MIPMAP_LINEAR;
            } else {
                minFilter = gl.LINEAR;
            }
            break;
        case Constants.TEXTURE_NEAREST_NEAREST_MIPLINEAR:
            magFilter = gl.NEAREST;
            if (generateMipMaps) {
                minFilter = gl.NEAREST_MIPMAP_LINEAR;
            } else {
                minFilter = gl.NEAREST;
            }
            break;
        case Constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST:
            magFilter = gl.NEAREST;
            if (generateMipMaps) {
                minFilter = gl.NEAREST_MIPMAP_NEAREST;
            } else {
                minFilter = gl.NEAREST;
            }
            break;
        case Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST:
            magFilter = gl.NEAREST;
            if (generateMipMaps) {
                minFilter = gl.LINEAR_MIPMAP_NEAREST;
            } else {
                minFilter = gl.LINEAR;
            }
            break;
        case Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR:
            magFilter = gl.NEAREST;
            if (generateMipMaps) {
                minFilter = gl.LINEAR_MIPMAP_LINEAR;
            } else {
                minFilter = gl.LINEAR;
            }
            break;
        case Constants.TEXTURE_NEAREST_LINEAR:
            magFilter = gl.NEAREST;
            minFilter = gl.LINEAR;
            break;
        case Constants.TEXTURE_NEAREST_NEAREST:
            magFilter = gl.NEAREST;
            minFilter = gl.NEAREST;
            break;
        case Constants.TEXTURE_LINEAR_NEAREST_MIPNEAREST:
            magFilter = gl.LINEAR;
            if (generateMipMaps) {
                minFilter = gl.NEAREST_MIPMAP_NEAREST;
            } else {
                minFilter = gl.NEAREST;
            }
            break;
        case Constants.TEXTURE_LINEAR_NEAREST_MIPLINEAR:
            magFilter = gl.LINEAR;
            if (generateMipMaps) {
                minFilter = gl.NEAREST_MIPMAP_LINEAR;
            } else {
                minFilter = gl.NEAREST;
            }
            break;
        case Constants.TEXTURE_LINEAR_LINEAR:
            magFilter = gl.LINEAR;
            minFilter = gl.LINEAR;
            break;
        case Constants.TEXTURE_LINEAR_NEAREST:
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
export function _createTexture(engineState: WebGLEngineState): WebGLTexture {
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
    let type = Constants.TEXTURETYPE_UNSIGNED_INT;
    let samplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
    let format = Constants.TEXTUREFORMAT_RGBA;
    let useSRGBBuffer = false;
    let samples = 1;
    let label: string | undefined;
    if (options !== undefined && typeof options === "object") {
        generateMipMaps = !!options.generateMipMaps;
        type = options.type === undefined ? Constants.TEXTURETYPE_UNSIGNED_INT : options.type;
        samplingMode = options.samplingMode === undefined ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : options.samplingMode;
        format = options.format === undefined ? Constants.TEXTUREFORMAT_RGBA : options.format;
        useSRGBBuffer = options.useSRGBBuffer === undefined ? false : options.useSRGBBuffer;
        samples = options.samples ?? 1;
        label = options.label;
    } else {
        generateMipMaps = !!options;
    }

    useSRGBBuffer &&= fes._caps.supportSRGBBuffers && fes.webGLVersion > 1;

    if (type === Constants.TEXTURETYPE_FLOAT && !fes._caps.textureFloatLinearFiltering) {
        // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
        samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    } else if (type === Constants.TEXTURETYPE_HALF_FLOAT && !fes._caps.textureHalfFloatLinearFiltering) {
        // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
        samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    }
    if (type === Constants.TEXTURETYPE_FLOAT && !fes._caps.textureFloat) {
        type = Constants.TEXTURETYPE_UNSIGNED_INT;
        Logger.Warn("Float textures are not supported. Type forced to Constants.TEXTURETYPE_UNSIGNED_BYTE");
    }

    const gl = fes._gl;
    const engineAdapter = augmentEngineState<Engine>(engineState, internalTextureWebGLAdapter);
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
 * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
 * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
 * @returns a InternalTexture for assignment back into BABYLON.Texture
 */
export function createTexture(
    engineState: IWebGLEnginePublic,
    url: Nullable<string>,
    noMipmap: boolean,
    invertY: boolean,
    scene: Nullable<ISceneLike>,
    samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
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
    const fes = engineState as WebGLEngineStateFull;
    const engineAdapter = augmentEngineState<Engine>(engineState, internalTextureWebGLAdapter);
    return _createTextureBase(
        {
            getUseSRGBBuffer: _getUseSRGBBuffer,
            engineAdapter,
        },
        engineState,
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

            const tip = _getTexImageParametersForCreateTexture(fes, format, extension, texture._useSRGBBuffer);

            if (isPot) {
                gl.texImage2D(gl.TEXTURE_2D, 0, tip.internalFormat, tip.format, tip.type, img as any);
                return false;
            }

            const maxTextureSize = fes._caps.maxTextureSize;

            if (img.width > maxTextureSize || img.height > maxTextureSize || !fes._supportsHardwareTextureRescaling) {
                _prepareWorkingCanvas(fes);
                if (!fes._workingCanvas || !fes._workingContext) {
                    return false;
                }

                fes._workingCanvas.width = potWidth;
                fes._workingCanvas.height = potHeight;

                fes._workingContext.drawImage(img as any, 0, 0, img.width, img.height, 0, 0, potWidth, potHeight);
                gl.texImage2D(gl.TEXTURE_2D, 0, tip.internalFormat, tip.format, tip.type, fes._workingCanvas as TexImageSource);

                texture.width = potWidth;
                texture.height = potHeight;

                return false;
            } else {
                // Using shaders when possible to rescale because canvas.drawImage is lossy
                const source = new InternalTexture(engineAdapter, InternalTextureSource.Temp);
                _bindTextureDirectly(engineState, gl.TEXTURE_2D, source, true);
                gl.texImage2D(gl.TEXTURE_2D, 0, tip.internalFormat, tip.format, tip.type, img as any);

                _rescaleTexture(fes, source, texture, scene, tip.format, () => {
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
 * Calls to the GL texImage2D and texImage3D functions require three arguments describing the pixel format of the texture.
 * createTexture derives these from the babylonFormat and useSRGBBuffer arguments and also the file extension of the URL it's working with.
 * This function encapsulates that derivation for easy unit testing.
 * @param babylonFormat Babylon's format enum, as specified in ITextureCreationOptions.
 * @param fileExtension The file extension including the dot, e.g. .jpg.
 * @param useSRGBBuffer Use SRGB not linear.
 * @returns The options to pass to texImage2D or texImage3D calls.
 * @internal
 */
export function _getTexImageParametersForCreateTexture(
    engineState: IWebGLEnginePublic,
    babylonFormat: Nullable<number>,
    fileExtension: string,
    useSRGBBuffer: boolean
): TexImageParameters {
    if (babylonFormat === undefined || babylonFormat === null) {
        babylonFormat = fileExtension === ".jpg" && !useSRGBBuffer ? Constants.TEXTUREFORMAT_RGB : Constants.TEXTUREFORMAT_RGBA;
    }

    const fes = engineState as WebGLEngineStateFull;

    let format: number, internalFormat: number;
    if (fes.webGLVersion === 1) {
        // In WebGL 1, format and internalFormat must be the same and taken from a limited set of values, see https://docs.gl/es2/glTexImage2D.
        // The SRGB extension (https://developer.mozilla.org/en-US/docs/Web/API/EXT_sRGB) adds some extra values, hence passing useSRGBBuffer
        // to getInternalFormat.
        format = _getInternalFormat(fes, babylonFormat, useSRGBBuffer);
        internalFormat = format;
    } else {
        // In WebGL 2, format has a wider range of values and internal format can be one of the sized formats, see
        // https://registry.khronos.org/OpenGL-Refpages/es3.0/html/glTexImage2D.xhtml.
        // SRGB is included in the sized format and should not be passed in "format", hence always passing useSRGBBuffer as false.
        format = _getInternalFormat(fes, babylonFormat, false);
        internalFormat = _getRGBABufferInternalSizedFormat(fes, Constants.TEXTURETYPE_UNSIGNED_BYTE, babylonFormat, useSRGBBuffer);
    }

    return {
        internalFormat,
        format,
        type: fes._gl.UNSIGNED_BYTE,
    };
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
    engineState: IWebGLEnginePublic,
    source: InternalTexture,
    destination: InternalTexture,
    scene: Nullable<any>,
    internalFormat: number,
    onComplete: () => void
): void {
    const fes = engineState as WebGLEngineStateFull;
    fes._gl.texParameteri(fes._gl.TEXTURE_2D, fes._gl.TEXTURE_MAG_FILTER, fes._gl.LINEAR);
    fes._gl.texParameteri(fes._gl.TEXTURE_2D, fes._gl.TEXTURE_MIN_FILTER, fes._gl.LINEAR);
    fes._gl.texParameteri(fes._gl.TEXTURE_2D, fes._gl.TEXTURE_WRAP_S, fes._gl.CLAMP_TO_EDGE);
    fes._gl.texParameteri(fes._gl.TEXTURE_2D, fes._gl.TEXTURE_WRAP_T, fes._gl.CLAMP_TO_EDGE);
    const extension = getEngineExtension(engineState, EngineExtensions.RENDER_TARGET);
    const rtt = extension.createRenderTargetTexture(
        engineState,
        {
            width: destination.width,
            height: destination.height,
        },
        {
            generateMipMaps: false,
            type: Constants.TEXTURETYPE_UNSIGNED_INT as number,
            samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE as number,
            generateDepthBuffer: false,
            generateStencilBuffer: false,
        }
    );

    if (!fes._rescalePostProcess && EngineStore._RescalePostProcessFactory) {
        fes._rescalePostProcess = EngineStore._RescalePostProcessFactory(engineState);
    }

    if (fes._rescalePostProcess) {
        fes._rescalePostProcess.externalTextureSamplerBinding = true;
        fes._rescalePostProcess.getEffect().executeWhenCompiled(() => {
            fes._rescalePostProcess!.onApply = function (effect) {
                effect._bindTexture("textureSampler", source);
            };

            let hostingScene: Scene = scene;

            if (!hostingScene) {
                hostingScene = engineState.scenes[engineState.scenes.length - 1];
            }
            hostingScene.postProcessManager.directRender([fes._rescalePostProcess!], rtt, true);

            _bindTextureDirectly(engineState, fes._gl.TEXTURE_2D, destination, true);
            fes._gl.copyTexImage2D(fes._gl.TEXTURE_2D, 0, internalFormat, 0, 0, destination.width, destination.height, 0);

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
export function _unpackFlipY(engineState: IWebGLEnginePublic, value: boolean): void {
    const fes = engineState as WebGLEngineStateFull;
    if (fes._unpackFlipYCached !== value) {
        fes._gl.pixelStorei(fes._gl.UNPACK_FLIP_Y_WEBGL, value ? 1 : 0);

        if (fes.enableUnpackFlipYCached) {
            fes._unpackFlipYCached = value;
        }
    }
}

/** @internal */
export function _getUnpackAlignement(engineState: IWebGLEnginePublic): number {
    const fes = engineState as WebGLEngineStateFull;
    return fes._gl.getParameter(fes._gl.UNPACK_ALIGNMENT);
}

function _getTextureTarget(engineState: IWebGLEnginePublic, texture: InternalTexture): number {
    const fes = engineState as WebGLEngineStateFull;
    if (texture.isCube) {
        return fes._gl.TEXTURE_CUBE_MAP;
    } else if (texture.is3D) {
        return fes._gl.TEXTURE_3D;
    } else if (texture.is2DArray || texture.isMultiview) {
        return fes._gl.TEXTURE_2D_ARRAY;
    }
    return fes._gl.TEXTURE_2D;
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
    internalTexture.samplingMode = bilinearFiltering ? Constants.TEXTURE_BILINEAR_SAMPLINGMODE : Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    internalTexture.type = Constants.TEXTURETYPE_UNSIGNED_INT;
    internalTexture._comparisonFunction = comparisonFunction;

    const gl = fes._gl;
    const target = _getTextureTarget(fes, internalTexture);
    const samplingParameters = _getSamplingParameters(fes, internalTexture.samplingMode, false);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, samplingParameters.mag);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, samplingParameters.min);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Constants.TEXTURE_COMPARE_FUNC/MODE are only available in WebGL2.
    if (engineState.webGLVersion > 1) {
        if (comparisonFunction === 0) {
            gl.texParameteri(target, gl.TEXTURE_COMPARE_FUNC, Constants.LEQUAL);
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
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB8_ETC2:
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_ETC1_WEBGL:
                // Note, if using ETC1 and sRGB is requested, this will use ETC2 if available.
                if (fes._caps.etc2) {
                    internalFormat = gl.COMPRESSED_SRGB8_ETC2;
                } else {
                    texture._useSRGBBuffer = false;
                }
                break;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA8_ETC2_EAC:
                if (fes._caps.etc2) {
                    internalFormat = gl.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC;
                } else {
                    texture._useSRGBBuffer = false;
                }
                break;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_BPTC_UNORM:
                internalFormat = gl.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT;
                break;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_ASTC_4x4:
                internalFormat = gl.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR;
                break;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGB_S3TC_DXT1:
                if (fes._caps.s3tc_srgb) {
                    internalFormat = gl.COMPRESSED_SRGB_S3TC_DXT1_EXT;
                } else {
                    // S3TC sRGB extension not supported
                    texture._useSRGBBuffer = false;
                }
                break;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT1:
                if (fes._caps.s3tc_srgb) {
                    internalFormat = gl.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;
                } else {
                    // S3TC sRGB extension not supported
                    texture._useSRGBBuffer = false;
                }
                break;
            case Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5:
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

export function _prepareWebGLTextureContinuation(
    engineState: IWebGLEnginePublic,
    texture: InternalTexture,
    scene: Nullable<ISceneLike>,
    noMipmap: boolean,
    isCompressed: boolean,
    samplingMode: number
): void {
    const gl = (engineState as WebGLEngineState)._gl;
    if (!gl) {
        return;
    }

    const filters = _getSamplingParameters(engineState as WebGLEngineState, samplingMode, !noMipmap);

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
    samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE
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
    texture.type = texture.type !== -1 ? texture.type : Constants.TEXTURETYPE_UNSIGNED_BYTE;
    texture.format = texture.format !== -1 ? texture.format : extension === ".jpg" && !texture._useSRGBBuffer ? Constants.TEXTUREFORMAT_RGB : Constants.TEXTUREFORMAT_RGBA;

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

export function _deleteTexture(engineState: IWebGLEnginePublic, texture: Nullable<WebGLTexture>): void {
    if (texture) {
        (engineState as WebGLEngineState)._gl.deleteTexture(texture);
    }
}

export function _setProgram(engineState: IWebGLEnginePublic, program: WebGLProgram): void {
    const fes = engineState as WebGLEngineState;
    if (fes._currentProgram !== program) {
        fes._gl.useProgram(program);
        fes._currentProgram = program;
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
            //(engineState as WebGLEngineStateFull)._gl.bindTexture(target, texture ? texture._colorTextureArray : null);
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

function _bindSamplerUniformToChannel(engineState: IWebGLEnginePublic, sourceSlot: number, destination: number) {
    const uniform = (engineState as WebGLEngineStateFull)._boundUniforms[sourceSlot];
    if (!uniform || uniform._currentState === destination) {
        return;
    }
    (engineState as WebGLEngineState)._gl.uniform1i(uniform, destination);
    uniform._currentState = destination;
}

function _getTextureWrapMode(engineState: IWebGLEnginePublic, mode: number): number {
    const gl = (engineState as WebGLEngineState)._gl;
    switch (mode) {
        case Constants.TEXTURE_WRAP_ADDRESSMODE:
            return gl.REPEAT;
        case Constants.TEXTURE_CLAMP_ADDRESSMODE:
            return gl.CLAMP_TO_EDGE;
        case Constants.TEXTURE_MIRROR_ADDRESSMODE:
            return gl.MIRRORED_REPEAT;
    }
    return gl.REPEAT;
}

export function _setTexture(
    engineState: IWebGLEnginePublic,
    channel: number,
    texture: Nullable<ThinTexture>,
    isPartOfTextureArray = false,
    depthStencilTexture = false,
    _name = ""
): boolean {
    const fes = engineState as WebGLEngineStateFull;
    // Not ready?
    if (!texture) {
        if (fes._boundTexturesCache[channel] != null) {
            fes._activeChannel = channel;
            _bindTextureDirectly(fes, fes._gl.TEXTURE_2D, null);
            _bindTextureDirectly(fes, fes._gl.TEXTURE_CUBE_MAP, null);
            if (engineState.webGLVersion > 1) {
                _bindTextureDirectly(engineState, fes._gl.TEXTURE_3D, null);
                _bindTextureDirectly(engineState, fes._gl.TEXTURE_2D_ARRAY, null);
            }
        }
        return false;
    }

    // Video
    if ((<VideoTexture>texture).video) {
        fes._activeChannel = channel;
        const videoInternalTexture = (<VideoTexture>texture).getInternalTexture();
        if (videoInternalTexture) {
            videoInternalTexture._associatedChannel = channel;
        }
        (<VideoTexture>texture).update();
    } else if (texture.delayLoadState === Constants.DELAYLOADSTATE_NOTLOADED) {
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
        internalTexture = fes._emptyCubeTexture as InternalTexture;
    } else if (texture.is3D) {
        internalTexture = fes._emptyTexture3D as InternalTexture;
    } else if (texture.is2DArray) {
        internalTexture = fes._emptyTexture2DArray as InternalTexture;
    } else {
        internalTexture = fes._emptyTexture as InternalTexture;
    }

    if (!isPartOfTextureArray && internalTexture) {
        internalTexture._associatedChannel = channel;
    }

    let needToBind = true;
    if (fes._boundTexturesCache[channel] === internalTexture) {
        if (!isPartOfTextureArray) {
            _bindSamplerUniformToChannel(engineState, internalTexture._associatedChannel, channel);
        }

        needToBind = false;
    }

    fes._activeChannel = channel;
    const target = _getTextureTarget(engineState, internalTexture);
    if (needToBind) {
        _bindTextureDirectly(engineState, target, internalTexture, isPartOfTextureArray);
    }

    if (internalTexture && !internalTexture.isMultiview) {
        // CUBIC_MODE and SKYBOX_MODE both require CLAMP_TO_EDGE.  All other modes use REPEAT.
        if (internalTexture.isCube && internalTexture._cachedCoordinatesMode !== texture.coordinatesMode) {
            internalTexture._cachedCoordinatesMode = texture.coordinatesMode;

            const textureWrapMode =
                texture.coordinatesMode !== Constants.TEXTURE_CUBIC_MODE && texture.coordinatesMode !== Constants.TEXTURE_SKYBOX_MODE
                    ? Constants.TEXTURE_WRAP_ADDRESSMODE
                    : Constants.TEXTURE_CLAMP_ADDRESSMODE;
            texture.wrapU = textureWrapMode;
            texture.wrapV = textureWrapMode;
        }

        if (internalTexture._cachedWrapU !== texture.wrapU) {
            internalTexture._cachedWrapU = texture.wrapU;
            _setTextureParameterInteger(engineState, target, fes._gl.TEXTURE_WRAP_S, _getTextureWrapMode(engineState, texture.wrapU), internalTexture);
        }

        if (internalTexture._cachedWrapV !== texture.wrapV) {
            internalTexture._cachedWrapV = texture.wrapV;
            _setTextureParameterInteger(engineState, target, fes._gl.TEXTURE_WRAP_T, _getTextureWrapMode(engineState, texture.wrapV), internalTexture);
        }

        if (internalTexture.is3D && internalTexture._cachedWrapR !== texture.wrapR) {
            internalTexture._cachedWrapR = texture.wrapR;
            _setTextureParameterInteger(engineState, target, fes._gl.TEXTURE_WRAP_R, _getTextureWrapMode(engineState, texture.wrapR), internalTexture);
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
        internalTexture.samplingMode !== Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST &&
        internalTexture.samplingMode !== Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR &&
        internalTexture.samplingMode !== Constants.TEXTURE_LINEAR_LINEAR
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

export function _setTextureParameterFloat(engineState: IWebGLEnginePublic, target: number, parameter: number, value: number, texture: InternalTexture): void {
    _bindTextureDirectly(engineState, target, texture, true, true);
    (engineState as WebGLEngineState)._gl.texParameterf(target, parameter, value);
}

export function _setTextureParameterInteger(engineState: IWebGLEnginePublic, target: number, parameter: number, value: number, texture?: InternalTexture) {
    if (texture) {
        _bindTextureDirectly(engineState, target, texture, true, true);
    }
    (engineState as WebGLEngineState)._gl.texParameteri(target, parameter, value);
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

export function _initGLContext(engineState: IWebGLEnginePublic): void {
    const fes = engineState as WebGLEngineStateFull;
    // Caps
    fes._caps = {
        maxTexturesImageUnits: fes._gl.getParameter(fes._gl.MAX_TEXTURE_IMAGE_UNITS),
        maxCombinedTexturesImageUnits: fes._gl.getParameter(fes._gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
        maxVertexTextureImageUnits: fes._gl.getParameter(fes._gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
        maxTextureSize: fes._gl.getParameter(fes._gl.MAX_TEXTURE_SIZE),
        maxSamples: fes._webGLVersion > 1 ? fes._gl.getParameter(fes._gl.MAX_SAMPLES) : 1,
        maxCubemapTextureSize: fes._gl.getParameter(fes._gl.MAX_CUBE_MAP_TEXTURE_SIZE),
        maxRenderTextureSize: fes._gl.getParameter(fes._gl.MAX_RENDERBUFFER_SIZE),
        maxVertexAttribs: fes._gl.getParameter(fes._gl.MAX_VERTEX_ATTRIBS),
        maxVaryingVectors: fes._gl.getParameter(fes._gl.MAX_VARYING_VECTORS),
        maxFragmentUniformVectors: fes._gl.getParameter(fes._gl.MAX_FRAGMENT_UNIFORM_VECTORS),
        maxVertexUniformVectors: fes._gl.getParameter(fes._gl.MAX_VERTEX_UNIFORM_VECTORS),
        parallelShaderCompile: fes._gl.getExtension("KHR_parallel_shader_compile") || undefined,
        standardDerivatives: fes._webGLVersion > 1 || fes._gl.getExtension("OES_standard_derivatives") !== null,
        maxAnisotropy: 1,
        astc: fes._gl.getExtension("WEBGL_compressed_texture_astc") || fes._gl.getExtension("WEBKIT_WEBGL_compressed_texture_astc"),
        bptc: fes._gl.getExtension("EXT_texture_compression_bptc") || fes._gl.getExtension("WEBKIT_EXT_texture_compression_bptc"),
        s3tc: fes._gl.getExtension("WEBGL_compressed_texture_s3tc") || fes._gl.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc"),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        s3tc_srgb: fes._gl.getExtension("WEBGL_compressed_texture_s3tc_srgb") || fes._gl.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc_srgb"),
        pvrtc: fes._gl.getExtension("WEBGL_compressed_texture_pvrtc") || fes._gl.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc"),
        etc1: fes._gl.getExtension("WEBGL_compressed_texture_etc1") || fes._gl.getExtension("WEBKIT_WEBGL_compressed_texture_etc1"),
        etc2:
            fes._gl.getExtension("WEBGL_compressed_texture_etc") ||
            fes._gl.getExtension("WEBKIT_WEBGL_compressed_texture_etc") ||
            fes._gl.getExtension("WEBGL_compressed_texture_es3_0"), // also a requirement of OpenGL ES 3
        textureAnisotropicFilterExtension:
            fes._gl.getExtension("EXT_texture_filter_anisotropic") ||
            fes._gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") ||
            fes._gl.getExtension("MOZ_EXT_texture_filter_anisotropic"),
        uintIndices: fes._webGLVersion > 1 || fes._gl.getExtension("OES_element_index_uint") !== null,
        fragmentDepthSupported: fes._webGLVersion > 1 || fes._gl.getExtension("EXT_frag_depth") !== null,
        highPrecisionShaderSupported: false,
        timerQuery: fes._gl.getExtension("EXT_disjoint_timer_query_webgl2") || fes._gl.getExtension("EXT_disjoint_timer_query"),
        supportOcclusionQuery: fes._webGLVersion > 1,
        canUseTimestampForTimerQuery: false,
        drawBuffersExtension: false,
        maxMSAASamples: 1,
        colorBufferFloat: !!(fes._webGLVersion > 1 && fes._gl.getExtension("EXT_color_buffer_float")),
        supportFloatTexturesResolve: false,
        colorBufferHalfFloat: !!(fes._webGLVersion > 1 && fes._gl.getExtension("EXT_color_buffer_half_float")),
        textureFloat: fes._webGLVersion > 1 || fes._gl.getExtension("OES_texture_float") ? true : false,
        textureHalfFloat: fes._webGLVersion > 1 || fes._gl.getExtension("OES_texture_half_float") ? true : false,
        textureHalfFloatRender: false,
        textureFloatLinearFiltering: false,
        textureFloatRender: false,
        textureHalfFloatLinearFiltering: false,
        vertexArrayObject: false,
        instancedArrays: false,
        textureLOD: fes._webGLVersion > 1 || fes._gl.getExtension("EXT_shader_texture_lod") ? true : false,
        texelFetch: fes._webGLVersion !== 1,
        blendMinMax: false,
        multiview: fes._gl.getExtension("OVR_multiview2"),
        oculusMultiview: fes._gl.getExtension("OCULUS_multiview"),
        depthTextureExtension: false,
        canUseGLInstanceID: fes._webGLVersion > 1,
        canUseGLVertexID: fes._webGLVersion > 1,
        supportComputeShaders: false,
        supportSRGBBuffers: false,
        supportTransformFeedbacks: fes._webGLVersion > 1,
        textureMaxLevel: fes._webGLVersion > 1,
        texture2DArrayMaxLayerCount: fes._webGLVersion > 1 ? fes._gl.getParameter(fes._gl.MAX_ARRAY_TEXTURE_LAYERS) : 128,
        disableMorphTargetTexture: false,
    };

    fes._caps.supportFloatTexturesResolve = fes._caps.colorBufferFloat;

    // Infos
    fes._glVersion = fes._gl.getParameter(fes._gl.VERSION);

    const rendererInfo: any = fes._gl.getExtension("WEBGL_debug_renderer_info");
    if (rendererInfo != null) {
        fes._glRenderer = fes._gl.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL);
        fes._glVendor = fes._gl.getParameter(rendererInfo.UNMASKED_VENDOR_WEBGL);
    }

    if (!fes._glVendor) {
        fes._glVendor = fes._gl.getParameter(fes._gl.VENDOR) || "Unknown vendor";
    }

    if (!fes._glRenderer) {
        fes._glRenderer = fes._gl.getParameter(fes._gl.RENDERER) || "Unknown renderer";
    }

    // Constants
    if (fes._gl.HALF_FLOAT_OES !== 0x8d61) {
        fes._gl.HALF_FLOAT_OES = 0x8d61; // Half floating-point type (16-bit).
    }
    if (fes._gl.RGBA16F !== 0x881a) {
        fes._gl.RGBA16F = 0x881a; // RGBA 16-bit floating-point color-renderable internal sized format.
    }
    if (fes._gl.RGBA32F !== 0x8814) {
        fes._gl.RGBA32F = 0x8814; // RGBA 32-bit floating-point color-renderable internal sized format.
    }
    if (fes._gl.DEPTH24_STENCIL8 !== 35056) {
        fes._gl.DEPTH24_STENCIL8 = 35056;
    }

    // Extensions
    if (fes._caps.timerQuery) {
        if (fes._webGLVersion === 1) {
            fes._gl.getQuery = (<any>fes._caps.timerQuery).getQueryEXT.bind(fes._caps.timerQuery);
        }
        // WebGLQuery casted to number to avoid TS error
        fes._caps.canUseTimestampForTimerQuery = ((fes._gl.getQuery(fes._caps.timerQuery.TIMESTAMP_EXT, fes._caps.timerQuery.QUERY_COUNTER_BITS_EXT) as number) ?? 0) > 0;
    }

    fes._caps.maxAnisotropy = fes._caps.textureAnisotropicFilterExtension ? fes._gl.getParameter(fes._caps.textureAnisotropicFilterExtension.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;
    fes._caps.textureFloatLinearFiltering = fes._caps.textureFloat && fes._gl.getExtension("OES_texture_float_linear") ? true : false;
    fes._caps.textureFloatRender = fes._caps.textureFloat && _canRenderToFloatFramebuffer(fes) ? true : false;
    fes._caps.textureHalfFloatLinearFiltering = fes._webGLVersion > 1 || (fes._caps.textureHalfFloat && fes._gl.getExtension("OES_texture_half_float_linear")) ? true : false;

    // Compressed formats
    if (fes._caps.astc) {
        fes._gl.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR = fes._caps.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR;
    }
    if (fes._caps.bptc) {
        fes._gl.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT = fes._caps.bptc.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT;
    }
    if (fes._caps.s3tc_srgb) {
        fes._gl.COMPRESSED_SRGB_S3TC_DXT1_EXT = fes._caps.s3tc_srgb.COMPRESSED_SRGB_S3TC_DXT1_EXT;
        fes._gl.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT = fes._caps.s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;
        fes._gl.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT = fes._caps.s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT;
    }
    if (fes._caps.etc2) {
        fes._gl.COMPRESSED_SRGB8_ETC2 = fes._caps.etc2.COMPRESSED_SRGB8_ETC2;
        fes._gl.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC = fes._caps.etc2.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC;
    }

    // Checks if some of the format renders first to allow the use of webgl inspector.
    if (fes._webGLVersion > 1) {
        if (fes._gl.HALF_FLOAT_OES !== 0x140b) {
            fes._gl.HALF_FLOAT_OES = 0x140b;
        }
    }
    fes._caps.textureHalfFloatRender = fes._caps.textureHalfFloat && _canRenderToHalfFloatFramebuffer(fes);
    // Draw buffers
    if (fes._webGLVersion > 1) {
        fes._caps.drawBuffersExtension = true;
        fes._caps.maxMSAASamples = fes._maxMSAASamplesOverride !== null ? fes._maxMSAASamplesOverride : fes._gl.getParameter(fes._gl.MAX_SAMPLES);
    } else {
        const drawBuffersExtension = fes._gl.getExtension("WEBGL_draw_buffers");

        if (drawBuffersExtension !== null) {
            fes._caps.drawBuffersExtension = true;
            fes._gl.drawBuffers = drawBuffersExtension.drawBuffersWEBGL.bind(drawBuffersExtension);
            (fes._gl.DRAW_FRAMEBUFFER as any) = fes._gl.FRAMEBUFFER;

            for (let i = 0; i < 16; i++) {
                (<any>fes._gl)["COLOR_ATTACHMENT" + i + "_WEBGL"] = (<any>drawBuffersExtension)["COLOR_ATTACHMENT" + i + "_WEBGL"];
            }
        }
    }

    // Depth Texture
    if (fes._webGLVersion > 1) {
        fes._caps.depthTextureExtension = true;
    } else {
        const depthTextureExtension = fes._gl.getExtension("WEBGL_depth_texture");

        if (depthTextureExtension != null) {
            fes._caps.depthTextureExtension = true;
            fes._gl.UNSIGNED_INT_24_8 = depthTextureExtension.UNSIGNED_INT_24_8_WEBGL;
        }
    }

    // Vertex array object
    if (fes.disableVertexArrayObjects) {
        fes._caps.vertexArrayObject = false;
    } else if (fes._webGLVersion > 1) {
        fes._caps.vertexArrayObject = true;
    } else {
        const vertexArrayObjectExtension = fes._gl.getExtension("OES_vertex_array_object");

        if (vertexArrayObjectExtension != null) {
            fes._caps.vertexArrayObject = true;
            fes._gl.createVertexArray = vertexArrayObjectExtension.createVertexArrayOES.bind(vertexArrayObjectExtension);
            fes._gl.bindVertexArray = vertexArrayObjectExtension.bindVertexArrayOES.bind(vertexArrayObjectExtension);
            fes._gl.deleteVertexArray = vertexArrayObjectExtension.deleteVertexArrayOES.bind(vertexArrayObjectExtension);
        }
    }

    // Instances count
    if (fes._webGLVersion > 1) {
        fes._caps.instancedArrays = true;
    } else {
        const instanceExtension = <ANGLE_instanced_arrays>fes._gl.getExtension("ANGLE_instanced_arrays");

        if (instanceExtension != null) {
            fes._caps.instancedArrays = true;
            fes._gl.drawArraysInstanced = instanceExtension.drawArraysInstancedANGLE.bind(instanceExtension);
            fes._gl.drawElementsInstanced = instanceExtension.drawElementsInstancedANGLE.bind(instanceExtension);
            fes._gl.vertexAttribDivisor = instanceExtension.vertexAttribDivisorANGLE.bind(instanceExtension);
        } else {
            fes._caps.instancedArrays = false;
        }
    }

    if (fes._gl.getShaderPrecisionFormat) {
        const vertexhighp = fes._gl.getShaderPrecisionFormat(fes._gl.VERTEX_SHADER, fes._gl.HIGH_FLOAT);
        const fragmenthighp = fes._gl.getShaderPrecisionFormat(fes._gl.FRAGMENT_SHADER, fes._gl.HIGH_FLOAT);

        if (vertexhighp && fragmenthighp) {
            fes._caps.highPrecisionShaderSupported = vertexhighp.precision !== 0 && fragmenthighp.precision !== 0;
        }
    }

    if (fes._webGLVersion > 1) {
        fes._caps.blendMinMax = true;
    } else {
        const blendMinMaxExtension = fes._gl.getExtension("EXT_blend_minmax");
        if (blendMinMaxExtension != null) {
            fes._caps.blendMinMax = true;
            fes._gl.MAX = blendMinMaxExtension.MAX_EXT as typeof WebGL2RenderingContext.MAX;
            fes._gl.MIN = blendMinMaxExtension.MIN_EXT as typeof WebGL2RenderingContext.MIN;
        }
    }

    // sRGB buffers
    // only run this if not already set to true (in the constructor, for example)
    if (!fes._caps.supportSRGBBuffers) {
        if (fes._webGLVersion > 1) {
            fes._caps.supportSRGBBuffers = true;
            fes._glSRGBExtensionValues = {
                SRGB: WebGL2RenderingContext.SRGB,
                SRGB8: WebGL2RenderingContext.SRGB8,
                SRGB8_ALPHA8: WebGL2RenderingContext.SRGB8_ALPHA8,
            };
        } else {
            const sRGBExtension = fes._gl.getExtension("EXT_sRGB");

            if (sRGBExtension != null) {
                fes._caps.supportSRGBBuffers = true;
                fes._glSRGBExtensionValues = {
                    SRGB: sRGBExtension.SRGB_EXT as typeof WebGL2RenderingContext.SRGB | EXT_sRGB["SRGB_EXT"],
                    SRGB8: sRGBExtension.SRGB_ALPHA_EXT as typeof WebGL2RenderingContext.SRGB8 | EXT_sRGB["SRGB_ALPHA_EXT"],
                    SRGB8_ALPHA8: sRGBExtension.SRGB_ALPHA_EXT as typeof WebGL2RenderingContext.SRGB8_ALPHA8 | EXT_sRGB["SRGB8_ALPHA8_EXT"],
                };
            }
        }
        // take into account the forced state that was provided in options
        // When the issue in angle/chrome is fixed the flag should be taken into account only when it is explicitly defined
        fes._caps.supportSRGBBuffers = fes._caps.supportSRGBBuffers && !!(fes._creationOptions && fes._creationOptions.forceSRGBBufferSupportState);
    }

    // Depth buffer
    fes._depthCullingState.depthTest = true;
    fes._depthCullingState.depthFunc = fes._gl.LEQUAL;
    fes._depthCullingState.depthMask = true;

    // Texture maps
    fes._maxSimultaneousTextures = fes._caps.maxCombinedTexturesImageUnits;
    for (let slot = 0; slot < fes._maxSimultaneousTextures; slot++) {
        fes._nextFreeTextureSlots.push(slot);
    }

    if (fes._glRenderer === "Mali-G72") {
        // Overcome a bug when using a texture to store morph targets on Mali-G72
        fes._caps.disableMorphTargetTexture = true;
    }
}

export function _initFeatures(engineState: IWebGLEnginePublic): void {
    const fes = engineState as WebGLEngineStateFull;
    fes._features = {
        forceBitmapOverHTMLImageElement: false,
        supportRenderAndCopyToLodForFloatTextures: fes._webGLVersion !== 1,
        supportDepthStencilTexture: fes._webGLVersion !== 1,
        supportShadowSamplers: fes._webGLVersion !== 1,
        uniformBufferHardCheckMatrix: false,
        allowTexturePrefiltering: fes._webGLVersion !== 1,
        trackUbosInFrame: false,
        checkUbosContentBeforeUpload: false,
        supportCSM: fes._webGLVersion !== 1,
        basisNeedsPOT: fes._webGLVersion === 1,
        support3DTextures: fes._webGLVersion !== 1,
        needTypeSuffixInShaderConstants: fes._webGLVersion !== 1,
        supportMSAA: fes._webGLVersion !== 1,
        supportSSAO2: fes._webGLVersion !== 1,
        supportExtendedTextureFormats: fes._webGLVersion !== 1,
        supportSwitchCaseInShader: fes._webGLVersion !== 1,
        supportSyncTextureRead: true,
        needsInvertingBitmap: true,
        useUBOBindingCache: true,
        needShaderCodeInlining: false,
        needToAlwaysBindUniformBuffers: false,
        supportRenderPasses: false,
        supportSpriteInstancing: true,
        forceVertexBufferStrideMultiple4Bytes: false,
        _collectUbosUpdatedInFrame: false,
    };
}

function _canRenderToFloatFramebuffer(engineState: IWebGLEnginePublic): boolean {
    const fes = engineState as WebGLEngineState;
    if (fes._webGLVersion > 1) {
        return fes._caps.colorBufferFloat;
    }
    return _canRenderToFramebuffer(engineState, Constants.TEXTURETYPE_FLOAT);
}

function _canRenderToHalfFloatFramebuffer(engineState: IWebGLEnginePublic): boolean {
    const fes = engineState as WebGLEngineState;
    if (fes._webGLVersion > 1) {
        return fes._caps.colorBufferFloat;
    }
    return _canRenderToFramebuffer(engineState, Constants.TEXTURETYPE_HALF_FLOAT);
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
            case Constants.TEXTURETYPE_FLOAT:
                return fes._gl.FLOAT;
            case Constants.TEXTURETYPE_HALF_FLOAT:
                return fes._gl.HALF_FLOAT_OES;
            case Constants.TEXTURETYPE_UNSIGNED_BYTE:
                return fes._gl.UNSIGNED_BYTE;
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
                return fes._gl.UNSIGNED_SHORT_4_4_4_4;
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
                return fes._gl.UNSIGNED_SHORT_5_5_5_1;
            case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
                return fes._gl.UNSIGNED_SHORT_5_6_5;
        }
        return fes._gl.UNSIGNED_BYTE;
    }

    switch (type) {
        case Constants.TEXTURETYPE_BYTE:
            return fes._gl.BYTE;
        case Constants.TEXTURETYPE_UNSIGNED_BYTE:
            return fes._gl.UNSIGNED_BYTE;
        case Constants.TEXTURETYPE_SHORT:
            return fes._gl.SHORT;
        case Constants.TEXTURETYPE_UNSIGNED_SHORT:
            return fes._gl.UNSIGNED_SHORT;
        case Constants.TEXTURETYPE_INT:
            return fes._gl.INT;
        case Constants.TEXTURETYPE_UNSIGNED_INTEGER: // Refers to UNSIGNED_INT
            return fes._gl.UNSIGNED_INT;
        case Constants.TEXTURETYPE_FLOAT:
            return fes._gl.FLOAT;
        case Constants.TEXTURETYPE_HALF_FLOAT:
            return fes._gl.HALF_FLOAT;
        case Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
            return fes._gl.UNSIGNED_SHORT_4_4_4_4;
        case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
            return fes._gl.UNSIGNED_SHORT_5_5_5_1;
        case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
            return fes._gl.UNSIGNED_SHORT_5_6_5;
        case Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV:
            return fes._gl.UNSIGNED_INT_2_10_10_10_REV;
        case Constants.TEXTURETYPE_UNSIGNED_INT_24_8:
            return fes._gl.UNSIGNED_INT_24_8;
        case Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV:
            return fes._gl.UNSIGNED_INT_10F_11F_11F_REV;
        case Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV:
            return fes._gl.UNSIGNED_INT_5_9_9_9_REV;
        case Constants.TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV:
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
        case Constants.TEXTUREFORMAT_ALPHA:
            internalFormat = fes._gl.ALPHA;
            break;
        case Constants.TEXTUREFORMAT_LUMINANCE:
            internalFormat = fes._gl.LUMINANCE;
            break;
        case Constants.TEXTUREFORMAT_LUMINANCE_ALPHA:
            internalFormat = fes._gl.LUMINANCE_ALPHA;
            break;
        case Constants.TEXTUREFORMAT_RED:
            internalFormat = fes._gl.RED;
            break;
        case Constants.TEXTUREFORMAT_RG:
            internalFormat = fes._gl.RG;
            break;
        case Constants.TEXTUREFORMAT_RGB:
            internalFormat = useSRGBBuffer ? fes._glSRGBExtensionValues.SRGB : fes._gl.RGB;
            break;
        case Constants.TEXTUREFORMAT_RGBA:
            internalFormat = useSRGBBuffer ? fes._glSRGBExtensionValues.SRGB8_ALPHA8 : fes._gl.RGBA;
            break;
    }

    if (fes._webGLVersion > 1) {
        switch (format) {
            case Constants.TEXTUREFORMAT_RED_INTEGER:
                internalFormat = fes._gl.RED_INTEGER;
                break;
            case Constants.TEXTUREFORMAT_RG_INTEGER:
                internalFormat = fes._gl.RG_INTEGER;
                break;
            case Constants.TEXTUREFORMAT_RGB_INTEGER:
                internalFormat = fes._gl.RGB_INTEGER;
                break;
            case Constants.TEXTUREFORMAT_RGBA_INTEGER:
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
                case Constants.TEXTUREFORMAT_ALPHA:
                    return fes._gl.ALPHA;
                case Constants.TEXTUREFORMAT_LUMINANCE:
                    return fes._gl.LUMINANCE;
                case Constants.TEXTUREFORMAT_LUMINANCE_ALPHA:
                    return fes._gl.LUMINANCE_ALPHA;
                case Constants.TEXTUREFORMAT_RGB:
                    return useSRGBBuffer ? fes._glSRGBExtensionValues.SRGB : fes._gl.RGB;
            }
        }
        return fes._gl.RGBA;
    }

    switch (type) {
        case Constants.TEXTURETYPE_BYTE:
            switch (format) {
                case Constants.TEXTUREFORMAT_RED:
                    return fes._gl.R8_SNORM;
                case Constants.TEXTUREFORMAT_RG:
                    return fes._gl.RG8_SNORM;
                case Constants.TEXTUREFORMAT_RGB:
                    return fes._gl.RGB8_SNORM;
                case Constants.TEXTUREFORMAT_RED_INTEGER:
                    return fes._gl.R8I;
                case Constants.TEXTUREFORMAT_RG_INTEGER:
                    return fes._gl.RG8I;
                case Constants.TEXTUREFORMAT_RGB_INTEGER:
                    return fes._gl.RGB8I;
                case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                    return fes._gl.RGBA8I;
                default:
                    return fes._gl.RGBA8_SNORM;
            }
        case Constants.TEXTURETYPE_UNSIGNED_BYTE:
            switch (format) {
                case Constants.TEXTUREFORMAT_RED:
                    return fes._gl.R8;
                case Constants.TEXTUREFORMAT_RG:
                    return fes._gl.RG8;
                case Constants.TEXTUREFORMAT_RGB:
                    return useSRGBBuffer ? fes._glSRGBExtensionValues.SRGB8 : fes._gl.RGB8; // By default. Other possibilities are RGB565, SRGB8.
                case Constants.TEXTUREFORMAT_RGBA:
                    return useSRGBBuffer ? fes._glSRGBExtensionValues.SRGB8_ALPHA8 : fes._gl.RGBA8; // By default. Other possibilities are RGB5_A1, RGBA4, SRGB8_ALPHA8.
                case Constants.TEXTUREFORMAT_RED_INTEGER:
                    return fes._gl.R8UI;
                case Constants.TEXTUREFORMAT_RG_INTEGER:
                    return fes._gl.RG8UI;
                case Constants.TEXTUREFORMAT_RGB_INTEGER:
                    return fes._gl.RGB8UI;
                case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                    return fes._gl.RGBA8UI;
                case Constants.TEXTUREFORMAT_ALPHA:
                    return fes._gl.ALPHA;
                case Constants.TEXTUREFORMAT_LUMINANCE:
                    return fes._gl.LUMINANCE;
                case Constants.TEXTUREFORMAT_LUMINANCE_ALPHA:
                    return fes._gl.LUMINANCE_ALPHA;
                default:
                    return fes._gl.RGBA8;
            }
        case Constants.TEXTURETYPE_SHORT:
            switch (format) {
                case Constants.TEXTUREFORMAT_RED_INTEGER:
                    return fes._gl.R16I;
                case Constants.TEXTUREFORMAT_RG_INTEGER:
                    return fes._gl.RG16I;
                case Constants.TEXTUREFORMAT_RGB_INTEGER:
                    return fes._gl.RGB16I;
                case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                    return fes._gl.RGBA16I;
                default:
                    return fes._gl.RGBA16I;
            }
        case Constants.TEXTURETYPE_UNSIGNED_SHORT:
            switch (format) {
                case Constants.TEXTUREFORMAT_RED_INTEGER:
                    return fes._gl.R16UI;
                case Constants.TEXTUREFORMAT_RG_INTEGER:
                    return fes._gl.RG16UI;
                case Constants.TEXTUREFORMAT_RGB_INTEGER:
                    return fes._gl.RGB16UI;
                case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                    return fes._gl.RGBA16UI;
                default:
                    return fes._gl.RGBA16UI;
            }
        case Constants.TEXTURETYPE_INT:
            switch (format) {
                case Constants.TEXTUREFORMAT_RED_INTEGER:
                    return fes._gl.R32I;
                case Constants.TEXTUREFORMAT_RG_INTEGER:
                    return fes._gl.RG32I;
                case Constants.TEXTUREFORMAT_RGB_INTEGER:
                    return fes._gl.RGB32I;
                case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                    return fes._gl.RGBA32I;
                default:
                    return fes._gl.RGBA32I;
            }
        case Constants.TEXTURETYPE_UNSIGNED_INTEGER: // Refers to UNSIGNED_INT
            switch (format) {
                case Constants.TEXTUREFORMAT_RED_INTEGER:
                    return fes._gl.R32UI;
                case Constants.TEXTUREFORMAT_RG_INTEGER:
                    return fes._gl.RG32UI;
                case Constants.TEXTUREFORMAT_RGB_INTEGER:
                    return fes._gl.RGB32UI;
                case Constants.TEXTUREFORMAT_RGBA_INTEGER:
                    return fes._gl.RGBA32UI;
                default:
                    return fes._gl.RGBA32UI;
            }
        case Constants.TEXTURETYPE_FLOAT:
            switch (format) {
                case Constants.TEXTUREFORMAT_RED:
                    return fes._gl.R32F; // By default. Other possibility is R16F.
                case Constants.TEXTUREFORMAT_RG:
                    return fes._gl.RG32F; // By default. Other possibility is RG16F.
                case Constants.TEXTUREFORMAT_RGB:
                    return fes._gl.RGB32F; // By default. Other possibilities are RGB16F, R11F_G11F_B10F, RGB9_E5.
                case Constants.TEXTUREFORMAT_RGBA:
                    return fes._gl.RGBA32F; // By default. Other possibility is RGBA16F.
                default:
                    return fes._gl.RGBA32F;
            }
        case Constants.TEXTURETYPE_HALF_FLOAT:
            switch (format) {
                case Constants.TEXTUREFORMAT_RED:
                    return fes._gl.R16F;
                case Constants.TEXTUREFORMAT_RG:
                    return fes._gl.RG16F;
                case Constants.TEXTUREFORMAT_RGB:
                    return fes._gl.RGB16F; // By default. Other possibilities are R11F_G11F_B10F, RGB9_E5.
                case Constants.TEXTUREFORMAT_RGBA:
                    return fes._gl.RGBA16F;
                default:
                    return fes._gl.RGBA16F;
            }
        case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
            return fes._gl.RGB565;
        case Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV:
            return fes._gl.R11F_G11F_B10F;
        case Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV:
            return fes._gl.RGB9_E5;
        case Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
            return fes._gl.RGBA4;
        case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
            return fes._gl.RGB5_A1;
        case Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV:
            switch (format) {
                case Constants.TEXTUREFORMAT_RGBA:
                    return fes._gl.RGB10_A2; // By default. Other possibility is RGB5_A1.
                case Constants.TEXTUREFORMAT_RGBA_INTEGER:
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
export function _getRGBAMultiSampleBufferFormat(engineState: IWebGLEnginePublic, type: number, format = Constants.TEXTUREFORMAT_RGBA): number {
    const fes = engineState as WebGLEngineState;
    switch (type) {
        case Constants.TEXTURETYPE_FLOAT:
            switch (format) {
                case Constants.TEXTUREFORMAT_R:
                    return fes._gl.R32F;
                default:
                    return fes._gl.RGBA32F;
            }
        case Constants.TEXTURETYPE_HALF_FLOAT:
            switch (format) {
                case Constants.TEXTUREFORMAT_R:
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

/**
 * Set the value of an uniform to a number (int)
 * @param uniform defines the webGL uniform location where to store the value
 * @param value defines the int number to store
 * @returns true if the value was set
 */
export function setInt(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, value: number): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform1i(uniform, value);

    return true;
}

/**
 * Set the value of an uniform to a int2
 * @param uniform defines the webGL uniform location where to store the value
 * @param x defines the 1st component of the value
 * @param y defines the 2nd component of the value
 * @returns true if the value was set
 */
export function setInt2(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, x: number, y: number): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform2i(uniform, x, y);

    return true;
}

/**
 * Set the value of an uniform to a int3
 * @param uniform defines the webGL uniform location where to store the value
 * @param x defines the 1st component of the value
 * @param y defines the 2nd component of the value
 * @param z defines the 3rd component of the value
 * @returns true if the value was set
 */
export function setInt3(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform3i(uniform, x, y, z);

    return true;
}

/**
 * Set the value of an uniform to a int4
 * @param uniform defines the webGL uniform location where to store the value
 * @param x defines the 1st component of the value
 * @param y defines the 2nd component of the value
 * @param z defines the 3rd component of the value
 * @param w defines the 4th component of the value
 * @returns true if the value was set
 */
export function setInt4(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number, w: number): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform4i(uniform, x, y, z, w);

    return true;
}

/**
 * Set the value of an uniform to an array of int32
 * @param uniform defines the webGL uniform location where to store the value
 * @param array defines the array of int32 to store
 * @returns true if the value was set
 */
export function setIntArray(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, array: Int32Array): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform1iv(uniform, array);

    return true;
}

/**
 * Set the value of an uniform to an array of int32 (stored as vec2)
 * @param uniform defines the webGL uniform location where to store the value
 * @param array defines the array of int32 to store
 * @returns true if the value was set
 */
export function setIntArray2(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, array: Int32Array): boolean {
    if (!uniform || array.length % 2 !== 0) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform2iv(uniform, array);
    return true;
}

/**
 * Set the value of an uniform to an array of int32 (stored as vec3)
 * @param uniform defines the webGL uniform location where to store the value
 * @param array defines the array of int32 to store
 * @returns true if the value was set
 */
export function setIntArray3(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, array: Int32Array): boolean {
    if (!uniform || array.length % 3 !== 0) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform3iv(uniform, array);
    return true;
}

/**
 * Set the value of an uniform to an array of int32 (stored as vec4)
 * @param uniform defines the webGL uniform location where to store the value
 * @param array defines the array of int32 to store
 * @returns true if the value was set
 */
export function setIntArray4(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, array: Int32Array): boolean {
    if (!uniform || array.length % 4 !== 0) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform4iv(uniform, array);
    return true;
}

/**
 * Set the value of an uniform to a number (unsigned int)
 * @param uniform defines the webGL uniform location where to store the value
 * @param value defines the unsigned int number to store
 * @returns true if the value was set
 */
export function setUInt(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, value: number): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform1ui(uniform, value);

    return true;
}

/**
 * Set the value of an uniform to a unsigned int2
 * @param uniform defines the webGL uniform location where to store the value
 * @param x defines the 1st component of the value
 * @param y defines the 2nd component of the value
 * @returns true if the value was set
 */
export function setUInt2(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, x: number, y: number): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform2ui(uniform, x, y);

    return true;
}

/**
 * Set the value of an uniform to a unsigned int3
 * @param uniform defines the webGL uniform location where to store the value
 * @param x defines the 1st component of the value
 * @param y defines the 2nd component of the value
 * @param z defines the 3rd component of the value
 * @returns true if the value was set
 */
export function setUInt3(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform3ui(uniform, x, y, z);

    return true;
}

/**
 * Set the value of an uniform to a unsigned int4
 * @param uniform defines the webGL uniform location where to store the value
 * @param x defines the 1st component of the value
 * @param y defines the 2nd component of the value
 * @param z defines the 3rd component of the value
 * @param w defines the 4th component of the value
 * @returns true if the value was set
 */
export function setUInt4(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number, w: number): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform4ui(uniform, x, y, z, w);

    return true;
}

/**
 * Set the value of an uniform to an array of unsigned int32
 * @param uniform defines the webGL uniform location where to store the value
 * @param array defines the array of unsigned int32 to store
 * @returns true if the value was set
 */
export function setUIntArray(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, array: Uint32Array): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform1uiv(uniform, array);

    return true;
}

/**
 * Set the value of an uniform to an array of unsigned int32 (stored as vec2)
 * @param uniform defines the webGL uniform location where to store the value
 * @param array defines the array of unsigned int32 to store
 * @returns true if the value was set
 */
export function setUIntArray2(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, array: Uint32Array): boolean {
    if (!uniform || array.length % 2 !== 0) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform2uiv(uniform, array);
    return true;
}

/**
 * Set the value of an uniform to an array of unsigned int32 (stored as vec3)
 * @param uniform defines the webGL uniform location where to store the value
 * @param array defines the array of unsigned int32 to store
 * @returns true if the value was set
 */
export function setUIntArray3(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, array: Uint32Array): boolean {
    if (!uniform || array.length % 3 !== 0) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform3uiv(uniform, array);
    return true;
}

/**
 * Set the value of an uniform to an array of unsigned int32 (stored as vec4)
 * @param uniform defines the webGL uniform location where to store the value
 * @param array defines the array of unsigned int32 to store
 * @returns true if the value was set
 */
export function setUIntArray4(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, array: Uint32Array): boolean {
    if (!uniform || array.length % 4 !== 0) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform4uiv(uniform, array);
    return true;
}

/**
 * Set the value of an uniform to an array of number
 * @param uniform defines the webGL uniform location where to store the value
 * @param array defines the array of number to store
 * @returns true if the value was set
 */
export function setArray(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): boolean {
    if (!uniform) {
        return false;
    }

    if (array.length < 1) {
        return false;
    }
    (engineState as WebGLEngineStateFull)._gl.uniform1fv(uniform, array);
    return true;
}

/**
 * Set the value of an uniform to an array of number (stored as vec2)
 * @param uniform defines the webGL uniform location where to store the value
 * @param array defines the array of number to store
 * @returns true if the value was set
 */
export function setArray2(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): boolean {
    if (!uniform || array.length % 2 !== 0) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform2fv(uniform, <any>array);
    return true;
}

/**
 * Set the value of an uniform to an array of number (stored as vec3)
 * @param uniform defines the webGL uniform location where to store the value
 * @param array defines the array of number to store
 * @returns true if the value was set
 */
export function setArray3(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): boolean {
    if (!uniform || array.length % 3 !== 0) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform3fv(uniform, <any>array);
    return true;
}

/**
 * Set the value of an uniform to an array of number (stored as vec4)
 * @param uniform defines the webGL uniform location where to store the value
 * @param array defines the array of number to store
 * @returns true if the value was set
 */
export function setArray4(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, array: number[] | Float32Array): boolean {
    if (!uniform || array.length % 4 !== 0) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform4fv(uniform, <any>array);
    return true;
}

/**
 * Set the value of an uniform to an array of float32 (stored as matrices)
 * @param uniform defines the webGL uniform location where to store the value
 * @param matrices defines the array of float32 to store
 * @returns true if the value was set
 */
export function setMatrices(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, matrices: Float32Array): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniformMatrix4fv(uniform, false, matrices);
    return true;
}

/**
 * Set the value of an uniform to a matrix (3x3)
 * @param uniform defines the webGL uniform location where to store the value
 * @param matrix defines the Float32Array representing the 3x3 matrix to store
 * @returns true if the value was set
 */
export function setMatrix3x3(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, matrix: Float32Array): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniformMatrix3fv(uniform, false, matrix);
    return true;
}

/**
 * Set the value of an uniform to a matrix (2x2)
 * @param uniform defines the webGL uniform location where to store the value
 * @param matrix defines the Float32Array representing the 2x2 matrix to store
 * @returns true if the value was set
 */
export function setMatrix2x2(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, matrix: Float32Array): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniformMatrix2fv(uniform, false, matrix);
    return true;
}

/**
 * Set the value of an uniform to a number (float)
 * @param uniform defines the webGL uniform location where to store the value
 * @param value defines the float number to store
 * @returns true if the value was transferred
 */
export function setFloat(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, value: number): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform1f(uniform, value);

    return true;
}

/**
 * Set the value of an uniform to a vec2
 * @param uniform defines the webGL uniform location where to store the value
 * @param x defines the 1st component of the value
 * @param y defines the 2nd component of the value
 * @returns true if the value was set
 */
export function setFloat2(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, x: number, y: number): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform2f(uniform, x, y);

    return true;
}

/**
 * Set the value of an uniform to a vec3
 * @param uniform defines the webGL uniform location where to store the value
 * @param x defines the 1st component of the value
 * @param y defines the 2nd component of the value
 * @param z defines the 3rd component of the value
 * @returns true if the value was set
 */
export function setFloat3(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform3f(uniform, x, y, z);

    return true;
}

/**
 * Set the value of an uniform to a vec4
 * @param uniform defines the webGL uniform location where to store the value
 * @param x defines the 1st component of the value
 * @param y defines the 2nd component of the value
 * @param z defines the 3rd component of the value
 * @param w defines the 4th component of the value
 * @returns true if the value was set
 */
export function setFloat4(engineState: IWebGLEnginePublic, uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number, w: number): boolean {
    if (!uniform) {
        return false;
    }

    (engineState as WebGLEngineStateFull)._gl.uniform4f(uniform, x, y, z, w);

    return true;
}

/**
 * Dispose and release all associated resources
 */
export function dispose(engineState: IWebGLEnginePublic): void {
    const fes = engineState as WebGLEngineStateFull;
    disposeBase(fes);

    // Empty texture
    if (fes._emptyTexture) {
        _releaseTexture(fes, fes._emptyTexture);
        fes._emptyTexture = null;
    }
    if (fes._emptyCubeTexture) {
        _releaseTexture(fes, fes._emptyCubeTexture);
        fes._emptyCubeTexture = null;
    }

    if (fes._dummyFramebuffer) {
        fes._gl.deleteFramebuffer(fes._dummyFramebuffer);
    }

    // Release effects
    releaseEffects(fes);
    // releaseComputeEffects?.(fes); // TODO - this is WebGPU only

    // Unbind
    unbindAllAttributes(fes);
    fes._boundUniforms = {};

    // Events
    if (IsWindowObjectExist()) {
        if (fes._renderingCanvas) {
            if (!fes.doNotHandleContextLost) {
                fes._renderingCanvas.removeEventListener("webglcontextlost", fes._onContextLost!);
                fes._renderingCanvas.removeEventListener("webglcontextrestored", fes._onContextRestored!);
            }
        }
    }

    fes._currentBufferPointers.length = 0;
    fes._currentProgram = null;
    fes._boundRenderFunction = null;

    // Rescale PP
    if (fes._rescalePostProcess) {
        fes._rescalePostProcess.dispose();
    }

    if (fes._creationOptions.loseContextOnDispose) {
        fes._gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
}

// From Engine

/**
 * Force the mipmap generation for the given render target texture
 * @param texture defines the render target texture to use
 * @param unbind defines whether or not to unbind the texture after generation. Defaults to true.
 */
export function generateMipMapsForCubemap(engineState: IWebGLEnginePublic, texture: InternalTexture, unbind = true) {
    const fes = engineState as WebGLEngineStateFull;
    if (texture.generateMipMaps) {
        const gl = fes._gl;
        _bindTextureDirectly(fes, gl.TEXTURE_CUBE_MAP, texture, true);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        if (unbind) {
            _bindTextureDirectly(fes, gl.TEXTURE_CUBE_MAP, null);
        }
    }
}

/**
 * Sets a boolean indicating if the dithering state is enabled or disabled
 * @param value defines the dithering state
 */
export function setDitheringState(engineState: IWebGLEnginePublic, value: boolean): void {
    const fes = engineState as WebGLEngineStateFull;
    if (value) {
        fes._gl.enable(fes._gl.DITHER);
    } else {
        fes._gl.disable(fes._gl.DITHER);
    }
}

/**
 * Sets a boolean indicating if the rasterizer state is enabled or disabled
 * @param value defines the rasterizer state
 */
export function setRasterizerState(engineState: IWebGLEnginePublic, value: boolean): void {
    const fes = engineState as WebGLEngineStateFull;
    if (value) {
        fes._gl.disable(fes._gl.RASTERIZER_DISCARD);
    } else {
        fes._gl.enable(fes._gl.RASTERIZER_DISCARD);
    }
}

const setDirectViewportCache = {
    viewportChangedFunc: _viewport,
};

/**
 * Directly set the WebGL Viewport
 * @param x defines the x coordinate of the viewport (in screen space)
 * @param y defines the y coordinate of the viewport (in screen space)
 * @param width defines the width of the viewport (in screen space)
 * @param height defines the height of the viewport (in screen space)
 * @returns the current viewport Object (if any) that is being replaced by this call. You can restore this viewport later on to go back to the original state
 */
export function setDirectViewport(engineState: IWebGLEnginePublic, x: number, y: number, width: number, height: number): Nullable<IViewportLike> {
    return setDirectViewportBase(setDirectViewportCache, engineState, x, y, width, height);
}

/**
 * Executes a scissor clear (ie. a clear on a specific portion of the screen)
 * @param x defines the x-coordinate of the bottom left corner of the clear rectangle
 * @param y defines the y-coordinate of the corner of the clear rectangle
 * @param width defines the width of the clear rectangle
 * @param height defines the height of the clear rectangle
 * @param clearColor defines the clear color
 */
export function scissorClear(engineState: IWebGLEnginePublic, x: number, y: number, width: number, height: number, clearColor: IColor4Like): void {
    enableScissor(engineState, x, y, width, height);
    clear(engineState, clearColor, true, true, true);
    disableScissor(engineState);
}

/**
 * Enable scissor test on a specific rectangle (ie. render will only be executed on a specific portion of the screen)
 * @param x defines the x-coordinate of the bottom left corner of the clear rectangle
 * @param y defines the y-coordinate of the corner of the clear rectangle
 * @param width defines the width of the clear rectangle
 * @param height defines the height of the clear rectangle
 */
export function enableScissor(engineState: IWebGLEnginePublic, x: number, y: number, width: number, height: number): void {
    const gl = (engineState as WebGLEngineStateFull)._gl;

    // Change state
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, y, width, height);
}

/**
 * Disable previously set scissor test rectangle
 */
export function disableScissor(engineState: IWebGLEnginePublic) {
    const gl = (engineState as WebGLEngineStateFull)._gl;

    (engineState as WebGLEngineStateFull)._gl.disable(gl.SCISSOR_TEST);
}

/**
 * Gets the source code of the vertex shader associated with a specific webGL program
 * @param program defines the program to use
 * @returns a string containing the source code of the vertex shader associated with the program
 */
export function getVertexShaderSource(engineState: IWebGLEnginePublic, program: WebGLProgram): Nullable<string> {
    const gl = (engineState as WebGLEngineStateFull)._gl;
    const shaders = gl.getAttachedShaders(program);

    if (!shaders) {
        return null;
    }

    return gl.getShaderSource(shaders[0]);
}

/**
 * Gets the source code of the fragment shader associated with a specific webGL program
 * @param program defines the program to use
 * @returns a string containing the source code of the fragment shader associated with the program
 */
export function getFragmentShaderSource(engineState: IWebGLEnginePublic, program: WebGLProgram): Nullable<string> {
    const gl = (engineState as WebGLEngineStateFull)._gl;
    const shaders = gl.getAttachedShaders(program);

    if (!shaders) {
        return null;
    }

    return gl.getShaderSource(shaders[1]);
}

const setDepthStencilCache = {
    _setTexture,
};

/**
 * Sets a depth stencil texture from a render target to the according uniform.
 * @param channel The texture channel
 * @param uniform The uniform to set
 * @param texture The render target texture containing the depth stencil texture to apply
 * @param name The texture name
 */
export function setDepthStencilTexture(
    engineState: IWebGLEnginePublic,
    channel: number,
    uniform: Nullable<WebGLUniformLocation>,
    texture: Nullable<RenderTargetTexture>,
    name?: string
): void {
    if (channel === undefined) {
        return;
    }

    const fes = engineState as WebGLEngineStateFull;
    if (uniform) {
        fes._boundUniforms[channel] = uniform;
    }

    setDepthStencilTextureBase(setDepthStencilCache, fes, channel, uniform, texture, name);
}

const bindTextureInjection = {
    _bindTexture,
};

/**
 * Sets a texture to the webGL context from a postprocess
 * @param channel defines the channel to use
 * @param postProcess defines the source postprocess
 * @param name name of the channel
 */
export function setTextureFromPostProcess(engineState: IWebGLEnginePublic, channel: number, postProcess: Nullable<PostProcess>, name: string): void {
    setTextureFromPostProcessBase(bindTextureInjection, engineState, channel, postProcess, name);
}

/**
 * Binds the output of the passed in post process to the texture channel specified
 * @param channel The channel the texture should be bound to
 * @param postProcess The post process which's output should be bound
 * @param name name of the channel
 */
export function setTextureFromPostProcessOutput(engineState: IWebGLEnginePublic, channel: number, postProcess: Nullable<PostProcess>, name: string): void {
    setTextureFromPostProcessOutputBase(bindTextureInjection, engineState, channel, postProcess, name);
}

export function resize(engineState: IWebGLEnginePublic, forceSetSize = false): void {
    resizeBase({ setSize }, engineState, forceSetSize);
}

export function setHardwareScalingLevel(engineState: IWebGLEnginePublic, level: number): void {
    setHardwareScalingLevelBase({ resize }, engineState, level);
}
/**
 * Force a specific size of the canvas
 * @param width defines the new canvas' width
 * @param height defines the new canvas' height
 * @param forceSetSize true to force setting the sizes of the underlying canvas
 * @returns true if the size was changed
 */
export function setSize(engineState: IWebGLEnginePublic, width: number, height: number, forceSetSize = false): boolean {
    const fes = engineState as WebGLEngineStateFull;
    if (!fes._renderingCanvas) {
        return false;
    }

    if (!setSizeBase(engineState, width, height, forceSetSize)) {
        return false;
    }

    if (fes.scenes) {
        for (let index = 0; index < fes.scenes.length; index++) {
            const scene = fes.scenes[index];

            for (let camIndex = 0; camIndex < scene.cameras.length; camIndex++) {
                const cam = scene.cameras[camIndex];

                cam._currentRenderId = 0;
            }
        }

        if (fes.onResizeObservable.hasObservers()) {
            fes.onResizeObservable.notifyObservers(fes);
        }
    }

    return true;
}

/**
 * Wraps an external web gl texture in a Babylon texture.
 * @param texture defines the external texture
 * @param hasMipMaps defines whether the external texture has mip maps (default: false)
 * @param samplingMode defines the sampling mode for the external texture (default: Constants.Constants.TEXTURE_TRILINEAR_SAMPLINGMODE)
 * @param width defines the width for the external texture (default: 0)
 * @param height defines the height for the external texture (default: 0)
 * @returns the babylon internal texture
 */
export function wrapWebGLTexture(
    engineState: IWebGLEnginePublic,
    texture: WebGLTexture,
    hasMipMaps: boolean = false,
    samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
    width: number = 0,
    height: number = 0
): InternalTexture {
    const fes = engineState as WebGLEngineStateFull;
    const hardwareTexture = new WebGLHardwareTexture(texture, fes._gl);
    const internalTexture = new InternalTexture(augmentEngineState(engineState, internalTextureWebGLAdapter), InternalTextureSource.Unknown, true);
    internalTexture._hardwareTexture = hardwareTexture;
    internalTexture._hardwareTexture = hardwareTexture;
    internalTexture.baseWidth = width;
    internalTexture.baseHeight = height;
    internalTexture.width = width;
    internalTexture.height = height;
    internalTexture.isReady = true;
    internalTexture.useMipMaps = hasMipMaps;
    updateTextureSamplingMode(engineState, samplingMode, internalTexture);
    return internalTexture;
}

/**
 * @internal
 */
export function _uploadImageToTexture(engineState: IWebGLEnginePublic, texture: InternalTexture, image: HTMLImageElement | ImageBitmap, faceIndex: number = 0, lod: number = 0) {
    const fes = engineState as WebGLEngineStateFull;
    const gl = fes._gl;

    const textureType = _getWebGLTextureType(engineState, texture.type);
    const format = _getInternalFormat(engineState, texture.format);
    const internalFormat = _getRGBABufferInternalSizedFormat(engineState, texture.type, format);

    const bindTarget = texture.isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;

    _bindTextureDirectly(engineState, bindTarget, texture, true);
    _unpackFlipY(fes, texture.invertY);

    let target: GLenum = gl.TEXTURE_2D;
    if (texture.isCube) {
        target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex;
    }

    gl.texImage2D(target, lod, internalFormat, format, textureType, image);
    _bindTextureDirectly(engineState, bindTarget, null, true);
}

/**
 * Updates a depth texture Comparison Mode and Function.
 * If the comparison Function is equal to 0, the mode will be set to none.
 * Otherwise, this only works in webgl 2 and requires a shadow sampler in the shader.
 * @param texture The texture to set the comparison function for
 * @param comparisonFunction The comparison function to set, 0 if no comparison required
 */
export function updateTextureComparisonFunction(engineState: IWebGLEnginePublic, texture: InternalTexture, comparisonFunction: number): void {
    if (engineState.webGLVersion === 1) {
        Logger.Error("WebGL 1 does not support texture comparison.");
        return;
    }

    const gl = (engineState as WebGLEngineState)._gl;

    if (texture.isCube) {
        _bindTextureDirectly(engineState, gl.TEXTURE_CUBE_MAP, texture, true);

        if (comparisonFunction === 0) {
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_FUNC, Constants.LEQUAL);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_MODE, gl.NONE);
        } else {
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
        }

        _bindTextureDirectly(engineState, gl.TEXTURE_CUBE_MAP, null);
    } else {
        _bindTextureDirectly(engineState, gl.TEXTURE_2D, texture, true);

        if (comparisonFunction === 0) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, Constants.LEQUAL);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
        }

        _bindTextureDirectly(engineState, gl.TEXTURE_2D, null);
    }

    texture._comparisonFunction = comparisonFunction;
}

/**
 * Creates a webGL buffer to use with instantiation
 * @param capacity defines the size of the buffer
 * @returns the webGL buffer
 */
export function createInstancesBuffer(engineState: IWebGLEnginePublic, capacity: number): DataBuffer {
    const gl = (engineState as WebGLEngineState)._gl;
    const buffer = gl.createBuffer();

    if (!buffer) {
        throw new Error("Unable to create instance buffer");
    }

    const result = new WebGLDataBuffer(buffer);
    result.capacity = capacity;

    bindArrayBuffer(engineState, result);
    gl.bufferData(gl.ARRAY_BUFFER, capacity, gl.DYNAMIC_DRAW);

    result.references = 1;

    return result;
}

/**
 * Delete a webGL buffer used with instantiation
 * @param buffer defines the webGL buffer to delete
 */
export function deleteInstancesBuffer(engineState: IWebGLEnginePublic, buffer: WebGLBuffer): void {
    (engineState as WebGLEngineState)._gl.deleteBuffer(buffer);
}

function _clientWaitAsync(engineState: IWebGLEnginePublic, sync: WebGLSync, flags = 0, intervalms = 10): Promise<void> {
    const gl = <WebGL2RenderingContext>((engineState as WebGLEngineState)._gl as any);
    return new Promise((resolve, reject) => {
        const check = () => {
            const res = gl.clientWaitSync(sync, flags, 0);
            if (res == gl.WAIT_FAILED) {
                reject();
                return;
            }
            if (res == gl.TIMEOUT_EXPIRED) {
                setTimeout(check, intervalms);
                return;
            }
            resolve();
        };

        check();
    });
}

/**
 * @internal
 */
export function _readPixelsAsync(engineState: IWebGLEnginePublic, x: number, y: number, w: number, h: number, format: number, type: number, outputBuffer: ArrayBufferView) {
    if (engineState.webGLVersion < 2) {
        throw new Error("_readPixelsAsync only work on WebGL2+");
    }

    const gl = <WebGL2RenderingContext>((engineState as WebGLEngineState)._gl as any);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buf);
    gl.bufferData(gl.PIXEL_PACK_BUFFER, outputBuffer.byteLength, gl.STREAM_READ);
    gl.readPixels(x, y, w, h, format, type, 0);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!sync) {
        return null;
    }

    gl.flush();

    return _clientWaitAsync(engineState, sync, 0, 10).then(() => {
        gl.deleteSync(sync);

        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buf);
        gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, outputBuffer);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
        gl.deleteBuffer(buf);

        return outputBuffer;
    });
}

export function setState(
    engineState: IWebGLEnginePublic,
    culling: boolean,
    zOffset: number = 0,
    force?: boolean,
    reverseSide = false,
    cullBackFaces?: boolean,
    stencil?: IStencilState,
    zOffsetUnits: number = 0
): void {
    const fes = engineState as WebGLEngineStateFull;
    // Culling
    if (fes._depthCullingState.cull !== culling || force) {
        fes._depthCullingState.cull = culling;
    }

    // Cull face
    const cullFace = fes.cullBackFaces ?? cullBackFaces ?? true ? fes._gl.BACK : fes._gl.FRONT;
    if (fes._depthCullingState.cullFace !== cullFace || force) {
        fes._depthCullingState.cullFace = cullFace;
    }

    // Z offset
    setZOffset(fes, zOffset);
    setZOffsetUnits(fes, zOffsetUnits);

    // Front face
    const frontFace = reverseSide ? fes._gl.CW : fes._gl.CCW;
    if (fes._depthCullingState.frontFace !== frontFace || force) {
        fes._depthCullingState.frontFace = frontFace;
    }

    fes._stencilStateComposer.stencilMaterial = stencil;
}

/**
 * Gets a boolean indicating if depth testing is enabled
 * @returns the current state
 */
export function getDepthBuffer(engineState: IWebGLEnginePublic): boolean {
    return (engineState as WebGLEngineState)._depthCullingState.depthTest;
}

/**
 * Enable or disable depth buffering
 * @param enable defines the state to set
 */
export function setDepthBuffer(engineState: IWebGLEnginePublic, enable: boolean): void {
    (engineState as WebGLEngineState)._depthCullingState.depthTest = enable;
}

/**
 * Set the z offset Factor to apply to current rendering
 * @param value defines the offset to apply
 */
export function setZOffset(engineState: IWebGLEnginePublic, value: number): void {
    (engineState as WebGLEngineState)._depthCullingState.zOffset = engineState.useReverseDepthBuffer ? -value : value;
}

/**
 * Gets the current value of the zOffset Factor
 * @returns the current zOffset Factor state
 */
export function getZOffset(engineState: IWebGLEnginePublic): number {
    const zOffset = (engineState as WebGLEngineState)._depthCullingState.zOffset;
    return engineState.useReverseDepthBuffer ? -zOffset : zOffset;
}

/**
 * Set the z offset Units to apply to current rendering
 * @param value defines the offset to apply
 */
export function setZOffsetUnits(engineState: IWebGLEnginePublic, value: number): void {
    (engineState as WebGLEngineState)._depthCullingState.zOffsetUnits = engineState.useReverseDepthBuffer ? -value : value;
}

/**
 * Gets the current value of the zOffset Units
 * @returns the current zOffset Units state
 */
export function getZOffsetUnits(engineState: IWebGLEnginePublic): number {
    const zOffsetUnits = (engineState as WebGLEngineState)._depthCullingState.zOffsetUnits;
    return engineState.useReverseDepthBuffer ? -zOffsetUnits : zOffsetUnits;
}
