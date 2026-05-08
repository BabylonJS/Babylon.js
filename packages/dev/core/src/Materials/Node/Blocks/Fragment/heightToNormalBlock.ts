/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import heightToNormalBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./heightToNormalBlock.pure";

import { registerHeightToNormalBlock } from "./heightToNormalBlock.pure";
registerHeightToNormalBlock();
