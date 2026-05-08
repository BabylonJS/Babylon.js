/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import screenSizeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./screenSizeBlock.pure";

import { registerScreenSizeBlock } from "./screenSizeBlock.pure";
registerScreenSizeBlock();
