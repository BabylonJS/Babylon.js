/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import multiMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./multiMaterial.pure";

import { RegisterClass } from "../Misc/typeStore";
import { MultiMaterial } from "./multiMaterial.pure";

RegisterClass("BABYLON.MultiMaterial", MultiMaterial);
