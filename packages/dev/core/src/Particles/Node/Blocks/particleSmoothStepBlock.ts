/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleSmoothStepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleSmoothStepBlock.pure";

import { registerParticleSmoothStepBlock } from "./particleSmoothStepBlock.pure";
registerParticleSmoothStepBlock();
