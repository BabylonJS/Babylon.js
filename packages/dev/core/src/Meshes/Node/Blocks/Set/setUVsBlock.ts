/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setUVsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setUVsBlock.pure";

import { RegisterSetUVsBlock } from "./setUVsBlock.pure";
RegisterSetUVsBlock();
