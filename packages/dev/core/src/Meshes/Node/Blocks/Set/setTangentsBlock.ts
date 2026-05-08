/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import setTangentsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./setTangentsBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { SetTangentsBlock } from "./setTangentsBlock.pure";

RegisterClass("BABYLON.SetTangentsBlock", SetTangentsBlock);
