import { Tools } from "../../Misc/tools";
import { WorkerPool } from '../../Misc/workerPool';
import { Nullable } from "../../types";
import { IDisposable } from "../../scene";
import { VertexData } from "../../Meshes/mesh.vertexData";

declare var DracoDecoderModule: any;
declare var WebAssembly: any;

// WorkerGlobalScope
declare function importScripts(...urls: string[]): void;
declare function postMessage(message: any, transfer?: any[]): void;

function createDecoderAsync(wasmBinary?: ArrayBuffer): Promise<any> {
    return new Promise((resolve) => {
        DracoDecoderModule({ wasmBinary: wasmBinary }).then((module: any) => {
            resolve({ module: module });
        });
    });
}

function decodeMesh(decoderModule: any, dataView: ArrayBufferView, attributes: { [kind: string]: number } | undefined, onIndicesData: (data: Uint32Array) => void, onAttributeData: (kind: string, data: Float32Array) => void): void {
    const buffer = new decoderModule.DecoderBuffer();
    buffer.Init(dataView, dataView.byteLength);

    const decoder = new decoderModule.Decoder();
    let geometry: any;
    let status: any;

    try {
        const type = decoder.GetEncodedGeometryType(buffer);
        switch (type) {
            case decoderModule.TRIANGULAR_MESH:
                geometry = new decoderModule.Mesh();
                status = decoder.DecodeBufferToMesh(buffer, geometry);
                break;
            case decoderModule.POINT_CLOUD:
                geometry = new decoderModule.PointCloud();
                status = decoder.DecodeBufferToPointCloud(buffer, geometry);
                break;
            default:
                throw new Error(`Invalid geometry type ${type}`);
        }

        if (!status.ok() || !geometry.ptr) {
            throw new Error(status.error_msg());
        }

        const numPoints = geometry.num_points();

        if (type === decoderModule.TRIANGULAR_MESH) {
            const numFaces = geometry.num_faces();
            const faceIndices = new decoderModule.DracoInt32Array();
            try {
                const indices = new Uint32Array(numFaces * 3);
                for (let i = 0; i < numFaces; i++) {
                    decoder.GetFaceFromMesh(geometry, i, faceIndices);
                    const offset = i * 3;
                    indices[offset + 0] = faceIndices.GetValue(0);
                    indices[offset + 1] = faceIndices.GetValue(1);
                    indices[offset + 2] = faceIndices.GetValue(2);
                }
                onIndicesData(indices);
            }
            finally {
                decoderModule.destroy(faceIndices);
            }
        }

        const processAttribute = (kind: string, attribute: any) => {
            const dracoData = new decoderModule.DracoFloat32Array();
            try {
                decoder.GetAttributeFloatForAllPoints(geometry, attribute, dracoData);
                const numComponents = attribute.num_components();
                if (kind === "color" && numComponents === 3) {
                    const babylonData = new Float32Array(numPoints * 4);
                    for (let i = 0, j = 0; i < babylonData.length; i += 4, j += numComponents) {
                        babylonData[i + 0] = dracoData.GetValue(j + 0);
                        babylonData[i + 1] = dracoData.GetValue(j + 1);
                        babylonData[i + 2] = dracoData.GetValue(j + 2);
                        babylonData[i + 3] = 1;
                    }
                    onAttributeData(kind, babylonData);
                }
                else {
                    const babylonData = new Float32Array(numPoints * numComponents);
                    for (let i = 0; i < babylonData.length; i++) {
                        babylonData[i] = dracoData.GetValue(i);
                    }
                    onAttributeData(kind, babylonData);
                }
            }
            finally {
                decoderModule.destroy(dracoData);
            }
        };

        if (attributes) {
            for (const kind in attributes) {
                const id = attributes[kind];
                const attribute = decoder.GetAttributeByUniqueId(geometry, id);
                processAttribute(kind, attribute);
            }
        }
        else {
            const nativeAttributeTypes: { [kind: string]: string } = {
                "position": "POSITION",
                "normal": "NORMAL",
                "color": "COLOR",
                "uv": "TEX_COORD"
            };

            for (const kind in nativeAttributeTypes) {
                const id = decoder.GetAttributeId(geometry, decoderModule[nativeAttributeTypes[kind]]);
                if (id !== -1) {
                    const attribute = decoder.GetAttribute(geometry, id);
                    processAttribute(kind, attribute);
                }
            }
        }
    }
    finally {
        if (geometry) {
            decoderModule.destroy(geometry);
        }

        decoderModule.destroy(decoder);
        decoderModule.destroy(buffer);
    }
}

/**
 * The worker function that gets converted to a blob url to pass into a worker.
 */
