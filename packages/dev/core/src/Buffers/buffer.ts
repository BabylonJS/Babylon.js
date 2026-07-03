export * from "./buffer.pure";
export * from "./buffer.types";

import { RegisterVertexBuffer, VertexBuffer } from "./buffer.pure";

RegisterVertexBuffer();

// #region GENERATED_SIDE_EFFECT_STUBS — do not edit, regenerate with `npm run generate:side-effect-stubs`
import { _MissingSideEffectProperty } from "../Misc/devTools";

if (!Object.getOwnPropertyDescriptor(VertexBuffer.prototype, "effectiveByteStride")) {
    Object.defineProperty(VertexBuffer.prototype, "effectiveByteStride", _MissingSideEffectProperty("VertexBuffer", "effectiveByteStride"));
}
if (!Object.getOwnPropertyDescriptor(VertexBuffer.prototype, "effectiveByteOffset")) {
    Object.defineProperty(VertexBuffer.prototype, "effectiveByteOffset", _MissingSideEffectProperty("VertexBuffer", "effectiveByteOffset"));
}
if (!Object.getOwnPropertyDescriptor(VertexBuffer.prototype, "effectiveBuffer")) {
    Object.defineProperty(VertexBuffer.prototype, "effectiveBuffer", _MissingSideEffectProperty("VertexBuffer", "effectiveBuffer"));
}
// #endregion GENERATED_SIDE_EFFECT_STUBS
