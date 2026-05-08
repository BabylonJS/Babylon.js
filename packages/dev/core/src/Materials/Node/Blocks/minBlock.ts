/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import minBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./minBlock.pure";

import { registerMinBlock } from "./minBlock.pure";
registerMinBlock();
