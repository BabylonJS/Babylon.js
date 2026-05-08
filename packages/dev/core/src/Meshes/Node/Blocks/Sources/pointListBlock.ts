/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import pointListBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./pointListBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { PointListBlock } from "./pointListBlock.pure";

RegisterClass("BABYLON.PointListBlock", PointListBlock);
