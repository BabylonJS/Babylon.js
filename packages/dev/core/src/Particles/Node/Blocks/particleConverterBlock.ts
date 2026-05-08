/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleConverterBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleConverterBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ParticleConverterBlock } from "./particleConverterBlock.pure";

RegisterClass("BABYLON.ParticleConverterBlock", ParticleConverterBlock);
