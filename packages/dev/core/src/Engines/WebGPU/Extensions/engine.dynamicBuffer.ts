import type { DataBuffer } from "../../../Buffers/dataBuffer";
import type { WebGPUDataBuffer } from "../../../Meshes/WebGPU/webgpuDataBuffer";
import type { DataArray, IndicesArray } from "../../../types";
import { WebGPUEngine } from "../../webgpuEngine";

WebGPUEngine.prototype.updateDynamicIndexBuffer = function (indexBuffer: DataBuffer, indices: IndicesArray, offset: number = 0): void {
    const gpuBuffer = indexBuffer as WebGPUDataBuffer;

    let view: ArrayBufferView;
    if (indexBuffer.is32Bits) {
        view = indices instanceof Uint32Array ? indices : new Uint32Array(indices);
    } else {
        view = indices instanceof Uint16Array ? indices : new Uint16Array(indices);
    }

    this._bufferManager.setSubData(gpuBuffer, offset, view);
};

WebGPUEngine.prototype.updateDynamicVertexBuffer = function (vertexBuffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void {
    const dataBuffer = vertexBuffer as WebGPUDataBuffer;
    if (byteOffset === undefined) {
        byteOffset = 0;
    }

    let view: ArrayBufferView;
    if (byteLength === undefined) {
        if (data instanceof Array) {
            view = new Float32Array(data);
        } else if (data instanceof ArrayBuffer) {
            view = new Uint8Array(data);
        } else {
            view = data;
        }
        byteLength = view.byteLength;
    } else {
        if (data instanceof Array) {
            view = new Float32Array(data);
        } else if (data instanceof ArrayBuffer) {
            view = new Uint8Array(data);
        } else {
            view = data;
        }
    }

    this._bufferManager.setSubData(dataBuffer, byteOffset, view, 0, byteLength);
};
