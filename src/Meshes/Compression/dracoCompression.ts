import { Tools } from "../../Misc/tools";
import { WorkerPool } from '../../Misc/workerPool';
import { Nullable } from "../../types";
import { IDisposable } from "../../scene";
import { VertexData } from "../../Meshes/mesh.vertexData";

declare var DracoDecoderModule: any;
declare var WebAssembly: any;

declare function importScripts(...urls: string[]): void;

/**
 * Configuration for Draco compression
 */
export interface IDracoCompressionConfiguration {
    /**
     * Configuration for the decoder.
     */
    decoder?: {
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
 * Use `DracoCompression.DecoderAvailable` to determine if the decoder is available for the current session.
 *
 * To decode Draco compressed data, create a DracoCompression object and call decodeMeshAsync:
 * ```javascript
 *     var dracoCompression = new DracoCompression();
 *     var vertexData = await dracoCompression.decodeMeshAsync(data, {
 *         [VertexBuffer.PositionKind]: 0
 *     });
 * ```
 *
 * @see https://www.babylonjs-playground.com/#N3EK4B#0
 */
export class DracoCompression implements IDisposable {
    private _workerPoolPromise: Promise<WorkerPool>;

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
     * Returns true if the decoder is available.
     */
    public static get DecoderAvailable(): boolean {
        if (typeof DracoDecoderModule !== "undefined") {
            return true;
        }

        const decoder = DracoCompression.Configuration.decoder;
        if (decoder) {
            if (decoder.wasmUrl && decoder.wasmBinaryUrl && typeof WebAssembly === "object") {
                return true;
            }

            if (decoder.fallbackUrl) {
                return true;
            }
        }

        return false;
    }

    /**
     * Default number of workers to create when creating the draco compression object.
     */
    public static DefaultNumWorkers = DracoCompression.GetDefaultNumWorkers();

    private static GetDefaultNumWorkers(): number {
        if (typeof navigator === "undefined" || !navigator.hardwareConcurrency) {
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
     * @param numWorkers The number of workers for async operations
     */
    constructor(numWorkers = DracoCompression.DefaultNumWorkers) {
        if (!URL || !URL.createObjectURL) {
            throw new Error("Object URLs are not available");
        }

        if (!Worker) {
            throw new Error("Workers are not available");
        }

        this._workerPoolPromise = this._loadDecoderWasmBinaryAsync().then((decoderWasmBinary) => {
            const workerBlobUrl = URL.createObjectURL(new Blob([`(${DracoCompression._Worker.toString()})()`], { type: "application/javascript" }));
            const workerPromises = new Array<Promise<Worker>>(numWorkers);
            for (let i = 0; i < workerPromises.length; i++) {
                workerPromises[i] = new Promise((resolve, reject) => {
                    const decoder = DracoCompression.Configuration.decoder;
                    if (decoder) {
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
                            id: "initDecoder",
                            decoderWasmUrl: decoder.wasmUrl ? Tools.GetAbsoluteUrl(decoder.wasmUrl) : null,
                            decoderWasmBinary: decoderWasmBinary,
                            fallbackUrl: decoder.fallbackUrl ? Tools.GetAbsoluteUrl(decoder.fallbackUrl) : null
                        });
                    }
                });
            }

            return Promise.all(workerPromises).then((workers) => {
                return new WorkerPool(workers);
            });
        });
    }

    /**
     * Stop all async operations and release resources.
     */
    public dispose(): void {
        this._workerPoolPromise.then((workerPool) => {
            workerPool.dispose();
        });

        delete this._workerPoolPromise;
    }

    /**
     * Returns a promise that resolves when ready. Call this manually to ensure draco compression is ready before use.
     * @returns a promise that resolves when ready
     */
    public whenReadyAsync(): Promise<void> {
        return this._workerPoolPromise.then(() => { });
    }

   /**
     * Decode Draco compressed mesh data to vertex data.
     * @param data The ArrayBuffer or ArrayBufferView for the Draco compression data
     * @param attributes A map of attributes from vertex buffer kinds to Draco unique ids
     * @returns A promise that resolves with the decoded vertex data
     */
    public decodeMeshAsync(data: ArrayBuffer | ArrayBufferView, attributes?: { [kind: string]: number }): Promise<VertexData> {
        const dataView = data instanceof ArrayBuffer ? new Uint8Array(data) : data;

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

    /**
     * The worker function that gets converted to a blob url to pass into a worker.
     */
    private static _Worker(): void {
        const nativeAttributeTypes: { [kind: string]: string } = {
            "position": "POSITION",
            "normal": "NORMAL",
            "color": "COLOR",
            "uv": "TEX_COORD"
        };

        // self is actually a DedicatedWorkerGlobalScope
        const _self = self as any as {
            onmessage: (event: MessageEvent) => void;
            postMessage: (message: any, transfer?: any[]) => void;
            close: () => void;
        };

        let decoderModulePromise: Promise<any>;

        function initDecoder(decoderWasmUrl: string | undefined, decoderWasmBinary: ArrayBuffer | undefined, fallbackUrl: string | undefined): void {
            if (decoderWasmUrl && decoderWasmBinary && typeof WebAssembly === "object") {
                importScripts(decoderWasmUrl);
                decoderModulePromise = DracoDecoderModule({
                    wasmBinary: decoderWasmBinary
                });
            }
            else if (fallbackUrl) {
                importScripts(fallbackUrl);
                decoderModulePromise = DracoDecoderModule();
            }
            else {
                throw Error("Failed to initialize Draco decoder");
            }

            _self.postMessage("done");
        }

        function decodeMesh(dataView: ArrayBufferView, attributes: { [kind: string]: number }): void {
            decoderModulePromise.then((decoderModule) => {
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
                            _self.postMessage({ id: "indices", value: indices }, [indices.buffer]);
                        }
                        finally {
                            decoderModule.destroy(faceIndices);
                        }
                    }

                    const processAttribute = (kind: string, attribute: any) => {
                        const dracoData = new decoderModule.DracoFloat32Array();
                        try {
                            decoder.GetAttributeFloatForAllPoints(geometry, attribute, dracoData);
                            const babylonData = new Float32Array(numPoints * attribute.num_components());
                            for (let i = 0; i < babylonData.length; i++) {
                                babylonData[i] = dracoData.GetValue(i);
                            }
                            _self.postMessage({ id: kind, value: babylonData }, [babylonData.buffer]);
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

                _self.postMessage("done");
            });
        }

        _self.onmessage = (event) => {
            const data = event.data;
            switch (data.id) {
                case "initDecoder": {
                    initDecoder(data.decoderWasmUrl, data.decoderWasmBinary, data.fallbackUrl);
                    break;
                }
                case "decodeMesh": {
                    decodeMesh(data.dataView, data.attributes);
                    break;
                }
            }
        };
    }

    private _loadDecoderWasmBinaryAsync(): Promise<Nullable<ArrayBuffer>> {
        const decoder = DracoCompression.Configuration.decoder;
        if (decoder && decoder.wasmUrl && decoder.wasmBinaryUrl && typeof WebAssembly === "object") {
            const wasmBinaryUrl = Tools.GetAbsoluteUrl(decoder.wasmBinaryUrl);
            return new Promise((resolve, reject) => {
                Tools.LoadFile(wasmBinaryUrl, (data) => {
                    resolve(data as ArrayBuffer);
                }, undefined, undefined, true, (request, exception) => {
                    reject(exception);
                });
            });
        }
        else {
            return Promise.resolve(null);
        }
    }
}
