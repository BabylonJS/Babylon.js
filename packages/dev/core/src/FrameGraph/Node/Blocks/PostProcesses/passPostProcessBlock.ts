/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import passPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./passPostProcessBlock.pure";

import { registerPassPostProcessBlock } from "./passPostProcessBlock.pure";
registerPassPostProcessBlock();
