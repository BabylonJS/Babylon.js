/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleTeleportOutBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleTeleportOutBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ParticleTeleportOutBlock } from "./particleTeleportOutBlock.pure";

RegisterClass("BABYLON.ParticleTeleportOutBlock", ParticleTeleportOutBlock);
