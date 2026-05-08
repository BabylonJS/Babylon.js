/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.dynamicBuffer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.dynamicBuffer.pure";

import { registerEngineDynamicBuffer } from "./engine.dynamicBuffer.pure";
registerEngineDynamicBuffer();