function worker(): void {
    let decoderPromise: PromiseLike<any> | undefined;

    onmessage = (event) => {
        const data = event.data;
        switch (data.id) {
            case "init": {
                const decoder = data.decoder;
                if (decoder.url) {
                    importScripts(decoder.url);
                    decoderPromise = DracoDecoderModule({ wasmBinary: decoder.wasmBinary });
                }
                postMessage("done");
                break;
            }
            case "decodeMesh": {
                if (!decoderPromise) {
                    throw new Error("Draco decoder module is not available");
                }
                decoderPromise.then((decoder) => {
                    decodeMesh(decoder, data.dataView, data.attributes, (indices) => {
                        postMessage({ id: "indices", value: indices }, [indices.buffer]);
                    }, (kind, data) => {
                        postMessage({ id: kind, value: data }, [data.buffer]);
                    });
                    postMessage("done");
                });
                break;
            }
        }
    };
}

function getAbsoluteUrl<T>(url: T): T | string {
    if (typeof document !== "object" || typeof url !== "string") {
        return url;
    }

    return Tools.GetAbsoluteUrl(url);
}

/**
 * Configuration for Draco compression
 */
export interface IDracoCompressionConfiguration {
    /**
     * Configuration for the decoder.
     */
    decoder: {
        /**
         * The url to the WebAssembly module.
         */
        wasmUrl?: string;

        /**
         * The url to the WebAssembly binary.
         */
        wasmBinaryUrl?: string;

        /**
         * The url to the fallback JavaScript module.
         */
        fallbackUrl?: string;
    };
}

/**
 * Draco compression (https://google.github.io/draco/)
 *
 * This class wraps the Draco module.
 *
 * **Encoder**
 *
 * The encoder is not currently implemented.
 *
 * **Decoder**
 *
 * By default, the configuration points to a copy of the Draco decoder files for glTF from the babylon.js preview cdn https://preview.babylonjs.com/draco_wasm_wrapper_gltf.js.
 *
 * To update the configuration, use the following code:
 * ```javascript
 *     DracoCompression.Configuration = {
 *         decoder: {
 *             wasmUrl: "<url to the WebAssembly library>",
 *             wasmBinaryUrl: "<url to the WebAssembly binary>",
 *             fallbackUrl: "<url to the fallback JavaScript library>",
 *         }
 *     };
 * ```
 *
 * Draco has two versions, one for WebAssembly and one for JavaScript. The decoder configuration can be set to only support Webssembly or only support the JavaScript version.
 * Decoding will automatically fallback to the JavaScript version if WebAssembly version is not configured or if WebAssembly is not supported by the browser.
 * Use `DracoCompression.DecoderAvailable` to determine if the decoder configuration is available for the current context.
 *
 * To decode Draco compressed data, get the default DracoCompression object and call decodeMeshAsync:
 * ```javascript
 *     var vertexData = await DracoCompression.Default.decodeMeshAsync(data);
 * ```
 *
 * @see https://www.babylonjs-playground.com/#N3EK4B#0
 */
export class DracoCompression implements IDisposable {
    private _workerPoolPromise?: Promise<WorkerPool>;
    private _decoderModulePromise?: Promise<any>;

    /**
     * The configuration. Defaults to the following urls:
     * - wasmUrl: "https://preview.babylonjs.com/draco_wasm_wrapper_gltf.js"
     * - wasmBinaryUrl: "https://preview.babylonjs.com/draco_decoder_gltf.wasm"
     * - fallbackUrl: "https://preview.babylonjs.com/draco_decoder_gltf.js"
     */
    public static Configuration: IDracoCompressionConfiguration = {
        decoder: {
            wasmUrl: "https://preview.babylonjs.com/draco_wasm_wrapper_gltf.js",
            wasmBinaryUrl: "https://preview.babylonjs.com/draco_decoder_gltf.wasm",
            fallbackUrl: "https://preview.babylonjs.com/draco_decoder_gltf.js"
        }
    };

    /**
     * Returns true if the decoder configuration is available.
     */
    public static get DecoderAvailable(): boolean {
        const decoder = DracoCompression.Configuration.decoder;
        return !!((decoder.wasmUrl && decoder.wasmBinaryUrl && typeof WebAssembly === "object") || decoder.fallbackUrl);
    }

    /**
     * Default number of workers to create when creating the draco compression object.
     */
    public static DefaultNumWorkers = DracoCompression.GetDefaultNumWorkers();

    private static GetDefaultNumWorkers(): number {
        if (typeof navigator !== "object" || !navigator.hardwareConcurrency) {
            return 1;
        }

        // Use 50% of the available logical processors but capped at 4.
        return Math.min(Math.floor(navigator.hardwareConcurrency * 0.5), 4);
    }

    private static _Default: Nullable<DracoCompression> = null;

    /**
     * Default instance for the draco compression object.
     */
    public static get Default(): DracoCompression {
        if (!DracoCompression._Default) {
            DracoCompression._Default = new DracoCompression();
        }

        return DracoCompression._Default;
    }

