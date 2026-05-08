/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import createParticleBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./createParticleBlock.pure";

import { RegisterClass } from "core/Misc/typeStore";
import { CreateParticleBlock } from "./createParticleBlock.pure";

RegisterClass("BABYLON.CreateParticleBlock", CreateParticleBlock);
