/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleFloatToIntBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleFloatToIntBlock.pure";

import { registerParticleFloatToIntBlock } from "./particleFloatToIntBlock.pure";
registerParticleFloatToIntBlock();
