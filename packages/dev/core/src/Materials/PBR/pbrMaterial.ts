/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import pbrMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pbrMaterial.pure";

import { RegisterClass } from "../../Misc/typeStore";
import { PBRMaterial } from "./pbrMaterial.pure";

RegisterClass("BABYLON.PBRMaterial", PBRMaterial);
