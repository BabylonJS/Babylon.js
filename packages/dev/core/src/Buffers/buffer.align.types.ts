import { type Nullable } from "core/types";
import { type DataBuffer } from "./dataBuffer";
declare module "./buffer.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface VertexBuffer {
        /**
         * Gets the effective byte stride, that is the byte stride of the buffer that is actually sent to the GPU.
         * It could be different from VertexBuffer.byteStride if a new buffer must be created under the hood because of the forceVertexBufferStrideAndOffsetMultiple4Bytes engine flag.
         */
        effectiveByteStride: number;

        /**
         * Gets the effective byte offset, that is the byte offset of the buffer that is actually sent to the GPU.
         * It could be different from VertexBuffer.byteOffset if a new buffer must be created under the hood because of the forceVertexBufferStrideAndOffsetMultiple4Bytes engine flag.
         */
        effectiveByteOffset: number;

        /**
         * Gets the effective buffer, that is the buffer that is actually sent to the GPU.
         * It could be different from VertexBuffer.getBuffer() if a new buffer must be created under the hood because of the forceVertexBufferStrideAndOffsetMultiple4Bytes engine flag.
         */
        effectiveBuffer: Nullable<DataBuffer>;

        /** @internal */
        _alignBuffer(): void;

        /** @internal */
        _alignedBuffer?: Buffer;
    }
}
