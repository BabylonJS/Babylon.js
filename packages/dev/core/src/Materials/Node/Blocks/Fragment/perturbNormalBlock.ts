/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import perturbNormalBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./perturbNormalBlock.pure";

import { registerPerturbNormalBlock } from "./perturbNormalBlock.pure";
registerPerturbNormalBlock();
