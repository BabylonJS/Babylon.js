/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleTriggerBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleTriggerBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { ParticleTriggerBlock } from "./particleTriggerBlock.pure";

RegisterClass("BABYLON.ParticleTriggerBlock", ParticleTriggerBlock);
