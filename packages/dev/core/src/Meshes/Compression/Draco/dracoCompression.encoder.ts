import { IGetSetVerticesData } from "../../mesh.vertexData";
import { VertexBuffer } from "../../../Buffers/buffer";
import { Nullable, FloatArray } from "../../../types";
import {
    DracoAttributeName,
    DracoAttribute,
    DracoGeometryType,
    DracoEncoderMethod,
    IDracoEncoder,
    DracoCompressionBase,
    IDracoCompressionEngineConfiguration,
    IDracoEncodedPrimitive,
    IDracoEncoderOptions,
} from "./dracoCommons";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let DracoEncoderModule: any;
declare function importScripts(...urls: string[]): void;
declare function postMessage(message: any, transfer?: any[]): void;

/////////////////////////////////
//    BEGIN WORKER CONTEXT     //
/////////////////////////////////

/**
 * The encoder function that gets converted to a blob url to pass into a worker.
 * @param encoderModule
 * @param attributes
 * @param indices
 * @param geometryDestination the type of geometry. TRIANGULAR_MESH = 0, POINT_CLOUD = 1
 * @param options
 * @param destination
 */
function encodeMesh(
    encoderModule: any,
    attributes: Array<{ key: string; type: number; stride: number; data: Float32Array }>,
    indices: Nullable<Uint16Array | Uint32Array>,
    geometryDestination: 0 | 1,
    options: any,
    destination?: ArrayBuffer
): Nullable<{ data: Uint8Array; attributes: { [kind: string]: number } }> {
    const vertices = attributes.find((a) => a.key == "position")?.data;

    if (vertices?.length) {
        const nativeAttributeTypeNames = ["POSITION", "NORMAL", "COLOR", "TEX_COORD", "GENERIC", "TANGENT", "MATERIAL", "JOINT", "WEIGHT"];
        const encoder = new encoderModule.Encoder();
        const meshBuilder = geometryDestination == 0 ? new encoderModule.MeshBuilder() : encoderModule.PointCloudBuilder();
        const dracoObject = geometryDestination == 0 ? new encoderModule.Mesh() : new encoderModule.PointCloud();
        const attributeIDs: { [kind: string]: number } = {};

        try {
            const verticesCount = vertices.length / 3;

            for (const attribute of attributes) {
                const data = attribute.data;
                const numItems = data.length;
                if (numItems) {
                    // AddFloatAttributeToMesh is deprecated and call AddFloatAttribute
                    // see https://github.com/google/draco/blob/master/src/draco/javascript/emscripten/encoder_webidl_wrapper.cc
                    // According to https://github.com/google/draco/blob/ee2c2578a170324bffef38cb8a3c2e60d89d5e87/src/draco/javascript/emscripten/encoder_webidl_wrapper.h#L86
                    // the third parameter IS THE VERTICE COUNT, and must be similar for all the subsequent AddXXXAttribute call.
                    attributeIDs[attribute.key] = meshBuilder.AddFloatAttribute(dracoObject, attribute.type, verticesCount, attribute.stride, attribute.data);
                    const typeName = nativeAttributeTypeNames[attribute.type];
                    if (options.quantizationBits && options.quantizationBits[typeName]) {
                        encoder.SetAttributeQuantization(attribute, options.quantizationBits[typeName]);
                    }
                }
            }

            // add the triangles
            if (geometryDestination == 0 && indices) {
                const numFaces = indices.length / 3; // 3 indices per face.
                meshBuilder.AddFacesToMesh(dracoObject, numFaces, indices);
            }

            // set the options
            if (options.method === 0 /*EncoderMethod.SEQUENTIAL*/) {
                encoder.SetEncodingMethod(encoderModule.MESH_SEQUENTIAL_ENCODING);
            } else if (options.method === 1 /*EncoderMethod.EDGEBREAKER*/) {
                encoder.SetEncodingMethod(encoderModule.MESH_EDGEBREAKER_ENCODING);
            } else {
                throw "unsuported Draco encoder method. Should be 0 for SEQUENTIAL or 1 for EDGEBREAKER";
            }

            encoder.SetSpeedOptions(options.encodeSpeed, options.decodeSpeed);

            // finally encode
            const encodedNativeBuffer = new encoderModule.DracoInt8Array();
            try {
                const encodedLength =
                    geometryDestination == 0
                        ? encoder.EncodeMeshToDracoBuffer(dracoObject, encodedNativeBuffer)
                        : encoder.EncodePointCloudToDracoBuffer(dracoObject, true, encodedNativeBuffer);

                // destination is giving us the ability to reuse the input buffer which is not longer used.
                // remember that he ArrayBuffer object is fixed-length so also ensure the provided buffer is large enought..
                const availableBytes = destination ? destination.byteLength : 0;
                const buffer = availableBytes < encodedLength ? new ArrayBuffer(encodedLength) : destination!;
                const encodedData = new Uint8Array(buffer, 0, encodedLength);

                // just copy the values from native wasm memory to worker heap.
                for (let i = 0; i < encodedLength; i++) {
                    encodedData[i] = encodedNativeBuffer.GetValue(i);
                }
                return { data: encodedData, attributes: attributeIDs };
            } finally {
                encoderModule.destroy(encodedNativeBuffer);
            }
        } finally {
            encoderModule.destroy(meshBuilder);
            encoderModule.destroy(dracoObject);
            encoderModule.destroy(encoder);
        }
    }
    return null;
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
                    codecPromise = DracoEncoderModule({ wasmBinary: codec.wasmBinary });
                }
                postMessage("done");
                break;
            }
            case "encodeMesh": {
                if (!codecPromise) {
                    throw new Error("Draco encoder module is not available");
                }
                codecPromise.then((encoder) => {
                    const verticesData = data.verticesData;
                    const result = encodeMesh(encoder, verticesData.attributes, verticesData.indices, verticesData.geometry, data.options, verticesData.buffer);
                    postMessage({ id: "encodeMeshResult", encodedData: result }, result ? [result.data.buffer] : undefined);
                });
                break;
            }
        }
    };
}
/////////////////////////////////
//    END WORKER CONTEXT       //
/////////////////////////////////

