/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleSmoothStepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleSmoothStepBlock.pure";

import { RegisterParticleSmoothStepBlock } from "./particleSmoothStepBlock.pure";
RegisterParticleSmoothStepBlock();
