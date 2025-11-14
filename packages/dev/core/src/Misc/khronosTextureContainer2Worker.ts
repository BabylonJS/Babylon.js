import type { IDecodedData } from "core/Materials/Textures/ktx2decoderTypes";

/* eslint-disable @typescript-eslint/naming-convention */
export type AllowedKeys =
    | "wasmBaseUrl"
    | "wasmUASTCToASTC"
    | "wasmUASTCToBC7"
    | "wasmUASTCToRGBA_UNORM"
    | "wasmUASTCToRGBA_SRGB"
    | "wasmUASTCToR8_UNORM"
    | "wasmUASTCToRG8_UNORM"
    | "wasmMSCTranscoder"
    | "wasmZSTDDecoder"
    | "jsDecoderModule"
    | "jsMSCTranscoder";

declare function importScripts(...urls: string[]): void;
declare function postMessage(message: any, transfer?: any[]): void;
declare let KTX2DECODER: any;

export function applyConfig(urls?: { [key in AllowedKeys]: string }, binariesAndModulesContainer?: { [key in AllowedKeys]: ArrayBuffer | any }): void {
    const KTX2DecoderModule = binariesAndModulesContainer?.jsDecoderModule || KTX2DECODER;

    if (urls) {
        if (urls.wasmBaseUrl) {
            KTX2DecoderModule.Transcoder.WasmBaseUrl = urls.wasmBaseUrl;
        }

        if (urls.wasmUASTCToASTC) {
            KTX2DecoderModule.LiteTranscoder_UASTC_ASTC.WasmModuleURL = urls.wasmUASTCToASTC;
        }

        if (urls.wasmUASTCToBC7) {
            KTX2DecoderModule.LiteTranscoder_UASTC_BC7.WasmModuleURL = urls.wasmUASTCToBC7;
        }

        if (urls.wasmUASTCToRGBA_UNORM) {
            KTX2DecoderModule.LiteTranscoder_UASTC_RGBA_UNORM.WasmModuleURL = urls.wasmUASTCToRGBA_UNORM;
        }

        if (urls.wasmUASTCToRGBA_SRGB) {
            KTX2DecoderModule.LiteTranscoder_UASTC_RGBA_SRGB.WasmModuleURL = urls.wasmUASTCToRGBA_SRGB;
        }

        if (urls.wasmUASTCToR8_UNORM) {
            KTX2DecoderModule.LiteTranscoder_UASTC_R8_UNORM.WasmModuleURL = urls.wasmUASTCToR8_UNORM;
        }

        if (urls.wasmUASTCToRG8_UNORM) {
            KTX2DecoderModule.LiteTranscoder_UASTC_RG8_UNORM.WasmModuleURL = urls.wasmUASTCToRG8_UNORM;
        }

        if (urls.jsMSCTranscoder) {
            KTX2DecoderModule.MSCTranscoder.JSModuleURL = urls.jsMSCTranscoder;
        }

        if (urls.wasmMSCTranscoder) {
            KTX2DecoderModule.MSCTranscoder.WasmModuleURL = urls.wasmMSCTranscoder;
        }

        if (urls.wasmZSTDDecoder) {
            KTX2DecoderModule.ZSTDDecoder.WasmModuleURL = urls.wasmZSTDDecoder;
        }
    }
    if (binariesAndModulesContainer) {
        if (binariesAndModulesContainer.wasmUASTCToASTC) {
            KTX2DecoderModule.LiteTranscoder_UASTC_ASTC.WasmBinary = binariesAndModulesContainer.wasmUASTCToASTC;
        }
        if (binariesAndModulesContainer.wasmUASTCToBC7) {
            KTX2DecoderModule.LiteTranscoder_UASTC_BC7.WasmBinary = binariesAndModulesContainer.wasmUASTCToBC7;
        }
        if (binariesAndModulesContainer.wasmUASTCToRGBA_UNORM) {
            KTX2DecoderModule.LiteTranscoder_UASTC_RGBA_UNORM.WasmBinary = binariesAndModulesContainer.wasmUASTCToRGBA_UNORM;
        }
        if (binariesAndModulesContainer.wasmUASTCToRGBA_SRGB) {
            KTX2DecoderModule.LiteTranscoder_UASTC_RGBA_SRGB.WasmBinary = binariesAndModulesContainer.wasmUASTCToRGBA_SRGB;
        }
        if (binariesAndModulesContainer.wasmUASTCToR8_UNORM) {
            KTX2DecoderModule.LiteTranscoder_UASTC_R8_UNORM.WasmBinary = binariesAndModulesContainer.wasmUASTCToR8_UNORM;
        }
        if (binariesAndModulesContainer.wasmUASTCToRG8_UNORM) {
            KTX2DecoderModule.LiteTranscoder_UASTC_RG8_UNORM.WasmBinary = binariesAndModulesContainer.wasmUASTCToRG8_UNORM;
        }
        if (binariesAndModulesContainer.jsMSCTranscoder) {
            KTX2DecoderModule.MSCTranscoder.JSModule = binariesAndModulesContainer.jsMSCTranscoder;
        }
        if (binariesAndModulesContainer.wasmMSCTranscoder) {
            KTX2DecoderModule.MSCTranscoder.WasmBinary = binariesAndModulesContainer.wasmMSCTranscoder;
        }
        if (binariesAndModulesContainer.wasmZSTDDecoder) {
            KTX2DecoderModule.ZSTDDecoder.WasmBinary = binariesAndModulesContainer.wasmZSTDDecoder;
        }
    }
}