const DefaultQuantizationBits = {
    [DracoAttributeName.POSITION]: 14,
    [DracoAttributeName.NORMAL]: 10,
    [DracoAttributeName.COLOR]: 8,
    [DracoAttributeName.TEX_COORD]: 12,
    [DracoAttributeName.GENERIC]: 12,
};

const DefaultEncoderOptions: IDracoEncoderOptions = {
    decodeSpeed: 5,
    encodeSpeed: 5,
    method: DracoEncoderMethod.EDGEBREAKER,
    quantizationBits: DefaultQuantizationBits,
};

export class DracoEncoder extends DracoCompressionBase implements IDracoEncoder {
    public static Configuration: IDracoCompressionEngineConfiguration = {
        wasmUrl: DracoCompressionBase.WasmBaseUrl + "draco_encoder_wrapper.js",
        wasmBinaryUrl: DracoCompressionBase.WasmBaseUrl + "draco_encoder.wasm",
        fallbackUrl: DracoCompressionBase.WasmBaseUrl + "draco_encoder.js",
    };
    /**
     * Returns true if the encoder is available.
     */
    public static get EncoderAvailable(): boolean {
        return DracoCompressionBase._isCodecAvailable(DracoEncoder.Configuration);
    }
    constructor(numWorkers = DracoCompressionBase.DefaultNumWorkers) {
        super(DracoEncoder.Configuration, numWorkers);
    }

    encodeMeshAsync(input: IGetSetVerticesData, options?: IDracoEncoderOptions): Promise<Nullable<IDracoEncodedPrimitive>> {
        const o = { ...DefaultEncoderOptions, ...options } as Required<IDracoEncoderOptions>;
        o.quantizationBits = { ...DefaultQuantizationBits, ...o.quantizationBits };

        const geometry = input.getIndices() ? DracoGeometryType.TRIANGULAR_MESH : DracoGeometryType.POINT_CLOUD;

        if (this._workerPoolPromise) {
            return this._workerPoolPromise.then((workerPool) => {
                return new Promise<Nullable<IDracoEncodedPrimitive>>((resolve, reject) => {
                    workerPool.push((worker, onComplete) => {
                        const onError = (error: ErrorEvent) => {
                            // this is where we gona call reject
                            worker.removeEventListener("error", onError);
                            worker.removeEventListener("message", onMessage);
                            reject(error);
                            onComplete();
                        };

                        const onMessage = (message: MessageEvent) => {
                            if (message.data.id === "encodeMeshResult") {
                                // this is where we gona call resolve
                                worker.removeEventListener("error", onError);
                                worker.removeEventListener("message", onMessage);
                                resolve(message.data.encodedData);
                                onComplete();
                            }
                        };

                        worker.addEventListener("error", onError);
                        worker.addEventListener("message", onMessage);

                        // we build a dedicated copy of indices and verticesData backed by a Transferable buffer
                        const inputCopy = DracoEncodersParams.ToTransferable(input, o, geometry);
                        worker.postMessage({ id: "encodeMesh", verticesData: inputCopy, options: o }, [inputCopy.buffer]);
                    });
                });
            });
        }

        // If worker are not supported
        if (this._modulePromise) {
            return this._modulePromise.then((encoder) => {
                const inputCopy = DracoEncodersParams.ToLocal(input, o, geometry);
                return encodeMesh(encoder.module, inputCopy.attributes, inputCopy.indices, inputCopy.geometry, o);
            });
        }

        throw new Error("Draco encoder module is not available");
    }

