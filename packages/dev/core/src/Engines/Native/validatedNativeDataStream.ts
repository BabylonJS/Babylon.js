/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import validatedNativeDataStream.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./validatedNativeDataStream.pure";

import { registerValidatedNativeDataStream } from "./validatedNativeDataStream.pure";
registerValidatedNativeDataStream();