    /**
     * Constructor
     * @param numWorkers The number of workers for async operations. Specify `0` to disable web workers and run synchronously in the current context.
     */
    constructor(numWorkers = DracoCompression.DefaultNumWorkers) {
        const decoder = DracoCompression.Configuration.decoder;

        const decoderInfo: { url: string | undefined, wasmBinaryPromise: Promise<ArrayBuffer | string | undefined> } =
            (decoder.wasmUrl && decoder.wasmBinaryUrl && typeof WebAssembly === "object") ? {
                url: decoder.wasmUrl,
                wasmBinaryPromise: Tools.LoadFileAsync(getAbsoluteUrl(decoder.wasmBinaryUrl))
            } : {
                url: decoder.fallbackUrl,
                wasmBinaryPromise: Promise.resolve(undefined)
            };

        if (numWorkers && typeof Worker === "function") {
            this._workerPoolPromise = decoderInfo.wasmBinaryPromise.then((decoderWasmBinary) => {
                const workerContent = `${decodeMesh}(${worker})()`;
                const workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: "application/javascript" }));
                const workerPromises = new Array<Promise<Worker>>(numWorkers);
                for (let i = 0; i < workerPromises.length; i++) {
                    workerPromises[i] = new Promise((resolve, reject) => {
                        const worker = new Worker(workerBlobUrl);
                        const onError = (error: ErrorEvent) => {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            reject(error);
                        };

                        const onMessage = (message: MessageEvent) => {
                            if (message.data === "done") {
                                worker.removeEventListener("error", onError);
                                worker.removeEventListener("message", onMessage);
                                resolve(worker);
                            }
                        };

                        worker.addEventListener("error", onError);
                        worker.addEventListener("message", onMessage);

                        worker.postMessage({
                            id: "init",
                            decoder: {
                                url: getAbsoluteUrl(decoderInfo.url),
                                wasmBinary: decoderWasmBinary,
                            }
                        });
                    });
                }

                return Promise.all(workerPromises).then((workers) => {
                    return new WorkerPool(workers);
                });
            });
        }
        else {
            this._decoderModulePromise = decoderInfo.wasmBinaryPromise.then((decoderWasmBinary) => {
                if (!decoderInfo.url) {
                    throw new Error("Draco decoder module is not available");
                }

                return Tools.LoadScriptAsync(decoderInfo.url).then(() => {
                    return createDecoderAsync(decoderWasmBinary as ArrayBuffer);
                });
            });
        }
    }

    /**
     * Stop all async operations and release resources.
     */
    public dispose(): void {
        if (this._workerPoolPromise) {
            this._workerPoolPromise.then((workerPool) => {
                workerPool.dispose();
            });
        }

        delete this._workerPoolPromise;
        delete this._decoderModulePromise;
    }

    /**
     * Returns a promise that resolves when ready. Call this manually to ensure draco compression is ready before use.
     * @returns a promise that resolves when ready
     */
    public whenReadyAsync(): Promise<void> {
        if (this._workerPoolPromise) {
            return this._workerPoolPromise.then(() => { });
        }

        if (this._decoderModulePromise) {
            return this._decoderModulePromise.then(() => { });
        }

        return Promise.resolve();
    }

    /**
      * Decode Draco compressed mesh data to vertex data.
      * @param data The ArrayBuffer or ArrayBufferView for the Draco compression data
      * @param attributes A map of attributes from vertex buffer kinds to Draco unique ids
      * @returns A promise that resolves with the decoded vertex data
      */
    public decodeMeshAsync(data: ArrayBuffer | ArrayBufferView, attributes?: { [kind: string]: number }): Promise<VertexData> {
        const dataView = data instanceof ArrayBuffer ? new Uint8Array(data) : data;

        if (this._workerPoolPromise) {
            return this._workerPoolPromise.then((workerPool) => {
                return new Promise<VertexData>((resolve, reject) => {
                    workerPool.push((worker, onComplete) => {
                        const vertexData = new VertexData();

                        const onError = (error: ErrorEvent) => {
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            reject(error);
                            onComplete();
                        };

                        const onMessage = (message: MessageEvent) => {
                            if (message.data === "done") {
                                worker.removeEventListener("error", onError);
                                worker.removeEventListener("message", onMessage);
                                resolve(vertexData);
                                onComplete();
                            }
                            else if (message.data.id === "indices") {
                                vertexData.indices = message.data.value;
                            }
                            else {
                                vertexData.set(message.data.value, message.data.id);
                            }
                        };

                        worker.addEventListener("error", onError);
                        worker.addEventListener("message", onMessage);

                        const dataViewCopy = new Uint8Array(dataView.byteLength);
                        dataViewCopy.set(new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength));

                        worker.postMessage({ id: "decodeMesh", dataView: dataViewCopy, attributes: attributes }, [dataViewCopy.buffer]);
                    });
                });
            });
        }

        if (this._decoderModulePromise) {
            return this._decoderModulePromise.then((decoder) => {
                const vertexData = new VertexData();
                decodeMesh(decoder.module, dataView, attributes, (indices) => {
                    vertexData.indices = indices;
                }, (kind, data) => {
                    vertexData.set(data, kind);
                });
                return vertexData;
            });
        }

        throw new Error("Draco decoder module is not available");
    }
}
