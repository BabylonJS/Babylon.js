/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import nativeXRFrame.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./nativeXRFrame.pure";

import { registerNativeXRFrame } from "./nativeXRFrame.pure";
registerNativeXRFrame();
