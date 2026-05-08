/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import normalizeVectorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./normalizeVectorBlock.pure";

import { registerNormalizeVectorBlock } from "./normalizeVectorBlock.pure";
registerNormalizeVectorBlock();
