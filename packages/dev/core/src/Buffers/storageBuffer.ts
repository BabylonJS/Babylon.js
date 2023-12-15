import type { ThinEngine } from "../Engines/thinEngine";
import type { DataBuffer } from "../Buffers/dataBuffer";
import type { DataArray } from "../types";
import { Constants } from "../Engines/constants";

/**
 * This class is a small wrapper around a native buffer that can be read and/or written
 */
export class StorageBuffer {
    private _engine: ThinEngine;
    private _buffer: DataBuffer;
    private _bufferSize: number;
    private _creationFlags: number;
    private _label?: string;

    /**
     * Creates a new storage buffer instance
     * @param engine The engine the buffer will be created inside
     * @param size The size of the buffer in bytes
     * @param creationFlags flags to use when creating the buffer (see Constants.BUFFER_CREATIONFLAG_XXX). The BUFFER_CREATIONFLAG_STORAGE flag will be automatically added.
     * @param label defines the label of the buffer (for debug purpose)
     */
    constructor(engine: ThinEngine, size: number, creationFlags = Constants.BUFFER_CREATIONFLAG_READWRITE, label?: string) {
        this._engine = engine;
        this._label = label;
        this._engine._storageBuffers.push(this);
        this._create(size, creationFlags);
    }

    private _create(size: number, creationFlags: number): void {
        this._bufferSize = size;
        this._creationFlags = creationFlags;
        this._buffer = this._engine.createStorageBuffer(size, creationFlags, this._label);
    }

    /** @internal */
    public _rebuild(): void {
        this._create(this._bufferSize, this._creationFlags);
    }

    /**
     * Gets underlying native buffer
     * @returns underlying native buffer
     */
    public getBuffer(): DataBuffer {
        return this._buffer;
    }

    /**
     * Updates the storage buffer
     * @param data the data used to update the storage buffer
     * @param byteOffset the byte offset of the data (optional)
     * @param byteLength the byte length of the data (optional)
     */
    public update(data: DataArray, byteOffset?: number, byteLength?: number): void {
        if (!this._buffer) {
            return;
        }

        this._engine.updateStorageBuffer(this._buffer, data, byteOffset, byteLength);
    }

    /**
     * Reads data from the storage buffer
     * @param offset The offset in the storage buffer to start reading from (default: 0)
     * @param size  The number of bytes to read from the storage buffer (default: capacity of the buffer)
     * @param buffer The buffer to write the data we have read from the storage buffer to (optional)
     * @param noDelay If true, a call to flushFramebuffer will be issued so that the data can be read back immediately. This can speed up data retrieval, at the cost of a small perf penalty (default: false).
     * @returns If not undefined, returns the (promise) buffer (as provided by the 4th parameter) filled with the data, else it returns a (promise) Uint8Array with the data read from the storage buffer
     */
    public read(offset?: number, size?: number, buffer?: ArrayBufferView, noDelay?: boolean): Promise<ArrayBufferView> {
        return this._engine.readFromStorageBuffer(this._buffer, offset, size, buffer, noDelay);
    }

    /**
     * Disposes the storage buffer
     */
    public dispose(): void {
        const storageBuffers = this._engine._storageBuffers;
        const index = storageBuffers.indexOf(this);

        if (index !== -1) {
            storageBuffers[index] = storageBuffers[storageBuffers.length - 1];
            storageBuffers.pop();
        }

        this._engine._releaseBuffer(this._buffer);
        this._buffer = null as any;
    }
}
