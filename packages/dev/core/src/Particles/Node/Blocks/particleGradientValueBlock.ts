/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleGradientValueBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleGradientValueBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ParticleGradientValueBlock } from "./particleGradientValueBlock.pure";

RegisterClass("BABYLON.ParticleGradientValueBlock", ParticleGradientValueBlock);
