import { DataBuffer } from "../../../Buffers/dataBuffer";
import { WebGPUDataBuffer } from "../../../Meshes/WebGPU/webgpuDataBuffer";
import { DataArray } from "../../../types";
import { Constants } from "../../constants";
import { WebGPUEngine } from "../../webgpuEngine";
import * as WebGPUConstants from '../webgpuConstants';

WebGPUEngine.prototype.createStorageBuffer = function(data: DataArray | number, creationFlags: number): DataBuffer {
    return this._createBuffer(data, creationFlags | Constants.BUFFER_CREATIONFLAG_STORAGE);
};

WebGPUEngine.prototype.updateStorageBuffer = function(buffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void {
    const dataBuffer = buffer as WebGPUDataBuffer;
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

WebGPUEngine.prototype.readFromStorageBuffer = function(storageBuffer: DataBuffer, offset?: number, size?: number, buffer?: ArrayBufferView): Promise<ArrayBufferView> {
    size = size || storageBuffer.capacity;

    const gpuBuffer = this._bufferManager.createRawBuffer(size, WebGPUConstants.BufferUsage.MapRead | WebGPUConstants.BufferUsage.CopyDst);

    this._renderTargetEncoder.copyBufferToBuffer(
        storageBuffer.underlyingResource,
        offset ?? 0,
        gpuBuffer,
        0,
        size
    );

    return new Promise((resolve, reject) => {
        // we are using onEndFrameObservable because we need to map the gpuBuffer AFTER the command buffers
        // have been submitted, else we get the error: "Buffer used in a submit while mapped"
        this.onEndFrameObservable.addOnce(() => {
            gpuBuffer.mapAsync(WebGPUConstants.MapMode.Read, 0, size).then(() => {
                const copyArrayBuffer = gpuBuffer.getMappedRange(0, size);
                let data: ArrayBufferView | undefined = buffer;
                if (data === undefined) {
                    data = new Uint8Array(size!);
                    (data as Uint8Array).set(new Uint8Array(copyArrayBuffer));
                } else {
                    const ctor = data.constructor as any; // we want to create result data with the same type as buffer (Uint8Array, Float32Array, ...)
                    data = new ctor(data.buffer);
                    (data as any).set(new ctor(copyArrayBuffer));
                }
                gpuBuffer.unmap();
                this._bufferManager.releaseBuffer(gpuBuffer);
                resolve(data!);
            }, (reason) => reject(reason));
        });
    });
};
