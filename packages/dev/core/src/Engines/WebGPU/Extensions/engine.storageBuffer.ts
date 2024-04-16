import type { DataBuffer } from "../../../Buffers/dataBuffer";
import type { WebGPUDataBuffer } from "../../../Meshes/WebGPU/webgpuDataBuffer";
import type { DataArray, Nullable } from "../../../types";
import { Constants } from "../../constants";
import { WebGPUEngine } from "../../webgpuEngine";
import * as WebGPUConstants from "../webgpuConstants";
import { Effect } from "../../../Materials/effect";

import type { StorageBuffer } from "../../../Buffers/storageBuffer";

declare module "../../../Materials/effect" {
    export interface Effect {
        /**
         * Sets a storage buffer on the engine to be used in the shader.
         * @param name Name of the storage buffer variable.
         * @param buffer Storage buffer to set.
         * @param label defines the label of the buffer (for debug purpose)
         */
        setStorageBuffer(name: string, buffer: Nullable<StorageBuffer>, label?: string): void;
    }
}

declare module "../../webgpuEngine" {
    export interface WebGPUEngine {
        /**
         * Creates a storage buffer
         * @param data the data for the storage buffer or the size of the buffer
         * @param creationFlags flags to use when creating the buffer (see Constants.BUFFER_CREATIONFLAG_XXX). The BUFFER_CREATIONFLAG_STORAGE flag will be automatically added
         * @param label defines the label of the buffer (for debug purpose)
         * @returns the new buffer
         */
        createStorageBuffer(data: DataArray | number, creationFlags: number, label?: string): DataBuffer;

        /**
         * Updates a storage buffer
         * @param buffer the storage buffer to update
         * @param data the data used to update the storage buffer
         * @param byteOffset the byte offset of the data
         * @param byteLength the byte length of the data
         */
        updateStorageBuffer(buffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void;

        /**
         * Read data from a storage buffer
         * @param storageBuffer The storage buffer to read from
         * @param offset The offset in the storage buffer to start reading from (default: 0)
         * @param size  The number of bytes to read from the storage buffer (default: capacity of the buffer)
         * @param buffer The buffer to write the data we have read from the storage buffer to (optional)
         * @param noDelay If true, a call to flushFramebuffer will be issued so that the data can be read back immediately and not in engine.onEndFrameObservable. This can speed up data retrieval, at the cost of a small perf penalty (default: false).
         * @returns If not undefined, returns the (promise) buffer (as provided by the 4th parameter) filled with the data, else it returns a (promise) Uint8Array with the data read from the storage buffer
         */
        readFromStorageBuffer(storageBuffer: DataBuffer, offset?: number, size?: number, buffer?: ArrayBufferView, noDelay?: boolean): Promise<ArrayBufferView>;

        /**
         * Sets a storage buffer in the shader
         * @param name Defines the name of the storage buffer as defined in the shader
         * @param buffer Defines the value to give to the uniform
         */
        setStorageBuffer(name: string, buffer: Nullable<StorageBuffer>): void;
    }
}

Effect.prototype.setStorageBuffer = function (name: string, buffer: Nullable<StorageBuffer>): void {
    this._engine.setStorageBuffer(name, buffer);
};

WebGPUEngine.prototype.createStorageBuffer = function (data: DataArray | number, creationFlags: number, label?: string): DataBuffer {
    return this._createBuffer(data, creationFlags | Constants.BUFFER_CREATIONFLAG_STORAGE, label);
};

WebGPUEngine.prototype.updateStorageBuffer = function (buffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void {
    const dataBuffer = buffer as WebGPUDataBuffer;
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

WebGPUEngine.prototype.readFromStorageBuffer = function (
    storageBuffer: DataBuffer,
    offset?: number,
    size?: number,
    buffer?: ArrayBufferView,
    noDelay?: boolean
): Promise<ArrayBufferView> {
    size = size || storageBuffer.capacity;

    const gpuBuffer = this._bufferManager.createRawBuffer(size, WebGPUConstants.BufferUsage.MapRead | WebGPUConstants.BufferUsage.CopyDst, undefined, "TempReadFromStorageBuffer");

    this._renderEncoder.copyBufferToBuffer(storageBuffer.underlyingResource, offset ?? 0, gpuBuffer, 0, size);

    return new Promise((resolve, reject) => {
        const readFromBuffer = () => {
            gpuBuffer.mapAsync(WebGPUConstants.MapMode.Read, 0, size).then(
                () => {
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
                },
                (reason) => {
                    if (this.isDisposed) {
                        resolve(new Uint8Array());
                    } else {
                        reject(reason);
                    }
                }
            );
        };

        if (noDelay) {
            this.flushFramebuffer();
            readFromBuffer();
        } else {
            // we are using onEndFrameObservable because we need to map the gpuBuffer AFTER the command buffers
            // have been submitted, else we get the error: "Buffer used in a submit while mapped"
            this.onEndFrameObservable.addOnce(() => {
                readFromBuffer();
            });
        }
    });
};

WebGPUEngine.prototype.setStorageBuffer = function (name: string, buffer: Nullable<StorageBuffer>): void {
    this._currentDrawContext?.setBuffer(name, (buffer?.getBuffer() as WebGPUDataBuffer) ?? null);
};
