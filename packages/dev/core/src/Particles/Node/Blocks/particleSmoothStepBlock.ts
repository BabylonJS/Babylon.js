/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleSmoothStepBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleSmoothStepBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ParticleSmoothStepBlock } from "./particleSmoothStepBlock.pure";

RegisterClass("BABYLON.ParticleSmoothStepBlock", ParticleSmoothStepBlock);
