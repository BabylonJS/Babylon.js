/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import grainPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./grainPostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { GrainPostProcess } from "./grainPostProcess.pure";

RegisterClass("BABYLON.GrainPostProcess", GrainPostProcess);
