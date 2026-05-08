/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleGradientBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleGradientBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ParticleGradientBlock } from "./particleGradientBlock.pure";

RegisterClass("BABYLON.ParticleGradientBlock", ParticleGradientBlock);
