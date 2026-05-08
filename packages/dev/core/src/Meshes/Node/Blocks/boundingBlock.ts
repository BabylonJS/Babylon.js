/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import boundingBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./boundingBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { BoundingBlock } from "./boundingBlock.pure";

RegisterClass("BABYLON.BoundingBlock", BoundingBlock);
