import { Effect } from "core/Materials/effect";
import type { ShaderLanguage } from "core/Materials";
import type { Nullable } from "core/types";
import type { IShaderProcessor } from "core/Engines/Processors/iShaderProcessor";
import type { UniformBuffer } from "core/Materials/uniformBuffer";
import { Observable } from "core/Misc/observable";
import { GEQUAL, LEQUAL } from "./engine.constants";
import { PrecisionDate } from "core/Misc";
import type { StorageBuffer } from "core/Buffers";
import type { EngineOptions } from "core/Engines/thinEngine";

interface IBaseEnginePrivate {
    _useReverseDepthBuffer: boolean;
    _frameId: number;
}

export interface IBaseEngineProtected {
    _isDisposed: boolean;
    _shaderProcessor: Nullable<IShaderProcessor>;

    _renderingCanvas: Nullable<HTMLCanvasElement>;
    _windowIsBackground: boolean;
    _creationOptions: EngineOptions; // TODO? 
    _audioContext: Nullable<AudioContext>;
    _audioDestination: Nullable<AudioDestinationNode | MediaStreamAudioDestinationNode>;
}

export interface IBaseEngineInternals {
    // description: string;
    // version: number;
    _frameId: number;
    _uniformBuffers: Array<UniformBuffer>;
    _storageBuffers: Array<StorageBuffer>;
    _uniqueId: number;
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
    readonly version: number;
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

            this._useReverseDepthBuffer = useReverse;

            if (useReverse) {
                this._depthCullingState.depthFunc = GEQUAL;
            } else {
                this._depthCullingState.depthFunc = LEQUAL;
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

        // internals
        _uniformBuffers: [],
        _storageBuffers: [],
        _windowIsBackground: false,

        ...overrides,
    };

    // TODO - this actually prevents tree shaking. Should be done by the dev, apart from the most basic functions.
    // populateBaseModule(engineState);

    return engineState;
}

function _rebuildInternalTextures(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineState;
    const currentState = _internalTexturesCache.slice(); // Do a copy because the rebuild will add proxies

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
    const fes = engineState as BaseEngineState;
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
