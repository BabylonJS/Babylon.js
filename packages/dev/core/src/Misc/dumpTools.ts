/* eslint-disable @typescript-eslint/no-unused-vars */
import { _WarnImport } from "./devTools";

import type { ThinEngine } from "../Engines/thinEngine";
import { Constants } from "../Engines/constants";
import { EffectRenderer, EffectWrapper } from "../Materials/effectRenderer";
import { Tools } from "./tools";
import type { Nullable } from "../types";
import { Clamp } from "../Maths/math.scalar.functions";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { EngineStore } from "../Engines/engineStore";

type DumpToolsEngine = {
    canvas: HTMLCanvasElement | OffscreenCanvas;
    engine: ThinEngine;
    renderer: EffectRenderer;
    wrapper: EffectWrapper;
};

let DumpToolsEngine: Nullable<DumpToolsEngine>;

let EnginePromise: Promise<DumpToolsEngine> | null = null;

async function _CreateDumpRendererAsync(): Promise<DumpToolsEngine> {
    if (!EnginePromise) {
        EnginePromise = new Promise((resolve, reject) => {
            let canvas: HTMLCanvasElement | OffscreenCanvas;
            let engine: Nullable<ThinEngine> = null;
            const options = {
                preserveDrawingBuffer: true,
                depth: false,
                stencil: false,
                alpha: true,
                premultipliedAlpha: false,
                antialias: false,
                failIfMajorPerformanceCaveat: false,
            };
            import("../Engines/thinEngine")
                // eslint-disable-next-line github/no-then
                .then(({ ThinEngine: thinEngineClass }) => {
                    const engineInstanceCount = EngineStore.Instances.length;
                    try {
                        canvas = new OffscreenCanvas(100, 100); // will be resized later
                        engine = new thinEngineClass(canvas, false, options);
                    } catch (e) {
                        if (engineInstanceCount < EngineStore.Instances.length) {
                            // The engine was created by another instance, let's use it
                            EngineStore.Instances.pop()?.dispose();
                        }
                        // The browser either does not support OffscreenCanvas or WebGL context in OffscreenCanvas, fallback on a regular canvas
                        canvas = document.createElement("canvas");
                        engine = new thinEngineClass(canvas, false, options);
                    }
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
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
                    import("../Shaders/pass.fragment").then(({ passPixelShader }) => {
                        if (!engine) {
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            reject("Engine is not defined");
                            return;
                        }
                        const wrapper = new EffectWrapper({
                            engine,
                            name: passPixelShader.name,
                            fragmentShader: passPixelShader.shader,
                            samplerNames: ["textureSampler"],
                        });
                        DumpToolsEngine = {
                            canvas,
                            engine,
                            renderer,
                            wrapper,
                        };
                        resolve(DumpToolsEngine);
                    });
                })
                // eslint-disable-next-line github/no-then
                .catch(reject);
        });
    }
    return await EnginePromise;
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
    return await new Promise((resolve) => {
        DumpData(width, height, data, (result) => resolve(result), mimeType, fileName, invertY, toArrayBuffer, quality);
    });
}

/**
 * Dumps an array buffer
 * @param width defines the rendering width
 * @param height defines the rendering height
 * @param data the data array
 * @param successCallback defines the callback triggered once the data are available
 * @param mimeType defines the mime type of the result
 * @param fileName defines the filename to download. If present, the result will automatically be downloaded
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
    // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
    _CreateDumpRendererAsync().then((renderer) => {
        renderer.engine.setSize(width, height, true);

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

        // Create the image
        const texture = renderer.engine.createRawTexture(data, width, height, Constants.TEXTUREFORMAT_RGBA, false, !invertY, Constants.TEXTURE_NEAREST_NEAREST);

        renderer.renderer.setViewport();
        renderer.renderer.applyEffectWrapper(renderer.wrapper);
        renderer.wrapper.effect._bindTexture("textureSampler", texture);
        renderer.renderer.draw();

        if (toArrayBuffer) {
            Tools.ToBlob(
                renderer.canvas,
                (blob) => {
                    const fileReader = new FileReader();
                    fileReader.onload = (event: any) => {
                        const arrayBuffer = event.target!.result as ArrayBuffer;
                        if (successCallback) {
                            successCallback(arrayBuffer);
                        }
                    };
                    fileReader.readAsArrayBuffer(blob!);
                },
                mimeType,
                quality
            );
        } else {
            Tools.EncodeScreenshotCanvasData(renderer.canvas, successCallback, mimeType, fileName, quality);
        }

        texture.dispose();
    });
}

/**
 * Dispose the dump tools associated resources
 */
export function Dispose() {
    if (DumpToolsEngine) {
        DumpToolsEngine.wrapper.dispose();
        DumpToolsEngine.renderer.dispose();
        DumpToolsEngine.engine.dispose();
    } else {
        // in cases where the engine is not yet created, we need to wait for it to dispose it
        // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
        EnginePromise?.then((dumpToolsEngine) => {
            dumpToolsEngine.wrapper.dispose();
            dumpToolsEngine.renderer.dispose();
            dumpToolsEngine.engine.dispose();
        });
    }
    EnginePromise = null;
    DumpToolsEngine = null;
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
