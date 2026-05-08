/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleDebugBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleDebugBlock.pure";

import { registerParticleDebugBlock } from "./particleDebugBlock.pure";
registerParticleDebugBlock();
