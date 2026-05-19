/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleBlendMultiplyBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleBlendMultiplyBlock.pure";

import { RegisterParticleBlendMultiplyBlock } from "./particleBlendMultiplyBlock.pure";
RegisterParticleBlendMultiplyBlock();
