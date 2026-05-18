/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import normalizeVectorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./normalizeVectorBlock.pure";

import { RegisterNormalizeVectorBlock } from "./normalizeVectorBlock.pure";
RegisterNormalizeVectorBlock();
