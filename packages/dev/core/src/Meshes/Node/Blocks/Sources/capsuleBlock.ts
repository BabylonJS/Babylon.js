/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import capsuleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./capsuleBlock.pure";

import { RegisterCapsuleBlock } from "./capsuleBlock.pure";
RegisterCapsuleBlock();
