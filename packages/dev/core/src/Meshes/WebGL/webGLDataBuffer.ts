import { DataBuffer } from "../../Buffers/dataBuffer";
import type { Nullable } from "../../types";

/** @internal */
export class WebGLDataBuffer extends DataBuffer {
    private _buffer: Nullable<WebGLBuffer>;

    /** @internal */
    public constructor(resource: WebGLBuffer) {
        super();
        this._buffer = resource;
    }

    /** @internal */
    public override get underlyingResource(): any {
        return this._buffer;
    }
}
