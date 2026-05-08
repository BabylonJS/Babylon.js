/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import gaussianSplattingSolidColorMaterialPlugin.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./gaussianSplattingSolidColorMaterialPlugin.pure";

import { RegisterClass } from "../../Misc/typeStore";
import { GaussianSplattingSolidColorMaterialPlugin } from "./gaussianSplattingSolidColorMaterialPlugin.pure";

RegisterClass("BABYLON.GaussianSplattingSolidColorMaterialPlugin", GaussianSplattingSolidColorMaterialPlugin);
