/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import computeNormalsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./computeNormalsBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { ComputeNormalsBlock } from "./computeNormalsBlock.pure";

RegisterClass("BABYLON.ComputeNormalsBlock", ComputeNormalsBlock);
