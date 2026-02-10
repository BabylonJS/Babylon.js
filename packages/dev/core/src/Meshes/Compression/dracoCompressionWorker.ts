import type { Nullable, TypedArray, TypedArrayConstructor } from "core/types";
import type { EncoderMessage, IDracoAttributeData, IDracoEncodedMeshData, IDracoEncoderOptions } from "./dracoEncoder.types";
import type { DecoderMessage } from "./dracoDecoder.types";
import type { DecoderBuffer, Decoder, Mesh, PointCloud, Status, DecoderModule, EncoderModule, MeshBuilder, Encoder, DracoInt8Array } from "draco3dgltf";
import { DracoDecoderModule } from "draco3dgltf";
import type { VertexDataTypedArray } from "core/Buffers/bufferUtils";

declare let DracoDecoderModule: DracoDecoderModule;
declare let DracoEncoderModule: (props: { wasmBinary?: ArrayBuffer }) => Promise<EncoderModule>;

interface IInitDoneMessage {
    id: "initDone";
}

// WorkerGlobalScope
// eslint-disable-next-line @typescript-eslint/naming-convention
declare function importScripts(...urls: string[]): void;
// eslint-disable-next-line @typescript-eslint/naming-convention
declare function postMessage(message: IInitDoneMessage | DecoderMessage | EncoderMessage, transfer?: ArrayBufferLike[]): void;

/**
 * @internal
 */
export function EncodeMesh(
    module: unknown /** EncoderModule */,
    attributes: Array<IDracoAttributeData>,
    indices: Nullable<Uint16Array | Uint32Array>,
    options: IDracoEncoderOptions
): IDracoEncodedMeshData {
    const encoderModule = module as EncoderModule;
    let encoder: Nullable<Encoder> = null;
    let meshBuilder: Nullable<MeshBuilder> = null;
    let mesh: Nullable<Mesh> = null;
    let encodedNativeBuffer: Nullable<DracoInt8Array> = null;
    const attributeIDs: Record<string, number> = {}; // Babylon kind -> Draco unique id

    // Double-check that at least a position attribute is provided
    const positionAttribute = attributes.find((a) => a.dracoName === "POSITION");
    if (!positionAttribute) {
        throw new Error("Draco: Missing position attribute for encoding.");
    }

    // If no indices are provided, assume mesh is unindexed. Let's generate them, since Draco meshes require them.
    // TODO: This may be the POINT_CLOUD case, but need to investigate. Should work for now-- just less efficient.
    if (!indices) {
        // Assume position attribute is the largest attribute.
        const positionVerticesCount = positionAttribute.data.length / positionAttribute.size;
        indices = new (positionVerticesCount > 65535 ? Uint32Array : Uint16Array)(positionVerticesCount);
        for (let i = 0; i < positionVerticesCount; i++) {
            indices[i] = i;
        }
    }

    try {
        encoder = new encoderModule.Encoder();
        meshBuilder = new encoderModule.MeshBuilder();
        mesh = new encoderModule.Mesh();

        // Add the faces
        meshBuilder.AddFacesToMesh(mesh, indices.length / 3, indices);

        const addAttributeMap = new Map<
            Function,
            (builder: MeshBuilder, mesh: Mesh, attr: any, count: number, size: number, data: Exclude<VertexDataTypedArray, Uint8ClampedArray>) => number
        >([
            [Float32Array, (mb, m, a, c, s, d) => mb.AddFloatAttribute(m, a, c, s, d)],
            [Uint32Array, (mb, m, a, c, s, d) => mb.AddUInt32Attribute(m, a, c, s, d)],
            [Uint16Array, (mb, m, a, c, s, d) => mb.AddUInt16Attribute(m, a, c, s, d)],
            [Uint8Array, (mb, m, a, c, s, d) => mb.AddUInt8Attribute(m, a, c, s, d)],
            [Int32Array, (mb, m, a, c, s, d) => mb.AddInt32Attribute(m, a, c, s, d)],
            [Int16Array, (mb, m, a, c, s, d) => mb.AddInt16Attribute(m, a, c, s, d)],
            [Int8Array, (mb, m, a, c, s, d) => mb.AddInt8Attribute(m, a, c, s, d)],
        ]);

        // Add the attributes
        for (const attribute of attributes) {
            if (attribute.data instanceof Uint8ClampedArray) {
                attribute.data = new Uint8Array(attribute.data); // Draco does not support Uint8ClampedArray
            }
            const addAttribute = addAttributeMap.get(attribute.data.constructor)!;
            const verticesCount = attribute.data.length / attribute.size;
            attributeIDs[attribute.kind] = addAttribute(meshBuilder, mesh, encoderModule[attribute.dracoName], verticesCount, attribute.size, attribute.data);
            if (options.quantizationBits && options.quantizationBits[attribute.dracoName]) {
                encoder.SetAttributeQuantization(encoderModule[attribute.dracoName], options.quantizationBits[attribute.dracoName]);
            }
        }

        // Set the options
        if (options.method) {
            encoder.SetEncodingMethod(encoderModule[options.method]);
        }
        if (options.encodeSpeed !== undefined && options.decodeSpeed !== undefined) {
            encoder.SetSpeedOptions(options.encodeSpeed, options.decodeSpeed);
        }

        // Encode to native buffer
        encodedNativeBuffer = new encoderModule.DracoInt8Array();
        const encodedLength = encoder.EncodeMeshToDracoBuffer(mesh, encodedNativeBuffer);
        if (encodedLength <= 0) {
            throw new Error("Draco: Failed to encode.");
        }

        // Copy the native buffer data to worker heap
        const encodedData = new Int8Array(encodedLength);
        for (let i = 0; i < encodedLength; i++) {
            encodedData[i] = encodedNativeBuffer.GetValue(i);
        }

        return { data: encodedData, attributeIds: attributeIDs };
    } finally {
        if (mesh) {
            encoderModule.destroy(mesh);
        }
        if (meshBuilder) {
            encoderModule.destroy(meshBuilder);
        }
        if (encoder) {
            encoderModule.destroy(encoder);
        }
        if (encodedNativeBuffer) {
            encoderModule.destroy(encodedNativeBuffer);
        }
    }
}

