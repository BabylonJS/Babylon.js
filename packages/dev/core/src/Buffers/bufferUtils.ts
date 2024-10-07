import { Constants } from "../Engines/constants";
import { Logger } from "../Misc/logger";
import type { DataArray, FloatArray } from "../types";

function getFloatValue(dataView: DataView, type: number, byteOffset: number, normalized: boolean): number {
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

function setFloatValue(dataView: DataView, type: number, byteOffset: number, normalized: boolean, value: number): void {
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
export function getTypeByteLength(type: number): number {
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
export function enumerateFloatValues(
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
        const dataView = data instanceof ArrayBuffer ? new DataView(data) : new DataView(data.buffer, data.byteOffset, data.byteLength);
        const componentByteLength = getTypeByteLength(componentType);
        for (let index = 0; index < count; index += componentCount) {
            for (let componentIndex = 0, componentByteOffset = byteOffset; componentIndex < componentCount; componentIndex++, componentByteOffset += componentByteLength) {
                oldValues[componentIndex] = newValues[componentIndex] = getFloatValue(dataView, componentType, componentByteOffset, normalized);
            }

            callback(newValues, index);

            for (let componentIndex = 0, componentByteOffset = byteOffset; componentIndex < componentCount; componentIndex++, componentByteOffset += componentByteLength) {
                if (oldValues[componentIndex] !== newValues[componentIndex]) {
                    setFloatValue(dataView, componentType, componentByteOffset, normalized, newValues[componentIndex]);
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
export function getFloatData(
    data: DataArray,
    size: number,
    type: number,
    byteOffset: number,
    byteStride: number,
    normalized: boolean,
    totalVertices: number,
    forceCopy?: boolean
): FloatArray {
    const tightlyPackedByteStride = size * getTypeByteLength(type);
    const count = totalVertices * size;

    if (type !== Constants.FLOAT || byteStride !== tightlyPackedByteStride) {
        const copy = new Float32Array(count);
        enumerateFloatValues(data, byteOffset, byteStride, size, type, count, normalized, (values, index) => {
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
        } else if (data instanceof ArrayBuffer) {
            return new Float32Array(data, byteOffset, count);
        } else {
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
        }
    }

    if (forceCopy) {
        return data.slice();
    }

    return data;
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
export function copyFloatData(
    input: DataArray,
    size: number,
    type: number,
    byteOffset: number,
    byteStride: number,
    normalized: boolean,
    totalVertices: number,
    output: Float32Array
): void {
    const tightlyPackedByteStride = size * getTypeByteLength(type);
    const count = totalVertices * size;

    if (output.length !== count) {
        throw new Error("Output length is not valid");
    }

    if (type !== Constants.FLOAT || byteStride !== tightlyPackedByteStride) {
        enumerateFloatValues(input, byteOffset, byteStride, size, type, count, normalized, (values, index) => {
            for (let i = 0; i < size; i++) {
                output[index + i] = values[i];
            }
        });
        return;
    }

    if (input instanceof Array) {
        const offset = byteOffset / 4;
        output.set(input, offset);
    } else if (input instanceof ArrayBuffer) {
        const floatData = new Float32Array(input, byteOffset, count);
        output.set(floatData);
    } else {
        const offset = input.byteOffset + byteOffset;
        if ((offset & 3) !== 0) {
            Logger.Warn("Float array must be aligned to 4-bytes border");
            output.set(new Float32Array(input.buffer.slice(offset, offset + count * Float32Array.BYTES_PER_ELEMENT)));
            return;
        }

        const floatData = new Float32Array(input.buffer, offset, count);
        output.set(floatData);
    }
}
