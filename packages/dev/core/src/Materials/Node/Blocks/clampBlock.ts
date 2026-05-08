/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import clampBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./clampBlock.pure";

import { registerClampBlock } from "./clampBlock.pure";
registerClampBlock();
