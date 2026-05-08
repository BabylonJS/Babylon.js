/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleTrigonometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleTrigonometryBlock.pure";

import { registerParticleTrigonometryBlock } from "./particleTrigonometryBlock.pure";
registerParticleTrigonometryBlock();
