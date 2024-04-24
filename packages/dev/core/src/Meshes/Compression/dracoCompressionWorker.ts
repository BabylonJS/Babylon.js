import type { Nullable } from "core/types";
import type { DecoderBuffer, Decoder, Mesh, PointCloud, Status } from "draco3dgltf";
import { DracoDecoderModule } from "draco3dgltf";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let DracoDecoderModule: DracoDecoderModule;

export interface AttributeData {
    kind: string;
    data: ArrayBufferView;
    size: number;
    byteOffset: number;
    byteStride: number;
    normalized: boolean;
}

interface InitDoneMessage {
    id: "initDone";
}

interface DecodeMeshDoneMessage {
    id: "decodeMeshDone";
    totalVertices: number;
}

interface IndicesMessage {
    id: "indices";
    data: Uint16Array | Uint32Array;
}

interface AttributeMessage extends AttributeData {
    id: "attribute";
}
export type Message = InitDoneMessage | DecodeMeshDoneMessage | IndicesMessage | AttributeMessage;
// WorkerGlobalScope
declare function importScripts(...urls: string[]): void;
declare function postMessage(message: Message, transfer?: any[]): void;

/**
 * @internal
 */
export function decodeMesh(
    decoderModule: any /*DecoderModule*/,
    data: Int8Array,
    attributes: { [kind: string]: number } | undefined,
    onIndicesData: (indices: Uint16Array | Uint32Array) => void,
    onAttributeData: (kind: string, data: ArrayBufferView, size: number, offset: number, stride: number, normalized: boolean) => void
): number {
    let decoder: Nullable<Decoder> = null;
    let buffer: Nullable<DecoderBuffer> = null;
    let geometry: Nullable<Mesh | PointCloud> = null;

    try {
        decoder = new decoderModule.Decoder() as Decoder;

        buffer = new decoderModule.DecoderBuffer() as DecoderBuffer;
        buffer.Init(data, data.byteLength);

        let status: Status;
        const type = decoder.GetEncodedGeometryType(buffer);
        switch (type) {
            case decoderModule.TRIANGULAR_MESH: {
                const mesh = new decoderModule.Mesh();
                status = decoder.DecodeBufferToMesh(buffer, mesh);
                if (!status.ok() || mesh.ptr === 0) {
                    throw new Error(status.error_msg());
                }

                const numFaces = mesh.num_faces();
                const numIndices = numFaces * 3;
                const byteLength = numIndices * 4;

                const ptr = decoderModule._malloc(byteLength);
                try {
                    decoder.GetTrianglesUInt32Array(mesh, byteLength, ptr);
                    const indices = new Uint32Array(numIndices);
                    indices.set(new Uint32Array(decoderModule.HEAPF32.buffer, ptr, numIndices));
                    onIndicesData(indices);
                } finally {
                    decoderModule._free(ptr);
                }

                geometry = mesh as Mesh;
                break;
            }
            case decoderModule.POINT_CLOUD: {
                const pointCloud = new decoderModule.PointCloud();
                status = decoder.DecodeBufferToPointCloud(buffer, pointCloud);
                if (!status.ok() || !pointCloud.ptr) {
                    throw new Error(status.error_msg());
                }

                geometry = pointCloud as PointCloud;
                break;
            }
            default: {
                throw new Error(`Invalid geometry type ${type}`);
            }
        }

        const numPoints = geometry.num_points();

        const processAttribute = (decoder: Decoder, geometry: Mesh | PointCloud, kind: string, attribute: any) => {
            const dataType = attribute.data_type();
            const numComponents = attribute.num_components();
            const normalized = attribute.normalized();
            const byteStride = attribute.byte_stride();
            const byteOffset = attribute.byte_offset();

            const dataTypeInfo = {
                [decoderModule.DT_FLOAT32]: { typedArrayConstructor: Float32Array, heap: decoderModule.HEAPF32 },
                [decoderModule.DT_INT8]: { typedArrayConstructor: Int8Array, heap: decoderModule.HEAP8 },
                [decoderModule.DT_INT16]: { typedArrayConstructor: Int16Array, heap: decoderModule.HEAP16 },
                [decoderModule.DT_INT32]: { typedArrayConstructor: Int32Array, heap: decoderModule.HEAP32 },
                [decoderModule.DT_UINT8]: { typedArrayConstructor: Uint8Array, heap: decoderModule.HEAPU8 },
                [decoderModule.DT_UINT16]: { typedArrayConstructor: Uint16Array, heap: decoderModule.HEAPU16 },
                [decoderModule.DT_UINT32]: { typedArrayConstructor: Uint32Array, heap: decoderModule.HEAPU32 },
            };

            const info = dataTypeInfo[dataType];
            if (!info) {
                throw new Error(`Invalid data type ${dataType}`);
            }

            const numValues = numPoints * numComponents;
            const byteLength = numValues * info.typedArrayConstructor.BYTES_PER_ELEMENT;

            const ptr = decoderModule._malloc(byteLength);
            try {
                decoder.GetAttributeDataArrayForAllPoints(geometry, attribute, dataType, byteLength, ptr);
                const data = new info.typedArrayConstructor(info.heap.buffer, ptr, numValues);
                onAttributeData(kind, data.slice(), numComponents, byteOffset, byteStride, normalized);
            } finally {
                decoderModule._free(ptr);
            }
        };

        if (attributes) {
            for (const kind in attributes) {
                const id = attributes[kind];
                const attribute = decoder.GetAttributeByUniqueId(geometry, id);
                processAttribute(decoder, geometry, kind, attribute);
            }
        } else {
            const dracoAttributeTypes: { [kind: string]: number } = {
                position: decoderModule.POSITION,
                normal: decoderModule.NORMAL,
                color: decoderModule.COLOR,
                uv: decoderModule.TEX_COORD,
            };

            for (const kind in dracoAttributeTypes) {
                const id = decoder.GetAttributeId(geometry, dracoAttributeTypes[kind]);
                if (id !== -1) {
                    const attribute = decoder.GetAttribute(geometry, id);
                    processAttribute(decoder, geometry, kind, attribute);
                }
            }
        }

        return numPoints;
    } finally {
        if (geometry) {
            decoderModule.destroy(geometry);
        }

        if (buffer) {
            decoderModule.destroy(buffer);
        }

        if (decoder) {
            decoderModule.destroy(decoder);
        }
    }
}

