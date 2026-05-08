/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setPositionsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setPositionsBlock.pure";

import { registerSetPositionsBlock } from "./setPositionsBlock.pure";
registerSetPositionsBlock();
