/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import mapRangeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./mapRangeBlock.pure";

import { registerMapRangeBlock } from "./mapRangeBlock.pure";
registerMapRangeBlock();
