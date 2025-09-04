/* eslint-disable @typescript-eslint/no-unused-vars */
import { _WarnImport } from "./devTools";

import type { ThinEngine } from "../Engines/thinEngine";
import { Constants } from "../Engines/constants";
import { EffectRenderer, EffectWrapper } from "../Materials/effectRenderer";
import { Tools } from "./tools";
import { Clamp } from "../Maths/math.scalar.functions";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { EngineStore } from "../Engines/engineStore";
import { Logger } from "./logger";

type DumpResources = {
    canvas: HTMLCanvasElement | OffscreenCanvas;
    dumpEngine?: {
        engine: ThinEngine;
        renderer: EffectRenderer;
        wrapper: EffectWrapper;
    };
};

let ResourcesPromise: Promise<DumpResources> | null = null;

async function _CreateDumpResourcesAsync(): Promise<DumpResources> {
    // Create a compatible canvas. Prefer an HTMLCanvasElement if possible to avoid alpha issues with OffscreenCanvas + WebGL in many browsers.
    const canvas = (EngineStore.LastCreatedEngine?.createCanvas(100, 100) ?? new OffscreenCanvas(100, 100)) as HTMLCanvasElement | OffscreenCanvas; // will be resized later
    if (canvas instanceof OffscreenCanvas) {
        Logger.Warn("DumpData: OffscreenCanvas will be used for dumping data. This may result in lossy alpha values.");
    }

    // If WebGL via ThinEngine is not available (e.g. Native), use the BitmapRenderer.
    // If https://github.com/whatwg/html/issues/10142 is resolved, we can migrate to just BitmapRenderer and avoid an engine dependency altogether.
    const { ThinEngine: thinEngineClass } = await import("../Engines/thinEngine");
    if (!thinEngineClass.IsSupported) {
        if (!canvas.getContext("bitmaprenderer")) {
            throw new Error("DumpData: No WebGL or bitmap rendering context available. Cannot dump data.");
        }
        return { canvas };
    }

    const options = {
        preserveDrawingBuffer: true,
        depth: false,
        stencil: false,
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
        failIfMajorPerformanceCaveat: false,
    };
    const engine = new thinEngineClass(canvas, false, options);

    // remove this engine from the list of instances to avoid using it for other purposes
    EngineStore.Instances.pop();
    // However, make sure to dispose it when no other engines are left
    EngineStore.OnEnginesDisposedObservable.add((e) => {
        // guaranteed to run when no other instances are left
        // only dispose if it's not the current engine
        if (engine && e !== engine && !engine.isDisposed && EngineStore.Instances.length === 0) {
            // Dump the engine and the associated resources
            Dispose();
        }
    });

    engine.getCaps().parallelShaderCompile = undefined;

    const renderer = new EffectRenderer(engine);
    const { passPixelShader } = await import("../Shaders/pass.fragment");
    const wrapper = new EffectWrapper({
        engine,
        name: passPixelShader.name,
        fragmentShader: passPixelShader.shader,
        samplerNames: ["textureSampler"],
    });

    return {
        canvas: canvas,
        dumpEngine: { engine, renderer, wrapper },
    };
}

async function _GetDumpResourcesAsync() {
    if (!ResourcesPromise) {
        ResourcesPromise = _CreateDumpResourcesAsync();
    }
    return await ResourcesPromise;
}

/**
 * Dumps the current bound framebuffer
 * @param width defines the rendering width
 * @param height defines the rendering height
 * @param engine defines the hosting engine
 * @param successCallback defines the callback triggered once the data are available
 * @param mimeType defines the mime type of the result
 * @param fileName defines the filename to download. If present, the result will automatically be downloaded
 * @param quality The quality of the image if lossy mimeType is used (e.g. image/jpeg, image/webp). See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob()}'s `quality` parameter.
 * @returns a void promise
 */
// Should have "Async" in the name but this is a public API and we can't break it now
// eslint-disable-next-line no-restricted-syntax
export async function DumpFramebuffer(
    width: number,
    height: number,
    engine: AbstractEngine,
    successCallback?: (data: string) => void,
    mimeType = "image/png",
    fileName?: string,
    quality?: number
) {
    // Read the contents of the framebuffer
    const bufferView = await engine.readPixels(0, 0, width, height);

    const data = new Uint8Array(bufferView.buffer);

    DumpData(width, height, data, successCallback as (data: string | ArrayBuffer) => void, mimeType, fileName, true, undefined, quality);
}

export async function DumpDataAsync(
    width: number,
    height: number,
    data: ArrayBufferView,
    mimeType: string | undefined,
    fileName: string | undefined,
    invertY: boolean | undefined,
    toArrayBuffer: true,
    quality?: number
): Promise<ArrayBuffer>;
export async function DumpDataAsync(
    width: number,
    height: number,
    data: ArrayBufferView,
    mimeType?: string,
    fileName?: string,
    invertY?: boolean,
    toArrayBuffer?: boolean,
    quality?: number
): Promise<string>;
/**
 * Dumps an array buffer
 * @param width defines the rendering width
 * @param height defines the rendering height
 * @param data the data array
 * @param mimeType defines the mime type of the result
 * @param fileName defines the filename to download. If present, the result will automatically be downloaded
 * @param invertY true to invert the picture in the Y dimension
 * @param toArrayBuffer true to convert the data to an ArrayBuffer (encoded as `mimeType`) instead of a base64 string
 * @param quality The quality of the image if lossy mimeType is used (e.g. image/jpeg, image/webp). See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob()}'s `quality` parameter.
 * @returns a promise that resolve to the final data
 */
