/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import pbrSpecularGlossinessMaterial.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pbrSpecularGlossinessMaterial.pure";

import { RegisterClass } from "../../Misc/typeStore";
import { PBRSpecularGlossinessMaterial } from "./pbrSpecularGlossinessMaterial.pure";

RegisterClass("BABYLON.PBRSpecularGlossinessMaterial", PBRSpecularGlossinessMaterial);
