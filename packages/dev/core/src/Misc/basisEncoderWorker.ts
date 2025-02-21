import type { BasisFormat } from "./basisEncoder";

// WorkerGlobalScope
declare function importScripts(...urls: string[]): void;
declare function postMessage(message: any, transfer?: any[]): void;
declare let BASIS: any;

// For now, keep here until ready to expand and expose this to the public API.
/**
 * Parameters for the Basis Universal encoder.
 * @internal
 */
export type BasisEncoderParameters = {
    /**
     * Width of the source image
     */
    width: number;
    /**
     * Height of the source image
     */
    height: number;
    /**
     * The desired Basis Universal encoding format.
     */
    basisFormat: BasisFormat;
    /**
     * If true, the input is assumed to be in sRGB space
     */
    isSRGB: boolean;
};

/**
 * API reference: https://github.com/BinomialLLC/basis_universal/blob/master/webgl/transcoder/basis_wrappers.cpp.
 * @internal
 */
export function EncodeImageData(basisModule: any, imgData: Uint8Array, params: BasisEncoderParameters): Uint8Array {
    let basisEncoder = null;

    try {
        basisModule.initializeBasis();
        basisEncoder = new basisModule.BasisEncoder();
        basisEncoder.setSliceSourceImage(0, imgData, params.width, params.height, basisModule.ldr_image_type.cRGBA32.value);
        basisEncoder.setFormatMode(basisModule.basis_tex_format[`c${params.basisFormat}`].value);

        // Set sRGB parameters, which should almost always match each other.
        basisEncoder.setPerceptual(params.isSRGB);
        basisEncoder.setMipSRGB(params.isSRGB);
        basisEncoder.setKTX2SRGBTransferFunc(params.isSRGB);

        // Set hardcoded parameters. Expose these as needed in the future via BasisEncoderParameters.
        basisEncoder.setTexType(basisModule.basis_texture_type.cBASISTexType2D.value); // Use 2D textures
        basisEncoder.setMipGen(true); // Generate mipmaps just in case
        basisEncoder.setCreateKTX2File(true); // Use KTX2 container format
        if (params.basisFormat === "ETC1S") {
            basisEncoder.setQualityLevel(127); // Controls the file size vs. quality tradeoff for ETC1S. Range is [1, 255]
        } else if (params.basisFormat === "UASTC4x4") {
            basisEncoder.setKTX2UASTCSupercompression(true); // Use Zstd supercompression. Only applicable to UASTC KTX2 files
        }

        // The official demo uses a magic number for the size of the allocation. See:
        // https://github.com/BinomialLLC/basis_universal/blob/2d4fe933b2e46ebb2874f9160d076a238699fd86/webgl/encode_test/index.html#L420
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
                    throw new Error("Basis encoder module is not available");
                }
                encoderModulePromise!.then((module) => {
                    const encodedFile = EncodeImageData(module, message.imageData, message.params);
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
