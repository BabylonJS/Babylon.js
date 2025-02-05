/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "../types";
import { Tools } from "./tools";
import { initializeWebWorker, EncodeToBasisu, workerFunction } from "./basisuEncoderWorker";
import { AutoReleaseWorkerPool } from "./workerPool";
import type { WorkerPool } from "./workerPool";
import { _GetDefaultNumWorkers } from "core/Meshes/Compression/dracoCodec";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Constants } from "core/Engines/constants";
import { Logger } from "./logger";
import { GetTextureDataAsync } from "./textureTools";

// Q: No typings are available for the Basis Universal API. Should we define them, or leave it alone for now?
declare let BASIS: any;

/**
 * Parameters for the Basis Universal encoder.
 * @internal
 */
export type BasisuEncoderOptions = {
    /**
     * Width of the source image
     */
    width: number;
    /**
     * Height of the source image
     */
    height: number;
    /**
     * If true, the input is assumed to be in sRGB space. (Examples: True on photos, albedo/spec maps, and false on normal maps.)
     */
    useSRGBBuffer: boolean;
};

interface IBasisuEncoderConfiguration {
    /**
     * The url to the WebAssembly module.
     */
    WasmURL: string;
    /**
     * The url to the WebAssembly module.
     */
    WasmBinaryURL: string;
    /**
     * The number of workers for async operations. Specify `0` to disable web workers and run synchronously in the current context.
     */
    numWorkers: number;
}

function IsWasmAvailable(): boolean {
    // All modern browsers and Node.js should support WebAssembly and URL.createObjectURL, but check just in case
    // See https://developer.mozilla.org/en-US/docs/Web/API/URL and https://developer.mozilla.org/en-US/docs/WebAssembly
    const url = typeof URL !== "undefined" && typeof URL.createObjectURL !== "undefined";
    const wasm = typeof WebAssembly !== "undefined";
    return url && wasm;
}

async function CreateWorkerPoolAsync(): Promise<WorkerPool> {
    const url = Tools.GetBabylonScriptURL(BasisuEncoderConfiguration.WasmURL);
    const wasmBinary = await Tools.LoadFileAsync(Tools.GetBabylonScriptURL(BasisuEncoderConfiguration.WasmBinaryURL, true));

    const workerContent = `${EncodeToBasisu}(${workerFunction})()`;
    const workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: "application/javascript" }));

    return new AutoReleaseWorkerPool(1, () => {
        const worker = new Worker(workerBlobUrl);
        return initializeWebWorker(worker, wasmBinary, url);
    });
}

async function CreateModuleAsync(): Promise<any> {
    // If module was already loaded in this context
    if (typeof BASIS !== "undefined") {
        await Tools.LoadBabylonScriptAsync(BasisuEncoderConfiguration.WasmURL);
    }
    const wasmBinary = await Tools.LoadFileAsync(Tools.GetBabylonScriptURL(BasisuEncoderConfiguration.WasmBinaryURL, true));
    return BASIS({ wasmBinary });
}

let _module: Nullable<any> = null;
let _workerPool: Nullable<WorkerPool> = null;

async function EncodeData(slicedSourceImage: Uint8Array, options: BasisuEncoderOptions): Promise<Uint8Array> {
    if (!IsWasmAvailable()) {
        throw new Error("Basis transcoder requires an environment with URL and WebAssembly support.");
    }

    // Use main thread if no workers are available
    if (BasisuEncoderConfiguration.numWorkers === 0 || typeof Worker === "undefined") {
        if (!_module) {
            _module = await CreateModuleAsync();
        }
        return EncodeToBasisu(_module, slicedSourceImage, options);
    }

    if (!_workerPool) {
        _workerPool = await CreateWorkerPoolAsync();
    }

    return new Promise<Uint8Array>((resolve, reject) => {
        _workerPool!.push((worker, onComplete) => {
            const onError = (error: ErrorEvent) => {
                worker.removeEventListener("error", onError);
                worker.removeEventListener("message", onMessage);
                reject(error);
                onComplete();
            };

            const onMessage = (msg: any) => {
                if (msg.data.action === "encodeDone") {
                    worker.removeEventListener("message", onMessage);
                    worker.removeEventListener("error", onError);
                    resolve(msg.data.encodedImageData);
                    onComplete();
                }
            };

            worker.addEventListener("message", onMessage);
            worker.addEventListener("error", onError);

            worker.postMessage({ action: "encode", imageData: slicedSourceImage, params: options }, [slicedSourceImage.buffer]);
        });
    });
}

function GetDefaultBasisuEncoderOptions(babylonTexture: BaseTexture): BasisuEncoderOptions {
    // To expose more options, use default values from EncodeToBasisu in basisuEncoderWorker.ts.
    const defaultOptions: BasisuEncoderOptions = {
        width: babylonTexture.getSize().width,
        height: babylonTexture.getSize().height,
        useSRGBBuffer: babylonTexture._texture?._useSRGBBuffer ?? babylonTexture.gammaSpace,
    };
    return defaultOptions;
}

/**
 * Default configuration for the Basis Universal encoder. Defaults to the following:
 * - numWorkers: 50% of the available logical processors, capped to 4. If no logical processors are available, defaults to 1.
 * - wasmUrl: `"https://cdn.babylonjs.com/basis_encoder.js"`
 * - wasmBinaryUrl: `"https://cdn.babylonjs.com/basis_encoder.wasm"`
 */
export const BasisuEncoderConfiguration: IBasisuEncoderConfiguration = {
    WasmURL: `${Tools._DefaultCdnUrl}/basis_encoder.js`,
    WasmBinaryURL: `${Tools._DefaultCdnUrl}/basis_encoder.wasm`,
    numWorkers: _GetDefaultNumWorkers(),
};

/**
 * Encodes non-HDR, non-cube texture data to a KTX v2 image with Basis Universal supercompression.
 *
 * NOTE: Encoding parameters are deduced using the Babylon texture. For example, if the texture is in linear space,
 * we assume that the texture contains non-color data and select a higher-quality compression for accuracy.
 * Conversely, textures in sRGB are assumed to be color data and are compressed with a lower-quality, but faster, method.
 * See https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXArtistGuide.md for more information.
 *
 * @param babylonTexture the babylon texture to encode
 * @returns a promise resulting in the basis-encoded image data
 * @experimental
 */
export async function EncodeBasisu(babylonTexture: BaseTexture): Promise<Uint8Array> {
    if (babylonTexture.isCube) {
        throw new Error(`Cube textures are not currently supported for BasisU encoding.`);
    }
    if (babylonTexture.textureType !== Constants.TEXTURETYPE_UNSIGNED_BYTE && babylonTexture.textureType !== Constants.TEXTURETYPE_BYTE) {
        Logger.Warn("Texture data will be converted into unsigned bytes for Basis encoding. This may result in loss of precision.");
    }

    const pixels = await GetTextureDataAsync(babylonTexture, babylonTexture.getSize().width, babylonTexture.getSize().height);
    const options = GetDefaultBasisuEncoderOptions(babylonTexture);
    return EncodeData(pixels, options);
}
