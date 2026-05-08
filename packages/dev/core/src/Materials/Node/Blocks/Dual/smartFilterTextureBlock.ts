/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import smartFilterTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./smartFilterTextureBlock.pure";

import { registerSmartFilterTextureBlock } from "./smartFilterTextureBlock.pure";
registerSmartFilterTextureBlock();
