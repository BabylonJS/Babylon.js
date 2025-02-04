/* eslint-disable @typescript-eslint/naming-convention */
import type { BasisuEncoderOptions } from "./basisuEncoder";

// WorkerGlobalScope
declare function importScripts(...urls: string[]): void;
declare function postMessage(message: any, transfer?: any[]): void;
declare let BASIS: any;

/**
 * API reference: https://github.com/BinomialLLC/basis_universal/blob/master/webgl/transcoder/basis_wrappers.cpp.
 * @internal
 */
export function EncodeToBasisu(basisModule: any, imgData: Uint8Array, params: BasisuEncoderOptions): Uint8Array {
    let basisEncoder = null;

    try {
        basisModule.initializeBasis();
        basisEncoder = new basisModule.BasisEncoder();
        basisEncoder.setSliceSourceImage(0, imgData, params.width, params.height, basisModule.ldr_image_type.cRGBA32.value);

        basisEncoder.setDebug(true);

        // Set sRGB options, which should almost always match each other.
        basisEncoder.setPerceptual(params.useSRGBBuffer);
        basisEncoder.setMipSRGB(params.useSRGBBuffer);
        basisEncoder.setKTX2SRGBTransferFunc(params.useSRGBBuffer);

        // Set other hardcoded options. Expose these as needed in the future.
        // Q: We should eventually expose these, especially the quality level, but is that in the scope of this PR?
        basisEncoder.setTexType(basisModule.basis_texture_type.cBASISTexType2D.value); // Only 2D textures are supported
        basisEncoder.setFormatMode(params.useSRGBBuffer ? 0 : 1); // Deduce whether UASTC LDR 4x4 (0) or ETC1S (1)
        basisEncoder.setMipGen(true); // Generate mipmaps
        basisEncoder.setQualityLevel(127); // Controls the file size vs. quality tradeoff for ETC1S. Range is [1, 255]
        basisEncoder.setCreateKTX2File(true); // Create KTX2 file
        basisEncoder.setKTX2UASTCSupercompression(true); // Use Zstd supercompression. Only for UASTC KTX2 files

        // Magic number. See https://github.com/BinomialLLC/basis_universal/blob/2d4fe933b2e46ebb2874f9160d076a238699fd86/webgl/encode_test/index.html#L420
        // "Create a destination buffer to hold the compressed file data. If this buffer isn't large enough compression will fail."
        const basisFileData = new Uint8Array(1024 * 1024 * 10);

        const encodedLength = basisEncoder.encode(basisFileData);
        if (encodedLength === 0) {
            throw new Error("Basis Universal encoding failed.");
        }

        const encodedTextureFile = new Uint8Array(basisFileData.buffer, 0, encodedLength);
        return encodedTextureFile;
    } finally {
        if (basisEncoder) {
            basisEncoder.delete();
        }
    }
}

/**
 * The worker function that gets converted to a blob url to pass into a worker.
 * To be used if a developer wants to create their own worker instance and inject it instead of using the default worker.
 */
export function workerFunction(): void {
    let encoderModulePromise: PromiseLike<unknown> | undefined;

    onmessage = (event) => {
        const message = event.data;
        switch (message.id) {
            case "init": {
                // if URL is provided then load the script. Otherwise expect the script to be loaded already
                if (message.url) {
                    importScripts(message.url);
                }
                encoderModulePromise = encoderModulePromise ?? BASIS({ wasmBinary: message.wasmBinary });
                postMessage({ id: "initDone" });
                break;
            }
            case "encode": {
                if (!encoderModulePromise) {
                    throw new Error("Basisu encoder module is not available");
                }
                encoderModulePromise!.then((module) => {
                    const encodedFile = EncodeToBasisu(module, message.imageData, message.params);
                    postMessage({ id: "encodeDone", encodedImageData: encodedFile }, [encodedFile.buffer]);
                });
                break;
            }
        }
    };
}

/**
 * Initialize a web worker with the basis encoder
 * @param worker the worker to initialize
 * @param wasmBinary the wasm binary to load into the worker
 * @param moduleUrl the url to the basis encoder module
 * @returns a promise that resolves when the worker is initialized
 * @internal
 */
export function initializeWebWorker(worker: Worker, wasmBinary: ArrayBuffer, moduleUrl?: string) {
    return new Promise<Worker>((resolve, reject) => {
        const onError = (error: ErrorEvent) => {
            worker.removeEventListener("error", onError);
            worker.removeEventListener("message", onMessage);
            reject(error);
        };

        const onMessage = (event: MessageEvent) => {
            if (event.data.id === "initDone") {
                worker.removeEventListener("error", onError);
                worker.removeEventListener("message", onMessage);
                resolve(worker);
            }
        };

        worker.addEventListener("error", onError);
        worker.addEventListener("message", onMessage);

        // clone the array buffer to make it transferable
        const clone = wasmBinary.slice(0);
        worker.postMessage(
            {
                id: "init",
                url: moduleUrl,
                wasmBinary: clone,
            },
            [clone]
        );
    });
}
