/**
 * Extendable functionality for the different engines.
 * Think super.??? without classes.
 */

import type { Nullable } from "@babylonjs/core/types.js";
import type { BaseEngineState, BaseEngineStateFull, IBaseEnginePublic } from "./engine.base.js";
import { _renderFrame, _viewport, endFrame, getHostWindow, getRenderHeight, getRenderWidth } from "./engine.base.js";
import { InternalTextureSource, InternalTexture } from "@babylonjs/core/Materials/Textures/internalTexture.js";
import type { PostProcess } from "@babylonjs/core/PostProcesses/postProcess.js";
import type { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture.js";
import type { RenderTargetTexture } from "@babylonjs/core/Materials/Textures/renderTargetTexture.js";
import type { IViewportLike } from "@babylonjs/core/Maths/math.like.js";
import { EngineStore, QueueNewFrame, _TextureLoaders } from "./engine.static.js";
import type { IPipelineContext } from "@babylonjs/core/Engines/IPipelineContext.js";
import { Effect } from "@babylonjs/core/Materials/effect.js";
import { Constants } from "./engine.constants.js";
import type { IInternalTextureLoader } from "@babylonjs/core/Materials/Textures/internalTextureLoader.js";
import { LoadImage } from "@babylonjs/core/Misc/fileTools.js";
import type { IWebRequest } from "@babylonjs/core/Misc/interfaces/iWebRequest.js";
import type { Observer } from "@babylonjs/core/Misc/observable.js";
import type { ISceneLike } from "./engine.interfaces.js";
import { _loadFile } from "./engine.tools.js";
import { Logger } from "@babylonjs/core/Misc/logger.js";
import { EngineExtensions, getEngineExtension } from "./Extensions/engine.extensions.js";
import type { EngineBaseType } from "./engine.adapters.js";

/**
 * Defines the interface used by objects containing a viewport (like a camera)
 */
interface IViewportOwnerLike {
    /**
     * Gets or sets the viewport
     */
    viewport: IViewportLike;
}

/**
 * Register and execute a render loop. The engine can have more than one render function
 * @param engineState defines the engine state
 * @param renderFunction defines the function to continuously execute
 */
export function runRenderLoopBase<T extends IBaseEnginePublic = IBaseEnginePublic>(
    renderLoopInjection: {
        beginFrameFunc?: (engineState: T) => void;
        endFrameFunc: (engineState: T) => void;
        queueNewFrameFunc: (func: FrameRequestCallback, requester?: any) => number;
    },
    engineState: T,
    renderFunction: () => void
): void {
    const fes = engineState as BaseEngineStateFull<T>;
    if (fes._activeRenderLoops.indexOf(renderFunction) !== -1) {
        return;
    }

    fes._activeRenderLoops.push(renderFunction);

    if (!fes._renderingQueueLaunched) {
        fes._renderingQueueLaunched = true;
        _renderLoopBase(renderLoopInjection, engineState);
        fes._boundRenderFunction = () => _renderLoopBase(renderLoopInjection, engineState);
        fes._frameHandler = renderLoopInjection.queueNewFrameFunc(fes._boundRenderFunction!, getHostWindow(engineState));
    }
}

/**
 * Set the WebGL's viewport
 * @param viewport defines the viewport element to be used
 * @param requiredWidth defines the width required for rendering. If not provided the rendering canvas' width is used
 * @param requiredHeight defines the height required for rendering. If not provided the rendering canvas' height is used
 */
export function setViewportBase<T extends IBaseEnginePublic = IBaseEnginePublic>(
    {
        viewportChangedFunc = _viewport,
        getRenderWidthFunc = getRenderWidth,
        getRenderHeightFunc = getRenderHeight,
    }: {
        viewportChangedFunc: (engineState: T, x: number, y: number, width: number, height: number) => void;
        getRenderWidthFunc?: typeof getRenderWidth<T>;
        getRenderHeightFunc?: typeof getRenderHeight<T>;
    },
    engineState: T,
    viewport: IViewportLike,
    requiredWidth?: number,
    requiredHeight?: number
): void {
    const width = requiredWidth || getRenderWidthFunc(engineState);
    const height = requiredHeight || getRenderHeightFunc(engineState);
    const x = viewport.x || 0;
    const y = viewport.y || 0;

    (engineState as BaseEngineState<T>)._cachedViewport = viewport;

    viewportChangedFunc(engineState, x * width, y * height, width * viewport.width, height * viewport.height);
}

/** @internal */
export function _renderLoopBase<T extends IBaseEnginePublic = IBaseEnginePublic>(
    {
        queueNewFrameFunc = QueueNewFrame,
        endFrameFunc = endFrame,
        beginFrameFunc,
    }: {
        beginFrameFunc?: (engineState: T) => void;
        endFrameFunc: (engineState: T) => void;
        queueNewFrameFunc: typeof QueueNewFrame;
    },
    engineState: T
): void {
    const fes = engineState as BaseEngineState<T>;
    if (!fes._contextWasLost) {
        let shouldRender = true;
        if (fes._isDisposed || (!fes.renderEvenInBackground && fes._windowIsBackground)) {
            shouldRender = false;
        }

        if (shouldRender) {
            // Start new frame
            beginFrameFunc?.(engineState);

            // is the extension loaded and defined?
            if (!getEngineExtension(engineState, EngineExtensions.VIEWS)?._renderViews(engineState)) {
                _renderFrame(engineState);
            }

            // Present
            endFrameFunc(engineState);
        }
    }

    if (fes._activeRenderLoops.length > 0) {
        // Register new frame
        if (fes.customAnimationFrameRequester) {
            fes.customAnimationFrameRequester.requestID = queueNewFrameFunc(
                (fes.customAnimationFrameRequester.renderFunction as FrameRequestCallback) || fes._boundRenderFunction!,
                fes.customAnimationFrameRequester
            );
            fes._frameHandler = fes.customAnimationFrameRequester.requestID;
        } else if (fes._boundRenderFunction) {
            fes._frameHandler = queueNewFrameFunc(fes._boundRenderFunction, getHostWindow(engineState));
        } else {
            fes._renderingQueueLaunched = false;
        }
    } else {
        fes._renderingQueueLaunched = false;
    }
}

/**
 * Send a draw order
 * @param useTriangles defines if triangles must be used to draw (else wireframe will be used)
 * @param indexStart defines the starting index
 * @param indexCount defines the number of index to draw
 * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
 */
export function drawBase<T extends IBaseEnginePublic = IBaseEnginePublic>(
    { drawElementsType }: { drawElementsType: (engineState: T, fillMode: number, indexStart: number, indexCount: number, instancesCount?: number) => void },
    engineState: T,
    useTriangles: boolean,
    indexStart: number,
    indexCount: number,
    instancesCount?: number
): void {
    drawElementsType(engineState, useTriangles ? Constants.MATERIAL_TriangleFillMode : Constants.MATERIAL_WireFrameFillMode, indexStart, indexCount, instancesCount);
}

/**
 * Draw a list of points
 * @param verticesStart defines the index of first vertex to draw
 * @param verticesCount defines the count of vertices to draw
 * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
 */
export function drawPointCloudsBase<T extends IBaseEnginePublic = IBaseEnginePublic>(
    { drawArraysType }: { drawArraysType: (engineState: T, fillMode: number, verticesStart: number, verticesCount: number, instancesCount?: number) => void },
    engineState: T,
    verticesStart: number,
    verticesCount: number,
    instancesCount?: number
): void {
    drawArraysType(engineState, Constants.MATERIAL_PointFillMode, verticesStart, verticesCount, instancesCount);
}

/**
 * Draw a list of unindexed primitives
 * @param useTriangles defines if triangles must be used to draw (else wireframe will be used)
 * @param verticesStart defines the index of first vertex to draw
 * @param verticesCount defines the count of vertices to draw
 * @param instancesCount defines the number of instances to draw (if instantiation is enabled)
 */
export function drawUnIndexedBase<T extends IBaseEnginePublic = IBaseEnginePublic>(
    { drawArraysType }: { drawArraysType: (engineState: T, fillMode: number, verticesStart: number, verticesCount: number, instancesCount?: number) => void },
    engineState: T,
    useTriangles: boolean,
    verticesStart: number,
    verticesCount: number,
    instancesCount?: number
): void {
    drawArraysType(engineState, useTriangles ? Constants.MATERIAL_TriangleFillMode : Constants.MATERIAL_WireFrameFillMode, verticesStart, verticesCount, instancesCount);
}

/**
 * @internal
 */
export function _releaseEffectBase<T extends IBaseEnginePublic = IBaseEnginePublic>(
    { _deletePipelineContext }: { _deletePipelineContext: (engineState: T, pipelineContext: IPipelineContext) => void },
    engineState: T,
    effect: Effect
): void {
    const fes = engineState as BaseEngineState<T>;
    if (fes._compiledEffects[effect._key]) {
        delete fes._compiledEffects[effect._key];
    }
    const pipelineContext = effect.getPipelineContext();
    if (pipelineContext) {
        _deletePipelineContext(engineState, pipelineContext);
    }
}

export function _createTextureBase<T>(
    {
        getUseSRGBBuffer,
        engineAdapter,
    }: {
        getUseSRGBBuffer: (engineState: EngineBaseType<T>, useSRGBBuffer: boolean, noMipmap: boolean) => boolean;
        engineAdapter?: T;
    },
    engineState: EngineBaseType<T>,
    url: Nullable<string>,
    noMipmap: boolean,
    invertY: boolean,
    scene: Nullable<ISceneLike>,
    samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
    onLoad: Nullable<(texture: InternalTexture) => void> = null,
    onError: Nullable<(message: string, exception: any) => void> = null,
    prepareTexture: (
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
        samplingMode: number
    ) => void,
    prepareTextureProcessFunction: (
        width: number,
        height: number,
        img: HTMLImageElement | ImageBitmap | { width: number; height: number },
        extension: string,
        texture: InternalTexture,
        continuationCallback: () => void
    ) => boolean,
    buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap> = null,
    fallback: Nullable<InternalTexture> = null,
    format: Nullable<number> = null,
    forcedExtension: Nullable<string> = null,
    mimeType?: string,
    loaderOptions?: any,
    useSRGBBuffer?: boolean
): InternalTexture {
    const fes = engineState as BaseEngineStateFull<EngineBaseType<T>>;
    url = url || "";
    const fromData = url.substring(0, 5) === "data:";
    const fromBlob = url.substring(0, 5) === "blob:";
    const isBase64 = fromData && url.indexOf(";base64,") !== -1;

    if (!engineAdapter && !fallback) {
        throw new Error("either engineAdapter or fallback are required");
    }

    const texture = fallback ? fallback : new InternalTexture(engineAdapter!, InternalTextureSource.Url);

    if (texture !== fallback) {
        texture.label = url.substring(0, 60); // default label, can be overriden by the caller
    }

    const originalUrl = url;
    if (fes._transformTextureUrl && !isBase64 && !fallback && !buffer) {
        url = fes._transformTextureUrl(url);
    }

    if (originalUrl !== url) {
        texture._originalUrl = originalUrl;
    }

    // establish the file extension, if possible
    const lastDot = url.lastIndexOf(".");
    let extension = forcedExtension ? forcedExtension : lastDot > -1 ? url.substring(lastDot).toLowerCase() : "";
    let loader: Nullable<IInternalTextureLoader> = null;

    // Remove query string
    const queryStringIndex = extension.indexOf("?");

    if (queryStringIndex > -1) {
        extension = extension.split("?")[0];
    }

    for (const availableLoader of _TextureLoaders) {
        if (availableLoader.canLoad(extension, mimeType)) {
            loader = availableLoader;
            break;
        }
    }

    if (scene) {
        scene.addPendingData(texture);
    }
    texture.url = url;
    texture.generateMipMaps = !noMipmap;
    texture.samplingMode = samplingMode;
    texture.invertY = invertY;
    texture._useSRGBBuffer = getUseSRGBBuffer(engineState, !!useSRGBBuffer, noMipmap);

    if (!fes.doNotHandleContextLost) {
        // Keep a link to the buffer only if we plan to handle context lost
        texture._buffer = buffer;
    }

    let onLoadObserver: Nullable<Observer<InternalTexture>> = null;
    if (onLoad && !fallback) {
        onLoadObserver = texture.onLoadedObservable.add(onLoad);
    }

    if (!fallback) {
        fes._internalTexturesCache.push(texture);
    }

    const onInternalError = (message?: string, exception?: any) => {
        if (scene) {
            scene.removePendingData(texture);
        }

        if (url === originalUrl) {
            if (onLoadObserver) {
                texture.onLoadedObservable.remove(onLoadObserver);
            }

            if (EngineStore.UseFallbackTexture) {
                _createTextureBase(
                    {
                        getUseSRGBBuffer,
                        engineAdapter,
                    },
                    engineState,
                    EngineStore.FallbackTexture,
                    noMipmap,
                    texture.invertY,
                    scene,
                    samplingMode,
                    null,
                    onError,
                    prepareTexture,
                    prepareTextureProcessFunction,
                    buffer,
                    texture
                );
            }

            message = (message || "Unknown error") + (EngineStore.UseFallbackTexture ? " - Fallback texture was used" : "");
            texture.onErrorObservable.notifyObservers({ message, exception });
            if (onError) {
                onError(message, exception);
            }
        } else {
            // fall back to the original url if the transformed url fails to load
            Logger.Warn(`Failed to load ${url}, falling back to ${originalUrl}`);
            _createTextureBase(
                {
                    getUseSRGBBuffer,
                    engineAdapter,
                },
                engineState,
                originalUrl,
                noMipmap,
                texture.invertY,
                scene,
                samplingMode,
                onLoad,
                onError,
                prepareTexture,
                prepareTextureProcessFunction,
                buffer,
                texture,
                format,
                forcedExtension,
                mimeType,
                loaderOptions,
                useSRGBBuffer
            );
        }
    };

    // processing for non-image formats
    if (loader) {
        const callback = (data: ArrayBufferView) => {
            loader!.loadData(
                data,
                texture,
                (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void, loadFailed) => {
                    if (loadFailed) {
                        onInternalError("TextureLoader failed to load data");
                    } else {
                        prepareTexture(
                            texture,
                            extension,
                            scene,
                            { width, height },
                            texture.invertY,
                            !loadMipmap,
                            isCompressed,
                            () => {
                                done();
                                return false;
                            },
                            samplingMode
                        );
                    }
                },
                loaderOptions
            );
        };

        if (!buffer) {
            _loadFile(
                engineState,
                url,
                (data) => callback(new Uint8Array(data as ArrayBuffer)),
                undefined,
                scene ? scene.offlineProvider : undefined,
                true,
                (request?: IWebRequest, exception?: any) => {
                    onInternalError("Unable to load " + (request ? request.responseURL : url, exception));
                }
            );
        } else {
            if (buffer instanceof ArrayBuffer) {
                callback(new Uint8Array(buffer));
            } else if (ArrayBuffer.isView(buffer)) {
                callback(buffer);
            } else {
                if (onError) {
                    onError("Unable to load: only ArrayBuffer or ArrayBufferView is supported", null);
                }
            }
        }
    } else {
        const onload = (img: HTMLImageElement | ImageBitmap) => {
            if (fromBlob && !fes.doNotHandleContextLost) {
                // We need to store the image if we need to rebuild the texture
                // in case of a webgl context lost
                texture._buffer = img;
            }

            prepareTexture(texture, extension, scene, img, texture.invertY, noMipmap, false, prepareTextureProcessFunction, samplingMode);
        };
        // According to the WebGL spec section 6.10, ImageBitmaps must be inverted on creation.
        // So, we pass imageOrientation to _FileToolsLoadImage() as it may create an ImageBitmap.

        if (!fromData || isBase64) {
            if (buffer && (typeof (<HTMLImageElement>buffer).decoding === "string" || (<ImageBitmap>buffer).close)) {
                onload(<HTMLImageElement>buffer);
            } else {
                LoadImage(
                    url,
                    onload,
                    onInternalError,
                    scene ? scene.offlineProvider : null,
                    mimeType,
                    texture.invertY && fes._features.needsInvertingBitmap ? { imageOrientation: "flipY" } : undefined
                );
            }
        } else if (typeof buffer === "string" || buffer instanceof ArrayBuffer || ArrayBuffer.isView(buffer) || buffer instanceof Blob) {
            LoadImage(
                buffer,
                onload,
                onInternalError,
                scene ? scene.offlineProvider : null,
                mimeType,
                texture.invertY && fes._features.needsInvertingBitmap ? { imageOrientation: "flipY" } : undefined
            );
        } else if (buffer) {
            onload(buffer);
        }
    }

    return texture;
}

/**
 * Gets current aspect ratio
 * @param viewportOwner defines the camera to use to get the aspect ratio
 * @param useScreen defines if screen size must be used (or the current render target if any)
 * @returns a number defining the aspect ratio
 */
export function getAspectRatioBase<T extends IBaseEnginePublic = IBaseEnginePublic>(
    {
        getRenderWidthFunc = getRenderWidth,
        getRenderHeightFunc = getRenderHeight,
    }: {
        getRenderWidthFunc?: typeof getRenderWidth<T>;
        getRenderHeightFunc?: typeof getRenderHeight<T>;
    },
    engineState: T,
    viewportOwner: IViewportOwnerLike,
    useScreen = false
): number {
    const viewport = viewportOwner.viewport;
    return (getRenderWidthFunc(engineState, useScreen) * viewport.width) / (getRenderHeightFunc(engineState, useScreen) * viewport.height);
}

/**
 * Gets current screen aspect ratio
 * @returns a number defining the aspect ratio
 */
export function getScreenAspectRatioBase<T extends IBaseEnginePublic = IBaseEnginePublic>(
    {
        getRenderWidthFunc = getRenderWidth,
        getRenderHeightFunc = getRenderHeight,
    }: {
        getRenderWidthFunc?: typeof getRenderWidth<T>;
        getRenderHeightFunc?: typeof getRenderHeight<T>;
    },
    engineState: T
): number {
    return getRenderWidthFunc(engineState, true) / getRenderHeightFunc(engineState, true);
}

/**
 * Directly set the WebGL Viewport
 * @param x defines the x coordinate of the viewport (in screen space)
 * @param y defines the y coordinate of the viewport (in screen space)
 * @param width defines the width of the viewport (in screen space)
 * @param height defines the height of the viewport (in screen space)
 * @returns the current viewport Object (if any) that is being replaced by this call. You can restore this viewport later on to go back to the original state
 */
export function setDirectViewportBase<T extends IBaseEnginePublic = IBaseEnginePublic>(
    {
        viewportChangedFunc = _viewport,
    }: {
        viewportChangedFunc: (engineState: T, x: number, y: number, width: number, height: number) => void;
    },
    engineState: T,
    x: number,
    y: number,
    width: number,
    height: number
): Nullable<IViewportLike> {
    const currentViewport = (engineState as BaseEngineState<T>)._cachedViewport;
    (engineState as BaseEngineState<T>)._cachedViewport = null;

    viewportChangedFunc(engineState, x, y, width, height);

    return currentViewport;
}

/**
 * Sets a texture to the webGL context from a postprocess
 * @param channel defines the channel to use
 * @param postProcess defines the source postprocess
 * @param name name of the channel
 */
export function setTextureFromPostProcessBase<T extends IBaseEnginePublic = IBaseEnginePublic>(
    {
        _bindTexture,
    }: {
        _bindTexture: (engineState: T, channel: number, texture: Nullable<InternalTexture>, name: string) => void;
    },
    engineState: T,
    channel: number,
    postProcess: Nullable<PostProcess>,
    name: string
): void {
    let postProcessInput = null;
    if (postProcess) {
        if (postProcess._forcedOutputTexture) {
            postProcessInput = postProcess._forcedOutputTexture;
        } else if (postProcess._textures.data[postProcess._currentRenderTextureInd]) {
            postProcessInput = postProcess._textures.data[postProcess._currentRenderTextureInd];
        }
    }

    _bindTexture(engineState, channel, postProcessInput?.texture ?? null, name);
}

/**
 * Binds the output of the passed in post process to the texture channel specified
 * @param channel The channel the texture should be bound to
 * @param postProcess The post process which's output should be bound
 * @param name name of the channel
 */
export function setTextureFromPostProcessOutputBase<T extends IBaseEnginePublic = IBaseEnginePublic>(
    {
        _bindTexture,
    }: {
        _bindTexture: (engineState: T, channel: number, texture: Nullable<InternalTexture>, name: string) => void;
    },
    engineState: T,
    channel: number,
    postProcess: Nullable<PostProcess>,
    name: string
): void {
    _bindTexture(engineState, channel, postProcess?._outputTexture?.texture ?? null, name);
}

/**
 * Sets a depth stencil texture from a render target to the according uniform.
 * @param channel The texture channel
 * @param uniform The uniform to set. Not used in WebGPU, being set in WebGL only
 * @param texture The render target texture containing the depth stencil texture to apply
 * @param name The texture name
 */
export function setDepthStencilTextureBase<T extends IBaseEnginePublic = IBaseEnginePublic, UniformType = unknown>(
    {
        _setTexture,
    }: {
        _setTexture: (engineState: T, channel: number, texture: Nullable<ThinTexture>, isPartOfTextureArray?: boolean, depthStencilTexture?: boolean, name?: string) => boolean;
    },
    engineState: T,
    channel: number,
    _uniform: Nullable<UniformType>,
    texture: Nullable<RenderTargetTexture>,
    name?: string
): void {
    if (channel === undefined) {
        return;
    }

    if (!texture || !texture.depthStencilTexture) {
        _setTexture(engineState, channel, null, undefined, undefined, name);
    } else {
        _setTexture(engineState, channel, texture, false, true, name);
    }
}

export function _restoreEngineAfterContextLost<T extends IBaseEnginePublic = IBaseEnginePublic>(
    {
        wipeCaches,
    }: {
        wipeCaches: (engineState: T, bruteForce?: boolean) => void;
    },
    engineState: IBaseEnginePublic,
    initEngine: () => void
): void {
    const fes = engineState as BaseEngineStateFull<T>;
    // Adding a timeout to avoid race condition at browser level
    setTimeout(async () => {
        // only available on webgl, not part of the base engine
        (fes as any)._dummyFramebuffer = null;

        const depthTest = fes._depthCullingState?.depthTest; // backup those values because the call to initEngine / wipeCaches will reset them
        const depthFunc = fes._depthCullingState?.depthFunc;
        const depthMask = fes._depthCullingState?.depthMask;
        const stencilTest = fes._stencilState?.stencilTest;

        // Rebuild context
        initEngine();

        // Ensure webgl and engine states are matching
        wipeCaches(fes, true);

        // Rebuild effects
        _rebuildEffects(fes);

        // TODO - this is from an extension!
        // _rebuildComputeEffects?.(fes);

        // Note:
        //  The call to _rebuildBuffers must be made before the call to _rebuildInternalTextures because in the process of _rebuildBuffers the buffers used by the post process managers will be rebuilt
        //  and we may need to use the post process manager of the scene during _rebuildInternalTextures (in WebGL1, non-POT textures are rescaled using a post process + post process manager of the scene)

        // Rebuild buffers
        _rebuildBuffers(fes);
        // Rebuild textures
        _rebuildInternalTextures(fes);
        // Rebuild textures
        _rebuildRenderTargetWrappers(fes);

        // Reset engine states after all the buffer/textures/... have been rebuilt
        wipeCaches(fes, true);

        if (fes._depthCullingState) {
            fes._depthCullingState.depthTest = depthTest as boolean;
            fes._depthCullingState.depthFunc = depthFunc as Nullable<number>;
            fes._depthCullingState.depthMask = depthMask as boolean;
        }
        if (fes._stencilState) {
            fes._stencilState.stencilTest = stencilTest as boolean;
        }

        Logger.Warn(fes.name + " context successfully restored.");
        fes.onContextRestoredObservable.notifyObservers(fes);
        fes._contextWasLost = false;
    }, 0);
}

function _rebuildInternalTextures(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineStateFull;
    const currentState = fes._internalTexturesCache.slice(); // Do a copy because the rebuild will add proxies

    for (const internalTexture of currentState) {
        internalTexture._rebuild();
    }
}

function _rebuildRenderTargetWrappers(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineStateFull;
    const currentState = fes._renderTargetWrapperCache.slice(); // Do a copy because the rebuild will add proxies

    for (const renderTargetWrapper of currentState) {
        renderTargetWrapper._rebuild();
    }
}

function _rebuildEffects(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineStateFull;
    for (const key in fes._compiledEffects) {
        const effect = <Effect>fes._compiledEffects[key];

        effect._pipelineContext = null; // because _prepareEffect will try to dispose this pipeline before recreating it and that would lead to webgl errors
        effect._wasPreviouslyReady = false;
        effect._prepareEffect();
    }

    Effect.ResetCache();
}

function _rebuildBuffers(engineState: IBaseEnginePublic): void {
    const fes = engineState as BaseEngineStateFull;
    // Uniforms
    for (const uniformBuffer of fes._uniformBuffers) {
        uniformBuffer._rebuild();
    }
    // Storage buffers
    for (const storageBuffer of fes._storageBuffers) {
        storageBuffer._rebuild();
    }
}
