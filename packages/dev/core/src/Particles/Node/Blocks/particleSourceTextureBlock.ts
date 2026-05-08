/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleSourceTextureBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleSourceTextureBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ParticleTextureSourceBlock } from "./particleSourceTextureBlock.pure";

RegisterClass("BABYLON.ParticleTextureSourceBlock", ParticleTextureSourceBlock);
