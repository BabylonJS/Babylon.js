/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fragDepthBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fragDepthBlock.pure";

import { RegisterFragDepthBlock } from "./fragDepthBlock.pure";
RegisterFragDepthBlock();
