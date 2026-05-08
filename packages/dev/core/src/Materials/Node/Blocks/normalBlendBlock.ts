/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import normalBlendBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./normalBlendBlock.pure";

import { RegisterNormalBlendBlock } from "./normalBlendBlock.pure";
RegisterNormalBlendBlock();
