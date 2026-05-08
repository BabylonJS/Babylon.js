/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import setMaterialIDBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setMaterialIDBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { SetMaterialIDBlock } from "./setMaterialIDBlock.pure";

RegisterClass("BABYLON.SetMaterialIDBlock", SetMaterialIDBlock);
