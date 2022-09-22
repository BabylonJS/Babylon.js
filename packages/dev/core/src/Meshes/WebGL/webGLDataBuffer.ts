import { DataBuffer } from "../../Buffers/dataBuffer";
import type { Nullable } from "../../types";

/** @internal */
export class WebGLDataBuffer extends DataBuffer {
    private _buffer: Nullable<WebGLBuffer>;

    public constructor(resource: WebGLBuffer) {
        super();
        this._buffer = resource;
    }

    public get underlyingResource(): any {
        return this._buffer;
    }
}
