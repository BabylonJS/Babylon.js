/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import capsuleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./capsuleBlock.pure";

import { registerCapsuleBlock } from "./capsuleBlock.pure";
registerCapsuleBlock();
