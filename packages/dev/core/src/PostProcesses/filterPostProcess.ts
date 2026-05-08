/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import filterPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./filterPostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { FilterPostProcess } from "./filterPostProcess.pure";

RegisterClass("BABYLON.FilterPostProcess", FilterPostProcess);
