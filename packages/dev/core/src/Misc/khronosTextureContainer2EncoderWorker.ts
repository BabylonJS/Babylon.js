/* eslint-disable @typescript-eslint/naming-convention */
import { type IKTX2EncoderOptions } from "../Materials/Textures/ktx2encoderTypes";

/** @internal */
export interface IKTX2EncoderInstance {
    _initializeAsync(): Promise<void>;
    encode(rgba: Uint8Array, width: number, height: number, options: IKTX2EncoderOptions): Promise<Uint8Array>;
}

/** @internal */
export interface IKTX2EncoderModule {
    KTX2Encoder: {
        new (): IKTX2EncoderInstance;
        JSModule: unknown;
        WasmBinary: ArrayBuffer | null;
        JSModuleURL: string;
        WasmModuleURL: string;
    };
}

/** @internal */
export type KTX2EncoderWorkerRequest =
    | { action: "init"; id: number; jsEncoderModuleUrl: string; basisJsUrl: string; wasmBinary: ArrayBuffer }
    | { action: "encode"; id: number; rgba: Uint8Array; width: number; height: number; options: IKTX2EncoderOptions };

/** @internal */
export type KTX2EncoderWorkerReply = { action: "init"; id: number } | { action: "encoded"; id: number; data: Uint8Array } | { action: "error"; id: number; message: string };

declare const KTX2ENCODER: IKTX2EncoderModule;
declare const BASIS: unknown;
declare function importScripts(...urls: string[]): void;
declare function postMessage(message: KTX2EncoderWorkerReply, transfer?: Transferable[]): void;

/**
 * Self-contained worker entry point, serialized into a Blob by the core adapter.
 * @internal
 */
export function KTX2EncoderWorkerFunction(): void {
    let encoder: IKTX2EncoderInstance | undefined;
    onmessage = (event: MessageEvent<KTX2EncoderWorkerRequest>) => {
        const request = event.data;
        const fail = (error: unknown) => postMessage({ action: "error", id: request.id, message: error instanceof Error ? error.message : String(error) });
        try {
            if (request.action === "init") {
                importScripts(request.jsEncoderModuleUrl, request.basisJsUrl);
                // Avoid async helpers outside this serialized function in ES2015 bundles.
                KTX2ENCODER.KTX2Encoder.JSModule = BASIS;
                KTX2ENCODER.KTX2Encoder.WasmBinary = request.wasmBinary;
                const initialized = new KTX2ENCODER.KTX2Encoder();
                initialized
                    ._initializeAsync()
                    // eslint-disable-next-line github/no-then
                    .then(() => {
                        encoder = initialized;
                        postMessage({ action: "init", id: request.id });
                    })
                    // eslint-disable-next-line github/no-then
                    .catch(fail);
            } else {
                if (!encoder) {
                    throw new Error("KTX2 encoder worker is not initialized.");
                }
                encoder
                    .encode(request.rgba, request.width, request.height, request.options)
                    // eslint-disable-next-line github/no-then
                    .then((data) => postMessage({ action: "encoded", id: request.id, data }, [data.buffer as ArrayBuffer]))
                    // eslint-disable-next-line github/no-then
                    .catch(fail);
            }
        } catch (error) {
            fail(error);
        }
    };
}
