import { Constants } from "../Engines/constants";
import { Logger } from "../Misc/logger";
import type { DataArray, FloatArray, IndicesArray, TypedArray, TypedArrayConstructor } from "../types";

/**
 * Union of TypedArrays that can be used for vertex data.
 */
export type VertexDataTypedArray = Exclude<TypedArray, Float64Array | BigInt64Array | BigUint64Array>;

function GetFloatValue(dataView: DataView, type: number, byteOffset: number, normalized: boolean): number {
    switch (type) {
        case Constants.BYTE: {
            let value = dataView.getInt8(byteOffset);
            if (normalized) {
                value = Math.max(value / 127, -1);
            }
            return value;
        }
        case Constants.UNSIGNED_BYTE: {
            let value = dataView.getUint8(byteOffset);
            if (normalized) {
                value = value / 255;
            }
            return value;
        }
        case Constants.SHORT: {
            let value = dataView.getInt16(byteOffset, true);
            if (normalized) {
                value = Math.max(value / 32767, -1);
            }
            return value;
        }
        case Constants.UNSIGNED_SHORT: {
            let value = dataView.getUint16(byteOffset, true);
            if (normalized) {
                value = value / 65535;
            }
            return value;
        }
        case Constants.INT: {
            return dataView.getInt32(byteOffset, true);
        }
        case Constants.UNSIGNED_INT: {
            return dataView.getUint32(byteOffset, true);
        }
        case Constants.FLOAT: {
            return dataView.getFloat32(byteOffset, true);
        }
        default: {
            throw new Error(`Invalid component type ${type}`);
        }
    }
}

function SetFloatValue(dataView: DataView, type: number, byteOffset: number, normalized: boolean, value: number): void {
    switch (type) {
        case Constants.BYTE: {
            if (normalized) {
                value = Math.round(value * 127.0);
            }
            dataView.setInt8(byteOffset, value);
            break;
        }
        case Constants.UNSIGNED_BYTE: {
            if (normalized) {
                value = Math.round(value * 255);
            }
            dataView.setUint8(byteOffset, value);
            break;
        }
        case Constants.SHORT: {
            if (normalized) {
                value = Math.round(value * 32767);
            }
            dataView.setInt16(byteOffset, value, true);
            break;
        }
        case Constants.UNSIGNED_SHORT: {
            if (normalized) {
                value = Math.round(value * 65535);
            }
            dataView.setUint16(byteOffset, value, true);
            break;
        }
        case Constants.INT: {
            dataView.setInt32(byteOffset, value, true);
            break;
        }
        case Constants.UNSIGNED_INT: {
            dataView.setUint32(byteOffset, value, true);
            break;
        }
        case Constants.FLOAT: {
            dataView.setFloat32(byteOffset, value, true);
            break;
        }
        default: {
            throw new Error(`Invalid component type ${type}`);
        }
    }
}

/**
 * Gets the byte length of the given type.
 * @param type the type
 * @returns the number of bytes
 */
export function GetTypeByteLength(type: number): number {
    switch (type) {
        case Constants.BYTE:
        case Constants.UNSIGNED_BYTE:
            return 1;
        case Constants.SHORT:
        case Constants.UNSIGNED_SHORT:
            return 2;
        case Constants.INT:
        case Constants.UNSIGNED_INT:
        case Constants.FLOAT:
            return 4;
        default:
            throw new Error(`Invalid type '${type}'`);
    }
}

/**
 * Gets the appropriate TypedArray constructor for the given component type.
 * @param componentType the component type
 * @returns the constructor object
 */
export function GetTypedArrayConstructor(componentType: number): TypedArrayConstructor<VertexDataTypedArray> {
    switch (componentType) {
        case Constants.BYTE:
            return Int8Array;
        case Constants.UNSIGNED_BYTE:
            return Uint8Array;
        case Constants.SHORT:
            return Int16Array;
        case Constants.UNSIGNED_SHORT:
            return Uint16Array;
        case Constants.INT:
            return Int32Array;
        case Constants.UNSIGNED_INT:
            return Uint32Array;
        case Constants.FLOAT:
            return Float32Array;
        default:
            throw new Error(`Invalid component type '${componentType}'`);
    }
}

