/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleElbowBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleElbowBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ParticleElbowBlock } from "./particleElbowBlock.pure";

RegisterClass("BABYLON.ParticleElbowBlock", ParticleElbowBlock);
