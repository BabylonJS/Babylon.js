import type { DataBuffer } from "core/Buffers/dataBuffer.js";
import type { StorageBuffer } from "core/Buffers/storageBuffer.js";
import type { DataArray, Nullable } from "core/types.js";
import type { IBaseEnginePublic } from "../../engine.base.js";

export interface IStoreBufferEngineExtension {
    /**
     * Creates a storage buffer
     * @param data the data for the storage buffer or the size of the buffer
     * @param creationFlags flags to use when creating the buffer (see Constants.BUFFER_CREATIONFLAG_XXX). The BUFFER_CREATIONFLAG_STORAGE flag will be automatically added
     * @returns the new buffer
     */
    createStorageBuffer(engineState: IBaseEnginePublic, data: DataArray | number, creationFlags: number): DataBuffer;

    /**
     * Updates a storage buffer
     * @param buffer the storage buffer to update
     * @param data the data used to update the storage buffer
     * @param byteOffset the byte offset of the data
     * @param byteLength the byte length of the data
     */
    updateStorageBuffer(engineState: IBaseEnginePublic, buffer: DataBuffer, data: DataArray, byteOffset?: number, byteLength?: number): void;

    /**
     * Read data from a storage buffer
     * @param storageBuffer The storage buffer to read from
     * @param offset The offset in the storage buffer to start reading from (default: 0)
     * @param size  The number of bytes to read from the storage buffer (default: capacity of the buffer)
     * @param buffer The buffer to write the data we have read from the storage buffer to (optional)
     * @returns If not undefined, returns the (promise) buffer (as provided by the 4th parameter) filled with the data, else it returns a (promise) Uint8Array with the data read from the storage buffer
     */
    readFromStorageBuffer(engineState: IBaseEnginePublic, storageBuffer: DataBuffer, offset?: number, size?: number, buffer?: ArrayBufferView): Promise<ArrayBufferView>;

    /**
     * Sets a storage buffer in the shader
     * @param name Defines the name of the storage buffer as defined in the shader
     * @param buffer Defines the value to give to the uniform
     */
    setStorageBuffer(engineState: IBaseEnginePublic, name: string, buffer: Nullable<StorageBuffer>): void;
}
