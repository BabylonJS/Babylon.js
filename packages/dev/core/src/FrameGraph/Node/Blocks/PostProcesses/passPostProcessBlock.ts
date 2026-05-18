/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import passPostProcessBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./passPostProcessBlock.pure";

import { RegisterPassPostProcessBlock } from "./passPostProcessBlock.pure";
RegisterPassPostProcessBlock();
