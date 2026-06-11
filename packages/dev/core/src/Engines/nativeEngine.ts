/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import nativeEngine.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./nativeEngine.pure";

// Pull in the ThinNativeEngine wrapper so its required side effects
// (e.g. Buffers/buffer.align prototype augmentation that installs
// VertexBuffer.effectiveByteOffset/Stride/Buffer used by the Native
// recordVertexBuffer path) are applied. Without this, geometry submitted
// through Babylon Native renders nothing.
import "./thinNativeEngine";

import { RegisterNativeEngine } from "./nativeEngine.pure";
RegisterNativeEngine();
