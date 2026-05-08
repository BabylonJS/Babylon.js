/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleLerpBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleLerpBlock.pure";

import { registerParticleLerpBlock } from "./particleLerpBlock.pure";
registerParticleLerpBlock();