/**
 * Enumerates each value of the data array and calls the given callback.
 * @param data the data to enumerate
 * @param byteOffset the byte offset of the data
 * @param byteStride the byte stride of the data
 * @param componentCount the number of components per element
 * @param componentType the type of the component
 * @param count the number of values to enumerate
 * @param normalized whether the data is normalized
 * @param callback the callback function called for each group of component values
 */
export function EnumerateFloatValues(
    data: DataArray,
    byteOffset: number,
    byteStride: number,
    componentCount: number,
    componentType: number,
    count: number,
    normalized: boolean,
    callback: (values: number[], index: number) => void
): void {
    const oldValues = new Array<number>(componentCount);
    const newValues = new Array<number>(componentCount);

    if (data instanceof Array) {
        let offset = byteOffset / 4;
        const stride = byteStride / 4;
        for (let index = 0; index < count; index += componentCount) {
            for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
                oldValues[componentIndex] = newValues[componentIndex] = data[offset + componentIndex];
            }

            callback(newValues, index);

            for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
                if (oldValues[componentIndex] !== newValues[componentIndex]) {
                    data[offset + componentIndex] = newValues[componentIndex];
                }
            }

            offset += stride;
        }
    } else {
        const dataView = !ArrayBuffer.isView(data) ? new DataView(data) : new DataView(data.buffer, data.byteOffset, data.byteLength);
        const componentByteLength = GetTypeByteLength(componentType);
        for (let index = 0; index < count; index += componentCount) {
            for (let componentIndex = 0, componentByteOffset = byteOffset; componentIndex < componentCount; componentIndex++, componentByteOffset += componentByteLength) {
                oldValues[componentIndex] = newValues[componentIndex] = GetFloatValue(dataView, componentType, componentByteOffset, normalized);
            }

            callback(newValues, index);

            for (let componentIndex = 0, componentByteOffset = byteOffset; componentIndex < componentCount; componentIndex++, componentByteOffset += componentByteLength) {
                if (oldValues[componentIndex] !== newValues[componentIndex]) {
                    SetFloatValue(dataView, componentType, componentByteOffset, normalized, newValues[componentIndex]);
                }
            }

            byteOffset += byteStride;
        }
    }
}

/**
 * Gets the given data array as a float array. Float data is constructed if the data array cannot be returned directly.
 * @param data the input data array
 * @param size the number of components
 * @param type the component type
 * @param byteOffset the byte offset of the data
 * @param byteStride the byte stride of the data
 * @param normalized whether the data is normalized
 * @param totalVertices number of vertices in the buffer to take into account
 * @param forceCopy defines a boolean indicating that the returned array must be cloned upon returning it
 * @returns a float array containing vertex data
 */
export function GetFloatData(
    data: DataArray,
    size: number,
    type: number,
    byteOffset: number,
    byteStride: number,
    normalized: boolean,
    totalVertices: number,
    forceCopy?: boolean
): FloatArray {
    const tightlyPackedByteStride = size * GetTypeByteLength(type);
    const count = totalVertices * size;

    if (type !== Constants.FLOAT || byteStride !== tightlyPackedByteStride) {
        const copy = new Float32Array(count);
        EnumerateFloatValues(data, byteOffset, byteStride, size, type, count, normalized, (values, index) => {
            for (let i = 0; i < size; i++) {
                copy[index + i] = values[i];
            }
        });
        return copy;
    }

    if (!(data instanceof Array || data instanceof Float32Array) || byteOffset !== 0 || data.length !== count) {
        if (data instanceof Array) {
            const offset = byteOffset / 4;
            return data.slice(offset, offset + count);
        } else if (ArrayBuffer.isView(data)) {
            const offset = data.byteOffset + byteOffset;
            if ((offset & 3) !== 0) {
                Logger.Warn("Float array must be aligned to 4-bytes border");
                forceCopy = true;
            }

            if (forceCopy) {
                return new Float32Array(data.buffer.slice(offset, offset + count * Float32Array.BYTES_PER_ELEMENT));
            } else {
                return new Float32Array(data.buffer, offset, count);
            }
        } else {
            return new Float32Array(data, byteOffset, count);
        }
    }

    if (forceCopy) {
        return data.slice();
    }

    return data;
}

