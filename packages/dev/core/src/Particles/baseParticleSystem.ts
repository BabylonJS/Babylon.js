/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import baseParticleSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./baseParticleSystem.pure";

import { RegisterBaseParticleSystem } from "./baseParticleSystem.pure";
RegisterBaseParticleSystem();
