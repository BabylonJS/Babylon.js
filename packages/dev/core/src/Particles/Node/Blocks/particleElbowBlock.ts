/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleElbowBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleElbowBlock.pure";

import { registerParticleElbowBlock } from "./particleElbowBlock.pure";
registerParticleElbowBlock();
