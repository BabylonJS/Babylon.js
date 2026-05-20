/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import lightBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./lightBlock.pure";

import { RegisterLightBlock } from "./lightBlock.pure";
RegisterLightBlock();
