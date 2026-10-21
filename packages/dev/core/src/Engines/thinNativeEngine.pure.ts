/** This file must only contain pure code and pure imports */

/* eslint-disable @typescript-eslint/naming-convention */
import { type Nullable, type IndicesArray, type DataArray, type FloatArray, type DeepImmutable, type int } from "../types";

import { type Scene } from "../scene.pure";
import { type VertexBuffer } from "../Buffers/buffer.pure";
import { RegisterBufferAlign } from "../Buffers/buffer.align.pure";
import { InternalTexture, InternalTextureSource } from "../Materials/Textures/internalTexture";
import { HasStencilAspect } from "../Materials/Textures/textureHelper.functions";
import { type IInternalTextureLoader } from "../Materials/Textures/Loaders/internalTextureLoader";
import { _IESTextureLoader } from "../Materials/Textures/Loaders/iesTextureLoader";
import { type BaseTexture } from "../Materials/Textures/baseTexture.pure";
import { type VideoTexture } from "../Materials/Textures/videoTexture.pure";
import { type RenderTargetTexture } from "../Materials/Textures/renderTargetTexture.pure";
import { type Effect } from "../Materials/effect.pure";
import { DataBuffer } from "../Buffers/dataBuffer";
import { type Observer, Observable } from "../Misc/observable.pure";
import {
    type RenderTargetCreationOptions,
    type TextureSize,
    type DepthTextureCreationOptions,
    type InternalTextureCreationOptions,
} from "../Materials/Textures/textureCreationOptions";
import { type IPipelineContext } from "./IPipelineContext";
import { type IMultiRenderTargetOptions } from "../Materials/Textures/multiRenderTarget.pure";
import { type IColor3Like, type IColor4Like, type IViewportLike } from "../Maths/math.like";
import { Logger } from "../Misc/logger";
import { Constants } from "./constants";
import { AbstractEngine, type AbstractEngineOptions, type ISceneLike } from "./abstractEngine.pure";
import { ThinEngine } from "./thinEngine.pure";
import { type IWebRequest } from "../Misc/interfaces/iWebRequest";
import { EngineStore } from "./engineStore";
import { ShaderCodeInliner } from "./Processors/shaderCodeInliner";
import { NativeShaderProcessor } from "./Native/nativeShaderProcessors";
import { type IMaterialContext } from "./IMaterialContext";
import { type IDrawContext } from "./IDrawContext";
import { type ICanvas, type ICanvasRenderingContext, type IImage, type IPath2D } from "./ICanvas";
import { type IStencilState } from "../States/IStencilState";
import { type RenderTargetWrapper } from "./renderTargetWrapper";
import { type NativeData, NativeDataStream } from "./Native/nativeDataStream";
import {
    type INative,
    type INativeCamera,
    type INativeEngine,
    type NativeFramebuffer,
    type NativeFrameStats,
    type NativeProgram,
    type NativeTexture,
    type NativeUniform,
    type NativeVertexArrayObject,
} from "./Native/nativeInterfaces";
import { NativePipelineContext } from "./Native/nativePipelineContext";
import { NativeRenderTargetWrapper } from "./Native/nativeRenderTargetWrapper";
import { NativeHardwareTexture } from "./Native/nativeHardwareTexture";
import { type IHardwareTextureWrapper } from "../Materials/Textures/hardwareTextureWrapper";
import {
    getNativeAlphaMode,
    getNativeAttribType,
    getNativeSamplingMode,
    getNativeTextureFormat,
    getNativeStencilDepthFail,
    getNativeStencilDepthPass,
    getNativeStencilFunc,
    getNativeStencilOpFail,
    getNativeAddressMode,
} from "./Native/nativeHelpers";
import { checkNonFloatVertexBuffers } from "../Buffers/buffer.nonFloatVertexBuffers";
import { type _IShaderProcessingContext } from "./Processors/shaderProcessingOptions";
import { NativeShaderProcessingContext } from "./Native/nativeShaderProcessingContext";
import { ShaderLanguage } from "../Materials/shaderLanguage";
import { type WebGLHardwareTexture } from "./WebGL/webGLHardwareTexture";

import { _TimeToken } from "../Instrumentation/timeToken";
import { PerfCounter } from "../Misc/perfCounter";
import { DecodeBase64UrlToBinary } from "../Misc/fileTools.pure";

declare const _native: INative;

const onNativeObjectInitialized = /*#__PURE__*/ new Observable<INative>();
if (typeof self !== "undefined" && !Object.prototype.hasOwnProperty.call(self, "_native")) {
    let __native: INative;
    Object.defineProperty(self, "_native", {
        get: () => __native,
        set: (value: INative) => {
            __native = value;
            if (__native) {
                onNativeObjectInitialized.notifyObservers(__native);
            }
        },
    });
}

/**
 * Returns _native only after it has been defined by BabylonNative.
 * @internal
 */
export async function AcquireNativeObjectAsync(): Promise<INative> {
    return await new Promise((resolve) => {
        if (typeof _native === "undefined") {
            onNativeObjectInitialized.addOnce((nativeObject) => resolve(nativeObject));
        } else {
            resolve(_native);
        }
    });
}

/**
 * Registers a constructor on the _native object. See NativeXRFrame for an example.
 * @internal
 */
export async function RegisterNativeTypeAsync<Type>(typeName: string, constructor: Type) {
    ((await AcquireNativeObjectAsync()) as any)[typeName] = constructor;
}

/**
 * Container for accessors for natively-stored mesh data buffers.
 */
class NativeDataBuffer extends DataBuffer {
    /**
     * Accessor value used to identify/retrieve a natively-stored index buffer.
     */
    public nativeIndexBuffer?: NativeData;

    /**
     * Accessor value used to identify/retrieve a natively-stored vertex buffer.
     */
    public nativeVertexBuffer?: NativeData;
}

/**
 * Options to create the Native engine
 */
export interface ThinNativeEngineOptions extends AbstractEngineOptions {
    /**
     * defines whether to adapt to the device's viewport characteristics (default: false)
     */
    adaptToDeviceRatio?: boolean;
}

/** @internal */
class CommandBufferEncoder {
    private readonly _commandStream: NativeDataStream;
    private readonly _pending = new Array<NativeData>();
    private _isCommandBufferScopeActive = false;

    public constructor(private readonly _engine: INativeEngine) {
        this._commandStream = ThinNativeEngine._createNativeDataStream();
        this._engine.setCommandDataStream(this._commandStream);
    }

    public beginCommandScope() {
        if (this._isCommandBufferScopeActive) {
            throw new Error("Command scope already active.");
        }

        this._isCommandBufferScopeActive = true;
    }

    public endCommandScope() {
        if (!this._isCommandBufferScopeActive) {
            throw new Error("Command scope is not active.");
        }

        this._isCommandBufferScopeActive = false;
        this._submit();
    }

    public startEncodingCommand(command: NativeData) {
        this._commandStream.writeNativeData(command);
    }

    public encodeCommandArgAsUInt32(commandArg: number) {
        this._commandStream.writeUint32(commandArg);
    }

    public encodeCommandArgAsUInt32s(commandArg: Uint32Array) {
        this._commandStream.writeUint32Array(commandArg);
    }

    public encodeCommandArgAsInt32(commandArg: number) {
        this._commandStream.writeInt32(commandArg);
    }

    public encodeCommandArgAsInt32s(commandArg: Int32Array) {
        this._commandStream.writeInt32Array(commandArg);
    }

    public encodeCommandArgAsFloat32(commandArg: number) {
        this._commandStream.writeFloat32(commandArg);
    }

    public encodeCommandArgAsFloat32s(commandArg: DeepImmutable<FloatArray>) {
        this._commandStream.writeFloat32Array(commandArg);
    }

    public encodeCommandArgAsNativeData(commandArg: NativeData) {
        this._commandStream.writeNativeData(commandArg);
        this._pending.push(commandArg);
    }

    public finishEncodingCommand() {
        if (!this._isCommandBufferScopeActive) {
            this._submit();
        }
    }

    private _submit() {
        this._engine.submitCommands();
        this._pending.length = 0;
    }
}

const remappedAttributesNames: string[] = [];

// Reused by bindFramebuffer(forceFullscreenViewport) to avoid allocating a viewport per bind.
const _FullscreenViewport: IViewportLike = { x: 0, y: 0, width: 1, height: 1 };

// Render-target textures created with mip storage (createMipMaps or generateMipMaps). Tracked separately from
// generateMipMaps so sample-count changes and context-loss rebuilds keep an explicitly authored mip chain.
const _TexturesWithMipStorage = /*#__PURE__*/ new WeakSet<InternalTexture>();

/**
 * Sentinel for "no attachment masking": every color attachment of the bound framebuffer takes part in
 * the clear. Native treats this value specially and skips the bgfx color-palette clear path.
 */
const _AllAttachmentsMask = 0xff;

/** @internal */
export class ThinNativeEngine extends ThinEngine {
    // This must match the protocol version in NativeEngine.cpp
    private static readonly PROTOCOL_VERSION = 9;

    /** @internal */
    public static _createNativeDataStream(): NativeDataStream {
        return new NativeDataStream();
    }

    /////////// No assignment allowed in constructor           ///////////
    /////////// They should all be in _initializeNativeEngine  ///////////
    /////////// To ensure a correct sharing with NativeEngine  ///////////
    protected _engine: INativeEngine;
    private _camera: Nullable<INativeCamera>;
    private _commandBufferEncoder: CommandBufferEncoder;
    private _frameStats: NativeFrameStats;
    private _boundBuffersVertexArray: any;
    private _fontMeasureCanvas?: ICanvas;
    private _fontMeasureContext?: ICanvasRenderingContext;
    private _transformFeedbackBuffer: Nullable<NativeDataBuffer> = null;
    private _transformFeedbackActive = false;
    /**
     * Bit i is set when color attachment i is selected by the last bindAttachments() call.
     * Only used to mask clears (see bindAttachments).
     */
    private _clearAttachmentMask: number;
    private _currentDepthTest: number;
    private _depthTestEnabled: boolean;
    private _stencilTest: boolean;
    private _stencilMask: number;
    private _stencilFunc: number;
    private _stencilFuncRef: number;
    private _stencilFuncMask: number;
    private _stencilOpStencilFail: number;
    private _stencilOpDepthFail: number;
    private _stencilOpStencilDepthPass: number;
    private _zOffset: number;
    private _zOffsetUnits: number;
    private _cachedCulling: boolean;
    private _cachedReverseSide: boolean;
    private _cachedCullBackFaces: boolean;
    private _cachedZOffset: number;
    private _cachedZOffsetUnits: number;
    private _depthWrite: boolean;
    // warning for non supported fill mode has already been displayed
    private _fillModeWarningDisplayed: boolean;
    // Scratch buffers for setInt2/3/4; NativeDataStream copies them synchronously.
    private _int2Scratch: Int32Array;
    private _int3Scratch: Int32Array;
    private _int4Scratch: Int32Array;
    // Reference counts + metadata for framebuffers shared across frame graph render-target wrappers
    // (see _buildFrameGraphFramebuffer). Initialized in _initializeNativeEngine to match the other fields.
    private _frameGraphFramebufferRefCount: Map<
        NativeFramebuffer,
        {
            count: number;
            hardwareTexture: NativeHardwareTexture;
            colorResources: NativeTexture[];
            hasDepth: boolean;
            hasStencil: boolean;
            samples: number;
            sharedDepthResource?: NativeTexture;
        }
    >;

    public constructor(options: ThinNativeEngineOptions = {}) {
        super(null, false, options, options.adaptToDeviceRatio);
        this._initializeNativeEngine(options.adaptToDeviceRatio ?? false);
    }
    //////////////////////////////////////////////////////////////////////

    /**
     * Keeps as a separate function to use in NativeEngine
     * @internal
     */
    protected _initializeNativeEngine(adaptToDeviceRatio: boolean): void {
        // ThinNativeEngine relies on VertexBuffer.effective{Buffer,ByteOffset,ByteStride}
        // (defined in Buffers/buffer.align.pure) to bind vertex attributes through
        // recordVertexBuffer. Register the side effect here so the engine is usable
        // on its own without callers having to remember to import the wrapper module.
        // The registration is idempotent.
        RegisterBufferAlign();

        this._engine = new _native.Engine({
            version: AbstractEngine.Version,
            nonFloatVertexBuffers: true,
        });
        this._camera = _native.Camera ? new _native.Camera() : null;
        this._commandBufferEncoder = new CommandBufferEncoder(this._engine);
        this._frameGraphFramebufferRefCount = new Map();
        this._frameStats = { gpuTimeNs: Number.NaN };
        // There is no DOM canvas to draw the default loading screen into, so install a no-op one; this keeps
        // the loading-UI accessors (loadingUIText, loadingUIBackgroundColor, display/hide) usable on native.
        let loadingScreenWarningDisplayed = false;
        this._loadingScreen = {
            displayLoadingUI: () => {
                if (!loadingScreenWarningDisplayed) {
                    Logger.Warn("NativeEngine is unable to display the loading screen UI.");
                    loadingScreenWarningDisplayed = true;
                }
            },
            hideLoadingUI: () => {},
            loadingUIBackgroundColor: "",
            loadingUIText: "",
        };
        this._boundBuffersVertexArray = null;
        this._clearAttachmentMask = _AllAttachmentsMask;
        this._currentDepthTest = _native.Engine.DEPTH_TEST_LEQUAL;
        this._depthTestEnabled = true;
        this._stencilTest = false;
        this._stencilMask = 255;
        this._stencilFunc = Constants.ALWAYS;
        this._stencilFuncRef = 0;
        this._stencilFuncMask = 255;
        this._stencilOpStencilFail = Constants.KEEP;
        this._stencilOpDepthFail = Constants.KEEP;
        this._stencilOpStencilDepthPass = Constants.REPLACE;
        this._zOffset = 0;
        this._zOffsetUnits = 0;
        this._cachedCulling = true;
        this._cachedReverseSide = false;
        this._cachedCullBackFaces = true;
        this._cachedZOffset = 0;
        this._cachedZOffsetUnits = 0;
        this._depthWrite = true;
        // warning for non supported fill mode has already been displayed
        this._fillModeWarningDisplayed = false;
        this._int2Scratch = new Int32Array(2);
        this._int3Scratch = new Int32Array(3);
        this._int4Scratch = new Int32Array(4);

        this._drawCalls = new PerfCounter();

        if (_native.Engine.PROTOCOL_VERSION !== ThinNativeEngine.PROTOCOL_VERSION) {
            throw new Error(`Protocol version mismatch: ${_native.Engine.PROTOCOL_VERSION} (Native) !== ${ThinNativeEngine.PROTOCOL_VERSION} (JS)`);
        }

        // Prefer setRenderResetCallback (accurate name -- fires when bgfx is (re)initialized,
        // i.e. on device restore). Fall back to the legacy setDeviceLostCallback for backward
        // compatibility with older BabylonNative builds. See BabylonNative #1722.
        const renderResetCallback = () => {
            this.onContextLostObservable.notifyObservers(this);
            this._contextWasLost = true;
            this._restoreEngineAfterContextLost();
        };
        if (this._engine.setRenderResetCallback) {
            this._engine.setRenderResetCallback(renderResetCallback);
        } else if (this._engine.setDeviceLostCallback) {
            this._engine.setDeviceLostCallback(renderResetCallback);
        }

        this._webGLVersion = 2;
        this.disableUniformBuffers = true;
        this._shaderPlatformName = "NATIVE";
        // Babylon Native is not WebGL and has no _gl context. Report a distinct engine name (like
        // WebGPU reports "WebGPU") so application/feature code that branches on engine.name === "WebGL"
        // to touch the WebGL-only _gl context skips the native engine instead of dereferencing null.
        this._name = "Native";

        // TODO: Initialize this more correctly based on the hardware capabilities.
        // Init caps

        this._caps = {
            maxTexturesImageUnits: 16,
            maxVertexTextureImageUnits: 16,
            maxCombinedTexturesImageUnits: 32,
            maxTextureSize: _native.Engine.CAPS_LIMITS_MAX_TEXTURE_SIZE,
            maxCubemapTextureSize: 512,
            maxRenderTextureSize: 512,
            maxVertexAttribs: 16,
            maxVaryingVectors: 16,
            maxDrawBuffers: 8,
            maxFragmentUniformVectors: 16,
            maxVertexUniformVectors: 256,
            shaderFloatPrecision: 23, // TODO: is this correct?
            standardDerivatives: true,
            astc: null,
            pvrtc: null,
            etc1: null,
            etc2: null,
            bptc: null,
            maxAnisotropy: 16, // TODO: Retrieve this smartly. Currently set to D3D11 maximum allowable value.
            uintIndices: true,
            fragmentDepthSupported: false,
            highPrecisionShaderSupported: true,
            colorBufferFloat: true,
            blendFloat: true,
            supportFloatTexturesResolve: false,
            rg11b10ufColorRenderable: false,
            textureFloat: true,
            textureFloatLinearFiltering: true,
            textureFloatRender: true,
            textureHalfFloat: true,
            textureHalfFloatLinearFiltering: true,
            textureHalfFloatRender: true,
            textureLOD: true,
            texelFetch: true,
            drawBuffersExtension: true,
            depthTextureExtension: false,
            vertexArrayObject: true,
            instancedArrays: true,
            supportOcclusionQuery: false,
            canUseTimestampForTimerQuery: false,
            blendMinMax: false,
            maxMSAASamples: 16,
            canUseGLInstanceID: true,
            canUseGLVertexID: true,
            supportComputeShaders: false,
            supportSRGBBuffers: true,
            supportTransformFeedbacks: !!_native.Engine.COMMAND_DRAWTRANSFORMFEEDBACK,
            textureMaxLevel: false,
            texture2DArrayMaxLayerCount: _native.Engine.CAPS_LIMITS_MAX_TEXTURE_LAYERS,
            disableMorphTargetTexture: false,
            parallelShaderCompile: { COMPLETION_STATUS_KHR: 0 },
            textureNorm16: true,
            blendParametersPerTarget: false,
            dualSourceBlending: false,
            supportReadWriteStorageTextures: false,
        };

        this._features = {
            forceBitmapOverHTMLImageElement: true,
            supportRenderAndCopyToLodForFloatTextures: false,
            // Native can attach an explicit depth/stencil texture to a render target (see
            // _createDepthStencilTexture) and sample it afterwards. Hardware comparison samplers are
            // available through bgfx BGFX_SAMPLER_COMPARE_* (set via updateTextureComparisonFunction),
            // which is what ShadowGenerator needs for FILTER_PCF / FILTER_PCSS (incl. cascaded shadows).
            // Both are optional runtime extensions, so only advertise them when the runtime provides them.
            supportDepthStencilTexture: !!this._engine.createMultiFrameBuffer,
            supportShadowSamplers: !!this._engine.createMultiFrameBuffer && !!this._engine.setTextureComparisonFunction,
            uniformBufferHardCheckMatrix: false,
            // Native supports GPU cube prefiltering (HDRFiltering / HDRIrradianceFiltering): the render path
            // binds a specific cube-face + mip via bindFramebuffer(faceIndex, lodLevel) and convolves the
            // environment per-roughness. Required so OpenPBR/PBR IBL scenes get real prefiltered radiance
            // (and irradiance) instead of black/energy-lossy CPU-SH fallbacks.
            allowTexturePrefiltering: true,
            trackUbosInFrame: false,
            checkUbosContentBeforeUpload: false,
            // Cascaded shadow maps render into 2D-array render targets, one framebuffer per layer.
            supportCSM: true,
            basisNeedsPOT: false,
            support3DTextures: false,
            needTypeSuffixInShaderConstants: false,
            supportMSAA: true,
            supportSSAO2: false,
            supportIBLShadows: false,
            supportExtendedTextureFormats: false,
            supportSwitchCaseInShader: false,
            supportSyncTextureRead: false,
            needsInvertingBitmap: true,
            useUBOBindingCache: true,
            needShaderCodeInlining: true,
            needToAlwaysBindUniformBuffers: false,
            supportRenderPasses: true,
            supportSpriteInstancing: true,
            forceVertexBufferStrideAndOffsetMultiple4Bytes: true,
            _checkNonFloatVertexBuffersDontRecreatePipelineContext: false,
        };

        Logger.Log("Babylon Native (v" + AbstractEngine.Version + ") launched");

        // Wrappers
        if (typeof URL === "undefined") {
            (window.URL as any) = {
                createObjectURL: function () {},
                revokeObjectURL: function () {},
            };
        }

        // TODO: Remove in next protocol version update
        if (typeof Blob === "undefined") {
            (window.Blob as any) = function (v: any) {
                return v;
            };
        }

        // polyfill for Chakra
        if (!Array.prototype.flat) {
            Object.defineProperty(Array.prototype, "flat", {
                configurable: true,
                value: function flat(this: any[], depth?: number) {
                    depth = isNaN(depth as any) ? 1 : Number(depth);

                    return depth
                        ? Array.prototype.reduce.call(
                              this,
                              function (acc: any, cur: any) {
                                  if (Array.isArray(cur)) {
                                      // eslint-disable-next-line prefer-spread
                                      acc.push.apply(acc, flat.call(cur, depth - 1));
                                  } else {
                                      acc.push(cur);
                                  }
                                  return acc;
                              },
                              []
                          )
                        : Array.prototype.slice.call(this);
                },
                writable: true,
            });
        }

        // Currently we do not fully configure the ThinEngine on construction of NativeEngine.
        // Setup resolution scaling based on display settings.
        const devicePixelRatio = window ? window.devicePixelRatio || 1.0 : 1.0;
        this._hardwareScalingLevel = adaptToDeviceRatio ? 1.0 / devicePixelRatio : 1.0;
        this._engine.setHardwareScalingLevel(this._hardwareScalingLevel);
        this._lastDevicePixelRatio = devicePixelRatio;
        this.resize();

        const currentDepthFunction = this.getDepthFunction();
        if (currentDepthFunction) {
            this.setDepthFunction(currentDepthFunction);
        }

        // Shader processor
        this._shaderProcessor = new NativeShaderProcessor();

        this.onNewSceneAddedObservable.add((scene) => {
            this._wrapSceneRenderWithCommandScope(scene);
        });
    }

    /**
     * Brackets a scene's render with a command scope, so the commands it encodes are submitted together.
     * @param scene the scene whose render should be wrapped
     */
    private _wrapSceneRenderWithCommandScope(scene: Scene): void {
        const originalRender = scene.render;
        scene.render = (...args: Parameters<typeof originalRender>) => {
            this._commandBufferEncoder.beginCommandScope();
            try {
                originalRender.apply(scene, args);
            } catch (renderException) {
                // The scope must be closed even when the render throws. Otherwise it stays
                // open forever and every later frame fails with "Command scope already
                // active.", so one recoverable error permanently breaks the engine instead
                // of affecting just this frame.
                try {
                    this._commandBufferEncoder.endCommandScope();
                } catch (endException) {
                    // Never let this replace the root cause; report it separately instead.
                    Logger.Error(`Failed to end the command scope while unwinding a render error: ${endException}`);
                }
                throw renderException;
            }

            this._commandBufferEncoder.endCommandScope();
        };
    }

    public override setHardwareScalingLevel(level: number): void {
        super.setHardwareScalingLevel(level);
        this._engine.setHardwareScalingLevel(level);
    }

    public override dispose(): void {
        super.dispose();
        if (this._boundBuffersVertexArray) {
            this._deleteVertexArray(this._boundBuffersVertexArray);
        }
        (this._fontMeasureCanvas as Partial<{ dispose(): void }> | undefined)?.dispose?.();
        this._fontMeasureCanvas = undefined;
        this._fontMeasureContext = undefined;
        this._engine.dispose();
    }

