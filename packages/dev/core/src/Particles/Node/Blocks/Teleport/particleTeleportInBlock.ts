/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleTeleportInBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleTeleportInBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { ParticleTeleportInBlock } from "./particleTeleportInBlock.pure";

RegisterClass("BABYLON.ParticleTeleportInBlock", ParticleTeleportInBlock);