/**
 * The worker function that gets converted to a blob url to pass into a worker.
 * To be used if a developer wants to create their own worker instance and inject it instead of using the default worker.
 */
export function EncoderWorkerFunction(): void {
    let encoderPromise: Promise<EncoderModule> | undefined;

    onmessage = (event) => {
        const message = event.data;
        switch (message.id) {
            case "init": {
                // if URL is provided then load the script. Otherwise expect the script to be loaded already
                if (message.url) {
                    importScripts(message.url);
                }
                const initEncoderObject = message.wasmBinary ? { wasmBinary: message.wasmBinary } : {};
                encoderPromise = DracoEncoderModule(initEncoderObject);
                postMessage({ id: "initDone" });
                break;
            }
            case "encodeMesh": {
                if (!encoderPromise) {
                    throw new Error("Draco: Encoder module is not available.");
                }
                encoderPromise
                    // eslint-disable-next-line github/no-then
                    .then((encoder) => {
                        const result = EncodeMesh(encoder, message.attributes, message.indices, message.options);
                        postMessage({ id: "encodeMeshSuccess", encodedMeshData: result }, result ? [result.data.buffer] : undefined);
                    })
                    // eslint-disable-next-line github/no-then
                    .catch((error) => {
                        postMessage({ id: "encodeMeshError", errorMessage: error.message });
                    });
                break;
            }
        }
    };
}

/**
 * @internal
 */
