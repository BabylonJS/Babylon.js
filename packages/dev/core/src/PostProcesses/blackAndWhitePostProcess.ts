/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import blackAndWhitePostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./blackAndWhitePostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { BlackAndWhitePostProcess } from "./blackAndWhitePostProcess.pure";

RegisterClass("BABYLON.BlackAndWhitePostProcess", BlackAndWhitePostProcess);
