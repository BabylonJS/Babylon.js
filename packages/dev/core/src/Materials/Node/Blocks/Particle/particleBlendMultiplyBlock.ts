/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleBlendMultiplyBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleBlendMultiplyBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ParticleBlendMultiplyBlock } from "./particleBlendMultiplyBlock.pure";

RegisterClass("BABYLON.ParticleBlendMultiplyBlock", ParticleBlendMultiplyBlock);
