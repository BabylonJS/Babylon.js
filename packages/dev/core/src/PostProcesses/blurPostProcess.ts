/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import blurPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./blurPostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { BlurPostProcess } from "./blurPostProcess.pure";

RegisterClass("BABYLON.BlurPostProcess", BlurPostProcess);
