/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import webgl2ParticleSystem.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./webgl2ParticleSystem.pure";

import "../Shaders/gpuUpdateParticles.fragment";
import "../Shaders/gpuUpdateParticles.vertex";

import { RegisterWebgl2ParticleSystem } from "./webgl2ParticleSystem.pure";
RegisterWebgl2ParticleSystem();
