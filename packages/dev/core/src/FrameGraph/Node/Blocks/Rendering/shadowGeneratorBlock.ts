/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import shadowGeneratorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./shadowGeneratorBlock.pure";

import { registerShadowGeneratorBlock } from "./shadowGeneratorBlock.pure";
registerShadowGeneratorBlock();
