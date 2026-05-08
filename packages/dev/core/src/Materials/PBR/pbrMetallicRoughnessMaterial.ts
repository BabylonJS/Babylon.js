/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import pbrMetallicRoughnessMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pbrMetallicRoughnessMaterial.pure";

import { RegisterClass } from "../../Misc/typeStore";
import { PBRMetallicRoughnessMaterial } from "./pbrMetallicRoughnessMaterial.pure";

RegisterClass("BABYLON.PBRMetallicRoughnessMaterial", PBRMetallicRoughnessMaterial);
