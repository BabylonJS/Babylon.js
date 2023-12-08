/**
 * Static engine functionality. Static functions don't require the engine state to run.
 */

/* eslint-disable @typescript-eslint/naming-convention */
import { Effect } from "core/Materials/effect";
import type { IInternalTextureLoader } from "core/Materials/Textures/internalTextureLoader";
import { IsWindowObjectExist } from "./runtimeEnvironment";
import { Constants } from "./engine.constants";
import type { Nullable } from "core/types";
import type { IBaseEnginePublic } from "./engine.base";
import type { Scene } from "core/scene";
import { Observable } from "core/Misc/observable";
import type { ICanvas } from "core/Engines/ICanvas";
import type { Material } from "core/Materials/material";
import type { IOfflineProvider } from "core/Offline/IOfflineProvider";
import type { IAudioEngine } from "core/Audio/Interfaces/IAudioEngine";
import type { ILoadingScreen } from "core/Loading/loadingScreen";
import type { PostProcess } from "core/PostProcesses/postProcess";
import type { Engine } from "core/Engines/engine";

export interface IEngineStore<T extends IBaseEnginePublic = IBaseEnginePublic> {
    /** Gets the list of created engines */
    Instances: Array<IBaseEnginePublic>;
    /**
     * Notifies when an engine was disposed.
     * Mainly used for static/cache cleanup
     */
    OnEnginesDisposedObservable: Observable<T>;
    /**
     * Gets the latest created engine
     */
    readonly LastCreatedEngine: Nullable<Engine>;
    /**
     * Gets the latest created scene
     */
    LastCreatedScene: Nullable<Scene>;
    /**
     * Gets or sets a global variable indicating if fallback texture must be used when a texture cannot be loaded
     */
    UseFallbackTexture: boolean;
    /**
     * Texture content used if a texture cannot loaded
     */
    FallbackTexture: string;

    /**
     * Gets the audio engine
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic
     * @ignorenaming
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    audioEngine: Nullable<IAudioEngine>;

    /**
     * Default AudioEngine factory responsible of creating the Audio Engine.
     * By default, this will create a BabylonJS Audio Engine if the workload has been embedded.
     */
    AudioEngineFactory?: (
        hostElement: Nullable<HTMLElement>,
        audioContext: Nullable<AudioContext>,
        audioDestination: Nullable<AudioDestinationNode | MediaStreamAudioDestinationNode>
    ) => IAudioEngine;

    /**
     * Default offline support factory responsible of creating a tool used to store data locally.
     * By default, this will create a Database object if the workload has been embedded.
     */
    OfflineProviderFactory?: (urlToScene: string, callbackManifestChecked: (checked: boolean) => any, disableManifestCheck: boolean) => IOfflineProvider;

    /**
     * Method called to create the default loading screen.
     * This can be overridden in your own app.
     * @param canvas The rendering canvas element
     * @returns The loading screen
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    DefaultLoadingScreenFactory?: (canvas: HTMLCanvasElement) => ILoadingScreen;

    /**
     * Method called to create the default rescale post process on each engine.
     */
    _RescalePostProcessFactory: Nullable<(engine: T) => PostProcess>;

    _engineMappings: WeakMap<T, Engine>;
}

export const EngineStore: IEngineStore = {
    Instances: [],
    get LastCreatedEngine() {
        if (this.Instances.length === 0) {
            return null;
        }

        return EngineStore._engineMappings.get(EngineStore.Instances[EngineStore.Instances.length - 1])!;
    },
    LastCreatedScene: null,
    UseFallbackTexture: true,
    FallbackTexture: "",
    OnEnginesDisposedObservable: new Observable(),
    audioEngine: null,
    _RescalePostProcessFactory: null,
    _engineMappings: new WeakMap(),
};