/**
 * The worker function that gets converted to a blob url to pass into a worker.
 * To be used if a developer wants to create their own worker instance and inject it instead of using the default worker.
 */
export function workerFunction(): void {
    let decoderPromise: PromiseLike<any> | undefined;

    onmessage = (event) => {
        const message = event.data;
        switch (message.id) {
            case "init": {
                const decoder = message.decoder;
                // if URL is provided then load the script. Otherwise expect the script to be loaded already
                if (decoder.url) {
                    importScripts(decoder.url);
                }
                const initDecoderObject = decoder.wasmBinary ? { wasmBinary: decoder.wasmBinary } : {};
                decoderPromise = DracoDecoderModule(initDecoderObject);
                postMessage({ id: "initDone" });
                break;
            }
            case "decodeMesh": {
                if (!decoderPromise) {
                    throw new Error("Draco decoder module is not available");
                }
                decoderPromise.then((decoder) => {
                    const numPoints = decodeMesh(
                        decoder,
                        message.dataView,
                        message.attributes,
                        (indices) => {
                            postMessage({ id: "indices", data: indices }, [indices.buffer]);
                        },
                        (kind, data, size, offset, stride, normalized) => {
                            postMessage({ id: "attribute", kind, data, size, byteOffset: offset, byteStride: stride, normalized }, [data.buffer]);
                        }
                    );
                    postMessage({ id: "decodeMeshDone", totalVertices: numPoints });
                });
                break;
            }
        }
    };
}

/**
 * Initializes a worker that was created for the draco agent pool
 * @param worker  The worker to initialize
 * @param decoderWasmBinary The wasm binary to load into the worker
 * @param moduleUrl The url to the draco decoder module (optional)
 * @returns A promise that resolves when the worker is initialized
 */
export function initializeWebWorker(worker: Worker, decoderWasmBinary?: ArrayBuffer, moduleUrl?: string): Promise<Worker> {
    return new Promise<Worker>((resolve, reject) => {
        const onError = (error: ErrorEvent) => {
            worker.removeEventListener("error", onError);
            worker.removeEventListener("message", onMessage);
            reject(error);
        };

        const onMessage = (event: MessageEvent<Message>) => {
            if (event.data.id === "initDone") {
                worker.removeEventListener("error", onError);
                worker.removeEventListener("message", onMessage);
                resolve(worker);
            }
        };

        worker.addEventListener("error", onError);
        worker.addEventListener("message", onMessage);

        if (!decoderWasmBinary) {
            worker.postMessage({
                id: "init",
                decoder: {
                    url: moduleUrl,
                },
            });
        } else {
            // clone the array buffer to make it transferable
            const clone = decoderWasmBinary.slice(0);
            worker.postMessage(
                {
                    id: "init",
                    decoder: {
                        url: moduleUrl,
                        wasmBinary: clone,
                    },
                },
                [clone]
            );
        }
        // note: no transfer list as the ArrayBuffer is shared across main thread and pool workers
    });
}
