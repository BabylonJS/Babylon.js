/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleTextureBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ParticleTextureBlock } from "./particleTextureBlock.pure";

RegisterClass("BABYLON.ParticleTextureBlock", ParticleTextureBlock);
