/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import nativeEngine.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./nativeEngine.pure";

import { registerNativeEngine } from "./nativeEngine.pure";
registerNativeEngine();