// used to be WebGL only, a single array
export const ExceptionList = {
    webgl: [
        { key: "Chrome/63.0", capture: "63\\.0\\.3239\\.(\\d+)", captureConstraint: 108, targets: ["uniformBuffer"] },
        { key: "Firefox/58", capture: null, captureConstraint: null, targets: ["uniformBuffer"] },
        { key: "Firefox/59", capture: null, captureConstraint: null, targets: ["uniformBuffer"] },
        { key: "Chrome/72.+?Mobile", capture: null, captureConstraint: null, targets: ["vao"] },
        { key: "Chrome/73.+?Mobile", capture: null, captureConstraint: null, targets: ["vao"] },
        { key: "Chrome/74.+?Mobile", capture: null, captureConstraint: null, targets: ["vao"] },
        { key: "Mac OS.+Chrome/71", capture: null, captureConstraint: null, targets: ["vao"] },
        { key: "Mac OS.+Chrome/72", capture: null, captureConstraint: null, targets: ["vao"] },
        { key: "Mac OS.+Chrome", capture: null, captureConstraint: null, targets: ["uniformBuffer"] },
        // desktop osx safari 15.4
        { key: ".*AppleWebKit.*(15.4).*Safari", capture: null, captureConstraint: null, targets: ["antialias", "maxMSAASamples"] },
        // mobile browsers using safari 15.4 on ios
        { key: ".*(15.4).*AppleWebKit.*Safari", capture: null, captureConstraint: null, targets: ["antialias", "maxMSAASamples"] },
    ],
};

// elements added to this array will persist between imports
export const _TextureLoaders: IInternalTextureLoader[] = [];

export const NpmPackage = "@babylonjs/esm@6.31.1";
export const Version = "6.31.1";

export const CollisionEpsilon = 0.001;

// A string cannot be modified when imported from an es6 module. It needs a mutating function
export let ShadersRepository = Effect.ShadersRepository;

/**
 * Sets the shader repository path to use
 * @param path the path to load shaders from
 */
export function SetShadersRepository(path: string): void {
    Effect.ShadersRepository = path;
    ShadersRepository = Effect.ShadersRepository;
}

/**
 * Queue a new function into the requested animation frame pool (ie. this function will be executed by the browser (or the javascript engine) for the next frame)
 * @param func - the function to be called
 * @param requester - the object that will request the next frame. Falls back to window.
 * @returns frame number
 */
export function QueueNewFrame(func: FrameRequestCallback, requester?: any): number {
    // Note that there is kind of a typing issue here, as `setTimeout` might return something else than a number (NodeJs returns a NodeJS.Timeout object).
    // Also if the global `requestAnimationFrame`'s returnType is number, `requester.requestPostAnimationFrame` and `requester.requestAnimationFrame` types
    // are `any`.

    if (!IsWindowObjectExist()) {
        if (typeof requestAnimationFrame === "function") {
            return requestAnimationFrame(func);
        }
    } else {
        const { requestAnimationFrame } = requester || window;
        if (typeof requestAnimationFrame === "function") {
            return requestAnimationFrame(func);
        }
    }

    // fallback to the global `setTimeout`.
    // In most cases (aka in the browser), `window` is the global object, so instead of calling `window.setTimeout` we could call the global `setTimeout`.
    return setTimeout(func, 16) as unknown as number;
}

let _IsWebGLSupported: Nullable<boolean> = null;

export function IsWebGPUSupported(): Promise<boolean> {
    return !navigator.gpu
        ? Promise.resolve(false)
        : navigator.gpu
              .requestAdapter()
              .then(
                  (adapter: GPUAdapter | undefined) => !!adapter,
                  () => false
              )
              .catch(() => false);
}

/**
 * Gets a boolean indicating if the engine can be instantiated (ie. if a webGL context can be found)
 * @returns true if the engine can be created
 */
export function IsWebGLSupported(): boolean {
    if (_HasMajorPerformanceCaveat !== null) {
        return !_HasMajorPerformanceCaveat; // We know it is performant so WebGL is supported
    }

    if (_IsWebGLSupported === null) {
        try {
            const tempcanvas = _CreateCanvas(1, 1);
            const gl = tempcanvas.getContext("webgl") || (tempcanvas as any).getContext("experimental-webgl");

            _IsWebGLSupported = gl != null && !!window.WebGLRenderingContext;
        } catch (e) {
            _IsWebGLSupported = false;
        }
    }

    return _IsWebGLSupported;
}