export function workerFunction(KTX2DecoderModule: any): void {
    if (typeof KTX2DecoderModule === "undefined" && typeof KTX2DECODER !== "undefined") {
        KTX2DecoderModule = KTX2DECODER;
    }
    let ktx2Decoder: any;

    onmessage = (event) => {
        if (!event.data) {
            return;
        }
        switch (event.data.action) {
            case "init": {
                const urls = event.data.urls;
                if (urls) {
                    if (urls.jsDecoderModule && typeof KTX2DecoderModule === "undefined") {
                        importScripts(urls.jsDecoderModule);
                        // assuming global namespace populated by the script (UMD pattern)
                        KTX2DecoderModule = KTX2DECODER;
                    }
                    applyConfig(urls);
                }
                if (event.data.wasmBinaries) {
                    applyConfig(undefined, { ...event.data.wasmBinaries, jsDecoderModule: KTX2DecoderModule });
                }
                ktx2Decoder = new KTX2DecoderModule.KTX2Decoder();
                postMessage({ action: "init" });
                break;
            }
            case "setDefaultDecoderOptions": {
                KTX2DecoderModule.KTX2Decoder.DefaultDecoderOptions = event.data.options;
                break;
            }
            case "decode":
                ktx2Decoder
                    .decode(event.data.data, event.data.caps, event.data.options)
                    // eslint-disable-next-line github/no-then
                    .then((data: IDecodedData) => {
                        const buffers = [];
                        for (let mip = 0; mip < data.mipmaps.length; ++mip) {
                            const mipmap = data.mipmaps[mip];
                            if (mipmap && mipmap.data) {
                                buffers.push(mipmap.data.buffer);
                            }
                        }
                        postMessage({ action: "decoded", success: true, decodedData: data }, buffers);
                    })
                    // eslint-disable-next-line github/no-then
                    .catch((reason: any) => {
                        postMessage({ action: "decoded", success: false, msg: reason });
                    });
                break;
        }
    };
}

export async function initializeWebWorker(worker: Worker, wasmBinaries?: { [key in AllowedKeys]?: ArrayBuffer }, urls?: { [key in AllowedKeys]: string }): Promise<Worker> {
    return await new Promise((resolve, reject) => {
        const onError = (error: ErrorEvent) => {
            worker.removeEventListener("error", onError);
            worker.removeEventListener("message", onMessage);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(error);
        };

        const onMessage = (message: MessageEvent) => {
            if (message.data.action === "init") {
                worker.removeEventListener("error", onError);
                worker.removeEventListener("message", onMessage);
                resolve(worker);
            }
        };

        worker.addEventListener("error", onError);
        worker.addEventListener("message", onMessage);

        worker.postMessage({
            action: "init",
            urls,
            wasmBinaries,
        });
    });
}