    /**
     * Enable scissor test on a specific rectangle (ie. render will only be executed on a specific portion of the screen)
     * @param x defines the x-coordinate of the bottom left corner of the clear rectangle
     * @param y defines the y-coordinate of the corner of the clear rectangle
     * @param width defines the width of the clear rectangle
     * @param height defines the height of the clear rectangle
     */
    public override enableScissor(x: number, y: number, width: number, height: number): void {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETSCISSOR);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(x);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(y);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(width);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(height);
        this._commandBufferEncoder.finishEncodingCommand();
    }

    /**
     * Disable previously set scissor test rectangle
     */
    public override disableScissor() {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETSCISSOR);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(0);
        this._commandBufferEncoder.finishEncodingCommand();
    }

    /**
     * Can be used to override the current requestAnimationFrame requester.
     * @internal
     */
    protected override _queueNewFrame(bindedRenderFunction: any, requester?: any): number {
        // Use the provided requestAnimationFrame, unless the requester is the window. In that case, we will default to the Babylon Native version of requestAnimationFrame.
        if (requester?.requestAnimationFrame && requester !== this.getHostWindow()) {
            return requester.requestAnimationFrame(bindedRenderFunction);
        } else {
            this._engine.requestAnimationFrame(bindedRenderFunction);
        }
        return 0;
    }

    protected override _restoreEngineAfterContextLost(): void {
        this._clearEmptyResources();

        // The frame graph framebuffers of the lost context are invalid: forget their bookkeeping (without deleting
        // the stale native handles) so each reset does not leave another generation of entries behind.
        for (const shared of this._frameGraphFramebufferRefCount.values()) {
            shared.hardwareTexture._frameGraphFramebuffer = null;
        }
        this._frameGraphFramebufferRefCount.clear();

        const depthTest = this._depthCullingState.depthTest; // backup those values because the call to initEngine / wipeCaches will reset them
        const depthFunc = this._depthCullingState.depthFunc;
        const depthMask = this._depthCullingState.depthMask;
        const stencilTest = this._stencilState.stencilTest;

        this._rebuildGraphicsResources();

        this._depthCullingState.depthTest = depthTest;
        this._depthCullingState.depthFunc = depthFunc;
        this._depthCullingState.depthMask = depthMask;
        this._stencilState.stencilTest = stencilTest;

        this._flagContextRestored();
    }

    /**
     * Override default engine behavior.
     * @param framebuffer
     */
    public override _bindUnboundFramebuffer(framebuffer: Nullable<WebGLFramebuffer>) {
        if (this._currentFramebuffer !== framebuffer) {
            if (this._currentFramebuffer) {
                this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_UNBINDFRAMEBUFFER);
                this._commandBufferEncoder.encodeCommandArgAsNativeData(this._currentFramebuffer as NativeFramebuffer);
                this._commandBufferEncoder.finishEncodingCommand();
            }

            if (framebuffer) {
                this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_BINDFRAMEBUFFER);
                this._commandBufferEncoder.encodeCommandArgAsNativeData(framebuffer as NativeFramebuffer);
                this._commandBufferEncoder.finishEncodingCommand();
            }

            this._currentFramebuffer = framebuffer;

            // drawBuffers state is per-framebuffer on WebGL, so a framebuffer switch resets the
            // attachment selection back to "every attachment".
            this._clearAttachmentMask = _AllAttachmentsMask;
        }
    }

    /**
     * Gets host document
     * @returns the host document object
     */
    public override getHostDocument(): Nullable<Document> {
        return null;
    }

    public override clear(color: Nullable<IColor4Like>, backBuffer: boolean, depth: boolean, stencil: boolean = false, stencilClearValue = 0): void {
        if (depth && this.useReverseDepthBuffer) {
            // Reverse-Z: the scene is rendered with a flipped projection (near maps to 1, far to 0), so the
            // depth buffer is cleared to 0 and the comparison must accept greater values. The WebGL engine
            // sets depthCullingState.depthFunc = GEQUAL here and relies on applyStates() running the depth
            // comparison to the GL context before each draw. The native draw path does not call applyStates()
            // (only depth-test enable/disable is reconciled in _flushDepthTestState()), so setting the shared
            // state alone would never reach the backend. Route the comparison through the native command path
            // as well -- mirroring the WebGPU engine's clear path, which calls setDepthFunctionToGreaterOrEqual().
            this._depthCullingState.depthFunc = Constants.GEQUAL;
            this.setDepthFunction(Constants.GEQUAL);
        }

        const clear2 = _native.Engine.COMMAND_CLEAR2;
        this._commandBufferEncoder.startEncodingCommand(clear2 ?? _native.Engine.COMMAND_CLEAR);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(backBuffer && color && this._clearAttachmentMask !== 0 ? 1 : 0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(color ? color.r : 0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(color ? color.g : 0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(color ? color.b : 0);
        // Playgrounds often assign Color3 to scene.clearColor; Color3 has no .a, so
        // `color.a` is undefined and was encoded as 0 → transparent clear. PNG
        // screenshots then show black sky on dark HTML backgrounds while RGB still
        // matches (pixel compare ignores alpha). Default missing alpha to opaque.
        this._commandBufferEncoder.encodeCommandArgAsFloat32(color ? (color.a ?? 1) : 1);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(depth ? 1 : 0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(depth && this.useReverseDepthBuffer ? 0 : 1);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(stencil ? 1 : 0);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(stencilClearValue);
        if (clear2) {
            this._commandBufferEncoder.encodeCommandArgAsUInt32(this._clearAttachmentMask);
        }
        this._commandBufferEncoder.finishEncodingCommand();
    }

    public override createIndexBuffer(indices: IndicesArray, updateable?: boolean, _label?: string): NativeDataBuffer {
        const data = this._normalizeIndexData(indices);
        const buffer = new NativeDataBuffer();
        buffer.references = 1;
        buffer.is32Bits = data.BYTES_PER_ELEMENT === 4;
        if (data.byteLength) {
            buffer.nativeIndexBuffer = this._engine.createIndexBuffer(data.buffer, data.byteOffset, data.byteLength, buffer.is32Bits, updateable ?? false);
        }
        return buffer;
    }

    public override createVertexBuffer(vertices: DataArray, updateable?: boolean, _label?: string): NativeDataBuffer {
        const data = ArrayBuffer.isView(vertices) ? vertices : new Float32Array(vertices);
        const buffer = new NativeDataBuffer();
        buffer.references = 1;
        if (data.byteLength) {
            buffer.nativeVertexBuffer = this._engine.createVertexBuffer(data.buffer, data.byteOffset, data.byteLength, updateable ?? false);
        }
        return buffer;
    }

    private _recordVertexArrayObject(
        vertexArray: any,
        vertexBuffers: { [key: string]: VertexBuffer },
        indexBuffer: Nullable<NativeDataBuffer>,
        effect: Effect,
        overrideVertexBuffers?: { [kind: string]: Nullable<VertexBuffer> }
    ): void {
        if (!effect._checkedNonFloatVertexBuffers) {
            checkNonFloatVertexBuffers(vertexBuffers, effect);
            effect._checkedNonFloatVertexBuffers = true;
        }

        if (indexBuffer) {
            this._engine.recordIndexBuffer(vertexArray, indexBuffer.nativeIndexBuffer!);
        }

        const attributes = effect.getAttributesNames();
        for (let index = 0; index < attributes.length; index++) {
            const location = effect.getAttributeLocation(index);
            if (location >= 0) {
                const kind = attributes[index];
                let vertexBuffer: Nullable<VertexBuffer> = null;

                if (overrideVertexBuffers) {
                    vertexBuffer = overrideVertexBuffers[kind];
                }
                if (!vertexBuffer) {
                    vertexBuffer = vertexBuffers[kind];
                }

                if (vertexBuffer) {
                    const buffer = vertexBuffer.effectiveBuffer as Nullable<NativeDataBuffer>;
                    if (buffer && buffer.nativeVertexBuffer) {
                        this._engine.recordVertexBuffer(
                            vertexArray,
                            buffer.nativeVertexBuffer,
                            location,
                            vertexBuffer.effectiveByteOffset,
                            vertexBuffer.effectiveByteStride,
                            vertexBuffer.getSize(),
                            getNativeAttribType(vertexBuffer.type),
                            vertexBuffer.normalized,
                            vertexBuffer.getInstanceDivisor()
                        );
                    }
                }
            }
        }
    }

    public override bindBuffers(vertexBuffers: { [key: string]: VertexBuffer }, indexBuffer: Nullable<NativeDataBuffer>, effect: Effect): void {
        if (this._boundBuffersVertexArray) {
            this._deleteVertexArray(this._boundBuffersVertexArray);
        }
        this._boundBuffersVertexArray = this._engine.createVertexArray();
        this._recordVertexArrayObject(this._boundBuffersVertexArray, vertexBuffers, indexBuffer, effect);
        this.bindVertexArrayObject(this._boundBuffersVertexArray);
    }

    public override recordVertexArrayObject(
        vertexBuffers: { [key: string]: VertexBuffer },
        indexBuffer: Nullable<NativeDataBuffer>,
        effect: Effect,
        overrideVertexBuffers?: { [kind: string]: Nullable<VertexBuffer> }
    ): WebGLVertexArrayObject {
        const vertexArray = this._engine.createVertexArray();
        this._recordVertexArrayObject(vertexArray, vertexBuffers, indexBuffer, effect, overrideVertexBuffers);
        return vertexArray;
    }

    private _deleteVertexArray(vertexArray: NativeVertexArrayObject) {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DELETEVERTEXARRAY);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(vertexArray);
        this._commandBufferEncoder.finishEncodingCommand();
    }

    public override bindVertexArrayObject(vertexArray: WebGLVertexArrayObject): void {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_BINDVERTEXARRAY);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(vertexArray as NativeVertexArrayObject);
        this._commandBufferEncoder.finishEncodingCommand();
    }

    /** @internal Native vertex arrays capture their buffers when recorded; there is no bound array buffer. */
    public override bindArrayBuffer(_buffer: Nullable<DataBuffer>): void {}

    public override releaseVertexArrayObject(vertexArray: WebGLVertexArrayObject) {
        this._deleteVertexArray(vertexArray as NativeVertexArrayObject);
    }

    public override getAttributes(pipelineContext: IPipelineContext, attributesNames: string[]): number[] {
        const nativePipelineContext = pipelineContext as NativePipelineContext;
        const nativeShaderProcessingContext = nativePipelineContext.shaderProcessingContext!;

        remappedAttributesNames.length = 0;
        for (let index = 0; index < attributesNames.length; index++) {
            const origAttributeName = attributesNames[index];
            const attributeName = nativeShaderProcessingContext.remappedAttributeNames[origAttributeName] ?? origAttributeName;
            remappedAttributesNames[index] = attributeName;
        }
        return this._engine.getAttributes(nativePipelineContext.program, remappedAttributesNames);
    }

    /**
     * Check whether the runtime can expand primitive modes unavailable in modern rendering APIs.
     * @param fillMode  defines the primitive to use
     * @returns true if supported
     */
    private _checkSupportedFillMode(fillMode: number): boolean {
        if (fillMode == Constants.MATERIAL_LineLoopDrawMode || fillMode == Constants.MATERIAL_TriangleFanDrawMode) {
            if (this._engine.supportsPrimitiveModeExpansion) {
                return true;
            }
            if (!this._fillModeWarningDisplayed) {
                Logger.Warn("Line Loop and Triangle Fan are not supported fill modes with Babylon Native. Elements with these fill mode will not be visible.");
                this._fillModeWarningDisplayed = true;
            }
            return false;
        }
        return true;
    }

    /**
     * Draw a list of indexed primitives
     * @param fillMode defines the primitive to use
     * @param indexStart defines the starting index
     * @param indexCount defines the number of index to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public override drawElementsType(fillMode: number, indexStart: number, indexCount: number, instancesCount?: number): void {
        if (!this._checkSupportedFillMode(fillMode)) {
            return;
        }
        // Apply states
        this._flushDepthTestState();
        this._drawCalls.addCount(1, false);

        if (instancesCount) {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DRAWINDEXEDINSTANCED);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(fillMode);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(indexStart);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(indexCount);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(instancesCount);
        } else {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DRAWINDEXED);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(fillMode);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(indexStart);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(indexCount);
        }

        this._commandBufferEncoder.finishEncodingCommand();
    }

    /**
     * Draw a list of unindexed primitives
     * @param fillMode defines the primitive to use
     * @param verticesStart defines the index of first vertex to draw
     * @param verticesCount defines the count of vertices to draw
     * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
     */
    public override drawArraysType(fillMode: number, verticesStart: number, verticesCount: number, instancesCount?: number): void {
        if (this._transformFeedbackActive) {
            // The native engine runs the transform feedback program over the bound vertex array
            // and writes the captured varyings into the bound feedback buffer.
            const target = this._transformFeedbackBuffer?.nativeVertexBuffer;
            if (!target) {
                throw new Error("Transform feedback requires a bound native vertex buffer.");
            }
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DRAWTRANSFORMFEEDBACK!);
            this._commandBufferEncoder.encodeCommandArgAsNativeData(target);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(verticesStart);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(verticesCount);
            this._commandBufferEncoder.finishEncodingCommand();
            return;
        }

        if (!this._checkSupportedFillMode(fillMode)) {
            return;
        }
        // Apply states
        this._flushDepthTestState();
        this._drawCalls.addCount(1, false);

        if (instancesCount) {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DRAWINSTANCED);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(fillMode);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(verticesStart);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(verticesCount);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(instancesCount);
        } else {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DRAW);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(fillMode);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(verticesStart);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(verticesCount);
        }

        this._commandBufferEncoder.finishEncodingCommand();
    }

    /** @internal Transform feedback objects are implicit on native; state lives on the engine. */
    public createTransformFeedback(): WebGLTransformFeedback {
        return {} as WebGLTransformFeedback;
    }

    /** @internal */
    public deleteTransformFeedback(_value: WebGLTransformFeedback): void {}

    /** @internal */
    public bindTransformFeedback(_value: Nullable<WebGLTransformFeedback>): void {}

    /** @internal */
    public bindTransformFeedbackBuffer(value: Nullable<DataBuffer>): void {
        this._transformFeedbackBuffer = value as Nullable<NativeDataBuffer>;
    }

    /** @internal Varyings are passed to the native program when it is created. */
    public setTranformFeedbackVaryings(_program: WebGLProgram, _value: string[]): void {}

    /** @internal */
    public beginTransformFeedback(_usePoints: boolean = true): void {
        this._transformFeedbackActive = true;
    }

    /** @internal */
    public endTransformFeedback(): void {
        this._transformFeedbackActive = false;
    }

    /** @internal */
    public readTransformFeedbackBuffer(target: ArrayBufferView): void {
        const buffer = this._transformFeedbackBuffer?.nativeVertexBuffer;
        if (!buffer) {
            throw new Error("Reading transform feedback requires a bound native vertex buffer.");
        }
        if (!this._engine.readTransformFeedbackBuffer) {
            throw new Error("This native engine build does not support reading transform feedback buffers.");
        }
        this._engine.readTransformFeedbackBuffer(buffer, target.buffer, target.byteOffset, target.byteLength);
    }

    /** @internal Transform feedback draws never rasterize on native. */
    public setRasterizerState(_value: boolean): void {}

    public override createPipelineContext(shaderProcessingContext: Nullable<_IShaderProcessingContext>): IPipelineContext {
        const isAsync = !!this._caps.parallelShaderCompile;
        return new NativePipelineContext(this, isAsync, shaderProcessingContext as Nullable<NativeShaderProcessingContext>);
    }

    public override createMaterialContext(): IMaterialContext | undefined {
        return undefined;
    }

    public override createDrawContext(): IDrawContext | undefined {
        return undefined;
    }

    /**
     * Function is not technically Async
     * @internal
     */
    // eslint-disable-next-line no-restricted-syntax
    public override _preparePipelineContextAsync(
        pipelineContext: IPipelineContext,
        vertexSourceCode: string,
        fragmentSourceCode: string,
        createAsRaw: boolean,
        _rawVertexSourceCode: string,
        _rawFragmentSourceCode: string,
        _rebuildRebind: any,
        defines: Nullable<string>,
        transformFeedbackVaryings: Nullable<string[]>,
        _key: string,
        onReady: () => void
    ) {
        if (createAsRaw) {
            this.createRawShaderProgram();
        } else {
            this.createShaderProgram(pipelineContext, vertexSourceCode, fragmentSourceCode, defines, undefined, transformFeedbackVaryings);
        }

        onReady();
    }

    /**
     * @internal
     */
    public override _getShaderProcessingContext(shaderLanguage: ShaderLanguage): Nullable<_IShaderProcessingContext> {
        if (shaderLanguage === ShaderLanguage.WGSL) {
            throw new Error("NativeEngine does not support WGSL graphics shaders.");
        }
        return new NativeShaderProcessingContext();
    }

    /**
     * @internal
     */
    public override _executeWhenRenderingStateIsCompiled(pipelineContext: IPipelineContext, action: () => void) {
        const nativePipelineContext = pipelineContext as NativePipelineContext;
        if (nativePipelineContext.isAsync) {
            if (nativePipelineContext.onCompiled) {
                const oldHandler = nativePipelineContext.onCompiled;
                nativePipelineContext.onCompiled = () => {
                    oldHandler();
                    action();
                };
            } else {
                nativePipelineContext.onCompiled = action;
            }
        } else {
            action();
        }
    }

    public override createRawShaderProgram(): WebGLProgram {
        throw new Error("Not Supported");
    }

    public override createShaderProgram(
        pipelineContext: IPipelineContext,
        vertexCode: string,
        fragmentCode: string,
        defines: Nullable<string>,
        _context?: WebGLRenderingContext,
        transformFeedbackVaryings: Nullable<string[]> = null
    ): WebGLProgram {
        const varyings = transformFeedbackVaryings?.length ? transformFeedbackVaryings : undefined;
        if (varyings && !_native.Engine.COMMAND_DRAWTRANSFORMFEEDBACK) {
            throw new Error("This native engine build does not support transform feedback.");
        }

        const nativePipelineContext = pipelineContext as NativePipelineContext;

        this.onBeforeShaderCompilationObservable.notifyObservers(this);

        const vertexInliner = new ShaderCodeInliner(vertexCode);
        vertexInliner.processCode();
        vertexCode = vertexInliner.code;

        const fragmentInliner = new ShaderCodeInliner(fragmentCode);
        fragmentInliner.processCode();
        fragmentCode = fragmentInliner.code;

        vertexCode = ThinEngine._ConcatenateShader(vertexCode, defines);
        fragmentCode = ThinEngine._ConcatenateShader(fragmentCode, defines);

        const onSuccess = () => {
            nativePipelineContext.isCompiled = true;
            nativePipelineContext.onCompiled?.();
            this.onAfterShaderCompilationObservable.notifyObservers(this);
        };

        if (pipelineContext.isAsync) {
            nativePipelineContext.program = this._engine.createProgramAsync(
                vertexCode,
                fragmentCode,
                onSuccess,
                (error: Error) => {
                    nativePipelineContext.compilationError = error;
                },
                varyings
            );
        } else {
            try {
                nativePipelineContext.program = this._engine.createProgram(vertexCode, fragmentCode, varyings);
                onSuccess();
            } catch (e) {
                const message = e?.message;
                throw new Error("SHADER ERROR" + (typeof message === "string" ? "\n" + message : ""), { cause: e });
            }
        }

        return nativePipelineContext.program as WebGLProgram;
    }

    /**
     * Inline functions in shader code that are marked to be inlined
     * @param code code to inline
     * @returns inlined code
     */
    public override inlineShaderCode(code: string): string {
        const sci = new ShaderCodeInliner(code);
        sci.debug = false;
        sci.processCode();
        return sci.code;
    }

    protected override _setProgram(program: WebGLProgram): void {
        if (this._currentProgram !== program) {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETPROGRAM);
            this._commandBufferEncoder.encodeCommandArgAsNativeData(program as NativeProgram);
            this._commandBufferEncoder.finishEncodingCommand();
            this._currentProgram = program;
        }
    }

    public override _deletePipelineContext(pipelineContext: IPipelineContext): void {
        const nativePipelineContext = pipelineContext as NativePipelineContext;
        if (nativePipelineContext && nativePipelineContext.program) {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DELETEPROGRAM);
            this._commandBufferEncoder.encodeCommandArgAsNativeData(nativePipelineContext.program);
            this._commandBufferEncoder.finishEncodingCommand();
        }
    }

    public override getUniforms(pipelineContext: IPipelineContext, uniformsNames: string[]): WebGLUniformLocation[] {
        const nativePipelineContext = pipelineContext as NativePipelineContext;
        return this._engine.getUniforms(nativePipelineContext.program, uniformsNames);
    }

    public override bindUniformBlock(pipelineContext: IPipelineContext, blockName: string, index: number): void {
        // TODO
        throw new Error("Not Implemented");
    }

    public override bindSamplers(effect: Effect): void {
        const nativePipelineContext = effect.getPipelineContext() as NativePipelineContext;
        this._setProgram(nativePipelineContext.program as WebGLProgram);

        // TODO: share this with engine?
        const samplers = effect.getSamplers();
        for (let index = 0; index < samplers.length; index++) {
            const uniform = effect.getUniform(samplers[index]);

            if (uniform) {
                this._boundUniforms[index] = uniform;
            }
        }
        this._currentEffect = null;
    }

    public override getRenderWidth(useScreen = false): number {
        if (!useScreen && this._currentRenderTarget) {
            return this._currentRenderTarget.width;
        }

        return this._engine.getRenderWidth();
    }

    public override getRenderHeight(useScreen = false): number {
        if (!useScreen && this._currentRenderTarget) {
            return this._currentRenderTarget.height;
        }

        return this._engine.getRenderHeight();
    }

    public override setViewport(viewport: IViewportLike, requiredWidth?: number, requiredHeight?: number): void {
        this._cachedViewport = viewport;
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETVIEWPORT);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(viewport.x);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(viewport.y);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(viewport.width);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(viewport.height);
        this._commandBufferEncoder.finishEncodingCommand();
    }

    public override setStateCullFaceType(cullBackFaces?: boolean, force?: boolean): void {
        const cullBack = this.cullBackFaces ?? cullBackFaces ?? true;
        if (this._cachedCullBackFaces === cullBack && !force) {
            return;
        }
        this._cachedCullBackFaces = cullBack;

        // Native uses an immediate command-buffer state model (no lazy _depthCullingState), so
        // re-issue the last COMMAND_SETSTATE payload with only the cull face changed. The zOffset
        // values are the ones that command actually encoded rather than the live _zOffset fields,
        // which setZOffset()/setZOffsetUnits() can update independently (and encode with the
        // opposite sign under a reverse depth buffer).
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETSTATE);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(this._cachedCulling ? 1 : 0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(this._cachedZOffset);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(this._cachedZOffsetUnits);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(cullBack ? 1 : 0);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(this._cachedReverseSide ? 1 : 0);
        this._commandBufferEncoder.finishEncodingCommand();
    }

    public override setState(
        culling: boolean,
        zOffset: number = 0,
        force?: boolean,
        reverseSide = false,
        cullBackFaces?: boolean,
        stencil?: IStencilState,
        zOffsetUnits: number = 0
    ): void {
        this._zOffset = zOffset;
        this._zOffsetUnits = zOffsetUnits;
        if (this._zOffset !== 0) {
            Logger.Warn("zOffset is not supported in Native engine.");
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETSTATE);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(culling ? 1 : 0);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(zOffset);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(zOffsetUnits);
        this._commandBufferEncoder.encodeCommandArgAsUInt32((this.cullBackFaces ?? cullBackFaces ?? true) ? 1 : 0);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(reverseSide ? 1 : 0);
        this._commandBufferEncoder.finishEncodingCommand();

        // Cache the resolved state so setStateCullFaceType() can re-issue it with a new cull face.
        this._cachedCulling = culling;
        this._cachedReverseSide = reverseSide;
        this._cachedCullBackFaces = this.cullBackFaces ?? cullBackFaces ?? true;
        this._cachedZOffset = zOffset;
        this._cachedZOffsetUnits = zOffsetUnits;
    }

    /**
     * Gets the client rect of native canvas.  Needed for InputManager.
     * @returns a client rectangle
     */
    public override getInputElementClientRect(): Nullable<DOMRect> {
        const rect = {
            bottom: this.getRenderHeight(),
            height: this.getRenderHeight(),
            left: 0,
            right: this.getRenderWidth(),
            top: 0,
            width: this.getRenderWidth(),
            x: 0,
            y: 0,
            toJSON: () => {},
        };
        return rect;
    }

    /**
     * Set the z offset Factor to apply to current rendering
     * @param value defines the offset to apply
     */
    public override setZOffset(value: number): void {
        if (value !== this._zOffset) {
            this._zOffset = value;
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETZOFFSET);
            this._commandBufferEncoder.encodeCommandArgAsFloat32(this.useReverseDepthBuffer ? -value : value);
            this._commandBufferEncoder.finishEncodingCommand();
        }
    }

    /**
     * Gets the current value of the zOffset Factor
     * @returns the current zOffset Factor state
     */
    public override getZOffset(): number {
        return this._zOffset;
    }

    /**
     * Set the z offset Units to apply to current rendering
     * @param value defines the offset to apply
     */
    public override setZOffsetUnits(value: number): void {
        if (value !== this._zOffsetUnits) {
            this._zOffsetUnits = value;
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETZOFFSETUNITS);
            this._commandBufferEncoder.encodeCommandArgAsFloat32(this.useReverseDepthBuffer ? -value : value);
            this._commandBufferEncoder.finishEncodingCommand();
        }
    }

    /**
     * Gets the current value of the zOffset Units
     * @returns the current zOffset Units state
     */
    public override getZOffsetUnits(): number {
        return this._zOffsetUnits;
    }

    /**
     * Enable or disable depth buffering
     * @param enable defines the state to set
     */
    public override setDepthBuffer(enable: boolean): void {
        // Keep the shared depth-culling state in sync so that code paths which toggle
        // depth testing through engine.depthCullingState.depthTest (for example
        // EffectRenderer.applyEffectWrapper) are also honored on the native side. The
        // native draw path does not go through the WebGL applyStates() flush, so the
        // value is reconciled in _flushDepthTestState() right before each draw.
        this._depthCullingState.depthTest = enable;
        this._encodeDepthTest(enable);
    }

    private _encodeDepthTest(enable: boolean): void {
        this._depthTestEnabled = enable;
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETDEPTHTEST);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(enable ? this._currentDepthTest : _native.Engine.DEPTH_TEST_ALWAYS);
        this._commandBufferEncoder.finishEncodingCommand();
    }

    private _flushDepthTestState(): void {
        // Unlike the WebGL engine, the native engine does not call applyStates() before
        // a draw, so depth-test toggles made directly on engine.depthCullingState are
        // flushed here to match the cross-engine contract.
        // Reconcile the depth compare function too: features that set it directly on
        // depthCullingState (e.g. reverse depth buffer -> GEQUAL) never go through
        // setDepthFunction, so push any divergence to the native side here. setDepthFunction
        // also re-encodes the depth-test enable, so no separate enable flush is needed after.
        const targetFunc = this._depthCullingState.depthFunc;
        if (targetFunc && targetFunc !== this.getDepthFunction()) {
            this.setDepthFunction(targetFunc);
            return;
        }
        if (this._depthCullingState.depthTest !== this._depthTestEnabled) {
            this._encodeDepthTest(this._depthCullingState.depthTest);
        }
    }

    /**
     * Gets a boolean indicating if depth writing is enabled
     * @returns the current depth writing state
     */
    public override getDepthWrite(): boolean {
        return this._depthWrite;
    }

    public override getDepthFunction(): Nullable<number> {
        switch (this._currentDepthTest) {
            case _native.Engine.DEPTH_TEST_NEVER:
                return Constants.NEVER;
            case _native.Engine.DEPTH_TEST_ALWAYS:
                return Constants.ALWAYS;
            case _native.Engine.DEPTH_TEST_GREATER:
                return Constants.GREATER;
            case _native.Engine.DEPTH_TEST_GEQUAL:
                return Constants.GEQUAL;
            case _native.Engine.DEPTH_TEST_NOTEQUAL:
                return Constants.NOTEQUAL;
            case _native.Engine.DEPTH_TEST_EQUAL:
                return Constants.EQUAL;
            case _native.Engine.DEPTH_TEST_LESS:
                return Constants.LESS;
            case _native.Engine.DEPTH_TEST_LEQUAL:
                return Constants.LEQUAL;
        }
        return null;
    }

    public override setDepthFunction(depthFunc: number) {
        // Keep the shared depth-culling state in sync (the base impl sets this) so the
        // per-draw reconcile in _flushDepthTestState treats material-driven changes as a
        // no-op and only pushes divergences that bypass this method (e.g. reverse depth).
        this._depthCullingState.depthFunc = depthFunc;
        let nativeDepthFunc = 0;
        switch (depthFunc) {
            case Constants.NEVER:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_NEVER;
                break;
            case Constants.ALWAYS:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_ALWAYS;
                break;
            case Constants.GREATER:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_GREATER;
                break;
            case Constants.GEQUAL:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_GEQUAL;
                break;
            case Constants.NOTEQUAL:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_NOTEQUAL;
                break;
            case Constants.EQUAL:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_EQUAL;
                break;
            case Constants.LESS:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_LESS;
                break;
            case Constants.LEQUAL:
                nativeDepthFunc = _native.Engine.DEPTH_TEST_LEQUAL;
                break;
        }

        this._currentDepthTest = nativeDepthFunc;
        // Route through _encodeDepthTest so the tracked _depthTestEnabled state stays in
        // sync with the encoded command. Because COMMAND_SETDEPTHTEST conflates the
        // compare function and the enable bit (DEPTH_TEST_ALWAYS == disabled), encoding
        // the new function directly here would silently re-enable depth testing while
        // depth testing is logically disabled; _encodeDepthTest honors the current
        // depthCullingState.depthTest and only emits the new function when enabled.
        this._encodeDepthTest(this._depthCullingState.depthTest);
    }

    /**
     * Enable or disable depth writing
     * @param enable defines the state to set
     */
    public override setDepthWrite(enable: boolean): void {
        this._depthWrite = enable;
        // Keep depthCullingState.depthMask in sync. applyStates() reconciles native depth write
        // from depthMask; if it stays true after setDepthWrite(false), the next applyStates()
        // (e.g. during particle/material draws) silently turns WRITE_Z back on. Coplanar
        // triangle-strip particle quads then lose the second tri to DEPTH_LESS.
        if (this._depthCullingState) {
            this._depthCullingState.depthMask = enable;
        }
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETDEPTHWRITE);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(Number(enable));
        this._commandBufferEncoder.finishEncodingCommand();
    }

    /**
     * Enable or disable color writing
     * @param enable defines the state to set
     */
    public override setColorWrite(enable: boolean): void {
        this._colorWrite = enable;
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETCOLORWRITE);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(Number(enable));
        this._commandBufferEncoder.finishEncodingCommand();
    }

    /**
     * Gets a boolean indicating if color writing is enabled
     * @returns the current color writing state
     */
    public override getColorWrite(): boolean {
        return this._colorWrite;
    }

    /**
     * Apply the currently pending engine states.
     *
     * The base ThinEngine.applyStates() flushes state by calling
     * this._depthCullingState.apply(this._gl) (and similar for alpha/stencil), but the
     * native engine has no WebGL context (_gl is undefined), so inheriting that path
     * throws "Cannot read properties of undefined (reading 'depthMask')". Callers such
     * as the depth-peeling (OIT) renderer mutate engine.depthCullingState directly and
     * then call applyStates() expecting the change to be flushed, so reconcile the shared
     * depth-culling state into the native command buffer here instead. Alpha and stencil
     * states are already encoded immediately on the native side (setAlphaMode /
     * setStencil* emit commands directly), so only the depth state needs reconciling.
     */
    public override applyStates(): void {
        // Depth test (the native command conflates enable + compare function).
        this._flushDepthTestState();

        // Depth write (depthMask).
        if (this._depthCullingState.depthMask !== this._depthWrite) {
            this.setDepthWrite(this._depthCullingState.depthMask);
        }
    }

    private applyStencil(): void {
        if (!this._stencilTest) {
            return;
        }

        this._setStencil(
            this._stencilMask,
            getNativeStencilOpFail(this._stencilOpStencilFail),
            getNativeStencilDepthFail(this._stencilOpDepthFail),
            getNativeStencilDepthPass(this._stencilOpStencilDepthPass),
            getNativeStencilFunc(this._stencilFunc),
            this._stencilFuncRef,
            this._stencilFuncMask
        );
    }

    private _setStencil(mask: number, stencilOpFail: number, depthOpFail: number, depthOpPass: number, func: number, ref: number, funcMask: number = 0xff) {
        const setStencil2 = _native.Engine.COMMAND_SETSTENCIL2;
        this._commandBufferEncoder.startEncodingCommand(setStencil2 ?? _native.Engine.COMMAND_SETSTENCIL);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(mask);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(stencilOpFail);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(depthOpFail);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(depthOpPass);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(func);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(ref);
        // Stencil function mask (gl.stencilFunc mask / BGFX_STENCIL_FUNC_RMASK). Required for
        // HighlightLayer, which compares only the glowing-mesh reference bits while ignoring
        // lower reserved bits. Without this, Native always used 0xFF and the outer/inner glow
        // stencil tests matched the wrong fragments.
        if (setStencil2) {
            this._commandBufferEncoder.encodeCommandArgAsUInt32(funcMask & 0xff);
        }
        this._commandBufferEncoder.finishEncodingCommand();
    }

    /**
     * Enable or disable the stencil buffer
     * @param enable defines if the stencil buffer must be enabled or disabled
     */
    public override setStencilBuffer(enable: boolean): void {
        this._stencilTest = enable;
        if (enable) {
            this.applyStencil();
        } else {
            this._setStencil(
                255,
                _native.Engine.STENCIL_OP_FAIL_S_KEEP,
                _native.Engine.STENCIL_OP_FAIL_Z_KEEP,
                _native.Engine.STENCIL_OP_PASS_Z_KEEP,
                _native.Engine.STENCIL_TEST_ALWAYS,
                0
            );
        }
    }

    /**
     * Gets a boolean indicating if stencil buffer is enabled
     * @returns the current stencil buffer state
     */
    public override getStencilBuffer(): boolean {
        return this._stencilTest;
    }

    /**
     * Gets the current stencil operation when stencil passes
     * @returns a number defining stencil operation to use when stencil passes
     */
    public override getStencilOperationPass(): number {
        return this._stencilOpStencilDepthPass;
    }

    /**
     * Sets the stencil operation to use when stencil passes
     * @param operation defines the stencil operation to use when stencil passes
     */
    public override setStencilOperationPass(operation: number): void {
        this._stencilOpStencilDepthPass = operation;
        this.applyStencil();
    }

    /**
     * Sets the current stencil mask
     * @param mask defines the new stencil mask to use
     */
    public override setStencilMask(mask: number): void {
        this._stencilMask = mask;
        this.applyStencil();
    }

    /**
     * Sets the current stencil function
     * @param stencilFunc defines the new stencil function to use
     */
    public override setStencilFunction(stencilFunc: number) {
        this._stencilFunc = stencilFunc;
        this.applyStencil();
    }

    /**
     * Sets the current stencil reference
     * @param reference defines the new stencil reference to use
     */
    public override setStencilFunctionReference(reference: number) {
        this._stencilFuncRef = reference;
        this.applyStencil();
    }

    /**
     * Sets the current stencil function mask
     * @param mask defines the new stencil function mask to use
     */
    public override setStencilFunctionMask(mask: number) {
        this._stencilFuncMask = mask;
        this.applyStencil();
    }

    /**
     * Sets the stencil operation to use when stencil fails
     * @param operation defines the stencil operation to use when stencil fails
     */
    public override setStencilOperationFail(operation: number): void {
        this._stencilOpStencilFail = operation;
        this.applyStencil();
    }

    /**
     * Sets the stencil operation to use when depth fails
     * @param operation defines the stencil operation to use when depth fails
     */
    public override setStencilOperationDepthFail(operation: number): void {
        this._stencilOpDepthFail = operation;
        this.applyStencil();
    }

    /**
     * Gets the current stencil mask
     * @returns a number defining the new stencil mask to use
     */
    public override getStencilMask(): number {
        return this._stencilMask;
    }

    /**
     * Gets the current stencil function
     * @returns a number defining the stencil function to use
     */
    public override getStencilFunction(): number {
        return this._stencilFunc;
    }

    /**
     * Gets the current stencil reference value
     * @returns a number defining the stencil reference value to use
     */
    public override getStencilFunctionReference(): number {
        return this._stencilFuncRef;
    }

    /**
     * Gets the current stencil mask
     * @returns a number defining the stencil mask to use
     */
    public override getStencilFunctionMask(): number {
        return this._stencilFuncMask;
    }

    /**
     * Gets the current stencil operation when stencil fails
     * @returns a number defining stencil operation to use when stencil fails
     */
    public override getStencilOperationFail(): number {
        return this._stencilOpStencilFail;
    }

    /**
     * Gets the current stencil operation when depth fails
     * @returns a number defining stencil operation to use when depth fails
     */
    public override getStencilOperationDepthFail(): number {
        return this._stencilOpDepthFail;
    }

    /**
     * Sets alpha constants used by some alpha blending modes
     * @param r defines the red component
     * @param g defines the green component
     * @param b defines the blue component
     * @param a defines the alpha component
     */
    public override setAlphaConstants(r: number, g: number, b: number, a: number) {
        throw new Error("Setting alpha blend constant color not yet implemented.");
    }

    /**
     * Sets the current alpha mode
     * @param mode defines the mode to use (one of the BABYLON.Constants.ALPHA_XXX)
     * @param noDepthWriteChange defines if depth writing state should remains unchanged (false by default)
     * @param targetIndex defines the index of the target to set the alpha mode for (default is 0)
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering
     */
    public override setAlphaMode(mode: number, noDepthWriteChange: boolean = false, targetIndex = 0): void {
        if (this._alphaMode[targetIndex] === mode) {
            return;
        }

        const nativeMode = getNativeAlphaMode(mode);

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETBLENDMODE);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(nativeMode);
        this._commandBufferEncoder.finishEncodingCommand();

        if (!noDepthWriteChange) {
            this.setDepthWrite(mode === Constants.ALPHA_DISABLE);
        }

        this._alphaMode[targetIndex] = mode;
    }

    /**
     * Sets the current alpha blend equation (ADD / SUB / MAX / MIN / ...).
     * Dual depth peeling (OIT) requires ALPHA_EQUATION_MAX so peel passes accumulate
     * farthest/nearest depths. Native previously only wired blend *factors*; equations
     * stayed at bgfx's default ADD and transparent peels never wrote useful depth.
     * @param equation one of Constants.ALPHA_EQUATION_*
     * @param targetIndex MRT attachment index (Native applies equation globally; kept for API parity)
     */
    public override setAlphaEquation(equation: number, targetIndex: number = 0): void {
        if (this._alphaEquation[targetIndex] === equation) {
            return;
        }

        this._alphaEquation[targetIndex] = equation;

        const command = _native.Engine.COMMAND_SETBLENDEQUATION;
        if (!command) {
            // Older Babylon Native binaries predating blend-equation support.
            return;
        }

        this._commandBufferEncoder.startEncodingCommand(command);
        // Pass the Babylon Constants.ALPHA_EQUATION_* value; NativeEngine::SetBlendEquation maps it to bgfx.
        this._commandBufferEncoder.encodeCommandArgAsUInt32(equation);
        this._commandBufferEncoder.finishEncodingCommand();
    }

    public override setInt(uniform: WebGLUniformLocation, int: number): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETINT);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsInt32(int);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }

    public override setInt2(uniform: Nullable<WebGLUniformLocation>, x: number, y: number): boolean {
        if (!uniform) {
            return false;
        }

        const values = this._int2Scratch;
        values[0] = x;
        values[1] = y;
        return this.setIntArray2(uniform, values);
    }

    public override setInt3(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number): boolean {
        if (!uniform) {
            return false;
        }

        const values = this._int3Scratch;
        values[0] = x;
        values[1] = y;
        values[2] = z;
        return this.setIntArray3(uniform, values);
    }

    public override setInt4(uniform: Nullable<WebGLUniformLocation>, x: number, y: number, z: number, w: number): boolean {
        if (!uniform) {
            return false;
        }

        const values = this._int4Scratch;
        values[0] = x;
        values[1] = y;
        values[2] = z;
        values[3] = w;
        return this.setIntArray4(uniform, values);
    }

    public override setIntArray(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETINTARRAY);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsInt32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }

    public override setIntArray2(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETINTARRAY2);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsInt32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }

    public override setIntArray3(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETINTARRAY3);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsInt32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }

    public override setIntArray4(uniform: WebGLUniformLocation, array: Int32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETINTARRAY4);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsInt32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }

    public setFloatArray(uniform: WebGLUniformLocation, array: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOATARRAY);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsFloat32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }

    public setFloatArray2(uniform: WebGLUniformLocation, array: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOATARRAY2);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsFloat32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }

    public setFloatArray3(uniform: WebGLUniformLocation, array: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOATARRAY3);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsFloat32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }

    public setFloatArray4(uniform: WebGLUniformLocation, array: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOATARRAY4);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsFloat32s(array);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }

    public override setArray(uniform: WebGLUniformLocation, array: number[]): boolean {
        if (!uniform) {
            return false;
        }

        return this.setFloatArray(uniform, new Float32Array(array));
    }

    public override setArray2(uniform: WebGLUniformLocation, array: number[]): boolean {
        if (!uniform) {
            return false;
        }

        return this.setFloatArray2(uniform, new Float32Array(array));
    }

    public override setArray3(uniform: WebGLUniformLocation, array: number[]): boolean {
        if (!uniform) {
            return false;
        }

        return this.setFloatArray3(uniform, new Float32Array(array));
    }

    public override setArray4(uniform: WebGLUniformLocation, array: number[]): boolean {
        if (!uniform) {
            return false;
        }

        return this.setFloatArray4(uniform, new Float32Array(array));
    }

    public override setMatrices(uniform: WebGLUniformLocation, matrices: DeepImmutable<FloatArray>): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETMATRICES);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsFloat32s(matrices);
        this._commandBufferEncoder.finishEncodingCommand();

        return true;
    }

    public override setMatrix3x3(uniform: WebGLUniformLocation, matrix: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETMATRIX3X3);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsFloat32s(matrix);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }

    public override setMatrix2x2(uniform: WebGLUniformLocation, matrix: Float32Array): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETMATRIX2X2);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsFloat32s(matrix);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }

    public override setFloat(uniform: WebGLUniformLocation, value: number): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOAT);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(value);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }

    public override setFloat2(uniform: WebGLUniformLocation, x: number, y: number): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOAT2);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(x);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(y);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }

    public override setFloat3(uniform: WebGLUniformLocation, x: number, y: number, z: number): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOAT3);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(x);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(y);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(z);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }

    public override setFloat4(uniform: WebGLUniformLocation, x: number, y: number, z: number, w: number): boolean {
        if (!uniform) {
            return false;
        }

        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETFLOAT4);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform as any as NativeData);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(x);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(y);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(z);
        this._commandBufferEncoder.encodeCommandArgAsFloat32(w);
        this._commandBufferEncoder.finishEncodingCommand();
        return true;
    }

    public setColor3(uniform: WebGLUniformLocation, color3: IColor3Like): boolean {
        if (!uniform) {
            return false;
        }

        this.setFloat3(uniform, color3.r, color3.g, color3.b);
        return true;
    }

    public setColor4(uniform: WebGLUniformLocation, color3: IColor3Like, alpha: number): boolean {
        if (!uniform) {
            return false;
        }

        this.setFloat4(uniform, color3.r, color3.g, color3.b, alpha);
        return true;
    }

    public override wipeCaches(bruteForce?: boolean): void {
        if (this.preventCacheWipeBetweenFrames) {
            return;
        }
        this.resetTextureCache();
        this._currentEffect = null;

        if (bruteForce) {
            this._currentProgram = null;

            this._stencilStateComposer.reset();
            this._depthCullingState.reset();
            this._alphaState.reset();
        }

        this._cachedVertexBuffers = null;
        this._cachedIndexBuffer = null;
        this._cachedEffectForVertexBuffers = null;
    }

    protected override _createTexture(): WebGLTexture {
        return this._engine.createTexture();
    }

    protected override _deleteTexture(texture: Nullable<WebGLHardwareTexture>): void {
        if (texture) {
            this._engine.deleteTexture(texture.underlyingResource as NativeTexture);
        }
    }

    /**
     * Update the content of a dynamic texture
     * @param texture defines the texture to update
     * @param canvas defines the canvas containing the source
     * @param invertY defines if data must be stored with Y axis inverted
     * @param premulAlpha defines if alpha is stored as premultiplied
     * @param format defines the format of the data
     */
    public override updateDynamicTexture(texture: Nullable<InternalTexture>, canvas: any, invertY: boolean, premulAlpha: boolean = false, format?: number): void {
        if (!!texture && !!texture._hardwareTexture) {
            const destination = texture._hardwareTexture.underlyingResource;
            const context = canvas.getContext();
            // flush need to happen before getCanvasTexture: flush will create the render target synchronously (if it's not been created before)
            context.flush();
            const source = canvas.getCanvasTexture(premulAlpha, texture.generateMipMaps);
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_COPYTEXTURE);
            this._commandBufferEncoder.encodeCommandArgAsNativeData(source as NativeData);
            this._commandBufferEncoder.encodeCommandArgAsNativeData(destination as NativeData);
            this._commandBufferEncoder.finishEncodingCommand();
            texture._premulAlpha = premulAlpha;
            texture.isReady = true;
        }
    }

    public override createDynamicTexture(width: number, height: number, generateMipMaps: boolean, samplingMode: number): InternalTexture {
        // Canvas dimensions are integral in browsers. Coerce before allocating so the native dimensions and byte length agree.
        // Keep at least 1x1 because many bgfx methods assume a non-zero texture size.
        width = Math.max(Math.floor(width), 1);
        height = Math.max(Math.floor(height), 1);
        // Older runtimes cannot regenerate mips when the canvas contents are copied into the texture.
        generateMipMaps = generateMipMaps && this._engine.supportsDynamicTextureMipMaps === true;
        return this.createRawTexture(new Uint8Array(width * height * 4), width, height, Constants.TEXTUREFORMAT_RGBA, generateMipMaps, false, samplingMode);
    }

    public override createVideoElement(constraints: MediaTrackConstraints): any {
        // create native object depending on stream. Only NativeCamera is supported for now.
        if (this._camera) {
            return this._camera.createVideo(constraints);
        }
        return null;
    }

    public override updateVideoTexture(texture: Nullable<InternalTexture>, video: HTMLVideoElement, invertY: boolean): void {
        if (texture && texture._hardwareTexture && this._camera) {
            const webGLTexture = texture._hardwareTexture.underlyingResource;
            this._camera.updateVideoTexture(webGLTexture, video, invertY);
        }
    }

    public override createRawTexture(
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        format: number,
        generateMipMaps: boolean,
        invertY: boolean,
        samplingMode: number,
        compression: Nullable<string> = null,
        type: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
        creationFlags: number = 0,
        useSRGBBuffer: boolean = false
    ): InternalTexture {
        const texture = new InternalTexture(this, InternalTextureSource.Raw);

        texture.format = format;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.invertY = invertY;
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = texture.baseWidth;
        texture.height = texture.baseHeight;
        texture._compression = compression;
        texture.type = type;
        texture._useSRGBBuffer = this._getUseSRGBBuffer(useSRGBBuffer, !generateMipMaps);

        this.updateRawTexture(texture, data, format, invertY, compression, type, texture._useSRGBBuffer);

        if (texture._hardwareTexture) {
            const webGLTexture = texture._hardwareTexture.underlyingResource;
            const filter = getNativeSamplingMode(samplingMode);
            this._setTextureSampling(webGLTexture, filter);
        }

        this._internalTexturesCache.push(texture);
        return texture;
    }

    public override createRawTexture2DArray(
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        depth: number,
        format: number,
        generateMipMaps: boolean,
        invertY: boolean,
        samplingMode: number,
        compression: Nullable<string> = null,
        textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE
    ): InternalTexture {
        const texture = new InternalTexture(this, InternalTextureSource.Raw2DArray);

        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.baseDepth = depth;
        texture.width = width;
        texture.height = height;
        texture.depth = depth;
        texture.format = format;
        texture.type = textureType;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.is2DArray = true;

        if (texture._hardwareTexture) {
            const nativeTexture = texture._hardwareTexture.underlyingResource;
            this._engine.loadRawTexture2DArray(nativeTexture, data, width, height, depth, getNativeTextureFormat(format, textureType), generateMipMaps, invertY);

            const filter = getNativeSamplingMode(samplingMode);
            this._setTextureSampling(nativeTexture, filter);
        }

        texture.isReady = true;

        this._internalTexturesCache.push(texture);
        return texture;
    }

    public override createRawTexture3D(
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        depth: number,
        format: number,
        generateMipMaps: boolean,
        invertY: boolean,
        samplingMode: number,
        compression: Nullable<string> = null,
        textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE
    ): InternalTexture {
        if (compression) {
            throw new Error(`NativeEngine.createRawTexture3D: compressed raw volume uploads are not supported (${compression}).`);
        }

        const texture = new InternalTexture(this, InternalTextureSource.Raw3D);

        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.baseDepth = depth;
        texture.width = width;
        texture.height = height;
        texture.depth = depth;
        texture.format = format;
        texture.type = textureType;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.is3D = true;
        texture.invertY = invertY;
        texture._compression = compression;
        if (!this._doNotHandleContextLost) {
            texture._bufferView = data;
        }

        if (texture._hardwareTexture) {
            const nativeTexture = texture._hardwareTexture.underlyingResource;
            this._engine.loadRawTexture3D(nativeTexture, data, width, height, depth, getNativeTextureFormat(format, textureType), generateMipMaps, invertY);

            const filter = getNativeSamplingMode(samplingMode);
            this._setTextureSampling(nativeTexture, filter);
        }

        texture.isReady = true;

        this._internalTexturesCache.push(texture);
        return texture;
    }

    public override updateRawTexture3D(
        texture: Nullable<InternalTexture>,
        bufferView: Nullable<ArrayBufferView>,
        format: number,
        invertY: boolean,
        compression: Nullable<string> = null,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_BYTE
    ): void {
        if (!texture) {
            return;
        }

        if (compression) {
            throw new Error(`NativeEngine.updateRawTexture3D: compressed raw volume uploads are not supported (${compression}).`);
        }

        texture.format = format;
        texture.type = textureType;
        texture.invertY = invertY;
        texture._compression = compression;
        if (!this._doNotHandleContextLost) {
            texture._bufferView = bufferView;
        }

        if (bufferView && texture._hardwareTexture) {
            const nativeTexture = texture._hardwareTexture.underlyingResource;
            this._engine.loadRawTexture3D(
                nativeTexture,
                bufferView,
                texture.width,
                texture.height,
                texture.depth,
                getNativeTextureFormat(format, textureType),
                texture.generateMipMaps,
                invertY
            );
        }

        texture.isReady = true;
    }

    public override updateRawTexture(
        texture: Nullable<InternalTexture>,
        bufferView: Nullable<ArrayBufferView>,
        format: number,
        invertY: boolean,
        compression: Nullable<string> = null,
        type: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
        useSRGBBuffer: boolean = false
    ): void {
        if (!texture) {
            return;
        }

        if (bufferView && texture._hardwareTexture) {
            const underlyingResource = texture._hardwareTexture.underlyingResource;
            this._engine.loadRawTexture(
                underlyingResource,
                bufferView,
                texture.width,
                texture.height,
                getNativeTextureFormat(format, type),
                texture.generateMipMaps,
                texture.invertY,
                useSRGBBuffer
            );
        }

        texture.isReady = true;
    }

    /**
     * Creates a raw cube texture on the native engine.
     *
     * The WebGL implementation (engine.rawTexture) drives the whole upload through `this._gl`, which is null
     * on Native, so loading an HDR/`.env` cube via `createRawCubeTextureFromUrl` used to throw
     * `Cannot read properties of undefined (reading 'FLOAT')`. This override allocates a native cube texture
     * and uploads its faces through the bgfx `updateTextureData` path instead.
     *
     * Native has no 3-component float texture format, so an RGB float/half-float source (what HDRCubeTexture
     * requests) is allocated and uploaded as RGBA; the per-face RGB->RGBA expansion happens in
     * `updateRawCubeTexture`.
     * @param data defines the data used to create the texture (6 faces, +X +Y +Z -X -Y -Z) or null
     * @param size defines the size of the textures (each face is size x size)
     * @param format defines the format of the data
     * @param type defines the type of the data
     * @param generateMipMaps defines if the engine should generate the mip levels
     * @param invertY defines if data must be stored with Y axis inverted
     * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
     * @param compression defines the compression used (null by default)
     * @returns the cube texture as an InternalTexture
     */
    public override createRawCubeTexture(
        data: Nullable<ArrayBufferView[]>,
        size: number,
        format: number,
        type: number,
        generateMipMaps: boolean,
        invertY: boolean,
        samplingMode: number,
        compression: Nullable<string> = null
    ): InternalTexture {
        if (compression) {
            throw new Error(`NativeEngine.createRawCubeTexture: compressed raw cube uploads are not supported (${compression}).`);
        }

        const texture = new InternalTexture(this, InternalTextureSource.CubeRaw);
        texture.isCube = true;
        texture.format = format;
        texture.type = type;
        texture.width = size;
        texture.height = size;
        texture.baseWidth = size;
        texture.baseHeight = size;
        texture.invertY = invertY;
        texture._compression = compression;

        // Match the WebGL raw-cube path and createRenderTargetCubeTexture: float/half-float formats that the
        // platform cannot linearly filter fall back to NEAREST and drop mip generation.
        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
            generateMipMaps = false;
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        } else if (type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
            generateMipMaps = false;
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }

        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;

        const nativeTexture = texture._hardwareTexture!.underlyingResource;
        this._engine.initializeTexture(
            nativeTexture,
            size,
            size,
            generateMipMaps,
            getNativeTextureFormat(format, type),
            /*renderTarget*/ false,
            /*srgb*/ false,
            /*samples*/ 1,
            /*isCube*/ true
        );
        this._setTextureSampling(nativeTexture, getNativeSamplingMode(samplingMode));

        if (data) {
            this.updateRawCubeTexture(texture, data, format, type, invertY, compression);
        } else {
            texture.isReady = true;
        }

        // Like WebGL, the cache registration is owned by the caller (e.g. createRawCubeTextureFromUrl).
        return texture;
    }

    /**
     * Updates a raw cube texture on the native engine.
     * @param texture defines the texture to update
     * @param data defines the data to store (6 faces, +X +Y +Z -X -Y -Z)
     * @param format defines the data format
     * @param type defines the type of the data
     * @param invertY defines if data must be stored with Y axis inverted
     * @param compression defines the compression used (null by default)
     * @param level defines which mip level of the texture to update (0 by default)
     */
    public override updateRawCubeTexture(
        texture: InternalTexture,
        data: ArrayBufferView[],
        format: number,
        type: number,
        invertY: boolean,
        compression: Nullable<string> = null,
        level: number = 0
    ): void {
        if (compression) {
            throw new Error(`NativeEngine.updateRawCubeTexture: compressed raw cube uploads are not supported (${compression}).`);
        }

        const descriptorChanged = texture.format !== format || texture.type !== type;
        if (descriptorChanged && level !== 0) {
            throw new Error("NativeEngine.updateRawCubeTexture: changing the format or type is only supported when updating level 0.");
        }

        const nativeTexture = texture._hardwareTexture?.underlyingResource;
        const nativeTextureFormat = descriptorChanged ? getNativeTextureFormat(format, type) : undefined;
        if (descriptorChanged && nativeTexture) {
            this._engine.initializeTexture(
                nativeTexture,
                texture.width,
                texture.height,
                texture.generateMipMaps,
                nativeTextureFormat!,
                /*renderTarget*/ false,
                texture._useSRGBBuffer,
                /*samples*/ 1,
                /*isCube*/ true
            );
            this._setTextureSampling(nativeTexture, getNativeSamplingMode(texture.samplingMode));
        }

        // NativeEngine.updateTextureData honors invertY directly on cubes (no D3D origin
        // compensation). That matches WebGL: HDRCubeTexture uploads with invertY=false and
        // UNPACK_FLIP_Y_WEBGL=false. Forcing invertY here double-flipped float/half faces and
        // made the -Y cubemap a hard brown cap on OpenPBR IBL (513/514). Byte RGBD .env
        // uploads already pass invertY=true and are unchanged.
        texture.format = format;
        texture.type = type;
        texture.invertY = invertY;
        texture._compression = compression;
        if (level === 0 && !this._doNotHandleContextLost) {
            texture._bufferViewArray = data;
        }

        // Data are in +X +Y +Z -X -Y -Z order, which matches the bgfx cube sides. Like gl.generateMipmap in the
        // WebGL path, Native rebuilds the rest of each face's mip chain from a full level 0 upload.
        const width = Math.max(1, texture.width >> level);
        const height = Math.max(1, texture.height >> level);
        const generateMipMaps = level === 0 && texture.generateMipMaps;
        for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
            this.updateTextureData(texture, data[faceIndex], 0, 0, width, height, faceIndex, level, generateMipMaps);
        }
        texture.isReady = true;
    }

    // TODO: Refactor to share more logic with babylon.engine.ts version.
    /**
     * Usually called from Texture.ts.
     * Passed information to create a NativeTexture
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
    public override createTexture(
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
        useSRGBBuffer = false
    ): InternalTexture {
        url = url || "";
        const fromData = url.substring(0, 5) === "data:";
        //const fromBlob = url.substring(0, 5) === "blob:";
        const isBase64 = fromData && url.indexOf(";base64,") !== -1;

        const texture = fallback ? fallback : new InternalTexture(this, InternalTextureSource.Url);

        const originalUrl = url;
        if (this._transformTextureUrl && !isBase64 && !fallback && !buffer) {
            url = this._transformTextureUrl(url);
        }

        // establish the file extension, if possible
        const lastDot = url.lastIndexOf(".");
        const extension = forcedExtension ? forcedExtension : lastDot > -1 ? url.substring(lastDot).toLowerCase() : "";

        // some formats are already supported by bimg, no need to try to load them with JS
        // leaving TextureLoader extension check for future use
        let loaderPromise: Nullable<Promise<IInternalTextureLoader>> = null;
        if (extension.endsWith(".ies")) {
            // The UMD/global build (used by Babylon Native) stubs dynamic import(), so
            // AbstractEngine.GetCompatibleTextureLoader cannot resolve the loader module. Instantiate the
            // statically-bundled IES loader directly instead.
            loaderPromise = Promise.resolve(new _IESTextureLoader());
        } else if (extension.endsWith(".basis") || extension.endsWith(".ktx") || extension.endsWith(".ktx2") || mimeType === "image/ktx" || mimeType === "image/ktx2") {
            loaderPromise = AbstractEngine.GetCompatibleTextureLoader(extension, mimeType);
        }

        if (scene) {
            scene.addPendingData(texture);
        }
        texture.url = url;
        texture.generateMipMaps = !noMipmap;
        texture.samplingMode = samplingMode;
        texture.invertY = invertY;
        texture._useSRGBBuffer = this._getUseSRGBBuffer(useSRGBBuffer, noMipmap);

        if (!this.doNotHandleContextLost) {
            // Keep a link to the buffer only if we plan to handle context lost
            texture._buffer = buffer;
        }

        let onLoadObserver: Nullable<Observer<InternalTexture>> = null;
        if (onLoad && !fallback) {
            onLoadObserver = texture.onLoadedObservable.add(onLoad);
        }

        if (!fallback) {
            this._internalTexturesCache.push(texture);
        }

        const onInternalError = (message?: string, exception?: any) => {
            texture.isReady = false;

            if (scene) {
                scene.removePendingData(texture);
            }

            if (url === originalUrl) {
                if (onLoadObserver) {
                    texture.onLoadedObservable.remove(onLoadObserver);
                }

                if (EngineStore.UseFallbackTexture) {
                    this.createTexture(EngineStore.FallbackTexture, noMipmap, texture.invertY, scene, samplingMode, null, onError, buffer, texture);
                }

                const errorMessage = (message || "Unknown error") + (EngineStore.UseFallbackTexture ? " - Fallback texture was used" : "");
                texture._setError(errorMessage, exception);
                if (onError) {
                    onError(errorMessage, exception);
                }
            } else {
                // fall back to the original url if the transformed url fails to load
                Logger.Warn(`Failed to load ${url}, falling back to ${originalUrl}`);
                this.createTexture(originalUrl, noMipmap, texture.invertY, scene, samplingMode, onLoad, onError, buffer, texture, format, forcedExtension, mimeType, loaderOptions);
            }
        };

        // processing for non-image formats
        if (loaderPromise) {
            // These formats (e.g. .ies) are decoded on the JS side by an IInternalTextureLoader and then
            // uploaded to the native texture as raw pixel data. bimg cannot decode them directly.
            const texLoaderPromise = loaderPromise;
            const callbackAsync = async (data: ArrayBufferView) => {
                const loader = await texLoaderPromise;
                loader.loadData(
                    data,
                    texture,
                    (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void, loadFailed?: boolean) => {
                        if (loadFailed) {
                            onInternalError("TextureLoader failed to load data");
                            return;
                        }

                        const baseWidth = texture.baseWidth || width;
                        const baseHeight = texture.baseHeight || height;
                        texture.baseWidth = baseWidth;
                        texture.baseHeight = baseHeight;
                        texture.width = baseWidth;
                        texture.height = baseHeight;

                        // The loader-supplied done() performs the actual GPU upload (e.g. via
                        // _uploadDataToTextureDirectly), so texture dimensions must be set beforehand.
                        try {
                            done();
                        } finally {
                            // Some loaders temporarily publish each mip's dimensions through width/height.
                            // Restore the level-zero dimensions even when a later mip upload fails.
                            texture.baseWidth = baseWidth;
                            texture.baseHeight = baseHeight;
                            texture.width = baseWidth;
                            texture.height = baseHeight;
                        }

                        if (texture._hardwareTexture) {
                            const filter = getNativeSamplingMode(samplingMode);
                            this._setTextureSampling(texture._hardwareTexture.underlyingResource, filter);
                        }

                        texture.isReady = true;

                        if (scene) {
                            scene.removePendingData(texture);
                        }

                        texture.onLoadedObservable.notifyObservers(texture);
                        texture.onLoadedObservable.clear();
                    },
                    loaderOptions
                );
            };

            if (buffer) {
                const processBufferAsync = async (data: ArrayBufferView) => {
                    try {
                        await callbackAsync(data);
                    } catch (reason) {
                        onInternalError("Failed to parse texture data", reason);
                    }
                };
                if (buffer instanceof ArrayBuffer) {
                    void processBufferAsync(new Uint8Array(buffer));
                } else if (ArrayBuffer.isView(buffer)) {
                    void processBufferAsync(buffer);
                } else {
                    onInternalError("Unable to load: only ArrayBuffer or ArrayBufferView is supported");
                }
            } else {
                this._loadFile(
                    url,
                    async (data) => {
                        try {
                            await callbackAsync(new Uint8Array(data as ArrayBuffer));
                        } catch (reason) {
                            onInternalError("Failed to parse texture data", reason);
                        }
                    },
                    undefined,
                    undefined,
                    true,
                    (request?: IWebRequest, exception?: any) => {
                        onInternalError("Unable to load " + (request ? request.responseURL : url), exception);
                    }
                );
            }
        } else {
            const onload = (data: ArrayBufferView) => {
                if (!texture._hardwareTexture) {
                    if (scene) {
                        scene.removePendingData(texture);
                    }

                    return;
                }

                const underlyingResource = texture._hardwareTexture.underlyingResource;

                this._engine.loadTexture(
                    underlyingResource,
                    data,
                    !noMipmap,
                    invertY,
                    texture._useSRGBBuffer,
                    () => {
                        texture.baseWidth = this._engine.getTextureWidth(underlyingResource);
                        texture.baseHeight = this._engine.getTextureHeight(underlyingResource);
                        texture.width = texture.baseWidth;
                        texture.height = texture.baseHeight;
                        texture.isReady = true;

                        const filter = getNativeSamplingMode(samplingMode);
                        this._setTextureSampling(underlyingResource, filter);

                        if (scene) {
                            scene.removePendingData(texture);
                        }

                        texture.onLoadedObservable.notifyObservers(texture);
                        texture.onLoadedObservable.clear();
                    },
                    () => {
                        throw new Error("Could not load a native texture.");
                    }
                );
            };

            if (fromData && buffer) {
                if (buffer instanceof ArrayBuffer) {
                    onload(new Uint8Array(buffer));
                } else if (ArrayBuffer.isView(buffer)) {
                    onload(buffer);
                } else if (typeof buffer === "string") {
                    onload(new Uint8Array(DecodeBase64UrlToBinary(buffer)));
                } else {
                    throw new Error("Unsupported buffer type");
                }
            } else {
                if (isBase64) {
                    onload(new Uint8Array(DecodeBase64UrlToBinary(url)));
                } else {
                    this._loadFile(
                        url,
                        (data) => onload(new Uint8Array(data as ArrayBuffer)),
                        undefined,
                        undefined,
                        true,
                        (request?: IWebRequest, exception?: any) => {
                            onInternalError("Unable to load " + (request ? request.responseURL : url, exception));
                        }
                    );
                }
            }
        }

        return texture;
    }

    /**
     * Wraps an external native texture in a Babylon texture.
     * @param texture defines the external texture
     * @param hasMipMaps defines whether the external texture has mip maps
     * @param samplingMode defines the sampling mode for the external texture (default: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE)
     * @returns the babylon internal texture
     */
    public wrapNativeTexture(texture: NativeTexture, hasMipMaps: boolean = false, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE): InternalTexture {
        const hardwareTexture = new NativeHardwareTexture(texture, this._engine);
        const internalTexture = new InternalTexture(this, InternalTextureSource.External, true);
        internalTexture._hardwareTexture = hardwareTexture;
        internalTexture.baseWidth = this._engine.getTextureWidth(texture);
        internalTexture.baseHeight = this._engine.getTextureHeight(texture);
        internalTexture.width = internalTexture.baseWidth;
        internalTexture.height = internalTexture.baseHeight;
        if (this._engine.getTextureLayerCount) {
            const layerCount = this._engine.getTextureLayerCount(texture);
            if (layerCount > 1) {
                internalTexture.is2DArray = true;
                internalTexture.baseDepth = internalTexture.depth = layerCount;
            }
        }
        internalTexture.isReady = true;
        internalTexture.useMipMaps = hasMipMaps;
        this.updateTextureSamplingMode(samplingMode, internalTexture);
        return internalTexture;
    }

    /**
     * Replaces the underlying native texture handle of a texture previously created via {@link wrapNativeTexture},
     * preserving the InternalTexture identity.
     *
     * Intended for the device-loss / device-restored flow (a DisableRendering / EnableRendering cycle from the host
     * application): when the host recreates its external resource on the new graphics device, it calls this method to
     * repoint Babylon's wrapper at the new handle without losing references held by materials, render-target wrappers,
     * particle systems, etc.
     *
     * The new handle must match the wrapped texture's recorded dimensions. To change dimensions, dispose the wrapped
     * texture and call {@link wrapNativeTexture} again. Sampling mode and mip-map flag are properties of the logical
     * wrapped texture and are re-applied to the new resource. Any render-target wrapper holding this texture as its
     * color attachment has its framebuffer rebuilt with the new handle.
     *
     * Throws if the target was not produced by {@link wrapNativeTexture}, if the new handle's dimensions don't match,
     * if the wrapped texture is part of a multi render-target, or if the wrapper has a depth/stencil texture (these
     * are not supported in this version; dispose and re-wrap).
     * @param internalTexture defines the wrapped InternalTexture to repoint
     * @param texture defines the new native texture handle to wrap
     */
    public updateWrappedNativeTexture(internalTexture: InternalTexture, texture: NativeTexture): void {
        if (internalTexture.source !== InternalTextureSource.External) {
            throw new Error("updateWrappedNativeTexture: target InternalTexture was not produced by wrapNativeTexture.");
        }

        const newWidth = this._engine.getTextureWidth(texture);
        const newHeight = this._engine.getTextureHeight(texture);
        if (newWidth !== internalTexture.baseWidth || newHeight !== internalTexture.baseHeight) {
            throw new Error(
                `updateWrappedNativeTexture: new handle dimensions (${newWidth}x${newHeight}) must match the wrapped texture's dimensions (${internalTexture.baseWidth}x${internalTexture.baseHeight}).`
            );
        }
        if (this._engine.getTextureLayerCount) {
            const newLayerCount = this._engine.getTextureLayerCount(texture);
            const oldLayerCount = internalTexture.is2DArray ? internalTexture.depth : 1;
            if (newLayerCount !== oldLayerCount) {
                throw new Error(`updateWrappedNativeTexture: new handle layer count (${newLayerCount}) must match the wrapped texture's layer count (${oldLayerCount}).`);
            }
        }

        // Pre-validate before mutating any state so a thrown precondition leaves the InternalTexture untouched.
        // Note: rtWrapper.texture only returns _textures[0]; walk every attachment to catch the multi-RT case where
        // the wrapped texture is at index > 0.
        for (const rtWrapper of this._renderTargetWrapperCache) {
            if (!rtWrapper.textures?.includes(internalTexture)) {
                continue;
            }
            if (rtWrapper.isMulti) {
                throw new Error("updateWrappedNativeTexture: wrapped texture is part of a multi render-target; not supported. Dispose and re-wrap.");
            }
            if (rtWrapper._depthStencilTexture) {
                // After a DisableRendering / EnableRendering cycle the bgfx framebuffer + the depth/stencil texture's
                // bgfx handle are both stale. Rebuilding the depth/stencil texture from the wrapper's stored settings
                // is feasible but non-trivial; v1 rejects and asks the caller to dispose + re-wrap.
                throw new Error("updateWrappedNativeTexture: wrapped texture's render-target wrapper has a depth/stencil texture; not supported. Dispose and re-wrap.");
            }
        }

        internalTexture._hardwareTexture = new NativeHardwareTexture(texture, this._engine);
        internalTexture.isReady = true;
        this.updateTextureSamplingMode(internalTexture.samplingMode, internalTexture);

        // Rebuild the framebuffer of any render-target wrapper holding this wrapped texture as its color attachment.
        // After a DisableRendering / EnableRendering cycle the bgfx framebuffer handle is stale; the consumer-supplied
        // new texture is the moment we have a fresh handle to rebuild against.
        for (const rtWrapper of this._renderTargetWrapperCache) {
            if (rtWrapper.texture !== internalTexture) {
                continue;
            }
            const nativeRTWrapper = rtWrapper as NativeRenderTargetWrapper;
            if (nativeRTWrapper._framebuffers && !rtWrapper.isCube) {
                // Wrapped 2D-array color attachment with one framebuffer per layer: rebuild every layer
                // against the new handle. The _framebuffers setter releases the stale handles.
                const { generateDepth, generateStencil } = this._getLayerFramebufferDepthStencil(rtWrapper);
                nativeRTWrapper._framebuffers = this._createLayerFramebuffers(
                    texture,
                    rtWrapper.width,
                    rtWrapper.height,
                    nativeRTWrapper._framebuffers.length,
                    generateStencil,
                    generateDepth,
                    rtWrapper.samples ?? 1,
                    rtWrapper.texture?.generateMipMaps
                );
                continue;
            }
            // NativeRenderTargetWrapper._framebuffer setter releases the old framebuffer before assigning,
            // so no manual _releaseFramebufferObjects call is needed (and would double-delete the handle).
            nativeRTWrapper._framebuffer = this._engine.createFrameBuffer(
                texture,
                rtWrapper.width,
                rtWrapper.height,
                rtWrapper._generateStencilBuffer,
                rtWrapper._generateDepthBuffer,
                rtWrapper.samples ?? 1
            );
        }
    }

    /**
     * Creates a depth/stencil texture for a render target wrapper.
     * @param size The size of the depth texture
     * @param options The options defining the depth texture
     * @param rtWrapper The render target wrapper the depth texture belongs to
     * @returns The depth/stencil texture
     */
    public override createDepthStencilTexture(size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture {
        // AbstractEngine routes cube render targets (point-light shadow maps) to _createDepthStencilCubeTexture,
        // which only exists on the WebGL engine and drives gl.TEXTURE_CUBE_MAP directly. Native already handles
        // cube and 2D-array targets in _createDepthStencilTexture through the wrapper's per-face framebuffers,
        // so route every request there instead of throwing on an undefined GL context.
        return this._createDepthStencilTexture(size, options, rtWrapper);
    }

    public override _createDepthStencilTexture(size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture {
        // TODO: handle other options?
        const requestedFormat = options.depthTextureFormat;
        // Native allocates either D32F (depth only) or D24S8 (depth + stencil). Requested depth formats map onto
        // whichever of those matches their stencil aspect, and texture.format records what was actually allocated.
        const requestedStencil =
            requestedFormat === Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 ||
            requestedFormat === Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 ||
            requestedFormat === Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8;
        if (
            requestedFormat !== undefined &&
            !requestedStencil &&
            requestedFormat !== Constants.TEXTUREFORMAT_DEPTH16 &&
            requestedFormat !== Constants.TEXTUREFORMAT_DEPTH24 &&
            requestedFormat !== Constants.TEXTUREFORMAT_DEPTH32_FLOAT
        ) {
            throw new Error(`NativeEngine: depth texture format ${requestedFormat} is not supported.`);
        }

        const generateStencil = !!options.generateStencil || requestedStencil;
        const samples = options.samples || 1;

        const nativeRTWrapper = rtWrapper as NativeRenderTargetWrapper;
        this._assertDepthAttachmentCompatible(nativeRTWrapper, samples);
        const texture = new InternalTexture(this, InternalTextureSource.DepthStencil);

        const width = (<{ width: number; height: number; layers?: number }>size).width ?? <number>size;
        const height = (<{ width: number; height: number; layers?: number }>size).height ?? <number>size;
        const layers = (<{ width: number; height: number; depth?: number; layers?: number }>size).layers || 0;
        const depth = (<{ width: number; height: number; depth?: number; layers?: number }>size).depth || 0;

        // Populate the standard depth/stencil texture metadata, mirroring ThinEngine._setupDepthStencilTexture.
        // In particular `samples` must be set so consumers such as the FrameGraph texture manager report the
        // correct sample count; leaving it at the InternalTexture default (0) breaks FrameGraph MSAA
        // depth/output sample-count validation. `is2DArray`/`depth` matter for the texture-array depth targets
        // used by cascaded shadow maps.
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.is2DArray = layers > 0;
        texture.isCube = !!options.isCube;
        texture.depth = layers || depth;
        texture.isReady = true;
        texture.samples = samples;
        texture.generateMipMaps = false;
        texture.samplingMode = options.bilinearFiltering ? Constants.TEXTURE_BILINEAR_SAMPLINGMODE : Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        texture.type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        texture.format = generateStencil ? Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 : Constants.TEXTUREFORMAT_DEPTH32_FLOAT;
        texture._comparisonFunction = options.comparisonFunction ?? 0;
        nativeRTWrapper._depthStencilTextureWithStencil = generateStencil;

        this._attachDepthStencilTexture(nativeRTWrapper, texture, width, height, generateStencil, samples);
        return texture;
    }

    /**
     * Builds the framebuffer(s) of a render target so they carry its sampleable depth/stencil texture. The depth
     * texture's native handle must not be allocated yet: the first framebuffer creation allocates it.
     * @internal
     */
    public _attachDepthStencilTexture(
        nativeRTWrapper: NativeRenderTargetWrapper,
        texture: InternalTexture,
        width: number,
        height: number,
        generateStencil: boolean,
        samples: number
    ): void {
        if (nativeRTWrapper.is3D) {
            this._assertVolumeDepthAttachmentSupported(texture.samples, samples);
            // Volume slices bind lazily built framebuffers; drop cached slices so the next bind attaches the new depth.
            nativeRTWrapper._releaseLayerFramebuffers();
            return;
        }

        if (nativeRTWrapper._framebuffers) {
            // Layered (2D array) or cube render target: the color framebuffers were created one-per-layer
            // (see createRenderTargetTexture / createRenderTargetCubeTexture). When the color RTT was built
            // without a depth buffer (e.g. cascaded shadow maps create the RTT with generateDepthBuffer=false
            // and then call createDepthStencilTexture), rebuild each per-layer framebuffer so it carries a
            // *shared sampleable* depth/stencil array attachment. PCF binds the whole array as
            // sampler2DArrayShadow; each cascade layer framebuffer writes into its own depth slice.
            // A single shared _framebufferDepthStencil would be ignored because bindFramebuffer selects
            // _framebuffers[layer] first.
            const colorTexture = nativeRTWrapper.texture;
            if (colorTexture && colorTexture._hardwareTexture) {
                const nativeColor = colorTexture._hardwareTexture.underlyingResource;
                const nativeDepth = texture._hardwareTexture!.underlyingResource;
                const layerCount = nativeRTWrapper._framebuffers.length;
                const framebuffers: NativeFramebuffer[] = [];
                for (let layer = 0; layer < layerCount; layer++) {
                    // First call creates the multi-layer sampleable depth and aliases it into nativeDepth;
                    // subsequent calls borrow the same depth array and attach the matching layer.
                    framebuffers.push(this._createNativeMultiFrameBuffer([nativeColor], width, height, generateStencil, true, samples, [layer], nativeDepth));
                }
                // The _framebuffers setter releases the previous handles.
                nativeRTWrapper._framebuffers = framebuffers;
                this._setTextureSampling(nativeDepth, getNativeSamplingMode(texture.samplingMode));
                this.updateTextureComparisonFunction(texture, texture._comparisonFunction);
            }
            return;
        }

        // Plain 2D render target: build a framebuffer that carries BOTH the render target's color attachment
        // and the standalone depth/stencil texture. bindFramebuffer prefers _framebufferDepthStencil over
        // _framebuffer, so attaching depth alone would silently drop the color target -- shadow maps would
        // render their packed depth into nothing. The depth texture's bgfx handle is still invalid at this
        // point, which is how CreateFrameBufferImpl recognizes a request for a readable depth attachment that
        // it aliases back into the supplied texture so it can be sampled afterwards.
        const colorResources: NativeTexture[] = [];
        for (const colorTexture of nativeRTWrapper.textures ?? []) {
            const colorResource = colorTexture?._hardwareTexture?.underlyingResource;
            if (colorResource) {
                colorResources.push(colorResource);
            }
        }
        const nativeDepth = texture._hardwareTexture!.underlyingResource;
        const framebuffer = this._createNativeMultiFrameBuffer(colorResources, width, height, generateStencil, true, samples, undefined, nativeDepth);
        nativeRTWrapper._framebufferDepthStencil = framebuffer;
        this._setTextureSampling(nativeDepth, getNativeSamplingMode(texture.samplingMode));
        this.updateTextureComparisonFunction(texture, texture._comparisonFunction);
    }

    // Reallocates a render target's sampleable depth/stencil texture with a new sample count and reattaches it to
    // the (already rebuilt) color framebuffer(s), so rendering and later depth sampling keep using the same resource.
    private _recreateDepthStencilTexture(nativeRTWrapper: NativeRenderTargetWrapper, samples: number): void {
        const depthTexture = nativeRTWrapper._depthStencilTexture;
        if (!depthTexture?._hardwareTexture) {
            return;
        }

        const previous = depthTexture._hardwareTexture;
        depthTexture._hardwareTexture = this._createHardwareTexture();
        depthTexture.samples = samples;
        if (nativeRTWrapper.isMulti) {
            nativeRTWrapper._framebufferDepthStencil = null;
        } else {
            this._attachDepthStencilTexture(nativeRTWrapper, depthTexture, depthTexture.width, depthTexture.height, nativeRTWrapper._depthStencilTextureWithStencil, samples);
        }
        previous.release();
    }

    /**
     * Returns whether a render-target texture was created with mip storage, independently of generateMipMaps.
     * @internal
     */
    public _hasMipStorage(texture: InternalTexture): boolean {
        return _TexturesWithMipStorage.has(texture) || texture.generateMipMaps;
    }

    private _setHasMipStorage(texture: InternalTexture, hasMipStorage: boolean): void {
        if (hasMipStorage) {
            _TexturesWithMipStorage.add(texture);
        } else {
            _TexturesWithMipStorage.delete(texture);
        }
    }

    /**
     * Ensures a cloned render-target texture retains allocation-only mip storage.
     * @internal
     */
    public _ensureRenderTargetMipStorage(texture: InternalTexture): boolean {
        if (this._hasMipStorage(texture)) {
            return false;
        }

        this._setHasMipStorage(texture, true);
        if (!texture._hardwareTexture) {
            return false;
        }

        this._engine.initializeTexture(
            texture._hardwareTexture.underlyingResource,
            texture.baseWidth,
            texture.baseHeight,
            this._getRenderTargetHasMips(true, texture.samples),
            getNativeTextureFormat(texture.format, texture.type),
            /*renderTarget*/ true,
            texture._useSRGBBuffer,
            texture.samples,
            texture.isCube,
            texture.is2DArray || texture.is3D ? texture.depth : 0,
            texture.is3D
        );
        return true;
    }

    /**
     * Rebuilds native framebuffer objects after a wrapper's explicit depth attachment changes.
     * @internal
     */
    public _rebuildRenderTargetFramebuffersAfterDepthChange(nativeRTWrapper: NativeRenderTargetWrapper): void {
        nativeRTWrapper._releaseLayerFramebuffers();
        nativeRTWrapper._framebufferDepthStencil = null;

        if (nativeRTWrapper._usesLayeredFramebuffer) {
            nativeRTWrapper._invalidateLayeredFramebuffer();
            return;
        }

        if (nativeRTWrapper.isMulti) {
            if (nativeRTWrapper._framebuffer && this._isFrameGraphFramebuffer(nativeRTWrapper._framebuffer)) {
                nativeRTWrapper._framebuffer = null;
            } else if (nativeRTWrapper._framebuffer) {
                this._createMultiRenderTargetFramebuffer(nativeRTWrapper);
            }
            return;
        }

        const texture = nativeRTWrapper.texture;
        const nativeTexture = texture?._hardwareTexture?.underlyingResource;
        const depthTexture = nativeRTWrapper._depthStencilTexture;
        const nativeDepth = depthTexture?._hardwareTexture?.underlyingResource;
        if (nativeRTWrapper._framebuffers && nativeTexture) {
            if (nativeDepth) {
                this._attachDepthStencilTexture(
                    nativeRTWrapper,
                    depthTexture!,
                    nativeRTWrapper.width,
                    nativeRTWrapper.height,
                    nativeRTWrapper._depthStencilTextureWithStencil,
                    nativeRTWrapper.samples
                );
            } else {
                nativeRTWrapper._framebuffers = this._createLayerFramebuffers(
                    nativeTexture,
                    nativeRTWrapper.width,
                    nativeRTWrapper.height,
                    nativeRTWrapper.isCube ? 6 : nativeRTWrapper.layers,
                    nativeRTWrapper._generateStencilBuffer,
                    nativeRTWrapper._generateDepthBuffer,
                    nativeRTWrapper.samples,
                    nativeRTWrapper.texture?.generateMipMaps
                );
            }
            return;
        }

        if (nativeDepth) {
            this._attachDepthStencilTexture(
                nativeRTWrapper,
                depthTexture!,
                nativeRTWrapper.width,
                nativeRTWrapper.height,
                nativeRTWrapper._depthStencilTextureWithStencil,
                nativeRTWrapper.samples
            );
        } else {
            nativeRTWrapper._framebuffer = this._engine.createFrameBuffer(
                nativeTexture ?? null,
                nativeRTWrapper.width,
                nativeRTWrapper.height,
                nativeRTWrapper._generateStencilBuffer,
                nativeRTWrapper._generateDepthBuffer,
                nativeRTWrapper.samples
            );
        }
    }

    /**
     * Rejects an explicit depth attachment the render target cannot use, before any attachment state is mutated.
     * bgfx requires every framebuffer attachment to share one sample count.
     * @internal
     */
    public _assertDepthAttachmentCompatible(rtWrapper: NativeRenderTargetWrapper, depthSamples: number): void {
        if (rtWrapper.is3D) {
            this._assertVolumeDepthAttachmentSupported();
        }
        if ((depthSamples || 1) !== (rtWrapper.samples || 1)) {
            throw new Error(`NativeEngine: explicit depth attachments must use the render target's sample count (depth: ${depthSamples || 1}, color: ${rtWrapper.samples || 1}).`);
        }
    }

    /**
     * Whether the depth attachment carries stencil: an explicit depth texture decides from its own format (its handle
     * may be unallocated after a sample-count change), otherwise the automatic depth buffer request does.
     * @internal
     */
    public _getDepthAttachmentStencil(rtWrapper: NativeRenderTargetWrapper): boolean {
        const depthTexture = rtWrapper._depthStencilTexture;
        return depthTexture ? HasStencilAspect(depthTexture.format) : rtWrapper._generateStencilBuffer;
    }

    /** @internal */
    public _assertVolumeDepthAttachmentSupported(depthSamples?: number, colorSamples?: number): void {
        if (!this._engine.createMultiFrameBuffer) {
            throw new Error("NativeEngine: explicit depth attachments on volume render targets require createMultiFrameBuffer support.");
        }
        if (depthSamples !== undefined && colorSamples !== undefined && depthSamples !== colorSamples) {
            throw new Error("NativeEngine: explicit depth and color attachments on volume render targets must use the same sample count.");
        }
    }

    /**
     * Updates a depth texture Comparison Mode and Function.
     * @param texture The texture to set the comparison function for
     * @param comparisonFunction The comparison function to set, 0 if no comparison required
     */
    public updateTextureComparisonFunction(texture: InternalTexture, comparisonFunction: number): void {
        texture._comparisonFunction = comparisonFunction;
        // Drive bgfx BGFX_SAMPLER_COMPARE_* so PCF/PCSS shaders (sampler2DShadow / sampler2DArrayShadow)
        // get hardware depth compares. Engine-agnostic callers (LightingVolume) also toggle this around
        // a copy and expect the recorded value to stay in sync even when the hardware texture is missing.
        const nativeTexture = texture._hardwareTexture?.underlyingResource;
        if (nativeTexture && this._engine.setTextureComparisonFunction) {
            this._engine.setTextureComparisonFunction(nativeTexture, comparisonFunction);
        }
    }

    /**
     * Generates mipmaps for the given texture.
     * @param _texture The texture to generate the mipmaps for.
     */
    public override generateMipmaps(_texture: InternalTexture): void {
        // The WebGL implementation binds the texture and calls gl.generateMipmap; there is no equivalent
        // standalone command on Babylon Native, and none is needed: a render target whose mip chain must be
        // rebuilt is attached to its framebuffer with BGFX_RESOLVE_AUTO_GEN_MIPS (see CreateFrameBufferImpl),
        // so bgfx regenerates the chain when the view resolves. Without this override the inherited WebGL path
        // dereferenced a non-existent GL context (frame graph tasks call generateMipMaps explicitly).
    }

    /**
     * Creates one framebuffer per layer (or cube face) of a native texture.
     * @internal
     */
    public _createLayerFramebuffers(
        nativeTexture: NativeTexture,
        width: number,
        height: number,
        layerCount: number,
        generateStencilBuffer: boolean,
        generateDepthBuffer: boolean,
        samples: number,
        autoGenerateMips = true
    ): NativeFramebuffer[] {
        const framebuffers: NativeFramebuffer[] = [];
        for (let layer = 0; layer < layerCount; layer++) {
            framebuffers.push(this._engine.createFrameBuffer(nativeTexture, width, height, generateStencilBuffer, generateDepthBuffer, samples, layer, 0, autoGenerateMips));
        }
        return framebuffers;
    }

    /**
     * Per-layer framebuffers carry their own depth/stencil attachment, either requested at creation or added by
     * createDepthStencilTexture (see _createDepthStencilTexture), so recreate them with the same attachments.
     * @internal
     */
    public _getLayerFramebufferDepthStencil(rtWrapper: RenderTargetWrapper): { generateDepth: boolean; generateStencil: boolean } {
        const hasDepthStencilTexture = !!rtWrapper._depthStencilTexture;
        return {
            generateDepth: rtWrapper._generateDepthBuffer || hasDepthStencilTexture,
            generateStencil: rtWrapper._generateStencilBuffer || (hasDepthStencilTexture && rtWrapper._depthStencilTextureWithStencil),
        };
    }

    /**
     * @internal
     */
    public _releaseFramebufferObjects(framebuffer: Nullable<NativeFramebuffer>): void {
        if (framebuffer) {
            // Frame graph framebuffers are shared across several render-target wrappers (see
            // _buildFrameGraphFramebuffer). Each wrapper releases its reference on dispose/reassignment, so
            // reference-count the shared framebuffer and only delete the underlying bgfx handle once.
            const shared = this._frameGraphFramebufferRefCount.get(framebuffer);
            if (shared !== undefined) {
                if (shared.count > 1) {
                    shared.count--;
                    return;
                }
                this._frameGraphFramebufferRefCount.delete(framebuffer);
                if (shared.hardwareTexture._frameGraphFramebuffer === framebuffer) {
                    shared.hardwareTexture._frameGraphFramebuffer = null;
                }
            }
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DELETEFRAMEBUFFER);
            this._commandBufferEncoder.encodeCommandArgAsNativeData(framebuffer);
            this._commandBufferEncoder.finishEncodingCommand();
        }
    }

    /**
     * Returns true when the given framebuffer was built by the frame graph path (_buildFrameGraphFramebuffer),
     * i.e. it is reference-counted, shared between wrappers and rebuilt lazily on bind.
     * @param framebuffer The framebuffer to test
     * @returns true if the framebuffer is a frame graph framebuffer
     * @internal
     */
    public _isFrameGraphFramebuffer(framebuffer: NativeFramebuffer): boolean {
        return this._frameGraphFramebufferRefCount.has(framebuffer);
    }

    // Reference counts + metadata for framebuffers shared across frame graph render-target wrappers
    // are stored in _frameGraphFramebufferRefCount (declared with the other engine fields).

    /**
     * Lazily builds (or reuses a shared) bgfx framebuffer for a frame graph render-target wrapper whose
     * textures were attached after creation (dontCreateTextures). All wrappers that reference the same
     * underlying color texture share a single framebuffer, cached on that texture's hardware wrapper, so that
     * successive passes (clear, object render, post) accumulate into the same target instead of each fresh
     * framebuffer/view clearing it.
     * @internal
     */
    private _buildFrameGraphFramebuffer(nativeRTWrapper: NativeRenderTargetWrapper): void {
        const textures = nativeRTWrapper.textures;
        if (!textures || textures.length === 0) {
            // Depth-only frame graph render target: 0 color attachments plus a shared depth-stencil texture.
            // The FrameGraph schedules a standalone depth-clear pass against the geometry buffer's depth texture,
            // separately from the geometry MRT render. Build a depth-only framebuffer that BORROWS the shared
            // depth texture (its bgfx handle is already valid, created up-front by _createInternalTexture) so the
            // clear hits the exact buffer the geometry MRT later depth-tests against. Without this the clear is
            // misdirected to the back buffer and the geometry prepass depth is never cleared, leaving the geometry
            // buffer empty (breaks SSR / motion blur / curvature / SSAO).
            const depthOnlyTexture = nativeRTWrapper._depthStencilTexture;
            const depthOnlyResource = depthOnlyTexture?._hardwareTexture?.underlyingResource;
            if (depthOnlyResource && !nativeRTWrapper._framebufferDepthStencil) {
                nativeRTWrapper._framebufferDepthStencil = this._createNativeMultiFrameBuffer(
                    [],
                    nativeRTWrapper.width,
                    nativeRTWrapper.height,
                    nativeRTWrapper._generateStencilBuffer,
                    true,
                    depthOnlyTexture!.samples || nativeRTWrapper.samples || 1,
                    undefined,
                    depthOnlyResource
                );
            }
            return;
        }

        const textureCount = textures.length;
        for (let i = 0; i < textureCount; i++) {
            if (!textures[i]?._hardwareTexture?.underlyingResource) {
                // A color texture is not yet backed by a hardware texture; leave the wrapper unbuilt (the base
                // path will bind the back buffer). This wrapper will be retried on its next bind.
                return;
            }
        }

        const hardwareTexture = textures[0]._hardwareTexture as NativeHardwareTexture;
        const depthStencilTexture = nativeRTWrapper._depthStencilTexture;
        const generateDepthBuffer = !!depthStencilTexture || nativeRTWrapper._generateDepthBuffer;
        const generateStencilBuffer = this._getDepthAttachmentStencil(nativeRTWrapper);
        const samples = textures[0].samples || nativeRTWrapper.samples || 1;

        // Like a GL framebuffer, an explicit depth-stencil texture is always attached as-is, so every pass that
        // references it (clears, geometry, overlays, later samplers) sees the same real depth buffer.
        const sharedDepthResource = depthStencilTexture?._hardwareTexture?.underlyingResource as NativeTexture | undefined;
        const cached = hardwareTexture._frameGraphFramebuffer;
        const cachedMeta = cached ? this._frameGraphFramebufferRefCount.get(cached) : undefined;

        // Reuse the cached framebuffer when it is compatible: the same ordered color attachments (a swap of any
        // attachment, not only the primary one, needs a new framebuffer), the same sample count, depth/stencil
        // buffers when this pass needs them (a pass that does not need them can safely reuse a framebuffer that
        // has them), and the same shared depth texture (so a shared-depth pass never reuses an auto-depth
        // framebuffer, and vice versa). History-texture swaps invalidate these wrappers every frame, so this check
        // runs in the render loop: compare in place and only allocate the color list for a new framebuffer.
        let sameColors = !!cachedMeta && cachedMeta.colorResources.length === textureCount;
        for (let i = 0; sameColors && i < textureCount; i++) {
            sameColors = cachedMeta!.colorResources[i] === textures[i]._hardwareTexture!.underlyingResource;
        }
        if (
            cached &&
            cachedMeta &&
            sameColors &&
            cachedMeta.samples === samples &&
            (cachedMeta.hasDepth || !generateDepthBuffer) &&
            (cachedMeta.hasStencil || !generateStencilBuffer) &&
            cachedMeta.sharedDepthResource === sharedDepthResource
        ) {
            cachedMeta.count++;
            nativeRTWrapper._framebuffer = cached;
            return;
        }

        const colorTextures: NativeTexture[] = new Array(textureCount);
        for (let i = 0; i < textureCount; i++) {
            colorTextures[i] = textures[i]._hardwareTexture!.underlyingResource;
        }

        const framebuffer = sharedDepthResource
            ? this._createNativeMultiFrameBuffer(colorTextures, nativeRTWrapper.width, nativeRTWrapper.height, generateStencilBuffer, true, samples, undefined, sharedDepthResource)
            : colorTextures.length === 1
              ? this._engine.createFrameBuffer(colorTextures[0], nativeRTWrapper.width, nativeRTWrapper.height, generateStencilBuffer, generateDepthBuffer, samples)
              : this._createNativeMultiFrameBuffer(colorTextures, nativeRTWrapper.width, nativeRTWrapper.height, generateStencilBuffer, generateDepthBuffer, samples);

        this._frameGraphFramebufferRefCount.set(framebuffer, {
            count: 1,
            hardwareTexture,
            colorResources: colorTextures,
            hasDepth: generateDepthBuffer,
            hasStencil: generateStencilBuffer,
            samples,
            sharedDepthResource,
        });
        hardwareTexture._frameGraphFramebuffer = framebuffer;
        nativeRTWrapper._framebuffer = framebuffer;
    }

    /**
     * @internal Engine abstraction for loading and creating an image bitmap from a given source string.
     * @param imageSource source to load the image from.
     * @param _options An object that sets options for the image's extraction.
     * @returns ImageBitmap
     */
    public override async _createImageBitmapFromSource(imageSource: string, _options?: ImageBitmapOptions): Promise<ImageBitmap> {
        const promise = new Promise<ImageBitmap>((resolve, reject) => {
            const image = this.createCanvasImage();
            image.onload = () => {
                try {
                    const imageBitmap = this._engine.createImageBitmap(image);
                    resolve(imageBitmap);
                } catch (error) {
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    reject(`Error loading image ${image.src} with exception: ${error}`);
                }
            };
            image.onerror = (error) => {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject(`Error loading image ${image.src} with exception: ${error}`);
            };

            image.src = imageSource;
        });

        return await promise;
    }

    /**
     * Engine abstraction for createImageBitmap
     * @param image source for image
     * @param options An object that sets options for the image's extraction.
     * @returns ImageBitmap
     */
    public override async createImageBitmap(image: ImageBitmapSource, options?: ImageBitmapOptions): Promise<ImageBitmap> {
        // Back-compat: Because of the previous Blob hack, this could be an array of BlobParts.
        if (Array.isArray(image)) {
            const arr = <Array<ArrayBuffer>>image;
            if (arr.length) {
                return this._engine.createImageBitmap(arr[0]);
            }
        }

        if (image instanceof Blob) {
            const data = await image.arrayBuffer();
            return this._engine.createImageBitmap(data);
        }

        throw new Error("Unsupported data for createImageBitmap.");
    }

    /**
     * Resize an image and returns the image data as an uint8array
     * @param image image to resize
     * @param bufferWidth destination buffer width
     * @param bufferHeight destination buffer height
     * @returns an uint8array containing RGBA values of bufferWidth * bufferHeight size
     */
    public override resizeImageBitmap(image: ImageBitmap, bufferWidth: number, bufferHeight: number): Uint8Array {
        return this._engine.resizeImageBitmap(image, bufferWidth, bufferHeight);
    }

    /** @internal */
    public override _createHardwareTexture(): IHardwareTextureWrapper {
        return new NativeHardwareTexture(this._createTexture() as NativeTexture, this._engine);
    }

    /** @internal */
    public override _createHardwareRenderTargetWrapper(isMulti: boolean, isCube: boolean, size: TextureSize): RenderTargetWrapper {
        const rtWrapper = new NativeRenderTargetWrapper(isMulti, isCube, size, this);
        this._renderTargetWrapperCache.push(rtWrapper);
        return rtWrapper;
    }

    /**
     * Older bgfx D3D11/D3D12/Vulkan backends share one texture descriptor between the MSAA render target and its
     * resolve target, so requesting mips together with samples > 1 fails texture creation (BabylonNative#1714).
     * Only keep the mip chain of a multisampled render target when the runtime reports that it supports it.
     * @internal
     */
    public _getRenderTargetHasMips(generateMipMaps: boolean, samples: number): boolean {
        return generateMipMaps && (samples <= 1 || !!this._engine.supportsMultisampledMipmaps);
    }

    /** @internal */
    public override _createInternalTexture(
        size: TextureSize,
        options: boolean | InternalTextureCreationOptions,
        _delayGPUTextureCreation = true,
        source = InternalTextureSource.Unknown
    ): InternalTexture {
        let generateMipMaps: boolean;
        let createMipMaps = false;
        let type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        let samplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
        let format = Constants.TEXTUREFORMAT_RGBA;
        let useSRGBBuffer = false;
        let samples = 1;
        let label: string | undefined;
        if (options !== undefined && typeof options === "object") {
            generateMipMaps = !!options.generateMipMaps;
            createMipMaps = !!options.createMipMaps;
            type = options.type === undefined ? Constants.TEXTURETYPE_UNSIGNED_BYTE : options.type;
            samplingMode = options.samplingMode === undefined ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : options.samplingMode;
            format = options.format === undefined ? Constants.TEXTUREFORMAT_RGBA : options.format;
            useSRGBBuffer = options.useSRGBBuffer === undefined ? false : options.useSRGBBuffer;
            samples = options.samples ?? 1;
            label = options.label;
        } else {
            generateMipMaps = !!options;
        }

        useSRGBBuffer = this._getUseSRGBBuffer(useSRGBBuffer, !generateMipMaps);

        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
            // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        } else if (type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
            // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }
        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
            type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
            Logger.Warn("Float textures are not supported. Type forced to TEXTURETYPE_UNSIGNED_BYTE");
        }

        // A cube render-target attachment routed through _createInternalTexture (e.g. a frame-graph MRT cube
        // target: the texture manager creates each attachment via _createInternalTexture and sets isCube for a
        // TEXTURE_CUBE_MAP target) must be created as a real bgfx cube texture. This path otherwise only
        // produces 2D / 2D-array textures (isCube was silently dropped), so a samplerCube read it back as a
        // plain 2D texture and the cube attachment rendered/sampled wrong. Delegate to the cube path so its
        // per-face layers (layer*6+face) are addressable.
        if (typeof options === "object" && options.isCube) {
            const cubeSize = (<{ width: number }>size).width ?? <number>size;
            return this._createInternalCubeTexture(cubeSize, options, source);
        }

        const texture = new InternalTexture(this, source);
        const width = (<{ width: number; height: number; layers?: number }>size).width ?? <number>size;
        const height = (<{ width: number; height: number; layers?: number }>size).height ?? <number>size;

        const layers = (<{ width: number; height: number; layers?: number }>size).layers || 0;
        // Like WebGL, a depth (without layers) requests a volume texture (e.g. a TEXTURE_3D MRT attachment).
        const depth = layers ? 0 : (<{ width: number; height: number; depth?: number }>size).depth || 0;

        const nativeTexture = texture._hardwareTexture!.underlyingResource;
        const nativeTextureFormat = getNativeTextureFormat(format, type);
        // createMipMaps allocates mip storage (e.g. FrameGraph textures) without requesting automatic generation.
        const hasMips = this._getRenderTargetHasMips(generateMipMaps || createMipMaps, samples);
        // REVIEW: We are always setting the renderTarget flag as we don't know whether the texture will be used as a render target.
        // A layers > 0 request creates a 2D texture array (e.g. a cascaded-shadow-map render target); the
        // matching per-layer framebuffers are built by createRenderTargetTexture and bound via bindFramebuffer(layer).
        this._engine.initializeTexture(nativeTexture, width, height, hasMips, nativeTextureFormat, true, useSRGBBuffer, samples, false, layers || depth, depth > 0);
        this._setTextureSampling(nativeTexture, getNativeSamplingMode(samplingMode));

        texture._useSRGBBuffer = useSRGBBuffer;
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.depth = layers || depth;
        if (layers > 0) {
            texture.is2DArray = true;
            texture.baseDepth = layers;
        } else if (depth > 0) {
            texture.is3D = true;
            texture.baseDepth = depth;
        }
        texture.isReady = true;
        texture.samples = samples;
        texture.generateMipMaps = generateMipMaps;
        this._setHasMipStorage(texture, generateMipMaps || createMipMaps);
        texture.samplingMode = samplingMode;
        texture.type = type;
        texture.format = format;
        texture.label = label;

        this._internalTexturesCache.push(texture);

        return texture;
    }

    // Creates a standalone, sampleable cube InternalTexture usable as a mixed-type MRT color attachment (a
    // single face is targeted per attachment via the framebuffer's per-attachment layer). Mirrors
    // _createInternalTexture's float/half-float linear-filter fallbacks + cache registration, but initializes
    // the bgfx texture as a cube render target (there is no cube path through _createInternalTexture, which
    // only produces 2D / 2D-array textures).
    private _createInternalCubeTexture(size: number, options: InternalTextureCreationOptions, source: InternalTextureSource): InternalTexture {
        let type = options.type ?? Constants.TEXTURETYPE_UNSIGNED_BYTE;
        let samplingMode = options.samplingMode ?? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
        const format = options.format ?? Constants.TEXTUREFORMAT_RGBA;
        const generateMipMaps = !!options.generateMipMaps;
        const samples = options.samples ?? 1;
        const useSRGBBuffer = this._getUseSRGBBuffer(!!options.useSRGBBuffer, !generateMipMaps);

        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        } else if (type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }
        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
            type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
            Logger.Warn("Float textures are not supported. Type forced to TEXTURETYPE_UNSIGNED_BYTE");
        }

        const texture = new InternalTexture(this, source);
        texture.isCube = true;
        texture.baseWidth = size;
        texture.baseHeight = size;
        texture.width = size;
        texture.height = size;
        texture.isReady = true;
        texture.samples = samples;
        texture.generateMipMaps = generateMipMaps;
        this._setHasMipStorage(texture, generateMipMaps || !!options.createMipMaps);
        texture.samplingMode = samplingMode;
        texture.type = type;
        texture.format = format;
        texture.label = options.label;
        texture._useSRGBBuffer = useSRGBBuffer;

        const nativeTexture = texture._hardwareTexture!.underlyingResource;
        const nativeTextureFormat = getNativeTextureFormat(format, type);
        // createMipMaps allocates mip storage (e.g. FrameGraph textures) without requesting automatic generation.
        const hasMips = this._getRenderTargetHasMips(generateMipMaps || !!options.createMipMaps, samples);
        this._engine.initializeTexture(nativeTexture, size, size, hasMips, nativeTextureFormat, /*renderTarget*/ true, useSRGBBuffer, samples, /*isCube*/ true);
        this._setTextureSampling(nativeTexture, getNativeSamplingMode(samplingMode));

        this._internalTexturesCache.push(texture);

        return texture;
    }

    public override createRenderTargetTexture(size: TextureSize, options: boolean | RenderTargetCreationOptions): RenderTargetWrapper {
        const rtWrapper = this._createHardwareRenderTargetWrapper(false, false, size) as NativeRenderTargetWrapper;

        let generateDepthBuffer = true;
        let generateStencilBuffer = false;
        let noColorAttachment = false;
        let colorAttachment: InternalTexture | undefined = undefined;
        let samples = 1;
        if (options !== undefined && typeof options === "object") {
            generateDepthBuffer = options.generateDepthBuffer ?? true;
            generateStencilBuffer = !!options.generateStencilBuffer;
            noColorAttachment = !!options.noColorAttachment;
            colorAttachment = options.colorAttachment;
            samples = options.samples ?? 1;
        }

        const width = typeof size === "number" ? size : size.width;
        const height = typeof size === "number" ? size : size.height;
        const layers = typeof size === "number" ? 0 : size.layers || 0;
        const depth = typeof size === "number" ? 0 : size.depth || 0;

        // 3D render target (IBL voxel grid + its procedural mip chain): create a real volume texture and
        // render to each Z-slice / mip through its own lazily-built framebuffer (see _get3DLayerFramebuffer).
        if (depth > 0 && !noColorAttachment && !colorAttachment) {
            return this._createRenderTargetTexture3D(rtWrapper, options, width, height, depth, generateDepthBuffer, generateStencilBuffer);
        }

        const texture = colorAttachment || (noColorAttachment ? null : this._createInternalTexture(size, options, true, InternalTextureSource.RenderTarget));

        if (layers > 0 && texture) {
            // 2D texture array render target (e.g. cascaded shadow maps): the native engine renders each
            // array layer through its own framebuffer bound to that layer (mirroring the cube per-face path);
            // bindFramebuffer(layerIndex) then selects the right one.
            rtWrapper._framebuffers = this._createLayerFramebuffers(
                texture._hardwareTexture!.underlyingResource,
                width,
                height,
                layers,
                generateStencilBuffer,
                generateDepthBuffer,
                samples,
                texture.generateMipMaps
            );
            rtWrapper._generateDepthBuffer = generateDepthBuffer;
            rtWrapper._generateStencilBuffer = generateStencilBuffer;
            rtWrapper._samples = samples;
            rtWrapper.setTextures(texture);
            return rtWrapper;
        }

        const framebuffer = this._engine.createFrameBuffer(
            texture ? texture._hardwareTexture!.underlyingResource : null,
            width,
            height,
            generateStencilBuffer,
            generateDepthBuffer,
            samples
        );

        rtWrapper._framebuffer = framebuffer;
        rtWrapper._generateDepthBuffer = generateDepthBuffer;
        rtWrapper._generateStencilBuffer = generateStencilBuffer;
        rtWrapper._samples = samples;

        rtWrapper.setTextures(texture);

        return rtWrapper;
    }

    // Builds a 3D (volume) render-target texture. bgfx renders to individual Z-slices/mips through per-slice
    // framebuffers created on demand in _get3DLayerFramebuffer; the volume is sampled as a sampler3D.
    private _createRenderTargetTexture3D(
        rtWrapper: NativeRenderTargetWrapper,
        options: boolean | RenderTargetCreationOptions,
        width: number,
        height: number,
        depth: number,
        generateDepthBuffer: boolean,
        generateStencilBuffer: boolean
    ): RenderTargetWrapper {
        const texture = this._createInternalTexture({ width, height, depth }, options, true, InternalTextureSource.RenderTarget);

        rtWrapper._generateDepthBuffer = generateDepthBuffer;
        rtWrapper._generateStencilBuffer = generateStencilBuffer;
        rtWrapper._samples = texture.samples;
        rtWrapper.setTextures(texture);

        return rtWrapper;
    }

    public override createRenderTargetCubeTexture(size: number, options?: RenderTargetCreationOptions): RenderTargetWrapper {
        const rtWrapper = this._createHardwareRenderTargetWrapper(false, true, size) as NativeRenderTargetWrapper;

        let generateDepthBuffer = true;
        let generateStencilBuffer = false;
        let generateMipMaps = false;
        let createMipMaps: boolean | undefined;
        let type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        let samplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
        let format = Constants.TEXTUREFORMAT_RGBA;
        let samples = 1;
        let label: string | undefined;
        if (options !== undefined && typeof options === "object") {
            generateDepthBuffer = options.generateDepthBuffer ?? true;
            generateStencilBuffer = !!options.generateStencilBuffer;
            generateMipMaps = !!options.generateMipMaps;
            createMipMaps = options.createMipMaps;
            type = options.type ?? Constants.TEXTURETYPE_UNSIGNED_BYTE;
            samplingMode = options.samplingMode ?? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
            format = options.format ?? Constants.TEXTUREFORMAT_RGBA;
            samples = options.samples ?? 1;
            label = options.label;
        }

        // Storage for a full mip chain is requested via createMipMaps (falling back to generateMipMaps when
        // unspecified). HDR prefiltering passes createMipMaps:true + generateMipMaps:false because it renders
        // each roughness mip explicitly and must NOT have them auto-regenerated on unbind.
        const allocateMips = createMipMaps ?? generateMipMaps;

        // Match _createInternalTexture: float/half-float RTTs that the platform can't linearly filter fall
        // back to NEAREST so the cube RTT never carries an unsupported sampling mode.
        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        } else if (type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }
        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
            type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
            Logger.Warn("Float textures are not supported. Type forced to TEXTURETYPE_UNSIGNED_BYTE");
        }

        const texture = new InternalTexture(this, InternalTextureSource.RenderTarget);
        texture.isCube = true;
        texture.baseWidth = size;
        texture.baseHeight = size;
        texture.width = size;
        texture.height = size;
        texture.isReady = true;
        texture.samples = samples;
        texture.generateMipMaps = generateMipMaps;
        this._setHasMipStorage(texture, allocateMips);
        texture.samplingMode = samplingMode;
        texture.type = type;
        texture.format = format;
        texture.label = label;

        const nativeTexture = texture._hardwareTexture!.underlyingResource;
        const nativeTextureFormat = getNativeTextureFormat(format, type);
        // See the createRenderTargetTexture MSAA/mips note: avoid the mips + samples combo on bgfx.
        const hasMips = this._getRenderTargetHasMips(allocateMips, samples);
        this._engine.initializeTexture(nativeTexture, size, size, hasMips, nativeTextureFormat, /*renderTarget*/ true, /*srgb*/ false, samples, /*isCube*/ true);
        this._setTextureSampling(nativeTexture, getNativeSamplingMode(samplingMode));

        // The native engine cannot render to all six faces through one framebuffer, so create one
        // framebuffer per face (the C++ side binds the matching cube layer); bindFramebuffer(faceIndex)
        // then selects the right one.
        // generateMipMaps is forwarded as autoGenerateMips: a cube RTT that authors its own mip levels
        // (HDR radiance prefiltering passes createMipMaps:true + generateMipMaps:false and renders one
        // convolution per face+mip) must not have the chain regenerated from mip 0 when a face resolves,
        // which would wipe every explicitly rendered roughness level.
        const framebuffers: NativeFramebuffer[] = [];
        for (let face = 0; face < 6; face++) {
            framebuffers.push(this._engine.createFrameBuffer(nativeTexture, size, size, generateStencilBuffer, generateDepthBuffer, samples, face, 0, generateMipMaps));
        }

        rtWrapper._framebuffers = framebuffers;
        rtWrapper._generateDepthBuffer = generateDepthBuffer;
        rtWrapper._generateStencilBuffer = generateStencilBuffer;
        rtWrapper._samples = samples;

        rtWrapper.setTextures(texture);

        // Track the hand-built cube RTT texture the same way _createInternalTexture tracks 2D textures so it
        // participates in engine-wide lifecycle management (dispose iteration, context rebuild, stats).
        this._internalTexturesCache.push(texture);

        return rtWrapper;
    }

    // The Native engine renders a multi render target through a single bgfx framebuffer with several color
    // attachments (see NativeEngine.cpp CreateMultiFrameBuffer / CreateFrameBufferImpl). Plain 2D color
    // attachments (the WebGL prepass / geometry-buffer path) build their framebuffer eagerly here; mixed-type
    // attachments (specific cube faces / 2D-array layers) and 3D voxelization MRTs build a layered
    // multi-attachment framebuffer lazily on first bind. Sampleable depth textures (generateDepthTexture)
    // are not supported. Attachments swapped after creation (e.g. the OIT depth-peeling renderer) rebuild the
    // framebuffer via _createMultiRenderTargetFramebuffer (called from NativeRenderTargetWrapper.setTexture).
    public override createMultipleRenderTarget(size: TextureSize, options: IMultiRenderTargetOptions, _initializeBuffers = true): RenderTargetWrapper {
        let generateMipMaps = false;
        let createMipMaps = false;
        let generateDepthBuffer = true;
        let generateStencilBuffer = false;
        let generateDepthTexture = false;
        let textureCount = 1;
        let samples = 1;

        const defaultType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        const defaultSamplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
        const defaultFormat = Constants.TEXTUREFORMAT_RGBA;

        let types: number[] = [];
        let samplingModes: number[] = [];
        let useSRGBBuffers: boolean[] = [];
        let formats: number[] = [];
        let targets: number[] = [];
        let labels: string[] = [];
        let dontCreateTextures = false;

        const rtWrapper = this._createHardwareRenderTargetWrapper(true, false, size) as NativeRenderTargetWrapper;

        if (options !== undefined) {
            generateMipMaps = options.generateMipMaps ?? false;
            createMipMaps = options.createMipMaps ?? generateMipMaps;
            generateDepthBuffer = options.generateDepthBuffer ?? true;
            generateStencilBuffer = options.generateStencilBuffer ?? false;
            generateDepthTexture = options.generateDepthTexture ?? false;
            textureCount = options.textureCount ?? 1;
            samples = options.samples ?? samples;
            types = options.types || types;
            samplingModes = options.samplingModes || samplingModes;
            useSRGBBuffers = options.useSRGBBuffers || useSRGBBuffers;
            formats = options.formats || formats;
            targets = options.targetTypes || targets;
            labels = options.labels || labels;
            dontCreateTextures = options.dontCreateTextures ?? false;
        }

        const width = (<{ width: number; height: number }>size).width ?? <number>size;
        const height = (<{ width: number; height: number }>size).height ?? <number>size;

        // MRT whose color attachments are distinct layers of one shared 3D texture (IBL voxelization: N draw
        // buffers → N Z-slices of the voxel grid). The shared texture is assigned later via setInternalTexture,
        // so the layered multi-attachment framebuffer is (re)built lazily on first bind (_bindLayeredMultiFramebuffer).
        const layerIndex = options?.layerIndex;
        const faceIndex = options?.faceIndex;
        const layerCounts = options?.layerCounts;
        const is3DLayeredMRT = targets.some((t) => t === Constants.TEXTURE_3D);
        // A mixed-type MRT renders each color attachment into a specific layer of a 2D-array texture or a
        // specific face of a cube texture (alongside plain 2D targets). Detect it so each color texture is
        // created with the correct dimensionality and the multi-attachment framebuffer is built lazily with
        // per-attachment layer/face (setInternalTexture may swap a shared texture in after creation, e.g. the
        // MRT that renders two different layers of one 2D-array via a -1 target + setInternalTexture).
        const isLayeredMRT = is3DLayeredMRT || targets.some((t) => t === Constants.TEXTURE_2D_ARRAY || t === Constants.TEXTURE_CUBE_MAP);

        const textures: InternalTexture[] = [];
        const attachments: number[] = [];

        rtWrapper.label = options?.label ?? "MultiRenderTargetWrapper";
        // Without a sampleable depth attachment on Native, a generateDepthTexture request still needs depth testing.
        rtWrapper._generateDepthBuffer = generateDepthBuffer || generateDepthTexture;
        rtWrapper._generateStencilBuffer = generateStencilBuffer;
        rtWrapper._attachments = attachments;

        for (let i = 0; i < textureCount; i++) {
            const samplingMode = samplingModes[i] || defaultSamplingMode;
            const type = types[i] || defaultType;
            const format = formats[i] || defaultFormat;
            const useSRGBBuffer = (useSRGBBuffers[i] || false) && this._caps.supportSRGBBuffers;
            const target = targets[i];

            // Attachment index i+1 mirrors the WebGL COLOR_ATTACHMENTi convention consumers rely on.
            attachments.push(i + 1);

            if (target === -1 || dontCreateTextures) {
                continue;
            }

            // _createInternalTexture initializes the bgfx texture as a sampleable render target and applies
            // the float/half-float linear-filter fallbacks + cache registration, matching createRenderTargetTexture.
            // The color attachments must carry the same MSAA sample count as the framebuffer's depth attachment
            // (created with `samples` below): bgfx rejects a framebuffer that mixes single-sample color targets
            // with a multisample depth target, which surfaced as "Failed to create frame buffer" for MSAA MRTs
            // (e.g. the SSAO prepass). _createInternalTexture already drops mips when samples > 1.
            // A mixed-type MRT creates the attachment with the dimensionality requested by targetTypes: a cube
            // texture (one face targeted per attachment) or a 2D-array texture with layerCounts layers (one
            // layer targeted per attachment). The framebuffer selects the specific face/layer per attachment.
            const textureLabel = labels[i] ?? rtWrapper.label + "-Texture" + i;
            const textureOptions = { generateMipMaps, createMipMaps, type, format, samplingMode, useSRGBBuffer, samples, label: textureLabel };
            let texture: InternalTexture;
            if (target === Constants.TEXTURE_CUBE_MAP) {
                texture = this._createInternalCubeTexture(width, textureOptions, InternalTextureSource.MultiRenderTarget);
            } else if (target === Constants.TEXTURE_2D_ARRAY) {
                const layerCount = Math.max(1, layerCounts?.[i] ?? 1);
                texture = this._createInternalTexture({ width, height, layers: layerCount }, textureOptions, true, InternalTextureSource.MultiRenderTarget);
            } else if (target === Constants.TEXTURE_3D) {
                const depth = Math.max(1, layerCounts?.[i] || (<{ depth?: number }>size).depth || 1);
                texture = this._createInternalTexture({ width, height, depth }, textureOptions, true, InternalTextureSource.MultiRenderTarget);
            } else {
                texture = this._createInternalTexture({ width, height }, textureOptions, true, InternalTextureSource.MultiRenderTarget);
            }
            texture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            texture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;

            textures[i] = texture;
        }

        if (generateDepthTexture && !dontCreateTextures) {
            // The multi-framebuffer path allocates its own (non-sampleable) depth/stencil buffer; a separate
            // sampleable depth texture attachment is not wired up on Native.
            Logger.Warn("NativeEngine.createMultipleRenderTarget: generateDepthTexture is not supported; using a non-sampleable depth buffer.");
        }

        if (isLayeredMRT || layerIndex) {
            rtWrapper.setLayerAndFaceIndices(layerIndex ?? [], faceIndex ?? []);
        }

        // Layered MRTs (3D / 2D-array / cube attachments, possibly mixed with 2D) build their multi-attachment
        // framebuffer lazily on first bind. The flag selects that path in bindFramebuffer so per-attachment
        // layer/face and post-creation setInternalTexture are honored, even when the size carries no depth.
        if (isLayeredMRT) {
            rtWrapper._isMixedTypeMRT = true;
        }

        rtWrapper._samples = samples;
        rtWrapper.setTextures(textures);

        if (!dontCreateTextures && !isLayeredMRT) {
            this._createMultiRenderTargetFramebuffer(rtWrapper);
        }

        return rtWrapper;
    }

    /**
     * Creates (or recreates) the native framebuffer of a multi render target from the color attachment
     * textures currently held by the wrapper. bgfx binds a fixed attachment set when a framebuffer is
     * created and cannot re-point an individual attachment the way GL's framebufferTexture2D can, so the
     * whole framebuffer has to be recreated whenever an attachment is swapped after creation (e.g. the OIT
     * depth-peeling renderer replaces every attachment via MultiRenderTarget.setInternalTexture).
     * @param rtWrapper The multi render target wrapper to build the framebuffer for.
     * @internal
     */
    public _createMultiRenderTargetFramebuffer(rtWrapper: NativeRenderTargetWrapper): void {
        const textures = rtWrapper.textures;
        if (!textures) {
            return;
        }

        const colorHandles: NativeTexture[] = [];
        for (const texture of textures) {
            const handle = texture?._hardwareTexture?.underlyingResource;
            if (handle) {
                colorHandles.push(handle);
            }
        }

        // bgfx framebuffers use a dense, ordered attachment list, so only (re)build once every expected color
        // attachment is present. Building from a partial set (e.g. attachments deferred via dontCreateTextures /
        // targetTypes[i] === -1, or filled out of order) would compress the attachment indices -- attachment 2
        // would become attachment 1, etc. -- and produce a framebuffer that does not match the MRT layout. The
        // count match guarantees the collected handles are contiguous and in attachment order.
        const expectedCount = rtWrapper._attachments ? rtWrapper._attachments.length : colorHandles.length;
        if (colorHandles.length === 0 || colorHandles.length !== expectedCount) {
            return;
        }

        const width = rtWrapper.width;
        const height = rtWrapper.height;

        // Prefer an explicit shared depth texture when present (OIT depth peeling shareDepth, FG depth
        // attached after dontCreateTextures). Otherwise fall back to auto depth from _generateDepthBuffer.
        const explicitDepth = rtWrapper._depthStencilTexture?._hardwareTexture?.underlyingResource as NativeTexture | undefined;
        const generateDepthBuffer = !!explicitDepth || rtWrapper._generateDepthBuffer;

        rtWrapper._framebuffer = this._createNativeMultiFrameBuffer(
            colorHandles,
            width,
            height,
            this._getDepthAttachmentStencil(rtWrapper),
            generateDepthBuffer,
            rtWrapper._samples,
            undefined,
            explicitDepth
        );
        this._applyDepthTextureSampling(rtWrapper);
    }

    private _applyDepthTextureSampling(rtWrapper: NativeRenderTargetWrapper): void {
        const depthTexture = rtWrapper._depthStencilTexture;
        const nativeDepth = depthTexture?._hardwareTexture?.underlyingResource;
        if (!depthTexture || !nativeDepth) {
            return;
        }

        this._setTextureSampling(nativeDepth, getNativeSamplingMode(depthTexture.samplingMode));
        this.updateTextureComparisonFunction(depthTexture, depthTexture._comparisonFunction);
    }

    /**
     * Creates a multi-attachment framebuffer, falling back to a single-attachment framebuffer bound to the first
     * color target (and its first requested layer) on older Babylon Native runtimes without createMultiFrameBuffer.
     * @internal
     */
    public _createNativeMultiFrameBuffer(
        colorTextures: NativeTexture[],
        width: number,
        height: number,
        generateStencilBuffer: boolean,
        generateDepthBuffer: boolean,
        samples: number,
        layers?: number[],
        explicitDepthTexture?: NativeTexture
    ): NativeFramebuffer {
        if (this._engine.createMultiFrameBuffer) {
            return this._engine.createMultiFrameBuffer(colorTextures, width, height, generateStencilBuffer, generateDepthBuffer, samples, layers, explicitDepthTexture);
        }

        // Warn once (limit 1): the framebuffer can be rebuilt many times during attachment setup/swaps.
        Logger.Warn(
            "createMultiFrameBuffer is not supported by this version of Babylon Native; multi render targets are unavailable. Falling back to a single-attachment framebuffer bound to the first color target.",
            1
        );
        return this._engine.createFrameBuffer(colorTextures[0] ?? null, width, height, generateStencilBuffer, generateDepthBuffer, samples, layers?.[0]);
    }

    public override generateMipMapsForCubemap(_texture: InternalTexture, _unbind = true): void {
        // The WebGL path rebinds gl.TEXTURE_CUBE_MAP and calls gl.generateMipmap; both deref _gl, which is
        // null on Native. bgfx auto-generates the mip chain when a render target texture created with mips is
        // resolved (the same way 2D RTTs get their mips here -- unBindFramebuffer issues no explicit mipgen),
        // so this is a no-op on Native.
    }

    public override bindAttachments(attachments: number[]): void {
        // bgfx has no gl.drawBuffers equivalent, so draw calls always write to every color attachment of
        // the bound framebuffer. Clears, however, can be masked per attachment (bgfx clear color palette),
        // and code such as PrePassRenderer._clear() / ThinDepthPeelingRenderer relies on that.
        //
        // attachments[i] is the attachment index to enable, or -1 to skip (see buildTextureLayout).
        // Do NOT promote "every entry in this array is enabled" to 0xff: OIT passes layout [0] (only
        // the depth attachment) as a length-1 array, and treating that as "all attachments" would
        // clear the shared front/back color MRTs with the depth clear value (-99999).
        let mask = 0;
        for (let i = 0; i < attachments.length; i++) {
            const attachmentIndex = attachments[i];
            if (attachmentIndex >= 0) {
                mask |= 1 << attachmentIndex;
            }
        }

        // An empty layout disables color clears; it must not clear every attachment instead.
        this._clearAttachmentMask = mask;
    }

    public override clearAttachments(
        color: Nullable<IColor4Like>,
        attachments: number[],
        clearColor: boolean,
        clearDepth: boolean,
        clearStencil = false,
        stencilClearValue = 0
    ): void {
        this.bindAttachments(attachments);
        this.clear(color, clearColor, clearDepth, clearStencil, stencilClearValue);
    }

    public override buildTextureLayout(textureStatus: boolean[], _backBufferLayout = false): number[] {
        // Native layouts use attachment indices instead of WebGL draw-buffer enums.
        const result: number[] = [];
        for (let i = 0; i < textureStatus.length; i++) {
            result.push(textureStatus[i] ? i : -1);
        }
        return result;
    }

    public override restoreSingleAttachment(): void {
        // Back to the single-attachment back buffer: no masking (see bindAttachments).
        this._clearAttachmentMask = _AllAttachmentsMask;
    }

    public override restoreSingleAttachmentForRenderTarget(): void {
        // Back to a single-attachment render target: no masking (see bindAttachments).
        this._clearAttachmentMask = _AllAttachmentsMask;
    }

    public override generateMipMapsMultiFramebuffer(_texture: RenderTargetWrapper): void {
        // No-op on Native: bgfx auto-generates mips on render-target resolve (as for 2D/cube RTTs).
    }

    public override resolveMultiFramebuffer(_texture: RenderTargetWrapper): void {
        // No-op on Native: bgfx resolves MSAA render targets automatically.
    }

    public override unBindMultiColorAttachmentFramebuffer(_rtWrapper: RenderTargetWrapper, _disableGenerateMipMaps = false, onBeforeUnbind?: () => void): void {
        this._currentRenderTarget = null;
        if (onBeforeUnbind) {
            onBeforeUnbind();
        }
        this._bindUnboundFramebuffer(null);
    }

    public override updateMultipleRenderTargetTextureSampleCount(rtWrapper: Nullable<RenderTargetWrapper>, samples: number, _initializeBuffers = true): number {
        if (!rtWrapper || rtWrapper.samples === samples) {
            return samples;
        }

        const textures = rtWrapper.textures;
        if (!textures) {
            return rtWrapper.samples;
        }

        const nativeRTWrapper = rtWrapper as NativeRenderTargetWrapper;
        const depthTexture = nativeRTWrapper._depthStencilTexture;
        if (depthTexture?._hardwareTexture && depthTexture.samples !== samples && depthTexture._references > 1) {
            throw new Error("updateMultipleRenderTargetTextureSampleCount: cannot change samples while using a shared depth texture.");
        }

        // bgfx couples MSAA to the texture creation flags (see updateRenderTargetTextureSampleCount), so
        // changing the sample count after the fact requires reissuing every color attachment's underlying
        // bgfx handle with the new MSAA flag. initializeTexture disposes the old handle and allocates a fresh
        // one while preserving the InternalTexture / Graphics::Texture identity; only the internal bgfx handle
        // rotates. Afterwards the framebuffer is recreated so its attachment list refers to the new handles.
        const reinitialized = new Set<InternalTexture>();
        for (const texture of textures) {
            // Wrapped (External-source) textures own an opaque external handle (format=-1); reinitializing
            // would destroy it and getNativeTextureFormat would throw, so leave those attachments untouched.
            // A texture shared by several attachments (different layers/faces) is reinitialized only once.
            if (!texture?._hardwareTexture || texture.source === InternalTextureSource.External || reinitialized.has(texture)) {
                continue;
            }
            reinitialized.add(texture);

            // Keep the full descriptor so cube / 2D-array / 3D attachments keep their dimensionality.
            const nativeTexture = texture._hardwareTexture.underlyingResource;
            const hasMips = this._getRenderTargetHasMips(this._hasMipStorage(texture), samples);
            this._engine.initializeTexture(
                nativeTexture,
                texture.baseWidth,
                texture.baseHeight,
                hasMips,
                getNativeTextureFormat(texture.format, texture.type),
                /*renderTarget*/ true,
                texture._useSRGBBuffer,
                samples,
                texture.isCube,
                texture.is2DArray || texture.is3D ? texture.depth : 0,
                texture.is3D
            );
            texture.samples = samples;
        }

        nativeRTWrapper._samples = samples;
        if (depthTexture?._hardwareTexture && depthTexture.samples !== samples) {
            this._recreateDepthStencilTexture(nativeRTWrapper, samples);
        }
        if (nativeRTWrapper._usesLayeredFramebuffer) {
            // Rebuilt on the next bind with the per-attachment layers/faces (the layout key includes samples).
            nativeRTWrapper._invalidateLayeredFramebuffer();
        } else {
            this._createMultiRenderTargetFramebuffer(nativeRTWrapper);
        }

        return samples;
    }

    public override updateRenderTargetTextureSampleCount(rtWrapper: RenderTargetWrapper, samples: number): number {
        if (rtWrapper.samples === samples) {
            return samples;
        }

        const texture = rtWrapper.texture;
        if (!texture?._hardwareTexture) {
            return rtWrapper.samples;
        }

        // Wrapped (External-source) textures carry an opaque external handle with unknown format/type.
        // Recreating the underlying bgfx texture here would destroy the wrapped handle, breaking the
        // consumer's ownership contract, and getNativeTextureFormat would throw on format=-1 anyway.
        // Reject the request explicitly with a targeted error rather than failing deeper in the stack.
        if (texture.source === InternalTextureSource.External) {
            throw new Error(
                "updateRenderTargetTextureSampleCount: changing MSAA samples is not supported on wrapped (External-source) textures. Dispose and re-wrap with the desired samples."
            );
        }

        const nativeRTWrapper = rtWrapper as NativeRenderTargetWrapper;
        const depthTexture = nativeRTWrapper._depthStencilTexture;
        if (depthTexture?._hardwareTexture && depthTexture.samples !== samples && depthTexture._references > 1) {
            throw new Error("updateRenderTargetTextureSampleCount: cannot change samples while using a shared depth texture.");
        }
        const nativeTexture = texture._hardwareTexture.underlyingResource;

        // bgfx couples MSAA to the texture creation flags, so changing samples after the fact requires
        // recreating the underlying bgfx texture handle with the new MSAA flag. initializeTexture on the
        // Native side calls Graphics::Texture::Create2D, which disposes the existing bgfx handle and
        // allocates a fresh one. The Graphics::Texture / InternalTexture wrapper identity is preserved --
        // only the internal bgfx handle rotates. After the texture is reissued we also recreate the
        // framebuffer so its attachment list refers to the new handle.
        //
        const hasMips = this._getRenderTargetHasMips(this._hasMipStorage(texture), samples);
        const nativeTextureFormat = getNativeTextureFormat(texture.format, texture.type);
        const isCube = texture.isCube;
        const is3D = texture.is3D;
        const layers = texture.is2DArray || is3D ? texture.depth : 0;

        // Lazily-built per-(mip, layer/face) framebuffers reference the texture about to be recreated.
        nativeRTWrapper._releaseLayerFramebuffers();

        this._engine.initializeTexture(
            nativeTexture,
            texture.baseWidth,
            texture.baseHeight,
            hasMips,
            nativeTextureFormat,
            /*renderTarget*/ true,
            texture._useSRGBBuffer,
            samples,
            isCube,
            layers,
            is3D
        );

        rtWrapper._samples = samples;
        texture.samples = samples;

        const hasDepthStencilTexture = !!rtWrapper._depthStencilTexture?._hardwareTexture;
        if (is3D) {
            // 3D render targets render through the per-(mip, layer) framebuffers released above.
            if (hasDepthStencilTexture) {
                this._recreateDepthStencilTexture(nativeRTWrapper, samples);
            }
            return samples;
        }

        if (layers > 0 || isCube) {
            // 2D-array RTTs render through one framebuffer per layer and cube RTTs through one per face (see
            // createRenderTargetTexture / createRenderTargetCubeTexture). The _framebuffers setter releases the stale
            // handles and keeps _framebuffer aliased to the first one for single-target paths.
            nativeRTWrapper._framebuffers = this._createLayerFramebuffers(
                nativeTexture,
                texture.baseWidth,
                texture.baseHeight,
                isCube ? 6 : layers,
                rtWrapper._generateStencilBuffer,
                rtWrapper._generateDepthBuffer && !hasDepthStencilTexture,
                samples,
                texture.generateMipMaps
            );
        } else {
            // NativeRenderTargetWrapper._framebuffer setter releases the old framebuffer before assigning,
            // so no manual _releaseFramebufferObjects call is needed (and would double-delete the handle).
            nativeRTWrapper._framebuffer = this._engine.createFrameBuffer(
                nativeTexture,
                texture.baseWidth,
                texture.baseHeight,
                rtWrapper._generateStencilBuffer,
                rtWrapper._generateDepthBuffer,
                samples
            );
        }

        // A sampleable depth texture must match the new sample count and stay attached to every framebuffer.
        if (hasDepthStencilTexture) {
            this._recreateDepthStencilTexture(nativeRTWrapper, samples);
        }

        return samples;
    }

    public override updateTextureSamplingMode(samplingMode: number, texture: InternalTexture): void {
        if (texture._hardwareTexture) {
            const filter = getNativeSamplingMode(samplingMode);
            this._setTextureSampling(texture._hardwareTexture.underlyingResource, filter);
        }

        texture.samplingMode = samplingMode;
    }

    public override updateTextureWrappingMode(texture: InternalTexture, wrapU: Nullable<number>, wrapV: Nullable<number> = null, wrapR: Nullable<number> = null): void {
        if (wrapU !== null) {
            texture._cachedWrapU = wrapU;
        }
        if (wrapV !== null) {
            texture._cachedWrapV = wrapV;
        }
        if ((texture.is2DArray || texture.is3D) && wrapR !== null) {
            texture._cachedWrapR = wrapR;
        }

        // Apply to the native texture too; axes that were not specified keep their cached (or default) mode.
        const nativeTexture = texture._hardwareTexture?.underlyingResource;
        if (nativeTexture) {
            this._setTextureWrapMode(
                nativeTexture,
                getNativeAddressMode(texture._cachedWrapU ?? Constants.TEXTURE_WRAP_ADDRESSMODE),
                getNativeAddressMode(texture._cachedWrapV ?? Constants.TEXTURE_WRAP_ADDRESSMODE),
                getNativeAddressMode(texture._cachedWrapR ?? Constants.TEXTURE_WRAP_ADDRESSMODE)
            );
        }
    }

    public override bindFramebuffer(
        texture: RenderTargetWrapper,
        faceIndex?: number,
        requiredWidth?: number,
        requiredHeight?: number,
        forceFullscreenViewport?: boolean,
        lodLevel?: number,
        layer?: number
    ): void {
        const nativeRTWrapper = texture as NativeRenderTargetWrapper;

        if (this._currentRenderTarget) {
            this.unBindFramebuffer(this._currentRenderTarget);
        }

        this._currentRenderTarget = texture;

        // Multi render target whose color attachments each target a specific layer/face of a texture: the IBL
        // voxelization MRTs (several Z-slices of one shared 3D texture, routed via is3D) and mixed-type MRTs
        // (2D-array layer / cube face / 2D attachments, routed via _isMixedTypeMRT). The color textures may be
        // swapped in via setInternalTexture after creation, so (re)build the layered multi-attachment
        // framebuffer here from the current textures + their per-attachment layer/face indices.
        if (nativeRTWrapper.isMulti && (nativeRTWrapper.is3D || nativeRTWrapper._isMixedTypeMRT || this._isLayeredFrameGraphMRT(nativeRTWrapper))) {
            this._bindLayeredMultiFramebuffer(nativeRTWrapper);
            this._applyBoundViewport(forceFullscreenViewport);
            return;
        }

        // Single 3D render target (IBL voxel grid + its procedural mip chain): render to the requested
        // (mip, layer) through a lazily-built, cached per-slice framebuffer. requiredWidth/Height carry the
        // mip dimensions for the voxel mip-copy pass (forceFullscreenViewport is always set by that caller).
        if (nativeRTWrapper.is3D) {
            this._bindUnboundFramebuffer(this._get3DLayerFramebuffer(nativeRTWrapper, lodLevel ?? 0, layer ?? 0, requiredWidth, requiredHeight));
            this._applyBoundViewport(forceFullscreenViewport);
            return;
        }

        if (requiredWidth || requiredHeight) {
            throw new Error("Required width/height for frame buffers not yet supported in NativeEngine.");
        }

        // Frame graph render targets are created via createMultipleRenderTarget({ dontCreateTextures: true }),
        // so no bgfx framebuffer is built up-front; the externally-allocated color/depth textures are attached
        // afterwards via setTexture/setDepthStencilTexture. Lazily build a framebuffer from those textures the
        // first time the wrapper is bound. Several wrappers can reference the same underlying texture(s), so the
        // framebuffer is cached on (and shared through) the first color texture's hardware wrapper to avoid each
        // fresh framebuffer/view clearing the texture and clobbering earlier passes.
        if (!nativeRTWrapper._framebuffers && !nativeRTWrapper._framebufferDepthStencil && !nativeRTWrapper._framebuffer) {
            this._buildFrameGraphFramebuffer(nativeRTWrapper);
        }

        if (nativeRTWrapper._framebuffers) {
            // _framebuffers is indexed by cube face for cube render targets, but by array layer for 2D-array
            // render targets (cascaded shadow maps, the atmosphere aerial-perspective LUT). Callers pass the
            // face in `faceIndex` and the array slice in `layer`, so pick whichever applies to this wrapper;
            // indexing a layered target by `faceIndex` bound slice 0 for every layer and left slices 1..N-1
            // unwritten.
            const isCubeTarget = nativeRTWrapper.isCube;
            const framebufferIndex = isCubeTarget ? (faceIndex ?? 0) : layer || faceIndex || 0;

            // Cube render target: bind the framebuffer for the requested face. HDR prefiltering renders each
            // roughness level into its own mip, so for lodLevel > 0 lazily build/cache a per-(face, mip)
            // framebuffer; the pre-built _framebuffers array only targets mip 0.
            if (lodLevel && isCubeTarget) {
                this._bindUnboundFramebuffer(this._getCubeFaceMipFramebuffer(nativeRTWrapper, faceIndex ?? 0, lodLevel));
            } else {
                this._bindUnboundFramebuffer(nativeRTWrapper._framebuffers[Math.min(framebufferIndex, nativeRTWrapper._framebuffers.length - 1)]);
            }
        } else if (faceIndex) {
            throw new Error("Cuboid frame buffers are not yet supported in NativeEngine.");
        } else if (nativeRTWrapper._framebufferDepthStencil) {
            this._bindUnboundFramebuffer(nativeRTWrapper._framebufferDepthStencil);
        } else {
            this._bindUnboundFramebuffer(nativeRTWrapper._framebuffer);
        }

        // Match ThinEngine: re-apply the cached viewport (or the fullscreen override) after a framebuffer bind.
        this._applyBoundViewport(forceFullscreenViewport);
    }

    // Re-apply the engine's cached viewport onto the newly bound framebuffer (WebGL/WebGPU behaviour).
    // forceFullscreenViewport paints 0..1 without clobbering _cachedViewport, matching ThinEngine's
    // use of _viewport() for the fullscreen path.
    private _applyBoundViewport(forceFullscreenViewport?: boolean): void {
        if (this._cachedViewport && !forceFullscreenViewport) {
            this.setViewport(this._cachedViewport);
            return;
        }
        if (forceFullscreenViewport) {
            const cached = this._cachedViewport;
            this.setViewport(_FullscreenViewport);
            this._cachedViewport = cached;
        }
    }

    // Returns (building + caching on first use) the bgfx framebuffer that targets a single (mip, layer)
    // slice of a 3D render-target texture. Used by the IBL voxel grid + procedural mip chain, whose
    // ProceduralTexture / mip-copy passes render one Z-slice at a time via bindFramebuffer(lodLevel, layer).
    private _get3DLayerFramebuffer(nativeRTWrapper: NativeRenderTargetWrapper, mip: number, layer: number, requiredWidth?: number, requiredHeight?: number): NativeFramebuffer {
        if (!nativeRTWrapper._layerFramebuffers) {
            nativeRTWrapper._layerFramebuffers = new Map<number, NativeFramebuffer>();
        }
        const key = mip * nativeRTWrapper.depth + layer;
        let framebuffer = nativeRTWrapper._layerFramebuffers.get(key);
        if (!framebuffer) {
            const nativeTexture = nativeRTWrapper.texture!._hardwareTexture!.underlyingResource;
            const depthTexture = nativeRTWrapper._depthStencilTexture;
            const nativeDepth = depthTexture?._hardwareTexture?.underlyingResource;
            const width = requiredWidth || Math.max(1, nativeRTWrapper.width >> mip);
            const height = requiredHeight || Math.max(1, nativeRTWrapper.height >> mip);
            if (nativeDepth) {
                this._assertVolumeDepthAttachmentSupported();
                // createMultiFrameBuffer has no mip selector and the explicit depth texture only covers mip 0.
                if (mip !== 0) {
                    throw new Error("NativeEngine: explicit depth attachments on volume render targets only support rendering to mip 0.");
                }
                // generateDepth must be set so a depth texture without a native handle yet (created directly on this
                // volume) is allocated and aliased by the first slice; later slices borrow the existing handle.
                framebuffer = this._engine.createMultiFrameBuffer!(
                    [nativeTexture],
                    width,
                    height,
                    HasStencilAspect(depthTexture.format),
                    true,
                    nativeRTWrapper.samples,
                    [layer],
                    nativeDepth
                );
                this._setTextureSampling(nativeDepth, getNativeSamplingMode(depthTexture.samplingMode));
                this.updateTextureComparisonFunction(depthTexture, depthTexture._comparisonFunction);
            } else {
                framebuffer = this._engine.createFrameBuffer(
                    nativeTexture,
                    width,
                    height,
                    nativeRTWrapper._generateStencilBuffer,
                    nativeRTWrapper._generateDepthBuffer,
                    nativeRTWrapper.samples,
                    layer,
                    mip
                );
            }
            nativeRTWrapper._layerFramebuffers.set(key, framebuffer);
        }
        return framebuffer;
    }

    // Returns (building + caching on first use) the bgfx framebuffer that targets a single (face, mip) of a
    // cube render-target texture. Used by HDR radiance/irradiance prefiltering, whose face×mip loop renders
    // an increasingly-rough convolution of the environment into each mip via bindFramebuffer(faceIndex, lod).
    // The pre-built _framebuffers array only covers mip 0, so mips > 0 are built here on demand.
    private _getCubeFaceMipFramebuffer(nativeRTWrapper: NativeRenderTargetWrapper, face: number, mip: number): NativeFramebuffer {
        // An explicit (sampleable) depth texture only covers mip 0 and native framebuffers cannot select a depth mip,
        // so a per-mip framebuffer would silently render against unrelated depth instead of the attached texture.
        if (nativeRTWrapper._depthStencilTexture) {
            throw new Error("NativeEngine: explicit depth attachments on cube render targets only support rendering to mip 0.");
        }
        if (!nativeRTWrapper._layerFramebuffers) {
            nativeRTWrapper._layerFramebuffers = new Map<number, NativeFramebuffer>();
        }
        const key = mip * 6 + face;
        let framebuffer = nativeRTWrapper._layerFramebuffers.get(key);
        if (!framebuffer) {
            const nativeTexture = nativeRTWrapper.texture!._hardwareTexture!.underlyingResource;
            const width = Math.max(1, nativeRTWrapper.width >> mip);
            const height = Math.max(1, nativeRTWrapper.height >> mip);
            framebuffer = this._engine.createFrameBuffer(
                nativeTexture,
                width,
                height,
                nativeRTWrapper._generateStencilBuffer,
                nativeRTWrapper._generateDepthBuffer,
                nativeRTWrapper.samples,
                face,
                mip,
                nativeRTWrapper.texture!.generateMipMaps
            );
            nativeRTWrapper._layerFramebuffers.set(key, framebuffer);
        }
        return framebuffer;
    }

    // A frame-graph multi-render-target wrapper is created via createMultipleRenderTarget({dontCreateTextures:
    // true}) WITHOUT targetTypes/layerIndex/faceIndex, so it is never flagged _isMixedTypeMRT at creation: its
    // color textures (setTexture) and per-attachment layer/face indices (setLayerAndFaceIndex, from the render
    // pass's setOutputLayerAndFaceIndices) are assigned afterwards. Detect the layered case at bind time so it
    // routes through _bindLayeredMultiFramebuffer (which renders each draw buffer into the correct 2D-array
    // layer / cube face) instead of the flat _buildFrameGraphFramebuffer (which would bind layer 0 of every
    // attachment and duplicate a shared array/cube resource, leaving the extra targets unwritten).
    private _isLayeredFrameGraphMRT(wrapper: NativeRenderTargetWrapper): boolean {
        const textures = wrapper.textures;
        if (!textures || textures.length === 0) {
            return false;
        }
        for (const tex of textures) {
            if (tex && (tex.isCube || tex.is2DArray || tex.is3D)) {
                return true;
            }
        }
        const faceIndices = wrapper.faceIndices;
        if (faceIndices) {
            for (const face of faceIndices) {
                if (face) {
                    return true;
                }
            }
        }
        const layerIndices = wrapper.layerIndices;
        if (layerIndices) {
            for (const layer of layerIndices) {
                if (layer) {
                    return true;
                }
            }
        }
        return false;
    }

    // (Re)builds and binds the multi-attachment framebuffer for a layered MRT: either an IBL voxelization MRT
    // (color attachments are distinct Z-slices of one shared 3D texture) or a mixed-type MRT (color attachments
    // are specific layers of 2D-array textures and/or faces of cube textures, plus plain 2D). Textures may be
    // assigned via setInternalTexture and layers/faces retargeted via setLayerAndFaceIndex after creation, so the
    // framebuffer is built lazily here and rebuilt whenever its attachment layout changes.
    private _bindLayeredMultiFramebuffer(nativeRTWrapper: NativeRenderTargetWrapper): void {
        const textures = nativeRTWrapper.textures;
        const layerIndices = nativeRTWrapper.layerIndices;
        const expectedCount = nativeRTWrapper._attachments?.length ?? textures?.length ?? 0;
        if (!textures || textures.length < expectedCount) {
            throw new Error("NativeEngine: cannot bind a layered MRT until every color attachment is assigned.");
        }

        const depth = nativeRTWrapper._depthStencilTexture?._hardwareTexture?.underlyingResource as NativeTexture | undefined;
        const samples = nativeRTWrapper.samples;
        const key = nativeRTWrapper._layeredFramebufferKey;
        let upToDate = !!nativeRTWrapper._framebuffer && !!key && key.depth === depth && key.samples === samples && key.colors.length === expectedCount;

        for (let i = 0; i < expectedCount; i++) {
            const tex = textures[i];
            const nativeTexture = tex?._hardwareTexture?.underlyingResource;
            if (!nativeTexture) {
                throw new Error("NativeEngine: cannot bind a layered MRT until every color attachment is assigned.");
            }
            const attachmentLayer = tex.is3D ? (layerIndices?.[i] ?? i) : nativeRTWrapper.getBaseArrayLayer(i);
            if (upToDate && (key!.colors[i] !== nativeTexture || key!.layers[i] !== attachmentLayer)) {
                upToDate = false;
            }
        }

        if (!upToDate) {
            const colorTextures: NativeTexture[] = new Array(expectedCount);
            const layers: number[] = new Array(expectedCount);
            for (let i = 0; i < expectedCount; i++) {
                const tex = textures[i]!;
                colorTextures[i] = tex._hardwareTexture!.underlyingResource;
                layers[i] = tex.is3D ? (layerIndices?.[i] ?? i) : nativeRTWrapper.getBaseArrayLayer(i);
            }
            nativeRTWrapper._framebuffer = this._createNativeMultiFrameBuffer(
                colorTextures,
                nativeRTWrapper.width,
                nativeRTWrapper.height,
                this._getDepthAttachmentStencil(nativeRTWrapper),
                !!depth || nativeRTWrapper._generateDepthBuffer,
                samples,
                layers,
                depth
            );
            nativeRTWrapper._layeredFramebufferKey = { colors: colorTextures, layers, depth, samples };
            this._applyDepthTextureSampling(nativeRTWrapper);
        }
        this._bindUnboundFramebuffer(nativeRTWrapper._framebuffer);
    }

    public override unBindFramebuffer(texture: RenderTargetWrapper, disableGenerateMipMaps = false, onBeforeUnbind?: () => void): void {
        // NOTE: Disabling mipmap generation is not yet supported in NativeEngine.

        this._currentRenderTarget = null;

        if (onBeforeUnbind) {
            onBeforeUnbind();
        }

        this._bindUnboundFramebuffer(null);
    }

    public override createDynamicVertexBuffer(data: DataArray): DataBuffer {
        return this.createVertexBuffer(data, true);
    }

    public override updateDynamicIndexBuffer(indexBuffer: DataBuffer, indices: IndicesArray, offset: number = 0): void {
        const buffer = indexBuffer as NativeDataBuffer;
        const data = this._normalizeIndexData(indices);
        buffer.is32Bits = data.BYTES_PER_ELEMENT === 4;
        this._engine.updateDynamicIndexBuffer(buffer.nativeIndexBuffer!, data.buffer, data.byteOffset, data.byteLength, offset);
    }

    public override updateDynamicVertexBuffer(vertexBuffer: DataBuffer, data: DataArray, byteOffset = 0, byteLength?: number): void {
        const buffer = vertexBuffer as NativeDataBuffer;
        const dataView = data instanceof Array ? new Float32Array(data) : ArrayBuffer.isView(data) ? data : new Uint8Array(data);
        const byteView = new Uint8Array(dataView.buffer, dataView.byteOffset, byteLength ?? dataView.byteLength);
        this._engine.updateDynamicVertexBuffer(buffer.nativeVertexBuffer!, byteView.buffer, byteView.byteOffset, byteView.byteLength, byteOffset);
    }

    // TODO: Refactor to share more logic with base Engine implementation.
    /**
     * @internal
     */
    public override _setTexture(channel: number, texture: Nullable<BaseTexture>, isPartOfTextureArray = false, depthStencilTexture = false): boolean {
        const uniform = this._boundUniforms[channel] as unknown as NativeUniform;
        if (!uniform) {
            return false;
        }

        // Not ready?
        if (!texture) {
            if (this._boundTexturesCache[channel] != null) {
                this._activeChannel = channel;
                this._boundTexturesCache[channel] = null;
                this._unsetNativeTexture(uniform);
            }
            return false;
        }

        // Video
        if ((<VideoTexture>texture).video) {
            this._activeChannel = channel;
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
            internalTexture = this.emptyCubeTexture;
        } else if (texture.is3D) {
            internalTexture = this.emptyTexture3D;
        } else if (texture.is2DArray) {
            internalTexture = this.emptyTexture2DArray;
        } else {
            internalTexture = this.emptyTexture;
        }

        this._activeChannel = channel;

        if (!internalTexture || !internalTexture._hardwareTexture) {
            return false;
        }

        this._setTextureWrapMode(
            internalTexture._hardwareTexture.underlyingResource,
            getNativeAddressMode(texture.wrapU),
            getNativeAddressMode(texture.wrapV),
            getNativeAddressMode(texture.wrapR)
        );
        this._updateAnisotropicLevel(texture);

        this._setNativeTexture(uniform, internalTexture._hardwareTexture.underlyingResource);

        return true;
    }

    // filter is a NativeFilter.XXXX value.
    private _setTextureSampling(texture: NativeTexture, filter: number) {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETTEXTURESAMPLING);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(texture);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(filter);
        this._commandBufferEncoder.finishEncodingCommand();
    }

    // addressModes are NativeAddressMode.XXXX values.
    private _setTextureWrapMode(texture: NativeTexture, addressModeU: number, addressModeV: number, addressModeW: number) {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETTEXTUREWRAPMODE);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(texture);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(addressModeU);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(addressModeV);
        this._commandBufferEncoder.encodeCommandArgAsUInt32(addressModeW);
        this._commandBufferEncoder.finishEncodingCommand();
    }

    private _setNativeTexture(uniform: NativeUniform, texture: NativeTexture) {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETTEXTURE);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(texture);
        this._commandBufferEncoder.finishEncodingCommand();
    }

    private _unsetNativeTexture(uniform: NativeUniform) {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_UNSETTEXTURE);
        this._commandBufferEncoder.encodeCommandArgAsNativeData(uniform);
        this._commandBufferEncoder.finishEncodingCommand();
    }

    // TODO: Share more of this logic with the base implementation.
    // TODO: Rename to match naming in base implementation once refactoring allows different parameters.
    private _updateAnisotropicLevel(texture: BaseTexture) {
        const internalTexture = texture.getInternalTexture();
        const value = texture.anisotropicFilteringLevel;

        if (!internalTexture || !internalTexture._hardwareTexture) {
            return;
        }

        if (internalTexture._cachedAnisotropicFilteringLevel !== value) {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_SETTEXTUREANISOTROPICLEVEL);
            this._commandBufferEncoder.encodeCommandArgAsNativeData(internalTexture._hardwareTexture.underlyingResource);
            this._commandBufferEncoder.encodeCommandArgAsUInt32(value);
            this._commandBufferEncoder.finishEncodingCommand();
            internalTexture._cachedAnisotropicFilteringLevel = value;
        }
    }

    /**
     * @internal
     */
    public override _bindTexture(channel: number, texture: Nullable<InternalTexture>): void {
        const uniform = this._boundUniforms[channel] as unknown as NativeUniform;
        if (!uniform) {
            return;
        }

        if (texture && texture._hardwareTexture) {
            const underlyingResource = texture._hardwareTexture.underlyingResource;
            this._setNativeTexture(uniform, underlyingResource);
        } else {
            this._unsetNativeTexture(uniform);
        }
    }

    /**
     * @internal
     */
    public override _bindTextureDirectly(_target: number, _texture: Nullable<InternalTexture>, _forTextureDataUpdate = false, _force = false): boolean {
        // Generic texture loaders use this WebGL-shaped method around direct uploads. Native upload commands
        // already receive the destination texture explicitly, so there is no bind operation to perform.
        return false;
    }

    /**
     * Unbind all textures
     */
    public override unbindAllTextures(): void {
        this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DISCARDALLTEXTURES);
        this._commandBufferEncoder.finishEncodingCommand();
    }

    protected override _deleteBuffer(buffer: NativeDataBuffer): void {
        if (buffer.nativeIndexBuffer) {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DELETEINDEXBUFFER);
            this._commandBufferEncoder.encodeCommandArgAsNativeData(buffer.nativeIndexBuffer);
            this._commandBufferEncoder.finishEncodingCommand();
            delete buffer.nativeIndexBuffer;
        }

        if (buffer.nativeVertexBuffer) {
            this._commandBufferEncoder.startEncodingCommand(_native.Engine.COMMAND_DELETEVERTEXBUFFER);
            this._commandBufferEncoder.encodeCommandArgAsNativeData(buffer.nativeVertexBuffer);
            this._commandBufferEncoder.finishEncodingCommand();
            delete buffer.nativeVertexBuffer;
        }
    }

    /**
     * Create a canvas
     * @param width width
     * @param height height
     * @returns ICanvas interface
     */
    public override createCanvas(width: number, height: number): ICanvas {
        if (!_native.Canvas) {
            throw new Error("Native Canvas plugin not available.");
        }
        const canvas = new _native.Canvas();
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    /**
     * Create an image to use with canvas
     * @returns IImage interface
     */
    public override createCanvasImage(): IImage {
        if (!_native.Image) {
            throw new Error("Native Canvas plugin not available.");
        }
        const image = new _native.Image();
        return image;
    }

    /**
     * Create a 2D path to use with canvas
     * @returns IPath2D interface
     * @param d SVG path string
     */
    public override createCanvasPath2D(d?: string): IPath2D {
        if (!_native.Path2D) {
            throw new Error("Native Canvas plugin not available.");
        }
        const path2d = new _native.Path2D(d);
        return path2d;
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
    public override updateTextureData(
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
        if (!texture._hardwareTexture) {
            return;
        }

        if (!this._engine.updateTextureData) {
            throw new Error("updateTextureData not implemented.");
        }

        // bgfx updates the requested sub-rectangle of the existing texture (faceIndex selects the cube
        // face / array layer, lod selects the mip level). invertY is forwarded so the native side can match
        // the vertical orientation the base texture upload uses. Native rebuilds mips from a full level only, so
        // generateMipMaps is ignored for partial updates.
        const fullLevel = xOffset === 0 && yOffset === 0 && width === Math.max(1, texture.width >> lod) && height === Math.max(1, texture.height >> lod);
        this._engine.updateTextureData(
            texture._hardwareTexture.underlyingResource,
            imageData,
            xOffset,
            yOffset,
            width,
            height,
            faceIndex,
            lod,
            texture.invertY,
            generateMipMaps && fullLevel
        );
    }

    /**
     * @internal
     */
    public override _uploadCompressedDataToTextureDirectly(
        texture: InternalTexture,
        internalFormat: number,
        width: number,
        height: number,
        data: ArrayBufferView,
        faceIndex: number = 0,
        lod: number = 0
    ) {
        throw new Error("_uploadCompressedDataToTextureDirectly not implemented.");
    }

    /**
     * @internal
     */
    public override _uploadDataToTextureDirectly(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0): void {
        if (!texture._hardwareTexture) {
            return;
        }

        const underlyingResource = texture._hardwareTexture.underlyingResource;

        // Per-mip uploads (e.g. KTX2 decoded mip levels, called with that mip's dimensions in texture.width/height)
        // update only the requested level of the texture allocated by the lod 0 upload. Older runtimes without
        // updateTextureData cannot preserve authored mip content, so fail the load instead of silently
        // substituting a chain generated from lod 0.
        if (lod > 0) {
            if (!this._engine.updateTextureData) {
                throw new Error("NativeEngine._uploadDataToTextureDirectly: uploading mip levels above 0 requires a Babylon Native runtime with updateTextureData.");
            }
            this._engine.updateTextureData(underlyingResource, imageData, 0, 0, texture.width, texture.height, faceIndex, lod, texture.invertY, false);
            return;
        }

        texture.baseWidth = texture.width;
        texture.baseHeight = texture.height;

        // Upload raw pixel data (e.g. the decoded IES profile: a single-channel FLOAT texture) into the
        // native texture. Mirrors updateRawTexture. Like texImage2D, Native reads only the texels it needs from a
        // larger buffer.
        this._engine.loadRawTexture(
            underlyingResource,
            imageData,
            texture.width,
            texture.height,
            getNativeTextureFormat(texture.format, texture.type),
            texture.generateMipMaps,
            texture.invertY,
            texture._useSRGBBuffer
        );
    }

    /**
     * @internal
     */
    public override _uploadArrayBufferViewToTexture(texture: InternalTexture, imageData: ArrayBufferView, faceIndex: number = 0, lod: number = 0): void {
        throw new Error("_uploadArrayBufferViewToTexture not implemented.");
    }

    public override getFontOffset(font: string): { ascent: number; height: number; descent: number } {
        // Match the browser's font line box for GUI layout, not just the ink in "Hg".
        // Older Canvas runtimes may expose only glyph bounds.
        try {
            if (!this._fontMeasureContext) {
                this._fontMeasureCanvas = this.createCanvas(64, 64);
                this._fontMeasureContext = this._fontMeasureCanvas.getContext("2d");
            }
            const context = this._fontMeasureContext;
            context.font = font;
            const metrics: Partial<TextMetrics> = context.measureText("Hg");
            const ascent = Number(metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent);
            const descent = Number(metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent);
            if (isFinite(ascent) && isFinite(descent) && ascent + descent > 0) {
                return { ascent, height: ascent + descent, descent };
            }
        } catch (error) {
            Logger.Warn(`Native font measurement failed; using an estimated line height: ${String(error)}`, 1);
        }

        // No canvas or an unmeasurable font: approximate from the CSS px size the same way the
        // shared GetFallbackFontOffset does, so text still gets a sane non-zero line height.
        const match = /(?:^|\s)([0-9]+(?:\.[0-9]+)?)px(?:\/|\s|$)/.exec(String(font || ""));
        const size = Math.max(1, match ? parseFloat(match[1]) : 12);
        const ascent = size * 0.8;
        const descent = size * 0.2;
        return { ascent, height: ascent + descent, descent };
    }

    /**
     * No equivalent for native. Do nothing.
     */
    public override flushFramebuffer(): void {}

    // eslint-disable-next-line @typescript-eslint/promise-function-async
    public override _readTexturePixels(
        texture: InternalTexture,
        width: number,
        height: number,
        faceIndex?: number,
        level?: number,
        buffer?: Nullable<ArrayBufferView<ArrayBuffer>>,
        _flushRenderer?: boolean,
        _noDataConversion?: boolean,
        x?: number,
        y?: number
    ): Promise<ArrayBufferView> {
        if (faceIndex !== undefined && faceIndex !== -1 && (faceIndex < 0 || faceIndex > 5)) {
            throw new Error(`Invalid cubemap face index ${faceIndex}; expected 0-5 or -1.`);
        }

        return (
            (this._engine.readTexture2 ?? this._engine.readTexture)
                .call(
                    this._engine,
                    texture._hardwareTexture?.underlyingResource,
                    level ?? 0,
                    x ?? 0,
                    y ?? 0,
                    width,
                    height,
                    buffer?.buffer ?? null,
                    buffer?.byteOffset ?? 0,
                    buffer?.byteLength ?? 0,
                    faceIndex ?? -1
                )
                // eslint-disable-next-line github/no-then
                .then((rawBuffer) => {
                    if (!buffer) {
                        // Legacy readTexture returns RGBA8; readTexture2 preserves float sources as RGBA32F.
                        buffer = rawBuffer.byteLength === 16 * width * height ? new Float32Array(rawBuffer) : new Uint8Array(rawBuffer);
                    }

                    return buffer;
                })
        );
    }

    override startTimeQuery(): Nullable<_TimeToken> {
        if (!this._gpuFrameTimeToken) {
            this._gpuFrameTimeToken = new _TimeToken();
        }

        // Always return the same time token. For native, we don't need a start marker, we just query for native frame stats.
        return this._gpuFrameTimeToken;
    }

    override endTimeQuery(token: _TimeToken): int {
        this._engine.populateFrameStats(this._frameStats);
        return this._frameStats.gpuTimeNs;
    }
}
