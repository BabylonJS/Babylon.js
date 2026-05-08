/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import depthOfFieldBlurPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./depthOfFieldBlurPostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { DepthOfFieldBlurPostProcess } from "./depthOfFieldBlurPostProcess.pure";

RegisterClass("BABYLON.DepthOfFieldBlurPostProcess", DepthOfFieldBlurPostProcess);
