/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleVectorMathBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleVectorMathBlock.pure";

import { RegisterParticleVectorMathBlock } from "./particleVectorMathBlock.pure";
RegisterParticleVectorMathBlock();
