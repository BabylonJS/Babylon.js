/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleVectorMathBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleVectorMathBlock.pure";

import { registerParticleVectorMathBlock } from "./particleVectorMathBlock.pure";
registerParticleVectorMathBlock();
