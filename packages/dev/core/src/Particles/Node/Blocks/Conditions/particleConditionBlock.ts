/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleConditionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleConditionBlock.pure";

import { registerParticleConditionBlock } from "./particleConditionBlock.pure";
registerParticleConditionBlock();
