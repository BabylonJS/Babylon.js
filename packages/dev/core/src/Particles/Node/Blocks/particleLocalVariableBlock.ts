/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleLocalVariableBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleLocalVariableBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ParticleLocalVariableBlock } from "./particleLocalVariableBlock.pure";

RegisterClass("BABYLON.ParticleLocalVariableBlock", ParticleLocalVariableBlock);
