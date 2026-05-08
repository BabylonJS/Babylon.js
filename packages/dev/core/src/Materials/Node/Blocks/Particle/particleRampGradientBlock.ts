/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleRampGradientBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleRampGradientBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ParticleRampGradientBlock } from "./particleRampGradientBlock.pure";

RegisterClass("BABYLON.ParticleRampGradientBlock", ParticleRampGradientBlock);
