/**
 * Re-exports all pure types and registers them with the serialization system.
 * Import this file (or the barrel) when you need serialization support (RegisterClass).
 * Import distanceBlock.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./distanceBlock.pure";

import { RegisterClass } from "../../../Misc/typeStore";
import { DistanceBlock } from "./distanceBlock.pure";

RegisterClass("BABYLON.DistanceBlock", DistanceBlock);