/**
 * Gets the given data array as a typed array that matches the component type. If the data cannot be used directly, a copy is made to support the new typed array.
 * If the data is number[], byteOffset and byteStride must be a multiple of 4, as data will be treated like a list of floats.
 * @param data the input data array
 * @param size the number of components
 * @param type the component type
 * @param byteOffset the byte offset of the data
 * @param byteStride the byte stride of the data
 * @param totalVertices number of vertices in the buffer to take into account
 * @param forceCopy defines a boolean indicating that the returned array must be cloned upon returning it
 * @returns a typed array containing vertex data
 */
export function GetTypedArrayData(
    data: DataArray,
    size: number,
    type: number,
    byteOffset: number,
    byteStride: number,
    totalVertices: number,
    forceCopy?: boolean
): VertexDataTypedArray {
    const typeByteLength = GetTypeByteLength(type);
    const constructor = GetTypedArrayConstructor(type);
    const count = totalVertices * size;

    // Handle number[]
    if (Array.isArray(data)) {
        if ((byteOffset & 3) !== 0 || (byteStride & 3) !== 0) {
            throw new Error("byteOffset and byteStride must be a multiple of 4 for number[] data.");
        }

        const offset = byteOffset / 4;
        const stride = byteStride / 4;

        const lastIndex = offset + (totalVertices - 1) * stride + size;
        if (lastIndex > data.length) {
            throw new Error("Last accessed index is out of bounds.");
        }

        if (stride < size) {
            throw new Error("Data stride cannot be smaller than the component size.");
        }
        if (stride !== size) {
            const copy = new constructor(count);
            EnumerateFloatValues(data, byteOffset, byteStride, size, type, count, false, (values, index) => {
                for (let i = 0; i < size; i++) {
                    copy[index + i] = values[i];
                }
            });
            return copy;
        }

        return new constructor(data.slice(offset, offset + count));
    }

    // Handle ArrayBuffer and ArrayBufferView
    let buffer: ArrayBufferLike;
    let adjustedByteOffset = byteOffset;

    if (ArrayBuffer.isView(data)) {
        buffer = data.buffer;
        adjustedByteOffset += data.byteOffset;
    } else {
        buffer = data;
    }

    const lastByteOffset = adjustedByteOffset + (totalVertices - 1) * byteStride + size * typeByteLength;
    if (lastByteOffset > buffer.byteLength) {
        throw new Error("Last accessed byte is out of bounds.");
    }

    const tightlyPackedByteStride = size * typeByteLength;
    if (byteStride < tightlyPackedByteStride) {
        throw new Error("Byte stride cannot be smaller than the component's byte size.");
    }
    if (byteStride !== tightlyPackedByteStride) {
        const copy = new constructor(count);
        EnumerateFloatValues(buffer, adjustedByteOffset, byteStride, size, type, count, false, (values, index) => {
            for (let i = 0; i < size; i++) {
                copy[index + i] = values[i];
            }
        });
        return copy;
    }

    if (typeByteLength !== 1 && (adjustedByteOffset & (typeByteLength - 1)) !== 0) {
        Logger.Warn("Array must be aligned to border of element size. Data will be copied.");
        forceCopy = true;
    }

    if (forceCopy) {
        return new constructor(buffer.slice(adjustedByteOffset, adjustedByteOffset + count * typeByteLength));
    }

    return new constructor(buffer, adjustedByteOffset, count);
}

/**
 * Copies the given data array to the given float array.
 * @param input the input data array
 * @param size the number of components
 * @param type the component type
 * @param byteOffset the byte offset of the data
 * @param byteStride the byte stride of the data
 * @param normalized whether the data is normalized
 * @param totalVertices number of vertices in the buffer to take into account
 * @param output the output float array
 */
