import { IsDocumentAvailable } from "../Misc/domManagement";
import type { Nullable } from "../types";
import { AbstractEngine } from "./abstractEngine";
import type { AbstractEngineOptions } from "./abstractEngine";
import { EngineStore } from "./engineStore";

/** @internal */
function _DisableTouchAction(canvas: Nullable<HTMLCanvasElement>): void {
    if (!canvas || !canvas.setAttribute) {
        return;
    }

    canvas.setAttribute("touch-action", "none");
    canvas.style.touchAction = "none";
    (canvas.style as any).webkitTapHighlightColor = "transparent";
}

/** @internal */
export function _CommonInit(commonEngine: AbstractEngine, canvas: HTMLCanvasElement, creationOptions: AbstractEngineOptions) {
    commonEngine._onCanvasFocus = () => {
        commonEngine.onCanvasFocusObservable.notifyObservers(commonEngine);
    };

    commonEngine._onCanvasBlur = () => {
        commonEngine.onCanvasBlurObservable.notifyObservers(commonEngine);
    };

    commonEngine._onCanvasContextMenu = (evt: Event) => {
        if (commonEngine.disableContextMenu) {
            evt.preventDefault();
        }
    };

    canvas.addEventListener("focus", commonEngine._onCanvasFocus);
    canvas.addEventListener("blur", commonEngine._onCanvasBlur);
    canvas.addEventListener("contextmenu", commonEngine._onCanvasContextMenu);

    commonEngine._onBlur = () => {
        if (commonEngine.disablePerformanceMonitorInBackground) {
            commonEngine.performanceMonitor.disable();
        }
        commonEngine._windowIsBackground = true;
    };

    commonEngine._onFocus = () => {
        if (commonEngine.disablePerformanceMonitorInBackground) {
            commonEngine.performanceMonitor.enable();
        }
        commonEngine._windowIsBackground = false;
    };

    commonEngine._onCanvasPointerOut = (ev) => {
        // Check that the element at the point of the pointer out isn't the canvas and if it isn't, notify observers
        // Note: This is a workaround for a bug with Safari
        if (document.elementFromPoint(ev.clientX, ev.clientY) !== canvas) {
            commonEngine.onCanvasPointerOutObservable.notifyObservers(ev);
        }
    };

    const hostWindow = commonEngine.getHostWindow(); // it calls IsWindowObjectExist()
    if (hostWindow && typeof hostWindow.addEventListener === "function") {
        hostWindow.addEventListener("blur", commonEngine._onBlur);
        hostWindow.addEventListener("focus", commonEngine._onFocus);
    }

    canvas.addEventListener("pointerout", commonEngine._onCanvasPointerOut);

    if (!creationOptions.doNotHandleTouchAction) {
        _DisableTouchAction(canvas);
    }

    // Create Audio Engine if needed.
    if (!AbstractEngine.audioEngine && creationOptions.audioEngine && AbstractEngine.AudioEngineFactory) {
        AbstractEngine.audioEngine = AbstractEngine.AudioEngineFactory(commonEngine.getRenderingCanvas(), commonEngine.getAudioContext(), commonEngine.getAudioDestination());
    }

    if (IsDocumentAvailable()) {
        // Fullscreen
        commonEngine._onFullscreenChange = () => {
            commonEngine.isFullscreen = !!document.fullscreenElement;

            // Pointer lock
            if (commonEngine.isFullscreen && commonEngine._pointerLockRequested && canvas) {
                RequestPointerlock(canvas);
            }
        };

        document.addEventListener("fullscreenchange", commonEngine._onFullscreenChange, false);
        document.addEventListener("webkitfullscreenchange", commonEngine._onFullscreenChange, false);

        // Pointer lock
        commonEngine._onPointerLockChange = () => {
            commonEngine.isPointerLock = document.pointerLockElement === canvas;
        };

        document.addEventListener("pointerlockchange", commonEngine._onPointerLockChange, false);
        document.addEventListener("webkitpointerlockchange", commonEngine._onPointerLockChange, false);
    }

    commonEngine.enableOfflineSupport = AbstractEngine.OfflineProviderFactory !== undefined;

    commonEngine._deterministicLockstep = !!creationOptions.deterministicLockstep;
    commonEngine._lockstepMaxSteps = creationOptions.lockstepMaxSteps || 0;
    commonEngine._timeStep = creationOptions.timeStep || 1 / 60;
}

