/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import csmShadowGeneratorBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./csmShadowGeneratorBlock.pure";

import { registerCsmShadowGeneratorBlock } from "./csmShadowGeneratorBlock.pure";
registerCsmShadowGeneratorBlock();
