/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleStepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleStepBlock.pure";

import { registerParticleStepBlock } from "./particleStepBlock.pure";
registerParticleStepBlock();
