import { DataBuffer } from "../../../Buffers/dataBuffer";
import { WebGPUDataBuffer } from "../../../Meshes/WebGPU/webgpuDataBuffer";
import { DataArray, IndicesArray } from "../../../types";
import { WebGPUEngine } from "../../webgpuEngine";

 WebGPUEngine.prototype.updateDynamicIndexBuffer = function(indexBuffer: DataBuffer, indices: IndicesArray, offset: number = 0): void {
    const gpuBuffer = indexBuffer as WebGPUDataBuffer;

    var view: ArrayBufferView;
    if (indices instanceof Uint16Array) {
        if (indexBuffer.is32Bits) {
            view = Uint32Array.from(indices);
        }
        else {
            view = indices;
        }
    }
    else if (indices instanceof Uint32Array) {
        if (indexBuffer.is32Bits) {
            view = indices;
        }
        else {
            view = Uint16Array.from(indices);
        }
    }
    else {
        if (indexBuffer.is32Bits) {
            view = new Uint32Array(indices);
        }
        else {
            view = new Uint16Array(indices);
        }
    }

    this._bufferManager.setSubData(gpuBuffer, offset, view);
};

WebGPUEngine.prototype.updateDynamicVertexBuffer = function(vertexBuffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void {
    const dataBuffer = vertexBuffer as WebGPUDataBuffer;
    if (byteOffset === undefined) {
        byteOffset = 0;
    }

    let view: ArrayBufferView;
    if (byteLength === undefined) {
        if (data instanceof Array) {
            view = new Float32Array(data);
        }
        else if (data instanceof ArrayBuffer) {
            view = new Uint8Array(data);
        }
        else {
            view = data;
        }
        byteLength = view.byteLength;
    } else {
        if (data instanceof Array) {
            view = new Float32Array(data);
        }
        else if (data instanceof ArrayBuffer) {
            view = new Uint8Array(data);
        }
        else {
            view = data;
        }
    }

    this._bufferManager.setSubData(dataBuffer, byteOffset, view, 0, byteLength);
};
