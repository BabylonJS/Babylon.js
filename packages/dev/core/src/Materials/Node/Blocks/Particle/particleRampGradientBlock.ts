/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleRampGradientBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleRampGradientBlock.pure";

import { registerParticleRampGradientBlock } from "./particleRampGradientBlock.pure";
registerParticleRampGradientBlock();