export function CopyFloatData(
    input: DataArray,
    size: number,
    type: number,
    byteOffset: number,
    byteStride: number,
    normalized: boolean,
    totalVertices: number,
    output: Float32Array
): void {
    const tightlyPackedByteStride = size * GetTypeByteLength(type);
    const count = totalVertices * size;

    if (output.length !== count) {
        throw new Error("Output length is not valid");
    }

    if (type !== Constants.FLOAT || byteStride !== tightlyPackedByteStride) {
        EnumerateFloatValues(input, byteOffset, byteStride, size, type, count, normalized, (values, index) => {
            for (let i = 0; i < size; i++) {
                output[index + i] = values[i];
            }
        });
        return;
    }

    if (input instanceof Array) {
        const offset = byteOffset / 4;
        output.set(input, offset);
    } else if (ArrayBuffer.isView(input)) {
        const offset = input.byteOffset + byteOffset;
        if ((offset & 3) !== 0) {
            Logger.Warn("Float array must be aligned to 4-bytes border");
            output.set(new Float32Array(input.buffer.slice(offset, offset + count * Float32Array.BYTES_PER_ELEMENT)));
            return;
        }

        const floatData = new Float32Array(input.buffer, offset, count);
        output.set(floatData);
    } else {
        const floatData = new Float32Array(input, byteOffset, count);
        output.set(floatData);
    }
}

/**
 * Utility function to determine if an IndicesArray is an Uint32Array. If indices is an Array, determines whether at least one index is 32 bits.
 * @param indices The IndicesArray to check.
 * @param count The number of indices. Only used if indices is an Array.
 * @param start The offset to start at (default: 0). Only used if indices is an Array.
 * @param offset The offset to substract from the indices before testing (default: 0). Only used if indices is an Array.
 * @returns True if the indices use 32 bits
 */
export function AreIndices32Bits(indices: IndicesArray, count: number, start = 0, offset = 0): boolean {
    if (Array.isArray(indices)) {
        for (let index = 0; index < count; index++) {
            if (indices[start + index] - offset > 65535) {
                return true;
            }
        }
        return false;
    }

    return indices.BYTES_PER_ELEMENT === 4;
}

/**
 * Creates a typed array suitable for GPU buffer operations, as some engines require CPU buffer sizes to be aligned to specific boundaries (e.g., 4 bytes).
 * The use of non-aligned arrays still works but may result in a performance penalty.
 * @param type The type of the array. For instance, Float32Array or Uint8Array
 * @param elementCount The number of elements to store in the array
 * @returns The aligned typed array
 */
export function CreateAlignedTypedArray<T extends TypedArray>(type: TypedArrayConstructor<T>, elementCount: number): T {
    let byteSize = elementCount * type.BYTES_PER_ELEMENT;

    if ((byteSize & 3) === 0) {
        return new type(elementCount);
    }

    byteSize = (byteSize + 3) & ~3;

    const backingBuffer = new ArrayBuffer(byteSize);

    return new type(backingBuffer, 0, elementCount);
}

/**
 * Gets a BufferSource from an ArrayBufferView, ensuring that the returned ArrayBuffer is not a SharedArrayBuffer.
 * If the input view's buffer is a SharedArrayBuffer, a new ArrayBuffer is created and the data is copied over.
 * @param view The input ArrayBufferView
 * @returns An ArrayBuffer containing the data from the view
 */
export function GetBlobBufferSource(view: ArrayBufferView): BufferSource {
    const buffer = view.buffer;
    if (buffer instanceof ArrayBuffer) {
        // Safely cast here because we know bytes is not a SharedArrayBuffer
        return view as ArrayBufferView<ArrayBuffer>;
    }

    // We are dealing with a SharedArrayBuffer, so we need to create a new ArrayBuffer and copy the data over
    const unsharedBuffer = new ArrayBuffer(view.byteLength);
    const copyView = new Uint8Array(unsharedBuffer);
    copyView.set(new Uint8Array(buffer, view.byteOffset, view.byteLength));
    return unsharedBuffer;
}
