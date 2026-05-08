/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import anaglyphPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./anaglyphPostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { AnaglyphPostProcess } from "./anaglyphPostProcess.pure";

RegisterClass("BABYLON.AnaglyphPostProcess", AnaglyphPostProcess);
