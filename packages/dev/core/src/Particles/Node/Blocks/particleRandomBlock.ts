/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleRandomBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleRandomBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { ParticleRandomBlock } from "./particleRandomBlock.pure";

RegisterClass("BABYLON.ParticleRandomBlock", ParticleRandomBlock);
