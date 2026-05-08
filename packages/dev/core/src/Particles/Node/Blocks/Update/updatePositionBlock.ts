/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import updatePositionBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./updatePositionBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { UpdatePositionBlock } from "./updatePositionBlock.pure";

RegisterClass("BABYLON.UpdatePositionBlock", UpdatePositionBlock);
