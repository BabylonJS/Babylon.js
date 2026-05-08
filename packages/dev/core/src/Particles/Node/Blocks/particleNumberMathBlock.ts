/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleNumberMathBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleNumberMathBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ParticleNumberMathBlock } from "./particleNumberMathBlock.pure";

RegisterClass("BABYLON.ParticleNumberMathBlock", ParticleNumberMathBlock);
