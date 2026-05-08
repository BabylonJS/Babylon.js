/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import particleSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleSystem.pure";

import { registerParticleSystem } from "./particleSystem.pure";
registerParticleSystem();
