/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import pannerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pannerBlock.pure";

import { registerPannerBlock } from "./pannerBlock.pure";
registerPannerBlock();
