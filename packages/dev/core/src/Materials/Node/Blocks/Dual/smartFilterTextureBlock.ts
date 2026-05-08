/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import smartFilterTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./smartFilterTextureBlock.pure";

import { RegisterSmartFilterTextureBlock } from "./smartFilterTextureBlock.pure";
RegisterSmartFilterTextureBlock();