    createModuleAsync(wasmBinary?: ArrayBuffer): Promise<any> {
        return new Promise((resolve) => {
            DracoEncoderModule({ wasmBinary: wasmBinary }).then((module: any) => {
                resolve({ module: module });
            });
        });
    }

    getWorkerContent(): string {
        return `${encodeMesh}(${worker})()`;
    }
}

/**
 * Used to prepare data from Babylon js primitive to Draco attributes.
 */
interface IDracoAttributes {
    key: string;
    type: DracoAttribute;
    stride: number;
    data: Float32Array;
}

/**
 * utility class used to transfert the necessary data to the encoder,
 * avoiding copy by using a unique Transferable buffer in case of worker
 */
class DracoEncodersParams {
    public static ToLocal(input: IGetSetVerticesData, options: IDracoEncoderOptions, geometry: DracoGeometryType = DracoGeometryType.TRIANGULAR_MESH) {
        const atts: Array<IDracoAttributes> = [];

        const target = new DracoEncodersParams();

        const fn = (kind: string, type: DracoAttribute, stride: number, data?: Nullable<FloatArray>) => {
            let d = data ?? input.getVerticesData(kind);
            if (d) {
                if (!(d instanceof Float32Array)) {
                    d = Float32Array.from(d!);
                }
                atts.push({ key: kind, type: type, stride: stride, data: d });
            }
        };

        fn(VertexBuffer.PositionKind, DracoAttribute.POSITION, 3);
        if (options.exportNormals) {
            fn(VertexBuffer.NormalKind, DracoAttribute.NORMAL, 3);
        }
        if (options.exportTangents) {
            fn(VertexBuffer.TangentKind, DracoAttribute.GENERIC, 3);
        }
        if (geometry == DracoGeometryType.TRIANGULAR_MESH) {
            if (options.exportUvs) {
                fn(VertexBuffer.UVKind, DracoAttribute.TEX_COORD, 2);
                fn(VertexBuffer.UV2Kind, DracoAttribute.TEX_COORD, 2);
                fn(VertexBuffer.UV3Kind, DracoAttribute.TEX_COORD, 2);
                fn(VertexBuffer.UV4Kind, DracoAttribute.TEX_COORD, 2);
                fn(VertexBuffer.UV5Kind, DracoAttribute.TEX_COORD, 2);
                fn(VertexBuffer.UV6Kind, DracoAttribute.TEX_COORD, 2);
            }
            let indices = geometry == DracoGeometryType.TRIANGULAR_MESH ? input.getIndices() : null;
            if (indices) {
                // force indices to be of correct type.
                if (!(indices instanceof Uint32Array) && !(indices instanceof Uint16Array)) {
                    const vertices = input.getVerticesData(VertexBuffer.PositionKind);
                    const l = vertices ? vertices.length : 0;
                    indices = (l > 65535 ? Uint32Array : Uint16Array).from(indices!);
                }
                target.indices = indices;
            }
        }
        if (options.exportColors) {
            fn(VertexBuffer.ColorKind, DracoAttribute.COLOR, 4);
        }

        target.attributes = atts;
        target.geometry = geometry;
        return target;
    }

    public static ToTransferable(input: IGetSetVerticesData, options: IDracoEncoderOptions, geometry: DracoGeometryType = DracoGeometryType.TRIANGULAR_MESH) {
        const target = DracoEncodersParams.ToLocal(input, options, geometry);
        // alloc the buffer
        let byteSize = 0;
        for (const att of target.attributes) {
            byteSize += att.data.byteLength;
        }
        byteSize += target.indices ? target.indices.byteLength : 0;

        target.buffer = new ArrayBuffer(byteSize);

        // create the views
        let offsetBytes = 0;

        for (const att of target.attributes) {
            const v = new Float32Array(target.buffer, offsetBytes, att.data.length);
            v.set(att.data);
            att.data = v;
            offsetBytes += v.byteLength;
        }

        if (target.indices) {
            const v = new (target.indices instanceof Uint32Array ? Uint32Array : Uint16Array)(target.buffer, offsetBytes, target.indices.length);
            v.set(target.indices);
            target.indices = v;
        }
        return target;
    }

    buffer: ArrayBuffer;
    indices: Uint32Array | Uint16Array;
    attributes: Array<IDracoAttributes>;
    geometry: DracoGeometryType = 0;
}
