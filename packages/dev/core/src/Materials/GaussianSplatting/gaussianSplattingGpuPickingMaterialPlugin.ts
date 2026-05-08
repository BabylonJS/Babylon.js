/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import gaussianSplattingGpuPickingMaterialPlugin.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingGpuPickingMaterialPlugin.pure";

import { RegisterClass } from "../../Misc/typeStore";
import { GaussianSplattingGpuPickingMaterialPlugin } from "./gaussianSplattingGpuPickingMaterialPlugin.pure";

RegisterClass("BABYLON.GaussianSplattingGpuPickingMaterialPlugin", GaussianSplattingGpuPickingMaterialPlugin);
