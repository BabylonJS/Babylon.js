/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import bonesBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./bonesBlock.pure";

import { registerBonesBlock } from "./bonesBlock.pure";
registerBonesBlock();
