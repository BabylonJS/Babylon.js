import { DataBuffer } from "../../Buffers/dataBuffer";
import type { Nullable } from "../../types";

/** @internal */
export class WebGPUDataBuffer extends DataBuffer {
    private _buffer: Nullable<GPUBuffer>;

    // Used to make sure the buffer is not recreated twice after a context loss/restoration
    public engineId = -1;

    public set buffer(buffer: Nullable<GPUBuffer>) {
        this._buffer = buffer;
    }

    public constructor(resource?: GPUBuffer, capacity = 0) {
        super();
        this.capacity = capacity;
        if (resource) {
            this._buffer = resource;
        }
    }

    public override get underlyingResource(): any {
        return this._buffer;
    }
}
