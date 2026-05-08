/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import setMaterialIDBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setMaterialIDBlock.pure";

import { registerSetMaterialIDBlock } from "./setMaterialIDBlock.pure";
registerSetMaterialIDBlock();