export async function DumpDataAsync(
    width: number,
    height: number,
    data: ArrayBufferView,
    mimeType = "image/png",
    fileName?: string,
    invertY = false,
    toArrayBuffer = false,
    quality?: number
): Promise<string | ArrayBuffer> {
    // Convert if data are float32
    if (data instanceof Float32Array) {
        const data2 = new Uint8Array(data.length);
        let n = data.length;
        while (n--) {
            const v = data[n];
            data2[n] = Math.round(Clamp(v) * 255);
        }
        data = data2;
    }

    const resources = await _GetDumpResourcesAsync();

    // Keep the async render + read from the shared canvas atomic
    // eslint-disable-next-line no-async-promise-executor
    return await new Promise<string | ArrayBuffer>(async (resolve) => {
        if (resources.dumpEngine) {
            const dumpEngine = resources.dumpEngine;
            dumpEngine.engine.setSize(width, height, true);

            // Create the image
            const texture = dumpEngine.engine.createRawTexture(data, width, height, Constants.TEXTUREFORMAT_RGBA, false, !invertY, Constants.TEXTURE_NEAREST_NEAREST);

            dumpEngine.renderer.setViewport();
            dumpEngine.renderer.applyEffectWrapper(dumpEngine.wrapper);
            dumpEngine.wrapper.effect._bindTexture("textureSampler", texture);
            dumpEngine.renderer.draw();

            texture.dispose();
        } else {
            const ctx = resources.canvas.getContext("bitmaprenderer") as ImageBitmapRenderingContext;
            resources.canvas.width = width;
            resources.canvas.height = height;

            const imageData = new ImageData(width, height); // ImageData(data, sw, sh) ctor not yet widely implemented
            imageData.data.set(data as Uint8ClampedArray);
            const imageBitmap = await createImageBitmap(imageData, { premultiplyAlpha: "none", imageOrientation: invertY ? "flipY" : "from-image" });

            ctx.transferFromImageBitmap(imageBitmap);
        }

        Tools.ToBlob(
            resources.canvas,
            (blob) => {
                if (!blob) {
                    throw new Error("DumpData: Failed to convert canvas to blob.");
                }

                if (fileName !== undefined) {
                    Tools.DownloadBlob(blob, fileName);
                }

                const fileReader = new FileReader();
                fileReader.onload = (event: any) => {
                    const result = event.target!.result as string | ArrayBuffer;
                    resolve(result);
                };

                if (toArrayBuffer) {
                    fileReader.readAsArrayBuffer(blob);
                } else {
                    fileReader.readAsDataURL(blob);
                }
            },
            mimeType,
            quality
        );
    });
}

/**
 * Dumps an array buffer
 * @param width defines the rendering width
 * @param height defines the rendering height
 * @param data the data array
 * @param successCallback defines the callback triggered once the data are available
 * @param mimeType defines the mime type of the result
 * @param fileName The name of the file to download. If present, the result will automatically be downloaded. If not defined, and `successCallback` is also not defined, the result will automatically be downloaded with an auto-generated file name.
 * @param invertY true to invert the picture in the Y dimension
 * @param toArrayBuffer true to convert the data to an ArrayBuffer (encoded as `mimeType`) instead of a base64 string
 * @param quality The quality of the image if lossy mimeType is used (e.g. image/jpeg, image/webp). See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HTMLCanvasElement.toBlob()}'s `quality` parameter.
 */
export function DumpData(
    width: number,
    height: number,
    data: ArrayBufferView,
    successCallback?: (data: string | ArrayBuffer) => void,
    mimeType = "image/png",
    fileName?: string,
    invertY = false,
    toArrayBuffer = false,
    quality?: number
): void {
    // For back-compat: if no fileName and no callback, force download the result
    if (fileName === undefined && !successCallback) {
        fileName = "";
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    DumpDataAsync(width, height, data, mimeType, fileName, invertY, toArrayBuffer, quality)
        // eslint-disable-next-line github/no-then
        .then((result) => {
            if (successCallback) {
                successCallback(result);
            }
        });
}

/**
 * Dispose the dump tools associated resources
 */
export function Dispose() {
    if (!ResourcesPromise) {
        return;
    }

    // in cases where the engine is not yet created, we need to wait for it to dispose it
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
    ResourcesPromise?.then((resources) => {
        if (resources.canvas instanceof HTMLCanvasElement) {
            resources.canvas.remove();
        }
        if (resources.dumpEngine) {
            resources.dumpEngine.engine.dispose();
            resources.dumpEngine.renderer.dispose();
            resources.dumpEngine.wrapper.dispose();
        }
    });

    ResourcesPromise = null;
}

/**
 * Object containing a set of static utilities functions to dump data from a canvas
 * @deprecated use functions
 */
export const DumpTools = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    DumpData,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    DumpDataAsync,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    DumpFramebuffer,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Dispose,
};

/**
 * This will be executed automatically for UMD and es5.
 * If esm dev wants the side effects to execute they will have to run it manually
 * Once we build native modules those need to be exported.
 * @internal
 */
const InitSideEffects = () => {
    // References the dependencies.
    Tools.DumpData = DumpData;
    Tools.DumpDataAsync = DumpDataAsync;
    Tools.DumpFramebuffer = DumpFramebuffer;
};

InitSideEffects();