let _HasMajorPerformanceCaveat: Nullable<boolean> = null;

/**
 * Gets a boolean indicating if the engine can be instantiated on a performant device (ie. if a webGL context can be found and it does not use a slow implementation)
 */
export function HasMajorPerformanceCaveat(): boolean {
    if (_HasMajorPerformanceCaveat === null) {
        try {
            const tempcanvas = _CreateCanvas(1, 1);
            const gl =
                tempcanvas.getContext("webgl", { failIfMajorPerformanceCaveat: true }) ||
                (tempcanvas as any).getContext("experimental-webgl", { failIfMajorPerformanceCaveat: true });

            _HasMajorPerformanceCaveat = !gl;
        } catch (e) {
            _HasMajorPerformanceCaveat = false;
        }
    }

    return _HasMajorPerformanceCaveat;
}

/**
 * Find the next highest power of two.
 * @param x Number to start search from.
 * @returns Next highest power of two.
 */
export function CeilingPOT(x: number): number {
    x--;
    x |= x >> 1;
    x |= x >> 2;
    x |= x >> 4;
    x |= x >> 8;
    x |= x >> 16;
    x++;
    return x;
}

/**
 * Find the next lowest power of two.
 * @param x Number to start search from.
 * @returns Next lowest power of two.
 */
export function FloorPOT(x: number): number {
    x = x | (x >> 1);
    x = x | (x >> 2);
    x = x | (x >> 4);
    x = x | (x >> 8);
    x = x | (x >> 16);
    return x - (x >> 1);
}

/**
 * Find the nearest power of two.
 * @param x Number to start search from.
 * @returns Next nearest power of two.
 */
export function NearestPOT(x: number): number {
    const c = CeilingPOT(x);
    const f = FloorPOT(x);
    return c - x > x - f ? f : c;
}

/**
 * Get the closest exponent of two
 * @param value defines the value to approximate
 * @param max defines the maximum value to return
 * @param mode defines how to define the closest value
 * @returns closest exponent of two of the given value
 */
export function GetExponentOfTwo(value: number, max: number, mode = Constants.SCALEMODE_NEAREST): number {
    let pot;

    switch (mode) {
        case Constants.SCALEMODE_FLOOR:
            pot = FloorPOT(value);
            break;
        case Constants.SCALEMODE_NEAREST:
            pot = NearestPOT(value);
            break;
        case Constants.SCALEMODE_CEILING:
        default:
            pot = CeilingPOT(value);
            break;
    }

    return Math.min(pot, max);
}

