/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import alignBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./alignBlock.pure";

import { registerAlignBlock } from "./alignBlock.pure";
registerAlignBlock();
