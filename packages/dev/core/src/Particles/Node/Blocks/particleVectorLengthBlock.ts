/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleVectorLengthBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleVectorLengthBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ParticleVectorLengthBlock } from "./particleVectorLengthBlock.pure";

RegisterClass("BABYLON.ParticleVectorLengthBlock", ParticleVectorLengthBlock);
