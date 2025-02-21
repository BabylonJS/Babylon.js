import type { Nullable } from "../types";
import { Tools } from "./tools";
import { initializeWebWorker, EncodeImageData, workerFunction } from "./basisEncoderWorker";
import type { BasisEncoderParameters } from "./basisEncoderWorker";
import { AutoReleaseWorkerPool } from "./workerPool";
import type { WorkerPool } from "./workerPool";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Constants } from "core/Engines/constants";
import { Logger } from "./logger";
import { GetTextureDataAsync, WhenTextureReadyAsync } from "./textureTools";
import { _GetDefaultNumWorkers, _IsWasmConfigurationAvailable } from "./workerUtils";

declare let BASIS: any; // FUTURE TODO: Create TS declaration file for the Basis Universal API

let _modulePromise: Nullable<Promise<any>> = null;
let _workerPoolPromise: Nullable<Promise<WorkerPool>> = null;

type IBasisEncoderConfiguration = {
    /**
     * The url to the WebAssembly module.
     */
    wasmUrl: string;
    /**
     * The url to the WebAssembly module.
     */
    wasmBinaryUrl: string;
    /**
     * The number of workers for async operations. Specify `0` to disable web workers and run synchronously in the current context.
     */
    numWorkers: number;
};

/**
 * Supported Basis Universal formats for encoding.
 * For best results, use ETC1S with color data and UASTC_LDR_4x4 with non-color data.
 */
export type BasisFormat = "ETC1S" | "UASTC4x4";

/**
 * Default configuration for the Basis Universal encoder. Defaults to the following:
 * - numWorkers: 50% of the available logical processors, capped to 4. If no logical processors are available, defaults to 1.
 * - wasmUrl: `"https://cdn.babylonjs.com/basis_encoder.js"`
 * - wasmBinaryUrl: `"https://cdn.babylonjs.com/basis_encoder.wasm"`
 */
export const BasisEncoderConfiguration: IBasisEncoderConfiguration = {
    wasmUrl: `${Tools._DefaultCdnUrl}/basis_encoder.js`,
    wasmBinaryUrl: `${Tools._DefaultCdnUrl}/basis_encoder.wasm`,
    numWorkers: _GetDefaultNumWorkers(),
};

/**
 * Initialize resources for the Basis Universal encoder.
 * @returns a promise that resolves when the Basis Universal encoder resources are initialized
 */
export async function InitializeBasisEncoderAsync(): Promise<void> {
    InitializeBasisEncoder();
    if (_modulePromise) {
        await _modulePromise;
        return;
    }
    if (_workerPoolPromise) {
        await _workerPoolPromise;
    }
}

/**
 * Dispose of resources for the Basis Universal encoder.
 */
export function DisposeBasisEncoder(): void {
    if (_workerPoolPromise) {
        _workerPoolPromise.then((workerPool) => {
            workerPool.dispose();
        });
    }
    _workerPoolPromise = null;
    _modulePromise = null;
}

/**
 * Encodes non-HDR, non-cube texture data to a KTX v2 image with Basis Universal supercompression. Example:
 * ```typescript
 * InitializeBasisEncoderAsync();
 * const texture = new Texture("texture.png", scene);
 * const ktx2Data = await EncodeTextureToBasisAsync(texture, { basisFormat: "UASTC4x4" });
 * DisposeBasisEncoder();
 * ```
 * @param babylonTexture the Babylon texture to encode
 * @param options additional options for encoding
 * - `basisFormat` - the desired encoding format. Defaults to UASTC4x4. It is recommended
 * to use ETC1S for color data (e.g., albedo, specular) and UASTC4x4 for non-color data (e.g. bump).
 * For more details, see https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXArtistGuide.md.
 * @returns a promise resolving with the basis-encoded image data
 * @experimental This API is subject to change in the future.
 */
