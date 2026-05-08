/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import morphTargetsBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./morphTargetsBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { MorphTargetsBlock } from "./morphTargetsBlock.pure";

RegisterClass("BABYLON.MorphTargetsBlock", MorphTargetsBlock);
