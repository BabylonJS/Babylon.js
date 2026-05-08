/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleTriggerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleTriggerBlock.pure";

import { registerParticleTriggerBlock } from "./particleTriggerBlock.pure";
registerParticleTriggerBlock();
