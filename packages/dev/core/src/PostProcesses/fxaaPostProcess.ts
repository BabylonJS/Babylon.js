/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import fxaaPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./fxaaPostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { FxaaPostProcess } from "./fxaaPostProcess.pure";

RegisterClass("BABYLON.FxaaPostProcess", FxaaPostProcess);
