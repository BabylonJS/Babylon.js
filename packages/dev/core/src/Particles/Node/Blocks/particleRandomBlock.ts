/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleRandomBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleRandomBlock.pure";

import { registerParticleRandomBlock } from "./particleRandomBlock.pure";
registerParticleRandomBlock();
