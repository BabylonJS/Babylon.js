/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleVectorLengthBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleVectorLengthBlock.pure";

import { registerParticleVectorLengthBlock } from "./particleVectorLengthBlock.pure";
registerParticleVectorLengthBlock();
