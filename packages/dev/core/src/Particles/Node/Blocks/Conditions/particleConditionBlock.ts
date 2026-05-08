/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleConditionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleConditionBlock.pure";

import { RegisterParticleConditionBlock } from "./particleConditionBlock.pure";
RegisterParticleConditionBlock();
