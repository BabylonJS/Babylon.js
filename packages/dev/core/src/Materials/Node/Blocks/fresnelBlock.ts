/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import fresnelBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fresnelBlock.pure";

import { RegisterFresnelBlock } from "./fresnelBlock.pure";
RegisterFresnelBlock();