export function _CreateCanvas(width: number, height: number): ICanvas {
    if (typeof document === "undefined") {
        return <ICanvas>(<any>new OffscreenCanvas(width, height));
    }
    const canvas = <ICanvas>(<any>document.createElement("canvas"));
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

// From Engine

/**
 * Will flag all materials in all scenes in all engines as dirty to trigger new shader compilation
 * @param flag defines which part of the materials must be marked as dirty
 * @param predicate defines a predicate used to filter which materials should be affected
 */
export function MarkAllMaterialsAsDirty(flag: number, predicate?: (mat: Material) => boolean): void {
    for (let engineIndex = 0; engineIndex < EngineStore.Instances.length; engineIndex++) {
        const engine = EngineStore.Instances[engineIndex];

        for (let sceneIndex = 0; sceneIndex < engine.scenes.length; sceneIndex++) {
            engine.scenes[sceneIndex].markAllMaterialsAsDirty(flag, predicate);
        }
    }
}

/**
 * Ask the browser to promote the current element to pointerlock mode
 * @param element defines the DOM element to promote
 */
export function _RequestPointerlock(element: HTMLElement): void {
    if (element.requestPointerLock) {
        // In some browsers, requestPointerLock returns a promise.
        // Handle possible rejections to avoid an unhandled top-level exception.
        const promise: unknown = element.requestPointerLock();
        if (promise instanceof Promise)
            promise
                .then(() => {
                    element.focus();
                })
                .catch(() => {});
        else element.focus();
    }
}

/** Pointerlock and fullscreen */

/**
 * Asks the browser to exit pointerlock mode
 */
export function _ExitPointerlock(): void {
    if (document.exitPointerLock) {
        document.exitPointerLock();
    }
}

/**
 * Ask the browser to promote the current element to fullscreen rendering mode
 * @param element defines the DOM element to promote
 */
export function _RequestFullscreen(element: HTMLElement): void {
    const requestFunction = element.requestFullscreen || (<any>element).webkitRequestFullscreen;
    if (!requestFunction) {
        return;
    }
    requestFunction.call(element);
}

/**
 * Asks the browser to exit fullscreen mode
 */
export function _ExitFullscreen(): void {
    const anyDoc = document as any;

    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (anyDoc.webkitCancelFullScreen) {
        anyDoc.webkitCancelFullScreen();
    }
}

/**
 * Get Font size information
 * @param font font name
 * @returns an object containing ascent, height and descent
 */
export function getFontOffset(font: string): { ascent: number; height: number; descent: number } {
    const text = document.createElement("span");
    text.innerHTML = "Hg";
    text.setAttribute("style", `font: ${font} !important`);

    const block = document.createElement("div");
    block.style.display = "inline-block";
    block.style.width = "1px";
    block.style.height = "0px";
    block.style.verticalAlign = "bottom";

    const div = document.createElement("div");
    div.style.whiteSpace = "nowrap";
    div.appendChild(text);
    div.appendChild(block);

    document.body.appendChild(div);

    let fontAscent = 0;
    let fontHeight = 0;
    try {
        fontHeight = block.getBoundingClientRect().top - text.getBoundingClientRect().top;
        block.style.verticalAlign = "baseline";
        fontAscent = block.getBoundingClientRect().top - text.getBoundingClientRect().top;
    } finally {
        document.body.removeChild(div);
    }
    return { ascent: fontAscent, height: fontHeight, descent: fontHeight - fontAscent };
}

/**
 * Engine abstraction for loading and creating an image bitmap from a given source string.
 * @internal
 * @param imageSource source to load the image from.
 * @param options An object that sets options for the image's extraction.
 * @returns ImageBitmap.
 */
export async function _createImageBitmapFromSource(
    {
        createImageBitmap,
    }: {
        createImageBitmap: (image: ImageBitmapSource, options?: ImageBitmapOptions) => Promise<ImageBitmap>;
    },
    imageSource: string,
    options?: ImageBitmapOptions
): Promise<ImageBitmap> {
    const promise = new Promise<ImageBitmap>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            image.decode().then(() => {
                createImageBitmap(image, options).then((imageBitmap) => {
                    resolve(imageBitmap);
                });
            });
        };
        image.onerror = () => {
            reject(`Error loading image ${image.src}`);
        };

        image.src = imageSource;
    });

    return promise;
}

/**
 * Resize an image and returns the image data as an uint8array
 * @param image image to resize
 * @param bufferWidth destination buffer width
 * @param bufferHeight destination buffer height
 * @returns an uint8array containing RGBA values of bufferWidth * bufferHeight size
 */
export function resizeImageBitmap(
    {
        createCanvas,
    }: {
        createCanvas?: (width: number, height: number) => ICanvas;
    },
    image: HTMLImageElement | ImageBitmap,
    bufferWidth: number,
    bufferHeight: number
): Uint8Array {
    const canvas = (createCanvas ?? _CreateCanvas)(bufferWidth, bufferHeight);
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Unable to get 2d context for resizeImageBitmap");
    }

    context.drawImage(image, 0, 0);

    // Create VertexData from map data
    // Cast is due to wrong definition in lib.d.ts from ts 1.3 - https://github.com/Microsoft/TypeScript/issues/949
    const buffer = <Uint8Array>(<any>context.getImageData(0, 0, bufferWidth, bufferHeight).data);
    return buffer;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function _ConcatenateShader(source: string, defines: Nullable<string>, shaderVersion: string = ""): string {
    return shaderVersion + (defines ? defines + "\n" : "") + source;
}

// TODO is this needed? this will allow `import Statics from "package/Engines"`.
export default { NpmPackage, Version, CollisionEpsilon, ShadersRepository, _TextureLoaders, SetShadersRepository, ExceptionList };
