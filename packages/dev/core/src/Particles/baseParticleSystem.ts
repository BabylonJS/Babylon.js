/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import baseParticleSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./baseParticleSystem.pure";

import { registerBaseParticleSystem } from "./baseParticleSystem.pure";
registerBaseParticleSystem();
