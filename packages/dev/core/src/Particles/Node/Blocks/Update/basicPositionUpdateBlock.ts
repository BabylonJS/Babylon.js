/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import basicPositionUpdateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./basicPositionUpdateBlock.pure";

import { registerBasicPositionUpdateBlock } from "./basicPositionUpdateBlock.pure";
registerBasicPositionUpdateBlock();
