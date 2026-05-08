/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import setNormalsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setNormalsBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { SetNormalsBlock } from "./setNormalsBlock.pure";

RegisterClass("BABYLON.SetNormalsBlock", SetNormalsBlock);
