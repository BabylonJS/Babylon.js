/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleClampBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleClampBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ParticleClampBlock } from "./particleClampBlock.pure";

RegisterClass("BABYLON.ParticleClampBlock", ParticleClampBlock);
