/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import convolutionPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./convolutionPostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { ConvolutionPostProcess } from "./convolutionPostProcess.pure";

RegisterClass("BABYLON.ConvolutionPostProcess", ConvolutionPostProcess);
