/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import planeBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./planeBlock.pure";

import { RegisterClass } from "../../../../Misc/typeStore";
import { PlaneBlock } from "./planeBlock.pure";

RegisterClass("BABYLON.PlaneBlock", PlaneBlock);
