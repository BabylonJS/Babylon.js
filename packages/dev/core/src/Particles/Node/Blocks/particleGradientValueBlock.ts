/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleGradientValueBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleGradientValueBlock.pure";

import { RegisterParticleGradientValueBlock } from "./particleGradientValueBlock.pure";
RegisterParticleGradientValueBlock();