export function DecodeMesh(
    module: unknown /** DecoderModule */,
    data: Int8Array,
    attributeIDs: Record<string, number> | undefined,
    onIndicesData: (indices: Uint16Array | Uint32Array) => void,
    onAttributeData: (kind: string, data: ArrayBufferView, size: number, offset: number, stride: number, normalized: boolean) => void
): number {
    const decoderModule = module as DecoderModule;
    let decoder: Nullable<Decoder> = null;
    let buffer: Nullable<DecoderBuffer> = null;
    let geometry: Nullable<Mesh | PointCloud> = null;

    try {
        decoder = new decoderModule.Decoder();

        buffer = new decoderModule.DecoderBuffer();
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

                geometry = mesh;
                break;
            }
            case decoderModule.POINT_CLOUD: {
                const pointCloud = new decoderModule.PointCloud();
                status = decoder.DecodeBufferToPointCloud(buffer, pointCloud);
                if (!status.ok() || !pointCloud.ptr) {
                    throw new Error(status.error_msg());
                }

                geometry = pointCloud;
                break;
            }
            default: {
                throw new Error(`Draco: Cannot decode invalid geometry type ${type}`);
            }
        }

        const numPoints = geometry.num_points();

        const processAttribute = (decoder: Decoder, geometry: Mesh | PointCloud, kind: string, attribute: any /** Attribute */) => {
            const dataType = attribute.data_type();
            const numComponents = attribute.num_components();
            const normalized = attribute.normalized();
            const byteStride = attribute.byte_stride();
            const byteOffset = attribute.byte_offset();

            const dataTypeInfo: Record<number, { typedArrayConstructor: TypedArrayConstructor; heap: TypedArray }> = {
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
                throw new Error(`Draco: Cannot decode invalid data type ${dataType}`);
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

        if (attributeIDs) {
            for (const kind in attributeIDs) {
                const id = attributeIDs[kind];
                const attribute = decoder.GetAttributeByUniqueId(geometry, id);
                processAttribute(decoder, geometry, kind, attribute);
            }
        } else {
            const dracoAttributeTypes: Record<string, number> = {
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
export function DecoderWorkerFunction(): void {
    let decoderPromise: PromiseLike<DecoderModule> | undefined;

    onmessage = (event) => {
        const message = event.data;
        switch (message.id) {
            case "init": {
                // if URL is provided then load the script. Otherwise expect the script to be loaded already
                if (message.url) {
                    importScripts(message.url);
                }
                const initDecoderObject = message.wasmBinary ? { wasmBinary: message.wasmBinary } : {};
                decoderPromise = DracoDecoderModule(initDecoderObject);
                postMessage({ id: "initDone" });
                break;
            }
            case "decodeMesh": {
                if (!decoderPromise) {
                    throw new Error("Draco: Decoder module is not available");
                }
                // eslint-disable-next-line github/no-then
                decoderPromise.then((decoder) => {
                    const numPoints = DecodeMesh(
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

// For backwards compatibility
export { DecoderWorkerFunction as workerFunction };

/**
 * Initializes a worker that was created for the draco agent pool
 * @param worker  The worker to initialize
 * @param wasmBinary The wasm binary to load into the worker
 * @param moduleUrl The url to the draco decoder module (optional)
 * @returns A promise that resolves when the worker is initialized
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function initializeWebWorker(worker: Worker, wasmBinary?: ArrayBuffer, moduleUrl?: string): Promise<Worker> {
    return await new Promise<Worker>((resolve, reject) => {
        const onError = (error: ErrorEvent) => {
            worker.removeEventListener("error", onError);
            worker.removeEventListener("message", onMessage);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(error);
        };

        const onMessage = (event: MessageEvent<IInitDoneMessage>) => {
            if (event.data.id === "initDone") {
                worker.removeEventListener("error", onError);
                worker.removeEventListener("message", onMessage);
                resolve(worker);
            }
        };

        worker.addEventListener("error", onError);
        worker.addEventListener("message", onMessage);

        // Load with either JS-only or WASM version
        if (!wasmBinary) {
            worker.postMessage({
                id: "init",
                url: moduleUrl,
            });
        } else {
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
        }
        // note: no transfer list as the ArrayBuffer is shared across main thread and pool workers
    });
}
