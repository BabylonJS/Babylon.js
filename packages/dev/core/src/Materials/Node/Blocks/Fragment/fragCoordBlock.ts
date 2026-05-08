/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fragCoordBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fragCoordBlock.pure";

import { registerFragCoordBlock } from "./fragCoordBlock.pure";
registerFragCoordBlock();
