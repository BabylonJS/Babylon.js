/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webgl2ParticleSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webgl2ParticleSystem.pure";

import { registerWebgl2ParticleSystem } from "./webgl2ParticleSystem.pure";
registerWebgl2ParticleSystem();
