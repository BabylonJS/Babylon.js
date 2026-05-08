export * from "./engine.dynamicBuffer.types";
/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import engine.dynamicBuffer.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./engine.dynamicBuffer.pure";

import { RegisterEngineDynamicBuffer } from "./engine.dynamicBuffer.pure";
RegisterEngineDynamicBuffer();
