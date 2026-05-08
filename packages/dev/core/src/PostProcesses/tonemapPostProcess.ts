/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import tonemapPostProcess.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./tonemapPostProcess.pure";

import { RegisterClass } from "../Misc/typeStore";
import { TonemapPostProcess } from "./tonemapPostProcess.pure";

RegisterClass("BABYLON.TonemapPostProcess", TonemapPostProcess);
