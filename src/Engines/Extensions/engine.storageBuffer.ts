import { ThinEngine } from "../../Engines/thinEngine";
import { DataBuffer } from '../../Buffers/dataBuffer';
import { DataArray } from "../../types";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Creates a storage buffer
         * @param data the data for the storage buffer or the size of the buffer
         * @param creationFlags flags to use when creating the buffer (see Constants.BUFFER_CREATIONFLAG_XXX). The BUFFER_CREATIONFLAG_STORAGE flag will be automatically added
         * @returns the new buffer
         */
        createStorageBuffer(data: DataArray | number, creationFlags: number): DataBuffer;

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
         * @returns If not undefined, returns the (promise) buffer (as provided by the 4th parameter) filled with the data, else it returns a (promise) Uint8Array with the data read from the storage buffer
         */
        readFromStorageBuffer(storageBuffer: DataBuffer, offset?: number, size?: number, buffer?: ArrayBufferView): Promise<ArrayBufferView>;
    }
}

ThinEngine.prototype.createStorageBuffer = function (data: DataArray | number, creationFlags: number): DataBuffer {
    throw new Error("createStorageBuffer: Unsupported method in this engine!");
};

ThinEngine.prototype.updateStorageBuffer = function(buffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void {
};

ThinEngine.prototype.readFromStorageBuffer = function(storageBuffer: DataBuffer, offset?: number, size?: number, buffer?: ArrayBufferView): Promise<ArrayBufferView> {
    throw new Error("readFromStorageBuffer: Unsupported method in this engine!");
};
