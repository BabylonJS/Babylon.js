/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleLocalVariableBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleLocalVariableBlock.pure";

import { registerParticleLocalVariableBlock } from "./particleLocalVariableBlock.pure";
registerParticleLocalVariableBlock();
