/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import displayPassPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./displayPassPostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { DisplayPassPostProcess } from "./displayPassPostProcess.pure";

RegisterClass("BABYLON.DisplayPassPostProcess", DisplayPassPostProcess);
