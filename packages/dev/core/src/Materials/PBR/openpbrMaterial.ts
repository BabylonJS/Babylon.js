/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import openpbrMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./openpbrMaterial.pure";

import { RegisterClass } from "../../Misc/typeStore";
import { OpenPBRMaterial } from "./openpbrMaterial.pure";

RegisterClass("BABYLON.OpenPBRMaterial", OpenPBRMaterial);
