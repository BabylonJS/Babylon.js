/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import updateAgeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updateAgeBlock.pure";

import { registerUpdateAgeBlock } from "./updateAgeBlock.pure";
registerUpdateAgeBlock();
