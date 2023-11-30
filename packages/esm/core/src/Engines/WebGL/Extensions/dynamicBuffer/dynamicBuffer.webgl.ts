import type { DataBuffer } from "@babylonjs/core/Buffers/dataBuffer.js";
import type { DataArray, IndicesArray } from "@babylonjs/core/types.js";
import type { IDynamicBufferEngineExtension } from "../../../Extensions/dynamicBuffer/dynamicBuffer.base";
import type { IWebGLEnginePublic, WebGLEngineState } from "../../engine.webgl";
import { _bindIndexBuffer, _resetIndexBufferBinding, bindArrayBuffer, _resetVertexBufferBinding } from "../../engine.webgl";

export const updateDynamicIndexBuffer: IDynamicBufferEngineExtension["updateDynamicIndexBuffer"] = function (
    engineState: IWebGLEnginePublic,
    indexBuffer: DataBuffer,
    indices: IndicesArray,
    _offset: number = 0
): void {
    const fes = engineState as WebGLEngineState;
    // Force cache update
    fes._currentBoundBuffer[fes._gl.ELEMENT_ARRAY_BUFFER] = null;
    _bindIndexBuffer(fes, indexBuffer);

    let view: ArrayBufferView;
    if (indexBuffer.is32Bits) {
        // anything else than Uint32Array needs to be converted to Uint32Array
        view = indices instanceof Uint32Array ? indices : new Uint32Array(indices);
    } else {
        // anything else than Uint16Array needs to be converted to Uint16Array
        view = indices instanceof Uint16Array ? indices : new Uint16Array(indices);
    }

    fes._gl.bufferData(fes._gl.ELEMENT_ARRAY_BUFFER, view, fes._gl.DYNAMIC_DRAW);

    _resetIndexBufferBinding(fes);
};

export const updateDynamicVertexBuffer: IDynamicBufferEngineExtension["updateDynamicVertexBuffer"] = function (
    engineState: IWebGLEnginePublic,
    vertexBuffer: DataBuffer,
    data: DataArray,
    byteOffset?: number,
    byteLength?: number
): void {
    const fes = engineState as WebGLEngineState;
    bindArrayBuffer(fes, vertexBuffer);

    if (byteOffset === undefined) {
        byteOffset = 0;
    }

    const dataLength = (data as ArrayBuffer).byteLength || (data as number[]).length;

    if (byteLength === undefined || (byteLength >= dataLength && byteOffset === 0)) {
        if (data instanceof Array) {
            fes._gl.bufferSubData(fes._gl.ARRAY_BUFFER, byteOffset, new Float32Array(data));
        } else {
            fes._gl.bufferSubData(fes._gl.ARRAY_BUFFER, byteOffset, <ArrayBuffer>data);
        }
    } else {
        if (data instanceof Array) {
            fes._gl.bufferSubData(fes._gl.ARRAY_BUFFER, 0, new Float32Array(data).subarray(byteOffset, byteOffset + byteLength));
        } else {
            if (data instanceof ArrayBuffer) {
                data = new Uint8Array(data, byteOffset, byteLength);
            } else {
                data = new Uint8Array(data.buffer, data.byteOffset + byteOffset, byteLength);
            }

            fes._gl.bufferSubData(fes._gl.ARRAY_BUFFER, 0, <ArrayBuffer>data);
        }
    }

    _resetVertexBufferBinding(fes);
};

export const dynamicBufferEngineExtension: IDynamicBufferEngineExtension = {
    updateDynamicIndexBuffer,
    updateDynamicVertexBuffer,
};

export default dynamicBufferEngineExtension;
