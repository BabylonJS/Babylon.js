/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import shadowGeneratorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./shadowGeneratorBlock.pure";

import { RegisterShadowGeneratorBlock } from "./shadowGeneratorBlock.pure";
RegisterShadowGeneratorBlock();
