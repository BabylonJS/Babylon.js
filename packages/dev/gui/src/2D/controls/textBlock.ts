/**
 * Re-exports the pure implementation and applies the runtime registration side effect.
 * Import "./textBlock.pure" for tree-shakeable, side-effect-free usage.
 */
export * from "./textBlock.pure";

import { RegisterTextBlock } from "./textBlock.pure";
RegisterTextBlock();
