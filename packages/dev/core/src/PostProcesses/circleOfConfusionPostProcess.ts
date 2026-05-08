/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import circleOfConfusionPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./circleOfConfusionPostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { CircleOfConfusionPostProcess } from "./circleOfConfusionPostProcess.pure";

RegisterClass("BABYLON.CircleOfConfusionPostProcess", CircleOfConfusionPostProcess);
