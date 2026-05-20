/* eslint-disable @typescript-eslint/naming-convention */
import {
    type VertexBufferDeduceStride,
    type VertexBufferForEach,
    type VertexBufferGetDataType,
    type VertexBufferGetFloatData,
    type VertexBufferGetTypeByteLength,
} from "./buffer.pure";

type VertexBufferDeduceStrideType = typeof VertexBufferDeduceStride;
type VertexBufferForEachType = typeof VertexBufferForEach;
type VertexBufferGetDataTypeType = typeof VertexBufferGetDataType;
type VertexBufferGetFloatDataType = typeof VertexBufferGetFloatData;
type VertexBufferGetTypeByteLengthType = typeof VertexBufferGetTypeByteLength;

declare module "./buffer.pure" {
    namespace VertexBuffer {
        export let DeduceStride: VertexBufferDeduceStrideType;
        export let ForEach: VertexBufferForEachType;
        export let GetDataType: VertexBufferGetDataTypeType;
        export let GetFloatData: VertexBufferGetFloatDataType;
        export let GetTypeByteLength: VertexBufferGetTypeByteLengthType;
    }
}
