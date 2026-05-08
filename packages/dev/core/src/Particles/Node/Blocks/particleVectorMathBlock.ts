/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleVectorMathBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleVectorMathBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ParticleVectorMathBlock } from "./particleVectorMathBlock.pure";

RegisterClass("BABYLON.ParticleVectorMathBlock", ParticleVectorMathBlock);
