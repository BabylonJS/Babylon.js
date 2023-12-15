import { ThinEngine } from "../../Engines/thinEngine";
import type { DataBuffer } from "../../Buffers/dataBuffer";
import type { DataArray, Nullable } from "../../types";

import type { StorageBuffer } from "../../Buffers/storageBuffer";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
ThinEngine.prototype.createStorageBuffer = function (data: DataArray | number, creationFlags: number): DataBuffer {
    throw new Error("createStorageBuffer: Unsupported method in this engine!");
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
ThinEngine.prototype.updateStorageBuffer = function (buffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void {};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
ThinEngine.prototype.readFromStorageBuffer = function (storageBuffer: DataBuffer, offset?: number, size?: number, buffer?: ArrayBufferView): Promise<ArrayBufferView> {
    throw new Error("readFromStorageBuffer: Unsupported method in this engine!");
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
ThinEngine.prototype.setStorageBuffer = function (name: string, buffer: Nullable<StorageBuffer>): void {
    throw new Error("setStorageBuffer: Unsupported method in this engine!");
};
