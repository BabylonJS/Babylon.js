/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import boxShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./boxShapeBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { BoxShapeBlock } from "./boxShapeBlock.pure";

RegisterClass("BABYLON.BoxShapeBlock", BoxShapeBlock);
