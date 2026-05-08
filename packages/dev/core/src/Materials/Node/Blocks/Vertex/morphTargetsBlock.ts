/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import morphTargetsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./morphTargetsBlock.pure";

import { registerMorphTargetsBlock } from "./morphTargetsBlock.pure";
registerMorphTargetsBlock();
