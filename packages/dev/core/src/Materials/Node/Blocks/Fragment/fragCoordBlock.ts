/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fragCoordBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fragCoordBlock.pure";

import { RegisterFragCoordBlock } from "./fragCoordBlock.pure";
RegisterFragCoordBlock();
