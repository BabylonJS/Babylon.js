/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleFloatToIntBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleFloatToIntBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { ParticleFloatToIntBlock } from "./particleFloatToIntBlock.pure";

RegisterClass("BABYLON.ParticleFloatToIntBlock", ParticleFloatToIntBlock);
