/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import particleTrigonometryBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./particleTrigonometryBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ParticleTrigonometryBlock } from "./particleTrigonometryBlock.pure";

RegisterClass("BABYLON.ParticleTrigonometryBlock", ParticleTrigonometryBlock);
