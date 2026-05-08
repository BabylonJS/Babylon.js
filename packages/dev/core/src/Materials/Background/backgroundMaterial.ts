/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import backgroundMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./backgroundMaterial.pure";

import { RegisterClass } from "../../Misc/typeStore";
import { BackgroundMaterial } from "./backgroundMaterial.pure";

RegisterClass("BABYLON.BackgroundMaterial", BackgroundMaterial);
