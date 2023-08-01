import { Effect } from "core/Materials/effect";
import type { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import type { Nullable } from "core/types";
import type { IShaderProcessor } from "core/Engines/Processors/iShaderProcessor";
import type { UniformBuffer } from "core/Materials/uniformBuffer";
import { Observable } from "core/Misc/observable";
import { GEQUAL, LEQUAL, TEXTUREFORMAT_RGBA, TEXTURETYPE_UNSIGNED_INT, TEXTURE_NEAREST_SAMPLINGMODE } from "./engine.constants";
import { PrecisionDate } from "core/Misc";
import type { StorageBuffer } from "core/Buffers";
import type { EngineOptions } from "core/Engines/thinEngine";
import type { EngineCapabilities } from "core/Engines/engineCapabilities";
import type { EngineFeatures } from "core/Engines/engineFeatures";
import type { DepthCullingState } from "core/States/depthCullingState";
import type { StencilStateComposer } from "core/States/stencilStateComposer";
import type { StencilState } from "core/States/stencilState";
import type { AlphaState } from "core/States/alphaCullingState";
import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import type { IDrawContext } from "core/Engines/IDrawContext";
import type { IMaterialContext } from "core/Engines/IMaterialContext";
import type { IViewportLike } from "core/Maths/math.like";
import type { ICanvas, ICanvasRenderingContext } from "core/Engines/ICanvas";
import type { IFileRequest } from "core/Misc/fileRequest";
import type { IRawTextureEngineExtension } from "./Extensions/engine.rawTexture";
import type { Texture } from "core/Materials/Textures/texture";
import { EngineType } from "./engine.interfaces";

const activeRequests: WeakMap<any, IFileRequest> = new WeakMap();

/**
 * Information about the current host
 */
export interface HostInformation {
    /**
     * Defines if the current host is a mobile
     */
    isMobile: boolean;
}

interface IBaseEnginePrivate {
    _useReverseDepthBuffer: boolean;
    _frameId: number;
    _onContextLost: (evt: Event) => void;
    _onContextRestored: (evt: Event) => void;
    _currentTextureChannel: number;
    _vertexAttribArraysEnabled: boolean[];

    // _vaoRecordInProgress // moved to webgl

    _emptyTexture: Nullable<InternalTexture>;
    _emptyCubeTexture: Nullable<InternalTexture>;
    _emptyTexture3D: Nullable<InternalTexture>;
    _emptyTexture2DArray: Nullable<InternalTexture>;
    // _activeRequests - moved to the scope of this file, privately. Maps object to IFileRequest.
}

export interface IBaseEngineProtected {
    _type: EngineType;
    _isDisposed: boolean;
    _shaderProcessor: Nullable<IShaderProcessor>;
    _renderingCanvas: Nullable<HTMLCanvasElement>;
    _windowIsBackground: boolean;
    _creationOptions: EngineOptions; // TODO?
    _audioContext: Nullable<AudioContext>;
    _audioDestination: Nullable<AudioDestinationNode | MediaStreamAudioDestinationNode>;
    _highPrecisionShadersAllowed: boolean;
    _isStencilEnable: boolean;
    _renderingQueueLaunched: boolean;
    _activeRenderLoops: Array<() => void>;
    _contextWasLost: boolean;
    _colorWrite: boolean;
    _colorWriteChanged: boolean;
    _depthCullingState: DepthCullingState;
    _stencilStateComposer: StencilStateComposer;
    _stencilState: StencilState;
    _activeChannel: number;
    _boundTexturesCache: { [key: string]: Nullable<InternalTexture> };
    _currentEffect: Nullable<Effect>;
    _compiledEffects: { [key: string]: Effect };
    _cachedViewport: Nullable<IViewportLike>;
    _workingCanvas: Nullable<ICanvas>;
    _workingContext: Nullable<ICanvasRenderingContext>;
    _lastDevicePixelRatio: number;
    _shaderPlatformName: string; // feels redundant
}

export interface IBaseEngineInternals {
    // description: string;
    _version: number;
    _frameId: number;
    _uniformBuffers: Array<UniformBuffer>;
    _storageBuffers: Array<StorageBuffer>;
    _uniqueId: number;
    _shouldUseHighPrecisionShader: boolean;
    _badOS?: boolean;
    _badDesktopOS?: boolean;
    _hardwareScalingLevel: number;
    _caps: EngineCapabilities; // TODO
    _features: EngineFeatures;
    _videoTextureSupported: boolean;
    _alphaState: AlphaState;
    _alphaMode: number;
    _alphaEquation: number;
    _internalTexturesCache: Array<InternalTexture>;
    _renderTargetWrapperCache: Array<RenderTargetWrapper>;
    _currentDrawContext: IDrawContext;
    _currentMaterialContext: IMaterialContext;
    _currentRenderTarget: Nullable<RenderTargetWrapper>;
    _boundRenderFunction: Function;
    _frameHandler: number;
    _transformTextureUrl: Nullable<(url: string) => string>; // can move out?
    // replacing _framebufferDimensionsObject
    _renderWidthOverride: Nullable<{ width: number; height: number }>;
}

/**
 * Engine state's public API.
 */
export interface IBaseEnginePublic {
    /**
     * The base functionality of this engine. Can be overwritten or populated by other init functions.
     */
    // module: Partial<IEngineModule>;
    /**
     * Returns a string describing the current engine
     */
    readonly description: string;
    /**
     * Gets or sets the name of the engine
     */
    name: string;
    /**
     * Returns the version of the engine, depending on its type
     */
    // readonly version: number; // No real need for that in the public API
    /**
     * Returns a boolean whether this engine is disposed
     */
    readonly isDisposed: boolean;
    /**
     * Gets or sets a boolean that indicates if textures must be forced to power of 2 size even if not required
     */
    forcePOTTextures: boolean;
    /**
     * Gets a boolean indicating if the engine is currently rendering in fullscreen mode
     */
    isFullscreen: boolean;
    /**
     * Gets or sets a boolean indicating if back faces must be culled. If false, front faces are culled instead (true by default)
     * If non null, this takes precedence over the value from the material
     */
    cullBackFaces: Nullable<boolean>;

    /**
     * Gets or sets a boolean indicating if the engine must keep rendering even if the window is not in foreground
     */
    renderEvenInBackground: boolean;

    /**
     * Gets or sets a boolean indicating that cache can be kept between frames
     */
    preventCacheWipeBetweenFrames: boolean;

    /** Gets or sets a boolean indicating if the engine should validate programs after compilation */
    validateShaderPrograms: boolean;

    /**
     * Gets or sets a boolean indicating if depth buffer should be reverse, going from far to near.
     * This can provide greater z depth for distant objects.
     */
    useReverseDepthBuffer: boolean;

    /**
     * Indicates if the z range in NDC space is 0..1 (value: true) or -1..1 (value: false)
     */
    readonly isNDCHalfZRange: boolean;

    /**
     * Indicates that the origin of the texture/framebuffer space is the bottom left corner. If false, the origin is top left
     */
    readonly hasOriginBottomLeft: boolean;

    /**
     * Gets or sets a boolean indicating that uniform buffers must be disabled even if they are supported
     */
    disableUniformBuffers: boolean;

    /**
     * An event triggered when the engine is disposed.
     */
    readonly onDisposeObservable: Observable<IBaseEnginePublic>;
    /**
     * Gets the current frame id
     */
    readonly frameId: number;
    /**
     * The time (in milliseconds elapsed since the current page has been loaded) when the engine was initialized
     */
    readonly startTime: number;

    /**
     * Gets a boolean indicating that the engine supports uniform buffers
     * @see https://doc.babylonjs.com/setup/support/webGL2#uniform-buffer-objets
     */
    readonly supportsUniformBuffers: boolean;

    /**
     * Gets a boolean indicating that only power of 2 textures are supported
     * Please note that you can still use non power of 2 textures but in this case the engine will forcefully convert them
     */
    readonly needPOTTextures: boolean;

    /**
     * Gets the list of current active render loop functions
     */
    readonly activeRenderLoops: Array<() => void>;

    /**
     * Observable signaled when a context lost event is raised
     */
    onContextLostObservable: Observable<IBaseEnginePublic>;

    /**
     * Observable signaled when a context restored event is raised
     */
    onContextRestoredObservable: Observable<IBaseEnginePublic>;

    /**
     * Gets or sets a boolean indicating if resources should be retained to be able to handle context lost events
     * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene#handling-webgl-context-lost
     */
    doNotHandleContextLost: boolean;

    /**
     * Gets or sets a boolean indicating that vertex array object must be disabled even if they are supported
     */
    disableVertexArrayObjects: boolean;

    /**
     * If set to true zooming in and out in the browser will rescale the hardware-scaling correctly.
     */
    adaptToDeviceRatio: boolean;

    /**
     * Gets information about the current host
     */
    hostInformation: HostInformation; // REDUNDANT!! can move to top level
    /**
     * Gets the current viewport
     */
    readonly currentViewport: Nullable<IViewportLike>;

    /**
     * Defines whether the engine has been created with the premultipliedAlpha option on or not.
     */
    premultipliedAlpha: boolean;

    /**
     * Observable event triggered before each texture is initialized
     */
    onBeforeTextureInitObservable: Observable<Texture>;

    /**
     * Gets a boolean indicating if the engine runs in WebGPU or not.
     */
    readonly isWebGPU: boolean;

    /**
     * Gets the shader platform name used by the effects.
     */
    readonly shaderPlatformName: string;
}

export type BaseEngineState = IBaseEnginePublic & IBaseEngineInternals & IBaseEngineProtected;
export type BaseEngineStateFull = BaseEngineState & IBaseEnginePrivate;

let engineCounter = 0;

/**
 * @internal
 */
export function initBaseEngineState(overrides?: Partial<BaseEngineState>): BaseEngineState {
    const engineState: BaseEngineStateFull = {
        // module: {},
        _uniqueId: engineCounter++,
        description: "Babylon.js Base Engine",
        name: "Base",
        _version: 1,
        _isDisposed: false,
        get isDisposed(): boolean {
            return engineState._isDisposed;
        },
        forcePOTTextures: false,
        isFullscreen: false,
        cullBackFaces: null,
        renderEvenInBackground: true,
        preventCacheWipeBetweenFrames: false,
        validateShaderPrograms: false,
        _useReverseDepthBuffer: false,
        get useReverseDepthBuffer(): boolean {
            return engineState._useReverseDepthBuffer;
        },
        set useReverseDepthBuffer(useReverse: boolean) {
            if (useReverse === engineState._useReverseDepthBuffer) {
                return;
            }

            engineState._useReverseDepthBuffer = useReverse;

            if (useReverse) {
                engineState._depthCullingState.depthFunc = GEQUAL;
            } else {
                engineState._depthCullingState.depthFunc = LEQUAL;
            }
        },
        isNDCHalfZRange: false,
        hasOriginBottomLeft: true,
        disableUniformBuffers: false,
        onDisposeObservable: new Observable<IBaseEnginePublic>(),
        _frameId: 0,
        get frameId(): number {
            return engineState._frameId;
        },
        startTime: PrecisionDate.Now,
        get needPOTTextures(): boolean {
            return engineState.forcePOTTextures;
        },
        _renderingQueueLaunched: false,
        _activeRenderLoops: new Array<() => void>(),
        get activeRenderLoops(): Array<() => void> {
            return engineState._activeRenderLoops;
        },
        onContextLostObservable: new Observable<IBaseEnginePublic>(),
        onContextRestoredObservable: new Observable<IBaseEnginePublic>(),
        doNotHandleContextLost: false,
        disableVertexArrayObjects: false,
        adaptToDeviceRatio: false,
        hostInformation: {
            isMobile: false,
        },
        get currentViewport() {
            return engineState._cachedViewport;
        },
        premultipliedAlpha: true,
        onBeforeTextureInitObservable: new Observable<Texture>(),
        get isWebGPU(): boolean {
            return engineState._type === EngineType.WEBGPU;
        },
        get shaderPlatformName(): string {
            return engineState._shaderPlatformName;
        },
        get supportsUniformBuffers(): boolean {
            return false;
        },

        // internals
        _uniformBuffers: [],
        _storageBuffers: [],
        _windowIsBackground: false,
        get _shouldUseHighPrecisionShader(): boolean {
            return !!(engineState._caps.highPrecisionShaderSupported && engineState._highPrecisionShadersAllowed);
        },
        _badOS: false,
        _badDesktopOS: false,
        _contextWasLost: false,
        _internalTexturesCache: [],
        _renderTargetWrapperCache: [],
        _activeChannel: 0,
        _currentTextureChannel: -1,
        _boundTexturesCache: {},
        _compiledEffects: {},
        _vertexAttribArraysEnabled: [],
        _lastDevicePixelRatio: 1,
        _transformTextureUrl: null, // can be moved out, probably
        _renderWidthOverride: null,
    };

    // TODO is getOwnPropertyDescriptors supported in native? if it doesn't we will need to use getOwnPropertyNames
    // Extend the engine state with the overrides
    Object.defineProperties(engineState, Object.getOwnPropertyDescriptors(overrides));

    // TODO - this actually prevents tree shaking. Should be done by the dev, apart from the most basic functions.
    // populateBaseModule(engineState);

    return engineState;
}

function _rebuildInternalTextures(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineState;
    const currentState = fes._internalTexturesCache.slice(); // Do a copy because the rebuild will add proxies

    for (const internalTexture of currentState) {
        internalTexture._rebuild();
    }
}

function _rebuildRenderTargetWrappers(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineState;
    const currentState = fes._renderTargetWrapperCache.slice(); // Do a copy because the rebuild will add proxies

    for (const renderTargetWrapper of currentState) {
        renderTargetWrapper._rebuild();
    }
}

function _rebuildEffects(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineState;
    for (const key in fes._compiledEffects) {
        const effect = <Effect>fes._compiledEffects[key];

        effect._pipelineContext = null; // because _prepareEffect will try to dispose this pipeline before recreating it and that would lead to webgl errors
        effect._wasPreviouslyReady = false;
        effect._prepareEffect();
    }

    Effect.ResetCache();
}

function _getShaderProcessor(engineState: IBaseEnginePublic, _shaderLanguage: ShaderLanguage): Nullable<IShaderProcessor> {
    const fes = engineState as BaseEngineState;
    return fes._shaderProcessor;
}

/**
 * Gets the default empty texture
 * @param engineState defines the engine state
 * @param createRawTexture defines a function used to create the raw texture from the rawTexture extension
 * @returns the default empty texture
 */
export function getEmptyTexture(engineState: IBaseEnginePublic, { createRawTexture }: Pick<IRawTextureEngineExtension, "createRawTexture">): Nullable<InternalTexture> {
    if (!(engineState as BaseEngineStateFull)._emptyTexture) {
        (engineState as BaseEngineStateFull)._emptyTexture = createRawTexture(engineState, new Uint8Array(4), 1, 1, TEXTUREFORMAT_RGBA, false, false, TEXTURE_NEAREST_SAMPLINGMODE);
    }
    return (engineState as BaseEngineStateFull)._emptyTexture;
}

/**
 * Gets the default empty 3D texture
 * @param engineState defines the engine state
 * @param createRawTexture3D defines a function used to create the raw texture from the rawTexture extension
 * @returns the default empty 3D texture
 */
export function getEmptyTexture3D(engineState: IBaseEnginePublic, { createRawTexture3D }: Pick<IRawTextureEngineExtension, "createRawTexture3D">): Nullable<InternalTexture> {
    if (!(engineState as BaseEngineStateFull)._emptyTexture3D) {
        (engineState as BaseEngineStateFull)._emptyTexture3D = createRawTexture3D(
            engineState,
            new Uint8Array(4),
            1,
            1,
            1,
            TEXTUREFORMAT_RGBA,
            false,
            false,
            TEXTURE_NEAREST_SAMPLINGMODE
        );
    }
    return (engineState as BaseEngineStateFull)._emptyTexture3D;
}

/**
 * Gets the default empty texture 2D
 * @param engineState defines the engine state
 * @param createRawCubeTexture defines a function used to create the raw texture 2D from the rawTexture extension
 * @returns the default empty texture 2D
 */
export function getEmptyTexture2DArray(
    engineState: IBaseEnginePublic,
    { createRawTexture2DArray }: Pick<IRawTextureEngineExtension, "createRawTexture2DArray">
): Nullable<InternalTexture> {
    if (!(engineState as BaseEngineStateFull)._emptyTexture2DArray) {
        (engineState as BaseEngineStateFull)._emptyTexture2DArray = createRawTexture2DArray(
            engineState,
            new Uint8Array(4),
            1,
            1,
            1,
            TEXTUREFORMAT_RGBA,
            false,
            false,
            TEXTURE_NEAREST_SAMPLINGMODE
        );
    }
    return (engineState as BaseEngineStateFull)._emptyTexture2DArray;
}

/**
 * Gets the default empty cube texture
 * @param engineState defines the engine state
 * @param createRawCubeTexture defines a function used to create the raw cube texture from the rawTexture extension
 * @returns the default empty cube texture
 */
export function getEmptyCubeTexture(engineState: IBaseEnginePublic, { createRawCubeTexture }: Pick<IRawTextureEngineExtension, "createRawCubeTexture">): Nullable<InternalTexture> {
    if (!(engineState as BaseEngineStateFull)._emptyCubeTexture) {
        const faceData = new Uint8Array(4);
        const cubeData = [faceData, faceData, faceData, faceData, faceData, faceData];
        (engineState as BaseEngineStateFull)._emptyCubeTexture = createRawCubeTexture(
            engineState,
            cubeData,
            1,
            TEXTUREFORMAT_RGBA,
            TEXTURETYPE_UNSIGNED_INT,
            false,
            false,
            TEXTURE_NEAREST_SAMPLINGMODE
        );
    }
    return (engineState as BaseEngineStateFull)._emptyCubeTexture;
}

export function getCreationOptions(engineState: IBaseEnginePublic): EngineOptions {
    return (engineState as BaseEngineState)._creationOptions;
}

/**
 * Gets a boolean indicating if all created effects are ready
 * @param engineState defines the engine state
 * @returns true if all effects are ready
 */
export function areAllEffectsReady(engineState: IBaseEnginePublic): boolean {
    const fes = engineState as BaseEngineState;
    for (const key in fes._compiledEffects) {
        const effect = <Effect>fes._compiledEffects[key];

        if (!effect.isReady()) {
            return false;
        }
    }

    return true;
}

/**
 * @internal
 */
export function _rebuildBuffers(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineState;
    // Uniforms
    for (const uniformBuffer of fes._uniformBuffers) {
        uniformBuffer._rebuild();
    }
    // Storage buffers
    for (const storageBuffer of fes._storageBuffers) {
        storageBuffer._rebuild();
    }
}

/**
 * Reset the texture cache to empty state
 */
export function resetTextureCache(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineStateFull;
    for (const key in fes._boundTexturesCache) {
        if (!Object.prototype.hasOwnProperty.call(fes._boundTexturesCache, key)) {
            continue;
        }
        fes._boundTexturesCache[key] = null;
    }

    fes._currentTextureChannel = -1;
}

/**
 * stop executing a render loop function and remove it from the execution array
 * @param renderFunction defines the function to be removed. If not provided all functions will be removed.
 */
export function stopRenderLoop(engineState: IBaseEnginePublic, renderFunction?: () => void): void {
    const fes = engineState as BaseEngineState;
    if (!renderFunction) {
        fes._activeRenderLoops.length = 0;
        return;
    }

    const index = fes._activeRenderLoops.indexOf(renderFunction);

    if (index >= 0) {
        fes._activeRenderLoops.splice(index, 1);
    }
}

/** @internal */
export function _renderLoop(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineState;
    if (!fes._contextWasLost) {
        let shouldRender = true;
        if (fes._isDisposed || (!fes.renderEvenInBackground && fes._windowIsBackground)) {
            shouldRender = false;
        }

        if (shouldRender) {
            // Start new frame
            beginFrame();

            for (let index = 0; index < fes._activeRenderLoops.length; index++) {
                const renderFunction = fes._activeRenderLoops[index];

                renderFunction();
            }

            // Present
            endFrame();
        }
    }

    if (fes._activeRenderLoops.length > 0) {
        fes._frameHandler = _queueNewFrame(fes._boundRenderFunction, fes.hostWindow);
    } else {
        fes._renderingQueueLaunched = false;
    }
}

/**
 * This will populate the entire module object. For better tree-shaking populate the minimum required
 * @param engineState The current engine state
 */
// export function populateBaseModule(engineState: IEnginePublic) {
//     engineState.module = {
//         _getShaderProcessor,
//     };
// }
