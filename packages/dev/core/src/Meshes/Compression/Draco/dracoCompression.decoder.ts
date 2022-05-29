import { VertexData } from "../../../meshes/mesh.vertexData";
import { IDracoDecoder, DracoCompressionBase, IDracoCompressionEngineConfiguration } from "./dracoCompression";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let DracoDecoderModule: any;
declare function importScripts(...urls: string[]): void;
declare function postMessage(message: any, transfer?: any[]): void;

/////////////////////////////////
//    BEGIN WORKER CONTEXT     //
/////////////////////////////////

/**
 * The decoder function that gets converted to a blob url to pass into a worker.
 * @param decoderModule
 * @param dataView
 * @param attributes
 * @param onIndicesData
 * @param onAttributeData
 */
function decodeMesh(
    decoderModule: any,
    dataView: ArrayBufferView,
    attributes: { [kind: string]: number } | undefined,
    onIndicesData: (data: Uint32Array) => void,
    onAttributeData: (kind: string, data: Float32Array) => void,
    dividers?: { [kind: string]: number }
): void {
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

        if (type === decoderModule.TRIANGULAR_MESH) {
            const numFaces = geometry.num_faces();
            const numIndices = numFaces * 3;
            const byteLength = numIndices * 4;

            const ptr = decoderModule._malloc(byteLength);
            try {
                decoder.GetTrianglesUInt32Array(geometry, byteLength, ptr);
                const indices = new Uint32Array(numIndices);
                indices.set(new Uint32Array(decoderModule.HEAPF32.buffer, ptr, numIndices));
                onIndicesData(indices);
            } finally {
                decoderModule._free(ptr);
            }
        }

        const processAttribute = (kind: string, attribute: any, divider = 1) => {
            const numComponents = attribute.num_components();
            const numPoints = geometry.num_points();
            const numValues = numPoints * numComponents;
            const byteLength = numValues * Float32Array.BYTES_PER_ELEMENT;

            const ptr = decoderModule._malloc(byteLength);
            try {
                decoder.GetAttributeDataArrayForAllPoints(geometry, attribute, decoderModule.DT_FLOAT32, byteLength, ptr);
                const values = new Float32Array(decoderModule.HEAPF32.buffer, ptr, numValues);
                if (kind === "color" && numComponents === 3) {
                    const babylonData = new Float32Array(numPoints * 4);
                    for (let i = 0, j = 0; i < babylonData.length; i += 4, j += numComponents) {
                        babylonData[i + 0] = values[j + 0];
                        babylonData[i + 1] = values[j + 1];
                        babylonData[i + 2] = values[j + 2];
                        babylonData[i + 3] = 1;
                    }
                    onAttributeData(kind, babylonData);
                } else {
                    const babylonData = new Float32Array(numValues);
                    babylonData.set(new Float32Array(decoderModule.HEAPF32.buffer, ptr, numValues));
                    if (divider !== 1) {
                        for (let i = 0; i < babylonData.length; i++) {
                            babylonData[i] = babylonData[i] / divider;
                        }
                    }
                    onAttributeData(kind, babylonData);
                }
            } finally {
                decoderModule._free(ptr);
            }
        };

        if (attributes) {
            for (const kind in attributes) {
                const id = attributes[kind];
                const attribute = decoder.GetAttributeByUniqueId(geometry, id);
                const divider = (dividers && dividers[kind]) || 1;
                processAttribute(kind, attribute, divider);
            }
        } else {
            const nativeAttributeTypes: { [kind: string]: string } = {
                position: "POSITION",
                normal: "NORMAL",
                color: "COLOR",
                uv: "TEX_COORD",
            };

            for (const kind in nativeAttributeTypes) {
                const id = decoder.GetAttributeId(geometry, decoderModule[nativeAttributeTypes[kind]]);
                if (id !== -1) {
                    const attribute = decoder.GetAttribute(geometry, id);
                    processAttribute(kind, attribute);
                }
            }
        }
    } finally {
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
    let codecPromise: PromiseLike<any> | undefined;

    onmessage = (event) => {
        const data = event.data;
        switch (data.id) {
            case "init": {
                const codec = data.codec;
                if (codec.url) {
                    importScripts(codec.url);
                    codecPromise = DracoDecoderModule({ wasmBinary: codec.wasmBinary });
                }
                postMessage("done");
                break;
            }
            case "decodeMesh": {
                if (!codecPromise) {
                    throw new Error("Draco decoder module is not available");
                }
                codecPromise.then((decoder) => {
                    decodeMesh(
                        decoder,
                        data.dataView,
                        data.attributes,
                        (indices) => {
                            postMessage({ id: "indices", value: indices }, [indices.buffer]);
                        },
                        (kind, data) => {
                            postMessage({ id: kind, value: data }, [data.buffer]);
                        }
                    );
                    postMessage("done");
                });
                break;
            }
        }
    };
}

/////////////////////////////////
//    END WORKER CONTEXT       //
/////////////////////////////////

export class DracoDecoder extends DracoCompressionBase implements IDracoDecoder {
    public static Configuration: IDracoCompressionEngineConfiguration = {
        wasmUrl: DracoCompressionBase.WasmBaseUrl + "draco_wasm_wrapper_gltf.js",
        wasmBinaryUrl: DracoCompressionBase.WasmBaseUrl + "draco_decoder_gltf.wasm",
        fallbackUrl: DracoCompressionBase.WasmBaseUrl + "draco_decoder_gltf.js",
    };

    constructor(numWorkers = DracoCompressionBase.DefaultNumWorkers) {
        super(DracoDecoder.Configuration, numWorkers);
    }

    decodeMeshAsync(data: ArrayBuffer | ArrayBufferView, attributes?: { [kind: string]: number }, dividers?: { [kind: string]: number }): Promise<VertexData> {
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
                            } else if (message.data.id === "indices") {
                                vertexData.indices = message.data.value;
                            } else {
                                // check normalization
                                const divider = dividers && dividers[message.data.id] ? dividers[message.data.id] : 1;
                                if (divider !== 1) {
                                    // normalize
                                    for (let i = 0; i < message.data.value.length; i++) {
                                        message.data.value[i] = message.data.value[i] / divider;
                                    }
                                }
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

        if (this._modulePromise) {
            return this._modulePromise.then((decoder) => {
                const vertexData = new VertexData();
                decodeMesh(
                    decoder.module,
                    dataView,
                    attributes,
                    (indices) => {
                        vertexData.indices = indices;
                    },
                    (kind, data) => {
                        vertexData.set(data, kind);
                    },
                    dividers
                );
                return vertexData;
            });
        }

        throw new Error("Draco decoder module is not available");
    }

    createModuleAsync(wasmBinary?: ArrayBuffer): Promise<any> {
        return new Promise((resolve) => {
            DracoDecoderModule({ wasmBinary: wasmBinary }).then((module: any) => {
                resolve({ module: module });
            });
        });
    }

    getWorkerContent(): string {
        return `${decodeMesh}(${worker})()`;
    }
}

/**
 * @deprecated use DracoDecoder
 */
export class DracoCompression extends DracoDecoder {
    constructor(numWorkers = DracoCompressionBase.DefaultNumWorkers) {
        super(numWorkers);
    }
}
