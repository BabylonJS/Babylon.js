/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import basicPositionUpdateBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./basicPositionUpdateBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { BasicPositionUpdateBlock } from "./basicPositionUpdateBlock.pure";

RegisterClass("BABYLON.BasicPositionUpdateBlock", BasicPositionUpdateBlock);
