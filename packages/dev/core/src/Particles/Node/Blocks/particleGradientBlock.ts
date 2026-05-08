/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleGradientBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleGradientBlock.pure";

import { registerParticleGradientBlock } from "./particleGradientBlock.pure";
registerParticleGradientBlock();
