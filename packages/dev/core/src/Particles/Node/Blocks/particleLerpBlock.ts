/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleLerpBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleLerpBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ParticleLerpBlock } from "./particleLerpBlock.pure";

RegisterClass("BABYLON.ParticleLerpBlock", ParticleLerpBlock);
