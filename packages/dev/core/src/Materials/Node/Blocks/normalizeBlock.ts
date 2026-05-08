/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import normalizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./normalizeBlock.pure";

import { registerNormalizeBlock } from "./normalizeBlock.pure";
registerNormalizeBlock();