/** @internal */
export function _CommonDispose(commonEngine: AbstractEngine, canvas: Nullable<HTMLCanvasElement>) {
    // Release audio engine
    if (EngineStore.Instances.length === 1 && AbstractEngine.audioEngine) {
        AbstractEngine.audioEngine.dispose();
        AbstractEngine.audioEngine = null;
    }

    // Events
    const hostWindow = commonEngine.getHostWindow(); // it calls IsWindowObjectExist()
    if (hostWindow && typeof hostWindow.removeEventListener === "function") {
        hostWindow.removeEventListener("blur", commonEngine._onBlur);
        hostWindow.removeEventListener("focus", commonEngine._onFocus);
    }

    if (canvas) {
        canvas.removeEventListener("focus", commonEngine._onCanvasFocus);
        canvas.removeEventListener("blur", commonEngine._onCanvasBlur);
        canvas.removeEventListener("pointerout", commonEngine._onCanvasPointerOut);
        canvas.removeEventListener("contextmenu", commonEngine._onCanvasContextMenu);
    }

    if (IsDocumentAvailable()) {
        document.removeEventListener("fullscreenchange", commonEngine._onFullscreenChange);
        document.removeEventListener("mozfullscreenchange", commonEngine._onFullscreenChange);
        document.removeEventListener("webkitfullscreenchange", commonEngine._onFullscreenChange);
        document.removeEventListener("msfullscreenchange", commonEngine._onFullscreenChange);
        document.removeEventListener("pointerlockchange", commonEngine._onPointerLockChange);
        document.removeEventListener("mspointerlockchange", commonEngine._onPointerLockChange);
        document.removeEventListener("mozpointerlockchange", commonEngine._onPointerLockChange);
        document.removeEventListener("webkitpointerlockchange", commonEngine._onPointerLockChange);
    }
}

/**
 * Get Font size information
 * @param font font name
 * @returns an object containing ascent, height and descent
 */
export function GetFontOffset(font: string): { ascent: number; height: number; descent: number } {
    const text = document.createElement("span");
    text.textContent = "Hg";
    text.style.font = font;

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

/** @internal */
export function CreateImageBitmapFromSource(engine: AbstractEngine, imageSource: string, options?: ImageBitmapOptions): Promise<ImageBitmap> {
    const promise = new Promise<ImageBitmap>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            image.decode().then(() => {
                engine.createImageBitmap(image, options).then((imageBitmap) => {
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

/** @internal */
export function ResizeImageBitmap(engine: AbstractEngine, image: HTMLImageElement | ImageBitmap, bufferWidth: number, bufferHeight: number): Uint8Array {
    const canvas = engine.createCanvas(bufferWidth, bufferHeight);
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

/**
 * Ask the browser to promote the current element to fullscreen rendering mode
 * @param element defines the DOM element to promote
 */
export function RequestFullscreen(element: HTMLElement): void {
    const requestFunction = element.requestFullscreen || (<any>element).webkitRequestFullscreen;
    if (!requestFunction) {
        return;
    }
    requestFunction.call(element);
}

/**
 * Asks the browser to exit fullscreen mode
 */
export function ExitFullscreen(): void {
    const anyDoc = document as any;

    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (anyDoc.webkitCancelFullScreen) {
        anyDoc.webkitCancelFullScreen();
    }
}

/**
 * Ask the browser to promote the current element to pointerlock mode
 * @param element defines the DOM element to promote
 */
export function RequestPointerlock(element: HTMLElement): void {
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

/**
 * Asks the browser to exit pointerlock mode
 */
export function ExitPointerlock(): void {
    if (document.exitPointerLock) {
        document.exitPointerLock();
    }
}
