/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleStepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleStepBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ParticleStepBlock } from "./particleStepBlock.pure";

RegisterClass("BABYLON.ParticleStepBlock", ParticleStepBlock);
