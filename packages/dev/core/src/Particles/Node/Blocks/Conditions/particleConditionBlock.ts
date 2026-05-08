/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleConditionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleConditionBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ParticleConditionBlock } from "./particleConditionBlock.pure";

RegisterClass("BABYLON.ParticleConditionBlock", ParticleConditionBlock);
