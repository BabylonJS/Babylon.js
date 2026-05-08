/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import lerpBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lerpBlock.pure";

import { RegisterLerpBlock } from "./lerpBlock.pure";
RegisterLerpBlock();
