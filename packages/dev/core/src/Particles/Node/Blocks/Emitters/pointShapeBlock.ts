/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import pointShapeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pointShapeBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { PointShapeBlock } from "./pointShapeBlock.pure";

RegisterClass("BABYLON.PointShapeBlock", PointShapeBlock);