export async function EncodeTextureToBasisAsync(babylonTexture: BaseTexture, options?: Pick<BasisEncoderParameters, "basisFormat">): Promise<Uint8Array> {
    // Wait for texture to load so we can get its size
    await WhenTextureReadyAsync(babylonTexture);

    // Validate texture properties
    const size = babylonTexture.getSize();
    if ((size.width & 3) !== 0 || (size.height & 3) !== 0) {
        throw new Error(`Texture dimensions must be a multiple of 4 for Basis encoding.`);
    }
    if (babylonTexture.isCube) {
        throw new Error(`Cube textures are not currently supported for Basis encoding.`);
    }
    if (babylonTexture.textureType !== Constants.TEXTURETYPE_UNSIGNED_BYTE && babylonTexture.textureType !== Constants.TEXTURETYPE_BYTE) {
        Logger.Warn("Texture data will be converted into unsigned bytes for Basis encoding. This may result in loss of precision.");
    }

    const pixels = await GetTextureDataAsync(babylonTexture, size.width, size.height);

    const finalOptions: BasisEncoderParameters = {
        width: size.width,
        height: size.height,
        basisFormat: options?.basisFormat ?? "UASTC4x4",
        isSRGB: babylonTexture._texture?._useSRGBBuffer || babylonTexture.gammaSpace,
    };

    return EncodeDataAsync(pixels, finalOptions);
}

async function EncodeDataAsync(slicedSourceImage: Uint8Array, parameters: BasisEncoderParameters): Promise<Uint8Array> {
    if (_modulePromise) {
        const module = await _modulePromise;
        return EncodeImageData(module, slicedSourceImage, parameters);
    }

    if (_workerPoolPromise) {
        const workerPool = await _workerPoolPromise;
        return new Promise<Uint8Array>((resolve, reject) => {
            workerPool.push((worker, onComplete) => {
                const onError = (error: ErrorEvent) => {
                    worker.removeEventListener("error", onError);
                    worker.removeEventListener("message", onMessage);
                    reject(error);
                    onComplete();
                };

                const onMessage = (msg: MessageEvent) => {
                    if (msg.data.id === "encodeDone") {
                        worker.removeEventListener("message", onMessage);
                        worker.removeEventListener("error", onError);
                        resolve(msg.data.encodedImageData);
                        onComplete();
                    }
                };

                worker.addEventListener("message", onMessage);
                worker.addEventListener("error", onError);

                worker.postMessage({ id: "encode", imageData: slicedSourceImage, params: parameters }, [slicedSourceImage.buffer]);
            });
        });
    }

    throw new Error("Basis encoder resources are not initialized.");
}

function InitializeBasisEncoder(): void {
    const config = BasisEncoderConfiguration;
    if (!_IsWasmConfigurationAvailable(config.wasmUrl, config.wasmBinaryUrl)) {
        throw new Error("Cannot use Basis Encoder configuration. Check configuration and verify environment WebAssembly support.");
    }

    // Use main thread if no workers are available
    const workerSupported = typeof Worker === "function" && typeof URL === "function" && typeof URL.createObjectURL === "function";
    if (!workerSupported || BasisEncoderConfiguration.numWorkers === 0) {
        if (!_modulePromise) {
            _modulePromise = CreateModuleAsync();
        }
        return;
    }

    if (!_workerPoolPromise) {
        _workerPoolPromise = CreateWorkerPoolAsync();
    }
}

async function CreateWorkerPoolAsync(): Promise<WorkerPool> {
    const url = Tools.GetBabylonScriptURL(BasisEncoderConfiguration.wasmUrl);
    const wasmBinary = await Tools.LoadFileAsync(Tools.GetBabylonScriptURL(BasisEncoderConfiguration.wasmBinaryUrl, true));

    const workerContent = `${EncodeImageData}(${workerFunction})()`;
    const workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: "application/javascript" }));

    return new AutoReleaseWorkerPool(BasisEncoderConfiguration.numWorkers, () => {
        const worker = new Worker(workerBlobUrl);
        return initializeWebWorker(worker, wasmBinary, url);
    });
}

async function CreateModuleAsync(): Promise<any> {
    // If module was already loaded in this context
    if (typeof BASIS === "undefined") {
        await Tools.LoadBabylonScriptAsync(BasisEncoderConfiguration.wasmUrl);
    }
    const wasmBinary = await Tools.LoadFileAsync(Tools.GetBabylonScriptURL(BasisEncoderConfiguration.wasmBinaryUrl, true));
    return BASIS({ wasmBinary });
}
