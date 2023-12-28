import { DataBuffer } from "../../Buffers/dataBuffer";
import type { Nullable } from "../../types";

/** @internal */
export class WebGPUDataBuffer extends DataBuffer {
    private _buffer: Nullable<GPUBuffer>;

    // Used to make sure the buffer is not recreated twice after a context loss/restoration
    public engineId = -1;

    public constructor(resource: GPUBuffer, capacity = 0) {
        super();
        this.capacity = capacity;
        this._buffer = resource;
    }

    public get underlyingResource(): any {
        return this._buffer;
    }
}
