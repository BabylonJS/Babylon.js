/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleNLerpBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleNLerpBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ParticleNLerpBlock } from "./particleNLerpBlock.pure";

RegisterClass("BABYLON.ParticleNLerpBlock", ParticleNLerpBlock);
